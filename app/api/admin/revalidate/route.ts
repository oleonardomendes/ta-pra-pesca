import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  revalidatePath('/')
  revalidatePath('/kits')
  revalidatePath('/produto/[codigo]', 'page')
  return NextResponse.json({ revalidated: true })
}
