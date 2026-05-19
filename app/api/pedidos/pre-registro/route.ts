import { supabase } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-client'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json()
  const {
    pedidoId,
    mpPreferenceId,
    endereco,
    cpf,
    freteValor,
    freteServico,
    freteServicoId,
    itens,
    total,
    guestNome,
    guestEmail,
  } = body

  const supabaseServer = createSupabaseServerClient()
  const { data: { user } } = await supabaseServer.auth.getUser()

  console.log('[pre-registro] salvando pedido:', { pedidoId, mpPreferenceId, total, isGuest: !user })

  const { data, error } = await supabase
    .from('pedidos')
    .upsert({
      id: pedidoId,
      user_id: user?.id || null,
      mp_preference_id: mpPreferenceId,
      status: 'pendente',
      total: Number(total),
      itens: itens || [],
      endereco: endereco || null,
      cpf: cpf || null,
      frete_valor: Number(freteValor) || null,
      frete_servico: freteServico || null,
      frete_servico_id: freteServicoId ? Number(freteServicoId) : null,
      guest_email: !user?.id ? (guestEmail || null) : null,
      guest_nome: !user?.id ? (guestNome || null) : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    console.error('[pre-registro] erro:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  console.log('[pre-registro] salvo com sucesso:', data.id)
  return Response.json({ pedido: data })
}
