import { NextResponse, type NextRequest } from 'next/server';

/** Hosts that serve the main marketing site (no tenant). */
const ROOT_HOSTS = new Set(['bookup.uz', 'www.bookup.uz', 'localhost', '127.0.0.1']);

/** A single valid DNS label — what a real tenant subdomain looks like. Anything
 *  else (uppercase, symbols, dots, over-long) can't be a tenant, so we reject it
 *  at the edge instead of routing it into the tenant page + backend lookup. */
const VALID_SUBDOMAIN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** Real single-segment routes on the apex host — everything else that looks
 *  like a DNS label is treated as a business short link (win-back SMS uses
 *  `bookup.uz/<subdomain>`) and bounced to that subdomain. Keep in sync when a
 *  new top-level apex route is added. */
const APEX_PATHS = new Set([
  'oz', 'ru', 'en', 'b', 'business', 'narxlar', 'instagram-connected', 'tenant', 'www',
]);

/**
 * Extract a tenant subdomain from the Host header, or null for the main site.
 * Prod:  `<sub>.bookup.uz`  ·  Dev: `<sub>.localhost`.
 * `www` and bare root hosts (incl. dev tunnels with no subdomain) → main site.
 */
function tenantSubdomain(host: string): string | null {
  const h = host.split(':')[0].toLowerCase(); // strip port
  if (ROOT_HOSTS.has(h)) return null;
  for (const root of ['.bookup.uz', '.localhost']) {
    if (h.endsWith(root)) {
      const sub = h.slice(0, -root.length);
      if (!sub || sub === 'www') return null;
      return sub;
    }
  }
  return null; // unknown host (e.g. a cloudflare tunnel) → main site
}

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const sub = tenantSubdomain(host);
  const url = req.nextUrl;

  if (sub) {
    // Malformed label (uppercase/symbols/dots/over-long) → never a real tenant.
    // Reject at the edge so junk hostnames don't reach the tenant page/backend.
    if (!VALID_SUBDOMAIN.test(sub)) {
      return new NextResponse(null, { status: 404 });
    }
    // Tenant host → serve the internal tenant route, preserving the path.
    const rewritten = url.clone();
    rewritten.pathname = `/tenant/${sub}${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(rewritten);
  }

  // Main host: keep the internal /tenant/* routes from being reached directly.
  if (url.pathname.startsWith('/tenant')) {
    const home = url.clone();
    home.pathname = '/';
    return NextResponse.redirect(home);
  }

  // Business short link `bookup.uz/<subdomain>` (used by the win-back SMS):
  // a single DNS-label segment that isn't a real apex route → bounce to the
  // tenant's own site so it opens the booking page.
  const seg = url.pathname.split('/').filter(Boolean);
  if (seg.length === 1 && VALID_SUBDOMAIN.test(seg[0]) && !APEX_PATHS.has(seg[0])) {
    const base = host.split(':')[0].replace(/^www\./, '');
    const dest = url.clone();
    dest.hostname = `${seg[0]}.${base}`;
    dest.pathname = '/';
    return NextResponse.redirect(dest, 307);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals, API routes and static files.
  matcher: ['/((?!_next/|api/|favicon.ico|.*\\..*).*)'],
};
