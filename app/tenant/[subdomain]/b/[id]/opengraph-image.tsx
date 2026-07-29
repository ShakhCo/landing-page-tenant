import { OG_SIZE, renderBookingOg } from '@/lib/booking-og-image';
import { getBooking, getTenant } from '@/lib/tenant';

// Per-booking OG card for the tenant page (<sub>.bookup.uz/b/<id>) — the same
// card as the root /b/<short> link, so sharing the subdomain URL unfurls too.
export const alt = 'BOOKUP — Bron';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ subdomain: string; id: string }> }) {
  const { subdomain, id } = await params;
  const [data, tenant] = await Promise.all([getBooking(subdomain, id), getTenant(subdomain)]);
  if (!data) return new Response('Not found', { status: 404 });

  return renderBookingOg(data, tenant);
}
