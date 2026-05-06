import type { Metadata } from "next";
import "./globals.css";
import GTM from "@/components/GTM";
import ScrollReveal from "@/components/ScrollReveal";
import { CartProvider } from "@/contexts/CartContext";

export const metadata: Metadata = {
  title: "Tá Pra Pesca — Kits Completos de Pesca em Água Doce",
  description:
    "Kits montados por quem entende de pesca. Equipamento de qualidade, tudo compatível, tudo pronto pra você chegar e pescar. A partir de R$169.",
  keywords: [
    "kit pesca",
    "kit pesca água doce",
    "vara molinete kit",
    "kit pesqueiro",
    "kit pesca tilápia",
    "pesca rio",
    "CMIK",
    "Enjoylure",
  ],
  openGraph: {
    title: "Tá Pra Pesca — Kits Completos de Pesca",
    description:
      "Chega de improvisar na beira da água. Kits completos de pesca a partir de R$169.",
    type: "website",
    locale: "pt_BR",
    // LUCAS: adicionar a URL real quando tiver domínio
    // url: "https://taprapesca.com.br",
    // images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  // LUCAS: descomentar quando tiver domínio próprio
  // metadataBase: new URL("https://taprapesca.com.br"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html lang="pt-BR">
      <body>
        {/* GTM só renderiza quando NEXT_PUBLIC_GTM_ID estiver preenchido (Fase 3) */}
        <CartProvider>
          {gtmId && <GTM gtmId={gtmId} />}
          {children}
          <ScrollReveal />
        </CartProvider>
      </body>
    </html>
  );
}
