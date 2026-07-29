import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { CalendarX2 } from 'lucide-react';
import { getTenant, getBooking, type TenantLocale } from '@/lib/tenant';
import { getBookingDict } from '@/lib/dictionaries/booking';
import { BookingFlow } from './BookingFlow';

function readLocale(value: string | undefined): TenantLocale {
  return value === 'ru' || value === 'en' ? value : 'uz';
}

export const metadata = {
  title: 'Bron qilish',
  robots: { index: false, follow: false }, // app flow — not for search
};

export default async function BookingRoute({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ service?: string; services?: string; reschedule?: string; staff?: string }>;
}) {
  const { subdomain } = await params;
  const { service, services, reschedule, staff: staffParam } = await searchParams;
  const jar = await cookies();
  const locale = readLocale(jar.get('bookup_locale')?.value);
  const dict = getBookingDict(locale);
  const tenant = await getTenant(subdomain);

  // No tenant or no bookable staff/services → back to the tenant home.
  if (!tenant || tenant.services.length === 0 || tenant.staff.length === 0) {
    redirect('/');
  }

  // Preselected services: `services` is a comma list of id tokens. The new
  // backend uses short integer ids (e.g. "227"), so a token is usually the FULL
  // id (exact match); legacy UUIDs come through as an 8-char prefix. Match exact
  // first, else a UNIQUE prefix against THIS tenant's services only — an unknown
  // or ambiguous token is silently dropped (worst case: nothing preselected).
  const svcParam = services ?? service ?? '';
  const initialServiceIds = Array.from(
    new Set(
      svcParam
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((tok) => {
          const exact = tenant.services.find((s) => s.id === tok);
          if (exact) return exact.id;
          const matches = tenant.services.filter((s) => s.id.startsWith(tok));
          return matches.length === 1 ? matches[0].id : null;
        })
        .filter((id): id is string => id !== null),
    ),
  );

  // Staff-scoped entry: `?staff=<8-char id prefix>` from a specialist's "Bron"
  // on the tenant page. Resolve it to a single staff member who actually offers
  // services; an unknown/ambiguous token (or a reschedule link) is ignored.
  let scopedStaffId: string | undefined;
  if (staffParam && !reschedule) {
    const tok = staffParam.trim();
    const exact = tenant.staff.find((st) => st.id === tok);
    const matches = exact ? [exact] : tok ? tenant.staff.filter((st) => st.id.startsWith(tok)) : [];
    const picked = matches.length === 1 ? matches[0] : null;
    if (picked && picked.offeringIds.length > 0) scopedStaffId = picked.id;
  }

  // Reschedule: load the original booking up front. A reschedule link whose id
  // is missing/expired/foreign must NOT silently proceed — availability is a
  // read so the slot picker would render, but the final reschedule always fails
  // server-side (unknown booking). Show a clear "link invalid" screen instead.
  let initialDuration: number | undefined;
  let initialStaffId: string | undefined;
  if (reschedule) {
    const original = await getBooking(subdomain, reschedule);
    // Already started (or no longer open) → nothing can be rescheduled; send
    // the customer back to the booking page, which explains why inline.
    if (
      original &&
      (Date.parse(original.booking.startAt) <= Date.now() ||
        !['pending', 'confirmed'].includes(original.booking.status))
    ) {
      redirect(`/b/${reschedule.slice(0, 8)}`);
    }
    if (!original) {
      return (
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-card px-6 text-center">
          <div className="grid size-20 place-items-center rounded-full bg-foreground/5 text-foreground ring-1 ring-border">
            <CalendarX2 size={40} strokeWidth={2} />
          </div>
          <h1 className="mt-7 text-2xl font-extrabold text-foreground">{dict.invalidLinkTitle}</h1>
          <p className="mt-1.5 text-muted-foreground">
            {dict.invalidLinkText}
          </p>
          <Link
            href={initialServiceIds.length ? `/booking?services=${initialServiceIds.map((id) => id.slice(0, 8)).join(',')}` : '/'}
            className="mt-7 flex h-14 w-full max-w-xs items-center justify-center rounded-full bg-foreground text-base font-bold text-background shadow-lg transition-all hover:opacity-90 active:scale-[0.99]"
          >
            {dict.newBooking}
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
    <main className="min-h-screen bg-card">
      <BookingFlow
        tenant={tenant}
        subdomain={subdomain}
        dict={dict}
        locale={locale}
        initialServiceIds={initialServiceIds}
        rescheduleId={reschedule}
        initialDuration={initialDuration}
        initialStaffId={initialStaffId}
        scopedStaffId={scopedStaffId}
        hasSession={hasSession}
      />
    </main>
  );
}
