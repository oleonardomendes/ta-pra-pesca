import crypto from 'crypto'
import { supabase } from '@/lib/supabase'
import { blingFetch } from '@/lib/bling'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const signature = req.headers.get('x-me-signature')
  const body = await req.text()

  // Valida assinatura HMAC-SHA256
  const expectedHash = crypto
    .createHmac('sha256', process.env.MELHOR_ENVIO_CLIENT_SECRET!)
    .update(body)
    .digest('base64')

  if (signature !== expectedHash) {
    console.error('[me-webhook] assinatura inválida')
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const evento = JSON.parse(body)
  console.log('[me-webhook] evento:', evento.event, evento.data?.id)

  const meCarrinhoId = evento.data?.id
  const tracking = evento.data?.tracking
  const status = evento.data?.status

  if (!meCarrinhoId) return Response.json({ ok: true })

  // Busca o pedido pelo ME carrinho ID
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('id, bling_pedido_id')
    .eq('me_carrinho_id', meCarrinhoId)
    .single()

  if (!pedido) {
    console.log('[me-webhook] pedido não encontrado para ME:', meCarrinhoId)
    return Response.json({ ok: true })
  }

  // Atualiza tracking no Supabase
  if (tracking) {
    await supabase.from('pedidos')
      .update({ me_tracking: tracking })
      .eq('id', pedido.id)
  }

  // Atualiza Bling com tracking e status
  if (pedido.bling_pedido_id && tracking) {
    try {
      await blingFetch(`/pedidos/vendas/${pedido.bling_pedido_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transporte: {
            volumes: [{
              id: 1,
              servico: 'Melhor Envio',
              codigoRastreamento: tracking,
            }],
          },
        }),
      })
      console.log('[me-webhook] tracking atualizado no Bling:', tracking)
    } catch (e: any) {
      console.log('[me-webhook] erro Bling:', e.message)
    }
  }

  return Response.json({ ok: true })
}
