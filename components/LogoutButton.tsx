'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
      }}
      style={{
        marginTop: '32px',
        background: 'transparent',
        border: '1.5px solid var(--border)',
        borderRadius: '50px',
        padding: '10px 24px',
        fontSize: '13px',
        fontWeight: '600',
        color: 'var(--muted)',
        cursor: 'pointer',
        transition: 'all .2s',
      }}
    >
      Sair da conta
    </button>
  )
}
