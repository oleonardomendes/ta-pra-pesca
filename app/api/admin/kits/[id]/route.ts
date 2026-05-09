import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { data, error } = await supabase
    .from('kits_custom')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ kit: data })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error } = await supabase.from('kits_custom').delete().eq('id', params.id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
