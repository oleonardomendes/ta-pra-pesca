export const dynamic = 'force-dynamic'

import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[bling-webhook-estoque]', JSON.stringify(body))

    revalidatePath('/')
    return Response.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return Response.json({ ok: false, error: msg })
  }
}

export async function GET() {
  return Response.json({ ok: true })
}
