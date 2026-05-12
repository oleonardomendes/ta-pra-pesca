'use client'

import { useEffect } from 'react'

export default function SalvarPedido() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const paymentId =
      params.get('payment_id') ||
      params.get('collection_id')
    const status =
      params.get('status') ||
      params.get('collection_status')

    console.log('[obrigado] payment_id:', paymentId, 'status:', status)

    if (paymentId && status === 'approved') {
      fetch('/api/mp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment',
          data: { id: paymentId },
        }),
      })
        .then(r => r.json())
        .then(data => console.log('[obrigado] pedido salvo:', data))
        .catch(e => console.error('[obrigado] erro ao salvar:', e))
    }
  }, [])

  return null
}
