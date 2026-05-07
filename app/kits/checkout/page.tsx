import { kits } from '@/data/kits'
import { notFound } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import Link from 'next/link'

const MPCheckoutBrick = nextDynamic(() => import('@/components/MPCheckoutBrick'), { ssr: false })

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: { kit?: string }
}

export default async function CheckoutPage({ searchParams }: Props) {
  const kitId = Number(searchParams.kit)
  const kit = kits.find(k => k.id === kitId)
  if (!kit) notFound()

  // Criar preferência server-side
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://taprapesca.com.br'
  const res = await fetch(`${baseUrl}/api/mp/create-preference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kitId: kit.id,
      kitNome: `${kit.name} ${kit.nameBreak}`,
      kitPreco: kit.price,
    }),
    cache: 'no-store',
  })

  const { preferenceId, error } = await res.json()

  return (
    <>
      <style>{`
        .checkout-page {
          min-height: 100vh;
          background: var(--cream);
          padding: 40px 5%;
        }
        .checkout-back {
          display: inline-flex; align-items: center; gap: 8px;
          color: var(--muted); font-size: 14px; font-weight: 500;
          margin-bottom: 32px; transition: color .2s;
        }
        .checkout-back:hover { color: var(--g700); }
        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 1.6fr;
          gap: 32px;
          max-width: 960px;
          margin: 0 auto;
        }
        .checkout-summary {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--r-lg);
          padding: 28px;
          height: fit-content;
        }
        .checkout-summary-label {
          font-size: 11px; font-weight: 700;
          letter-spacing: .12em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 16px;
        }
        .checkout-kit-name {
          font-family: var(--ff-display);
          font-size: 28px; color: var(--g900);
          letter-spacing: .03em; line-height: 1; margin-bottom: 16px;
        }
        .checkout-kit-item {
          display: flex; gap: 8px; align-items: flex-start;
          font-size: 13px; color: var(--muted);
          margin-bottom: 8px; line-height: 1.4;
        }
        .checkout-kit-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--g500); margin-top: 5px; flex-shrink: 0;
        }
        .checkout-total {
          border-top: 1px solid var(--border);
          margin-top: 20px; padding-top: 16px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .checkout-total-label { font-size: 13px; color: var(--muted); font-weight: 500; }
        .checkout-total-val {
          font-family: var(--ff-display);
          font-size: 32px; color: var(--g700); letter-spacing: .02em;
        }
        .checkout-brick-wrap {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--r-lg);
          padding: 28px;
        }
        .checkout-brick-label {
          font-size: 11px; font-weight: 700;
          letter-spacing: .12em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 20px;
        }
        @media (max-width: 768px) {
          .checkout-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="checkout-page">
        <Link href="/kits" className="checkout-back">← Voltar para os kits</Link>

        {error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
            Erro ao iniciar o checkout. <Link href="/kits" style={{ color: 'var(--g500)' }}>Voltar</Link>
          </div>
        ) : (
          <div className="checkout-grid">
            <div className="checkout-summary">
              <div className="checkout-summary-label">Resumo do pedido</div>
              <div className="checkout-kit-name">{kit.name}<br />{kit.nameBreak}</div>
              {kit.items.map((item, i) => (
                <div className="checkout-kit-item" key={i}>
                  <div className="checkout-kit-dot" />
                  {item.text}
                </div>
              ))}
              {kit.bonus && (
                <div className="checkout-kit-item" style={{ color: 'var(--a700)', fontWeight: 600 }}>
                  <div className="checkout-kit-dot" style={{ background: 'var(--a500)' }} />
                  🎁 {kit.bonus.text}
                </div>
              )}
              <div className="checkout-total">
                <div className="checkout-total-label">Total</div>
                <div className="checkout-total-val">
                  R$ {kit.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#0F5C45', fontWeight: '600', marginTop: '8px' }}>
                ⚡ Com PIX: R$ {(kit.price * 0.95).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="checkout-brick-wrap">
              <div className="checkout-brick-label">Forma de pagamento</div>
              <MPCheckoutBrick
                preferenceId={preferenceId}
                kitNome={`${kit.name} ${kit.nameBreak}`}
                kitPreco={kit.price}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
