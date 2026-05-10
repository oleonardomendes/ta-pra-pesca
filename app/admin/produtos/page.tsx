import { blingFetch } from '@/lib/bling'
import { supabase } from '@/lib/supabase'
import ProdutoAdminCard from '@/components/admin/ProdutoAdminCard'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lerEstoque(p: any): number {
  const raw = p.estoqueAtual ?? p.estoque ?? p.saldoVirtual ?? null
  if (raw === null || raw === undefined) return 0
  if (typeof raw === 'number') return raw
  if (typeof raw === 'object') {
    return raw.saldoVirtualTotal ?? raw.saldoFisico ?? raw.saldoVirtual ?? raw.saldo ?? 0
  }
  return Number(raw) || 0
}

export default async function AdminProdutosPage() {
  const [blingData, { data: customizacoes }] = await Promise.all([
    blingFetch('/produtos?limite=100&pagina=1').catch(() => null),
    supabase.from('produto_customizacoes').select('*'),
  ])

  const customMap = Object.fromEntries(
    (customizacoes ?? []).map((c: any) => [c.bling_codigo, c])
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const produtos = (blingData?.data ?? []).map((p: any) => ({
    id: p.id,
    nome: String(p.nome || ''),
    codigo: String(p.codigo || ''),
    preco: Number(p.preco || 0),
    imagemURL: String(p.imagemURL || p.imagemThumbnail || ''),
    estoque: lerEstoque(p),
  }))

  return (
    <>
      <style>{styles}</style>

      <div className="ap-header">
        <h1 className="ap-title">Produtos</h1>
        <p className="ap-count">{produtos.length} produtos cadastrados no Bling</p>
      </div>

      {produtos.length === 0 ? (
        <div className="ap-empty">Nenhum produto encontrado. Verifique a conexão com o Bling.</div>
      ) : (
        <div className="ap-list">
          {produtos.map((produto: any) => (
            <ProdutoAdminCard
              key={produto.id}
              produto={produto}
              customizacao={customMap[produto.codigo] ?? null}
            />
          ))}
        </div>
      )}
    </>
  )
}

const styles = `
  .ap-header { margin-bottom: 32px; }
  .ap-title {
    font-family: var(--ff-display);
    font-size: 36px; color: var(--g900);
    letter-spacing: .03em; margin-bottom: 4px;
  }
  .ap-count { font-size: 14px; color: var(--muted); }
  .ap-empty {
    text-align: center; padding: 60px;
    color: var(--muted); font-size: 15px;
  }
  .ap-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
`
