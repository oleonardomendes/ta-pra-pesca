'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { dimensoesProdutos, dimensoesPadrao } from '@/data/dimensoes'
import StoreHeader from '@/components/StoreHeader'

const CheckoutForm = nextDynamic(
  () => import('@/components/CheckoutForm'),
  { ssr: false }
)

function CheckoutContent() {
  const searchParams = useSearchParams()

  const id = searchParams.get('id') || ''
  const nome = decodeURIComponent(searchParams.get('nome') || '')
  const preco = Number(searchParams.get('preco') || 0)
  const codigo = searchParams.get('codigo') || id
  const dimensoes = dimensoesProdutos[codigo] ?? dimensoesPadrao

  if (!id || !nome || !preco) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--cream)',
      flexDirection: 'column', gap: '16px' }}>
      <div style={{ color: 'var(--muted)', fontSize: '14px' }}>Produto não encontrado</div>
      <a href="/" style={{ color: 'var(--g500)', fontWeight: '600' }}>Voltar para a loja</a>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', padding: '40px 5%' }}>
      <a href="/" style={{ color: 'var(--muted)', fontSize: '14px', fontWeight: '500',
        display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '32px' }}>
        ← Voltar para a loja
      </a>
      <div style={{ maxWidth: '640px', margin: '0 auto', background: '#fff',
        border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '32px' }}>
        <CheckoutForm
          kitNome={nome}
          kitPreco={preco}
          backUrls={{
            success: `https://taprapesca.com.br/obrigado?id=${id}&nome=${encodeURIComponent(nome)}&preco=${preco}`,
            failure: 'https://taprapesca.com.br',
            pending: `https://taprapesca.com.br/obrigado?id=${id}&nome=${encodeURIComponent(nome)}&preco=${preco}`,
          }}
          produtosParaFrete={[{ id, codigo, nome, valor: preco, quantidade: 1, ...dimensoes }]}
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
    <>
      <StoreHeader />
      <Suspense fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'var(--cream)',
          color: 'var(--muted)', fontSize: '14px' }}>
          Carregando...
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </>
  )
}
