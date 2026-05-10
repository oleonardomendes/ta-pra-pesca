'use client'
import { useEffect } from 'react'
import { trackViewItem } from '@/lib/analytics'

interface Props {
  produto: { id: number; nome: string; preco: number }
}

export function ViewItemTracker({ produto }: Props) {
  useEffect(() => {
    trackViewItem(produto)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produto.id])
  return null
}
