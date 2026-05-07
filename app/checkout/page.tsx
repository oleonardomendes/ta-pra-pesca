import { notFound } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import Link from 'next/link'

const MPCheckoutBrick = nextDynamic(() => import('@/components/MPCheckoutBrick'), { ssr: false })

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: { nome?: string; preco?: string; id?: string }
}

export default async function CheckoutPage({ searchParams }: Props) {
  const { nome, preco, id } = searchParams

  if (!nome || !preco || !id) notFound()

  const kitPreco = Number(preco)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://taprapesca.com.br'

  const res = await fetch(`${baseUrl}/api/mp/create-preference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kitId: id,
      kitNome: nome,
      kitPreco,
      backUrls: {
        success: 'https://taprapesca.com.br/obrigado',
        failure: 'https://taprapesca.com.br',
        pending: 'https://taprapesca.com.br/obrigado',
      },
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
          font-size: 24px; color: var(--g900);
          letter-spacing: .03em; line-height: 1.1; margin-bottom: 20px;
        }
        .checkout-total {
          border-top: 1px solid var(--border);
          padding-top: 16px;
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
        <Link href="/" className="checkout-back">← Voltar para a loja</Link>

        {error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
            Erro ao iniciar o checkout.{' '}
            <Link href="/" style={{ color: 'var(--g500)' }}>Voltar</Link>
          </div>
        ) : (
          <div className="checkout-grid">
            <div className="checkout-summary">
              <div className="checkout-summary-label">Resumo do pedido</div>
              <div className="checkout-kit-name">{nome}</div>
              <div className="checkout-total">
                <div className="checkout-total-label">Total</div>
                <div className="checkout-total-val">
                  R$ {kitPreco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="checkout-brick-wrap">
              <div className="checkout-brick-label">Forma de pagamento</div>
              <MPCheckoutBrick
                preferenceId={preferenceId}
                kitNome={nome}
                kitPreco={kitPreco}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
