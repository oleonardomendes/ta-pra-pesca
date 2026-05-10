'use client'
import { useEffect } from 'react'
import { trackPurchase } from '@/lib/analytics'

export function PurchaseTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const orderId = params.get('payment_id') || String(Date.now())
    const total = Number(params.get('valor') || 0)
    trackPurchase(orderId, total, [])
  }, [])
  return null
}
