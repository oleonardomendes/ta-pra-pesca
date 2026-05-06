import Link from 'next/link'

const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER || '15996177133'

export default function StoreFooter() {
  return (
    <>
      <style>{styles}</style>

      <footer className="sf-root">
        <div className="sf-grid">
          {/* Sobre Nós */}
          <div className="sf-col sf-col-about">
            <div className="sf-logo">
              TÁ<span>.</span>PRA<span>.</span>PESCA
            </div>
            <p className="sf-about-text">
              Somos dedicados a oferecer acesso simplificado a produtos especializados para
              entusiastas e pescadores. Nossa missão é tornar a experiência de compra na pesca
              mais conveniente e satisfatória.
            </p>
          </div>

          {/* Categorias */}
          <div className="sf-col">
            <h3 className="sf-col-title">Categorias</h3>
            <ul className="sf-links">
              <li><Link href="/">Todos os Produtos</Link></li>
              <li><Link href="/?categoria=Vara">Varas para Pesca</Link></li>
              <li><Link href="/?categoria=Molinete">Molinetes</Link></li>
              <li><Link href="/?categoria=Carretilha">Carretilhas</Link></li>
              <li><Link href="/kits">Kits Especiais</Link></li>
            </ul>
          </div>

          {/* Institucional */}
          <div className="sf-col">
            <h3 className="sf-col-title">Institucional</h3>
            <ul className="sf-links">
              <li><Link href="#">Quem Somos</Link></li>
              <li><Link href="#">Política de Privacidade</Link></li>
              <li><Link href="#">Trocas e Devoluções</Link></li>
              <li><Link href="#">Como Comprar</Link></li>
              <li><Link href="#">Perguntas Frequentes</Link></li>
            </ul>
          </div>

          {/* Contato */}
          <div className="sf-col">
            <h3 className="sf-col-title">Entre em contato</h3>
            <ul className="sf-contact">
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.22 1.21 2 2 0 012.22 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.72 6.72l1.06-1.06a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer">
                  {waNumber}
                </a>
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <a href="mailto:contato@taprapesca.com.br">contato@taprapesca.com.br</a>
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>Rua Maria Plens Quevedo Marthe</span>
              </li>
            </ul>
          </div>

          {/* Redes sociais */}
          <div className="sf-col">
            <h3 className="sf-col-title">Permaneça conectado</h3>
            <div className="sf-social">
              {/* Facebook */}
              <a href="#" aria-label="Facebook" className="sf-social-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" aria-label="Instagram" className="sf-social-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              {/* X / Twitter */}
              <a href="#" aria-label="X (Twitter)" className="sf-social-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="sf-bottom">
          <span>© 2025 Tá Pra Pesca — Todos os direitos reservados</span>
        </div>
      </footer>
    </>
  )
}

const styles = `
  .sf-root {
    background: var(--g900);
    border-top: 1px solid rgba(255,255,255,.06);
  }
  .sf-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1.4fr 1fr;
    gap: 48px;
    padding: 64px 6% 48px;
    max-width: 1280px;
    margin: 0 auto;
  }
  .sf-logo {
    font-family: var(--ff-display);
    font-size: 26px; letter-spacing: .06em;
    color: #fff; margin-bottom: 16px;
  }
  .sf-logo span { color: var(--a300); }
  .sf-about-text {
    font-size: 13px; color: rgba(255,255,255,.45);
    line-height: 1.75;
  }
  .sf-col-title {
    font-size: 11px; font-weight: 700; letter-spacing: .14em;
    text-transform: uppercase; color: rgba(255,255,255,.35);
    margin-bottom: 20px;
  }
  .sf-links {
    list-style: none;
    display: flex; flex-direction: column; gap: 10px;
  }
  .sf-links a {
    font-size: 13px; color: rgba(255,255,255,.55);
    transition: color .2s;
  }
  .sf-links a:hover { color: #fff; }
  .sf-contact {
    list-style: none;
    display: flex; flex-direction: column; gap: 14px;
  }
  .sf-contact li {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 13px; color: rgba(255,255,255,.55);
  }
  .sf-contact li svg { flex-shrink: 0; margin-top: 1px; color: rgba(255,255,255,.35); }
  .sf-contact a { color: rgba(255,255,255,.55); transition: color .2s; }
  .sf-contact a:hover { color: #fff; }
  .sf-social {
    display: flex; gap: 10px;
  }
  .sf-social-btn {
    width: 40px; height: 40px; border-radius: 50%;
    background: rgba(255,255,255,.08);
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,.55);
    transition: background .2s, color .2s;
  }
  .sf-social-btn:hover {
    background: rgba(255,255,255,.16);
    color: #fff;
  }
  .sf-bottom {
    border-top: 1px solid rgba(255,255,255,.06);
    padding: 20px 6%;
    text-align: center;
    font-size: 12px; color: rgba(255,255,255,.25);
    max-width: 1280px; margin: 0 auto;
  }
  @media (max-width: 1100px) {
    .sf-grid {
      grid-template-columns: 1fr 1fr 1fr;
      gap: 36px;
    }
    .sf-col-about { grid-column: 1 / -1; }
  }
  @media (max-width: 640px) {
    .sf-grid {
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      padding: 48px 5% 32px;
    }
    .sf-col-about { grid-column: 1 / -1; }
    .sf-bottom { padding: 16px 5%; }
  }
  @media (max-width: 400px) {
    .sf-grid { grid-template-columns: 1fr; }
  }
`
