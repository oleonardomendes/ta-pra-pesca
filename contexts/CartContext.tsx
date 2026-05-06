'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface CartItem {
  id: number
  nome: string
  preco: number
  imagemURL: string
  quantidade: number
}

interface CartContextType {
  items: CartItem[]
  isOpen: boolean
  totalItens: number
  totalPreco: number
  addItem: (item: Omit<CartItem, 'quantidade'>) => void
  removeItem: (id: number) => void
  updateQuantidade: (id: number, quantidade: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const addItem = useCallback((item: Omit<CartItem, 'quantidade'>) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === item.id)
      if (exists) {
        return prev.map(i => i.id === item.id
          ? { ...i, quantidade: i.quantidade + 1 }
          : i
        )
      }
      return [...prev, { ...item, quantidade: 1 }]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((id: number) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const updateQuantidade = useCallback((id: number, quantidade: number) => {
    if (quantidade <= 0) {
      setItems(prev => prev.filter(i => i.id !== id))
    } else {
      setItems(prev => prev.map(i => i.id === id ? { ...i, quantidade } : i))
    }
  }, [])

  const clearCart = useCallback(() => setItems([]), [])
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const totalItens = items.reduce((acc, i) => acc + i.quantidade, 0)
  const totalPreco = items.reduce((acc, i) => acc + i.preco * i.quantidade, 0)

  return (
    <CartContext.Provider value={{
      items, isOpen, totalItens, totalPreco,
      addItem, removeItem, updateQuantidade,
      clearCart, openCart, closeCart
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider')
  return ctx
}
