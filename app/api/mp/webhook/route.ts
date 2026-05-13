import { supabase } from '@/lib/supabase'
import { blingFetch } from '@/lib/bling'
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

      const externalRef = data.external_reference || null

      if (externalRef) {
        const { error } = await supabase
          .from('pedidos')
          .update({
            status: 'aprovado',
            mp_payment_id: String(paymentId),
            updated_at: new Date().toISOString(),
          })
          .eq('id', externalRef)
        console.log('[webhook] pedido atualizado:', externalRef, error)
      } else {
        await supabase.from('pedidos').insert({
          user_id: userId,
          mp_payment_id: String(paymentId),
          status: 'aprovado',
          total: data.transaction_amount || 0,
          itens,
        })
        console.log('[webhook] pedido criado via fallback (sem external_reference)')
      }

      // Busca dados completos para enviar ao Bling
      const { data: pedidoCompleto } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', externalRef || '')
        .single()

      if (pedidoCompleto) {
        try {
          await blingFetch('/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              numero: pedidoCompleto.mp_payment_id,
              contato: {
                nome: data.payer?.first_name
                  ? `${data.payer.first_name} ${data.payer.last_name || ''}`.trim()
                  : data.payer?.email || 'Cliente',
                email: data.payer?.email,
                documento: {
                  tipo: 'CPF',
                  numero: pedidoCompleto.cpf?.replace(/\D/g, '') || '',
                },
              },
              transporte: {
                transportadora: { nome: pedidoCompleto.frete_servico || 'Correios' },
                fretePorConta: 'D',
                frete: Number(pedidoCompleto.frete_valor) || 0,
                volumes: [{ servico: pedidoCompleto.frete_servico || '' }],
              },
              enderecoEntrega: pedidoCompleto.endereco ? {
                endereco: pedidoCompleto.endereco.logradouro,
                numero: pedidoCompleto.endereco.numero,
                complemento: pedidoCompleto.endereco.complemento || '',
                bairro: pedidoCompleto.endereco.bairro,
                municipio: pedidoCompleto.endereco.cidade,
                uf: pedidoCompleto.endereco.estado,
                cep: pedidoCompleto.endereco.cep?.replace(/\D/g, '') || '',
              } : undefined,
              itens: (JSON.parse(JSON.stringify(pedidoCompleto.itens)) || [])
                .map((item: any) => ({
                  descricao: item.nome,
                  quantidade: item.quantidade || 1,
                  valor: item.valor,
                })),
              total: Number(pedidoCompleto.total),
            }),
          })
          console.log('[webhook] pedido enviado ao Bling!')
        } catch (blingError: any) {
          console.error('[webhook] erro Bling:', blingError.message)
        }
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
