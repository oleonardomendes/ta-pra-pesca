import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')?.trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ exists: false })
  }

  try {
    const { data, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error('[check-email] erro:', error.message)
      return NextResponse.json({ exists: false })
    }

    const existe = data.users.some(u => u.email?.toLowerCase() === email)
    return NextResponse.json({ exists: existe })
  } catch (err: any) {
    console.error('[check-email] erro:', err.message)
    return NextResponse.json({ exists: false })
  }
}
