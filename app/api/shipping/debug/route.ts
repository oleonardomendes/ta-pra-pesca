import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('melhor_envio_tokens')
    .select('*')
    .eq('id', 1)
    .single()

  return Response.json({
    temToken: !!data?.access_token,
    tokenInicio: data?.access_token ? data.access_token.slice(0, 20) + '...' : null,
    expiresAt: data?.expires_at,
    erro: error?.message,
    baseUrl: process.env.MELHOR_ENVIO_BASE_URL,
    originCep: process.env.MELHOR_ENVIO_ORIGIN_CEP,
  })
}
