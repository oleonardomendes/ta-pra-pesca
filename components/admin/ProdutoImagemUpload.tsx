'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

interface Props {
  blingCodigo: string
  imagemAtual: string
  nome: string
}

export default function ProdutoImagemUpload({ blingCodigo, imagemAtual, nome }: Props) {
  const [imagem, setImagem] = useState(imagemAtual)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ok' | 'erro'>('idle')
  const [erroMsg, setErroMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setErroMsg('Arquivo muito grande (máx 5 MB)')
      setStatus('erro')
      return
    }

    setLoading(true)
    setStatus('idle')
    setErroMsg('')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('blingCodigo', blingCodigo)

    try {
      const res = await fetch('/api/admin/produtos/imagem', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        setErroMsg(data.error || 'Erro no upload')
        setStatus('erro')
      } else {
        setImagem(data.url)
        setStatus('ok')
        setTimeout(() => setStatus('idle'), 3000)
      }
    } catch {
      setErroMsg('Erro de conexão')
      setStatus('erro')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        width: 80, height: 80, borderRadius: 8, overflow: 'hidden',
        background: '#f0f0f0', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {imagem ? (
          <Image
            src={imagem}
            alt={nome}
            width={80}
            height={80}
            style={{ objectFit: 'contain', width: 80, height: 80 }}
          />
        ) : (
          <span style={{ fontSize: 28 }}>🎣</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        style={{
          padding: '6px 12px', fontSize: 12, fontWeight: 600,
          borderRadius: 6, border: '1.5px solid var(--border)',
          background: 'transparent', color: 'var(--g700)',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          fontFamily: 'var(--ff-body)',
          transition: 'all .15s',
          whiteSpace: 'nowrap',
        }}
      >
        {loading ? 'Enviando…' : 'Trocar imagem'}
      </button>

      {status === 'ok' && (
        <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>✓ Salvo!</span>
      )}
      {status === 'erro' && (
        <span style={{ fontSize: 11, color: '#b91c1c', fontWeight: 600 }}>{erroMsg}</span>
      )}
    </div>
  )
}
