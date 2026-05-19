import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  let res = NextResponse.next()

  // Proteção do admin (lógica existente — mantém igual)
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return res
    const session = req.cookies.get('admin_session')?.value
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    const [token, sig] = session.split('.')
    if (!token || !sig) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    return res
  }

  // Autenticação de clientes via Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protege área da conta
  if (pathname.startsWith('/conta')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/conta/:path*'],
}
