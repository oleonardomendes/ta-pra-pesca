'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ProdutoCard from '@/components/ProdutoCard'
import FiltroCategorias from '@/components/FiltroCategorias'
import { useCart } from '@/contexts/CartContext'

export interface BlingProduto {
  id: number
  nome: string
  preco: number
  precoCusto: number
  imagemURL: string
  imagens: string[]
  estoque: number
  codigo: string
  descricao: string
  categoria: string
  video_url?: string | null
  destaque?: boolean
}

interface Props {
  produtos: BlingProduto[]
  initialCategoria?: string
  initialBusca?: string
}

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

function ImageWithFallback({ src, alt, height = 260 }: { src: string; alt: string; height?: number }) {
  const [err, setErr] = useState(false)

  if (!src || err) {
    return (
      <div style={{ width: '100%', height, background: 'var(--g50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>
        🎣
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={600}
      height={600}
      quality={85}
      sizes="(max-width: 768px) 50vw, 33vw"
      style={{ objectFit: 'contain', background: '#E8F7F2', width: '100%', height, display: 'block' }}
      onError={() => setErr(true)}
    />
  )
}

export default function LojaGrid({ produtos, initialCategoria = '', initialBusca = '' }: Props) {
  const [categoriaAtiva, setCategoriaAtiva] = useState(initialCategoria || 'Todos')
  const [busca, setBusca] = useState(initialBusca)
  const { addItem } = useCart()

  const destaques = produtos.filter(p => p.destaque)

  const categorias = ['Todos', ...Array.from(
    new Set(produtos.map(p => p.categoria).filter(Boolean))
  ).sort()]

  const filtered = produtos
    .filter(p => categoriaAtiva === 'Todos' || p.categoria === categoriaAtiva)
    .filter(p => {
      if (!busca.trim()) return true
      const q = busca.toLowerCase()
      return p.nome.toLowerCase().includes(q) || p.descricao.toLowerCase().includes(q)
    })

  return (
    <>
      <style>{gridStyles}</style>

      {/* ── Seção de Destaques ─────────────────────────── */}
      {destaques.length > 0 && (
        <section className="dest-section">
          <p className="dest-eyebrow">DESTAQUES</p>
          <h2 className="dest-titulo">PRODUTOS SELECIONADOS</h2>
          <div className="dest-scroll">
            {destaques.map(produto => {
              const imgSrc = produto.imagens?.[0] || produto.imagemURL
              const checkoutHref = `/checkout?id=${produto.id}&codigo=${encodeURIComponent(produto.codigo)}&nome=${encodeURIComponent(produto.nome)}&preco=${produto.preco}`
              return (
                <article key={produto.id} className="dest-card">
                  <Link href={`/produto/${produto.codigo}`} className="dest-img-wrapper">
                    <ImageWithFallback src={imgSrc} alt={produto.nome} />
                    <span className="dest-badge">⭐ Destaque</span>
                    {produto.estoque <= 5 && (
                      <span className="dest-badge-estoque">Estoque baixo</span>
                    )}
                  </Link>
                  <div className="dest-body">
                    <Link href={`/produto/${produto.codigo}`} className="dest-nome">{produto.nome}</Link>
                    {produto.descricao && <p className="dest-desc">{produto.descricao}</p>}
                    <p className="dest-preco">{fmt(produto.preco)}</p>
                    <div className="pcd-actions">
                      <button
                        className="pcd-btn-add"
                        onClick={() => addItem({ id: produto.id, nome: produto.nome, preco: produto.preco, imagemURL: imgSrc })}
                      >
                        Adicionar ao carrinho
                      </button>
                      <Link href={checkoutHref} className="pcd-btn-comprar">
                        Comprar agora
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Busca client-side ─────────────────────────── */}
      <div className="lg-busca-wrap">
        <svg className="lg-busca-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="search"
          className="lg-busca-input"
          placeholder="Buscar produto por nome…"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          aria-label="Buscar produto"
        />
        {busca && (
          <button className="lg-busca-clear" onClick={() => setBusca('')} aria-label="Limpar busca">✕</button>
        )}
      </div>

      {/* ── Filtro de categorias ───────────────────────── */}
      <FiltroCategorias
        categorias={categorias}
        categoriaAtiva={categoriaAtiva}
        onFiltrar={setCategoriaAtiva}
      />

      {/* ── Grid principal ─────────────────────────────── */}
      <div className="grid-section">
        {filtered.length === 0 ? (
          <div className="grid-vazio">
            {produtos.length === 0
              ? 'Nenhum produto disponível no momento.'
              : busca.trim()
                ? <>Nenhum produto encontrado para &ldquo;<strong>{busca}</strong>&rdquo;.{' '}
                    <button className="grid-vazio-link" onClick={() => setBusca('')}>Ver todos os produtos →</button></>
                : `Nenhum produto em "${categoriaAtiva}".`
            }
          </div>
        ) : (
          <div className="produtos-grid">
            {filtered.map(produto => (
              <article key={produto.id} className="produto-card">
                <ProdutoCard
                  id={produto.id}
                  nome={produto.nome}
                  codigo={produto.codigo}
                  preco={produto.preco}
                  imagemURL={produto.imagemURL}
                  imagens={produto.imagens}
                  destaque={produto.destaque}
                  estoque={produto.estoque}
                  descricao={produto.descricao}
                />
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

const gridStyles = `
  /* ── Destaques ── */
  .dest-section {
    background: var(--cream);
    padding: 56px 6% 48px;
    border-bottom: 1px solid var(--border);
  }
  .dest-eyebrow {
    font-size: 11px; font-weight: 700; letter-spacing: .16em;
    text-transform: uppercase; color: var(--g500); margin-bottom: 10px;
  }
  .dest-titulo {
    font-family: var(--ff-display);
    font-size: clamp(28px, 4vw, 42px);
    color: var(--g900); letter-spacing: .03em; margin-bottom: 28px;
  }
  .dest-scroll {
    display: flex; gap: 20px;
    overflow-x: auto; padding-bottom: 8px; scrollbar-width: none;
  }
  .dest-scroll::-webkit-scrollbar { display: none; }
  .dest-card {
    background: #fff; border: 1px solid var(--border);
    border-radius: var(--r-lg); overflow: hidden;
    box-shadow: var(--sh-card);
    min-width: 280px; max-width: 320px; flex-shrink: 0;
    transition: transform .22s, box-shadow .22s;
  }
  .dest-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(10,61,43,.12); }
  .dest-img-wrapper {
    display: block; position: relative; width: 100%; overflow: hidden;
  }
  .dest-badge {
    position: absolute; top: 12px; left: 12px;
    background: #f59e0b; color: #fff;
    font-size: 11px; font-weight: 700;
    padding: 4px 10px; border-radius: 50px; z-index: 1;
  }
  .dest-badge-estoque {
    position: absolute; top: 12px; right: 12px;
    background: #ef4444; color: #fff;
    font-size: 11px; font-weight: 700;
    padding: 4px 10px; border-radius: 50px; z-index: 1;
  }
  .dest-body { padding: 20px; }
  .dest-nome {
    display: block;
    font-size: 15px; font-weight: 600; color: var(--dark);
    margin-bottom: 6px;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden; line-height: 1.45;
    text-decoration: none; transition: color .15s;
  }
  .dest-nome:hover { color: var(--g700); }
  .dest-desc {
    font-size: 12px; color: var(--muted); margin-bottom: 8px;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5;
  }
  .dest-preco {
    font-family: var(--ff-display); font-size: 26px;
    color: var(--g900); letter-spacing: .02em; margin-bottom: 16px;
  }
  /* ── Botões compartilhados (destaques + ProdutoCard) ── */
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
  /* ── Busca ── */
  .lg-busca-wrap {
    display: flex; align-items: center; gap: 10px;
    background: #fff; border: 1.5px solid var(--border);
    border-radius: 50px; padding: 0 16px; height: 44px;
    margin: 0 6% 0; transition: border-color .2s;
  }
  .lg-busca-wrap:focus-within { border-color: var(--g500); }
  .lg-busca-icon { color: var(--muted); flex-shrink: 0; width: 16px; height: 16px; }
  .lg-busca-input {
    flex: 1; border: none; background: transparent; outline: none;
    font-family: var(--ff-body); font-size: 14px; color: var(--dark);
  }
  .lg-busca-input::placeholder { color: var(--muted); }
  .lg-busca-input::-webkit-search-cancel-button { -webkit-appearance: none; }
  .lg-busca-clear {
    background: none; border: none; color: var(--muted);
    font-size: 12px; cursor: pointer; padding: 4px; line-height: 1;
    transition: color .15s;
  }
  .lg-busca-clear:hover { color: var(--dark); }
  /* ── Grid principal ── */
  .grid-section { background: var(--cream); padding: 40px 6% 80px; }
  .grid-vazio {
    text-align: center; padding: 60px 0;
    color: var(--muted); font-size: 16px;
  }
  .grid-vazio-link {
    background: none; border: none; color: var(--g700);
    font-size: 16px; font-weight: 600; cursor: pointer;
    text-decoration: underline; font-family: var(--ff-body);
  }
  .produtos-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
  }
  .produto-card {
    background: #fff; border: 1px solid var(--border);
    border-radius: var(--r-lg); overflow: hidden;
    box-shadow: var(--sh-card); transition: transform .22s, box-shadow .22s;
  }
  .produto-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(10,61,43,.12); }
  @media (max-width: 1024px) { .produtos-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px) {
    .produtos-grid { grid-template-columns: 1fr; gap: 16px; }
    .grid-section { padding: 32px 5% 60px; }
    .dest-section { padding: 40px 5% 32px; }
    .dest-card { min-width: 240px; }
  }
`
