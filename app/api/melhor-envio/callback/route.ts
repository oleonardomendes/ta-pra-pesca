import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'Código não encontrado' }, { status: 400 })
  }

  try {
    const credentials = {
      grant_type: 'authorization_code',
      client_id: process.env.MELHOR_ENVIO_CLIENT_ID!,
      client_secret: process.env.MELHOR_ENVIO_CLIENT_SECRET!,
      redirect_uri: 'https://taprapesca.com.br/api/melhor-envio/callback',
      code,
    }

    const tokenUrl = process.env.MELHOR_ENVIO_BASE_URL
      ?.replace('/api/v2', '/oauth/token')
      || 'https://melhorenvio.com.br/oauth/token'

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'TaPraPesca (contato@taprapesca.com.br)',
      },
      body: JSON.stringify(credentials),
    })

    const data = await res.json()

    if (!data.access_token) {
      return NextResponse.json({ error: 'Token não gerado', detail: data }, { status: 500 })
    }

    // Salva tokens no Supabase
    await supabase.from('melhor_envio_tokens').upsert({
      id: 1,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })

    // Exibe tokens na tela para confirmar
    return new NextResponse(`
      <html><body style="font-family:sans-serif;padding:40px;max-width:600px">
        <h2 style="color:#0F5C45">✅ Melhor Envio autorizado!</h2>
        <p>Tokens salvos no Supabase com sucesso.</p>
        <p><strong>Access Token:</strong><br>
        <code style="word-break:break-all;font-size:12px">${data.access_token}</code></p>
        <p><strong>Refresh Token:</strong><br>
        <code style="word-break:break-all;font-size:12px">${data.refresh_token}</code></p>
        <p><a href="/">Voltar para o site</a></p>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' } })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
