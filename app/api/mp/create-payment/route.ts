import { MercadoPagoConfig, Payment } from 'mercadopago'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const client = new MercadoPagoConfig({
  accessToken: process.env.NEXT_PUBLIC_MP_ENV === 'test'
    ? process.env.MP_ACCESS_TOKEN_TEST!
    : process.env.MP_ACCESS_TOKEN!,
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { formData, amount, description, pedidoId } = body

    const payment = new Payment(client)
    const result = await payment.create({
      body: {
        transaction_amount: Number(amount),
        description,
        payment_method_id: 'pix',
        external_reference: pedidoId || '',
        payer: {
          email: formData?.payer?.email || 'pix@taprapesca.com.br',
        },
        notification_url: 'https://www.taprapesca.com.br/api/mp/webhook',
      },
    })

    return NextResponse.json({
      id: result.id,
      status: result.status,
      qrCode: result.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      ticketUrl: result.point_of_interaction?.transaction_data?.ticket_url,
    })
  } catch (e: any) {
    console.error('[create-payment] erro:', {
      message: e.message,
      status: e.status,
      cause: e.cause,
      env: process.env.NEXT_PUBLIC_MP_ENV,
      temToken: !!process.env.MP_ACCESS_TOKEN_TEST,
    })
    return Response.json({
      error: e.message,
      detail: e.cause || null,
    }, { status: 500 })
  }
}
