import { TenantRedirect } from './TenantRedirect';

export const metadata = {
  title: 'Bron',
  robots: { index: false, follow: false }, // a redirect shim — never index
};

/**
 * Root-domain short booking link: bookup.uz/b/<shortId> → resolves the tenant
 * and bounces to <subdomain>.bookup.uz/b/<shortId> (client-side, with a
 * tenant-shaped skeleton meanwhile). Lives only on the marketing host —
 * tenant subdomains are rewritten to /tenant/<sub>/b/<id> by the middleware.
 */
export default async function ShortBookingRedirect({
  params,
}: {
  params: Promise<{ shortid: string }>;
}) {
  const { shortid } = await params;
  return (
    <main className="min-h-screen bg-card pb-16">
      <TenantRedirect shortId={shortid} />
    </main>
  );
}
