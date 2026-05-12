'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { kits } from '@/data/kits'

const CheckoutForm = nextDynamic(
  () => import('@/components/CheckoutForm'),
  { ssr: false }
)

function CheckoutContent() {
  const searchParams = useSearchParams()

  const kitId = Number(searchParams.get('kit'))
  const kit = kits.find(k => k.id === kitId)

  if (!kit) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--cream)',
      flexDirection: 'column', gap: '16px' }}>
      <div style={{ color: 'var(--muted)', fontSize: '14px' }}>Kit não encontrado</div>
      <a href="/kits" style={{ color: 'var(--g500)', fontWeight: '600' }}>Voltar para os kits</a>
    </div>
  )

  const kitDimensoes = {
    peso: Math.min(kit.price * 0.002 + 0.5, 5),
    altura: 20,
    largura: 20,
    comprimento: 40,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', padding: '40px 5%' }}>
      <a href="/kits" style={{ color: 'var(--muted)', fontSize: '14px', fontWeight: '500',
        display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '32px' }}>
        ← Voltar para os kits
      </a>
      <div style={{ maxWidth: '640px', margin: '0 auto', background: '#fff',
        border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '32px' }}>
        <CheckoutForm
          kitNome={`${kit.name} ${kit.nameBreak}`}
          kitPreco={kit.price}
          backUrls={{
            success: `https://taprapesca.com.br/kits/obrigado?kit=${kit.id}`,
            failure: 'https://taprapesca.com.br/kits',
            pending: `https://taprapesca.com.br/kits/obrigado?kit=${kit.id}`,
          }}
          produtosParaFrete={[{
            id: String(kit.id),
            nome: `${kit.name} ${kit.nameBreak}`,
            valor: kit.price,
            quantidade: 1,
            ...kitDimensoes,
          }]}
          onEnderecoComplete={(dados) => {
            sessionStorage.setItem('checkout_dados', JSON.stringify(dados))
          }}
          onFreteSelected={() => {}}
        />
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--cream)',
        color: 'var(--muted)', fontSize: '14px' }}>
        Carregando...
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
