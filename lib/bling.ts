const BLING_BASE = "https://api.bling.com.br/Api/v3";
const BLING_TOKEN_URL = "https://api.bling.com.br/Api/v3/oauth/token";

// Caches tokens for the lifetime of the serverless invocation.
// On cold starts, tokens are re-read from env vars.
let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;

export function getBlingToken(): string {
  return cachedAccessToken ?? process.env.BLING_ACCESS_TOKEN ?? "";
}

function getRefreshToken(): string {
  return cachedRefreshToken ?? process.env.BLING_REFRESH_TOKEN ?? "";
}

export async function refreshBlingToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("Bling refresh falhou: BLING_REFRESH_TOKEN não configurado");
  }

  const credentials = btoa(
    `${process.env.BLING_CLIENT_ID}:${process.env.BLING_CLIENT_SECRET}`
  );

  const res = await fetch(BLING_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[bling] refresh_token usado:", refreshToken.slice(0, 20) + "...");
    console.error("[bling] ⚠️  REFRESH TOKEN INVÁLIDO — acesse /api/bling/auth para reautorizar");
    throw new Error(`Bling refresh falhou (${res.status}): ${detail}`);
  }

  const data = await res.json();
  cachedAccessToken = data.access_token as string;

  // Bling retorna um novo refresh_token a cada renovação — cacheia na memória.
  // ⚠️  AÇÃO NECESSÁRIA: atualize BLING_REFRESH_TOKEN no Vercel com o valor abaixo.
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    cachedRefreshToken = data.refresh_token as string;
    console.warn("[bling] ⚠️  NOVO REFRESH TOKEN GERADO — atualize no Vercel:");
    console.warn("[bling] BLING_REFRESH_TOKEN =", data.refresh_token);
  }

  console.log("[bling] token renovado com sucesso");
  return cachedAccessToken;
}

export async function blingFetch(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const makeRequest = async (token: string, attempt: number) => {
    const url = `${BLING_BASE}${endpoint}`;
    console.log(`[bling][attempt:${attempt}] GET ${url}`);
    console.log(`[bling][attempt:${attempt}] token prefix: ${token.slice(0, 20)}...`);

    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options?.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(`[bling][attempt:${attempt}] status: ${res.status}`);

    if (!res.ok) {
      const body = await res.clone().text();
      console.error(
        `[bling][attempt:${attempt}] ERRO status=${res.status} endpoint=${endpoint}`
      );
      console.error(`[bling][attempt:${attempt}] error body:`, body);
    }

    return res;
  };

  const firstRes = await makeRequest(getBlingToken(), 1);

  if (firstRes.status !== 401) return firstRes;

  // Token expirado — renova e tenta uma vez mais
  console.log("[bling] 401 recebido — iniciando refresh do token...");
  try {
    const newToken = await refreshBlingToken();
    console.log("[bling] token renovado com sucesso, retry da request...");
    return makeRequest(newToken, 2);
  } catch (refreshErr) {
    console.error("[bling] falha ao renovar token:", refreshErr);
    return firstRes;
  }
}
