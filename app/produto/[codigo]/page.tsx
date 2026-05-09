import { notFound } from 'next/navigation'
import Link from 'next/link'
import { blingFetch } from '@/lib/bling'
import { supabase } from '@/lib/supabase'
import StoreHeader from '@/components/StoreHeader'
import StoreFooter from '@/components/StoreFooter'
import ProdutoGaleria from '@/components/ProdutoGaleria'
import ProdutoAcoes from '@/components/ProdutoAcoes'
import CombinacoesSugeridas from '@/components/CombinacoesSugeridas'
import ProdutosRelacionados from '@/components/ProdutosRelacionados'

export const dynamic = 'force-dynamic'

function detectarCategoria(nome: string): string {
  const n = nome.toLowerCase()
  if (n.includes('carretilha')) return 'Carretilha'
  if (n.includes('molinete')) return 'Molinete'
  if (n.includes('linha') || n.includes('nylon')) return 'Linha'
  if (n.includes('vara')) return 'Vara'
  return 'Outros'
}

function parsearEspecificacoes(nome: string): { label: string; value: string }[] {
  const specs: { label: string; value: string }[] = []

  const compDecMatch = nome.match(/(\d+[,.]\d+)\s*m(?!m)/i)
  if (compDecMatch) {
    specs.push({ label: 'Comprimento', value: compDecMatch[1].replace('.', ',') + 'm' })
  } else {
    const smallCompMatch = nome.match(/\b([1-9])\s*m(?!m|\d)/i)
    if (smallCompMatch) {
      specs.push({ label: 'Comprimento', value: smallCompMatch[1] + 'm' })
    }
  }

  const resLbsMatch = nome.match(/(\d+[-–]\d+)\s*lbs/i)
  if (resLbsMatch) {
    specs.push({ label: 'Resistência', value: resLbsMatch[1] + ' lbs' })
  }

  const rolMatch = nome.match(/(\d+(?:\+\d+)?)\s*[Rr]olamentos/i)
  if (rolMatch) {
    specs.push({ label: 'Rolamentos', value: rolMatch[1] + ' rolamentos' })
  }

  if (/carbono|fibra/i.test(nome)) {
    specs.push({ label: 'Material', value: 'Fibra de Carbono' })
  }

  if (/para\s+carretilha/i.test(nome)) {
    specs.push({ label: 'Tipo', value: 'Para Carretilha' })
  } else if (/para\s+molinete/i.test(nome)) {
    specs.push({ label: 'Tipo', value: 'Para Molinete' })
  } else if (/telesc[oó]pica/i.test(nome)) {
    specs.push({ label: 'Tipo', value: 'Telescópica' })
  }

  const metMatch = nome.match(/\b(\d{3,})\s*m(?!m)/i)
  if (metMatch) {
    specs.push({ label: 'Metragem', value: metMatch[1] + 'm' })
  }

  const diaMatch = nome.match(/(\d+[,.]\d+)\s*mm/i)
  if (diaMatch) {
    specs.push({ label: 'Diâmetro', value: diaMatch[1].replace('.', ',') + 'mm' })
  }

  const kgMatch = nome.match(/(\d+[,.]?\d+)\s*kg/i)
  if (kgMatch) {
    specs.push({ label: 'Resistência', value: kgMatch[1].replace('.', ',') + 'kg' })
  }

  return specs
}

interface ProdutoPage {
  id: number
  nome: string
  codigo: string
  preco: number
  descricao: string
  imagens: string[]
  imagemURL: string
  video_url: string | null
  estoque: number
  destaque: boolean
  categoria: string
}

function getSugerido(
  lista: ProdutoPage[],
  categoria: string,
  excluirId: number,
  filtroNome?: string
): ProdutoPage | null {
  return lista.find(p =>
    p.categoria === categoria &&
    p.id !== excluirId &&
    (!filtroNome || p.nome.toLowerCase().includes(filtroNome.toLowerCase()))
  ) ?? null
}

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

