import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('kits_custom')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ kits: data })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { data, error } = await supabase
    .from('kits_custom')
    .insert(body)
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ kit: data })
}
