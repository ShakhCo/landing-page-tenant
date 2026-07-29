import { OG_SIZE, renderBookingOg } from '@/lib/booking-og-image';
import { getBooking, getTenant, locateBooking } from '@/lib/tenant';

// Per-booking OG/Twitter card (1200×630) for the shared /b/<short> link —
// business identity, booking status, date & time, and location on the BOOKUP
// brand. Shown when the SMS link is unfurled in a chat.
export const alt = 'BOOKUP — Bron';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ shortid: string }> }) {
  const { shortid } = await params;
  const subdomain = await locateBooking(shortid);
  if (!subdomain) return new Response('Not found', { status: 404 });

  const [data, tenant] = await Promise.all([getBooking(subdomain, shortid), getTenant(subdomain)]);
  if (!data) return new Response('Not found', { status: 404 });

  return renderBookingOg(data, tenant);
}
