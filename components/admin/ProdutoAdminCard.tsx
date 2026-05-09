'use client'

import { useRef, useState } from 'react'

interface Produto {
  id: number
  nome: string
  codigo: string
  preco: number
  imagemURL: string
  estoque: number
}

interface Customizacao {
  nome_custom?: string
  descricao_custom?: string
  preco_custom?: number
  imagens?: string[]
  video_url?: string
  destaque?: boolean
}

interface Props {
  produto: Produto
  customizacao: Customizacao | null
}

function getEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

export default function ProdutoAdminCard({ produto, customizacao }: Props) {
  const [expanded, setExpanded] = useState(false)

  // Destaque
  const [destaque, setDestaque] = useState(customizacao?.destaque ?? false)
  const [toggleLoading, setToggleLoading] = useState(false)

  // Info
  const [nomeCustom, setNomeCustom] = useState(customizacao?.nome_custom ?? '')
  const [descCustom, setDescCustom] = useState(customizacao?.descricao_custom ?? '')
  const [precoCustom, setPrecoCustom] = useState(customizacao?.preco_custom?.toString() ?? '')
  const [savingInfo, setSavingInfo] = useState(false)
  const [infoStatus, setInfoStatus] = useState<'idle' | 'ok' | 'erro'>('idle')

  // Images
  const [imagens, setImagens] = useState<string[]>(customizacao?.imagens ?? [])
  const [uploadando, setUploadando] = useState(false)
  const [salvandoImagens, setSalvandoImagens] = useState(false)
  const [imagensSalvas, setImagensSalvas] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Video
  const [videoUrl, setVideoUrl] = useState(customizacao?.video_url ?? '')
  const [savingVideo, setSavingVideo] = useState(false)
  const [videoStatus, setVideoStatus] = useState<'idle' | 'ok' | 'erro'>('idle')

  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null

  /* ── Destaque toggle ───────────────────────────────────── */
  const handleDestaque = async () => {
    setToggleLoading(true)
    const novo = !destaque
    const res = await fetch('/api/admin/produtos/destaque', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bling_codigo: produto.codigo, destaque: novo }),
    })
    if (res.ok) {
      setDestaque(novo)
      fetch('/api/admin/revalidate', { method: 'POST' })
    }
    setToggleLoading(false)
  }

  /* ── Save info ─────────────────────────────────────────── */
  const handleSaveInfo = async () => {
    setSavingInfo(true)
    setInfoStatus('idle')
    const res = await fetch('/api/admin/produtos/customizacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bling_codigo: produto.codigo,
        nome_custom: nomeCustom || null,
        descricao_custom: descCustom || null,
        preco_custom: precoCustom ? Number(precoCustom) : null,
      }),
    })
    setInfoStatus(res.ok ? 'ok' : 'erro')
    setSavingInfo(false)
    if (res.ok) {
      fetch('/api/admin/revalidate', { method: 'POST' })
      setTimeout(() => setInfoStatus('idle'), 2500)
    }
  }

  /* ── Multiple upload (paralelo) ────────────────────────── */
  const handleMultipleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const vagasDisponiveis = 5 - imagens.length
    const arquivos = files.slice(0, vagasDisponiveis)

    if (files.length > vagasDisponiveis) {
      alert(`Máximo 5 imagens. Apenas ${vagasDisponiveis} foram adicionadas.`)
    }
    if (arquivos.length === 0) return

    setUploadando(true)
    try {
      const urls = await Promise.all(
        arquivos.map(async (file) => {
          const form = new FormData()
          form.append('file', file)
          form.append('blingCodigo', produto.codigo)
          const res = await fetch('/api/admin/produtos/imagem', { method: 'POST', body: form })
          const data = await res.json()
          return data.url as string
        })
      )
      setImagens(prev => [...prev, ...urls.filter(Boolean)].slice(0, 5))
    } finally {
      setUploadando(false)
      e.target.value = ''
    }
  }

  /* ── Save video ────────────────────────────────────────── */
  const handleSaveVideo = async () => {
    setSavingVideo(true)
    setVideoStatus('idle')
    const res = await fetch('/api/admin/produtos/customizacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bling_codigo: produto.codigo, video_url: videoUrl || null }),
    })
    setVideoStatus(res.ok ? 'ok' : 'erro')
    setSavingVideo(false)
    if (res.ok) {
      fetch('/api/admin/revalidate', { method: 'POST' })
      setTimeout(() => setVideoStatus('idle'), 2500)
    }
  }

  return (
    <>
      <style>{styles}</style>

      <div className={`pac-card${destaque ? ' pac-feat' : ''}`}>
        {/* ── Header ───────────────────────────────────── */}
        <div className="pac-header">
          <div className="pac-header-info">
            {destaque && <span className="pac-badge-dest">⭐ Destaque</span>}
            <p className="pac-nome">{nomeCustom || produto.nome}</p>
            <p className="pac-meta">
              Cód: <strong>{produto.codigo}</strong>
              &ensp;·&ensp;Estoque: <strong>{Number(produto.estoque)}</strong>
            </p>
          </div>

          <div className="pac-header-actions">
            <div className="pac-toggle-row">
              <span className="pac-toggle-lbl">Destaque</span>
              <button
                className={`pac-toggle${destaque ? ' on' : ''}`}
                onClick={handleDestaque}
                disabled={toggleLoading}
                aria-label="Toggle destaque"
              >
                <span className="pac-knob" />
              </button>
            </div>
            <button
              className={`pac-edit-btn${expanded ? ' open' : ''}`}
              onClick={() => setExpanded(v => !v)}
            >
              {expanded ? 'Fechar ▲' : 'Editar ▼'}
            </button>
          </div>
        </div>

        {/* ── Body expansível ─────────────────────────── */}
        {expanded && (
          <div className="pac-body">

            {/* Seção 1 — Informações */}
            <div className="pac-section">
              <div className="pac-section-ttl">Informações</div>

              <div className="pac-field">
                <label className="pac-lbl">Nome no site</label>
                <input className="pac-input" value={nomeCustom}
                  onChange={e => setNomeCustom(e.target.value)}
                  placeholder={produto.nome} />
              </div>

              <div className="pac-field">
                <label className="pac-lbl">Descrição</label>
                <textarea className="pac-textarea" rows={3} value={descCustom}
                  onChange={e => setDescCustom(e.target.value)}
                  placeholder="Adicione uma descrição..." />
              </div>

              <div className="pac-field" style={{ maxWidth: 200 }}>
                <label className="pac-lbl">Preço no site (R$)</label>
                <input className="pac-input" type="number" step="0.01" min="0"
                  value={precoCustom}
                  onChange={e => setPrecoCustom(e.target.value)}
                  placeholder={Number(produto.preco).toFixed(2)} />
              </div>

              <div className="pac-save-row">
                <button className="pac-btn" onClick={handleSaveInfo} disabled={savingInfo}>
                  {savingInfo ? 'Salvando…' : 'Salvar informações'}
                </button>
                {infoStatus === 'ok' && <span className="pac-ok">✓ Salvo!</span>}
                {infoStatus === 'erro' && <span className="pac-err">Erro ao salvar</span>}
              </div>
            </div>

            {/* Seção 2 — Imagens */}
            <div className="pac-section">
              <div className="pac-section-ttl">Imagens</div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                style={{ display: 'none' }}
                onChange={handleMultipleUpload}
              />

              {imagens.length < 5 && (
                <button
                  className="pac-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadando}
                >
                  + Adicionar imagens
                </button>
              )}

              {imagens.length > 0 && (
                <div className="pac-dnd-grid">
                  {imagens.map((url, i) => (
                    <div
                      key={url + i}
                      draggable
                      onDragStart={() => setDragIndex(i)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => {
                        if (dragIndex === null || dragIndex === i) return
                        const novo = [...imagens]
                        const [moved] = novo.splice(dragIndex, 1)
                        novo.splice(i, 0, moved)
                        setImagens(novo)
                        setDragIndex(null)
                      }}
                      onDragEnd={() => setDragIndex(null)}
                      style={{
                        position: 'relative',
                        aspectRatio: '1',
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: dragIndex === i
                          ? '2px dashed var(--g500)'
                          : '1px solid var(--border)',
                        opacity: dragIndex === i ? 0.5 : 1,
                        cursor: 'grab',
                        background: 'var(--g50)',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Imagem ${i + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      {i === 0 && (
                        <div style={{
                          position: 'absolute', top: 4, left: 4,
                          background: 'var(--a500)', color: '#fff',
                          fontSize: 9, fontWeight: 700,
                          padding: '2px 6px', borderRadius: 20,
                          letterSpacing: '.06em',
                        }}>CAPA</div>
                      )}

                      <button
                        onClick={() => setImagens(imagens.filter((_, idx) => idx !== i))}
                        style={{
                          position: 'absolute', top: 4, right: 4,
                          width: 20, height: 20, borderRadius: '50%',
                          background: 'rgba(0,0,0,.6)', color: '#fff',
                          border: 'none', cursor: 'pointer',
                          fontSize: 14, lineHeight: '1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >×</button>

                      <div style={{
                        position: 'absolute', bottom: 4, left: '50%',
                        transform: 'translateX(-50%)',
                        color: 'rgba(255,255,255,.7)', fontSize: 10,
                        userSelect: 'none', pointerEvents: 'none',
                      }}>⠿</div>
                    </div>
                  ))}

                  {imagens.length < 5 && (
                    <div className="pac-slot-add" onClick={() => fileInputRef.current?.click()}>
                      <span style={{ fontSize: 20 }}>+</span>
                      <span>{5 - imagens.length} vaga{5 - imagens.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              )}

              {uploadando && (
                <div style={{ marginTop: 8, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
                  ⏳ Fazendo upload das imagens...
                </div>
              )}

              {imagens.length > 1 && !uploadando && (
                <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
                  Arraste para reordenar · A primeira imagem é a capa
                </div>
              )}

              <div className="pac-save-row">
                <button
                  className={`pac-btn pac-btn-full${imagensSalvas ? ' pac-btn-saved' : ''}`}
                  disabled={salvandoImagens || uploadando}
                  onClick={async () => {
                    setSalvandoImagens(true)
                    try {
                      await fetch('/api/admin/produtos/customizacao', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          bling_codigo: produto.codigo,
                          imagens: imagens.filter(Boolean),
                        }),
                      })
                      fetch('/api/admin/revalidate', { method: 'POST' })
                      setImagensSalvas(true)
                      setTimeout(() => setImagensSalvas(false), 3000)
                    } finally {
                      setSalvandoImagens(false)
                    }
                  }}
                >
                  {salvandoImagens ? 'Salvando…' : imagensSalvas ? '✓ Imagens salvas!' : 'Salvar imagens'}
                </button>
              </div>
            </div>

            {/* Seção 3 — Vídeo */}
            <div className="pac-section">
              <div className="pac-section-ttl">Vídeo</div>
              <div className="pac-field">
                <label className="pac-lbl">URL do vídeo (YouTube ou Vimeo)</label>
                <input className="pac-input" value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..." />
              </div>
              {embedUrl && (
                <div className="pac-video">
                  <iframe src={embedUrl} allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    style={{ width: '100%', height: 220, border: 'none', borderRadius: 8 }} />
                </div>
              )}
              <div className="pac-save-row">
                <button className="pac-btn" onClick={handleSaveVideo} disabled={savingVideo}>
                  {savingVideo ? 'Salvando…' : 'Salvar vídeo'}
                </button>
                {videoStatus === 'ok' && <span className="pac-ok">✓ Salvo!</span>}
                {videoStatus === 'erro' && <span className="pac-err">Erro ao salvar</span>}
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  )
}

const styles = `
  .pac-card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    overflow: hidden;
    transition: border-color .2s;
  }
  .pac-card.pac-feat { border-color: var(--a500); border-width: 2px; }

  .pac-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 20px; gap: 16px;
  }
  .pac-header-info { flex: 1; min-width: 0; }
  .pac-badge-dest {
    display: inline-block; font-size: 10px; font-weight: 700;
    background: var(--a50); color: var(--a700);
    border-radius: 4px; padding: 2px 7px; margin-bottom: 6px;
  }
  .pac-nome {
    font-size: 14px; font-weight: 700; color: var(--dark);
    line-height: 1.35; margin-bottom: 3px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .pac-meta { font-size: 11px; color: var(--muted); }

  .pac-header-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .pac-toggle-row { display: flex; align-items: center; gap: 7px; }
  .pac-toggle-lbl { font-size: 11px; font-weight: 600; color: var(--muted); }
  .pac-toggle {
    width: 40px; height: 22px; border-radius: 11px;
    background: var(--border); border: none; cursor: pointer;
    position: relative; transition: background .2s; flex-shrink: 0;
  }
  .pac-toggle.on { background: var(--a500); }
  .pac-toggle:disabled { opacity: .5; cursor: not-allowed; }
  .pac-knob {
    position: absolute; top: 3px; left: 3px;
    width: 16px; height: 16px; border-radius: 50%;
    background: #fff; transition: transform .2s;
    box-shadow: 0 1px 3px rgba(0,0,0,.2);
  }
  .pac-toggle.on .pac-knob { transform: translateX(18px); }

  .pac-edit-btn {
    padding: 7px 14px; border-radius: 7px;
    border: 1.5px solid var(--border); background: var(--g50);
    color: var(--g700); font-family: var(--ff-body);
    font-size: 12px; font-weight: 700; cursor: pointer;
    transition: all .15s; white-space: nowrap;
  }
  .pac-edit-btn:hover { border-color: var(--g500); background: #fff; }
  .pac-edit-btn.open { background: var(--g700); color: #fff; border-color: var(--g700); }

  .pac-body {
    border-top: 1px solid var(--border);
    padding: 20px;
    display: flex; flex-direction: column; gap: 24px;
  }
  .pac-section { display: flex; flex-direction: column; gap: 12px; }
  .pac-section-ttl {
    font-size: 10px; font-weight: 800; letter-spacing: .12em;
    text-transform: uppercase; color: var(--muted);
    border-bottom: 1px solid var(--border); padding-bottom: 8px;
  }
  .pac-field { display: flex; flex-direction: column; gap: 5px; }
  .pac-lbl { font-size: 11px; font-weight: 700; color: var(--muted); }
  .pac-input {
    padding: 9px 12px; border: 1.5px solid var(--border);
    border-radius: 8px; background: var(--g50);
    font-family: var(--ff-body); font-size: 13px; color: var(--dark);
    outline: none; transition: border-color .15s, background .15s;
  }
  .pac-input:focus { border-color: var(--g500); background: #fff; }
  .pac-textarea {
    padding: 9px 12px; border: 1.5px solid var(--border);
    border-radius: 8px; background: var(--g50);
    font-family: var(--ff-body); font-size: 13px; color: var(--dark);
    outline: none; resize: vertical;
    transition: border-color .15s, background .15s;
  }
  .pac-textarea:focus { border-color: var(--g500); background: #fff; }

  .pac-save-row { display: flex; align-items: center; gap: 10px; }
  .pac-btn {
    padding: 8px 18px; background: var(--g700); color: #fff;
    border: none; border-radius: 7px; font-family: var(--ff-body);
    font-size: 12px; font-weight: 700; cursor: pointer; transition: background .15s;
  }
  .pac-btn:hover:not(:disabled) { background: var(--g900); }
  .pac-btn:disabled { opacity: .55; cursor: not-allowed; }
  .pac-ok { font-size: 12px; color: #16a34a; font-weight: 700; }
  .pac-err { font-size: 12px; color: #b91c1c; font-weight: 700; }
  .pac-btn-full { width: 100%; justify-content: center; }
  .pac-btn-saved { background: #16a34a; }
  .pac-btn-saved:hover:not(:disabled) { background: #15803d; }

  .pac-upload-btn {
    width: 100%; padding: 10px 18px;
    background: transparent; color: var(--g700);
    border: 2px dashed var(--border); border-radius: 8px;
    font-family: var(--ff-body); font-size: 13px; font-weight: 700;
    cursor: pointer; transition: border-color .15s, background .15s;
  }
  .pac-upload-btn:hover:not(:disabled) { border-color: var(--g500); background: var(--g50); }
  .pac-upload-btn:disabled { opacity: .55; cursor: not-allowed; }

  .pac-dnd-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
  }
  .pac-slot-add {
    aspect-ratio: 1; border-radius: 8px;
    border: 2px dashed var(--border);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    cursor: pointer; color: var(--muted);
    font-size: 11px; gap: 4px;
    transition: border-color .2s, background .2s;
  }
  .pac-slot-add:hover { border-color: var(--g500); background: var(--g50); }

  .pac-video { border-radius: 8px; overflow: hidden; background: #000; }
`
