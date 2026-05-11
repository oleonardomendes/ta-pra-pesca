'use client'

import { useEffect } from 'react'

interface Props {
  value: number
  currency?: string
  transactionId?: string
  items?: Array<{
    id: string
    name: string
    price: number
    quantity: number
    category?: string
  }>
}

export default function PurchaseEvent({ value, currency = 'BRL', transactionId, items }: Props) {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      ;(window as any).dataLayer.push({ ecommerce: null })
      ;(window as any).dataLayer.push({
        event: 'purchase',
        ecommerce: {
          transaction_id: transactionId || Date.now().toString(),
          value: value,
          currency: currency,
          items: items?.map((item, index) => ({
            item_id: item.id,
            item_name: item.name,
            item_category: item.category || 'Pesca',
            price: item.price,
            quantity: item.quantity,
            index: index,
          })) || [],
        },
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
