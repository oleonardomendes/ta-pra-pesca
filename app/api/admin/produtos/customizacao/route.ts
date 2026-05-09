import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const codigo = searchParams.get('codigo')
  if (!codigo) return Response.json({ error: 'Código obrigatório' }, { status: 400 })

  const { data } = await supabase
    .from('produto_customizacoes')
    .select('*')
    .eq('bling_codigo', codigo)
    .single()

  return Response.json({ customizacao: data || null })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { bling_codigo, ...campos } = body

  if (!bling_codigo) {
    return Response.json({ error: 'Código obrigatório' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('produto_customizacoes')
    .upsert(
      { bling_codigo, ...campos, updated_at: new Date().toISOString() },
      { onConflict: 'bling_codigo' }
    )
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ customizacao: data })
}
