import { redirect } from 'next/navigation';
import { getBooking } from '@/lib/tenant';
import { BookingResult } from './BookingResult';

export default async function BookingResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string; id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { subdomain, id } = await params;
  const { created } = await searchParams;
  const data = await getBooking(subdomain, id);
  if (!data) redirect('/');

  return (
    <main className="min-h-screen bg-background">
      <BookingResult created={created === '1'} data={data} />
    </main>
  );
}
