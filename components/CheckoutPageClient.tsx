'use client'

import CheckoutForm from '@/components/CheckoutForm'

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
  preferenceId: string
  produtosParaFrete: ProdutoFrete[]
}

export default function CheckoutPageClient({ kitNome, kitPreco, preferenceId, produtosParaFrete }: Props) {
  return (
    <CheckoutForm
      kitNome={kitNome}
      kitPreco={kitPreco}
      preferenceId={preferenceId}
      produtosParaFrete={produtosParaFrete}
      onFreteSelected={(frete) => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('checkout_frete', JSON.stringify(frete))
        }
      }}
      onEnderecoComplete={(dados) => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('checkout_dados', JSON.stringify(dados))
        }
      }}
    />
  )
}
