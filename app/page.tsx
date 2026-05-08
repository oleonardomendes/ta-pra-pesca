import FiltroCategorias from "@/components/FiltroCategorias";
import Newsletter from "@/components/Newsletter";
import StoreFooter from "@/components/StoreFooter";
import StoreHeader from "@/components/StoreHeader";
import Link from "next/link";
import { blingFetch } from "@/lib/bling";

export const dynamic = "force-dynamic";

interface BlingProduto {
  id: number;
  nome: string;
  preco: number;
  precoCusto: number;
  imagemURL: string;
  estoque: number;
  codigo: string;
  descricao: string;
  categoria: string;
}

interface HomeProps {
  searchParams?: { busca?: string; categoria?: string };
}

export default async function Home({ searchParams = {} }: HomeProps) {
  let produtos: BlingProduto[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await blingFetch("/produtos?limite=100&pagina=1");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    produtos = data?.data?.map((p: any) => ({
      id: p.id,
      nome: p.nome,
      codigo: p.codigo,
      preco: p.preco,
      precoCusto: p.precoCusto,
      imagemURL: p.imagemURL || p.imagemThumbnail || "",
      estoque: p.estoqueAtual ?? p.estoque ?? 0,
      descricao: p.descricaoComplementar || "",
      categoria: p.categoria?.descricao || "",
    })) || [];
  } catch (e) {
    console.error("Erro ao buscar produtos:", e);
    produtos = [];
  }

  // Filtro server-side por busca
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

      <FiltroCategorias produtos={produtos} initialCategoria={initialCategoria} />

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
    font-size: 17px; font-weight: 700;
    transition: background .2s;
  }
  .loja-banner:hover { background: var(--g900); }
`;
