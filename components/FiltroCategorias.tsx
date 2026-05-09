'use client'

interface Props {
  categorias: string[]
  categoriaAtiva: string
  onFiltrar: (categoria: string) => void
}

export default function FiltroCategorias({ categorias, categoriaAtiva, onFiltrar }: Props) {
  return (
    <>
      <style>{styles}</style>
      <div className="filtro-section">
        <div className="filtro-pills">
          {categorias.map(cat => (
            <button
              key={cat}
              className={`filtro-pill${categoriaAtiva === cat ? ' active' : ''}`}
              onClick={() => onFiltrar(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

const styles = `
  .filtro-section {
    background: var(--cream);
    padding: 48px 6% 0;
  }
  .filtro-pills { display: flex; flex-wrap: wrap; gap: 10px; }
  .filtro-pill {
    padding: 8px 20px; border-radius: 50px;
    border: 1.5px solid var(--border); background: transparent;
    color: var(--muted); font-family: var(--ff-body);
    font-size: 14px; font-weight: 600; cursor: pointer; transition: all .2s;
  }
  .filtro-pill:hover { border-color: var(--g500); color: var(--g700); }
  .filtro-pill.active { background: var(--g900); color: #fff; border-color: var(--g900); }
  @media (max-width: 640px) { .filtro-section { padding: 32px 5% 0; } }
`
