'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, CalendarClock, CalendarX2, CalendarPlus, X, Send, BadgeCheck } from 'lucide-react';
import { formatBranchAddress, localized, mediaUrl, type LocalizedText, type PublicBookingView, type PublicTenant, type TenantLocale } from '@/lib/tenant';
import type { ResultDict } from '@/lib/dictionaries/result';
import { cancelBookingAction, requestCancelOtpAction } from './actions';
import { OtpInput } from '../../booking/OtpInput';
import { ReviewBlock } from './ReviewBlock';
import { Turnstile } from '@/components/Turnstile';

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

function money(amount: number, currency: string, dict: ResultDict) {
  const n = amount.toLocaleString('ru-RU');
  return currency === 'UZS' ? `${n} ${dict.som}` : `${n} ${currency}`;
}
/** "Salon Momi" → "SM" — same avatar fallback as the tenant page. */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}
function fmtDuration(min: number, dict: ResultDict) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h ? `${h} ${dict.durHour}` : '', m ? `${m} ${dict.durMin}` : ''].filter(Boolean).join(' ') || dict.durZero;
}
function dateParts(iso: string, tz: string, dict: ResultDict) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = Number(get('day'));
  const mon = dict.monthsFull[Number(get('month')) - 1];
  const wd = dict.weekdaysFull[wdMap[get('weekday')] ?? 0];
  return { day, mon, wd, date: `${wd}, ${day}-${mon}`, time: `${get('hour')}:${get('minute')}` };
}
/** "14:00–15:00", or "14:00" if there's no end yet. */
function timeRange(startIso: string, endIso: string | null | undefined, tz: string, dict: ResultDict) {
  const start = dateParts(startIso, tz, dict).time;
  return endIso ? `${start}–${dateParts(endIso, tz, dict).time}` : start;
}
/** "Iyun 11, 18:30–19:30" — compact date + time range for receipt rows. */
function whenCompact(iso: string, tz: string, dict: ResultDict, endIso?: string | null) {
  const p = dateParts(iso, tz, dict);
  return `${p.mon} ${p.day}, ${timeRange(iso, endIso, tz, dict)}`;
}
/** Local YYYY-MM-DD in a timezone, for comparing calendar days. */
function localDay(d: Date, tz: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
/** "Bugun, 14:00 dan 15:00 gacha" / "Ertaga, 14:00" / "Chorshanba, 10-Iyun · 14:00 dan 15:00 gacha". */
function whenLabel(iso: string, tz: string, dict: ResultDict, endIso?: string | null) {
  const p = dateParts(iso, tz, dict);
  const time = endIso ? `${p.time}–${dateParts(endIso, tz, dict).time}` : p.time;
  const bookingDay = localDay(new Date(iso), tz);
  const today = localDay(new Date(), tz);
  const tomorrow = localDay(new Date(Date.now() + 86_400_000), tz);
  if (bookingDay === today) return `${dict.today}, ${time}`;
  if (bookingDay === tomorrow) return `${dict.tomorrow}, ${time}`;
  // Compact: "18 Iyun, 13:30" — no weekday, it just made the title long.
  return `${p.day} ${p.mon}, ${time}`;
}
export function BookingResult({
  created,
  data,
  tenant,
  subdomain,
  dict,
  locale,
  hasSession = false,
  ownerPhone = null,
}: {
  created: boolean;
  data: PublicBookingView;
  tenant: PublicTenant | null;
  subdomain: string;
  dict: ResultDict;
  locale: TenantLocale;
  /** Remembered customer (bookup_session cookie) — cancel can try one-tap first. */
  hasSession?: boolean;
  /** Full phone shown only when the signed-in viewer is this booking's customer. */
  ownerPhone?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  // Cancellation is its own step: details → reason (optional) → confirm.
  // Picking the "reschedule" reason detours to a dedicated offer page first.
  const [view, setView] = useState<'details' | 'cancel' | 'offer'>('details');
  const [reason, setReason] = useState<string | null>(null);
  // Cancel must be confirmed: a remembered session that owns the booking
  // cancels one-tap; everyone else verifies an OTP sent to the booking phone.
  const [canOneTap, setCanOneTap] = useState(hasSession);
  const [otpStep, setOtpStep] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  // Turnstile token for the cancel OTP send (bot gate).
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const { business, booking } = data;
  const branch = tenant?.branches?.[0] ?? null;
  const address = branch?.address ? formatBranchAddress(branch, locale) : null;

  const total = booking.totalPrice ?? booking.items.reduce((s, i) => s + (i.price ?? 0), 0);
  // Hourly (time-rate) booking that has started and is still running — open OR
  // fixed-end: show a LIVE running total, rate × elapsed so far. Once it ends,
  // the stored total takes over. Re-rendered every minute via the tick below.
  const [, setTick] = useState(0);
  const svcOfItem = tenant?.services?.find((s) => s.id === booking.items[0]?.offeringId) ?? null;
  const liveRate = svcOfItem?.pricingMode === 'time_rate' ? svcOfItem.ratePerHour ?? null : null;
  const runningLive =
    liveRate != null &&
    (booking.status === 'pending' || booking.status === 'confirmed') &&
    Date.parse(booking.startAt) <= Date.now() &&
    (booking.endAt == null || Date.now() < Date.parse(booking.endAt));
  const elapsedMin = runningLive
    ? Math.max(1, Math.floor((Date.now() - Date.parse(booking.startAt)) / 60000))
    : null;
  // Rounded to the nearest 500 so'm so the running figure reads clean.
  const liveTotal =
    runningLive && elapsedMin != null ? Math.round((liveRate * elapsedMin) / 60 / 500) * 500 : null;
  useEffect(() => {
    if (!runningLive) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, [runningLive]);
  // Title shows just the start ("Bugun, 18:00") — the full range lives in the card's Vaqt row.
  const whenShort = whenLabel(booking.startAt, business.timezone, dict);
  // Resource field: the unit's own label ("Yo'laklar") when the booked resources
  // are assets, else "Mutaxassis". Resolved via the tenant payload by name.
  const resourceNames = Array.from(new Set(booking.items.map((i) => i.resourceName).filter(Boolean)));
  const firstSvc = tenant?.services?.find((s) => s.id === booking.items[0]?.offeringId) ?? null;
  const matchedStaff = (tenant?.staff ?? []).filter((st) => resourceNames.includes(st.name));
  const resourcesAreAssets = matchedStaff.length > 0 && matchedStaff.every((st) => st.type === 'asset');
  const resourceLabel = resourcesAreAssets ? (firstSvc?.unitLabel ? localized(firstSvc.unitLabel, '', locale) : dict.resourceUnit) : dict.resourceStaff;
  const durationMin = booking.endAt
    ? Math.round((Date.parse(booking.endAt) - Date.parse(booking.startAt)) / 60000)
    : null;

  // `created=1` shows the celebratory "just booked" view — but only while the
  // booking is genuinely active. A cancelled / no-show booking always shows its
  // real status, even if the success URL (?created=1) is revisited later.
  const justBooked = created && booking.status !== 'cancelled' && booking.status !== 'no_show';
  const STATUS_MAP: Record<string, string> = {
    pending: dict.statusPending,
    confirmed: dict.statusConfirmed,
    completed: dict.statusCompleted,
    cancelled: dict.statusCancelled,
    no_show: dict.statusNoShow,
  };
  const statusLabel = justBooked ? dict.booked : STATUS_MAP[booking.status] ?? booking.status;
  const badgeStyle = justBooked ? 'bg-emerald-50 text-emerald-600' : BADGE_STYLE[booking.status] ?? 'bg-foreground/5 text-muted-foreground';
  const badgeCheck = justBooked || booking.status === 'confirmed' || booking.status === 'completed';
  // Completed bookings lead with a focused review card (no business hero); the
  // booking details follow below as a normal card.
  const isCompleted = booking.status === 'completed';
  // "When the review was left" — formatted in the business timezone, same
  // compact shape as the title ("18 Iyun, 13:30").
  let reviewWhen: string | undefined;
  if (booking.review?.submittedAt) {
    const p = dateParts(booking.review.submittedAt, business.timezone, dict);
    reviewWhen = `${p.day} ${p.mon}, ${p.time}`;
  }

  // Only an upcoming, still-open booking can be rescheduled or cancelled.
  const manageable =
    (booking.status === 'pending' || booking.status === 'confirmed') &&
    Date.parse(booking.startAt) > Date.now();

  const reschedule = () => {
    if (pending || !manageable) return;
    setNotice(null);
    const service = booking.items[0]?.offeringId;
    const qs = new URLSearchParams();
    if (service) qs.set('service', service);
    qs.set('reschedule', booking.id);
    // The booking page derives the original duration from the booking itself.
    router.push(`/booking?${qs.toString()}`);
  };

  const cancel = () => {
    if (pending || !manageable) return;
    setNotice(null);
    setView('cancel');
    window.scrollTo(0, 0);
  };

  // Finished bookings (cancelled / no-show / completed) can't be reopened —
  // offer a fresh booking with the same services preselected (8-char id
  // prefixes, as the booking page expects).
  const showBookAgain =
    booking.status === 'cancelled' || booking.status === 'no_show' || booking.status === 'completed';
  const bookAgain = () => {
    if (pending) return;
    const ids = Array.from(new Set(booking.items.map((i) => i.offeringId).filter(Boolean)))
      .map((id) => id.slice(0, 8))
      .join(',');
    router.push(ids ? `/booking?services=${ids}` : '/booking');
  };

  // Send the cancel OTP and switch the cancel view to the code entry.
  const beginCancelOtp = async () => {
    const r = await requestCancelOtpAction(subdomain, booking.id, turnstileToken);
    if (!r.ok) {
      setNotice(r.error);
      return;
    }
    setMaskedPhone(r.maskedPhone);
    setOtpCode('');
    setOtpStep(true);
    setResendIn(60);
    setView('cancel');
    window.scrollTo(0, 0);
  };

  // Tick down the resend cooldown once per second.
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn(resendIn - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  const confirmCancel = () => {
    if (pending) return;
    if (otpStep && otpCode.length < 5) return;
    setNotice(null);
    startTransition(async () => {
      // No session and no code yet → identity first: send the OTP.
      if (!canOneTap && !otpStep) {
        await beginCancelOtp();
        return;
      }
      const r = await cancelBookingAction(subdomain, booking.id, {
        reason: reason ?? undefined,
        code: otpStep ? otpCode : undefined,
      });
      if (r.ok) {
        setOtpStep(false);
        setView('details');
        router.refresh();
        return;
      }
      // Session expired or doesn't own this booking → fall back to OTP.
      if (r.needsOtp) {
        setCanOneTap(false);
        await beginCancelOtp();
        return;
      }
      if (r.otpExhausted) {
        setOtpCode('');
        setResendIn(0);
      }
      setNotice(r.error);
    });
  };

  // ---- cancel flow + reschedule-offer detour (animated between each other) ----
  if (view === 'cancel' || view === 'offer') {
    const slide = {
      initial: { opacity: 0, x: 16 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -16 },
      transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
    };
    return (
      <div className="mx-auto max-w-xl px-5 pb-16 pt-4 sm:px-6">
        <AnimatePresence mode="wait" initial={false}>
          {view === 'offer' ? (
            <motion.div key="offer" {...slide}>
              <TopChrome
                dict={dict}
                onBack={() => { if (!pending) { setView('cancel'); setNotice(null); } }}
                onClose={() => router.push('/')}
              />
              <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-foreground">{dict.rescheduleQ}</h1>

              <p className="mt-6 text-base text-foreground">
                {dict.rescheduleHint}
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
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-[15px] font-bold text-background shadow-lg transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
              >
                <CalendarClock size={18} />
                {dict.rescheduleYes}
              </button>
              <button
                type="button"
                onClick={confirmCancel}
                disabled={pending}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-card py-3.5 text-[15px] font-semibold text-destructive transition-colors duration-200 hover:bg-destructive/[0.06] disabled:opacity-50"
              >
                {pending ? dict.cancelling : dict.cancelNo}
              </button>
            </motion.div>
          ) : (
            <motion.div key="cancel" {...slide}>
              <TopChrome
                dict={dict}
                onBack={() => {
                  if (pending) return;
                  if (otpStep) {
                    setOtpStep(false);
                    setNotice(null);
                    return;
                  }
                  setView('details');
                  setNotice(null);
                }}
                onClose={() => router.push('/')}
              />
              <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-foreground">
                {otpStep ? dict.smsTitle : dict.cancelTitle}
              </h1>
              <p className="mt-1.5 text-base text-muted-foreground">{whenShort} · {business.name}</p>

              {otpStep && (
                <div className="mt-7">
                  <p className="text-sm text-muted-foreground">
                    {dict.codeSentPre}<span className="font-semibold text-foreground">{maskedPhone}</span>{dict.codeSentPost}
                  </p>
                  <div className="mt-4">
                    <OtpInput value={otpCode} onChange={(v) => { setOtpCode(v); if (notice) setNotice(null); }} length={5} autoFocus />
                    <button
                      type="button"
                      onClick={() => { if (!pending && resendIn <= 0) void beginCancelOtp(); }}
                      disabled={pending || resendIn > 0}
                      className="mt-3 text-sm font-semibold text-foreground underline underline-offset-4 disabled:no-underline disabled:text-muted-foreground"
                    >
                      {resendIn > 0 ? `${dict.resendCode} · 0:${String(resendIn).padStart(2, '0')}` : dict.resendCode}
                    </button>
                  </div>
                </div>
              )}

              {!otpStep && (
              <div className="mt-7">
                <p className="text-lg font-extrabold text-foreground">
                  {dict.reasonQ} <span className="text-sm font-medium text-muted-foreground">{dict.optional}</span>
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
                        className="flex items-center gap-4 rounded-2xl border border-foreground/10 bg-card p-4 text-left transition-colors duration-200 hover:border-foreground/30"
                      >
                        <span className="font-semibold text-foreground">{localized(r.label, '', locale)}</span>
                        <span className={`ml-auto grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? 'border-foreground bg-foreground text-background' : 'border-border'}`}>
                          {on ? <Check size={16} strokeWidth={3} /> : <span className="size-2 rounded-full bg-foreground/30" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              )}

              {notice && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  {notice}
                </div>
              )}

              <button
                type="button"
                onClick={confirmCancel}
                disabled={pending || (otpStep && otpCode.length < 5)}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-destructive py-3.5 text-[15px] font-bold text-white shadow-lg shadow-destructive/20 transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
              >
                {pending ? dict.cancelling : dict.cancelConfirm}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const avatarUrl = tenant?.business?.avatarUrl ?? null;
  return (
    <div className="pb-16">
      {/* Bot gate for the cancel OTP — mounts only for a cancellable booking,
          invisible unless a challenge is needed. */}
      {manageable && (
        <div className="pointer-events-auto fixed inset-x-0 bottom-4 z-[70] flex justify-center">
          <Turnstile onToken={setTurnstileToken} />
        </div>
      )}
      {/* ===== Completed → review card on top, focused, no business hero ===== */}
      {isCompleted ? (
        <div className="mx-auto max-w-xl px-4 pt-4 sm:px-6">
          {/* No map hero here, so carry its own back button. */}
          <button
            type="button"
            onClick={() => router.push('/')}
            aria-label={dict.ariaBack}
            className="grid size-11 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors duration-200 hover:bg-foreground/5"
          >
            <ChevronLeft size={22} />
          </button>
          <ReviewBlock
            subdomain={subdomain}
            bookingId={booking.id}
            dict={dict}
            initial={booking.review ?? null}
            businessName={business.name}
            submittedAtLabel={reviewWhen}
            className="mt-4"
          />
        </div>
      ) : /* ===== Identity header — same map hero as the tenant home ===== */
      branch ? (
        <div className="mx-auto max-w-[1350px]">
          <div className="relative">
            <button
              type="button"
              onClick={() => router.push('/')}
              aria-label={dict.ariaBack}
              className="absolute left-3 top-3 z-20 grid size-11 place-items-center rounded-xl border border-border bg-card/90 text-foreground shadow-sm backdrop-blur transition-colors duration-200 hover:bg-foreground/5"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="h-52 w-full overflow-hidden rounded-2xl rounded-t-none border border-t-none sm:h-80">
              <iframe
                title="Map"
                src={`https://maps.google.com/maps?q=${branch.latitude},${branch.longitude}&z=15&output=embed&iwloc=near`}
                className="pointer-events-none -mt-20 h-[calc(100%+160px)] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="absolute bottom-0 left-1/2 size-24 -translate-x-1/2 translate-y-1/2 overflow-hidden rounded-full bg-card shadow-lg ring-4 ring-card">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(avatarUrl)} alt={business.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-foreground/[0.08] text-3xl font-semibold tracking-wide text-muted-foreground">
                  {initials(business.name)}
                </div>
              )}
            </div>
          </div>
          <div className="mt-16 px-4 text-center">
            <h1 className="flex items-center justify-center gap-1.5 text-2xl font-bold text-foreground">
              {business.name}
              <BadgeCheck className="size-5 fill-blue-500 text-card" />
            </h1>
            {address && (
              <p className="mt-2 text-center text-sm text-muted-foreground">{address}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-xl px-5 pt-8 text-center sm:px-6">
          <h1 className="text-2xl font-bold text-foreground">{business.name}</h1>
        </div>
      )}

      <div className="mx-auto max-w-xl px-4 sm:px-6">
      {/* ===== One card: status, time, details, total, actions, reference ===== */}
      <div className={`rounded-2xl border border-foreground/10 bg-card p-5 sm:p-6 ${isCompleted ? 'mt-4' : 'mt-10'}`}>
        {/* Status badge + time — one heading size for the whole card */}
        <motion.span
          initial={justBooked ? { scale: 0.6, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 220 }}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-semibold sm:px-3 sm:py-1 sm:text-sm ${badgeStyle}`}
        >
          {badgeCheck && <Check size={14} strokeWidth={3} />}
          {statusLabel}
        </motion.span>
        {/* Completed has no business hero, so the card leads with the business
            name; the date/time still lives in the Vaqt row below. Other
            statuses keep the time here (name is already in the hero above). */}
        <h2 className="mt-3 text-xl font-bold leading-tight text-foreground sm:text-2xl">
          {isCompleted ? business.name : whenShort}
        </h2>

        {/* Receipt rows — muted label left, value right, all 15px */}
        <div className="mt-6 space-y-3.5">
            {booking.items.map((it, i) => {
              // Hourly services show their rate ("…/soat") so the pricing mode is
              // visible; the actual charge is in the Jami row. Fixed → flat price.
              const svc = tenant?.services?.find((s) => s.id === it.offeringId) ?? null;
              const mode = it.pricingMode ?? svc?.pricingMode;
              const itemPrice =
                mode === 'variable' && it.price === 0
                  ? dict.individual
                  : svc?.pricingMode === 'time_rate' && svc.ratePerHour != null
                    ? `${money(svc.ratePerHour, business.currency, dict)}${dict.perHour}`
                    : money(it.price, business.currency, dict);
              return (
                <div key={`${it.offeringId}-${i}`} className="flex items-baseline justify-between gap-4 text-[15px]">
                  <span className="text-muted-foreground">{localized(it.name as LocalizedText | null, dict.itemFallback, locale)}</span>
                  <span className="text-right font-semibold text-foreground">
                    {itemPrice}
                    {booking.items.length > 1 && it.startAt && (
                      <span className="block text-sm font-normal text-muted-foreground">{timeRange(it.startAt, it.endAt, business.timezone, dict)}</span>
                    )}
                  </span>
                </div>
              );
            })}
            {resourceNames.length > 0 && (
              <div className="flex items-baseline justify-between gap-4 text-[15px]">
                <span className="text-muted-foreground">{resourceLabel}</span>
                <span className="text-right font-semibold text-foreground">{resourceNames.join(', ')}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-4 text-[15px]">
              <span className="text-muted-foreground">{dict.fieldTime}</span>
              <span className="text-right font-semibold text-foreground">
                {whenCompact(booking.startAt, business.timezone, dict, booking.endAt)}
              </span>
            </div>
            {(ownerPhone ?? booking.customer?.maskedPhone) && (
              <div className="flex items-baseline justify-between gap-4 text-[15px]">
                <span className="text-muted-foreground">{dict.customer}</span>
                <span className="text-right font-semibold tabular-nums text-foreground">{ownerPhone ?? booking.customer?.maskedPhone}</span>
              </div>
            )}
        </div>

        {/* Total — the only divider in the card body */}
        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-border pt-4 text-[15px]">
          <span className="text-muted-foreground">
            {dict.total}{(elapsedMin ?? durationMin) ? ` · ${fmtDuration((elapsedMin ?? durationMin)!, dict)}` : ''}
          </span>
          <span className="text-right text-lg font-bold text-foreground">
            {booking.items.some((it) => (it.pricingMode ?? tenant?.services?.find((s) => s.id === it.offeringId)?.pricingMode) === 'variable' && it.price === 0)
              ? dict.individual
              : money(liveTotal ?? total, business.currency, dict)}
          </span>
        </div>

        {/* Started but still open — explain why the manage actions are gone. */}
        {!manageable && (booking.status === 'confirmed' || booking.status === 'pending') && (
          <div className="mt-5 rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-700 dark:text-amber-400">
            {dict.startedNotice}
          </div>
        )}

        {/* Manage: borderless list rows — only while the booking is still
            upcoming and open; started/cancelled/completed hide them entirely. */}
        {manageable && (
          <div className="-mx-2 mt-5 border-t border-border pt-2">
            <button
              type="button"
              onClick={reschedule}
              disabled={pending}
              className="flex w-full items-center gap-3.5 rounded-xl px-2 py-3.5 text-left text-[15px] font-semibold text-foreground transition-colors duration-200 hover:bg-foreground/5 disabled:opacity-50"
            >
              <CalendarClock size={20} className="shrink-0" />
              {dict.manageReschedule}
              <ChevronRight size={18} className="ml-auto shrink-0 text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="flex w-full items-center gap-3.5 rounded-xl px-2 py-3.5 text-left text-[15px] font-semibold text-destructive transition-colors duration-200 hover:bg-destructive/[0.06] disabled:opacity-50"
            >
              <CalendarX2 size={20} className="shrink-0" />
              {pending ? dict.cancelling : dict.manageCancel}
              <ChevronRight size={18} className="ml-auto shrink-0 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Book again — cancelled / no-show bookings can't be reopened */}
        {showBookAgain && (
          <div className="mt-5 border-t border-border pt-4">
            <button
              type="button"
              onClick={bookAgain}
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-bold text-background transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
            >
              <CalendarPlus size={18} />
              {dict.bookAgain}
            </button>
          </div>
        )}

        {/* Footer: booking reference + Telegram help — quiet, no extra border */}
        <div className={`flex items-center justify-between gap-3 text-sm text-muted-foreground ${manageable || showBookAgain ? 'mt-4' : 'mt-4 border-t border-border pt-4'}`}>
          <span>
            {dict.bookingRef}{' '}
            <span className="font-semibold tracking-wide text-foreground">#{booking.id.slice(0, 8).toUpperCase()}</span>
          </span>
          <a
            href="https://t.me/ShakhCo"
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-1.5 font-semibold transition-colors duration-200 hover:text-foreground"
          >
            <Send size={14} />
            {dict.help}
          </a>
        </div>
      </div>
      </div>
    </div>
  );
}

/** Back + close buttons, same chrome as the booking flow's wizard pages. */
function TopChrome({ onBack, onClose, dict }: { onBack: () => void; onClose: () => void; dict: ResultDict }) {
  return (
    <div className="flex items-center justify-between py-4">
      <button
        type="button"
        onClick={onBack}
        aria-label={dict.ariaBack}
        className="grid size-11 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors duration-200 hover:bg-foreground/5"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label={dict.ariaClose}
        className="grid size-11 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors duration-200 hover:bg-foreground/5"
      >
        <X size={20} />
      </button>
    </div>
  );
}


