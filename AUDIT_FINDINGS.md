# Audit findings — bookup.uz (customer tenant site)

Running log from the audit-and-fix loop. Branch: `fixes/audit` (do NOT merge to main without review).

## Fixed
- **Missing SEO crawl infra** — no `robots.txt` or `sitemap.xml`. Added `app/robots.ts` (allow all; disallow `/booking` + `/bookings/` app flows; declares host + sitemap) and `app/sitemap.ts` (apex marketing pages). Build generates `/robots.txt` and `/sitemap.xml`.

## To review / remaining
- `not-found.tsx` redirects to `/` (a soft 307, not a 404) — intentional per an earlier product decision, so left as-is. Note: it returns a redirect rather than a 404 status, which is non-ideal for SEO; revisit if you want true 404s.
- Tenant subdomains aren't in the sitemap (dynamic, one per business). If you want them indexed, generate a per-subdomain sitemap from the businesses list.
- JS/UX is in good shape (actively polished this session); no stray debug/TODOs found.
