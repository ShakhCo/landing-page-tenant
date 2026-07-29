import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getBooking, getTenant, type TenantLocale } from '@/lib/tenant';
import { bookingWhen, statusLabel } from '@/lib/booking-og';
import { getResultDict } from '@/lib/dictionaries/result';
import { getSession } from '@/lib/session';
import { BookingResult } from './BookingResult';
import { LiveRefresh } from './LiveRefresh';

function readLocale(value: string | undefined): TenantLocale {
  return value === 'ru' || value === 'en' ? value : 'uz';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string; id: string }>;
}): Promise<Metadata> {
  const { subdomain, id } = await params;
  const noindex = { index: false, follow: false } as const; // private booking
  const data = await getBooking(subdomain, id);
  if (!data) {
    return { title: 'Bron tafsilotlari', robots: noindex };
  }
  const { date, time } = bookingWhen(data.booking.startAt, data.business.timezone || 'Asia/Tashkent');
  const title = `${data.business.name} — bron`;
  const description = `${statusLabel(data.booking.status)} · ${date}, ${time}`;
  // Point og:image at the subdomain host explicitly — Next would otherwise
  // resolve it against the root metadataBase (bookup.uz/tenant/*), which
  // 307-redirects and breaks the link preview (same as the tenant home page).
  const ogImage = {
    url: `https://${subdomain}.bookup.uz/b/${id}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: title,
  };
  return {
    title,
    description,
    robots: noindex,
    openGraph: { type: 'website', title, description, images: [ogImage] },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage.url] },
  };
}

export default async function BookingResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string; id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { subdomain, id } = await params;
  const { created } = await searchParams;
  const [data, tenant] = await Promise.all([getBooking(subdomain, id), getTenant(subdomain)]);
  if (!data) redirect('/');

  // Remembered customer? → cancel can try one-tap before falling back to OTP.
  const jar = await cookies();
  const hasSession = jar.has('bookup_session');
  const locale = readLocale(jar.get('bookup_locale')?.value);
  const dict = getResultDict(locale);

  // Show the phone in full when the signed-in viewer is this booking's customer.
  // The public API masks the phone and blanks the customer id, so we match by
  // the last 4 digits the mask reveals against the viewer's session phone. The
  // number shown is always the viewer's OWN (from their session) — nothing about
  // another customer is exposed.
  const session = await getSession();
  const maskedLast4 = (data.booking.customer?.maskedPhone ?? '').replace(/\D/g, '').slice(-4);
  const sessionLast4 = (session?.phone ?? '').replace(/\D/g, '').slice(-4);
  const ownerPhone =
    session?.phone && maskedLast4.length === 4 && sessionLast4 === maskedLast4
      ? session.phone
      : null;

  return (
    <main className="min-h-screen bg-card">
      <LiveRefresh refId={id} />
      <BookingResult created={created === '1'} data={data} tenant={tenant} subdomain={subdomain} dict={dict} locale={locale} hasSession={hasSession} ownerPhone={ownerPhone} />
    </main>
  );
}
