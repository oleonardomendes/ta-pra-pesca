import Link from "next/link";

export default function Hero() {
  return (
    <>
      <style>{`
        .hero {
          min-height: 100vh;
          background: var(--g900);
          position: relative;
          display: flex;
          align-items: center;
          padding: 130px 6% 90px;
          overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 65% 55% at 85% 45%, rgba(29,158,117,.22) 0%, transparent 65%),
            radial-gradient(ellipse 45% 70% at 5% 85%, rgba(212,132,12,.12) 0%, transparent 55%),
            radial-gradient(ellipse 30% 40% at 50% 10%, rgba(29,158,117,.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .hero::after {
          content: '';
          position: absolute; inset: 0;
          background-image: repeating-linear-gradient(
            0deg, transparent, transparent 38px,
            rgba(255,255,255,.025) 38px, rgba(255,255,255,.025) 39px
          );
          pointer-events: none;
        }
        .hero-orb {
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(29,158,117,.15) 0%, transparent 70%);
          right: -80px; top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }
        .hero-content { position: relative; z-index: 2; max-width: 680px; }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          background: rgba(245,184,74,.1);
          border: 1px solid rgba(245,184,74,.28);
          color: var(--a300);
          font-size: 11px; font-weight: 700;
          letter-spacing: .16em; text-transform: uppercase;
          padding: 7px 16px; border-radius: 50px; margin-bottom: 28px;
        }
        .hero-eyebrow::before {
          content: ''; width: 7px; height: 7px; border-radius: 50%;
          background: var(--a300); box-shadow: 0 0 0 3px rgba(245,184,74,.2);
          animation: blink 2.2s ease-in-out infinite;
        }
        @keyframes blink {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:.4; transform:scale(.65); }
        }
        .hero-title {
          font-family: var(--ff-display);
          font-size: clamp(56px, 8.5vw, 104px);
          line-height: .88; color: #fff; letter-spacing: .025em; margin-bottom: 6px;
        }
        .hero-title .accent { color: var(--a300); display: block; margin-top: 4px; }
        .hero-sub {
          font-size: clamp(15px, 1.8vw, 18px);
          color: rgba(255,255,255,.68); max-width: 500px;
          margin: 24px 0 44px; line-height: 1.7;
        }
        .hero-sub strong { color: rgba(255,255,255,.95); font-weight: 700; }
        .hero-btns { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
        .hero-ghost {
          color: rgba(255,255,255,.72); font-size: 14px; font-weight: 600;
          letter-spacing: .02em; display: flex; align-items: center; gap: 8px;
          transition: color .2s, gap .2s;
        }
        .hero-ghost:hover { color: #fff; gap: 12px; }
        .hero-stats {
          position: absolute; bottom: 44px; left: 6%; right: 6%; z-index: 2;
          display: flex; gap: 40px; align-items: center;
        }
        .hero-stat-line { flex: 1; height: 1px; background: rgba(255,255,255,.1); }
        .hero-stat { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .hero-stat-val {
          font-family: var(--ff-display); font-size: 32px;
          color: var(--a300); letter-spacing: .04em; line-height: 1;
        }
        .hero-stat-label {
          font-size: 11px; color: rgba(255,255,255,.45);
          letter-spacing: .08em; text-transform: uppercase; margin-top: 4px;
        }
        @media (max-width: 480px) { .hero-stats { display: none; } }
      `}</style>

      <section className="hero">
        <div className="hero-orb" />
        <div className="hero-content">
          <div className="hero-eyebrow">Kits completos de pesca em água doce</div>
          <h1 className="hero-title">
            CHEGA DE<br />IMPROVISAR
            <span className="accent">NA BEIRA D&apos;ÁGUA</span>
          </h1>
          <p className="hero-sub">
            Kits montados por quem entende de pesca — equipamento certo, na medida certa,
            pra você <strong>chegar e pescar de primeira.</strong>
          </p>
          <div className="hero-btns">
            <Link href="#kits" className="btn-amber">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
              Ver os kits
            </Link>
            <Link href="#como-funciona" className="hero-ghost">
              Como funciona →
            </Link>
          </div>
        </div>

        <div className="hero-stats" aria-hidden>
          <div className="hero-stat-line" />
          <div className="hero-stat">
            <div className="hero-stat-val">3</div>
            <div className="hero-stat-label">Kits disponíveis</div>
          </div>
          <div className="hero-stat-line" />
          <div className="hero-stat">
            <div className="hero-stat-val">500m</div>
            <div className="hero-stat-label">Linha em todo kit</div>
          </div>
          <div className="hero-stat-line" />
          <div className="hero-stat">
            <div className="hero-stat-val">R$169</div>
            <div className="hero-stat-label">Kit a partir de</div>
          </div>
          <div className="hero-stat-line" />
        </div>
      </section>
    </>
  );
}
