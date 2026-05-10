import type { Metadata } from "next";
import "./globals.css";
import ScrollReveal from "@/components/ScrollReveal";
import { CartProvider } from "@/contexts/CartContext";
import { GTMScript, GTMNoScript } from "@/components/analytics/GTM";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { GoogleAds } from "@/components/analytics/GoogleAds";

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
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const adsId = process.env.NEXT_PUBLIC_GA_ADS_ID;

  return (
    <html lang="pt-BR">
      <body>
        {gtmId && <GTMNoScript gtmId={gtmId} />}
        <CartProvider>
          {gtmId && <GTMScript gtmId={gtmId} />}
          {pixelId && <MetaPixel pixelId={pixelId} />}
          {adsId && <GoogleAds adsId={adsId} />}
          {children}
          <ScrollReveal />
        </CartProvider>
      </body>
    </html>
  );
}
