import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { getTenantDict } from '@/lib/dictionaries/tenant';
import { serverFetch } from '@/lib/serverFetch';
import { API_BASE, localized, type MyBooking, type MyBookingsResult } from '@/lib/tenant';

/** The signed-in customer's bookings at this tenant; null when the session is invalid. */
async function getMyBookings(
  subdomain: string,
  sessionToken: string,
): Promise<MyBookingsResult | null> {
  try {
    const res = await serverFetch(
      `${API_BASE}/public/tenants/${encodeURIComponent(subdomain)}/my-bookings`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
        cache: 'no-store',
      },
    );
    if (!res.ok) return null;
    return (await res.json()) as MyBookingsResult;
  } catch {
    return null;
  }
}

export const metadata = { robots: { index: false } };

const STATUS_STYLE: Record<string, string> = {
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  no_show: 'bg-amber-50 text-amber-700 border-amber-200',
};

/** The signed-in customer's bookings at this tenant. */
export default async function MyBookingsPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const token = (await cookies()).get('bookup_session')?.value;
  if (!token) redirect('/');

  const data = await getMyBookings(subdomain, token);
  if (!data) redirect('/'); // expired/invalid session

  const dict = getTenantDict('uz');
  const statusLabel: Record<string, string> = {
    confirmed: dict.statusConfirmed,
    completed: dict.statusCompleted,
    cancelled: dict.statusCancelled,
    no_show: dict.statusNoShow,
  };

  const fmt = new Intl.DateTimeFormat('ru-RU', {
    timeZone: data.business.timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const serviceNames = (b: MyBooking) =>
    b.items
      .map((it) => (it.name ? localized(it.name, 'uz') : ''))
      .filter(Boolean)
      .join(' · ');

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-6 sm:py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          aria-label={dict.back}
          className="grid size-10 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm transition-shadow hover:shadow-md"
        >
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{dict.myBookings}</h1>
          <p className="text-sm text-muted-foreground">{data.business.name}</p>
        </div>
      </div>

      {data.bookings.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-10 text-center">
          <CalendarDays size={32} className="mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-muted-foreground">
            {dict.myBookingsEmpty}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.bookings.map((b) => (
            <li key={b.id}>
              <Link
                href={`/b/${encodeURIComponent(b.id)}`}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[b.status] ?? 'bg-muted text-muted-foreground border-border'}`}
                    >
                      {statusLabel[b.status] ?? b.status}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                      {fmt.format(new Date(b.startAt))}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-base font-bold text-foreground">
                    {serviceNames(b) || '—'}
                  </p>
                  {b.totalPrice != null && (
                    <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
                      {b.totalPrice.toLocaleString('ru-RU')} {data.business.currency}
                    </p>
                  )}
                </div>
                <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
