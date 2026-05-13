import { supabase } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-client'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      mpPreferenceId,
      endereco,
      cpf,
      freteValor,
      freteServico,
      itens,
      total,
    } = body

    const supabaseServer = createSupabaseServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    const { data, error } = await supabase
      .from('pedidos')
      .insert({
        user_id: user?.id || null,
        mp_preference_id: mpPreferenceId,
        status: 'pendente',
        total: Number(total),
        itens: itens || [],
        endereco: endereco || null,
        cpf: cpf || null,
        frete_valor: Number(freteValor) || null,
        frete_servico: freteServico || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[pre-registro] erro:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    console.log('[pre-registro] pedido criado:', data.id)
    return Response.json({ pedido: data })
  } catch (e: any) {
    console.error('[pre-registro] erro inesperado:', e.message)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
