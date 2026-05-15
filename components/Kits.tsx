import { kits } from "@/data/kits";
import Link from "next/link";

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="#1D9E75" strokeWidth="2.5" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="var(--a500)" aria-hidden>
      <path d="M20 12V22H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  );
}

export default function Kits() {
  return (
    <>
      <style>{`
        .kits { background: var(--cream); }
        .kits-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 22px; align-items: start;
        }
        .kit-card {
          background: var(--white); border: 1.5px solid var(--border);
          border-radius: var(--r-xl); padding: 32px 28px 28px;
          position: relative; box-shadow: var(--sh-card);
          transition: transform .3s ease, box-shadow .3s ease;
        }
        .kit-card:hover { transform: translateY(-8px); box-shadow: 0 16px 52px rgba(10,61,43,.11); }
        .kit-card.featured {
          border-color: var(--g500); border-width: 2px;
          background: linear-gradient(155deg, #fff 55%, var(--g50) 100%);
          transform: translateY(-10px); box-shadow: 0 20px 60px rgba(15,92,69,.17); z-index: 2;
        }
        .kit-card.featured:hover { transform: translateY(-18px); }
        .kit-badge {
          position: absolute; top: -15px; left: 50%; transform: translateX(-50%);
          background: var(--g700); color: #fff;
          font-size: 10.5px; font-weight: 800;
          letter-spacing: .12em; text-transform: uppercase;
          padding: 5px 20px; border-radius: 50px; white-space: nowrap;
        }
        .kit-tag {
          display: inline-block; font-size: 10.5px; font-weight: 700;
          letter-spacing: .12em; text-transform: uppercase;
          padding: 4px 13px; border-radius: 50px; margin-bottom: 18px;
        }
        .kit-tag.t-entry { background: var(--g50); color: var(--g700); }
        .kit-tag.t-mid   { background: var(--g50); color: var(--g700); }
        .kit-tag.t-pro   { background: var(--a50); color: var(--a700); }
        .kit-name {
          font-family: var(--ff-display); font-size: 36px;
          color: var(--g900); letter-spacing: .03em; line-height: .95; margin-bottom: 10px;
        }
        .kit-tagline { font-size: 13.5px; color: var(--muted); line-height: 1.55; margin-bottom: 26px; }
        .kit-price { font-family: var(--ff-display); font-size: 58px; color: var(--g700); letter-spacing: .02em; line-height: 1; }
        .kit-card.featured .kit-price { color: var(--g900); }
        .kit-price-note { font-size: 12px; color: var(--muted); margin-top: 5px; margin-bottom: 26px; }
        .kit-sep { height: 1px; background: var(--border); margin: 0 0 22px; }
        .kit-items-lbl {
          font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 14px;
        }
        .kit-item {
          display: flex; gap: 11px; align-items: flex-start;
          font-size: 13px; color: var(--dark); line-height: 1.45; margin-bottom: 10px;
        }
        .kit-check {
          width: 20px; height: 20px; border-radius: 50%; background: var(--g50);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 1px;
        }
        .kit-card.featured .kit-check { background: rgba(29,158,117,.15); }
        .kit-bonus {
          margin-top: 18px; background: var(--a50);
          border: 1px solid rgba(212,132,12,.22); border-radius: var(--r-md);
          padding: 12px 15px; display: flex; align-items: center; gap: 12px;
        }
        .kit-bonus-text { font-size: 13px; font-weight: 700; color: var(--a700); line-height: 1.35; }
        .kit-bonus-sub  { font-size: 11px; color: var(--a500); }
        .kit-cta {
          display: block; text-align: center; margin-top: 24px;
          padding: 15px 20px; border-radius: 50px;
          font-size: 14px; font-weight: 800; letter-spacing: .03em; transition: all .22s;
        }
        .kit-cta.c-outline { border: 1.5px solid var(--border); color: var(--g700); background: transparent; }
        .kit-cta.c-outline:hover { border-color: var(--g500); background: var(--g50); transform: translateY(-2px); }
        .kit-cta.c-main { background: var(--g700); color: #fff; box-shadow: var(--sh-btn-g); }
        .kit-cta.c-main:hover { background: var(--g900); transform: translateY(-3px); }
        .kit-cta.c-amber { background: var(--a500); color: #fff; box-shadow: var(--sh-btn-a); }
        .kit-cta.c-amber:hover { background: #e8920e; transform: translateY(-3px); }
        @media (max-width: 960px) {
          .kits-grid { grid-template-columns: 1fr; }
          .kit-card.featured { transform: none; }
          .kit-card.featured:hover { transform: translateY(-8px); }
        }
      `}</style>

      <section className="kits rv" id="kits">
        <div className="sec-header rv">
          <div className="sec-eyebrow">Nossos kits</div>
          <h2 className="sec-title">ESCOLHA O KIT<br />CERTO PRA VOCÊ</h2>
          <p className="sec-sub">
            Cada kit foi montado com equipamento compatível e testado — pra você
            chegar na água sem improviso e sem desculpa.
          </p>
        </div>

        <div className="kits-grid">
          {kits.map((kit) => (
            <article
              key={kit.id}
              className={`kit-card rv d${kit.id}${kit.featured ? " featured" : ""}`}
            >
              {kit.featured && (
                <div className="kit-badge">⭐ Mais completo</div>
              )}
              <span className={`kit-tag t-${kit.tagStyle}`}>{kit.tag}</span>
              <h3 className="kit-name">
                {kit.name}<br />{kit.nameBreak}
              </h3>
              <p className="kit-tagline">{kit.tagline}</p>

              <div className="kit-price">R$&nbsp;{kit.price}</div>
              <div className="kit-price-note">ou em até 12x no cartão</div>
              <div className="kit-sep" />

              <div className="kit-items-lbl">O que vem no kit</div>
              {kit.items.map((item, idx) => (
                <div className="kit-item" key={idx}>
                  <div className="kit-check"><CheckIcon /></div>
                  {item.text}
                </div>
              ))}

              {kit.bonus && (
                <div className="kit-bonus">
                  <GiftIcon />
                  <div>
                    <div className="kit-bonus-text">{kit.bonus.text}</div>
                    <div className="kit-bonus-sub">{kit.bonus.sub}</div>
                  </div>
                </div>
              )}

              <Link
                href={`/kits/checkout?kit=${kit.id}`}
                className={`kit-cta c-${kit.ctaStyle}`}
                aria-label={`Comprar ${kit.name} ${kit.nameBreak}`}
              >
                Quero esse kit →
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
