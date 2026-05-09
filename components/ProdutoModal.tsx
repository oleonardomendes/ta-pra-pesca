'use client'

import { useState } from 'react'
import Link from 'next/link'

const WA = process.env.NEXT_PUBLIC_WA_NUMBER || '5511900000000'

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

interface ProdutoModalProps {
  produto: {
    id: number
    nome: string
    codigo: string
    preco: number
    descricao?: string
    imagens: string[]
    video_url?: string
    estoque: number
    destaque: boolean
  } | null
  onClose: () => void
}

function getEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return url
}

interface Spec {
  label: string
  value: string
}

function parsearEspecificacoes(nome: string): Spec[] {
  const specs: Spec[] = []

  // Comprimento com decimal: "2,40m" ou "1.80m"
  const compDecMatch = nome.match(/(\d+[,.]\d+)\s*m(?!m)/i)
  if (compDecMatch) {
    specs.push({ label: 'Comprimento', value: compDecMatch[1].replace('.', ',') + 'm' })
  } else {
    // Comprimento inteiro pequeno: "2m", "3m" (varas)
    const smallCompMatch = nome.match(/\b([1-9])\s*m(?!m|\d)/i)
    if (smallCompMatch) {
      specs.push({ label: 'Comprimento', value: smallCompMatch[1] + 'm' })
    }
  }

  // Resistência: "15-60lbs"
  const resMatch = nome.match(/(\d+[-–]\d+\s*lbs)/i)
  if (resMatch) {
    specs.push({ label: 'Resistência', value: resMatch[1] })
  }

  // Rolamentos: "10+1 rolamentos" ou "10 rolamentos"
  const rolMatch = nome.match(/(\d+(?:\+\d+)?)\s*[Rr]olamentos/i)
  if (rolMatch) {
    specs.push({ label: 'Rolamentos', value: rolMatch[1] + ' rolamentos' })
  }

  // Material
  if (/carbono|fibra/i.test(nome)) {
    specs.push({ label: 'Material', value: 'Fibra de Carbono' })
  }

  // Tipo
  if (/para\s+carretilha/i.test(nome)) {
    specs.push({ label: 'Tipo', value: 'Para Carretilha' })
  } else if (/para\s+molinete/i.test(nome)) {
    specs.push({ label: 'Tipo', value: 'Para Molinete' })
  } else if (/telesc[oó]pica/i.test(nome)) {
    specs.push({ label: 'Tipo', value: 'Telescópica' })
  }

  // Metragem: números grandes (linhas de pesca) "500m"
  const metMatch = nome.match(/\b(\d{3,})\s*m(?!m)/i)
  if (metMatch) {
    specs.push({ label: 'Metragem', value: metMatch[1] + 'm' })
  }

  // Diâmetro: "0,35mm"
  const diaMatch = nome.match(/(\d+[,.]\d+)\s*mm/i)
  if (diaMatch) {
    specs.push({ label: 'Diâmetro', value: diaMatch[1].replace('.', ',') + 'mm' })
  }

  return specs
}

