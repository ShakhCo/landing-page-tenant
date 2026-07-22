// Per-tenant cutover to the new Workers backend (apis.automations.uz).
// Tenants listed in NEW_API_TENANTS (comma-separated subdomains) are
// served from the new API; everyone else stays on the monolith. Server
// side only — the HMAC secret must never reach the browser.

const NEW_API_ORIGIN =
  process.env.NEW_API_ORIGIN ?? 'https://apis.automations.uz';

const MIGRATED = new Set(
  (process.env.NEW_API_TENANTS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

export function isMigratedTenant(subdomain: string): boolean {
  return MIGRATED.has(subdomain.toLowerCase());
}

const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

/**
 * GET from the new API with the per-platform HMAC request signature
 * (x-client-id/x-timestamp/x-signature over ts\nMETHOD\npath\nsha256(body)).
 * Signing is skipped when NEW_API_HMAC_SECRET is unset (e.g. staging).
 */
export async function newApiFetch(
  pathWithQuery: string,
  init?: RequestInit,
): Promise<Response> {
  const path = `/v1${pathWithQuery}`;
  const headers = new Headers(init?.headers);

  const secret = process.env.NEW_API_HMAC_SECRET;
  if (secret) {
    const ts = String(Math.floor(Date.now() / 1000));
    const bodyHash = hex(await crypto.subtle.digest('SHA-256', new ArrayBuffer(0)));
    const canonical = [ts, 'GET', path, bodyHash].join('\n');
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const signature = hex(
      await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(canonical)),
    );
    headers.set('x-client-id', 'web');
    headers.set('x-timestamp', ts);
    headers.set('x-signature', signature);
  }

  return fetch(`${NEW_API_ORIGIN}${path}`, {
    ...init,
    method: 'GET',
    headers,
    // The signature timestamp makes responses uncacheable by Next's data
    // cache anyway; the new API keeps its own 60s edge cache, so this
    // stays cheap without ISR.
    cache: 'no-store',
    signal: init?.signal ?? AbortSignal.timeout(12_000),
  });
}
