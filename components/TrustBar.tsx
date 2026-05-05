export default function TrustBar() {
  const items = [
    {
      label: "Compra 100% segura",
      sub: "Pagamento protegido",
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="var(--a300)" aria-hidden>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      label: "Equipamento com procedência",
      sub: "Marcas CMIK e Enjoylure",
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="var(--a300)" aria-hidden>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
    {
      label: "Entrega pra todo o Brasil",
      sub: "Envio rápido e rastreado",
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="var(--a300)" aria-hidden>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      ),
    },
    {
      label: "Suporte pelo WhatsApp",
      sub: "Tire sua dúvida antes de comprar",
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="var(--a300)" aria-hidden>
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.5 12.34a19.79 19.79 0 01-3.07-8.67A2 2 0 012.41 1.67h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9.1a16 16 0 006 6l.77-.77a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7a2 2 0 011.72 2.04z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{`
        .trust { background: var(--g700); padding: 0 6%; }
        .trust-inner {
          display: flex; justify-content: space-between;
          align-items: stretch; flex-wrap: wrap;
          border-top: 1px solid rgba(255,255,255,.06);
        }
        .trust-item {
          display: flex; align-items: center; gap: 12px;
          padding: 22px 0; flex: 1 1 200px;
        }
        .trust-item + .trust-item {
          border-left: 1px solid rgba(255,255,255,.07);
          padding-left: 28px; margin-left: 28px;
        }
        .trust-ico {
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(255,255,255,.08);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .trust-title { font-size: 13px; font-weight: 700; color: #fff; line-height: 1.2; }
        .trust-sub { font-size: 11px; color: rgba(255,255,255,.45); margin-top: 2px; }
        @media (max-width: 720px) {
          .trust-item + .trust-item { border-left: none; padding-left: 0; margin-left: 0; }
        }
      `}</style>
      <div className="trust" role="list" aria-label="Garantias">
        <div className="trust-inner">
          {items.map((item) => (
            <div className="trust-item" key={item.label} role="listitem">
              <div className="trust-ico">{item.icon}</div>
              <div>
                <div className="trust-title">{item.label}</div>
                <div className="trust-sub">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
