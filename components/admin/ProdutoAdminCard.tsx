'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

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

const MAX_SLOTS = 5

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
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [pendingIdx, setPendingIdx] = useState<number | null>(null)
  const [salvandoImagens, setSalvandoImagens] = useState(false)
  const [imagensSalvas, setImagensSalvas] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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
    if (res.ok) setDestaque(novo)
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
    if (res.ok) setTimeout(() => setInfoStatus('idle'), 2500)
  }

  /* ── Image upload ──────────────────────────────────────── */
  const openSlot = (idx: number) => {
    if (uploadingIdx !== null) return
    setPendingIdx(idx)
    if (fileRef.current) { fileRef.current.value = ''; fileRef.current.click() }
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || pendingIdx === null) return
    setUploadingIdx(pendingIdx)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('blingCodigo', produto.codigo)
    const res = await fetch('/api/admin/produtos/imagem', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) {
      const novas = [...imagens]
      novas[pendingIdx] = data.url
      setImagens(novas)
    }
    setUploadingIdx(null)
    setPendingIdx(null)
  }

  const handleDeleteImg = (idx: number) => {
    setImagens(imagens.filter((_, i) => i !== idx))
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
    if (res.ok) setTimeout(() => setVideoStatus('idle'), 2500)
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
            {/* Seção 1: Informações */}
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

            {/* Seção 2: Imagens */}
            <div className="pac-section">
              <div className="pac-section-ttl">Imagens</div>
              <input ref={fileRef} type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleFile} />

              <div className="pac-img-grid">
                {Array.from({ length: MAX_SLOTS }).map((_, idx) => {
                  const url = imagens[idx]
                  const loading = uploadingIdx === idx
                  return (
                    <div
                      key={idx}
                      className={`pac-slot${!url && !loading ? ' pac-slot-empty' : ''}`}
                      onClick={() => !url && !loading ? openSlot(idx) : undefined}
                      title={idx === 0 ? 'Imagem principal' : `Imagem ${idx + 1}`}
                    >
                      {loading ? (
                        <div className="pac-spinner" />
                      ) : url ? (
                        <>
                          <Image src={url} alt={`img ${idx + 1}`} width={120} height={120}
                            style={{ objectFit: 'contain', width: '100%', height: '100%', borderRadius: 6 }} />
                          <button className="pac-del"
                            onClick={e => { e.stopPropagation(); handleDeleteImg(idx) }}
                            aria-label="Remover">×</button>
                          {idx === 0 && <span className="pac-main-tag">Principal</span>}
                        </>
                      ) : (
                        <>
                          <span className="pac-plus">+</span>
                          <span className="pac-add-txt">Adicionar</span>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="pac-hint">A primeira imagem é a principal exibida na loja</p>
              <div className="pac-save-row">
                <button
                  className={`pac-btn pac-btn-full${imagensSalvas ? ' pac-btn-saved' : ''}`}
                  disabled={salvandoImagens}
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

            {/* Seção 3: Vídeo */}
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

  /* Image grid */
  .pac-img-grid {
    display: flex; flex-wrap: wrap; gap: 10px;
  }
  .pac-slot {
    width: 110px; height: 110px; border-radius: 8px;
    position: relative; overflow: hidden;
    border: 1.5px solid var(--border); background: #fff;
    flex-shrink: 0;
  }
  .pac-slot-empty {
    background: var(--g50); cursor: pointer;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 4px;
    border-style: dashed;
    transition: border-color .15s, background .15s;
  }
  .pac-slot-empty:hover { border-color: var(--g500); background: #fff; }
  .pac-plus { font-size: 24px; color: var(--muted); line-height: 1; }
  .pac-add-txt { font-size: 10px; font-weight: 600; color: var(--muted); }
  .pac-del {
    position: absolute; top: 4px; right: 4px;
    width: 20px; height: 20px; border-radius: 50%;
    background: rgba(0,0,0,.55); color: #fff;
    border: none; font-size: 14px; line-height: 1;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-family: var(--ff-body);
    opacity: 0; transition: opacity .15s;
  }
  .pac-slot:hover .pac-del { opacity: 1; }
  .pac-main-tag {
    position: absolute; bottom: 4px; left: 4px;
    font-size: 9px; font-weight: 800; text-transform: uppercase;
    background: var(--g700); color: #fff;
    padding: 2px 5px; border-radius: 3px;
  }
  .pac-spinner {
    width: 32px; height: 32px; border-radius: 50%;
    border: 3px solid var(--border);
    border-top-color: var(--g700);
    animation: pac-spin .7s linear infinite;
    margin: auto; position: absolute;
    top: 50%; left: 50%; transform: translate(-50%,-50%);
  }
  @keyframes pac-spin { to { transform: translate(-50%,-50%) rotate(360deg); } }
  .pac-hint { font-size: 11px; color: var(--muted); }

  /* Video */
  .pac-video { border-radius: 8px; overflow: hidden; background: #000; }
`
