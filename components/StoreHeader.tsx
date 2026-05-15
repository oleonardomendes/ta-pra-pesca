'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import CartDrawer from '@/components/CartDrawer'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const CATEGORIAS = [
  { label: 'Todos',       key: '' },
  { label: 'Varas',       key: 'Vara' },
  { label: 'Molinetes',   key: 'Molinete' },
  { label: 'Carretilhas', key: 'Carretilha' },
  { label: 'Linhas',      key: 'Linha' },
]

export default function StoreHeader() {
  const [busca, setBusca] = useState('')
  const [searchAberto, setSearchAberto] = useState(false)
  const { totalItens, openCart } = useCart()
  const router = useRouter()

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
    })
    return () => listener.subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setDropdownOpen(false)
    router.push('/')
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && busca.trim()) {
      router.push(`/?busca=${encodeURIComponent(busca.trim())}`)
    }
  }

  const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER || ''
  const inicial = userEmail ? userEmail[0].toUpperCase() : ''

  return (
    <>
      <style>{styles}</style>
      <CartDrawer />

      <header className="sh-root">
        {/* Linha superior */}
        <div className="sh-top">
          <Link href="/" className="sh-logo">
            TÁ<span>.</span>PRA<span>.</span>PESCA
          </Link>

          <div className="sh-search">
            <svg className="sh-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              className="sh-search-input"
              placeholder="O que você está buscando?"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={handleSearch}
              aria-label="Buscar produtos"
            />
          </div>

          <div className="sh-icons">
            {/* Lupa mobile */}
            <button
              className="sh-icon-btn sh-lupa-mobile"
              onClick={() => setSearchAberto(v => !v)}
              aria-label="Buscar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden>
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
            {waNumber && (
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="sh-icon-btn"
                aria-label="Contato via WhatsApp"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="21" height="21" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            )}

            {/* Área do usuário */}
            {userEmail ? (
              <div className="sh-user-wrap" ref={dropdownRef}>
                <button
                  className="sh-avatar"
                  onClick={() => setDropdownOpen(v => !v)}
                  aria-label="Menu do usuário"
                  aria-expanded={dropdownOpen}
                >
                  {inicial}
                </button>
                {dropdownOpen && (
                  <div className="sh-dropdown">
                    <div className="sh-dropdown-email">{userEmail}</div>
                    <Link href="/conta" className="sh-dropdown-item" onClick={() => setDropdownOpen(false)}>
                      Minha conta
                    </Link>
                    <button className="sh-dropdown-item sh-dropdown-sair" onClick={handleSignOut}>
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="sh-entrar">
                Entrar
              </Link>
            )}

            <button className="sh-icon-btn sh-cart-btn" onClick={openCart} aria-label="Abrir carrinho">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22" aria-hidden>
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {totalItens > 0 && (
                <span className="sh-cart-badge" aria-label={`${totalItens} itens no carrinho`}>
                  {totalItens}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Busca mobile expansível */}
        {searchAberto && (
          <div className="sh-search-mobile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden style={{ flexShrink: 0, color: 'var(--muted)' }}>
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              className="sh-search-input"
              placeholder="O que você está buscando?"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={handleSearch}
              aria-label="Buscar produtos"
              autoFocus
            />
          </div>
        )}

        {/* Barra de categorias */}
        <nav className="sh-cat-nav" aria-label="Categorias">
          {CATEGORIAS.map(({ label, key }) => (
            <Link
              key={label}
              href={key ? `/?categoria=${key}` : '/'}
              className="sh-cat-link"
            >
              {label}
            </Link>
          ))}
          <a
            href="https://rastreamento.correios.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="sh-cat-link sh-cat-rastrear"
          >
            Rastrear pedido ↗
          </a>
          <Link href="/kits" className="sh-cat-link sh-cat-kits">
            Kits Especiais →
          </Link>
        </nav>
      </header>
    </>
  )
}

const styles = `
  .sh-root {
    position: sticky; top: 0; z-index: 100;
    background: #fff;
    border-bottom: 1px solid var(--border);
    box-shadow: 0 1px 16px rgba(10,61,43,.06);
  }
  .sh-top {
    display: flex; align-items: center; gap: 16px;
    padding: 0 5%; height: 64px;
  }
  .sh-logo {
    font-family: var(--ff-display); font-size: 26px; letter-spacing: .06em;
    color: var(--g900); line-height: 1; flex-shrink: 0; user-select: none;
  }
  .sh-logo span { color: var(--a500); }

  .sh-search {
    flex: 1; display: flex; align-items: center; gap: 10px;
    background: var(--cream); border: 1.5px solid var(--border);
    border-radius: 50px; padding: 0 16px; height: 40px;
    transition: border-color .2s;
  }
  .sh-search:focus-within { border-color: var(--g500); }
  .sh-search-icon { color: var(--muted); flex-shrink: 0; width: 16px; height: 16px; }
  .sh-search-input {
    flex: 1; border: none; background: transparent; outline: none;
    font-family: var(--ff-body); font-size: 14px; color: var(--dark);
  }
  .sh-search-input::placeholder { color: var(--muted); }
  .sh-search-input::-webkit-search-cancel-button { -webkit-appearance: none; }

  .sh-icons { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
  .sh-icon-btn {
    position: relative; width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: transparent; border: none; cursor: pointer; color: var(--g700);
    transition: background .2s;
  }
  .sh-icon-btn:hover { background: var(--g50); }

  .sh-cart-btn { position: relative; }
  .sh-cart-badge {
    position: absolute; top: 2px; right: 2px;
    min-width: 18px; height: 18px; border-radius: 50%;
    background: var(--a500); color: #fff;
    font-size: 10px; font-weight: 800; font-family: var(--ff-body);
    display: flex; align-items: center; justify-content: center;
    padding: 0 3px; pointer-events: none;
  }

  .sh-user-wrap { position: relative; }
  .sh-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--g700); color: #fff;
    font-size: 14px; font-weight: 700; font-family: var(--ff-body);
    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background .2s;
  }
  .sh-avatar:hover { background: var(--g900); }
  .sh-dropdown {
    position: absolute; top: calc(100% + 8px); right: 0;
    background: #fff; border: 1px solid var(--border);
    border-radius: var(--r-md, 10px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    min-width: 200px; z-index: 200;
    overflow: hidden;
  }
  .sh-dropdown-email {
    padding: 12px 16px 8px;
    font-size: 12px; color: var(--muted);
    border-bottom: 1px solid var(--border);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sh-dropdown-item {
    display: block; width: 100%; text-align: left;
    padding: 11px 16px; font-size: 13px; font-weight: 600;
    font-family: var(--ff-body); color: var(--dark);
    background: none; border: none; cursor: pointer;
    text-decoration: none; transition: background .15s;
  }
  .sh-dropdown-item:hover { background: var(--g50); }
  .sh-dropdown-sair { color: #A32D2D; }
  .sh-dropdown-sair:hover { background: #FCEBEB; }

  .sh-entrar {
    font-size: 13px; font-weight: 600; color: var(--g700);
    padding: 8px 14px; border-radius: 50px;
    border: 1.5px solid var(--g700); text-decoration: none;
    transition: background .15s, color .15s;
    white-space: nowrap;
  }
  .sh-entrar:hover { background: var(--g700); color: #fff; }

  .sh-cat-nav {
    display: flex; align-items: center;
    padding: 0 5%;
    border-top: 1px solid var(--border);
    overflow-x: auto; scrollbar-width: none;
  }
  .sh-cat-nav::-webkit-scrollbar { display: none; }
  .sh-cat-link {
    font-size: 13px; font-weight: 600; color: var(--muted);
    padding: 10px 14px; white-space: nowrap;
    border-bottom: 2px solid transparent;
    transition: color .2s, border-color .2s;
    flex-shrink: 0;
  }
  .sh-cat-link:hover { color: var(--g700); border-bottom-color: var(--g300); }
  .sh-cat-kits { color: var(--g700); margin-left: auto; }
  .sh-cat-kits:hover { color: var(--g900); border-bottom-color: var(--g700); }

  .sh-lupa-mobile { display: none; }
  .sh-cat-rastrear { color: var(--muted); margin-left: 8px; }
  .sh-cat-rastrear:hover { color: var(--g700); border-bottom-color: var(--g300); }
  .sh-search-mobile {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 4%; border-top: 1px solid var(--border);
    background: #fff;
  }
  .sh-search-mobile .sh-search-input { flex: 1; }
  @media (max-width: 640px) {
    .sh-logo { font-size: 20px; }
    .sh-search { display: none; }
    .sh-lupa-mobile { display: flex; }
    .sh-top { padding: 0 4%; }
    .sh-cat-nav { padding: 0 4%; }
  }
`
