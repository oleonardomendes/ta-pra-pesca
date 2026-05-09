import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const blingCodigo = formData.get('blingCodigo') as string
  const index = formData.get('index')

  if (!file || !blingCodigo) {
    return Response.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return Response.json({ error: 'Arquivo muito grande (máx 5 MB)' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop()
  const filename = `${blingCodigo}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('produto-imagens')
    .upload(filename, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('produto-imagens')
    .getPublicUrl(filename)

  // Se recebeu index, atualiza array de imagens em produto_customizacoes
  if (index !== null && index !== undefined) {
    const { data: custom } = await supabase
      .from('produto_customizacoes')
      .select('imagens')
      .eq('bling_codigo', blingCodigo)
      .single()

    const imagens: string[] = custom?.imagens || []
    imagens[Number(index)] = publicUrl

    await supabase
      .from('produto_customizacoes')
      .upsert(
        { bling_codigo: blingCodigo, imagens, updated_at: new Date().toISOString() },
        { onConflict: 'bling_codigo' }
      )

    return Response.json({ url: publicUrl, imagens })
  }

  // Fallback: comportamento original — salva imagem principal em produto_imagens
  await supabase.from('produto_imagens').upsert(
    { bling_codigo: blingCodigo, imagem_url: publicUrl, updated_at: new Date().toISOString() },
    { onConflict: 'bling_codigo' }
  )

  return Response.json({ url: publicUrl })
}
