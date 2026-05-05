const cards = [
  {
    title: "Equipamento com procedência de verdade",
    text: "Trabalhamos com as marcas CMIK e Enjoylure — presentes no mercado brasileiro há anos, reconhecidas por pescadores de água doce em todo o país.",
    icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--g500)" aria-hidden><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  },
  {
    title: "Kits montados com lógica de pesca",
    text: "Cada combinação de vara, molinete e linha foi pensada pra funcionar junto. Nada de compatibilidade errada, nada de surpresa na hora de montar.",
    icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--g500)" aria-hidden><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  },
  {
    title: "500m de linha inclusa em todo kit",
    text: "Linha monofilamento CMIK 0,35mm, 500 metros — já dentro do kit, sem custo extra. Chegou, enrolou, foi pescar. E ainda sobra pra repor.",
    icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--g500)" aria-hidden><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  },
  {
    title: "Suporte real pelo WhatsApp",
    text: "Tem dúvida antes de comprar? Manda mensagem. Temos alguém que entende de pesca pra te ajudar a escolher o kit certo pro seu tipo de pescaria.",
    icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--g500)" aria-hidden><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.5 12.34a19.79 19.79 0 01-3.07-8.67A2 2 0 012.41 1.67h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9.1a16 16 0 006 6l.77-.77a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7a2 2 0 011.72 2.04z"/></svg>,
  },
];

export default function Diferenciais() {
  return (
    <>
      <style>{`
        .diff { background: var(--cream); }
        .diff-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
        .diff-card {
          background: var(--white); border: 1px solid var(--border);
          border-radius: var(--r-lg); padding: 28px;
          display: flex; gap: 20px; align-items: flex-start;
          transition: border-color .25s, transform .25s, box-shadow .25s;
        }
        .diff-card:hover { border-color: var(--g300); transform: translateY(-4px); box-shadow: 0 8px 32px rgba(10,61,43,.08); }
        .diff-ico {
          width: 50px; height: 50px; border-radius: var(--r-sm);
          background: var(--g50);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .diff-name { font-size: 15px; font-weight: 700; color: var(--g900); margin-bottom: 7px; }
        .diff-text { font-size: 13.5px; color: var(--muted); line-height: 1.65; }
        @media (max-width: 960px) { .diff-grid { grid-template-columns: 1fr; } }
      `}</style>

      <section className="diff" id="diferenciais">
        <div className="sec-header rv">
          <div className="sec-eyebrow">Por que a gente?</div>
          <h2 className="sec-title">PESCA SEM<br />ENROLAÇÃO</h2>
          <p className="sec-sub">
            Montamos kits pra quem quer qualidade real, sem pagar caro e sem perder
            tempo escolhendo peça por peça.
          </p>
        </div>
        <div className="diff-grid">
          {cards.map((c, i) => (
            <div className={`diff-card rv d${(i % 2) + 1}`} key={c.title}>
              <div className="diff-ico">{c.icon}</div>
              <div>
                <div className="diff-name">{c.title}</div>
                <p className="diff-text">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
