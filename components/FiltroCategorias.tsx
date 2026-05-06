"use client";

import { useState } from "react";
import Image from "next/image";
import ProdutoCard from "@/components/ProdutoCard";

export interface BlingProduto {
  id: number;
  nome: string;
  preco: number;
  precoCusto: number;
  imagemURL: string;
  estoque: number;
  codigo: string;
  descricao: string;
  categoria: string;
}

interface Props {
  produtos: BlingProduto[];
  waNumber?: string;
  initialCategoria?: string;
}

const KEYWORDS = ["Vara", "Molinete", "Carretilha", "Linha"];

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

function ImageWithFallback({ src, alt }: { src: string; alt: string }) {
  const [err, setErr] = useState(false);

  if (!src || err) {
    return (
      <div className="card-img-fallback">
        <span>🎣</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={600}
      height={600}
      quality={85}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="card-img"
      style={{ objectFit: "contain", background: "#E8F7F2" }}
      onError={() => setErr(true)}
    />
  );
}

export default function FiltroCategorias({ produtos, initialCategoria = "" }: Props) {
  const [selected, setSelected] = useState(initialCategoria || "Todos");

  const categoriasDisponiveis = [
    "Todos",
    ...KEYWORDS.filter((kw) =>
      produtos.some((p) => p.nome.toLowerCase().includes(kw.toLowerCase()))
    ),
  ];

  const filtered =
    selected === "Todos"
      ? produtos
      : produtos.filter((p) =>
          p.nome.toLowerCase().includes(selected.toLowerCase())
        );

  return (
    <>
      <style>{filtroStyles}</style>

      <div className="filtro-section">
        <div className="filtro-pills">
          {categoriasDisponiveis.map((cat) => (
            <button
              key={cat}
              className={`filtro-pill${selected === cat ? " active" : ""}`}
              onClick={() => setSelected(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-section">
        {filtered.length === 0 ? (
          <p className="grid-vazio">
            {produtos.length === 0
              ? "Nenhum produto disponível no momento."
              : `Nenhum produto encontrado para "${selected}".`}
          </p>
        ) : (
          <div className="produtos-grid">
            {filtered.map((produto) => {
              return (
                <article key={produto.id} className="produto-card">
                  <div className="card-img-wrapper">
                    <ImageWithFallback
                      src={produto.imagemURL}
                      alt={produto.nome}
                    />
                    {produto.estoque <= 5 && (
                      <span className="badge-estoque">Estoque baixo</span>
                    )}
                  </div>
                  <div className="card-body">
                    <p className="card-nome">{produto.nome}</p>
                    <p className="card-preco">{fmt(produto.preco)}</p>
                    <ProdutoCard
                      id={produto.id}
                      nome={produto.nome}
                      preco={produto.preco}
                      imagemURL={produto.imagemURL}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

const filtroStyles = `
  .filtro-section {
    background: var(--cream);
    padding: 48px 6% 0;
  }
  .filtro-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .filtro-pill {
    padding: 8px 20px;
    border-radius: 50px;
    border: 1.5px solid var(--border);
    background: transparent;
    color: var(--muted);
    font-family: var(--ff-body);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all .2s;
  }
  .filtro-pill:hover {
    border-color: var(--g500);
    color: var(--g700);
  }
  .filtro-pill.active {
    background: var(--g900);
    color: #fff;
    border-color: var(--g900);
  }
  .grid-section {
    background: var(--cream);
    padding: 40px 6% 80px;
  }
  .grid-vazio {
    text-align: center;
    padding: 60px 0;
    color: var(--muted);
    font-size: 16px;
  }
  .produtos-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  .produto-card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    overflow: hidden;
    box-shadow: var(--sh-card);
    transition: transform .22s, box-shadow .22s;
  }
  .produto-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(10,61,43,.12);
  }
  .card-img-wrapper {
    position: relative;
    width: 100%;
    overflow: hidden;
  }
  .card-img {
    width: 100% !important;
    height: 220px !important;
    display: block;
  }
  .card-img-fallback {
    width: 100%;
    height: 220px;
    background: var(--g50);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 56px;
  }
  .badge-estoque {
    position: absolute;
    top: 12px; right: 12px;
    background: var(--a500);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 50px;
  }
  .card-body { padding: 20px; }
  .card-nome {
    font-size: 15px;
    font-weight: 600;
    color: var(--dark);
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.45;
  }
  .card-preco {
    font-family: var(--ff-display);
    font-size: 26px;
    color: var(--g900);
    letter-spacing: .02em;
    margin-bottom: 16px;
  }
  .pcd-actions { display: flex; flex-direction: column; gap: 8px; }
  .pcd-btn-add {
    display: block; width: 100%; text-align: center;
    background: transparent;
    border: 1.5px solid var(--g700);
    color: var(--g700);
    font-family: var(--ff-body);
    font-weight: 600; font-size: 13px;
    padding: 11px 16px; border-radius: 50px;
    cursor: pointer; transition: all .2s;
  }
  .pcd-btn-add:hover {
    background: var(--g50);
    border-color: var(--g900);
    color: var(--g900);
  }
  .pcd-btn-comprar {
    display: block; text-align: center;
    background: var(--g700); color: #fff;
    font-weight: 700; font-size: 13px;
    padding: 12px 16px; border-radius: 50px;
    box-shadow: var(--sh-btn-g);
    transition: background .2s, transform .2s;
  }
  .pcd-btn-comprar:hover {
    background: var(--g900);
    transform: translateY(-2px);
  }
  @media (max-width: 1024px) {
    .produtos-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 640px) {
    .produtos-grid { grid-template-columns: 1fr; gap: 16px; }
    .filtro-section { padding: 32px 5% 0; }
    .grid-section { padding: 32px 5% 60px; }
  }
`;
