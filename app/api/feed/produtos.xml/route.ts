import { blingFetch } from '@/lib/bling'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SITE_URL = 'https://taprapesca.com.br'
const MARCA = 'Tá Pra Pesca'

function escapeXml(val: unknown): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function precoFormatado(preco: number): string {
  return `${Number(preco).toFixed(2)} BRL`
}

function googleCategory(nome: string): string {
  const n = nome.toLowerCase()
  if (n.includes('vara')) return 'Sporting Goods > Outdoor Recreation > Fishing > Fishing Rods'
  if (n.includes('carretilha')) return 'Sporting Goods > Outdoor Recreation > Fishing > Fishing Reels'
  if (n.includes('molinete')) return 'Sporting Goods > Outdoor Recreation > Fishing > Fishing Reels'
  if (n.includes('linha') || n.includes('nylon')) return 'Sporting Goods > Outdoor Recreation > Fishing > Fishing Lines & Leaders'
  return 'Sporting Goods > Outdoor Recreation > Fishing'
}

function lerEstoque(p: any): number {
  const raw = p.estoqueAtual ?? p.estoque ?? p.saldoVirtual ?? null
  if (raw === null || raw === undefined) return 0
  if (typeof raw === 'number') return raw
  if (typeof raw === 'object') {
    return raw.saldoVirtualTotal ?? raw.saldoFisico ?? raw.saldoVirtual ?? raw.saldo ?? 0
  }
  return Number(raw) || 0
}

export async function GET() {
  try {
    const [blingData, { data: customizacoes }] = await Promise.all([
      blingFetch('/produtos?limite=100&pagina=1').catch(() => null),
      supabase
        .from('produto_customizacoes')
        .select('bling_codigo, nome_custom, preco_custom, imagens, destaque, descricao_custom'),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customMap: Record<string, any> = Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (customizacoes || []).map((c: any) => [c.bling_codigo, c])
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const produtos = (blingData?.data ?? []).map((p: any) => {
      const custom = customMap[p.codigo] || null
      const blingImg = String(p.imagemURL || p.imagemThumbnail || '')
      const imagens: string[] = custom?.imagens?.filter(Boolean).length
        ? custom.imagens.filter(Boolean)
        : [blingImg].filter(Boolean)

      const nome = String(custom?.nome_custom || p.nome || '')
      const preco = Number(custom?.preco_custom || p.preco || 0)
      const descricao = String(custom?.descricao_custom || p.descricaoComplementar || nome)
      const estoque = lerEstoque(p)
      const codigo = String(p.codigo || p.id)

      return {
        id: codigo,
        nome,
        descricao: descricao || nome,
        link: `${SITE_URL}/produto/${encodeURIComponent(codigo)}`,
        imagem: imagens[0] || '',
        preco,
        disponivel: estoque > 0 ? 'in stock' : 'out of stock',
        marca: MARCA,
        categoria: googleCategory(nome),
      }
    }).filter((p: any) => p.imagem && p.preco > 0)

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Tá Pra Pesca</title>
    <link>${SITE_URL}</link>
    <description>Equipamentos de pesca com procedência</description>
    <language>pt-BR</language>
    ${produtos.map((p: any) => `<item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.nome)}</g:title>
      <g:description>${escapeXml(p.descricao)}</g:description>
      <g:link>${escapeXml(p.link)}</g:link>
      <g:image_link>${escapeXml(p.imagem)}</g:image_link>
      <g:price>${precoFormatado(p.preco)}</g:price>
      <g:sale_price>${(p.preco * 0.95).toFixed(2)} BRL</g:sale_price>
      <g:availability>${p.disponivel}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${escapeXml(p.marca)}</g:brand>
      <g:google_product_category>${escapeXml(p.categoria)}</g:google_product_category>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`).join('\n    ')}
  </channel>
</rss>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (e) {
    console.error('Erro ao gerar feed:', e)
    return new Response('<?xml version="1.0"?><rss version="2.0"><channel><title>Erro</title></channel></rss>', {
      status: 500,
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    })
  }
}
