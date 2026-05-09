'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const isActive = (href: string) => pathname.startsWith(href)

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
  }

  if (pathname === '/admin/login') return <>{children}</>

  return (
    <>
      <style>{styles}</style>

      <div className="al-root">
        <nav className="al-nav">
          <span className="al-brand">
            TÁ<span>.</span>PRA<span>.</span>PESCA
            <span className="al-brand-tag">· Admin</span>
          </span>

          <div className="al-links">
            <Link
              href="/admin/produtos"
              className={`al-link${isActive('/admin/produtos') ? ' active' : ''}`}
            >
              Produtos
            </Link>
            <Link
              href="/admin/kits"
              className={`al-link${isActive('/admin/kits') ? ' active' : ''}`}
            >
              Kits
            </Link>
          </div>

          <button className="al-logout" onClick={handleLogout}>
            Sair
          </button>
        </nav>

        <main className="al-content">{children}</main>
      </div>
    </>
  )
}

const styles = `
  .al-root { min-height: 100vh; background: var(--cream); }

  .al-nav {
    background: var(--g900);
    display: flex; align-items: center; gap: 24px;
    padding: 0 5%; height: 60px;
    position: sticky; top: 0; z-index: 100;
  }
  .al-brand {
    font-family: var(--ff-display);
    font-size: 22px; letter-spacing: .06em;
    color: #fff; user-select: none; flex-shrink: 0;
  }
  .al-brand span:not(.al-brand-tag) { color: var(--a300); }
  .al-brand-tag {
    font-family: var(--ff-body);
    font-size: 12px; font-weight: 600; letter-spacing: .04em;
    color: rgba(255,255,255,.4); margin-left: 8px;
  }

  .al-links {
    display: flex; align-items: center; gap: 4px;
    flex: 1;
  }
  .al-link {
    font-size: 13px; font-weight: 600;
    color: rgba(255,255,255,.55);
    padding: 6px 14px; border-radius: 6px;
    transition: background .15s, color .15s;
  }
  .al-link:hover { color: #fff; background: rgba(255,255,255,.08); }
  .al-link.active { color: #fff; background: rgba(255,255,255,.12); }

  .al-logout {
    background: rgba(255,255,255,.08);
    border: 1px solid rgba(255,255,255,.15);
    color: rgba(255,255,255,.7);
    font-family: var(--ff-body);
    font-size: 13px; font-weight: 600;
    padding: 6px 16px; border-radius: 6px;
    cursor: pointer; transition: all .15s; flex-shrink: 0;
  }
  .al-logout:hover { background: rgba(255,255,255,.15); color: #fff; }

  .al-content { padding: 40px 5%; max-width: 1280px; margin: 0 auto; }
`
