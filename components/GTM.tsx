"use client";

// =============================================================
// GOOGLE TAG MANAGER — Fase 3
// Só renderiza quando NEXT_PUBLIC_GTM_ID estiver preenchido.
// Após configurar o GTM: adicione a variável no .env.local
// e no painel do Vercel (Settings > Environment Variables).
// =============================================================

interface GTMProps {
  gtmId: string;
}

export default function GTM({ gtmId }: GTMProps) {
  return (
    <>
      {/* GTM Script — <head> */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `,
        }}
      />
      {/* GTM NoScript — fallback para navegadores sem JS */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="GTM"
        />
      </noscript>
    </>
  );
}
