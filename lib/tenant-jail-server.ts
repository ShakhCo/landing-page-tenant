import 'server-only';
import { headers } from 'next/headers';
import { recordTenantMiss } from './tenant-jail';

/**
 * Real client IP behind Cloudflare. The wildcard origin is locked to Cloudflare,
 * so `cf-connecting-ip` is trustworthy; fall back to nginx's X-Real-IP.
 */
async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get('cf-connecting-ip') ??
    h.get('x-real-ip') ??
    h.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  );
}

/**
 * Call on the not-found (unknown tenant) path: records a miss for the caller's
 * IP and bans it after too many in the window. Reading headers() here forces
 * dynamic rendering, which is fine because this path is a 404 (never cached) —
 * the happy path never calls this, so real tenant pages keep their ISR cache.
 */
export async function noteMissingTenantHit(): Promise<void> {
  try {
    recordTenantMiss(await clientIp());
  } catch {
    // Never let jail bookkeeping break the 404 response.
  }
}
