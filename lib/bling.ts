const BLING_BASE = "https://www.bling.com.br/Api/v3";
const BLING_TOKEN_URL = "https://www.bling.com.br/oauth/token";

// Caches the refreshed token for the lifetime of the serverless invocation.
// Between cold starts o token é relido do env.
let cachedAccessToken: string | null = null;

export function getBlingToken(): string {
  return cachedAccessToken ?? process.env.BLING_ACCESS_TOKEN ?? "";
}

export async function refreshBlingToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.BLING_CLIENT_ID}:${process.env.BLING_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(BLING_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.BLING_REFRESH_TOKEN ?? "",
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Bling refresh falhou (${res.status}): ${detail}`);
  }

  const data = await res.json();
  cachedAccessToken = data.access_token as string;
  return cachedAccessToken;
}

export async function blingFetch(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const makeRequest = (token: string) =>
    fetch(`${BLING_BASE}${endpoint}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options?.headers,
        Authorization: `Bearer ${token}`,
      },
    });

  const firstRes = await makeRequest(getBlingToken());

  if (firstRes.status !== 401) return firstRes;

  // Token expirado — renova e tenta uma vez mais
  const newToken = await refreshBlingToken();
  return makeRequest(newToken);
}
