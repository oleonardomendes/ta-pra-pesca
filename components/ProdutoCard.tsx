'use client'

import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'

interface Props {
  id: number
  nome: string
  preco: number
  imagemURL: string
}

export default function ProdutoCard({ id, nome, preco, imagemURL }: Props) {
  const { addItem } = useCart()

  const checkoutHref = `/checkout?id=${id}&nome=${encodeURIComponent(nome)}&preco=${preco}`

  return (
    <div className="pcd-actions">
      <button
        className="pcd-btn-add"
        onClick={() => addItem({ id, nome, preco, imagemURL })}
      >
        Adicionar ao carrinho
      </button>
      <Link href={checkoutHref} className="pcd-btn-comprar">
        Comprar agora
      </Link>
    </div>
  )
}