export default async function ProdutoPage({ params }: { params: { codigo: string } }) {
  let todosProdutos: ProdutoPage[] = []

  try {
    const [data, { data: customizacoes }] = await Promise.all([
      blingFetch('/produtos?limite=100&pagina=1'),
      supabase
        .from('produto_customizacoes')
        .select('bling_codigo, nome_custom, preco_custom, imagens, video_url, destaque, descricao_custom'),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customMap: Record<string, any> = Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (customizacoes || []).map((c: any) => [c.bling_codigo, c])
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    todosProdutos = (data?.data ?? []).map((p: any) => {
      const custom = customMap[p.codigo] || null
      const blingImg = String(p.imagemURL || p.imagemThumbnail || '')
      const imagens: string[] = custom?.imagens?.filter(Boolean).length
        ? custom.imagens.filter(Boolean)
        : [blingImg].filter(Boolean)

      return {
        id: p.id,
        nome: String(custom?.nome_custom || p.nome || ''),
        codigo: String(p.codigo || ''),
        preco: Number(custom?.preco_custom || p.preco || 0),
        descricao: String(custom?.descricao_custom || p.descricaoComplementar || ''),
        imagens,
        imagemURL: imagens[0] || '',
        video_url: custom?.video_url || null,
        estoque: Number(
          typeof p.estoqueAtual === 'object'
            ? p.estoqueAtual?.saldoVirtualTotal ?? 0
            : p.estoqueAtual ?? 0
        ),
        destaque: Boolean(custom?.destaque),
        categoria: detectarCategoria(String(p.nome || '')),
      }
    })
  } catch (e) {
    console.error('[produto] erro ao buscar dados:', e)
  }

  const produto = todosProdutos.find(p => p.codigo === params.codigo)
  if (!produto) notFound()

  const produtosRelacionados = todosProdutos
    .filter(p => p.categoria === produto.categoria && p.id !== produto.id)
    .slice(0, 4)

  // Combinações sugeridas por categoria
  const nomeMin = produto.nome.toLowerCase()
  const cat = produto.categoria
  const combinacoes: ProdutoPage[] = []

  if (cat === 'Vara') {
    if (/para\s+carretilha/i.test(nomeMin)) {
      const c = getSugerido(todosProdutos, 'Carretilha', produto.id)
      const l = getSugerido(todosProdutos, 'Linha', produto.id)
      if (c) combinacoes.push(c)
      if (l) combinacoes.push(l)
    } else {
      const m = getSugerido(todosProdutos, 'Molinete', produto.id)
      const l = getSugerido(todosProdutos, 'Linha', produto.id)
      if (m) combinacoes.push(m)
      if (l) combinacoes.push(l)
    }
  } else if (cat === 'Molinete') {
    const v = getSugerido(todosProdutos, 'Vara', produto.id, 'molinete')
         ?? getSugerido(todosProdutos, 'Vara', produto.id)
    const l = getSugerido(todosProdutos, 'Linha', produto.id)
    if (v) combinacoes.push(v)
    if (l) combinacoes.push(l)
  } else if (cat === 'Carretilha') {
    const v = getSugerido(todosProdutos, 'Vara', produto.id, 'carretilha')
         ?? getSugerido(todosProdutos, 'Vara', produto.id)
    const l = getSugerido(todosProdutos, 'Linha', produto.id)
    if (v) combinacoes.push(v)
    if (l) combinacoes.push(l)
  } else if (cat === 'Linha') {
    const v = getSugerido(todosProdutos, 'Vara', produto.id)
    const m = getSugerido(todosProdutos, 'Molinete', produto.id)
    if (v) combinacoes.push(v)
    if (m) combinacoes.push(m)
  }

  const specs = parsearEspecificacoes(produto.nome)

  const nomeBreve = produto.nome.length > 40
    ? produto.nome.slice(0, 40) + '…'
    : produto.nome

  const estoqueInfo =
    produto.estoque === 0
      ? { text: '✗ Indisponível', color: '#ef4444' }
      : produto.estoque <= 5
      ? { text: `⚠ Últimas ${produto.estoque} unidades`, color: '#f59e0b' }
      : { text: '✓ Em estoque', color: '#22c55e' }

  return (
    <>
      <style>{pageStyles}</style>
      <StoreHeader />

      <main className="pp-main">
        {/* Breadcrumb */}
        <nav className="pp-breadcrumb">
          <Link href="/">Loja</Link>
          <span className="pp-bc-sep">→</span>
          <Link href={`/?categoria=${encodeURIComponent(produto.categoria)}`}>
            {produto.categoria}
          </Link>
          <span className="pp-bc-sep">→</span>
          <span className="pp-bc-atual">{nomeBreve}</span>
        </nav>

        {/* Seção principal */}
        <div className="pp-section">
          <ProdutoGaleria
            imagens={produto.imagens}
            videoUrl={produto.video_url}
            nome={produto.nome}
          />

          <div className="pp-info">
            {produto.destaque && (
              <span className="pp-badge-dest">⭐ Destaque</span>
            )}

            <h1 className="pp-nome">{produto.nome}</h1>
            <p className="pp-preco">{fmt(produto.preco)}</p>

            <div className="pp-pix-badge">
              PIX: {fmt(produto.preco * 0.95)} — 5% de desconto
            </div>

            <div className="pp-estoque" style={{ color: estoqueInfo.color }}>
              {estoqueInfo.text}
            </div>

            {specs.length > 0 && (
              <div className="pp-specs">
                <p className="pp-specs-title">Especificações técnicas</p>
                <ul className="pp-specs-list">
                  {specs.map((spec, i) => (
                    <li key={i} className="pp-spec-item">
                      <span className="pp-spec-check">✓</span>
                      <span><strong>{spec.label}:</strong> {spec.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {produto.descricao && (
              <div className="pp-descricao">
                <p className="pp-desc-title">Sobre o produto</p>
                <p className="pp-desc-text">{produto.descricao}</p>
              </div>
            )}

            <ProdutoAcoes
              id={produto.id}
              nome={produto.nome}
              preco={produto.preco}
              imagemURL={produto.imagemURL}
              codigo={produto.codigo}
            />
          </div>
        </div>

        {combinacoes.length > 0 && (
          <CombinacoesSugeridas
            produtoAtual={{
              id: produto.id,
              nome: produto.nome,
              codigo: produto.codigo,
              preco: produto.preco,
              imagemURL: produto.imagemURL,
            }}
            combinacoes={combinacoes.map(p => ({
              id: p.id,
              nome: p.nome,
              codigo: p.codigo,
              preco: p.preco,
              imagemURL: p.imagemURL,
            }))}
          />
        )}

        {produtosRelacionados.length > 0 && (
          <ProdutosRelacionados
            produtos={produtosRelacionados.map(p => ({
              id: p.id,
              nome: p.nome,
              codigo: p.codigo,
              preco: p.preco,
              imagemURL: p.imagemURL,
            }))}
          />
        )}
      </main>

      <StoreFooter />
    </>
  )
}

const pageStyles = `
  .pp-main { background: var(--cream); min-height: 60vh; }
  .pp-breadcrumb {
    padding: 14px 6%;
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; color: var(--muted);
    background: #fff; border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }
  .pp-breadcrumb a { color: var(--g700); transition: color .15s; }
  .pp-breadcrumb a:hover { color: var(--g900); text-decoration: underline; }
  .pp-bc-sep { color: var(--border); }
  .pp-bc-atual { color: var(--dark); font-weight: 500; }
  .pp-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    padding: 48px 6%;
    max-width: 1200px;
    margin: 0 auto;
  }
  .pp-info { display: flex; flex-direction: column; gap: 16px; }
  .pp-badge-dest {
    display: inline-block; align-self: flex-start;
    background: var(--a500); color: #fff;
    font-size: 11px; font-weight: 700;
    padding: 4px 12px; border-radius: 50px;
  }
  .pp-nome {
    font-family: var(--ff-display);
    font-size: 32px; color: var(--dark);
    letter-spacing: .02em; line-height: 1.15;
  }
  .pp-preco {
    font-family: var(--ff-display);
    font-size: 28px; color: var(--g700);
    letter-spacing: .02em;
  }
  .pp-pix-badge {
    display: inline-block; align-self: flex-start;
    background: #dcfce7; color: #15803d;
    font-size: 13px; font-weight: 700;
    padding: 6px 16px; border-radius: 50px;
  }
  .pp-estoque { font-size: 14px; font-weight: 700; }
  .pp-specs { border-top: 1px solid var(--border); padding-top: 16px; }
  .pp-specs-title {
    font-size: 12px; font-weight: 700; color: var(--g900);
    text-transform: uppercase; letter-spacing: .09em; margin-bottom: 10px;
  }
  .pp-specs-list { display: flex; flex-direction: column; gap: 6px; }
  .pp-spec-item {
    display: flex; align-items: baseline; gap: 8px;
    font-size: 14px; color: var(--dark);
  }
  .pp-spec-check { color: #22c55e; font-weight: 700; flex-shrink: 0; }
  .pp-descricao { border-top: 1px solid var(--border); padding-top: 16px; }
  .pp-desc-title {
    font-size: 14px; font-weight: 700; color: var(--dark); margin-bottom: 8px;
  }
  .pp-desc-text { font-size: 14px; color: var(--muted); line-height: 1.7; }
  @media (max-width: 768px) {
    .pp-section {
      grid-template-columns: 1fr;
      gap: 28px;
      padding: 28px 5%;
    }
    .pp-nome { font-size: 24px; }
    .pp-preco { font-size: 24px; }
  }
`
