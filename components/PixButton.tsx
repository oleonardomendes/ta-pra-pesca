'use client'

import { useState } from 'react'
import PixQRCode from '@/components/PixQRCode'

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

interface Props {
  kitNome: string
  kitPreco: number
}

export default function PixButton({ kitNome, kitPreco }: Props) {
  const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const precoComDesconto = Math.round(kitPreco * 0.95 * 100) / 100

  async function handleGerarPix() {
    setLoading(true)
    setErro('')
    try {
      const res = await fetch('/api/mp/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: { payer: { email: 'pix@taprapesca.com.br' } },
          amount: precoComDesconto,
          description: kitNome,
        }),
      })
      const data = await res.json()
      if (data.qrCode) {
        setPixData({ qrCode: data.qrCode, qrCodeBase64: data.qrCodeBase64 })
      } else {
        setErro('Erro ao gerar PIX. Tente novamente.')
      }
    } catch {
      setErro('Erro ao gerar PIX. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (pixData) {
    return (
      <PixQRCode
        qrCode={pixData.qrCode}
        qrCodeBase64={pixData.qrCodeBase64}
        valor={precoComDesconto}
      />
    )
  }

  return (
    <div style={{
      background: 'var(--g50, #f0f7f0)',
      border: '1.5px solid var(--g500, #4a8a4a)',
      borderRadius: 'var(--r-lg, 16px)',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
          <rect width="28" height="28" rx="6" fill="#32BCAD"/>
          <path d="M9.5 14l2.5 2.5 6.5-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div>
          <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--g900, #1a1a1a)' }}>
            Pagar com PIX
          </div>
          <div style={{ fontSize: '12px', color: 'var(--g700, #2d6a2d)' }}>
            5% de desconto · QR Code gerado na hora
          </div>
        </div>
      </div>

      <div style={{ fontSize: '24px', fontFamily: 'var(--ff-display)', color: 'var(--g700)', marginBottom: '4px' }}>
        {fmt(precoComDesconto)}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
        à vista no PIX (de {fmt(kitPreco)})
      </div>

      {erro && (
        <div style={{ background: '#FCEBEB', color: '#A32D2D', borderRadius: '6px',
          padding: '8px 12px', fontSize: '13px', marginBottom: '12px' }}>
          {erro}
        </div>
      )}

      <button
        onClick={handleGerarPix}
        disabled={loading}
        style={{
          width: '100%', padding: '13px', borderRadius: '50px',
          background: loading ? 'var(--g500)' : 'var(--g700, #2d6a2d)',
          color: '#fff', border: 'none',
          fontSize: '14px', fontWeight: '700', fontFamily: 'var(--ff-body)',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background .2s',
        }}
      >
        {loading ? '⏳ Gerando QR Code...' : 'Gerar QR Code PIX'}
      </button>
    </div>
  )
}
