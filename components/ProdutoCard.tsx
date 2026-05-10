'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

interface Props {
  id: number
  nome: string
  codigo: string
  preco: number
  imagemURL: string
  imagens?: string[]
  destaque?: boolean
  estoque?: number
  descricao?: string
}

export default function ProdutoCard({
  id,
  nome,
  codigo,
  preco,
  imagemURL,
  imagens = [],
  destaque,
  estoque,
  descricao,
}: Props) {
  const { addItem } = useCart()
  const [imgIndex, setImgIndex] = useState(0)

  const imgs = imagens.length > 0 ? imagens : [imagemURL].filter(Boolean)
  const temMultiplas = imgs.length > 1
  const checkoutHref = `/checkout?id=${id}&nome=${encodeURIComponent(nome)}&preco=${preco}`
  const imgAtual = imgs[imgIndex] || ''
  const produtoHref = codigo ? `/produto/${codigo}` : null

  const imgAreaInner = (
    <>
      {imgAtual ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgAtual}
          alt={nome}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity .25s ease' }}
        />
      ) : (
        <div className="pcd-img-fallback">🎣</div>
      )}

      {temMultiplas && (
        <>
          <button
            className="pcd-arrow pcd-arrow-l"
            onClick={e => { e.preventDefault(); e.stopPropagation(); setImgIndex(i => (i - 1 + imgs.length) % imgs.length) }}
          >‹</button>
          <button
            className="pcd-arrow pcd-arrow-r"
            onClick={e => { e.preventDefault(); e.stopPropagation(); setImgIndex(i => (i + 1) % imgs.length) }}
          >›</button>
        </>
      )}

      {temMultiplas && (
        <div className="pcd-dots">
          {imgs.map((_, i) => (
            <div
              key={i}
              onClick={e => { e.preventDefault(); e.stopPropagation(); setImgIndex(i) }}
              style={{
                width: i === imgIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === imgIndex ? '#fff' : 'rgba(255,255,255,.5)',
                cursor: 'pointer',
                transition: 'all .2s',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}

      {destaque && <div className="pcd-badge-dest">⭐ Destaque</div>}
      {estoque !== undefined && estoque <= 5 && (
        <div className="pcd-badge-estoque">Estoque baixo</div>
      )}
    </>
  )

  return (
    <>
      <style>{styles}</style>

      {/* Área da imagem com carrossel */}
      {produtoHref ? (
        <Link href={produtoHref} className="pcd-img-area">{imgAreaInner}</Link>
      ) : (
        <div className="pcd-img-area">{imgAreaInner}</div>
      )}

      {/* Corpo do card */}
      <div className="pcd-body">
        {produtoHref ? (
          <Link href={produtoHref} className="pcd-nome">{nome}</Link>
        ) : (
          <span className="pcd-nome">{nome}</span>
        )}
        {descricao && <p className="pcd-desc">{descricao}</p>}
        <p className="pcd-preco">{fmt(preco)}</p>

        <div className="pcd-actions">
          <button
            className="pcd-btn-add"
            onClick={() => addItem({ id, nome, preco, imagemURL: imgAtual || imagemURL })}
          >
            Adicionar ao carrinho
          </button>
          <Link href={checkoutHref} className="pcd-btn-comprar">
            Comprar agora
          </Link>
        </div>
      </div>
    </>
  )
}

const styles = `
  .pcd-img-area {
    display: block;
    position: relative; aspect-ratio: 1; overflow: hidden;
    background: var(--g50);
  }
  .pcd-img-fallback {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center; font-size: 56px;
  }
  .pcd-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 28px; height: 28px; border-radius: 50%;
    background: rgba(0,0,0,.45); color: #fff;
    border: none; cursor: pointer; font-size: 18px;
    display: flex; align-items: center; justify-content: center;
    z-index: 2; opacity: 0; transition: opacity .2s, background .15s;
  }
  .pcd-img-area:hover .pcd-arrow { opacity: 1; }
  .pcd-arrow:hover { background: rgba(0,0,0,.65) !important; }
  .pcd-arrow-l { left: 6px; }
  .pcd-arrow-r { right: 6px; }
  .pcd-dots {
    position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 4px; z-index: 2;
  }
  .pcd-badge-dest {
    position: absolute; top: 8px; left: 8px;
    background: var(--a500); color: #fff;
    font-size: 10px; font-weight: 700;
    padding: 3px 10px; border-radius: 20px; z-index: 2;
  }
  .pcd-badge-estoque {
    position: absolute; top: 8px; right: 8px;
    background: #ef4444; color: #fff;
    font-size: 10px; font-weight: 700;
    padding: 3px 10px; border-radius: 20px; z-index: 2;
  }
  .pcd-body { padding: 20px; }
  .pcd-nome {
    display: block;
    font-size: 15px; font-weight: 600; color: var(--dark);
    margin-bottom: 8px;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden; line-height: 1.45;
    text-decoration: none; transition: color .15s;
  }
  .pcd-nome:hover { color: var(--g700); }
  .pcd-desc {
    font-size: 12px; color: var(--muted); margin-bottom: 8px;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5;
  }
  .pcd-preco {
    font-family: var(--ff-display); font-size: 26px;
    color: var(--g900); letter-spacing: .02em; margin-bottom: 16px;
  }
  .pcd-actions { display: flex; flex-direction: column; gap: 8px; }
  .pcd-btn-add {
    display: block; width: 100%; text-align: center;
    background: transparent; border: 1.5px solid var(--g700); color: var(--g700);
    font-family: var(--ff-body); font-weight: 600; font-size: 13px;
    padding: 11px 16px; border-radius: 50px; cursor: pointer; transition: all .2s;
  }
  .pcd-btn-add:hover { background: var(--g50); border-color: var(--g900); color: var(--g900); }
  .pcd-btn-comprar {
    display: block; text-align: center;
    background: var(--g700); color: #fff;
    font-weight: 700; font-size: 13px; padding: 12px 16px; border-radius: 50px;
    box-shadow: var(--sh-btn-g); transition: background .2s, transform .2s;
  }
  .pcd-btn-comprar:hover { background: var(--g900); transform: translateY(-2px); }
`
