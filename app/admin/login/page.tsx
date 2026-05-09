'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao autenticar')
        return
      }

      router.replace('/admin')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{styles}</style>

      <div className="al-root">
        <div className="al-card">
          <div className="al-logo">
            TÁ<span>.</span>PRA<span>.</span>PESCA
          </div>
          <p className="al-sub">Área restrita — administração</p>

          <form className="al-form" onSubmit={handleSubmit}>
            <div className="al-field">
              <label className="al-label" htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                className="al-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@taprapesca.com.br"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="al-field">
              <label className="al-label" htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                className="al-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="al-error">{error}</div>
            )}

            <button
              type="submit"
              className="al-btn"
              disabled={loading}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

const styles = `
  .al-root {
    min-height: 100vh;
    background: var(--cream);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .al-card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: 48px 40px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 4px 32px rgba(10,61,43,.08);
  }
  .al-logo {
    font-family: var(--ff-display);
    font-size: 32px;
    letter-spacing: .06em;
    color: var(--g900);
    text-align: center;
    margin-bottom: 8px;
    user-select: none;
  }
  .al-logo span { color: var(--a500); }
  .al-sub {
    font-size: 13px;
    color: var(--muted);
    text-align: center;
    margin-bottom: 36px;
    font-weight: 500;
  }
  .al-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .al-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .al-label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .al-input {
    padding: 12px 16px;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    background: var(--g50);
    font-family: var(--ff-body);
    font-size: 14px;
    color: var(--dark);
    outline: none;
    transition: border-color .2s, background .2s;
  }
  .al-input::placeholder { color: var(--muted); }
  .al-input:focus {
    border-color: var(--g500);
    background: #fff;
  }
  .al-error {
    font-size: 13px;
    color: #b91c1c;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 10px 14px;
    font-weight: 500;
  }
  .al-btn {
    padding: 14px;
    border-radius: 50px;
    background: var(--g700);
    color: #fff;
    font-family: var(--ff-body);
    font-size: 15px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    transition: background .2s, transform .2s;
    margin-top: 4px;
  }
  .al-btn:hover:not(:disabled) {
    background: var(--g900);
    transform: translateY(-1px);
  }
  .al-btn:disabled {
    opacity: .6;
    cursor: not-allowed;
  }
`
