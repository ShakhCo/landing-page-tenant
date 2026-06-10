import { redirect } from 'next/navigation';
import { getBooking, getTenant } from '@/lib/tenant';
import { BookingResult } from './BookingResult';

export const metadata = {
  title: 'Bandlik tafsilotlari',
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

  return (
    <main className="min-h-screen bg-card">
      <BookingResult created={created === '1'} data={data} tenant={tenant} />
    </main>
  );
}
