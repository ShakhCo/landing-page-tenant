import { headers } from 'next/headers';

/** Abort a backend call that stalls, so an SSR render / server action can't hang. */
const REQUEST_TIMEOUT_MS = 12_000;

/**
 * Server-side fetch to the Bookup backend.
 *
 * Two things every call needs:
 *  1. A timeout — a stalled connection would otherwise hang the SSR render or
 *     the server action indefinitely.
 *  2. The real end-user IP. Because these calls run on OUR server, the backend
 *     would otherwise see every customer as the one server IP and trip its
 *     per-IP rate limits site-wide. We forward the real client IP (from
 *     Cloudflare) authenticated by a shared secret the backend checks.
 *
 * Must be called within a request scope (server component / server action /
 * route handler), since it reads the incoming request headers.
 */
export async function serverFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const fwd = await forwardHeaders();
  return fetch(url, {
    ...init,
    headers: { ...fwd, ...(init.headers as Record<string, string> | undefined) },
    // Caller signal wins if provided; otherwise enforce the timeout.
    signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

/** Headers that convey the real client IP to the backend, gated by the shared secret. */
async function forwardHeaders(): Promise<Record<string, string>> {
  const secret = process.env.INTERNAL_FORWARD_SECRET;
  if (!secret) return {};
  try {
    const h = await headers();
    const ip =
      h.get('cf-connecting-ip') ||
      h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      h.get('x-real-ip') ||
      '';
    return ip
      ? { 'x-internal-forward-secret': secret, 'x-real-client-ip': ip }
      : { 'x-internal-forward-secret': secret };
  } catch {
    return { 'x-internal-forward-secret': secret };
  }
}

/** Friendly Uzbek message for a network/timeout failure (never a raw error). */
export const NETWORK_ERROR_UZ =
  "Internet bilan muammo bo'ldi. Iltimos, qayta urinib ko'ring.";
