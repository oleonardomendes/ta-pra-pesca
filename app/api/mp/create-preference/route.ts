import { MercadoPagoConfig, Preference } from 'mercadopago'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const accessToken = process.env.NEXT_PUBLIC_MP_ENV === 'test'
  ? process.env.MP_ACCESS_TOKEN_TEST!
  : process.env.MP_ACCESS_TOKEN!

const client = new MercadoPagoConfig({ accessToken })

export async function POST(req: Request) {
  try {
    const { kitId, kitNome, kitPreco, backUrls, items: cartItems } = await req.json()

    const mpItems = cartItems
      ? cartItems.map((i: { id: number; nome: string; preco: number; quantidade: number }) => ({
          id: String(i.id),
          title: i.nome,
          quantity: i.quantidade,
          unit_price: Number(i.preco),
          currency_id: 'BRL',
        }))
      : [{
          id: String(kitId),
          title: kitNome,
          quantity: 1,
          unit_price: Number(kitPreco),
          currency_id: 'BRL',
        }]

    const userId = req.headers.get('x-user-id') || null

    const preference = new Preference(client)
    const result = await preference.create({
      body: {
        items: mpItems,
        metadata: {
          user_id: userId,
        },
        back_urls: backUrls ?? {
          success: 'https://taprapesca.com.br/kits/obrigado',
          failure: 'https://taprapesca.com.br/kits',
          pending: 'https://taprapesca.com.br/kits/obrigado',
        },
        payment_methods: {
          excluded_payment_types: [],
          installments: 12,
          default_installments: 1,
        },
        auto_return: 'approved',
        statement_descriptor: 'TA PRA PESCA',
      }
    })

    return NextResponse.json({ preferenceId: result.id })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    )
  }
}
