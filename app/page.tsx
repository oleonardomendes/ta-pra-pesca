import FiltroCategorias from "@/components/FiltroCategorias";
import Footer from "@/components/Footer";
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

export default async function Home() {
  let produtos: BlingProduto[] = [];

  try {
    const res = await blingFetch("/produtos?limite=100&pagina=1");
    const data = res.ok ? await res.json() : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    produtos = data?.data?.map((p: any) => ({
      id: p.id,
      nome: p.nome,
      codigo: p.codigo,
      preco: p.preco,
      precoCusto: p.precoCusto,
      imagemURL: p.imagemThumbnail || p.imagemURL || "",
      estoque: p.estoqueAtual ?? p.estoque ?? 0,
      descricao: p.descricaoComplementar || "",
      categoria: p.categoria?.descricao || "",
    })) || [];
  } catch (e) {
    console.error("Erro ao buscar produtos:", e);
    produtos = [];
  }

  const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER || "";

  return (
    <>
      <style>{pageStyles}</style>

      <header className="loja-header">
        <Link href="/" className="loja-logo">
          TÁ<span>.</span>PRA<span>.</span>PESCA
        </Link>
        <nav className="loja-nav">
          <Link href="/kits" className="loja-nav-link">
            Kits Especiais →
          </Link>
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="loja-wa-btn"
          >
            WhatsApp
          </a>
        </nav>
      </header>

      <section className="loja-hero">
        <p className="loja-eyebrow">Todos os produtos</p>
        <h1 className="loja-titulo">NOSSA LOJA</h1>
        <p className="loja-sub">
          Equipamentos de pesca com procedência. Compre direto e receba em casa.
        </p>
      </section>

      <FiltroCategorias produtos={produtos} waNumber={waNumber} />

      <Link href="/kits" className="loja-banner">
        Quer economizar? Veja nossos kits completos →
      </Link>

      <Footer />
    </>
  );
}

const pageStyles = `
  .loja-header {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    background: #fff; border-bottom: 1px solid var(--border);
    padding: 0 6%; height: 68px;
    display: flex; align-items: center; justify-content: space-between;
    box-shadow: 0 1px 16px rgba(10,61,43,.06);
  }
  .loja-logo {
    font-family: var(--ff-display); font-size: 28px; letter-spacing: .06em;
    color: var(--g900); line-height: 1;
  }
  .loja-logo span { color: var(--a500); }
  .loja-nav { display: flex; align-items: center; gap: 20px; }
  .loja-nav-link {
    font-size: 14px; font-weight: 600; color: var(--g700);
    transition: color .2s;
  }
  .loja-nav-link:hover { color: var(--g500); }
  .loja-wa-btn {
    display: inline-flex; align-items: center;
    background: var(--a500); color: #fff;
    font-weight: 700; font-size: 13px; letter-spacing: .02em;
    padding: 10px 22px; border-radius: 50px;
    box-shadow: var(--sh-btn-a);
    transition: transform .22s, box-shadow .22s, background .2s;
  }
  .loja-wa-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(212,132,12,.45);
    background: #e8920e;
  }
  .loja-hero {
    background: var(--g900); padding: 140px 6% 80px;
    text-align: center;
  }
  .loja-eyebrow {
    font-size: 11px; font-weight: 700; letter-spacing: .16em;
    text-transform: uppercase; color: var(--g300); margin-bottom: 14px;
  }
  .loja-titulo {
    font-family: var(--ff-display);
    font-size: clamp(56px, 8vw, 96px);
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
  @media (max-width: 480px) {
    .loja-logo { font-size: 22px; }
    .loja-wa-btn { display: none; }
  }
`;
