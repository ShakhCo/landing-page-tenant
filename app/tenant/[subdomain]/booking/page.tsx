import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { CalendarX2 } from 'lucide-react';
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

  // Reschedule: load the original booking up front. A reschedule link whose id
  // is missing/expired/foreign must NOT silently proceed — availability is a
  // read so the slot picker would render, but the final reschedule always fails
  // server-side (unknown booking). Show a clear "link invalid" screen instead.
  let initialDuration: number | undefined;
  let initialStaffId: string | undefined;
  if (reschedule) {
    const original = await getBooking(subdomain, reschedule);
    if (!original) {
      return (
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-background px-6 text-center">
          <div className="grid size-20 place-items-center rounded-full bg-foreground/5 text-foreground ring-1 ring-border">
            <CalendarX2 size={40} strokeWidth={2} />
          </div>
          <h1 className="mt-7 text-2xl font-extrabold text-foreground">Havola yaroqsiz</h1>
          <p className="mt-1.5 text-muted-foreground">
            Bu o&apos;zgartirish havolasi eskirgan yoki yaroqsiz. Yangi bron qilishingiz mumkin.
          </p>
          <Link
            href={service ? `/booking?service=${encodeURIComponent(service)}` : '/'}
            className="mt-7 flex h-14 w-full max-w-xs items-center justify-center rounded-full bg-foreground text-base font-bold text-background shadow-lg transition-all hover:opacity-90 active:scale-[0.99]"
          >
            Yangi bron qilish
          </Link>
        </main>
      );
    }
    // Derive the original booking's length so an hourly booking re-opens at its
    // real duration (no need to carry it in the URL).
    const { startAt, endAt } = original.booking ?? {};
    if (startAt && endAt) {
      const mins = Math.round((Date.parse(endAt) - Date.parse(startAt)) / 60000);
      if (mins > 0) initialDuration = mins;
    }
    // Preselect the original resource (unit/staff) so the customer only re-picks
    // the time. Skipped if the resource no longer exists on the tenant.
    const rid = original.booking?.items?.[0]?.resourceId;
    if (rid && tenant.staff.some((st) => st.id === rid)) initialStaffId = rid;
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
        initialStaffId={initialStaffId}
        hasSession={hasSession}
      />
    </main>
  );
}
