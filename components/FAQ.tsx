"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Os kits são para pesca em água doce?",
    a: "Sim! Todos os kits foram montados pensando em água doce — pesqueiro, rio, lago e represa. A vara, o molinete e a linha de cada kit foram escolhidos especificamente pra esse perfil de pesca.",
  },
  {
    q: "A boia cevadeira já vem no kit do pesqueiro?",
    a: "Sim! A boia cevadeira é inclusa no Kit Pesqueiro Completo sem custo adicional. Ela faz parte da proposta do kit porque é o acessório essencial pra quem pesca com sevadeira em pesqueiro.",
  },
  {
    q: "A linha já vem enrolada no molinete?",
    a: "A linha vem no carretel de 500m separada. É simples de enrolar — você coloca do jeito que preferir e ainda sobra linha pra repor quando precisar.",
  },
  {
    q: "Qual a diferença entre molinete e carretilha?",
    a: "O molinete (kits 1 e 2) é mais simples de usar — ideal pra quem está começando ou pra pesca de pesqueiro e rio. A carretilha (kit 3) exige um pouco mais de prática mas entrega muito mais precisão e força nos arremessos.",
  },
  {
    q: "Posso tirar dúvidas antes de comprar?",
    a: "Com certeza! Manda mensagem pra gente no WhatsApp. Temos alguém que entende de pesca pra te ajudar a escolher o kit certo pro seu tipo de pescaria — sem pressão e sem enrolação.",
  },
  {
    q: "Quanto tempo demora pra chegar?",
    a: "O prazo varia conforme sua região. Em geral:\n• Sul e Sudeste: 3 a 7 dias úteis\n• Centro-Oeste e Nordeste: 5 a 10 dias úteis\n• Norte: 7 a 15 dias úteis\n\nAssim que seu pedido for enviado, você recebe o código de rastreio por e-mail para acompanhar em tempo real.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <style>{`
        .faq { background: var(--g50); }
        .faq-list { max-width: 720px; }
        .faq-item { border-bottom: 1px solid var(--border); }
        .faq-btn {
          width: 100%; background: none; border: none; text-align: left;
          padding: 21px 0; display: flex; justify-content: space-between;
          align-items: center; gap: 20px; cursor: pointer;
          font-family: var(--ff-body); font-size: 15.5px; font-weight: 700;
          color: var(--g900); transition: color .2s;
        }
        .faq-btn:hover { color: var(--g700); }
        .faq-icon {
          width: 24px; height: 24px; border-radius: 50%;
          background: var(--g50); border: 1.5px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: background .2s, transform .35s, border-color .2s;
        }
        .faq-icon.open { background: var(--g700); border-color: var(--g700); transform: rotate(45deg); }
        .faq-body {
          font-size: 14.5px; color: var(--muted); line-height: 1.72;
          overflow: hidden; transition: max-height .38s ease, padding .38s;
          max-height: 0; white-space: pre-line;
        }
        .faq-body.open { max-height: 400px; padding-bottom: 22px; }
      `}</style>

      <section className="faq" id="faq">
        <div className="sec-header rv">
          <div className="sec-eyebrow">Dúvidas frequentes</div>
          <h2 className="sec-title">PERGUNTAS<br />COMUNS</h2>
        </div>
        <div className="faq-list rv">
          {faqs.map((faq, i) => (
            <div className="faq-item" key={i}>
              <button
                className="faq-btn"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                {faq.q}
                <span className={`faq-icon${open === i ? " open" : ""}`} aria-hidden>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill={open === i ? "#fff" : "var(--g700)"}>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
              <div className={`faq-body${open === i ? " open" : ""}`}>
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