export default function ProdutoModal({ produto, onClose }: ProdutoModalProps) {
  const [imgIndex, setImgIndex] = useState(0)
  const [showVideo, setShowVideo] = useState(false)

  if (!produto) return null

  const imgs = produto.imagens.length > 0 ? produto.imagens : []
  const temMultiplas = imgs.length > 1
  const thumbnails = imgs.slice(0, 5)
  const specs = parsearEspecificacoes(produto.nome)
  const precoPix = produto.preco * 0.95
  const embedUrl = produto.video_url ? getEmbedUrl(produto.video_url) : null

  const checkoutHref = `/checkout?id=${produto.id}&nome=${encodeURIComponent(produto.nome)}&preco=${produto.preco}`
  const waHref = `https://wa.me/${WA}?text=${encodeURIComponent(`Olá! Tenho interesse: ${produto.nome}`)}`

  const estoqueInfo =
    produto.estoque === 0
      ? { text: '✗ Indisponível', color: '#ef4444' }
      : produto.estoque <= 5
      ? { text: '⚠ Últimas unidades', color: '#f59e0b' }
      : { text: '✓ Em estoque', color: '#22c55e' }

  return (
    <>
      <style>{modalStyles}</style>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          backdropFilter: 'blur(4px)',
        }}
      >
        <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>

          <div className="modal-grid">
            {/* COLUNA ESQUERDA — Galeria */}
            <div className="modal-gallery">
              <div className="modal-main-img">
                {showVideo && embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title="Vídeo do produto"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                ) : imgs[imgIndex] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgs[imgIndex]}
                    alt={produto.nome}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div className="modal-img-fallback">🎣</div>
                )}

                {!showVideo && temMultiplas && (
                  <>
                    <button
                      className="modal-arrow modal-arrow-l"
                      onClick={() => setImgIndex(i => (i - 1 + imgs.length) % imgs.length)}
                    >‹</button>
                    <button
                      className="modal-arrow modal-arrow-r"
                      onClick={() => setImgIndex(i => (i + 1) % imgs.length)}
                    >›</button>
                  </>
                )}
              </div>

              <div className="modal-thumb-area">
                {embedUrl && (
                  <div className="modal-tabs">
                    <button
                      className={`modal-tab${!showVideo ? ' modal-tab-active' : ''}`}
                      onClick={() => setShowVideo(false)}
                    >Fotos</button>
                    <button
                      className={`modal-tab${showVideo ? ' modal-tab-active' : ''}`}
                      onClick={() => setShowVideo(true)}
                    >Vídeo</button>
                  </div>
                )}

                {!showVideo && thumbnails.length > 1 && (
                  <div className="modal-thumbs">
                    {thumbnails.map((img, i) => (
                      <button
                        key={i}
                        className={`modal-thumb${i === imgIndex ? ' modal-thumb-active' : ''}`}
                        onClick={() => setImgIndex(i)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* COLUNA DIREITA — Informações */}
            <div className="modal-info">
              {produto.destaque && (
                <span className="modal-badge-dest">⭐ Destaque</span>
              )}

              <h2 className="modal-nome">{produto.nome}</h2>
              <p className="modal-preco">{fmt(produto.preco)}</p>
              <div className="modal-pix-badge">PIX: -5% → {fmt(precoPix)}</div>

              <hr className="modal-divider" />

              {specs.length > 0 && (
                <div className="modal-specs">
                  <p className="modal-specs-title">Especificações técnicas</p>
                  <ul className="modal-specs-list">
                    {specs.map((spec, i) => (
                      <li key={i} className="modal-spec-item">
                        <span className="modal-spec-check">✓</span>
                        <span><strong>{spec.label}:</strong> {spec.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {produto.descricao && (
                <p className="modal-descricao">{produto.descricao}</p>
              )}

              <div className="modal-estoque" style={{ color: estoqueInfo.color }}>
                {estoqueInfo.text}
              </div>

              <div className="modal-btns">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-btn-wa"
                >
                  Comprar pelo WhatsApp
                </a>
                <Link href={checkoutHref} className="modal-btn-comprar">
                  Comprar agora
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const modalStyles = `
  .modal-panel {
    position: relative;
    background: #fff;
    border-radius: 16px;
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 24px 80px rgba(0,0,0,.35);
  }
  .modal-close {
    position: absolute; top: 14px; right: 14px; z-index: 10;
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--g50); border: none; cursor: pointer;
    font-size: 15px; color: var(--g900);
    display: flex; align-items: center; justify-content: center;
    transition: background .2s;
  }
  .modal-close:hover { background: #d1fae5; }
  .modal-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  /* Galeria */
  .modal-gallery {
    padding: 24px;
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 12px;
  }
  .modal-main-img {
    position: relative;
    aspect-ratio: 1;
    border-radius: 10px;
    overflow: hidden;
    background: var(--g50);
  }
  .modal-img-fallback {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    font-size: 72px;
  }
  .modal-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(0,0,0,.45); color: #fff;
    border: none; cursor: pointer; font-size: 20px;
    display: flex; align-items: center; justify-content: center;
    z-index: 2; transition: background .15s;
  }
  .modal-arrow:hover { background: rgba(0,0,0,.65); }
  .modal-arrow-l { left: 8px; }
  .modal-arrow-r { right: 8px; }
  .modal-thumb-area { display: flex; flex-direction: column; gap: 8px; }
  .modal-tabs { display: flex; gap: 8px; }
  .modal-tab {
    padding: 6px 18px; border-radius: 50px;
    border: 1.5px solid var(--border);
    background: transparent; cursor: pointer;
    font-family: var(--ff-body);
    font-size: 13px; font-weight: 600; color: var(--muted);
    transition: all .2s;
  }
  .modal-tab-active { background: var(--g700); color: #fff; border-color: var(--g700); }
  .modal-thumbs { display: flex; gap: 8px; flex-wrap: wrap; }
  .modal-thumb {
    width: 60px; height: 60px; border-radius: 8px;
    overflow: hidden; border: 2px solid transparent;
    cursor: pointer; padding: 0; background: var(--g50);
    transition: border-color .2s;
  }
  .modal-thumb-active { border-color: #f59e0b; }
  /* Informações */
  .modal-info {
    padding: 28px 28px 28px 24px;
    display: flex; flex-direction: column; gap: 12px;
  }
  .modal-badge-dest {
    display: inline-block; align-self: flex-start;
    background: var(--a500); color: #fff;
    font-size: 11px; font-weight: 700;
    padding: 4px 12px; border-radius: 50px;
  }
  .modal-nome {
    font-family: var(--ff-display);
    font-size: 28px; color: var(--dark);
    letter-spacing: .02em; line-height: 1.2; margin: 0;
  }
  .modal-preco {
    font-family: var(--ff-display);
    font-size: 36px; color: var(--g700);
    letter-spacing: .02em; margin: 0;
  }
  .modal-pix-badge {
    display: inline-block; align-self: flex-start;
    background: #dcfce7; color: #15803d;
    font-size: 13px; font-weight: 700;
    padding: 5px 14px; border-radius: 50px;
  }
  .modal-divider {
    border: none; border-top: 1px solid var(--border); margin: 4px 0;
  }
  .modal-specs-title {
    font-size: 12px; font-weight: 700; color: var(--g900);
    text-transform: uppercase; letter-spacing: .09em; margin-bottom: 8px;
  }
  .modal-specs-list {
    list-style: none; padding: 0; margin: 0;
    display: flex; flex-direction: column; gap: 5px;
  }
  .modal-spec-item {
    display: flex; align-items: baseline; gap: 8px;
    font-size: 14px; color: var(--dark);
  }
  .modal-spec-check { color: #22c55e; font-weight: 700; flex-shrink: 0; }
  .modal-descricao {
    font-size: 14px; color: var(--muted); line-height: 1.65; margin: 0;
  }
  .modal-estoque { font-size: 14px; font-weight: 700; }
  .modal-btns { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
  .modal-btn-wa {
    display: block; width: 100%; text-align: center;
    background: #25d366; color: #fff;
    font-family: var(--ff-body); font-weight: 700; font-size: 15px;
    padding: 14px 16px; border-radius: 50px; text-decoration: none;
    box-sizing: border-box;
    transition: background .2s, transform .2s;
  }
  .modal-btn-wa:hover { background: #1da851; transform: translateY(-2px); }
  .modal-btn-comprar {
    display: block; text-align: center;
    background: var(--a500); color: #fff;
    font-family: var(--ff-body); font-weight: 700; font-size: 15px;
    padding: 14px 16px; border-radius: 50px; text-decoration: none;
    box-shadow: var(--sh-btn-a);
    transition: background .2s, transform .2s;
  }
  .modal-btn-comprar:hover { background: #b86e09; transform: translateY(-2px); }
  @media (max-width: 720px) {
    .modal-grid { grid-template-columns: 1fr; }
    .modal-gallery { border-right: none; border-bottom: 1px solid var(--border); }
    .modal-nome { font-size: 22px; }
    .modal-preco { font-size: 28px; }
    .modal-info { padding: 20px; }
  }
`
