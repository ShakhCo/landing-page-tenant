'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, ChevronLeft, MapPin, CalendarClock, X, Send } from 'lucide-react';
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
/** Optional cancellation reasons — stable slugs for the backend, localized labels for the UI. */
const CANCEL_REASONS: { slug: string; label: LocalizedText }[] = [
  { slug: 'plans_changed', label: { uz: "Rejalarim o'zgardi", ru: 'Планы изменились', en: 'My plans changed' } },
  { slug: 'reschedule', label: { uz: "Boshqa vaqtga ko'chirmoqchiman", ru: 'Хочу перенести на другое время', en: 'I want to reschedule' } },
  { slug: 'booked_by_mistake', label: { uz: 'Adashib band qildim', ru: 'Записался по ошибке', en: 'Booked by mistake' } },
  { slug: 'chose_another_place', label: { uz: 'Boshqa joyni tanladim', ru: 'Выбрал другое место', en: 'Chose another place' } },
  { slug: 'other', label: { uz: 'Boshqa sabab', ru: 'Другая причина', en: 'Other reason' } },
];
/** Picking this reason means the customer actually wants a new time — offer reschedule first. */
const RESCHEDULE_REASON = 'reschedule';
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
/** "Bugun, 14:00 dan 15:00 gacha" / "Ertaga, 14:00" / "Chorshanba, 10-Iyun · 14:00 dan 15:00 gacha". */
function whenLabel(iso: string, tz: string, endIso?: string | null) {
  const p = dateParts(iso, tz);
  const time = endIso ? `${p.time} dan ${dateParts(endIso, tz).time} gacha` : p.time;
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
  // Cancellation is its own step: details → reason (optional) → confirm.
  // Picking the "reschedule" reason detours to a dedicated offer page first.
  const [view, setView] = useState<'details' | 'cancel' | 'offer'>('details');
  const [reason, setReason] = useState<string | null>(null);
  const { business, booking } = data;
  const branch = tenant?.branches?.[0] ?? null;
  const address = branch?.address ? localized(branch.address) : null;

  const total = booking.totalPrice ?? booking.items.reduce((s, i) => s + (i.price ?? 0), 0);
  const when = whenLabel(booking.startAt, business.timezone, booking.endAt);
  // Title shows just the start ("Bugun, 18:00") — the full range lives in the card's Vaqt row.
  const whenShort = whenLabel(booking.startAt, business.timezone);
  // Resource field: the unit's own label ("Yo'laklar") when the booked resources
  // are assets, else "Mutaxassis". Resolved via the tenant payload by name.
  const resourceNames = Array.from(new Set(booking.items.map((i) => i.resourceName).filter(Boolean)));
  const firstSvc = tenant?.services?.find((s) => s.id === booking.items[0]?.offeringId) ?? null;
  const matchedStaff = (tenant?.staff ?? []).filter((st) => resourceNames.includes(st.name));
  const resourcesAreAssets = matchedStaff.length > 0 && matchedStaff.every((st) => st.type === 'asset');
  const resourceLabel = resourcesAreAssets ? (firstSvc?.unitLabel ? localized(firstSvc.unitLabel) : 'Joy') : 'Mutaxassis';
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
      ? `Bu bron allaqachon boshlangan — uni ${verb} bo'lmaydi.`
      : `Bu bron ${(STATUS_UZ[booking.status] ?? booking.status).toLowerCase()} — uni ${verb} bo'lmaydi.`;

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
    setNotice(null);
    setView('cancel');
    window.scrollTo(0, 0);
  };

  const confirmCancel = () => {
    if (pending) return;
    setNotice(null);
    startTransition(async () => {
      const r = await cancelBookingAction(subdomain, booking.id, reason ?? undefined);
      if (r.ok) {
        setView('details');
        router.refresh();
      } else setNotice(r.error);
    });
  };

  // ---- reschedule offer (picked the "want another time" cancel reason) ----
  if (view === 'offer') {
    return (
      <div className="mx-auto max-w-xl px-5 pb-16 pt-4 sm:px-6">
        <TopChrome
          onBack={() => { if (!pending) { setView('cancel'); setNotice(null); } }}
          onClose={() => router.push('/')}
        />
        <h1 className="mt-2 text-3xl font-extrabold leading-tight text-foreground">Vaqtni o&apos;zgartirasizmi?</h1>
        <p className="mt-1.5 text-base text-muted-foreground">{whenShort} · {business.name}</p>

        <p className="mt-6 text-base text-foreground">
          Bekor qilish shart emas — bronni o&apos;zingizga qulay boshqa vaqtga ko&apos;chirishingiz mumkin.
        </p>

        {notice && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            {notice}
          </div>
        )}

        <button
          type="button"
          onClick={reschedule}
          disabled={pending}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3.5 text-[15px] font-bold text-background transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
        >
          <CalendarClock size={18} />
          Ha, vaqtni o&apos;zgartirish
        </button>
        <button
          type="button"
          onClick={confirmCancel}
          disabled={pending}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-card py-3.5 text-[15px] font-semibold text-destructive transition-colors hover:bg-destructive/[0.06] disabled:opacity-50"
        >
          {pending ? 'Bekor qilinmoqda…' : "Yo'q, bekor qilish"}
        </button>
      </div>
    );
  }

  // ---- cancellation step ----
  if (view === 'cancel') {
    return (
      <div className="mx-auto max-w-xl px-5 pb-16 pt-4 sm:px-6">
        <TopChrome
          onBack={() => { if (!pending) { setView('details'); setNotice(null); } }}
          onClose={() => router.push('/')}
        />
        <h1 className="mt-2 text-3xl font-extrabold leading-tight text-foreground">Bronni bekor qilish</h1>
        <p className="mt-1.5 text-base text-muted-foreground">{whenShort} · {business.name}</p>

        <div className="mt-7">
          <p className="text-lg font-extrabold text-foreground">
            Sababi nima? <span className="text-sm font-medium text-muted-foreground">(ixtiyoriy)</span>
          </p>
          <div className="mt-3 flex flex-col gap-2.5">
            {CANCEL_REASONS.map((r) => {
              const on = reason === r.slug;
              return (
                <button
                  key={r.slug}
                  type="button"
                  onClick={() => {
                    if (on) {
                      setReason(null);
                      return;
                    }
                    setReason(r.slug);
                    if (r.slug === RESCHEDULE_REASON) {
                      setView('offer');
                      window.scrollTo(0, 0);
                    }
                  }}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-foreground/20"
                >
                  <span className="font-semibold text-foreground">{localized(r.label)}</span>
                  <span className={`ml-auto grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? 'border-accent bg-accent text-accent-foreground' : 'border-border'}`}>
                    {on ? <Check size={16} strokeWidth={3} /> : <span className="size-2 rounded-full bg-foreground/30" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {notice && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            {notice}
          </div>
        )}

        <button
          type="button"
          onClick={confirmCancel}
          disabled={pending}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive py-3.5 text-[15px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
        >
          {pending ? 'Bekor qilinmoqda…' : 'Bronni bekor qilish'}
        </button>
      </div>
    );
  }

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
        <h1 className="mt-3 text-3xl font-extrabold leading-tight text-foreground">{whenShort}</h1>
        <p className="mt-1.5 text-base text-muted-foreground">{business.name}</p>
      </div>

      {/* Overview — same labeled-field card style as the booking flow's confirm step */}
      <Section>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="space-y-5">
            {booking.items.map((it, i) => {
              // Hourly services show their rate ("…/soat") so the pricing mode is
              // visible; the actual charge is in the Jami row. Fixed → flat price.
              const svc = tenant?.services?.find((s) => s.id === it.offeringId) ?? null;
              const itemPrice =
                svc?.pricingMode === 'time_rate' && svc.ratePerHour != null
                  ? `${money(svc.ratePerHour, business.currency)}/soat`
                  : money(it.price, business.currency);
              return (
                <div key={`${it.offeringId}-${i}`}>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Xizmat</p>
                  <div className="mt-0.5 flex items-baseline justify-between gap-3">
                    <p className="text-base font-semibold text-foreground">{localized(it.name as LocalizedText | null, 'Xizmat')}</p>
                    <p className="whitespace-nowrap text-sm text-muted-foreground">{itemPrice}</p>
                  </div>
                  {booking.items.length > 1 && it.startAt && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{timeRange(it.startAt, it.endAt, business.timezone)}</p>
                  )}
                </div>
              );
            })}
            {resourceNames.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{resourceLabel}</p>
                <p className="mt-0.5 text-base font-semibold text-foreground">{resourceNames.join(', ')}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vaqt</p>
              <p className="mt-0.5 text-base font-semibold text-foreground">{when}</p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-base font-bold text-foreground">
            <span>Jami{durationMin ? ` · ${fmtDuration(durationMin)}` : ''}</span>
            <span>{money(total, business.currency)}</span>
          </div>
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
          {pending ? 'Bekor qilinmoqda…' : 'Bekor qilish, bora olmayman'}
        </button>
        <a
          href="https://t.me/ShakhCo"
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <Send size={16} />
          Yordam kerakmi? Telegram orqali yozing
        </a>
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

/** Back + close buttons, same chrome as the booking flow's wizard pages. */
function TopChrome({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between py-4">
      <button
        type="button"
        onClick={onBack}
        aria-label="Orqaga"
        className="grid size-11 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-foreground/5"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Yopish"
        className="grid size-11 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-foreground/5"
      >
        <X size={20} />
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

