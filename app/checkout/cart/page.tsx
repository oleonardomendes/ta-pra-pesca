'use client'

import { useCart } from '@/contexts/CartContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { trackBeginCheckout } from '@/lib/analytics'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import MPCheckout from '@/components/MPCheckoutBrick'
import Link from 'next/link'

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

function mascaraCPF(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function validarCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number(d[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== Number(d[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += Number(d[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === Number(d[10])
}

export default function CartCheckoutPage() {
  const { items, totalPreco } = useCart()
  const router = useRouter()

  const [isGuest, setIsGuest] = useState<boolean | null>(null)
  const [step, setStep] = useState<'loading' | 'dados' | 'pagamento'>('loading')

  // Guest Step 0 fields
  const [guestNome, setGuestNome] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestCpf, setGuestCpf] = useState('')
  const [erros, setErros] = useState<Record<string, string>>({})

  const [checkoutUrl, setCheckoutUrl] = useState<string>('')
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (items.length === 0) {
      router.replace('/')
      return
    }

    trackBeginCheckout(
      totalPreco,
      items.map(i => ({ item_id: String(i.id), item_name: i.nome, price: i.preco, quantity: i.quantidade }))
    )

    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      const guest = !user
      setIsGuest(guest)

      if (!guest) {
        // Logged-in: create preference immediately
        setLoadingCheckout(true)
        fetch('/api/mp/create-preference', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.id || '',
          },
          body: JSON.stringify({
            items: items.map(i => ({
              id: i.id,
              nome: i.nome,
              preco: i.preco,
              quantidade: i.quantidade,
            })),
            backUrls: {
              success: 'https://taprapesca.com.br/obrigado',
              failure: 'https://taprapesca.com.br',
              pending: 'https://taprapesca.com.br/obrigado',
            },
          }),
        })
          .then(r => r.json())
          .then(data => {
            if (data.error) setError(data.error)
            else setCheckoutUrl(data.checkoutUrl)
            setStep('pagamento')
          })
          .catch(e => { setError(String(e.message)); setStep('pagamento') })
          .finally(() => setLoadingCheckout(false))
      } else {
        setStep('dados')
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function validarDados() {
    const e: Record<string, string> = {}
    if (guestNome.trim().length < 3) e.guestNome = 'Informe seu nome completo (mínimo 3 caracteres)'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) e.guestEmail = 'E-mail inválido'
    if (!validarCPF(guestCpf)) e.guestCpf = 'CPF inválido'
    setErros(e)
    return Object.keys(e).length === 0
  }

  async function handleAvancarDados() {
    if (!validarDados()) return
    setLoadingCheckout(true)
    setErros({})
    try {
      const prefRes = await fetch('/api/mp/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            id: i.id,
            nome: i.nome,
            preco: i.preco,
            quantidade: i.quantidade,
          })),
          backUrls: {
            success: 'https://taprapesca.com.br/obrigado',
            failure: 'https://taprapesca.com.br',
            pending: 'https://taprapesca.com.br/obrigado',
          },
        }),
      })
      const prefData = await prefRes.json()
      if (prefData.error) { setError(prefData.error); setStep('pagamento'); return }

      setCheckoutUrl(prefData.checkoutUrl || '')

      // Salva dados do guest no banco antes do pagamento
      if (prefData.pedidoId && prefData.preferenceId) {
        fetch('/api/pedidos/pre-registro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pedidoId: prefData.pedidoId,
            mpPreferenceId: prefData.preferenceId,
            cpf: guestCpf,
            itens: items.map(i => ({
              id: String(i.id),
              nome: i.nome,
              valor: i.preco,
              quantidade: i.quantidade,
            })),
            total: totalPreco,
            guestNome,
            guestEmail,
          }),
        }).catch(() => {})
      }

      setStep('pagamento')
    } catch (e: any) {
      setError(String(e.message))
      setStep('pagamento')
    } finally {
      setLoadingCheckout(false)
    }
  }

  if (items.length === 0) return null

  return (
    <>
      <style>{styles}</style>

      <div className="cc-page">
        <Link href="/" className="cc-back">← Continuar comprando</Link>

        {/* Resumo sempre visível */}
        <div className="cc-grid">
          <div className="cc-summary">
            <div className="cc-label">Resumo do pedido</div>
            <ul className="cc-items">
              {items.map(item => (
                <li key={item.id} className="cc-item">
                  <div className="cc-item-info">
                    <span className="cc-item-nome">{item.nome}</span>
                    <span className="cc-item-qty">× {item.quantidade}</span>
                  </div>
                  <span className="cc-item-subtotal">
                    {fmt(item.preco * item.quantidade)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="cc-total">
              <span>Total</span>
              <span className="cc-total-val">{fmt(totalPreco)}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#0F5C45', fontWeight: '600', marginTop: '8px' }}>
              ⚡ Com PIX: R$ {(totalPreco * 0.95).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="cc-brick-wrap">
            {/* Step 0 para guests */}
            {step === 'dados' && (
              <>
                <div className="cc-label">Seus dados</div>
                <div className="cc-dados-form">
                  <div className="cc-field">
                    <label className="cc-field-label">Nome completo</label>
                    <input
                      className={`cc-input${erros.guestNome ? ' cc-input-erro' : ''}`}
                      placeholder="Seu nome completo"
                      value={guestNome}
                      onChange={e => setGuestNome(e.target.value)}
                      autoComplete="name"
                    />
                    {erros.guestNome && <span className="cc-erro-msg">{erros.guestNome}</span>}
                  </div>

                  <div className="cc-field">
                    <label className="cc-field-label">E-mail</label>
                    <input
                      className={`cc-input${erros.guestEmail ? ' cc-input-erro' : ''}`}
                      type="email"
                      placeholder="seu@email.com"
                      value={guestEmail}
                      onChange={e => setGuestEmail(e.target.value)}
                      autoComplete="email"
                    />
                    {erros.guestEmail && <span className="cc-erro-msg">{erros.guestEmail}</span>}
                  </div>

                  <div className="cc-field">
                    <label className="cc-field-label">CPF</label>
                    <input
                      className={`cc-input${erros.guestCpf ? ' cc-input-erro' : ''}`}
                      placeholder="000.000.000-00"
                      value={guestCpf}
                      onChange={e => setGuestCpf(mascaraCPF(e.target.value))}
                      inputMode="numeric"
                    />
                    {erros.guestCpf && <span className="cc-erro-msg">{erros.guestCpf}</span>}
                  </div>

                  <div className="cc-info-guest">
                    Após o pagamento, você receberá um e-mail para criar sua senha e acompanhar seus pedidos.
                  </div>

                  <button
                    className="cc-btn-primary"
                    onClick={handleAvancarDados}
                    disabled={loadingCheckout}
                  >
                    {loadingCheckout ? '⏳ Preparando checkout...' : 'Ir para pagamento →'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <Link href="/login" className="cc-link-login">
                      Já tenho conta — entrar
                    </Link>
                  </div>
                </div>
              </>
            )}

            {/* Loading */}
            {(step === 'loading' || loadingCheckout) && step !== 'dados' && (
              <div className="cc-loading">Preparando seu checkout…</div>
            )}

            {/* Erro */}
            {step === 'pagamento' && error && (
              <div className="cc-error">
                Erro ao iniciar o checkout.{' '}
                <Link href="/" style={{ color: 'var(--g500)' }}>Voltar</Link>
              </div>
            )}

            {/* Brick de pagamento */}
            {step === 'pagamento' && !error && checkoutUrl && (
              <>
                <div className="cc-label">Forma de pagamento</div>
                <MPCheckout
                  checkoutUrl={checkoutUrl}
                  kitNome="Pedido Tá Pra Pesca"
                  kitPreco={totalPreco}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

const styles = `
  .cc-page {
    min-height: 100vh; background: var(--cream); padding: 40px 5%;
  }
  .cc-back {
    display: inline-flex; align-items: center; gap: 8px;
    color: var(--muted); font-size: 14px; font-weight: 500;
    margin-bottom: 32px; transition: color .2s;
  }
  .cc-back:hover { color: var(--g700); }
  .cc-loading, .cc-error {
    text-align: center; padding: 60px; color: var(--muted); font-size: 16px;
  }
  .cc-grid {
    display: grid; grid-template-columns: 1fr 1.6fr;
    gap: 32px; max-width: 960px; margin: 0 auto;
  }
  .cc-summary {
    background: #fff; border: 1px solid var(--border);
    border-radius: var(--r-lg); padding: 28px; height: fit-content;
  }
  .cc-label {
    font-size: 11px; font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 20px;
  }
  .cc-items { list-style: none; display: flex; flex-direction: column; gap: 12px; }
  .cc-item {
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 12px;
  }
  .cc-item-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .cc-item-nome { font-size: 13px; font-weight: 600; color: var(--dark); line-height: 1.4; }
  .cc-item-qty { font-size: 12px; color: var(--muted); }
  .cc-item-subtotal { font-size: 14px; font-weight: 700; color: var(--g700); white-space: nowrap; }
  .cc-total {
    display: flex; justify-content: space-between; align-items: center;
    border-top: 1px solid var(--border); margin-top: 16px; padding-top: 16px;
    font-size: 14px; color: var(--muted); font-weight: 500;
  }
  .cc-total-val { font-family: var(--ff-display); font-size: 30px; color: var(--g900); }
  .cc-brick-wrap {
    background: #fff; border: 1px solid var(--border);
    border-radius: var(--r-lg); padding: 28px;
  }
  .cc-dados-form { display: flex; flex-direction: column; gap: 14px; }
  .cc-field { display: flex; flex-direction: column; gap: 4px; }
  .cc-field-label {
    font-size: 12px; font-weight: 700; color: var(--dark);
    text-transform: uppercase; letter-spacing: .04em;
  }
  .cc-input {
    border: 1.5px solid var(--border); border-radius: var(--r-md, 8px);
    padding: 11px 13px; font-size: 14px; font-family: var(--ff-body);
    color: var(--dark); background: #fff; outline: none;
    transition: border-color .15s;
  }
  .cc-input:focus { border-color: var(--g700); }
  .cc-input-erro { border-color: #A32D2D !important; }
  .cc-erro-msg { font-size: 11px; color: #A32D2D; font-weight: 600; }
  .cc-info-guest {
    background: #EAF5EA; color: #1a5c1a;
    border-radius: var(--r-sm, 6px); padding: 10px 14px;
    font-size: 13px;
  }
  .cc-btn-primary {
    width: 100%; padding: 13px; border-radius: 50px;
    background: var(--g700); color: #fff;
    border: none; font-size: 14px; font-weight: 700; font-family: var(--ff-body);
    cursor: pointer; transition: background .2s, transform .15s;
  }
  .cc-btn-primary:hover:not(:disabled) { background: var(--g900); transform: translateY(-1px); }
  .cc-btn-primary:disabled { opacity: .5; cursor: not-allowed; }
  .cc-link-login {
    font-size: 13px; color: var(--g500);
    text-decoration: underline; font-family: var(--ff-body);
  }
  .cc-link-login:hover { color: var(--g700); }
  @media (max-width: 768px) { .cc-grid { grid-template-columns: 1fr; } }
`
