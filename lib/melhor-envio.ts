import { supabase } from './supabase'

const BASE_URL = process.env.MELHOR_ENVIO_BASE_URL ||
  'https://melhorenvio.com.br/api/v2'

async function getMEToken(): Promise<string> {
  const { data } = await supabase
    .from('melhor_envio_tokens')
    .select('access_token, expires_at')
    .eq('id', 1)
    .single()

  if (!data?.access_token) throw new Error('Token Melhor Envio não configurado')
  return data.access_token
}

export async function calcularFrete(params: {
  cepDestino: string
  produtos: Array<{
    id: string
    nome: string
    peso: number
    altura: number
    largura: number
    comprimento: number
    valor: number
    quantidade: number
  }>
}) {
  const token = await getMEToken()
  const originCep = process.env.MELHOR_ENVIO_ORIGIN_CEP!

  const body = {
    from: { postal_code: originCep.replace(/\D/g, '') },
    to: { postal_code: params.cepDestino.replace(/\D/g, '') },
    products: params.produtos.map(p => ({
      id: p.id,
      width: p.largura,
      height: p.altura,
      length: p.comprimento,
      weight: p.peso,
      insurance_value: p.valor,
      quantity: p.quantidade,
    })),
    options: {
      receipt: false,
      own_hand: false,
      insurance_value: params.produtos.reduce(
        (acc, p) => acc + p.valor * p.quantidade, 0
      ),
    },
    services: '1,2,3,4', // PAC, SEDEX e outros
  }

  const res = await fetch(`${BASE_URL}/me/shipment/calculate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'TaPraPesca (contato@taprapesca.com.br)',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Melhor Envio error: ${err}`)
  }

  const data = await res.json()

  // Filtra serviços com erro e retorna apenas os válidos
  return data
    .filter((s: any) => !s.error && s.price)
    .map((s: any) => ({
      id: s.id,
      nome: s.name,
      empresa: s.company?.name || '',
      preco: Number(s.price),
      prazo: s.delivery_time,
      logo: s.company?.picture || '',
    }))
    .sort((a: any, b: any) => a.preco - b.preco)
}

export async function melhorEnvioFetch(
  endpoint: string,
  options?: RequestInit
): Promise<any> {
  const token = await getMEToken()

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'TaPraPesca (contato@taprapesca.com.br)',
      ...(options?.headers ?? {}),
    },
  })

  const text = await res.text()
  if (!text || text.trim() === '') return { ok: true }

  let parsed: any
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: true, raw: text }
  }

  if (!res.ok) {
    throw new Error(`ME API error (${res.status}): ${text}`)
  }

  return parsed
}
