export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { blingFetch } from '@/lib/bling'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[bling-webhook] payload recebido:', JSON.stringify(body))

    const eventos = Array.isArray(body) ? body : [body]

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

        // Marca produto como atualizado se já tiver customização
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

    return Response.json({ ok: true, received: eventos.length })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[bling-webhook] erro geral:', msg)
    return Response.json({ ok: false, error: msg })
  }
}

export async function GET() {
  return Response.json({ ok: true, service: 'Ta Pra Pesca - Bling Webhook' })
}
