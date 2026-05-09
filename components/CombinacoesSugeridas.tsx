'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

interface Produto {
  id: number
  nome: string
  codigo: string
  preco: number
  imagemURL: string
}

interface Props {
  produtoAtual: Produto
  combinacoes: Produto[]
}

export default function CombinacoesSugeridas({ produtoAtual, combinacoes }: Props) {
  const { addItem } = useCart()

  const todos = [produtoAtual, ...combinacoes]
  const total = todos.reduce((acc, p) => acc + p.preco, 0)

  function adicionarTudo() {
    todos.forEach(p => addItem({ id: p.id, nome: p.nome, preco: p.preco, imagemURL: p.imagemURL }))
  }

  return (
    <>
      <style>{combStyles}</style>
      <section className="comb-section">
        <div className="comb-header">
          <p className="comb-eyebrow">COMBO PERFEITO</p>
          <h2 className="comb-title">Monte seu kit completo 🎣</h2>
          <p className="comb-sub">Esses produtos combinam perfeitamente</p>
        </div>

        <div className="comb-cards">
          {todos.map((p, i) => (
            <Fragment key={p.id}>
              <Link href={`/produto/${p.codigo}`} className="comb-card">
                {p.imagemURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imagemURL} alt={p.nome} className="comb-img" />
                ) : (
                  <div className="comb-img comb-img-fallback">🎣</div>
                )}
                <div className="comb-card-info">
                  <p className="comb-card-nome">
                    {p.nome.length > 40 ? p.nome.slice(0, 40) + '…' : p.nome}
                  </p>
                  <p className="comb-card-preco">{fmt(p.preco)}</p>
                </div>
              </Link>
              {i < todos.length - 1 && <span className="comb-plus">+</span>}
            </Fragment>
          ))}
        </div>

        <div className="comb-total">
          <p className="comb-total-label">Kit completo por</p>
          <p className="comb-total-valor">{fmt(total)}</p>
          <button className="comb-btn-todos" onClick={adicionarTudo}>
            Adicionar tudo ao carrinho
          </button>
        </div>
      </section>
    </>
  )
}

const combStyles = `
  .comb-section {
    background: #fff;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 56px 6%;
  }
  .comb-header { text-align: center; margin-bottom: 40px; }
  .comb-eyebrow {
    font-size: 11px; font-weight: 700; letter-spacing: .16em;
    text-transform: uppercase; color: var(--g500); margin-bottom: 8px;
  }
  .comb-title {
    font-family: var(--ff-display);
    font-size: clamp(28px, 4vw, 42px);
    color: var(--g900); letter-spacing: .03em; margin-bottom: 8px;
  }
  .comb-sub { font-size: 15px; color: var(--muted); }
  .comb-cards {
    display: flex; align-items: center; justify-content: center;
    gap: 16px; flex-wrap: wrap; margin-bottom: 40px;
  }
  .comb-card {
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    background: var(--cream); border: 1px solid var(--border);
    border-radius: var(--r-md); padding: 16px;
    text-decoration: none; color: var(--dark);
    transition: box-shadow .2s, transform .2s;
    max-width: 160px; min-width: 130px;
  }
  .comb-card:hover { box-shadow: var(--sh-card); transform: translateY(-2px); }
  .comb-img {
    width: 80px; height: 80px; object-fit: contain;
    border-radius: 8px; background: var(--g50);
  }
  .comb-img-fallback {
    display: flex; align-items: center; justify-content: center; font-size: 36px;
  }
  .comb-card-info { text-align: center; }
  .comb-card-nome {
    font-size: 12px; font-weight: 600; color: var(--dark);
    line-height: 1.4; margin-bottom: 4px;
  }
  .comb-card-preco {
    font-family: var(--ff-display); font-size: 18px; color: var(--g700);
  }
  .comb-plus {
    font-size: 28px; font-weight: 700; color: var(--muted); flex-shrink: 0;
  }
  .comb-total { text-align: center; }
  .comb-total-label { font-size: 14px; color: var(--muted); margin-bottom: 4px; }
  .comb-total-valor {
    font-family: var(--ff-display); font-size: 42px; color: var(--a500);
    letter-spacing: .02em; margin-bottom: 20px;
  }
  .comb-btn-todos {
    background: var(--g700); color: #fff;
    font-family: var(--ff-body); font-weight: 700; font-size: 15px;
    padding: 14px 40px; border-radius: 50px; border: none; cursor: pointer;
    box-shadow: var(--sh-btn-g); transition: background .2s, transform .2s;
  }
  .comb-btn-todos:hover { background: var(--g900); transform: translateY(-2px); }
`
