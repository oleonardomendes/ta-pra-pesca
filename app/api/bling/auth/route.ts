import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge";
export const preferredRegion = "gru1";

export async function GET() {
  const clientId = process.env.BLING_CLIENT_ID;
  const redirectUri = process.env.BLING_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "BLING_CLIENT_ID ou BLING_REDIRECT_URI não configurados" },
      { status: 500 }
    );
  }

  // new URL() normaliza o path para lowercase — montamos a string manualmente
  // para preservar a capitalização exata exigida pelo Bling (OAuth/Authorize).
  const authorizeUrl =
    `https://www.bling.com.br/OAuth/Authorize` +
    `?response_type=code` +
    `&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=`;

  return NextResponse.redirect(authorizeUrl);
}
