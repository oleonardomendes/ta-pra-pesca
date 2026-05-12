import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  console.log('[ME callback] iniciando com code:', code?.slice(0, 30))

  if (!code) {
    return NextResponse.json({ error: 'Código não encontrado' }, { status: 400 })
  }

  const clientId = process.env.MELHOR_ENVIO_CLIENT_ID!
  const clientSecret = process.env.MELHOR_ENVIO_CLIENT_SECRET!
  const redirectUri = 'https://taprapesca.com.br/api/melhor-envio/callback'
  const tokenUrl = 'https://www.melhorenvio.com.br/oauth/token'

  console.log('[ME callback] usando:', {
    clientId,
    clientSecretInicio: clientSecret?.slice(0, 10),
    redirectUri,
    tokenUrl,
  })

  try {
    const bodyParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code: code,
    })

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
        'User-Agent': 'TaPraPesca (contato@taprapesca.com.br)',
      },
      body: bodyParams.toString(),
    })

    const responseText = await res.text()
    console.log('[ME callback] resposta status:', res.status)
    console.log('[ME callback] resposta body:', responseText)

    let data: any
    try {
      data = JSON.parse(responseText)
    } catch {
      return NextResponse.json(
        { error: 'Resposta inválida do Melhor Envio', detail: responseText },
        { status: 500 }
      )
    }

    if (!data.access_token) {
      return NextResponse.json(
        { error: 'Token não gerado', detail: data },
        { status: 500 }
      )
    }

    await supabase.from('melhor_envio_tokens').upsert({
      id: 1,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })

    console.log('[ME callback] tokens salvos com sucesso!')

    return new NextResponse(`
      <html><body style="font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto">
        <div style="background:#E8F7F2;border-radius:12px;padding:32px;text-align:center">
          <div style="font-size:48px;margin-bottom:16px">✅</div>
          <h2 style="color:#0F5C45;margin-bottom:8px">Melhor Envio autorizado!</h2>
          <p style="color:#5C6B63">Tokens salvos com sucesso.</p>
          <a href="/" style="display:inline-block;margin-top:24px;background:#0F5C45;
            color:#fff;padding:12px 28px;border-radius:50px;text-decoration:none;
            font-weight:700">Voltar para o site</a>
        </div>
      </body></html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    })

  } catch (e: any) {
    console.error('[ME callback] erro:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
