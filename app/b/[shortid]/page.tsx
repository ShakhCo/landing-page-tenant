import type { Metadata } from 'next';
import { TenantRedirect } from './TenantRedirect';
import { bookingWhen, statusLabel } from '@/lib/booking-og';
import { getBooking, locateBooking } from '@/lib/tenant';

// Rich unfurl for the shared SMS link. The og:image comes from the sibling
// opengraph-image.tsx; here we set the title/description text. Still noindex —
// this route is only a redirect shim.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ shortid: string }>;
}): Promise<Metadata> {
  const { shortid } = await params;
  const noindex = { index: false, follow: false } as const;
  const subdomain = await locateBooking(shortid);
  const data = subdomain ? await getBooking(subdomain, shortid) : null;
  if (!data) {
    return { title: 'Bron — BOOKUP', robots: noindex };
  }
  const { date, time } = bookingWhen(data.booking.startAt, data.business.timezone || 'Asia/Tashkent');
  const title = `${data.business.name} — bron`;
  const description = `${statusLabel(data.booking.status)} · ${date}, ${time}`;
  return {
    title,
    description,
    robots: noindex,
    openGraph: { title, description },
    twitter: { card: 'summary_large_image', title, description },
  };
}

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
  // Resolve the tenant during SSR (deduped with generateMetadata's call via
  // React cache) so the client can bounce immediately — no extra round trip.
  const subdomain = await locateBooking(shortid);
  return (
    <main className="min-h-screen bg-card pb-16">
      <TenantRedirect shortId={shortid} subdomain={subdomain} />
    </main>
  );
}
