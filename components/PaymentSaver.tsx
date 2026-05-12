'use client'

import { useEffect } from 'react'

export default function PaymentSaver() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentId = params.get('payment_id') || params.get('collection_id')
    const status = params.get('status') || params.get('collection_status')

    if (paymentId && status === 'approved') {
      fetch('/api/mp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment',
          data: { id: paymentId },
        }),
      })
    }
  }, [])

  return null
}
