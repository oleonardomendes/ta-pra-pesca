import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface KitCustom {
  id: string
  nome: string
  subtitulo: string
  tagline: string
  preco: number
  imagem_url: string
  bonus_texto: string
  bonus_subtitulo: string
  destaque: boolean
  ativo: boolean
  itens: string[]
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="#1D9E75" strokeWidth="2.5" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="var(--a500)" aria-hidden>
      <path d="M20 12V22H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  )
}

export default async function KitsCustom() {
  const { data: kits } = await supabase
    .from('kits_custom')
    .select('*')
    .eq('ativo', true)
    .order('created_at', { ascending: true })

  if (!kits || kits.length === 0) return null

  return (
    <section className="kits" style={{ paddingTop: 0 }}>
      <div className="sec-header rv">
        <div className="sec-eyebrow">Kits exclusivos</div>
        <h2 className="sec-title">MAIS OPÇÕES<br />PARA VOCÊ</h2>
      </div>

      <div className="kits-grid">
        {(kits as KitCustom[]).map((kit) => (
          <article
            key={kit.id}
            className={`kit-card rv${kit.destaque ? ' featured' : ''}`}
          >
            {kit.destaque && (
              <div className="kit-badge">⭐ Mais completo</div>
            )}

            {kit.imagem_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={kit.imagem_url}
                alt={kit.nome}
                style={{
                  width: '100%', height: 180, objectFit: 'contain',
                  borderRadius: 12, background: 'var(--g50)',
                  marginBottom: 16, display: 'block',
                }}
              />
            )}

            <h3 className="kit-name">
              {kit.nome}{kit.subtitulo && <><br />{kit.subtitulo}</>}
            </h3>
            {kit.tagline && <p className="kit-tagline">{kit.tagline}</p>}

            <div className="kit-price">R$&nbsp;{kit.preco}</div>
            <div className="kit-price-note">ou em até 12x no cartão</div>
            <div className="kit-sep" />

            {kit.itens && kit.itens.length > 0 && (
              <>
                <div className="kit-items-lbl">O que vem no kit</div>
                {kit.itens.map((item, idx) => (
                  <div className="kit-item" key={idx}>
                    <div className="kit-check"><CheckIcon /></div>
                    {item}
                  </div>
                ))}
              </>
            )}

            {kit.bonus_texto && (
              <div className="kit-bonus">
                <GiftIcon />
                <div>
                  <div className="kit-bonus-text">{kit.bonus_texto}</div>
                  {kit.bonus_subtitulo && (
                    <div className="kit-bonus-sub">{kit.bonus_subtitulo}</div>
                  )}
                </div>
              </div>
            )}

            <Link
              href={`/kits/checkout/db?kit=${kit.id}`}
              className={`kit-cta ${kit.destaque ? 'c-amber' : 'c-main'}`}
              aria-label={`Comprar ${kit.nome}`}
            >
              Quero esse kit →
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
