import { NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

function verifyPassword(input: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  const inputHash = crypto.scryptSync(input, salt, 64).toString('hex')
  return crypto.timingSafeEqual(
    Buffer.from(inputHash, 'hex'),
    Buffer.from(hash, 'hex')
  )
}

function createSessionToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  ).toString('base64')
  const sig = crypto
    .createHmac('sha256', process.env.AUTH_SECRET!)
    .update(payload)
    .digest('hex')
  return `${payload}.${sig}`
}

export async function POST(req: Request) {
  const { email, password } = await req.json()

  const adminEmail = process.env.ADMIN_EMAIL
  const adminHash = process.env.ADMIN_PASSWORD_HASH

  if (!adminEmail || !adminHash) {
    return NextResponse.json({ error: 'Servidor não configurado' }, { status: 500 })
  }

  if (email !== adminEmail || !verifyPassword(password, adminHash)) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  const token = createSessionToken(email)
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })
  return res
}
