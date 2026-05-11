'use client'

interface Props {
  checkoutUrl: string
  kitPreco: number
  kitNome?: string
}

export default function MPCheckoutBrick({ checkoutUrl, kitPreco }: Props) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <a
        href={checkoutUrl}
        style={{
          display: 'block', width: '100%', padding: '14px',
          background: '#009ee3', color: '#fff', borderRadius: '50px',
          textAlign: 'center', fontWeight: '700', fontSize: '15px',
          textDecoration: 'none', fontFamily: 'var(--ff-body)',
          transition: 'background .2s, transform .15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#007ebb'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#009ee3'; (e.currentTarget as HTMLAnchorElement).style.transform = 'none' }}
      >
        Pagar {fmt(kitPreco)} com cartão via Mercado Pago
      </a>
      <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', margin: 0 }}>
        Você será redirecionado para o Mercado Pago
      </p>
    </div>
  )
}
