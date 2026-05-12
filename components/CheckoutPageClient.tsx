'use client'

import nextDynamic from 'next/dynamic'

const CheckoutForm = nextDynamic(
  () => import('@/components/CheckoutForm'),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
        Carregando checkout...
      </div>
    ),
  }
)

interface ProdutoFrete {
  id: string
  nome: string
  peso: number
  altura: number
  largura: number
  comprimento: number
  valor: number
  quantidade: number
}

interface Props {
  kitNome: string
  kitPreco: number
  backUrls?: { success: string; failure: string; pending: string }
  produtosParaFrete: ProdutoFrete[]
}

export default function CheckoutPageClient({ kitNome, kitPreco, backUrls, produtosParaFrete }: Props) {
  return (
    <CheckoutForm
      kitNome={kitNome}
      kitPreco={kitPreco}
      backUrls={backUrls}
      produtosParaFrete={produtosParaFrete}
      onFreteSelected={(frete) => {
        sessionStorage.setItem('checkout_frete', JSON.stringify(frete))
      }}
      onEnderecoComplete={(dados) => {
        sessionStorage.setItem('checkout_dados', JSON.stringify(dados))
      }}
    />
  )
}
