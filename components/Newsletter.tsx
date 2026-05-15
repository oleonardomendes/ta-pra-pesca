'use client'

import { useState } from 'react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    window.location.href = `mailto:contato@taprapesca.com.br?subject=Cadastro%20Newsletter&body=E-mail%3A%20${encodeURIComponent(email)}`
    setSent(true)
    setEmail('')
  }

  return (
    <>
      <style>{styles}</style>

      <section className="nl-root">
        <p className="nl-eyebrow">NEWSLETTER</p>
        <h2 className="nl-titulo">Dicas de pesca e promoções exclusivas</h2>
        <p className="nl-sub">
          1 e-mail por semana. Sem spam. Cancele quando quiser.
        </p>

        {sent ? (
          <p className="nl-success">Obrigado! Em breve você receberá nossas promoções.</p>
        ) : (
          <form className="nl-form" onSubmit={handleSubmit}>
            <input
              className="nl-input"
              type="email"
              placeholder="Seu melhor e-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              aria-label="E-mail para newsletter"
            />
            <button type="submit" className="nl-btn">Quero receber</button>
          </form>
        )}
      </section>
    </>
  )
}

const styles = `
  .nl-root {
    background: var(--g700);
    padding: 72px 6%;
    text-align: center;
  }
  .nl-eyebrow {
    font-size: 11px; font-weight: 700; letter-spacing: .16em;
    text-transform: uppercase; color: rgba(255,255,255,.5);
    margin-bottom: 14px;
  }
  .nl-titulo {
    font-family: var(--ff-display);
    font-size: clamp(32px, 5vw, 52px);
    color: #fff; letter-spacing: .025em;
    line-height: 1; margin-bottom: 16px;
  }
  .nl-sub {
    font-size: 16px; color: rgba(255,255,255,.65);
    max-width: 460px; margin: 0 auto 40px; line-height: 1.65;
  }
  .nl-form {
    display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
    max-width: 500px; margin: 0 auto;
  }
  .nl-input {
    flex: 1; min-width: 220px;
    padding: 14px 20px; border-radius: 50px;
    border: 2px solid rgba(255,255,255,.2);
    background: rgba(255,255,255,.1);
    color: #fff; font-family: var(--ff-body); font-size: 14px;
    outline: none; transition: border-color .2s;
  }
  .nl-input::placeholder { color: rgba(255,255,255,.45); }
  .nl-input:focus { border-color: rgba(255,255,255,.5); }
  .nl-btn {
    padding: 14px 28px; border-radius: 50px;
    background: #fff; color: var(--g900);
    font-family: var(--ff-body); font-size: 14px; font-weight: 700;
    border: none; cursor: pointer;
    transition: background .2s, transform .2s;
    white-space: nowrap;
  }
  .nl-btn:hover { background: var(--cream); transform: translateY(-2px); }
  .nl-success {
    font-size: 16px; color: rgba(255,255,255,.85);
    background: rgba(255,255,255,.1); border-radius: 12px;
    padding: 16px 32px; display: inline-block;
  }
  @media (max-width: 480px) {
    .nl-form { flex-direction: column; align-items: stretch; }
    .nl-input, .nl-btn { width: 100%; }
  }
`
