'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { dimensoesProdutos, dimensoesPadrao } from '@/data/dimensoes'

const CheckoutForm = nextDynamic(
  () => import('@/components/CheckoutForm'),
  { ssr: false }
)

function CheckoutContent() {
  const searchParams = useSearchParams()
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  const id = searchParams.get('id') || ''
  const nome = decodeURIComponent(searchParams.get('nome') || '')
  const preco = Number(searchParams.get('preco') || 0)
  const codigo = searchParams.get('codigo') || id
  const dimensoes = dimensoesProdutos[codigo] ?? dimensoesPadrao

  useEffect(() => {
    if (!id || !nome || !preco) {
      setErro('Produto não encontrado')
      setLoading(false)
      return
    }

    fetch('/api/mp/create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kitId: id,
        kitNome: nome,
        kitPreco: preco,
        backUrls: {
          success: `https://taprapesca.com.br/obrigado?id=${id}&nome=${encodeURIComponent(nome)}&preco=${preco}`,
          failure: 'https://taprapesca.com.br',
          pending: `https://taprapesca.com.br/obrigado?id=${id}&nome=${encodeURIComponent(nome)}&preco=${preco}`,
        },
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.preferenceId) {
          setPreferenceId(data.preferenceId)
          setCheckoutUrl(data.checkoutUrl || '')
        } else {
          setErro('Erro ao iniciar checkout')
        }
      })
      .catch(() => setErro('Erro ao iniciar checkout'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--cream)',
      color: 'var(--muted)', fontSize: '14px' }}>
      Preparando checkout...
    </div>
  )

  if (erro) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--cream)',
      flexDirection: 'column', gap: '16px' }}>
      <div style={{ color: 'var(--muted)', fontSize: '14px' }}>{erro}</div>
      <a href="/" style={{ color: 'var(--g500)', fontWeight: '600' }}>
        Voltar para a loja
      </a>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', padding: '40px 5%' }}>
      <a href="/" style={{ color: 'var(--muted)', fontSize: '14px', fontWeight: '500',
        display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '32px' }}>
        ← Voltar para a loja
      </a>
      {preferenceId && checkoutUrl && (
        <div style={{ maxWidth: '640px', margin: '0 auto', background: '#fff',
          border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '32px' }}>
          <CheckoutForm
            kitNome={nome}
            kitPreco={preco}
            preferenceId={preferenceId}
            checkoutUrl={checkoutUrl}
            produtosParaFrete={[{ id, nome, valor: preco, quantidade: 1, ...dimensoes }]}
            onEnderecoComplete={(dados) => {
              sessionStorage.setItem('checkout_dados', JSON.stringify(dados))
            }}
            onFreteSelected={() => {}}
          />
        </div>
      )}
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
