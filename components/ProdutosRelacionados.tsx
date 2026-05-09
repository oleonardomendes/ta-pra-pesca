import Link from 'next/link'

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

interface Produto {
  id: number
  nome: string
  codigo: string
  preco: number
  imagemURL: string
}

interface Props {
  produtos: Produto[]
}

export default function ProdutosRelacionados({ produtos }: Props) {
  return (
    <>
      <style>{relStyles}</style>
      <section className="rel-section">
        <div className="rel-header">
          <p className="rel-eyebrow">MAIS PRODUTOS</p>
          <h2 className="rel-title">Você também pode gostar</h2>
        </div>
        <div className="rel-scroll">
          {produtos.map(p => (
            <Link key={p.id} href={`/produto/${p.codigo}`} className="rel-card">
              {p.imagemURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imagemURL} alt={p.nome} className="rel-img" />
              ) : (
                <div className="rel-img rel-img-fallback">🎣</div>
              )}
              <p className="rel-nome">{p.nome}</p>
              <p className="rel-preco">{fmt(p.preco)}</p>
              <span className="rel-ver">Ver produto →</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}

const relStyles = `
  .rel-section { padding: 56px 6%; background: var(--cream); }
  .rel-header { margin-bottom: 32px; }
  .rel-eyebrow {
    font-size: 11px; font-weight: 700; letter-spacing: .16em;
    text-transform: uppercase; color: var(--g500); margin-bottom: 8px;
  }
  .rel-title {
    font-family: var(--ff-display);
    font-size: clamp(26px, 3.5vw, 38px);
    color: var(--g900); letter-spacing: .03em;
  }
  .rel-scroll {
    display: flex; gap: 20px; overflow-x: auto; padding-bottom: 8px;
    scrollbar-width: none;
  }
  .rel-scroll::-webkit-scrollbar { display: none; }
  .rel-card {
    flex-shrink: 0; min-width: 200px; max-width: 220px;
    background: #fff; border: 1px solid var(--border);
    border-radius: var(--r-lg); overflow: hidden;
    text-decoration: none; color: var(--dark);
    display: flex; flex-direction: column;
    transition: transform .2s, box-shadow .2s;
  }
  .rel-card:hover { transform: translateY(-4px); box-shadow: var(--sh-card); }
  .rel-img {
    width: 100%; aspect-ratio: 1; object-fit: contain;
    background: var(--g50);
  }
  .rel-img-fallback {
    display: flex; align-items: center; justify-content: center; font-size: 48px;
  }
  .rel-nome {
    font-size: 13px; font-weight: 600; padding: 12px 14px 4px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; line-height: 1.4;
  }
  .rel-preco {
    font-family: var(--ff-display); font-size: 22px; color: var(--g700);
    padding: 0 14px 8px; letter-spacing: .02em;
  }
  .rel-ver {
    font-size: 12px; font-weight: 700; color: var(--g700);
    padding: 8px 14px 14px; display: block;
    border-top: 1px solid var(--border); margin-top: auto;
  }
`
