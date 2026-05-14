'use client'

import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { trackAddToCart } from '@/lib/analytics'

const WA = process.env.NEXT_PUBLIC_WA_NUMBER || '5511900000000'

interface Props {
  id: number
  nome: string
  preco: number
  imagemURL: string
  codigo: string
}

export default function ProdutoAcoes({ id, nome, preco, imagemURL, codigo }: Props) {
  const { addItem } = useCart()

  const waHref = `https://wa.me/${WA}?text=${encodeURIComponent(`Olá! Tenho interesse: ${nome}`)}`
  const checkoutHref = `/checkout?id=${id}&codigo=${encodeURIComponent(codigo)}&nome=${encodeURIComponent(nome)}&preco=${preco}`

  return (
    <>
      <style>{acaoStyles}</style>
      <div className="acao-btns">
        <button
          className="acao-btn-cart"
          onClick={() => {
            trackAddToCart({ id, nome, preco })
            addItem({ id, nome, preco, imagemURL })
          }}
        >
          Adicionar ao carrinho
        </button>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="acao-btn-wa"
        >
          Comprar pelo WhatsApp
        </a>
        <Link href={checkoutHref} className="acao-btn-comprar">
          Comprar agora
        </Link>
      </div>
    </>
  )
}

const acaoStyles = `
  .acao-btns { display: flex; flex-direction: column; gap: 10px; }
  .acao-btn-cart {
    display: block; width: 100%; text-align: center;
    background: var(--g700); color: #fff;
    font-family: var(--ff-body); font-weight: 700; font-size: 15px;
    padding: 15px 16px; border-radius: 50px; border: none; cursor: pointer;
    box-shadow: var(--sh-btn-g); transition: background .2s, transform .2s;
  }
  .acao-btn-cart:hover { background: var(--g900); transform: translateY(-2px); }
  .acao-btn-wa {
    display: block; text-align: center;
    background: transparent; color: var(--g700);
    border: 2px solid var(--g700);
    font-family: var(--ff-body); font-weight: 700; font-size: 15px;
    padding: 13px 16px; border-radius: 50px; text-decoration: none;
    transition: all .2s;
  }
  .acao-btn-wa:hover { background: var(--g50); }
  .acao-btn-comprar {
    display: block; text-align: center;
    background: var(--a500); color: #fff;
    font-family: var(--ff-body); font-weight: 700; font-size: 15px;
    padding: 15px 16px; border-radius: 50px; text-decoration: none;
    box-shadow: var(--sh-btn-a); transition: background .2s, transform .2s;
  }
  .acao-btn-comprar:hover { background: var(--a700); transform: translateY(-2px); }
`
