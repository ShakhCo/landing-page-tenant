'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, MapPin, CalendarClock, X } from 'lucide-react';
import { localized, type LocalizedText, type PublicBookingView, type PublicTenant } from '@/lib/tenant';
import { cancelBookingAction } from './actions';

const MONTHS_FULL = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const WEEKDAYS_FULL = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const STATUS_UZ: Record<string, string> = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlangan',
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
  no_show: 'Kelmagan',
};
/** Light status tints for the badge. */
const BADGE_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  confirmed: 'bg-emerald-50 text-emerald-600',
  completed: 'bg-emerald-50 text-emerald-600',
  cancelled: 'bg-destructive/10 text-destructive',
  no_show: 'bg-foreground/5 text-muted-foreground',
};

function money(amount: number, currency: string) {
  const n = amount.toLocaleString('ru-RU');
  return currency === 'UZS' ? `${n} so'm` : `${n} ${currency}`;
}
function fmtDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h ? `${h} soat` : '', m ? `${m} daqiqa` : ''].filter(Boolean).join(' ') || '0 daqiqa';
}
function dateParts(iso: string, tz: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = Number(get('day'));
  const mon = MONTHS_FULL[Number(get('month')) - 1];
  const wd = WEEKDAYS_FULL[wdMap[get('weekday')] ?? 0];
  return { day, mon, wd, date: `${wd}, ${day}-${mon}`, time: `${get('hour')}:${get('minute')}` };
}
/** "14:00–15:00", or "14:00" if there's no end yet. */
function timeRange(startIso: string, endIso: string | null | undefined, tz: string) {
  const start = dateParts(startIso, tz).time;
  return endIso ? `${start}–${dateParts(endIso, tz).time}` : start;
}
/** Local YYYY-MM-DD in a timezone, for comparing calendar days. */
function localDay(d: Date, tz: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
/** "Bugun, 14:00–15:00" / "Ertaga, 14:00–15:00" / "Chorshanba, 10-Iyun · 14:00–15:00". */
function whenLabel(iso: string, tz: string, endIso?: string | null) {
  const p = dateParts(iso, tz);
  const time = endIso ? `${p.time}–${dateParts(endIso, tz).time}` : p.time;
  const bookingDay = localDay(new Date(iso), tz);
  const today = localDay(new Date(), tz);
  const tomorrow = localDay(new Date(Date.now() + 86_400_000), tz);
  if (bookingDay === today) return `Bugun, ${time}`;
  if (bookingDay === tomorrow) return `Ertaga, ${time}`;
  return `${p.wd}, ${p.day}-${p.mon} · ${time}`;
}
export function BookingResult({
  created,
  data,
  tenant,
  subdomain,
}: {
  created: boolean;
  data: PublicBookingView;
  tenant: PublicTenant | null;
  subdomain: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const { business, booking } = data;
  const branch = tenant?.branches?.[0] ?? null;
  const address = branch?.address ? localized(branch.address) : null;

  const total = booking.totalPrice ?? booking.items.reduce((s, i) => s + (i.price ?? 0), 0);
  const when = whenLabel(booking.startAt, business.timezone, booking.endAt);
  const durationMin = booking.endAt
    ? Math.round((Date.parse(booking.endAt) - Date.parse(booking.startAt)) / 60000)
    : null;

  const statusLabel = created ? 'Band qilindi' : STATUS_UZ[booking.status] ?? booking.status;
  const badgeStyle = created ? 'bg-emerald-50 text-emerald-600' : BADGE_STYLE[booking.status] ?? 'bg-foreground/5 text-muted-foreground';
  const badgeCheck = created || booking.status === 'confirmed' || booking.status === 'completed';

  const mapsQuery = branch
    ? `${branch.latitude},${branch.longitude}`
    : address
      ? encodeURIComponent(address)
      : null;
  const directionsHref = mapsQuery ? `https://www.google.com/maps/search/?api=1&query=${mapsQuery}` : null;

  // Only an upcoming, still-open booking can be rescheduled or cancelled.
  const manageable =
    (booking.status === 'pending' || booking.status === 'confirmed') &&
    Date.parse(booking.startAt) > Date.now();

  // Why a non-manageable booking can't be changed — shown as an alert on click.
  const blockReason = (verb: string) =>
    booking.status === 'pending' || booking.status === 'confirmed'
      ? `Bu bandlik allaqachon boshlangan — uni ${verb} bo'lmaydi.`
      : `Bu bandlik ${(STATUS_UZ[booking.status] ?? booking.status).toLowerCase()} — uni ${verb} bo'lmaydi.`;

  const reschedule = () => {
    if (pending) return;
    if (!manageable) {
      setNotice(blockReason("o'zgartirib"));
      return;
    }
    setNotice(null);
    const service = booking.items[0]?.offeringId;
    const qs = new URLSearchParams();
    if (service) qs.set('service', service);
    qs.set('reschedule', booking.id);
    // The booking page derives the original duration from the booking itself.
    router.push(`/booking?${qs.toString()}`);
  };

  const cancel = () => {
    if (pending) return;
    if (!manageable) {
      setNotice(blockReason('bekor qilib'));
      return;
    }
    if (!window.confirm('Bandlikni bekor qilishni xohlaysizmi?')) return;
    setNotice(null);
    startTransition(async () => {
      const r = await cancelBookingAction(subdomain, booking.id);
      if (r.ok) router.refresh();
      else setNotice(r.error);
    });
  };

  return (
    <div className="mx-auto max-w-xl px-5 pb-16 pt-8 sm:px-6">
      {/* Status badge + big time + duration */}
      <div>
        <motion.span
          initial={created ? { scale: 0.6, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 220 }}
          className={`inline-flex mb-4 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${badgeStyle}`}
        >
          {badgeCheck && <Check size={15} strokeWidth={3} />}
          {statusLabel}
        </motion.span>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight text-foreground">{when}</h1>
        {durationMin != null && (
          <p className="mt-1.5 text-base text-muted-foreground">{fmtDuration(durationMin)} davom etadi</p>
        )}
      </div>

      {/* Overview */}
      <Section>
        <div className="space-y-3">
          {booking.items.map((it, i) => (
            <div key={`${it.offeringId}-${i}`} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-base font-semibold text-foreground">{localized(it.name as LocalizedText | null, 'Xizmat')}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {[it.startAt ? timeRange(it.startAt, it.endAt, business.timezone) : null, it.resourceName]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <span className="whitespace-nowrap text-base font-semibold text-foreground">{money(it.price, business.currency)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="text-base font-bold text-foreground">Jami</span>
          <span className="text-base font-bold text-foreground">{money(total, business.currency)}</span>
        </div>
      </Section>

      {/* Getting there */}
      {branch && (
        <Section title="Manzil">
          <div className="overflow-hidden rounded-2xl border border-border">
            <iframe
              title="Map"
              src={`https://maps.google.com/maps?q=${branch.latitude},${branch.longitude}&z=15&output=embed`}
              className="h-56 w-full border-0 sm:h-64"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          {address && (
            <p className="mt-3 flex items-start gap-2.5 text-[15px] text-foreground">
              <MapPin size={20} className="mt-0.5 shrink-0 text-muted-foreground" />
              <span>
                {address}{' '}
                {directionsHref && (
                  <a href={directionsHref} target="_blank" rel="noreferrer" className="font-semibold text-accent">
                    Yo&apos;l ko&apos;rsatish
                  </a>
                )}
              </span>
            </p>
          )}
        </Section>
      )}

      {/* Manage: reschedule / cancel. Shown always; a click on a booking that's
          already started/completed/cancelled surfaces an alert explaining why. */}
      <div className="mt-9 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={reschedule}
          disabled={pending}
          aria-disabled={!manageable}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-[15px] font-semibold text-foreground transition-colors hover:bg-foreground/[0.03] disabled:opacity-50 ${manageable ? '' : 'opacity-60'}`}
        >
          <CalendarClock size={18} className="text-muted-foreground" />
          Vaqtni o&apos;zgartirish
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          aria-disabled={!manageable}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-card py-3.5 text-[15px] font-semibold text-destructive transition-colors hover:bg-destructive/[0.06] disabled:opacity-50 ${manageable ? '' : 'opacity-60'}`}
        >
          <X size={18} />
          {pending ? 'Bekor qilinmoqda…' : 'Bekor qilish'}
        </button>
        {notice && (
          <div className="mt-1 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            {notice}
          </div>
        )}
      </div>

      {/* Booking reference — small footnote */}
      <p className="mt-8 text-sm text-muted-foreground">
        Bron raqami <span className="font-semibold tracking-wide text-foreground">#{booking.id.slice(0, 8).toUpperCase()}</span>
      </p>
    </div>
  );
}

/** A page section with a consistent heading, top separator, and spacing. */
function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="mt-9">
      {title && <h2 className="text-lg font-bold text-foreground">{title}</h2>}
      <div className={title ? 'mt-4' : ''}>{children}</div>
    </section>
  );
}

