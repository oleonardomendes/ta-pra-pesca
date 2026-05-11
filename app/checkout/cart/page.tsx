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

export default function CartCheckoutPage() {
  const { items, totalPreco } = useCart()
  const router = useRouter()
  const [checkoutUrl, setCheckoutUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (items.length === 0) {
      router.replace('/')
      return
    }

    void (async () => {
    trackBeginCheckout(
      totalPreco,
      items.map(i => ({ item_id: String(i.id), item_name: i.nome, price: i.preco, quantity: i.quantidade }))
    )

    const supabase = createSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()

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
      })
      .catch(e => setError(String(e.message)))
      .finally(() => setLoading(false))
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (items.length === 0) return null

  return (
    <>
      <style>{styles}</style>

      <div className="cc-page">
        <Link href="/" className="cc-back">← Continuar comprando</Link>

        {loading ? (
          <div className="cc-loading">Preparando seu checkout…</div>
        ) : error ? (
          <div className="cc-error">
            Erro ao iniciar o checkout.{' '}
            <Link href="/" style={{ color: 'var(--g500)' }}>Voltar</Link>
          </div>
        ) : (
          <div className="cc-grid">
            {/* Resumo */}
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

            {/* Brick */}
            <div className="cc-brick-wrap">
              <div className="cc-label">Forma de pagamento</div>
              {checkoutUrl && (
                <MPCheckout
                  checkoutUrl={checkoutUrl}
                  kitNome="Pedido Tá Pra Pesca"
                  kitPreco={totalPreco}
                />
              )}
            </div>
          </div>
        )}
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
  @media (max-width: 768px) { .cc-grid { grid-template-columns: 1fr; } }
`
