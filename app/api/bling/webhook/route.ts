import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { blingFetch } from '@/lib/bling'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const signature = req.headers.get('x-bling-signature-256')
  const body = await req.text()

  // Valida assinatura quando presente
  if (signature) {
    const expectedHash = crypto
      .createHmac('sha256', process.env.BLING_CLIENT_SECRET!)
      .update(body, 'utf8')
      .digest('hex')

    const expectedSignature = `sha256=${expectedHash}`

    if (signature !== expectedSignature) {
      console.error('[bling-webhook] assinatura inválida!')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let parsed: any
  try {
    parsed = JSON.parse(body)
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 })
  }

  console.log('[bling-webhook] evento recebido:', parsed.event, parsed.data)

  // Evento de pedido atualizado
  if (parsed.event === 'order.updated') {
    const pedidoBlingId = String(parsed.data?.id)
    await supabase
      .from('pedidos')
      .update({
        status: 'enviado',
        updated_at: new Date().toISOString(),
      })
      .eq('bling_pedido_id', pedidoBlingId)

    console.log('[bling-webhook] pedido atualizado:', pedidoBlingId)
    return NextResponse.json({ ok: true })
  }

  // Eventos de produto/estoque (formato legado com array)
  try {
    const eventos = Array.isArray(parsed) ? parsed : [parsed]

    for (const evento of eventos) {
      const tipo = evento?.data?.type || evento?.type || ''
      const id = evento?.data?.id || evento?.id || null

      console.log(`[bling-webhook] tipo: ${tipo}, id: ${id}`)

      const isProduto = [
        'produto',
        'produto.incluido',
        'produto.alterado',
        'produto.excluido',
        'estoque.atualizado',
        'estoque.alterado',
      ].some(t => tipo.toLowerCase().includes(t.toLowerCase()))

      if (!isProduto || !id) continue

      try {
        const data = await blingFetch(`/produtos/${id}`)
        const p = data?.data

        if (!p) continue

        const { data: existing } = await supabase
          .from('produto_customizacoes')
          .select('id, preco_custom')
          .eq('bling_codigo', String(p.codigo))
          .single()

        if (existing) {
          await supabase
            .from('produto_customizacoes')
            .update({ updated_at: new Date().toISOString() })
            .eq('bling_codigo', String(p.codigo))

          console.log(`[bling-webhook] produto ${p.codigo} marcado como atualizado`)
        }

        revalidatePath('/')
        revalidatePath(`/produto/${p.codigo}`)

        console.log(`[bling-webhook] revalidado produto ${p.codigo}`)
      } catch (err) {
        console.error(`[bling-webhook] erro ao processar produto ${id}:`, err)
      }
    }

    return NextResponse.json({ ok: true, received: eventos.length })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[bling-webhook] erro geral:', msg)
    return NextResponse.json({ ok: false, error: msg })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'Ta Pra Pesca - Bling Webhook' })
}
