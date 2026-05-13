import { supabase } from '@/lib/supabase'
import { MercadoPagoConfig, Payment } from 'mercadopago'

export const dynamic = 'force-dynamic'

const client = new MercadoPagoConfig({
  accessToken: process.env.NEXT_PUBLIC_MP_ENV === 'test'
    ? process.env.MP_ACCESS_TOKEN_TEST!
    : process.env.MP_ACCESS_TOKEN!
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[webhook] recebido:', JSON.stringify(body))

    const isPaymentEvent =
      body.type === 'payment' ||
      body.action === 'payment.updated' ||
      body.action === 'payment.created'

    if (!isPaymentEvent) {
      return Response.json({ ok: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) return Response.json({ ok: true })

    try {
      const payment = new Payment(client)
      const data = await payment.get({ id: paymentId })

      if (!data || data.status !== 'approved') {
        console.log('[webhook] pagamento não aprovado ou não encontrado:', paymentId)
        return Response.json({ ok: true, skipped: true })
      }

      // Busca pedido existente pelo mp_payment_id
      const { data: pedidoExistente } = await supabase
        .from('pedidos')
        .select('id')
        .eq('mp_payment_id', String(paymentId))
        .single()

      if (pedidoExistente) {
        await supabase
          .from('pedidos')
          .update({ status: 'aprovado', updated_at: new Date().toISOString() })
          .eq('id', pedidoExistente.id)
      } else {
        const userId = data.metadata?.user_id || null
        await supabase.from('pedidos').insert({
          user_id: userId,
          mp_payment_id: String(paymentId),
          mp_preference_id: data.order?.id ? String(data.order.id) : null,
          status: 'aprovado',
          total: data.transaction_amount || 0,
          itens: data.additional_info?.items || [],
        })
      }

      return Response.json({ ok: true })
    } catch (e: any) {
      console.log('[webhook] payment_id não encontrado:', paymentId, e.message)
      return Response.json({ ok: true, skipped: true })
    }
  } catch (e: any) {
    console.error('[webhook] erro ao parsear body:', e.message)
    return Response.json({ ok: true, skipped: true })
  }
}
