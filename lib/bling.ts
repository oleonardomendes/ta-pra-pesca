import { supabase } from './supabase'

const BLING_BASE = 'https://api.bling.com.br/Api/v3'

// Lock global para evitar refresh simultâneo
let isRefreshing = false
let refreshPromise: Promise<string> | null = null

export async function saveTokensToSupabase(
  access_token: string,
  refresh_token: string
): Promise<void> {
  const { error } = await supabase.from('bling_tokens').upsert({
    id: 1,
    access_token,
    refresh_token,
    updated_at: new Date().toISOString(),
  })
  if (error) {
    console.error('[bling] Supabase saveTokens erro:', error.message)
  } else {
    console.log('[bling] tokens salvos no Supabase com sucesso')
  }
}

const getValidToken = async (): Promise<string> => {
  const { data } = await supabase
    .from('bling_tokens')
    .select('access_token, refresh_token, updated_at')
    .eq('id', 1)
    .single()

  if (!data) throw new Error('Tokens Bling não encontrados')

  // Verifica se o token ainda é válido
  try {
    const payload = JSON.parse(
      Buffer.from(data.access_token.split('.')[1], 'base64').toString()
    )
    const expiraEm = payload.exp * 1000
    const agora = Date.now()
    const margemSeguranca = 5 * 60 * 1000 // 5 minutos

    if (expiraEm - agora > margemSeguranca) {
      return data.access_token
    }
  } catch {}

  // Token expirado — verifica se já tem refresh em andamento
  if (isRefreshing && refreshPromise) {
    console.log('[bling] aguardando refresh em andamento...')
    return refreshPromise
  }

  // Inicia refresh com lock
  isRefreshing = true
  refreshPromise = (async () => {
    try {
      console.log('[bling] token expirado, renovando...')

      // Relê o token do Supabase (pode ter sido renovado por outra instância)
      const { data: tokenAtual } = await supabase
        .from('bling_tokens')
        .select('access_token, refresh_token, updated_at')
        .eq('id', 1)
        .single()

      // Verifica se outra instância já renovou
      if (tokenAtual) {
        try {
          const payload = JSON.parse(
            Buffer.from(tokenAtual.access_token.split('.')[1], 'base64').toString()
          )
          if ((payload.exp * 1000) - Date.now() > 5 * 60 * 1000) {
            console.log('[bling] token já renovado por outra instância')
            return tokenAtual.access_token
          }
        } catch {}
      }

      const res = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${process.env.BLING_CLIENT_ID}:${process.env.BLING_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokenAtual?.refresh_token || '',
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        console.error('[bling] ⚠️  REFRESH FALHOU — acesse /api/bling/auth para reautorizar')
        throw new Error(`Bling refresh falhou (${res.status}): ${err}`)
      }

      const tokens = await res.json()

      await supabase.from('bling_tokens').upsert({
        id: 1,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        updated_at: new Date().toISOString(),
      })

      console.log('[bling] token renovado com sucesso')
      return tokens.access_token as string

    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function blingFetch(
  endpoint: string,
  options?: RequestInit
): Promise<any> {
  const token = await getValidToken()

  const makeRequest = (accessToken: string) =>
    fetch(`${BLING_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        ...(options?.headers ?? {}),
      },
      signal: AbortSignal.timeout(10000),
    })

  let res = await makeRequest(token)

  if (res.status === 401) {
    // Força refresh ignorando o cache de validade
    isRefreshing = false
    refreshPromise = null
    const newToken = await getValidToken()
    res = await makeRequest(newToken)
  }

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Bling API error (${res.status}): ${detail}`)
  }

  const text = await res.text()
  if (!text || text.trim() === '') {
    return { ok: true }
  }
  try {
    return JSON.parse(text)
  } catch {
    return { ok: true, raw: text }
  }
}
