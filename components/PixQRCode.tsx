'use client'

import { useState, useEffect } from 'react'

interface Props {
  qrCode: string
  qrCodeBase64: string
  kitPreco: number
  freteValor?: number
  paymentId: string
}

export default function PixQRCode({ qrCode, qrCodeBase64, kitPreco, freteValor = 0, paymentId }: Props) {
  const [copiado, setCopiado] = useState(false)
  const [verificando, setVerificando] = useState(false)

  const copiar = async () => {
    await navigator.clipboard.writeText(qrCode)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  const valorComDesconto = (kitPreco * 0.95 + freteValor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  useEffect(() => {
    if (!paymentId) return

    setVerificando(true)
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/mp/check-payment?id=${paymentId}`)
        const data = await res.json()

        if (data.status === 'approved') {
          clearInterval(interval)
          window.location.href = `/obrigado?payment_id=${paymentId}&status=approved`
        }
      } catch {}
    }, 5000)

    return () => clearInterval(interval)
  }, [paymentId])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '20px', padding: '24px',
      background: '#E8F7F2', borderRadius: '16px',
      border: '1px solid #1D9E75',
    }}>
      <div style={{
        fontSize: '13px', fontWeight: '700', color: '#0F5C45',
        textTransform: 'uppercase', letterSpacing: '.08em',
      }}>
        ⚡ Pague via PIX — 5% de desconto aplicado
      </div>

      <div style={{ fontSize: '28px', fontWeight: '800', color: '#0A3D2B' }}>
        {valorComDesconto}
      </div>

      {qrCodeBase64 && (
        <img
          src={`data:image/png;base64,${qrCodeBase64}`}
          alt="QR Code PIX"
          style={{
            width: '220px', height: '220px', borderRadius: '12px',
            background: '#fff', padding: '12px',
          }}
        />
      )}

      <div style={{ width: '100%' }}>
        <div style={{
          fontSize: '12px', color: '#5C6B63', marginBottom: '8px',
          fontWeight: '600',
        }}>
          PIX Copia e Cola:
        </div>
        <div style={{
          background: '#fff', border: '1px solid #C5DDD5',
          borderRadius: '8px', padding: '10px 12px',
          fontSize: '11px', color: '#2E4035',
          wordBreak: 'break-all', fontFamily: 'monospace',
          maxHeight: '80px', overflow: 'auto',
        }}>
          {qrCode}
        </div>
      </div>

      <button
        onClick={copiar}
        style={{
          width: '100%', padding: '14px',
          background: copiado ? '#1D9E75' : '#0F5C45',
          color: '#fff', border: 'none', borderRadius: '50px',
          fontWeight: '800', fontSize: '15px', cursor: 'pointer',
          transition: 'all .2s',
        }}
      >
        {copiado ? '✓ Código copiado!' : 'Copiar código PIX'}
      </button>

      {verificando && (
        <div style={{ textAlign: 'center', fontSize: '13px',
          color: '#5C6B63', marginTop: '-8px' }}>
          ⏳ Aguardando confirmação do pagamento...
        </div>
      )}

      <button
        onClick={() => { window.location.href = `/obrigado?payment_id=${paymentId}&status=approved` }}
        style={{
          width: '100%', padding: '12px',
          background: 'transparent',
          border: '1.5px solid #C5DDD5',
          borderRadius: '50px', cursor: 'pointer',
          fontSize: '13px', fontWeight: '600',
          color: '#5C6B63',
        }}
      >
        Já realizei o pagamento →
      </button>

      <div style={{ fontSize: '12px', color: '#5C6B63', textAlign: 'center' }}>
        Após o pagamento, você receberá a confirmação por e-mail.<br />
        O código PIX expira em <strong>30 minutos</strong>.
      </div>
    </div>
  )
}
