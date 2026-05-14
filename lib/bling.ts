import { supabase } from './supabase'

const BLING_BASE = 'https://api.bling.com.br/Api/v3'
const BLING_TOKEN_URL = 'https://api.bling.com.br/Api/v3/oauth/token'

let cachedAccessToken: string | null = null
let cachedRefreshToken: string | null = null

async function loadTokensFromSupabase(): Promise<{
  access_token: string
  refresh_token: string
} | null> {
  const { data, error } = await supabase
    .from('bling_tokens')
    .select('access_token, refresh_token')
    .eq('id', 1)
    .single()
  if (error) {
    console.warn('[bling] Supabase loadTokens erro:', error.message)
    return null
  }
  return data
}

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
  cachedAccessToken = access_token
  cachedRefreshToken = refresh_token
}

async function getBlingToken(): Promise<string> {
  if (cachedAccessToken) return cachedAccessToken
  const tokens = await loadTokensFromSupabase()
  if (tokens) {
    cachedAccessToken = tokens.access_token
    cachedRefreshToken = tokens.refresh_token
    return cachedAccessToken
  }
  return process.env.BLING_ACCESS_TOKEN ?? ''
}

async function getRefreshToken(): Promise<string> {
  if (cachedRefreshToken) return cachedRefreshToken
  const tokens = await loadTokensFromSupabase()
  if (tokens) {
    cachedRefreshToken = tokens.refresh_token
    return cachedRefreshToken
  }
  return process.env.BLING_REFRESH_TOKEN ?? ''
}

export async function refreshBlingToken(): Promise<string> {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) {
    throw new Error('Refresh token não encontrado — acesse /api/bling/auth para reautorizar')
  }

  const credentials = btoa(
    `${process.env.BLING_CLIENT_ID}:${process.env.BLING_CLIENT_SECRET}`
  )

  const res = await fetch(BLING_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  })

  if (!res.ok) {
    const detail = await res.text()
    console.error('[bling] ⚠️  REFRESH FALHOU — acesse /api/bling/auth para reautorizar')
    throw new Error(`Bling refresh falhou (${res.status}): ${detail}`)
  }

  const data = await res.json()
  await saveTokensToSupabase(data.access_token, data.refresh_token)
  return data.access_token
}

export async function blingFetch(
  endpoint: string,
  options?: RequestInit
): Promise<any> {
  const token = await getBlingToken()

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
    console.log('[bling] token expirado, renovando...')
    const newToken = await refreshBlingToken()
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
