declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq?: (...args: any[]) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataLayer?: any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ttq?: any
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ event: eventName, ...params })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trackMetaEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trackTikTokEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.ttq) {
    window.ttq.track(eventName, params)
  }
}

export function trackAddToCart(produto: { id: number; nome: string; preco: number; codigo?: string }) {
  trackEvent('add_to_cart', {
    currency: 'BRL',
    value: produto.preco,
    items: [{ item_id: String(produto.id), item_name: produto.nome, price: produto.preco, quantity: 1 }],
  })
  trackMetaEvent('AddToCart', {
    content_ids: [String(produto.id)],
    content_name: produto.nome,
    value: produto.preco,
    currency: 'BRL',
  })
  trackTikTokEvent('AddToCart', {
    content_id: String(produto.id),
    content_type: 'product',
    content_name: produto.nome,
    value: produto.preco,
    currency: 'BRL',
  })
}

export function trackViewItem(produto: { id: number; nome: string; preco: number }) {
  trackEvent('view_item', {
    currency: 'BRL',
    value: produto.preco,
    items: [{ item_id: String(produto.id), item_name: produto.nome, price: produto.preco }],
  })
  trackMetaEvent('ViewContent', {
    content_ids: [String(produto.id)],
    content_name: produto.nome,
    value: produto.preco,
    currency: 'BRL',
  })
  trackTikTokEvent('ViewContent', {
    content_id: String(produto.id),
    content_type: 'product',
    content_name: produto.nome,
    value: produto.preco,
    currency: 'BRL',
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trackBeginCheckout(total: number, items: any[]) {
  trackEvent('begin_checkout', { currency: 'BRL', value: total, items })
  trackMetaEvent('InitiateCheckout', { value: total, currency: 'BRL', num_items: items.length })
  trackTikTokEvent('InitiateCheckout', {
    content_id: items.map((i: any) => String(i.item_id || i.id)).join(','),
    content_type: 'product',
    value: total,
    currency: 'BRL',
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trackPurchase(orderId: string, total: number, items: any[]) {
  trackEvent('purchase', { transaction_id: orderId, currency: 'BRL', value: total, items })
  trackMetaEvent('Purchase', { value: total, currency: 'BRL' })
  trackTikTokEvent('CompletePayment', { content_id: orderId, value: total, currency: 'BRL' })
}
