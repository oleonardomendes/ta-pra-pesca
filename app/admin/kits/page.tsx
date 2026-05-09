'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

interface KitCustom {
  id: string
  nome: string
  subtitulo: string
  tagline: string
  preco: number
  imagem_url: string
  bonus_texto: string
  bonus_subtitulo: string
  destaque: boolean
  ativo: boolean
  itens: string[]
}

const EMPTY: Omit<KitCustom, 'id'> = {
  nome: '',
  subtitulo: '',
  tagline: '',
  preco: 0,
  imagem_url: '',
  bonus_texto: '',
  bonus_subtitulo: '',
  destaque: false,
  ativo: true,
  itens: [''],
}

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

export default function AdminKitsPage() {
  const [kits, setKits] = useState<KitCustom[]>([])
  const [editing, setEditing] = useState<Partial<KitCustom> | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [erroForm, setErroForm] = useState('')
  const imgInputRef = useRef<HTMLInputElement>(null)

  const isNew = editing && !('id' in editing)

  async function loadKits() {
    setLoadingList(true)
    const res = await fetch('/api/admin/kits')
    const data = await res.json()
    setKits(data.kits ?? [])
    setLoadingList(false)
  }

  useEffect(() => { loadKits() }, [])

  function openNew() {
    setEditing({ ...EMPTY })
    setErroForm('')
  }

  function openEdit(kit: KitCustom) {
    setEditing({ ...kit })
    setErroForm('')
  }

  function cancelEdit() {
    setEditing(null)
    setErroForm('')
  }

  function setField<K extends keyof KitCustom>(key: K, value: KitCustom[K]) {
    setEditing(prev => prev ? { ...prev, [key]: value } : prev)
  }

  function setItem(idx: number, value: string) {
    const itens = [...(editing?.itens ?? [])]
    itens[idx] = value
    setField('itens', itens)
  }

  function addItem() {
    setField('itens', [...(editing?.itens ?? []), ''])
  }

  function removeItem(idx: number) {
    const itens = (editing?.itens ?? []).filter((_, i) => i !== idx)
    setField('itens', itens.length ? itens : [''])
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/kits/imagem', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) setField('imagem_url', data.url)
    else setErroForm(data.error || 'Erro no upload')
    setUploadingImg(false)
    if (imgInputRef.current) imgInputRef.current.value = ''
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    setErroForm('')
    const payload = {
      ...editing,
      itens: (editing.itens ?? []).filter(i => i.trim()),
      preco: Number(editing.preco),
    }
    const isEdit = 'id' in editing && editing.id
    const url = isEdit ? `/api/admin/kits/${editing.id}` : '/api/admin/kits'
    const method = isEdit ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      setErroForm(data.error || 'Erro ao salvar')
    } else {
      await loadKits()
      setEditing(null)
    }
    setSaving(false)
  }

  async function handleToggle(kit: KitCustom) {
    await fetch(`/api/admin/kits/${kit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !kit.ativo }),
    })
    await loadKits()
  }

  async function handleDelete(kit: KitCustom) {
    if (!confirm(`Excluir "${kit.nome}"? Esta ação não pode ser desfeita.`)) return
    await fetch(`/api/admin/kits/${kit.id}`, { method: 'DELETE' })
    await loadKits()
  }

  return (
    <>
      <style>{styles}</style>

      {editing === null ? (
        <>
          <div className="ak-header">
            <div>
              <h1 className="ak-title">Kits</h1>
              <p className="ak-count">{kits.length} kits customizados</p>
            </div>
            <button className="ak-btn-primary" onClick={openNew}>+ Novo kit</button>
          </div>

          {loadingList ? (
            <p className="ak-empty">Carregando…</p>
          ) : kits.length === 0 ? (
            <p className="ak-empty">Nenhum kit criado ainda. Clique em "Novo kit" para começar.</p>
          ) : (
            <div className="ak-grid">
              {kits.map(kit => (
                <div key={kit.id} className={`ak-card${!kit.ativo ? ' ak-inativo' : ''}`}>
                  <div className="ak-card-img">
                    {kit.imagem_url ? (
                      <Image src={kit.imagem_url} alt={kit.nome} width={80} height={80}
                        style={{ objectFit: 'contain', width: 80, height: 80, borderRadius: 8 }} />
                    ) : (
                      <div className="ak-img-fallback">🎣</div>
                    )}
                  </div>
                  <div className="ak-card-info">
                    <p className="ak-card-nome">
                      {kit.nome} {kit.subtitulo && <span className="ak-card-sub">{kit.subtitulo}</span>}
                      {kit.destaque && <span className="ak-badge-dest">⭐ Destaque</span>}
                    </p>
                    <p className="ak-card-preco">{fmt(kit.preco)}</p>
                    <p className="ak-card-status">{kit.ativo ? '● Ativo' : '○ Inativo'}</p>
                  </div>
                  <div className="ak-card-actions">
                    <button className="ak-btn-sm" onClick={() => openEdit(kit)}>Editar</button>
                    <button className="ak-btn-sm" onClick={() => handleToggle(kit)}>
                      {kit.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button className="ak-btn-sm ak-btn-danger" onClick={() => handleDelete(kit)}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="ak-form-wrap">
          <div className="ak-form-header">
            <h1 className="ak-title">{isNew ? 'Novo kit' : `Editando: ${editing.nome || '—'}`}</h1>
            <button className="ak-btn-ghost" onClick={cancelEdit}>← Cancelar</button>
          </div>

          <div className="ak-form">
            {/* Imagem */}
            <div className="ak-form-section">
              <label className="ak-form-label">Imagem do kit</label>
              <div className="ak-img-row">
                <div className="ak-img-preview">
                  {editing.imagem_url ? (
                    <Image src={editing.imagem_url} alt="Preview" width={100} height={100}
                      style={{ objectFit: 'contain', width: 100, height: 100, borderRadius: 8 }} />
                  ) : (
                    <div className="ak-img-fallback">🎣</div>
                  )}
                </div>
                <div>
                  <input ref={imgInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }} onChange={handleImageUpload} />
                  <button className="ak-btn-sm" onClick={() => imgInputRef.current?.click()}
                    disabled={uploadingImg}>
                    {uploadingImg ? 'Enviando…' : 'Escolher imagem'}
                  </button>
                  {editing.imagem_url && (
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Imagem carregada ✓</p>
                  )}
                </div>
              </div>
            </div>

            {/* Campos principais */}
            <div className="ak-form-row">
              <div className="ak-form-field">
                <label className="ak-form-label">Nome</label>
                <input className="ak-input" value={editing.nome ?? ''} onChange={e => setField('nome', e.target.value)} placeholder="Kit Pesqueiro" />
              </div>
              <div className="ak-form-field">
                <label className="ak-form-label">Subtítulo</label>
                <input className="ak-input" value={editing.subtitulo ?? ''} onChange={e => setField('subtitulo', e.target.value)} placeholder="Completo" />
              </div>
            </div>

            <div className="ak-form-field">
              <label className="ak-form-label">Tagline</label>
              <input className="ak-input" value={editing.tagline ?? ''} onChange={e => setField('tagline', e.target.value)} placeholder="Descrição curta do kit..." />
            </div>

            <div className="ak-form-row">
              <div className="ak-form-field">
                <label className="ak-form-label">Preço (R$)</label>
                <input className="ak-input" type="number" min={0} step={0.01} value={editing.preco ?? 0} onChange={e => setField('preco', Number(e.target.value))} />
              </div>
              <div className="ak-form-field ak-form-checks">
                <label className="ak-check">
                  <input type="checkbox" checked={editing.destaque ?? false} onChange={e => setField('destaque', e.target.checked)} />
                  Destaque (⭐ Mais completo)
                </label>
                <label className="ak-check">
                  <input type="checkbox" checked={editing.ativo ?? true} onChange={e => setField('ativo', e.target.checked)} />
                  Ativo (visível na loja)
                </label>
              </div>
            </div>

            {/* Bônus */}
            <div className="ak-form-row">
              <div className="ak-form-field">
                <label className="ak-form-label">Bônus incluso</label>
                <input className="ak-input" value={editing.bonus_texto ?? ''} onChange={e => setField('bonus_texto', e.target.value)} placeholder="Boia Cevadeira inclusa" />
              </div>
              <div className="ak-form-field">
                <label className="ak-form-label">Bônus subtítulo</label>
                <input className="ak-input" value={editing.bonus_subtitulo ?? ''} onChange={e => setField('bonus_subtitulo', e.target.value)} placeholder="Sem custo adicional" />
              </div>
            </div>

            {/* Itens */}
            <div className="ak-form-section">
              <label className="ak-form-label">Itens do kit</label>
              <div className="ak-itens">
                {(editing.itens ?? ['']).map((item, idx) => (
                  <div key={idx} className="ak-item-row">
                    <input className="ak-input" value={item} placeholder={`Item ${idx + 1}`}
                      onChange={e => setItem(idx, e.target.value)} />
                    <button className="ak-btn-icon" onClick={() => removeItem(idx)}
                      disabled={(editing.itens ?? []).length <= 1} aria-label="Remover item">
                      ×
                    </button>
                  </div>
                ))}
                <button className="ak-btn-sm" onClick={addItem}>+ Adicionar item</button>
              </div>
            </div>

            {erroForm && <div className="ak-erro">{erroForm}</div>}

            <div className="ak-form-actions">
              <button className="ak-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar kit'}
              </button>
              <button className="ak-btn-ghost" onClick={cancelEdit}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const styles = `
  .ak-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  .ak-title { font-family: var(--ff-display); font-size: 36px; color: var(--g900); letter-spacing: .03em; margin-bottom: 4px; }
  .ak-count { font-size: 14px; color: var(--muted); }
  .ak-empty { text-align: center; padding: 60px; color: var(--muted); font-size: 15px; }

  .ak-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
  .ak-card {
    background: #fff; border: 1px solid var(--border); border-radius: var(--r-lg);
    padding: 20px; display: flex; gap: 16px; align-items: flex-start;
  }
  .ak-card.ak-inativo { opacity: .55; }
  .ak-card-img { flex-shrink: 0; }
  .ak-img-fallback {
    width: 80px; height: 80px; border-radius: 8px; background: var(--g50);
    display: flex; align-items: center; justify-content: center; font-size: 28px;
  }
  .ak-card-info { flex: 1; min-width: 0; }
  .ak-card-nome { font-size: 14px; font-weight: 700; color: var(--dark); margin-bottom: 4px; }
  .ak-card-sub { font-weight: 400; color: var(--muted); margin-left: 4px; }
  .ak-badge-dest { display: inline-block; font-size: 10px; background: var(--a50); color: var(--a700); border-radius: 4px; padding: 1px 6px; margin-left: 6px; font-weight: 700; }
  .ak-card-preco { font-size: 15px; font-weight: 700; color: var(--g700); margin-bottom: 4px; }
  .ak-card-status { font-size: 11px; color: var(--muted); }
  .ak-card-actions { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }

  .ak-btn-primary {
    padding: 10px 20px; background: var(--g700); color: #fff;
    border: none; border-radius: 8px; font-family: var(--ff-body);
    font-size: 13px; font-weight: 700; cursor: pointer; transition: background .15s;
    white-space: nowrap;
  }
  .ak-btn-primary:hover:not(:disabled) { background: var(--g900); }
  .ak-btn-primary:disabled { opacity: .6; cursor: not-allowed; }
  .ak-btn-ghost {
    padding: 10px 20px; background: transparent; color: var(--muted);
    border: 1.5px solid var(--border); border-radius: 8px; font-family: var(--ff-body);
    font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s;
  }
  .ak-btn-ghost:hover { border-color: var(--g500); color: var(--g700); }
  .ak-btn-sm {
    padding: 6px 12px; background: var(--g50); color: var(--g700);
    border: 1.5px solid var(--border); border-radius: 6px; font-family: var(--ff-body);
    font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; white-space: nowrap;
  }
  .ak-btn-sm:hover:not(:disabled) { border-color: var(--g500); background: #fff; }
  .ak-btn-sm:disabled { opacity: .5; cursor: not-allowed; }
  .ak-btn-danger { color: #b91c1c; border-color: #fecaca; }
  .ak-btn-danger:hover { background: #fef2f2; border-color: #b91c1c; }
  .ak-btn-icon {
    width: 32px; height: 32px; border-radius: 6px; border: 1.5px solid var(--border);
    background: transparent; color: var(--muted); font-size: 16px;
    cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    font-family: var(--ff-body); transition: all .15s;
  }
  .ak-btn-icon:hover:not(:disabled) { border-color: #b91c1c; color: #b91c1c; background: #fef2f2; }
  .ak-btn-icon:disabled { opacity: .3; cursor: not-allowed; }

  .ak-form-wrap { max-width: 760px; }
  .ak-form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
  .ak-form { display: flex; flex-direction: column; gap: 20px; background: #fff; border: 1px solid var(--border); border-radius: var(--r-lg); padding: 32px; }
  .ak-form-section { display: flex; flex-direction: column; gap: 12px; }
  .ak-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .ak-form-field { display: flex; flex-direction: column; gap: 6px; }
  .ak-form-checks { display: flex; flex-direction: column; justify-content: center; gap: 12px; }
  .ak-form-label { font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
  .ak-input {
    padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 8px;
    background: var(--g50); font-family: var(--ff-body); font-size: 14px; color: var(--dark);
    outline: none; transition: border-color .2s, background .2s; width: 100%;
  }
  .ak-input:focus { border-color: var(--g500); background: #fff; }
  .ak-check { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--dark); cursor: pointer; }
  .ak-check input { width: 15px; height: 15px; cursor: pointer; accent-color: var(--g700); }
  .ak-itens { display: flex; flex-direction: column; gap: 8px; }
  .ak-item-row { display: flex; gap: 8px; align-items: center; }

  .ak-img-row { display: flex; gap: 16px; align-items: center; }
  .ak-img-preview { width: 100px; height: 100px; border-radius: 8px; background: var(--g50); overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 32px; }

  .ak-form-actions { display: flex; gap: 12px; padding-top: 8px; }
  .ak-erro { font-size: 13px; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; font-weight: 500; }

  @media (max-width: 640px) {
    .ak-form-row { grid-template-columns: 1fr; }
    .ak-grid { grid-template-columns: 1fr; }
  }
`
