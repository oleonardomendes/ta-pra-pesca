'use client'

import { useState } from 'react'

function getEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return url
}

interface Props {
  imagens: string[]
  videoUrl: string | null
  nome: string
}

export default function ProdutoGaleria({ imagens, videoUrl, nome }: Props) {
  const [imgIndex, setImgIndex] = useState(0)
  const [showVideo, setShowVideo] = useState(false)

  const temMultiplas = imagens.length > 1
  const thumbnails = imagens.slice(0, 5)
  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null

  return (
    <>
      <style>{galStyles}</style>
      <div className="gal-wrap">
        <div className="gal-main">
          {showVideo && embedUrl ? (
            <iframe
              src={embedUrl}
              title="Vídeo do produto"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : imagens[imgIndex] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagens[imgIndex]}
              alt={nome}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <div className="gal-fallback">🎣</div>
          )}

          {!showVideo && temMultiplas && (
            <>
              <button
                className="gal-arrow gal-arrow-l"
                onClick={() => setImgIndex(i => (i - 1 + imagens.length) % imagens.length)}
              >‹</button>
              <button
                className="gal-arrow gal-arrow-r"
                onClick={() => setImgIndex(i => (i + 1) % imagens.length)}
              >›</button>
            </>
          )}
        </div>

        <div className="gal-bottom">
          {embedUrl && (
            <div className="gal-tabs">
              <button
                className={`gal-tab${!showVideo ? ' gal-tab-active' : ''}`}
                onClick={() => setShowVideo(false)}
              >Fotos</button>
              <button
                className={`gal-tab${showVideo ? ' gal-tab-active' : ''}`}
                onClick={() => setShowVideo(true)}
              >Vídeo</button>
            </div>
          )}

          {!showVideo && thumbnails.length > 1 && (
            <div className="gal-thumbs">
              {thumbnails.map((img, i) => (
                <button
                  key={i}
                  className={`gal-thumb${i === imgIndex ? ' gal-thumb-active' : ''}`}
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
    </>
  )
}

const galStyles = `
  .gal-wrap { display: flex; flex-direction: column; gap: 12px; }
  .gal-main {
    position: relative;
    aspect-ratio: 1;
    border-radius: 16px;
    overflow: hidden;
    background: var(--g50);
    border: 1px solid var(--border);
  }
  .gal-fallback {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    font-size: 80px;
  }
  .gal-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 40px; height: 40px; border-radius: 50%;
    background: rgba(255,255,255,.92); color: var(--g900);
    border: 1px solid var(--border); cursor: pointer; font-size: 22px;
    display: flex; align-items: center; justify-content: center;
    z-index: 2; box-shadow: 0 2px 8px rgba(0,0,0,.12);
    transition: all .15s;
  }
  .gal-arrow:hover { background: #fff; box-shadow: 0 4px 16px rgba(0,0,0,.18); }
  .gal-arrow-l { left: 12px; }
  .gal-arrow-r { right: 12px; }
  .gal-bottom { display: flex; flex-direction: column; gap: 8px; }
  .gal-tabs { display: flex; gap: 8px; }
  .gal-tab {
    padding: 7px 20px; border-radius: 50px;
    border: 1.5px solid var(--border);
    background: transparent; cursor: pointer;
    font-family: var(--ff-body);
    font-size: 13px; font-weight: 600; color: var(--muted);
    transition: all .2s;
  }
  .gal-tab-active { background: var(--g700); color: #fff; border-color: var(--g700); }
  .gal-thumbs { display: flex; gap: 8px; flex-wrap: wrap; }
  .gal-thumb {
    width: 60px; height: 60px; border-radius: 8px;
    overflow: hidden; border: 2px solid transparent;
    cursor: pointer; padding: 0; background: var(--g50);
    transition: border-color .2s;
  }
  .gal-thumb-active { border-color: #f59e0b; }
`
