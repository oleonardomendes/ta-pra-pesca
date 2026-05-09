import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { blingCodigo, index } = await req.json()

  if (!blingCodigo || index === undefined || index === null) {
    return Response.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  const { data: custom } = await supabase
    .from('produto_customizacoes')
    .select('imagens')
    .eq('bling_codigo', blingCodigo)
    .single()

  const imagens: string[] = custom?.imagens || []
  imagens.splice(Number(index), 1)

  await supabase
    .from('produto_customizacoes')
    .upsert(
      { bling_codigo: blingCodigo, imagens, updated_at: new Date().toISOString() },
      { onConflict: 'bling_codigo' }
    )

  return Response.json({ imagens })
}
