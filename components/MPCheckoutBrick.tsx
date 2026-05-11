'use client'

import { useEffect, useState } from 'react'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'

interface Props {
  preferenceId: string
  kitNome: string
  kitPreco: number
}

export default function MPCheckoutBrick({ preferenceId, kitPreco }: Props) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const publicKey = process.env.NEXT_PUBLIC_MP_ENV === 'test'
      ? process.env.NEXT_PUBLIC_MP_PUBLIC_KEY_TEST!
      : process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!

    initMercadoPago(publicKey, { locale: 'pt-BR' })
    setReady(true)
  }, [])

  if (!ready) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
        Carregando checkout...
      </div>
    )
  }

  return (
    <Payment
      initialization={{
        amount: kitPreco,
        preferenceId,
      }}
      customization={{
        paymentMethods: {
          creditCard: 'all',
          debitCard: 'all',
          mercadoPago: 'all',
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
      onSubmit={async () => Promise.resolve()}
      onError={(error) => console.error('MP Brick error:', error)}
    />
  )
}
