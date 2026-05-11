import { kits } from '@/data/kits'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-client'
import CheckoutPageClient from '@/components/CheckoutPageClient'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: { kit?: string }
}

export default async function CheckoutPage({ searchParams }: Props) {
  const kitId = Number(searchParams.kit)
  const kit = kits.find(k => k.id === kitId)
  if (!kit) notFound()

  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://taprapesca.com.br'
  const res = await fetch(`${baseUrl}/api/mp/create-preference`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': user?.id || '',
    },
    body: JSON.stringify({
      kitId: kit.id,
      kitNome: `${kit.name} ${kit.nameBreak}`,
      kitPreco: kit.price,
      backUrls: {
        success: `https://taprapesca.com.br/kits/obrigado?kit=${kit.id}`,
        failure: 'https://taprapesca.com.br/kits',
        pending: `https://taprapesca.com.br/kits/obrigado?kit=${kit.id}`,
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
          <Link href="/kits" style={{ color: 'var(--g500)' }}>Voltar</Link>
        </div>
      </div>
    )
  }

  // Dimensões da embalagem do kit: maior comprimento + soma dos pesos (estimativa)
  const kitDimensoes = {
    peso: Math.min(kit.price * 0.002 + 0.5, 5),   // estimativa por preço
    altura: 20,
    largura: 20,
    comprimento: 40,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', padding: '40px 5%' }}>
      <Link
        href="/kits"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '14px', fontWeight: '500', marginBottom: '32px' }}
      >
        ← Voltar para os kits
      </Link>

      <div style={{ maxWidth: '640px', margin: '0 auto', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '32px' }}>
        <CheckoutPageClient
          kitNome={`${kit.name} ${kit.nameBreak}`}
          kitPreco={kit.price}
          preferenceId={preferenceId}
          produtosParaFrete={[{
            id: String(kit.id),
            nome: `${kit.name} ${kit.nameBreak}`,
            valor: kit.price,
            quantidade: 1,
            ...kitDimensoes,
          }]}
        />
      </div>
    </div>
  )
}
