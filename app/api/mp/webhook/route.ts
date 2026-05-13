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

      const userId = data.metadata?.user_id || null
      console.log('[webhook] user_id:', userId)

      const itens = (data.additional_info?.items || []).map((item: any) => ({
        id: item.id,
        nome: item.title,
        quantidade: Number(item.quantity) || 1,
        valor: Number(item.unit_price) || 0,
      }))
      console.log('[webhook] itens:', itens)

      // Tenta encontrar pré-registro pelo mp_payment_id (reentrada)
      const { data: pedidoPorPayment } = await supabase
        .from('pedidos')
        .select('id')
        .eq('mp_payment_id', String(paymentId))
        .maybeSingle()

      if (pedidoPorPayment) {
        await supabase
          .from('pedidos')
          .update({ status: 'aprovado', updated_at: new Date().toISOString() })
          .eq('id', pedidoPorPayment.id)
        console.log('[webhook] pedido já existia, status atualizado:', pedidoPorPayment.id)
        return Response.json({ ok: true })
      }

      // Tenta encontrar pré-registro pela mp_preference_id (merchant order)
      const mpPreferenceId = data.order?.id ? String(data.order.id) : null
      const { data: pedidoPorPreferencia } = await supabase
        .from('pedidos')
        .select('id, itens, endereco, cpf')
        .eq('mp_preference_id', mpPreferenceId)
        .maybeSingle()

      if (pedidoPorPreferencia) {
        await supabase
          .from('pedidos')
          .update({
            status: 'aprovado',
            mp_payment_id: String(paymentId),
            updated_at: new Date().toISOString(),
          })
          .eq('id', pedidoPorPreferencia.id)
        console.log('[webhook] pré-registro atualizado:', pedidoPorPreferencia.id)
      } else {
        // Fallback: cria pedido com dados disponíveis
        await supabase.from('pedidos').insert({
          user_id: userId,
          mp_payment_id: String(paymentId),
          mp_preference_id: mpPreferenceId,
          status: 'aprovado',
          total: data.transaction_amount || 0,
          itens,
        })
        console.log('[webhook] pedido criado via fallback')
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
