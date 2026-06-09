import { NextResponse, type NextRequest } from 'next/server';

/** Hosts that serve the main marketing site (no tenant). */
const ROOT_HOSTS = new Set(['bookup.uz', 'www.bookup.uz', 'localhost', '127.0.0.1']);

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

export function proxy(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const sub = tenantSubdomain(host);
  const url = req.nextUrl;

  if (sub) {
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

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals, API routes and static files.
  matcher: ['/((?!_next/|api/|favicon.ico|.*\\..*).*)'],
};
