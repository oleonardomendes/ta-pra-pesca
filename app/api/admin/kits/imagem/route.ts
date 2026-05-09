import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) {
    return Response.json({ error: 'Arquivo não enviado' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return Response.json({ error: 'Arquivo muito grande (máx 5 MB)' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop()
  const filename = `kits/kit-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('produto-imagens')
    .upload(filename, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('produto-imagens')
    .getPublicUrl(filename)

  return Response.json({ url: publicUrl })
}
