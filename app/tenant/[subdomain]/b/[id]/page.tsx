import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getBooking, getTenant, type TenantLocale } from '@/lib/tenant';
import { getResultDict } from '@/lib/dictionaries/result';
import { BookingResult } from './BookingResult';

function readLocale(value: string | undefined): TenantLocale {
  return value === 'ru' || value === 'en' ? value : 'uz';
}

export const metadata = {
  title: 'Bron tafsilotlari',
  robots: { index: false, follow: false }, // private booking — never index
};

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

  return (
    <main className="min-h-screen bg-card">
      <BookingResult created={created === '1'} data={data} tenant={tenant} subdomain={subdomain} dict={dict} locale={locale} hasSession={hasSession} />
    </main>
  );
}
