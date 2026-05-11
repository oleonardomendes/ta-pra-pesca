import { createSupabaseServerClient } from '@/lib/supabase-client'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'

export default async function ContaPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const nome = user.user_metadata?.nome || user.email

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', padding: '40px 5%' }}>

      {/* Header da conta */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700',
            letterSpacing: '.12em', textTransform: 'uppercase',
            color: 'var(--muted)', marginBottom: '8px' }}>
            Bem-vindo de volta
          </div>
          <h1 style={{ fontFamily: 'var(--ff-display)', fontSize: '48px',
            color: 'var(--g900)', letterSpacing: '.02em', lineHeight: '1' }}>
            {nome}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '8px' }}>
            {user.email}
          </p>
        </div>

        {/* Resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px', marginBottom: '40px' }}>
          {[
            { label: 'Pedidos realizados', val: pedidos?.length || 0 },
            { label: 'Pedidos aprovados',
              val: pedidos?.filter(p => p.status === 'aprovado').length || 0 },
            { label: 'Total investido',
              val: 'R$ ' + (pedidos || [])
                .filter(p => p.status === 'aprovado')
                .reduce((acc, p) => acc + Number(p.total), 0)
                .toLocaleString('pt-BR', { minimumFractionDigits: 2 }) },
          ].map(m => (
            <div key={m.label} style={{ background: '#fff',
              border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
              padding: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)',
                fontWeight: '600', marginBottom: '8px' }}>{m.label}</div>
              <div style={{ fontFamily: 'var(--ff-display)', fontSize: '32px',
                color: 'var(--g700)', letterSpacing: '.02em' }}>{String(m.val)}</div>
            </div>
          ))}
        </div>

        {/* Lista de pedidos */}
        <h2 style={{ fontFamily: 'var(--ff-display)', fontSize: '28px',
          color: 'var(--g900)', marginBottom: '20px', letterSpacing: '.02em' }}>
          MEUS PEDIDOS
        </h2>

        {!pedidos?.length ? (
          <div style={{ background: '#fff', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '40px', textAlign: 'center',
            color: 'var(--muted)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎣</div>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>
              Nenhum pedido ainda
            </div>
            <a href="/" style={{ color: 'var(--g500)', fontWeight: '600' }}>
              Ver produtos →
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pedidos.map(pedido => (
              <div key={pedido.id} style={{ background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)', padding: '20px',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)',
                    marginBottom: '4px' }}>
                    Pedido #{String(pedido.id).slice(0, 8).toUpperCase()}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600',
                    color: 'var(--dark)', marginBottom: '4px' }}>
                    {(pedido.itens as any[]).map((i: any) => i.nome).join(', ')}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px',
                  alignItems: 'center' }}>
                  <div style={{ fontFamily: 'var(--ff-display)',
                    fontSize: '22px', color: 'var(--g700)' }}>
                    R$ {Number(pedido.total).toLocaleString('pt-BR',
                      { minimumFractionDigits: 2 })}
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: '700',
                    padding: '4px 12px', borderRadius: '20px',
                    background: pedido.status === 'aprovado'
                      ? '#EAF3DE' : pedido.status === 'pendente'
                      ? '#FAEEDA' : '#FCEBEB',
                    color: pedido.status === 'aprovado'
                      ? '#3B6D11' : pedido.status === 'pendente'
                      ? '#854F0B' : '#791F1F',
                  }}>
                    {pedido.status === 'aprovado' ? '✓ Aprovado'
                      : pedido.status === 'pendente' ? '⏳ Pendente'
                      : pedido.status === 'cancelado' ? '✗ Cancelado'
                      : pedido.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botão sair */}
        <LogoutButton />
      </div>
    </div>
  )
}
