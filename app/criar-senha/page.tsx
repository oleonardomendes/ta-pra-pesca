'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CriarSenhaPage() {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()

  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    // Supabase processa o hash da URL automaticamente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
      setChecking(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setHasSession(true)
        setChecking(false)
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (senha.length < 8) { setErro('A senha deve ter mínimo 8 caracteres'); return }
    if (senha !== confirmarSenha) { setErro('As senhas não coincidem'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setLoading(false)
    if (error) { setErro('Erro ao definir senha. Tente novamente.'); return }
    setSucesso(true)
    setTimeout(() => router.push('/conta'), 2500)
  }

  return (
    <>
      <style>{styles}</style>
      <div className="lp-bg">
        <div className="lp-card">
          <Link href="/" className="lp-logo">TÁ.PRA.PESCA</Link>

          {checking ? (
            <div className="lp-loading">Verificando link…</div>
          ) : !hasSession ? (
            <div>
              <div className="lp-erro">
                Link inválido ou expirado. Verifique seu e-mail ou entre em contato.
              </div>
              <Link href="/login" className="lp-btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '16px' }}>
                Ir para o login
              </Link>
            </div>
          ) : sucesso ? (
            <div className="lp-sucesso">
              Senha definida com sucesso! Redirecionando para sua conta…
            </div>
          ) : (
            <>
              <div className="lp-titulo">Crie sua senha</div>
              <div className="lp-subtitulo">Escolha uma senha para acessar sua conta.</div>

              {erro && <div className="lp-erro">{erro}</div>}

              <form onSubmit={handleSalvar} className="lp-form">
                <label className="lp-label">Nova senha</label>
                <input
                  className="lp-input"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <label className="lp-label">Confirmar senha</label>
                <input
                  className="lp-input"
                  type="password"
                  placeholder="Repita a senha"
                  value={confirmarSenha}
                  onChange={e => setConfirmarSenha(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button type="submit" className="lp-btn-primary" disabled={loading}>
                  {loading ? 'Salvando…' : 'Salvar senha'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  )
}

const styles = `
  .lp-bg {
    min-height: 100vh;
    background: var(--cream, #F8F5EF);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
  }
  .lp-card {
    background: #fff;
    border-radius: var(--r-lg, 16px);
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    padding: 40px 36px;
    width: 100%;
    max-width: 440px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
  .lp-logo {
    font-family: var(--ff-display, serif);
    font-size: 22px;
    font-weight: 800;
    letter-spacing: .12em;
    color: var(--g900, #1a1a1a);
    text-decoration: none;
    text-align: center;
    margin-bottom: 28px;
  }
  .lp-titulo {
    font-size: 20px; font-weight: 700; color: var(--g900, #1a1a1a);
    text-align: center; margin-bottom: 6px;
  }
  .lp-subtitulo {
    font-size: 13px; color: var(--muted, #888);
    text-align: center; margin-bottom: 20px;
  }
  .lp-loading {
    text-align: center; color: var(--muted, #888); font-size: 14px; padding: 20px 0;
  }
  .lp-form {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .lp-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--dark, #1a1a1a);
    margin-top: 12px;
    margin-bottom: 4px;
  }
  .lp-input {
    border: 1.5px solid var(--border, #e5e5e5);
    border-radius: var(--r-md, 8px);
    padding: 12px 14px;
    font-size: 14px;
    font-family: var(--ff-body, sans-serif);
    color: var(--dark, #1a1a1a);
    background: #fff;
    outline: none;
    transition: border-color .15s;
  }
  .lp-input:focus { border-color: var(--g700, #2d6a2d); }
  .lp-btn-primary {
    margin-top: 20px;
    background: var(--g700, #2d6a2d);
    color: #fff;
    border: none;
    border-radius: 50px;
    padding: 13px;
    font-family: var(--ff-body, sans-serif);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background .2s, transform .15s;
  }
  .lp-btn-primary:hover:not(:disabled) {
    background: var(--g900, #1a3d1a);
    transform: translateY(-1px);
  }
  .lp-btn-primary:disabled { opacity: .6; cursor: not-allowed; }
  .lp-erro {
    background: #FCEBEB;
    color: #A32D2D;
    border-radius: var(--r-sm, 6px);
    padding: 10px 14px;
    font-size: 13px;
    margin-bottom: 8px;
  }
  .lp-sucesso {
    background: #EAFBEA;
    color: #1a5c1a;
    border-radius: var(--r-sm, 6px);
    padding: 10px 14px;
    font-size: 13px;
    text-align: center;
  }
`
