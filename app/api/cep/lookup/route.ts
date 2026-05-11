export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cep = searchParams.get('cep')?.replace(/\D/g, '')

  if (!cep || cep.length !== 8) {
    return Response.json({ error: 'CEP inválido' }, { status: 400 })
  }

  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
  const data = await res.json()

  if (data.erro) {
    return Response.json({ error: 'CEP não encontrado' }, { status: 404 })
  }

  return Response.json({
    cep: data.cep,
    logradouro: data.logradouro,
    bairro: data.bairro,
    cidade: data.localidade,
    estado: data.uf,
  })
}
