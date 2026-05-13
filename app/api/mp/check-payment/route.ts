import { MercadoPagoConfig, Payment } from 'mercadopago'

export const dynamic = 'force-dynamic'

const client = new MercadoPagoConfig({
  accessToken: process.env.NEXT_PUBLIC_MP_ENV === 'test'
    ? process.env.MP_ACCESS_TOKEN_TEST!
    : process.env.MP_ACCESS_TOKEN!,
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'ID obrigatório' }, { status: 400 })

  try {
    const payment = new Payment(client)
    const data = await payment.get({ id: Number(id) })
    return Response.json({ status: data.status })
  } catch {
    return Response.json({ status: 'unknown' })
  }
}
