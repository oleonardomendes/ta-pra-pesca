'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

function traduzirErro(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos'
  if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado. Tente entrar.'
  if (msg.includes('Password should be at least 6 characters')) return 'Senha deve ter mínimo 6 caracteres'
  return msg
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [aba, setAba] = useState<'login' | 'cadastro'>('login')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const supabase = createSupabaseBrowserClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setLoading(false)
    if (error) { setErro(traduzirErro(error.message)); return }
    router.push(searchParams.get('redirect') || '/conta')
  }

  async function handleEsqueciSenha() {
    if (!email) { setErro('Digite seu e-mail para redefinir a senha'); return }
    setErro('')
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    setSucesso('Verifique seu e-mail para redefinir a senha.')
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (senha !== confirmarSenha) { setErro('As senhas não coincidem'); return }
    if (senha.length < 6) { setErro('Senha deve ter mínimo 6 caracteres'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome },
        emailRedirectTo: 'https://taprapesca.com.br/auth/callback',
      },
    })
    setLoading(false)
    if (error) { setErro(traduzirErro(error.message)); return }
    setSucesso('Verifique seu e-mail para confirmar o cadastro!')
  }

  function trocarAba(novaAba: 'login' | 'cadastro') {
    setAba(novaAba)
    setErro('')
    setSucesso('')
  }

  return (
    <>
      <style>{styles}</style>
      <div className="lp-bg">
        <div className="lp-card">
          <Link href="/" className="lp-logo">TÁ.PRA.PESCA</Link>

          <div className="lp-abas">
            <button
              className={`lp-aba${aba === 'login' ? ' lp-aba-ativa' : ''}`}
              onClick={() => trocarAba('login')}
            >
              Entrar
            </button>
            <button
              className={`lp-aba${aba === 'cadastro' ? ' lp-aba-ativa' : ''}`}
              onClick={() => trocarAba('cadastro')}
            >
              Criar conta
            </button>
          </div>

          {erro && <div className="lp-erro">{erro}</div>}
          {sucesso && <div className="lp-sucesso">{sucesso}</div>}

          {aba === 'login' ? (
            <form onSubmit={handleLogin} className="lp-form">
              <label className="lp-label">E-mail</label>
              <input
                className="lp-input"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <label className="lp-label">Senha</label>
              <input
                className="lp-input"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button type="submit" className="lp-btn-primary" disabled={loading}>
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
              <button
                type="button"
                className="lp-link-btn"
                onClick={handleEsqueciSenha}
                disabled={loading}
              >
                Esqueci minha senha
              </button>
            </form>
          ) : (
            <form onSubmit={handleCadastro} className="lp-form">
              <label className="lp-label">Nome completo</label>
              <input
                className="lp-input"
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
                autoComplete="name"
              />
              <label className="lp-label">E-mail</label>
              <input
                className="lp-input"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <label className="lp-label">Senha</label>
              <input
                className="lp-input"
                type="password"
                placeholder="Mínimo 6 caracteres"
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
                {loading ? 'Criando conta…' : 'Criar conta'}
              </button>
            </form>
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
  .lp-abas {
    display: flex;
    border-bottom: 1.5px solid var(--border, #e5e5e5);
    margin-bottom: 24px;
  }
  .lp-aba {
    flex: 1;
    background: none;
    border: none;
    padding: 10px 0;
    font-family: var(--ff-body, sans-serif);
    font-size: 14px;
    font-weight: 600;
    color: var(--muted, #888);
    cursor: pointer;
    border-bottom: 2.5px solid transparent;
    margin-bottom: -1.5px;
    transition: color .15s, border-color .15s;
  }
  .lp-aba-ativa {
    color: var(--g900, #1a1a1a);
    border-bottom-color: var(--g700, #2d6a2d);
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
  .lp-link-btn {
    background: none;
    border: none;
    color: var(--g500, #4a8a4a);
    font-size: 13px;
    font-family: var(--ff-body, sans-serif);
    cursor: pointer;
    text-align: center;
    margin-top: 10px;
    padding: 4px;
    text-decoration: underline;
  }
  .lp-link-btn:hover { color: var(--g700, #2d6a2d); }
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
    margin-bottom: 8px;
  }
`
