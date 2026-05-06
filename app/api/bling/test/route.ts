export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  const token = process.env.BLING_ACCESS_TOKEN

  if (!token) {
    return Response.json({ erro: 'BLING_ACCESS_TOKEN não encontrado' })
  }

  try {
    const res = await fetch('https://api.bling.com.br/Api/v3/produtos?limite=5', {
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    })

    const texto = await res.text()

    return Response.json({
      status: res.status,
      tokenTamanho: token.length,
      tokenInicio: token.substring(0, 15) + '...',
      respostaPreview: texto.substring(0, 800),
    })
  } catch (e: any) {
    return Response.json({
      erro: e.message,
      tipo: e.constructor.name
    })
  }
}
