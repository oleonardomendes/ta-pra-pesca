import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <>
      <style>{`
        .footer {
          background: var(--g900); padding: 40px 6%;
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 16px;
          border-top: 1px solid rgba(255,255,255,.05);
        }
        .footer-logo { font-family: var(--ff-display); font-size: 26px; letter-spacing: .06em; color: #fff; }
        .footer-logo span { color: var(--a300); }
        .footer-links { display: flex; gap: 24px; }
        .footer-links a { font-size: 13px; color: rgba(255,255,255,.4); transition: color .2s; }
        .footer-links a:hover { color: rgba(255,255,255,.75); }
        .footer-copy { font-size: 12px; color: rgba(255,255,255,.3); }
        @media (max-width: 720px) { .footer { flex-direction: column; text-align: center; } }
      `}</style>

      <footer className="footer">
        <div className="footer-logo">
          TÁ<span>.</span>PRA<span>.</span>PESCA
        </div>
        <nav className="footer-links" aria-label="Links do rodapé">
          <Link href="#kits">Kits</Link>
          <Link href="#como-funciona">Como funciona</Link>
          <Link href="#faq">Dúvidas</Link>
        </nav>
        <div className="footer-copy">
          © {year} Tá Pra Pesca — Todos os direitos reservados
        </div>
      </footer>
    </>
  );
}
