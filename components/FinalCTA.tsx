import Link from "next/link";

export function FinalCTA() {
  const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER || "5511900000000";
  const waMsg = process.env.NEXT_PUBLIC_WA_MESSAGE || "Olá!%20Quero%20saber%20mais%20sobre%20os%20kits.";

  return (
    <>
      <style>{`
        .final {
          background: var(--g700); padding: 110px 6%;
          text-align: center; position: relative; overflow: hidden;
        }
        .final::before {
          content: ''; position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 75% 65% at 50% 50%, rgba(29,158,117,.28) 0%, transparent 65%),
            radial-gradient(ellipse 30% 40% at 10% 10%, rgba(212,132,12,.1) 0%, transparent 60%);
          pointer-events: none;
        }
        .final-deco {
          position: absolute; font-family: var(--ff-display);
          font-size: 260px; color: rgba(255,255,255,.03);
          letter-spacing: .06em; bottom: -40px; left: 50%;
          transform: translateX(-50%); white-space: nowrap; pointer-events: none; line-height: 1;
        }
        .final-inner { position: relative; z-index: 1; }
        .final-eyebrow {
          font-size: 11px; font-weight: 700;
          letter-spacing: .16em; text-transform: uppercase;
          color: var(--a300); margin-bottom: 20px;
        }
        .final-title {
          font-family: var(--ff-display);
          font-size: clamp(50px, 8vw, 96px);
          color: #fff; line-height: .9; letter-spacing: .025em; margin-bottom: 22px;
        }
        .final-title .accent { color: var(--a300); }
        .final-sub {
          font-size: 17px; color: rgba(255,255,255,.62);
          max-width: 460px; margin: 0 auto 46px; line-height: 1.65;
        }
        .final-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
      `}</style>

      <section className="final">
        <div className="final-deco" aria-hidden>PESCA</div>
        <div className="final-inner rv">
          <div className="final-eyebrow">Pronto pra pescar?</div>
          <h2 className="final-title">
            TÁ ESPERANDO<br />O QUÊ?
            <span className="accent"> VAI LÁ.</span>
          </h2>
          <p className="final-sub">
            Escolha o kit agora e receba em casa com tudo que você precisa
            pra chegar na água e pescar.
          </p>
          <div className="final-actions">
            <Link href="#kits" className="btn-amber-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
              Ver os kits agora
            </Link>
            <a
              href={`https://wa.me/${waNumber}?text=${waMsg}`}
              className="btn-ghost-lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar no WhatsApp →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export default FinalCTA;
