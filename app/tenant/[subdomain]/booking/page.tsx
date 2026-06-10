import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTenant, getBooking } from '@/lib/tenant';
import { BookingFlow } from './BookingFlow';

export const metadata = {
  title: 'Bron qilish',
  robots: { index: false, follow: false }, // app flow — not for search
};

export default async function BookingRoute({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ service?: string; reschedule?: string }>;
}) {
  const { subdomain } = await params;
  const { service, reschedule } = await searchParams;
  const tenant = await getTenant(subdomain);

  // No tenant or no bookable staff/services → back to the tenant home.
  if (!tenant || tenant.services.length === 0 || tenant.staff.length === 0) {
    redirect('/');
  }

  // Reschedule: derive the original booking's length so an hourly booking
  // re-opens at its real duration (no need to carry it in the URL).
  let initialDuration: number | undefined;
  if (reschedule) {
    const original = await getBooking(subdomain, reschedule);
    const { startAt, endAt } = original?.booking ?? {};
    if (startAt && endAt) {
      const mins = Math.round((Date.parse(endAt) - Date.parse(startAt)) / 60000);
      if (mins > 0) initialDuration = mins;
    }
  }

  // Remembered customer? → the flow can skip the phone/OTP step.
  const hasSession = (await cookies()).has('bookup_session');

  return (
    <main className="min-h-screen bg-background">
      <BookingFlow
        tenant={tenant}
        subdomain={subdomain}
        initialServiceId={service}
        rescheduleId={reschedule}
        initialDuration={initialDuration}
        hasSession={hasSession}
      />
    </main>
  );
}
