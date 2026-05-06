'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

export default function CartDrawer() {
  const { items, isOpen, totalItens, totalPreco, removeItem, updateQuantidade, closeCart } = useCart()

  return (
    <>
      <style>{styles}</style>

      <div className={`cd-overlay${isOpen ? ' open' : ''}`} onClick={closeCart} />

      <div className={`cd-panel${isOpen ? ' open' : ''}`} role="dialog" aria-label="Carrinho de compras">
        <div className="cd-header">
          <span className="cd-title">
            Meu Carrinho ({totalItens} {totalItens === 1 ? 'item' : 'itens'})
          </span>
          <button className="cd-close" onClick={closeCart} aria-label="Fechar carrinho">✕</button>
        </div>

        {items.length === 0 ? (
          <div className="cd-empty">
            <span style={{ fontSize: 48 }}>🛒</span>
            <p>Seu carrinho está vazio.</p>
            <button className="cd-btn-outline" onClick={closeCart}>Continuar comprando</button>
          </div>
        ) : (
          <>
            <ul className="cd-items">
              {items.map(item => (
                <li key={item.id} className="cd-item">
                  <div className="cd-item-img">
                    {item.imagemURL ? (
                      <Image
                        src={item.imagemURL}
                        alt={item.nome}
                        width={80}
                        height={80}
                        style={{ objectFit: 'contain', borderRadius: 8, width: 80, height: 80 }}
                      />
                    ) : (
                      <div className="cd-item-img-fallback">🎣</div>
                    )}
                  </div>
                  <div className="cd-item-info">
                    <p className="cd-item-nome">{item.nome}</p>
                    <p className="cd-item-preco">{fmt(item.preco)}</p>
                    <div className="cd-item-qty">
                      <button onClick={() => updateQuantidade(item.id, item.quantidade - 1)} aria-label="Diminuir">−</button>
                      <span>{item.quantidade}</span>
                      <button onClick={() => updateQuantidade(item.id, item.quantidade + 1)} aria-label="Aumentar">+</button>
                      <button className="cd-item-remove" onClick={() => removeItem(item.id)}>remover</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="cd-footer">
              <div className="cd-subtotal">
                <span>Subtotal</span>
                <span className="cd-subtotal-val">{fmt(totalPreco)}</span>
              </div>
              <button className="cd-btn-outline" onClick={closeCart}>Continuar comprando</button>
              <Link href="/checkout/cart" className="cd-btn-amber" onClick={closeCart}>
                Finalizar compra
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}

const styles = `
  .cd-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(0,0,0,0.5);
    opacity: 0; pointer-events: none;
    transition: opacity 0.35s ease;
  }
  .cd-overlay.open { opacity: 1; pointer-events: all; }

  .cd-panel {
    position: fixed; top: 0; right: 0; bottom: 0; z-index: 301;
    width: 400px; max-width: 100vw;
    background: #fff;
    display: flex; flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.35s ease;
    box-shadow: -4px 0 32px rgba(0,0,0,.12);
  }
  .cd-panel.open { transform: translateX(0); }

  .cd-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .cd-title { font-size: 16px; font-weight: 700; color: var(--g900); }
  .cd-close {
    background: none; border: none; cursor: pointer;
    font-size: 18px; color: var(--muted); padding: 4px 8px;
    transition: color .2s; border-radius: 4px;
  }
  .cd-close:hover { color: var(--g900); background: var(--g50); }

  .cd-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px;
    color: var(--muted); font-size: 15px; padding: 40px; text-align: center;
  }

  .cd-items {
    flex: 1; overflow-y: auto; padding: 16px 24px;
    display: flex; flex-direction: column; gap: 0;
    list-style: none;
  }
  .cd-item {
    display: flex; gap: 16px; align-items: flex-start;
    padding: 16px 0; border-bottom: 1px solid var(--border);
  }
  .cd-item:last-child { border-bottom: none; }
  .cd-item-img { flex-shrink: 0; }
  .cd-item-img-fallback {
    width: 80px; height: 80px; border-radius: 8px;
    background: var(--g50); display: flex;
    align-items: center; justify-content: center; font-size: 28px;
  }
  .cd-item-info { flex: 1; min-width: 0; }
  .cd-item-nome {
    font-size: 13px; font-weight: 600; color: var(--dark);
    line-height: 1.4; margin-bottom: 4px;
    overflow: hidden; text-overflow: ellipsis;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  }
  .cd-item-preco { font-size: 14px; font-weight: 700; color: var(--g700); margin-bottom: 10px; }
  .cd-item-qty { display: flex; align-items: center; gap: 6px; }
  .cd-item-qty > button {
    width: 28px; height: 28px; border-radius: 50%;
    border: 1.5px solid var(--border); background: transparent;
    font-size: 16px; cursor: pointer; color: var(--g700);
    display: flex; align-items: center; justify-content: center;
    transition: all .2s; font-family: var(--ff-body);
  }
  .cd-item-qty > button:hover { background: var(--g50); border-color: var(--g500); }
  .cd-item-qty > span {
    font-size: 14px; font-weight: 600; color: var(--dark);
    min-width: 22px; text-align: center;
  }
  .cd-item-remove {
    background: none; border: none; cursor: pointer;
    font-size: 11px; color: var(--muted); margin-left: 4px;
    text-decoration: underline; font-family: var(--ff-body);
    padding: 0;
  }
  .cd-item-remove:hover { color: #c00; }

  .cd-footer {
    padding: 20px 24px;
    border-top: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 10px;
    flex-shrink: 0;
  }
  .cd-subtotal {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 4px;
  }
  .cd-subtotal > span { font-size: 14px; color: var(--muted); }
  .cd-subtotal-val { font-size: 22px; font-weight: 700; color: var(--g900); }

  .cd-btn-outline {
    display: block; text-align: center; width: 100%;
    padding: 13px; border-radius: 50px;
    border: 1.5px solid var(--border); background: transparent;
    color: var(--g700); font-size: 14px; font-weight: 600;
    cursor: pointer; font-family: var(--ff-body);
    transition: all .2s;
  }
  .cd-btn-outline:hover { border-color: var(--g500); background: var(--g50); }

  .cd-btn-amber {
    display: block; text-align: center; width: 100%;
    padding: 13px; border-radius: 50px;
    background: var(--a500); color: #fff;
    font-size: 14px; font-weight: 700;
    box-shadow: var(--sh-btn-a);
    transition: background .2s, transform .2s;
  }
  .cd-btn-amber:hover { background: #e8920e; transform: translateY(-2px); }

  @media (max-width: 440px) { .cd-panel { width: 100vw; } }
`
