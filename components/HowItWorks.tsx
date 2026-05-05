export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      name: "ESCOLHA O KIT",
      desc: "Veja os três kits e escolha o que combina com seu jeito de pescar — rio leve, pesqueiro de verdade ou arremesso profissional.",
      color: "rgba(29,158,117,.18)", textColor: "var(--g200)", border: "rgba(29,158,117,.35)",
    },
    {
      num: "02",
      name: "FECHA O PEDIDO",
      desc: "Compra 100% segura, pagamento fácil. Pode parcelar no cartão sem preocupação. Confirma e a gente cuida do resto.",
      color: "rgba(212,132,12,.18)", textColor: "var(--a300)", border: "rgba(212,132,12,.35)",
    },
    {
      num: "03",
      name: "CHEGOU, VAI PESCAR",
      desc: "O kit chega em casa completo e compatível. É montar, enrolar a linha e ir pra beira da água. Simples assim.",
      color: "rgba(29,158,117,.18)", textColor: "var(--g200)", border: "rgba(29,158,117,.35)",
    },
  ];

  return (
    <>
      <style>{`
        .how { background: var(--g900); position: relative; overflow: hidden; }
        .how::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 50% at 50% 50%, rgba(29,158,117,.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .how .sec-eyebrow { color: var(--a300); }
        .how .sec-title   { color: #fff; }
        .how .sec-sub     { color: rgba(255,255,255,.55); }
        .steps {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 24px; position: relative; z-index: 1;
        }
        .steps::before {
          content: ''; position: absolute; top: 44px;
          left: calc(16.67% + 24px); right: calc(16.67% + 24px);
          height: 1px;
          background: linear-gradient(90deg, rgba(29,158,117,.3), rgba(212,132,12,.4), rgba(29,158,117,.3));
        }
        .step {
          text-align: center; padding: 36px 24px;
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07);
          border-radius: var(--r-lg);
          transition: background .3s, border-color .3s;
        }
        .step:hover { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.14); }
        .step-num {
          width: 68px; height: 68px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 22px;
          font-family: var(--ff-display); font-size: 30px; line-height: 1;
        }
        .step-name {
          font-family: var(--ff-display); font-size: 26px;
          color: #fff; letter-spacing: .04em; margin-bottom: 12px;
        }
        .step-desc { font-size: 14px; color: rgba(255,255,255,.5); line-height: 1.65; }
        @media (max-width: 960px) { .steps { grid-template-columns: 1fr; } .steps::before { display: none; } }
      `}</style>

      <section className="how" id="como-funciona">
        <div className="sec-header rv">
          <div className="sec-eyebrow">Simples assim</div>
          <h2 className="sec-title">3 PASSOS PRA<br />VOCÊ PESCAR</h2>
          <p className="sec-sub">Sem burocracia, sem confusão. Da escolha do kit até a beira da água.</p>
        </div>
        <div className="steps">
          {steps.map((s, i) => (
            <div className={`step rv d${i + 1}`} key={s.num}>
              <div className="step-num" style={{ background: s.color, color: s.textColor, border: `1px solid ${s.border}` }}>
                {s.num}
              </div>
              <div className="step-name">{s.name}</div>
              <p className="step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
