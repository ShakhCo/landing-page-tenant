import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { middleware } from './middleware';

/** A request as it reaches the edge: a URL plus the Host header that routed it. */
const req = (host: string, path = '/') =>
  new NextRequest(new URL(path, `https://${host}`), { headers: { host } });

const rewritten = (res: Response) => res.headers.get('x-middleware-rewrite');
const redirected = (res: Response) => res.headers.get('location');

describe('middleware — tenant hosts', () => {
  it('serves a tenant subdomain from the internal tenant route', () => {
    const res = middleware(req('barber.bookup.uz'));

    expect(rewritten(res)).toBe('https://barber.bookup.uz/tenant/barber');
  });

  it('keeps the path when rewriting', () => {
    const res = middleware(req('barber.bookup.uz', '/booking'));

    expect(rewritten(res)).toBe('https://barber.bookup.uz/tenant/barber/booking');
  });

  it('works the same on a dev host', () => {
    const res = middleware(req('barber.localhost:3000', '/b/ABCD1234'));

    expect(rewritten(res)).toContain('/tenant/barber/b/ABCD1234');
  });

  it('refuses a hostname that could never be a tenant', () => {
    // Uppercase, symbols, dots and over-long labels are rejected at the edge so
    // junk hostnames never reach the tenant page or the backend lookup.
    for (const host of ['BAR_BER.bookup.uz', 'a.b.bookup.uz', `${'x'.repeat(64)}.bookup.uz`]) {
      expect(middleware(req(host)).status, host).toBe(404);
    }
  });
});

describe('middleware — the main site', () => {
  it('leaves the apex host alone', () => {
    for (const host of ['bookup.uz', 'www.bookup.uz', 'localhost:3000']) {
      const res = middleware(req(host));
      expect(rewritten(res), host).toBeNull();
      expect(redirected(res), host).toBeNull();
    }
  });

  it('treats an unknown host (e.g. a dev tunnel) as the main site', () => {
    const res = middleware(req('random-tunnel.trycloudflare.com'));

    expect(rewritten(res)).toBeNull();
  });

  it('sends the internal tenant routes back home when hit directly', () => {
    const res = middleware(req('bookup.uz', '/tenant/barber'));

    // /tenant/* is an implementation detail of the rewrite, not a public URL.
    expect(redirected(res)).toBe('https://bookup.uz/');
  });

  it('bounces a business short link to that tenant\'s own site', () => {
    const res = middleware(req('bookup.uz', '/barber'));

    // bookup.uz/<subdomain> is what the win-back SMS sends.
    expect(res.status).toBe(307);
    expect(redirected(res)).toBe('https://barber.bookup.uz/');
  });

  it('drops the www prefix when building that redirect', () => {
    const res = middleware(req('www.bookup.uz', '/barber'));

    expect(redirected(res)).toBe('https://barber.bookup.uz/');
  });

  it('never bounces a real apex route', () => {
    for (const path of ['/ru', '/en', '/oz', '/narxlar', '/business', '/instagram-connected', '/b']) {
      const res = middleware(req('bookup.uz', path));
      expect(redirected(res), path).toBeNull();
    }
  });

  it('leaves deeper paths alone', () => {
    // Only a single DNS-label segment is a short link.
    const res = middleware(req('bookup.uz', '/business/barbershops'));

    expect(redirected(res)).toBeNull();
  });
});
