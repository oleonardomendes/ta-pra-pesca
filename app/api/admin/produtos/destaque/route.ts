import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { bling_codigo, destaque } = await req.json()

  if (!bling_codigo || destaque === undefined) {
    return Response.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('produto_customizacoes')
    .upsert(
      { bling_codigo, destaque, updated_at: new Date().toISOString() },
      { onConflict: 'bling_codigo' }
    )
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true, destaque: data.destaque })
}
