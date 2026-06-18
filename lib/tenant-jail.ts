/**
 * In-process behavioural jail for tenant-subdomain enumeration.
 *
 * If one client IP triggers too many "no such tenant" (404) responses in a
 * rolling window, it gets blocked for a while — fail2ban, but for fake-subdomain
 * scanning. This is the origin-side layer; a Cloudflare rate-limit rule does the
 * same at the edge (defence in depth). State is in-memory: the site runs as a
 * single standalone instance, so this is shared across all requests and resets
 * on redeploy (fine — the edge rule is the durable layer). If bookup.uz is ever
 * scaled to multiple instances, move this state to the shared Redis.
 *
 * Pure logic (no next/headers) so it's unit-testable; the caller passes the IP.
 */

const WINDOW_MS = 60 * 60_000; // 1 hour rolling window
const MAX_MISSES = 5; // misses allowed within the window before a ban
const BAN_MS = 12 * 60 * 60_000; // 12 hour ban
const MAX_TRACKED = 100_000; // hard cap on tracked IPs (memory safety)

interface MissRecord {
  count: number;
  windowEnd: number;
}

const misses = new Map<string, MissRecord>();
const bans = new Map<string, number>(); // ip -> ban-until timestamp

function sweep(now: number): void {
  for (const [ip, until] of bans) if (now >= until) bans.delete(ip);
  for (const [ip, rec] of misses) if (now >= rec.windowEnd) misses.delete(ip);
}

/** True while `ip` is banned. Self-clears expired bans. */
export function isBanned(ip: string, now: number = Date.now()): boolean {
  const until = bans.get(ip);
  if (until === undefined) return false;
  if (now >= until) {
    bans.delete(ip);
    return false;
  }
  return true;
}

/**
 * Record one not-found tenant hit from `ip`. Returns true if `ip` is now banned.
 * Bans after MAX_MISSES within WINDOW_MS; an existing ban is a no-op.
 */
export function recordTenantMiss(ip: string, now: number = Date.now()): boolean {
  if (isBanned(ip, now)) return true;

  // Bound memory: sweep expired entries once the maps get large, then hard-cap.
  if (misses.size + bans.size > MAX_TRACKED) {
    sweep(now);
    if (misses.size > MAX_TRACKED) misses.clear();
  }

  const rec = misses.get(ip);
  if (!rec || now >= rec.windowEnd) {
    misses.set(ip, { count: 1, windowEnd: now + WINDOW_MS });
    return false;
  }
  rec.count += 1;
  if (rec.count >= MAX_MISSES) {
    bans.set(ip, now + BAN_MS);
    misses.delete(ip);
    return true;
  }
  return false;
}

/** Test-only: reset all state. */
export function __resetJail(): void {
  misses.clear();
  bans.clear();
}
