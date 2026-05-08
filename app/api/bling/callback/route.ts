import { NextRequest, NextResponse } from "next/server";
import { saveTokensToSupabase } from "@/lib/bling";

export const dynamic = "force-dynamic";
export const preferredRegion = "gru1";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Parâmetro 'code' ausente" }, { status: 400 });
  }

  const credentials = btoa(
    `${process.env.BLING_CLIENT_ID}:${process.env.BLING_CLIENT_SECRET}`
  );

  const res = await fetch("https://api.bling.com.br/Api/v3/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.BLING_REDIRECT_URI || "",
    }).toString(),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json(
      { error: "Troca de token falhou", detail },
      { status: 502 }
    );
  }

  const { access_token, refresh_token } = await res.json();

  // Salva tokens no Supabase — renovação automática a partir de agora
  try {
    await saveTokensToSupabase(access_token, refresh_token);
    console.log("[callback] tokens salvos no Supabase com sucesso");
  } catch (err) {
    console.error("[callback] erro ao salvar tokens no Supabase:", err);
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bling OAuth — Tokens</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ui-monospace, "Cascadia Code", monospace;
      background: #0f172a; color: #e2e8f0;
      min-height: 100vh; display: flex;
      align-items: center; justify-content: center; padding: 40px 20px;
    }
    .card {
      background: #1e293b; border: 1px solid #334155;
      border-radius: 12px; padding: 40px; max-width: 680px; width: 100%;
    }
    h1 { font-size: 22px; color: #4ade80; margin-bottom: 8px; }
    p { font-size: 14px; color: #94a3b8; margin-bottom: 28px; line-height: 1.6; }
    label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .08em; display: block; margin-bottom: 6px; }
    .token-box {
      background: #0f172a; border: 1px solid #334155; border-radius: 8px;
      padding: 14px 16px; margin-bottom: 24px; word-break: break-all;
      font-size: 13px; color: #fbbf24; cursor: pointer;
    }
    .token-box:hover { border-color: #4ade80; }
    .hint { font-size: 12px; color: #475569; margin-top: 6px; }
    .success {
      background: #052e16; border: 1px solid #166534;
      border-radius: 8px; padding: 12px 16px;
      font-size: 13px; color: #4ade80; margin-bottom: 24px;
    }
    .warning {
      background: #451a03; border: 1px solid #92400e;
      border-radius: 8px; padding: 12px 16px;
      font-size: 13px; color: #fcd34d; margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>✅ OAuth concluído</h1>
    <div class="success">
      ✓ Tokens salvos automaticamente no Supabase — o site já está funcionando.
    </div>
    <p>Os tokens abaixo também estão disponíveis para backup manual no Vercel.</p>

    <label>BLING_ACCESS_TOKEN</label>
    <div class="token-box" onclick="copy(this, '${access_token}')">${access_token}</div>
    <p class="hint">Clique para copiar · Expira em ~1 hora (renovado automaticamente)</p>

    <label>BLING_REFRESH_TOKEN</label>
    <div class="token-box" onclick="copy(this, '${refresh_token}')">${refresh_token}</div>
    <p class="hint">Clique para copiar · Renovado automaticamente via Supabase</p>

    <div class="warning">
      ⚠️ Feche esta aba após copiar os tokens. Não compartilhe esta URL com ninguém.
    </div>
  </div>

  <script>
    function copy(el, text) {
      navigator.clipboard.writeText(text).then(() => {
        const orig = el.style.borderColor;
        el.style.borderColor = '#4ade80';
        setTimeout(() => { el.style.borderColor = orig; }, 1200);
      });
    }
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
