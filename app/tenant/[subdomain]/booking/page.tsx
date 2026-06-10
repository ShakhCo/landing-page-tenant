import { redirect } from 'next/navigation';
import { getTenant } from '@/lib/tenant';
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
  searchParams: Promise<{ service?: string; reschedule?: string; duration?: string }>;
}) {
  const { subdomain } = await params;
  const { service, reschedule, duration } = await searchParams;
  const tenant = await getTenant(subdomain);

  // No tenant or no bookable staff/services → back to the tenant home.
  if (!tenant || tenant.services.length === 0 || tenant.staff.length === 0) {
    redirect('/');
  }

  const dur = duration ? Number(duration) : NaN;

  return (
    <main className="min-h-screen bg-background">
      <BookingFlow
        tenant={tenant}
        subdomain={subdomain}
        initialServiceId={service}
        rescheduleId={reschedule}
        initialDuration={Number.isFinite(dur) && dur > 0 ? dur : undefined}
      />
    </main>
  );
}
