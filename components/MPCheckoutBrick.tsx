'use client'

import { useEffect, useState } from 'react'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'
import PixQRCode from '@/components/PixQRCode'

interface Props {
  preferenceId: string
  kitNome: string
  kitPreco: number
}

export default function MPCheckoutBrick({ preferenceId, kitNome, kitPreco }: Props) {
  const [ready, setReady] = useState(false)
  const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string } | null>(null)
  const [loadingPix, setLoadingPix] = useState(false)

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_MP_ENV === 'test'
      ? process.env.NEXT_PUBLIC_MP_PUBLIC_KEY_TEST!
      : process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!

    initMercadoPago(publicKey, { locale: 'pt-BR' })
    setReady(true)
  }, [])

  if (pixData) {
    return (
      <PixQRCode
        qrCode={pixData.qrCode}
        qrCodeBase64={pixData.qrCodeBase64}
        valor={kitPreco}
      />
    )
  }

  if (loadingPix) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
        Gerando QR Code PIX...
      </div>
    )
  }

  if (!ready) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
        Carregando checkout...
      </div>
    )
  }

  return (
    <>
      <div style={{
        background: '#E8F7F2',
        border: '1px solid #1D9E75',
        borderRadius: '8px',
        padding: '10px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        fontWeight: '600',
        color: '#0F5C45',
      }}>
        <span>⚡</span>
        <span>Pague com PIX e ganhe <strong>5% de desconto</strong> — à vista e na hora!</span>
      </div>

      <Payment
        initialization={{
          amount: kitPreco,
          preferenceId,
        }}
        customization={{
          paymentMethods: {
            ticket: 'all',
            creditCard: 'all',
            debitCard: 'all',
            mercadoPago: 'all',
            bankTransfer: 'all',
            atm: 'all',
          },
          visual: {
            style: {
              theme: 'default',
              customVariables: {
                baseColor: '#0F5C45',
                baseColorFirstVariant: '#1D9E75',
                baseColorSecondVariant: '#0A3D2B',
                errorColor: '#A32D2D',
                successColor: '#1D9E75',
              },
            },
          },
        }}
        onSubmit={async ({ selectedPaymentMethod, formData }) => {
          if (
            selectedPaymentMethod === 'bank_transfer' ||
            (formData as any)?.payment_method_id === 'pix'
          ) {
            setLoadingPix(true)
            try {
              const res = await fetch('/api/mp/create-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  formData,
                  amount: Math.round(kitPreco * 0.95 * 100) / 100,
                  description: kitNome,
                }),
              })
              const data = await res.json()
              if (data.qrCode) {
                setPixData({ qrCode: data.qrCode, qrCodeBase64: data.qrCodeBase64 })
              }
            } finally {
              setLoadingPix(false)
            }
            return Promise.resolve()
          }
          return Promise.resolve()
        }}
        onError={(error) => console.error('MP Brick error:', error)}
      />
    </>
  )
}
