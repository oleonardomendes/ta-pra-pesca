import { blingFetch } from '@/lib/bling'
import { supabase } from '@/lib/supabase'
import ProdutoImagemUpload from '@/components/admin/ProdutoImagemUpload'

export const dynamic = 'force-dynamic'

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

export default async function AdminProdutosPage() {
  // Busca paralela: produtos Bling + imagens customizadas
  const [blingData, { data: imagensCustom }] = await Promise.all([
    blingFetch('/produtos?limite=100&pagina=1').catch(() => null),
    supabase.from('produto_imagens').select('bling_codigo, imagem_url'),
  ])

  const imagemMap = new Map(
    (imagensCustom ?? []).map((i: { bling_codigo: string; imagem_url: string }) => [
      i.bling_codigo,
      i.imagem_url,
    ])
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const produtos = (blingData?.data ?? []).map((p: any) => ({
    id: p.id,
    nome: p.nome,
    codigo: p.codigo,
    preco: p.preco,
    imagemURL: imagemMap.get(p.codigo) || p.imagemURL || p.imagemThumbnail || '',
    temImagemCustom: imagemMap.has(p.codigo),
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
        <div className="ap-grid">
          {produtos.map((produto: any) => (
            <div key={produto.id} className="ap-card">
              <ProdutoImagemUpload
                blingCodigo={produto.codigo}
                imagemAtual={produto.imagemURL}
                nome={produto.nome}
              />
              <div className="ap-info">
                <p className="ap-nome">{produto.nome}</p>
                <p className="ap-codigo">Cód: {produto.codigo}</p>
                <p className="ap-preco">{fmt(produto.preco)}</p>
                {produto.temImagemCustom && (
                  <span className="ap-badge">✓ Imagem custom</span>
                )}
              </div>
            </div>
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
  .ap-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  .ap-card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: 20px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }
  .ap-info { flex: 1; min-width: 0; }
  .ap-nome {
    font-size: 13px; font-weight: 600; color: var(--dark);
    line-height: 1.4; margin-bottom: 4px;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }
  .ap-codigo { font-size: 11px; color: var(--muted); margin-bottom: 4px; }
  .ap-preco { font-size: 15px; font-weight: 700; color: var(--g700); margin-bottom: 8px; }
  .ap-badge {
    display: inline-block;
    font-size: 10px; font-weight: 700;
    color: #16a34a; background: #dcfce7;
    border-radius: 4px; padding: 2px 6px;
  }
`
