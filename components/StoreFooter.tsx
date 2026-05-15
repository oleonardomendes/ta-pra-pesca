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
              <a
                href="https://www.instagram.com/taprapesca"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="sf-social-btn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="sf-social-btn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
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
