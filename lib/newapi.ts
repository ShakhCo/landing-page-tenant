// The Workers backend (apis.automations.uz) requires per-platform HMAC
// request signatures on its public endpoints. Server side only — the
// secret must never reach the browser.

export const NEW_API_ORIGIN =
  process.env.NEW_API_ORIGIN ?? 'https://apis.automations.uz';

const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

/**
 * HMAC headers for a request to the new API
 * (canonical = ts\nMETHOD\npath?query\nsha256hex(body)).
 * Empty when NEW_API_HMAC_SECRET is unset (signing disabled, e.g. dev).
 */
export async function signedHeaders(
  method: string,
  pathWithQuery: string,
  bodyText = '',
): Promise<Record<string, string>> {
  const secret = process.env.NEW_API_HMAC_SECRET;
  if (!secret) return {};

  const ts = String(Math.floor(Date.now() / 1000));
  const enc = new TextEncoder();
  const bodyHash = hex(await crypto.subtle.digest('SHA-256', enc.encode(bodyText)));
  const canonical = [ts, method.toUpperCase(), pathWithQuery, bodyHash].join('\n');
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = hex(await crypto.subtle.sign('HMAC', key, enc.encode(canonical)));
  return { 'x-client-id': 'web', 'x-timestamp': ts, 'x-signature': signature };
}

/** Signed GET against the new API; `path` starts at /public/... */
export async function newApiFetch(
  pathWithQuery: string,
  init?: RequestInit,
): Promise<Response> {
  const path = `/v1${pathWithQuery}`;
  const headers = new Headers(init?.headers);
  for (const [k, v] of Object.entries(await signedHeaders('GET', path))) {
    headers.set(k, v);
  }
  return fetch(`${NEW_API_ORIGIN}${path}`, {
    ...init,
    method: 'GET',
    headers,
    // The signature timestamp defeats Next's data cache anyway; the API
    // keeps its own 60s edge cache, so this stays cheap without ISR.
    cache: 'no-store',
    signal: init?.signal ?? AbortSignal.timeout(12_000),
  });
}
