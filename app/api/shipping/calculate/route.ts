import { calcularFrete } from '@/lib/melhor-envio'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { cepDestino, produtos } = await req.json()

    if (!cepDestino) {
      return Response.json({ error: 'CEP obrigatório' }, { status: 400 })
    }

    const opcoes = await calcularFrete({ cepDestino, produtos })
    return Response.json({ opcoes })
  } catch (e: any) {
    console.error('[shipping]', e.message)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
