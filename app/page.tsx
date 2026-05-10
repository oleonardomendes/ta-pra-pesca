import LojaGrid from "@/components/LojaGrid";
import type { BlingProduto } from "@/components/LojaGrid";
import Newsletter from "@/components/Newsletter";
import StoreFooter from "@/components/StoreFooter";
import StoreHeader from "@/components/StoreHeader";
import Link from "next/link";
import { blingFetch } from "@/lib/bling";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lerEstoque(p: any): number {
  const raw = p.estoqueAtual ?? p.estoque ?? p.saldoVirtual ?? null;
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === "number") return raw;
  if (typeof raw === "object") {
    return raw.saldoVirtualTotal ?? raw.saldoFisico ?? raw.saldoVirtual ?? raw.saldo ?? 0;
  }
  return Number(raw) || 0;
}

function detectarCategoria(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes("carretilha")) return "Carretilha";
  if (n.includes("molinete")) return "Molinete";
  if (n.includes("linha") || n.includes("nylon")) return "Linha";
  if (n.includes("vara")) return "Vara";
  return "Outros";
}

interface HomeProps {
  searchParams?: { busca?: string; categoria?: string };
}

export default async function Home({ searchParams = {} }: HomeProps) {
  let produtos: BlingProduto[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, { data: customizacoes }] = await Promise.all([
      blingFetch("/produtos?limite=100&pagina=1"),
      supabase
        .from("produto_customizacoes")
        .select("bling_codigo, nome_custom, preco_custom, imagens, video_url, destaque, descricao_custom"),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customMap: Record<string, any> = Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (customizacoes || []).map((c: any) => [c.bling_codigo, c])
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    produtos = (data?.data ?? []).map((p: any) => {
      const custom = customMap[p.codigo] || null;
      const blingImg = String(p.imagemURL || p.imagemThumbnail || "");
      const imagens: string[] = custom?.imagens?.filter(Boolean).length
        ? custom.imagens.filter(Boolean)
        : [blingImg].filter(Boolean);

      const imagemPrincipal =
        (custom?.imagens?.filter(Boolean) || []).length > 0
          ? custom.imagens.filter(Boolean)[0]
          : blingImg;

      return {
        id: p.id,
        nome: String(custom?.nome_custom || p.nome || ""),
        codigo: String(p.codigo || ""),
        preco: Number(custom?.preco_custom || p.preco || 0),
        precoCusto: Number(p.precoCusto || 0),
        imagemURL: imagemPrincipal,
        imagens,
        estoque: lerEstoque(p),
        descricao: String(custom?.descricao_custom || p.descricaoComplementar || ""),
        categoria: detectarCategoria(String(p.nome || "")),
        video_url: custom?.video_url || null,
        destaque: Boolean(custom?.destaque),
      };
    });
  } catch (e) {
    console.error("Erro ao buscar produtos:", e);
    produtos = [];
  }

  const busca = searchParams.busca?.trim() || "";
  if (busca) {
    const q = busca.toLowerCase();
    produtos = produtos.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        p.descricao.toLowerCase().includes(q)
    );
  }

  const initialCategoria = searchParams.categoria || "";

  return (
    <>
      <style>{pageStyles}</style>

      <StoreHeader />

      <section className="loja-hero">
        <p className="loja-eyebrow">
          {busca ? `Resultados para "${busca}"` : "Todos os produtos"}
        </p>
        <h1 className="loja-titulo">NOSSA LOJA</h1>
        <p className="loja-sub">
          Equipamentos de pesca com procedência. Compre direto e receba em casa.
        </p>
      </section>

      <LojaGrid produtos={produtos} initialCategoria={initialCategoria} />

      <Link href="/kits" className="loja-banner">
        Quer economizar? Veja nossos kits completos →
      </Link>

      <Newsletter />
      <StoreFooter />
    </>
  );
}

const pageStyles = `
  .loja-hero {
    background: var(--g900); padding: 72px 6% 60px;
    text-align: center;
  }
  .loja-eyebrow {
    font-size: 11px; font-weight: 700; letter-spacing: .16em;
    text-transform: uppercase; color: var(--g300); margin-bottom: 14px;
  }
  .loja-titulo {
    font-family: var(--ff-display);
    font-size: clamp(52px, 8vw, 88px);
    color: #fff; letter-spacing: .025em; line-height: .9;
    margin-bottom: 20px;
  }
  .loja-sub {
    font-size: 17px; color: rgba(255,255,255,.65);
    max-width: 480px; margin: 0 auto; line-height: 1.65;
  }
  .loja-banner {
    display: block; background: var(--g700); color: #fff;
    text-align: center; padding: 28px 6%;
    font-size: 17px; font-weight: 700; transition: background .2s;
  }
  .loja-banner:hover { background: var(--g900); }
`;
