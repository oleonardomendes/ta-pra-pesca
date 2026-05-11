import { notFound } from 'next/navigation'
import Link from 'next/link'
import nextDynamic from 'next/dynamic'
import { Suspense } from 'react'
import { dimensoesProdutos, dimensoesPadrao } from '@/data/dimensoes'

export const dynamic = 'force-dynamic'

const CheckoutPageClient = nextDynamic(
  () => import('@/components/CheckoutPageClient'),
  { ssr: false }
)

const fallback = (
  <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
    Carregando...
  </div>
)

interface Props {
  searchParams: { nome?: string; preco?: string; id?: string; codigo?: string }
}

export default async function CheckoutPage({ searchParams }: Props) {
  const { nome, preco, id, codigo } = searchParams

  if (!nome || !preco || !id) notFound()

  const kitPreco = Number(preco)
  const dimensoes = dimensoesProdutos[String(codigo || id)] ?? dimensoesPadrao

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://taprapesca.com.br'
  const res = await fetch(`${baseUrl}/api/mp/create-preference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kitId: id,
      kitNome: nome,
      kitPreco,
      backUrls: {
        success: `https://taprapesca.com.br/obrigado?id=${id}&nome=${encodeURIComponent(String(nome))}&preco=${kitPreco}`,
        failure: 'https://taprapesca.com.br',
        pending: `https://taprapesca.com.br/obrigado?id=${id}&nome=${encodeURIComponent(String(nome))}&preco=${kitPreco}`,
      },
    }),
    cache: 'no-store',
  })

  const { preferenceId, error } = await res.json()

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
          Erro ao iniciar o checkout.{' '}
          <Link href="/" style={{ color: 'var(--g500)' }}>Voltar</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', padding: '40px 5%' }}>
      <Link
        href="/"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '14px', fontWeight: '500', marginBottom: '32px' }}
      >
        ← Voltar para a loja
      </Link>

      <div style={{ maxWidth: '640px', margin: '0 auto', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '32px' }}>
        <Suspense fallback={fallback}>
          <CheckoutPageClient
            kitNome={String(nome)}
            kitPreco={kitPreco}
            preferenceId={preferenceId}
            produtosParaFrete={[{
              id: String(id),
              nome: String(nome),
              valor: kitPreco,
              quantidade: 1,
              ...dimensoes,
            }]}
          />
        </Suspense>
      </div>
    </div>
  )
}
