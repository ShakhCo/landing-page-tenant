'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, MapPin } from 'lucide-react';
import { localized, type LocalizedText, type PublicBookingView, type PublicTenant } from '@/lib/tenant';

const MONTHS_FULL = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const WEEKDAYS_FULL = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const STATUS_UZ: Record<string, string> = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlangan',
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
  no_show: 'Kelmagan',
};
/** Solid status colors for the top banner. */
const BANNER_STYLE: Record<string, string> = {
  pending: 'bg-amber-500',
  confirmed: 'bg-emerald-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-destructive',
  no_show: 'bg-foreground/60',
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
}: {
  created: boolean;
  data: PublicBookingView;
  tenant: PublicTenant | null;
}) {
  const router = useRouter();
  const { business, booking } = data;
  const branch = tenant?.branches?.[0] ?? null;
  const address = branch?.address ? localized(branch.address) : null;

  const total = booking.totalPrice ?? booking.items.reduce((s, i) => s + (i.price ?? 0), 0);
  const when = whenLabel(booking.startAt, business.timezone, booking.endAt);
  const durationMin = booking.endAt
    ? Math.round((Date.parse(booking.endAt) - Date.parse(booking.startAt)) / 60000)
    : null;

  const statusLabel = created ? 'Band qilindi' : STATUS_UZ[booking.status] ?? booking.status;
  const bannerStyle = created ? 'bg-emerald-500' : BANNER_STYLE[booking.status] ?? 'bg-foreground/60';

  const mapsQuery = branch
    ? `${branch.latitude},${branch.longitude}`
    : address
      ? encodeURIComponent(address)
      : null;
  const directionsHref = mapsQuery ? `https://www.google.com/maps/search/?api=1&query=${mapsQuery}` : null;

  return (
    <div className="mx-auto max-w-xl px-5 pb-16 sm:px-6">
      {/* Status banner (card width) */}
      <motion.div
        initial={created ? { opacity: 0, y: -8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`mb-6 flex items-center justify-center gap-2 rounded-b-2xl px-5 py-4 text-center text-sm font-bold text-white ${bannerStyle}`}
      >
        {(created || booking.status === 'confirmed' || booking.status === 'completed') && <Check size={16} strokeWidth={3} />}
        {statusLabel}
      </motion.div>

      {/* Big time + duration */}
      <div className="mt-1">
        <h1 className="text-3xl font-extrabold leading-tight text-foreground">{when}</h1>
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
                {it.resourceName && <p className="mt-0.5 text-sm text-muted-foreground">{it.resourceName}</p>}
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

      {/* Booking reference — small footnote */}
      <p className="mt-8 text-sm text-muted-foreground">
        Bandlik raqami <span className="font-semibold tracking-wide text-foreground">#{booking.id.slice(0, 8).toUpperCase()}</span>
      </p>

      <button
        type="button"
        onClick={() => router.push('/')}
        className="mt-7 flex h-14 w-full items-center justify-center rounded-full bg-foreground text-base font-bold text-background shadow-lg transition-all hover:opacity-90 active:scale-[0.99]"
      >
        Tayyor
      </button>
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

