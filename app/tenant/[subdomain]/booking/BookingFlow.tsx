'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, Check, Clock, Calendar, Phone, Minus, Plus, X, ArrowRight, Wallet } from 'lucide-react';
import { localized, type LocalizedText, type PublicTenant, type AvailabilityResult } from '@/lib/tenant';
import { getAvailabilityAction, requestOtpAction, requestRescheduleOtpAction, createBookingAction } from './actions';

type Step = 'services' | 'staff' | 'time' | 'done';
const FLOW: Step[] = ['services', 'staff', 'time'];
const STEP_TITLE: Record<Step, string> = {
  services: 'Xizmatlarni tanlang',
  staff: 'Mutaxassisni tanlang',
  time: 'Sana va vaqt',
  done: '',
};
const WD = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
const MONTHS_FULL = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const WEEKDAYS_FULL = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const WEEK = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
const pad2 = (n: number) => String(n).padStart(2, '0');
function isoParts(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return { day: d.getUTCDate(), monIdx: d.getUTCMonth(), wdIdx: d.getUTCDay() };
}
function addDaysIso(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
const PERIODS = [
  { label: 'Ertalab', from: 0, to: 12 },
  { label: 'Kunduzi', from: 12, to: 18 },
  { label: 'Kechqurun', from: 18, to: 24 },
];

function money(amount: number, currency: string) {
  const n = amount.toLocaleString('ru-RU');
  return currency === 'UZS' ? `${n} so'm` : `${n} ${currency}`;
}
function dur(min: number) {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? (m ? `${h} soat ${m} daq` : `${h} soat`) : `${m} daq`;
}
function isUnitService(s: { pricingMode: string }) {
  return s.pricingMode === 'time_rate';
}
/** Per-service price label: hourly rate for a unit/time-rate service, flat price for fixed. */
function priceLabel(
  s: { pricingMode: string; ratePerHour: number | null; price: number | null },
  currency: string,
) {
  return s.pricingMode === 'time_rate'
    ? s.ratePerHour != null ? `${money(s.ratePerHour, currency)}/soat` : ''
    : s.price != null ? money(s.price, currency) : '';
}
function addHm(hm: string, mins: number) {
  const [h, m] = hm.split(':').map(Number);
  const t = h * 60 + m + mins;
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}
function fmtHmInTz(ms: number, tz: string) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(ms));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${get('hour')}:${get('minute')}`;
}
const SLOT_STEP_MS = 10 * 60_000; // 10-minute grid, aligned to :00 / :10 / …
/** TIME_RATE: 10-min-aligned start times where [start, start+duration] fits a free window. */
function hourlySlots(
  res: { free: Array<{ fromAt: string; toAt: string }> } | undefined,
  durationMin: number,
  tz: string,
): { start: string; startAt: string }[] {
  if (!res) return [];
  const out: { start: string; startAt: string }[] = [];
  const durMs = durationMin * 60_000;
  for (const w of res.free ?? []) {
    const endMs = Date.parse(w.toAt);
    // Align the first start up to a 10-min boundary so slots land on :00, :10, …
    const startMs = Math.ceil(Date.parse(w.fromAt) / SLOT_STEP_MS) * SLOT_STEP_MS;
    for (let ms = startMs; ms + durMs <= endMs; ms += SLOT_STEP_MS) {
      out.push({ start: fmtHmInTz(ms, tz), startAt: new Date(ms).toISOString() });
    }
  }
  return out;
}
function fmtPhone(d: string) {
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
}
function nextDates(tz: string, n = 14) {
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
  const base = new Date(`${todayStr}T00:00:00Z`);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(base.getTime() + i * 86_400_000);
    return { iso: d.toISOString().slice(0, 10), day: d.getUTCDate(), wd: WD[d.getUTCDay()], mon: MONTHS[d.getUTCMonth()] };
  });
}

export function BookingFlow({
  tenant,
  subdomain,
  initialServiceId,
  rescheduleId,
  initialDuration,
  hasSession = false,
}: {
  tenant: PublicTenant;
  subdomain: string;
  initialServiceId?: string;
  rescheduleId?: string;
  initialDuration?: number;
  hasSession?: boolean;
}) {
  const router = useRouter();
  const { business } = tenant;
  const branches = tenant.branches ?? [];
  const services = tenant.services ?? [];
  const staff = tenant.staff ?? [];
  const branch = branches[0];
  const tz = branch?.timezone ?? 'Asia/Tashkent';
  const dates = nextDates(tz);

  // Skip the services step and go straight to the resource/time picker when:
  //  - the business has exactly one service, OR
  //  - the entry service (?service=…) is a unit (time-rate) — units are exclusive,
  //    so the user should pick a unit next, not browse other services.
  const onlyService = services.length === 1 ? services[0] : null;
  const initService = initialServiceId ? services.find((s) => s.id === initialServiceId) ?? null : null;
  const skipService = onlyService ?? (initService && isUnitService(initService) ? initService : null);
  const skipEligible = skipService ? staff.filter((st) => st.offeringIds.includes(skipService.id)) : [];

  const [step, setStep] = useState<Step>(() => {
    if (!skipService) return 'services';
    if (skipEligible.length === 1) return 'time';
    if (skipEligible.length > 1) return 'staff';
    return 'services'; // no eligible resource → keep on services
  });
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    skipService
      ? [skipService.id]
      : initialServiceId && services.some((s) => s.id === initialServiceId)
        ? [initialServiceId]
        : [],
  );
  const [staffId, setStaffId] = useState<string | null>(
    skipService && skipEligible.length === 1 ? skipEligible[0].id : null,
  );
  const [date, setDate] = useState<string>(dates[0]?.iso ?? '');
  const [slot, setSlot] = useState<string | null>(null);
  const [avail, setAvail] = useState<AvailabilityResult | null>(null);
  const [availLoading, setAvailLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [durationMin, setDurationMin] = useState(initialDuration && initialDuration > 0 ? initialDuration : 60);
  // Reschedule: masked phone of the original booking ("••• •• 40 20") for the OTP step.
  const [maskedPhone, setMaskedPhone] = useState('');
  // Confirm/OTP modal — opens automatically when a time slot is picked.
  const [showConfirm, setShowConfirm] = useState(false);
  // Remembered customer (cookie) → one-tap, no phone/OTP. Flips off if the
  // session turns out to be expired when we try to book.
  const [sessionActive, setSessionActive] = useState(hasSession);
  // Seconds left before the customer can request a new OTP (60s cooldown).
  const [resendIn, setResendIn] = useState(0);

  const selected = services.filter((s) => selectedIds.includes(s.id));
  const hourly = selected.some(isUnitService); // time-rate (unit or staff) booking
  const selectedIsUnit = hourly;
  const eligibleStaff = staff.filter((st) => selectedIds.every((id) => st.offeringIds.includes(id)));
  const resourcesAreAssets = eligibleStaff.length > 0 && eligibleStaff.every((r) => r.type === 'asset');
  const selectedStaff = staff.find((st) => st.id === staffId) ?? null;

  const availRes = avail?.resources?.find((r) => r.resourceId === staffId) ?? avail?.resources?.[0];
  const ratePerHour = hourly ? (availRes?.ratePerHour ?? selected[0]?.ratePerHour ?? 0) : 0;

  const totalPrice = hourly
    ? Math.round((ratePerHour * durationMin) / 60)
    : selected.reduce((s, x) => s + (x.price ?? 0), 0);
  const totalMin = hourly ? durationMin : selected.reduce((s, x) => s + (x.durationMinutes ?? 0), 0);

  // 10-minute grid aligned to the hour (…:00, :10, …) for both fixed and hourly services.
  const allSlots = hourly
    ? hourlySlots(availRes, durationMin, tz)
    : (avail?.slots ?? []).filter((s) => Number(s.start.slice(3, 5)) % 10 === 0);
  const futureSlots = allSlots.filter((s) => new Date(s.startAt).getTime() > Date.now());
  // Skeleton count = the slots we expect. While refetching after a duration
  // change, the (still-loaded) free windows are recomputed at the NEW duration,
  // so futureSlots already reflects "more slots if shorter, fewer if longer".
  // First load (no data yet) falls back to a generic count.
  const skeletonCount = futureSlots.length > 0 ? Math.min(futureSlots.length, 30) : 8;

  const todayIso = dates[0]?.iso ?? date;
  const tomorrowIso = addDaysIso(todayIso, 1);
  const maxIso = addDaysIso(todayIso, 90);
  const selP = date ? isoParts(date) : null;
  const selDate = selP ? { day: selP.day, mon: MONTHS[selP.monIdx] } : null;
  const dateLabel = !selP
    ? 'Sana tanlang'
    : date === todayIso
      ? `Bugun, ${selP.day}-${MONTHS_FULL[selP.monIdx]}`
      : date === tomorrowIso
        ? `Ertaga, ${selP.day}-${MONTHS_FULL[selP.monIdx]}`
        : `${WEEKDAYS_FULL[selP.wdIdx]}, ${selP.day}-${MONTHS_FULL[selP.monIdx]}`;
  // "Bugun, 16:00 dan 19:30 gacha" — relative day + chosen time range, for the confirm modal.
  const dayWord = !selP ? '' : date === todayIso ? 'Bugun' : date === tomorrowIso ? 'Ertaga' : WEEKDAYS_FULL[selP.wdIdx];
  const modalWhen = slot ? `${dayWord}, ${slot}${hourly ? ` dan ${addHm(slot, durationMin)} gacha` : ''}` : null;

  useEffect(() => {
    if (step !== 'time' || !staffId || !date) return;
    let alive = true;
    setAvailLoading(true);
    setSlot(null);
    getAvailabilityAction(subdomain, date, selectedIds, staffId, rescheduleId).then((r) => {
      if (!alive) return;
      setAvail(r.ok ? r.data : null);
      // An availability failure just shows the empty "no free time" state —
      // no red error banner on the time step.
      setError(null);
      setAvailLoading(false);
    });
    return () => {
      alive = false;
    };
    // durationMin only changes for hourly services (the stepper is hidden for
    // fixed) — refetching on it keeps the free windows fresh against concurrent
    // bookings while the customer adjusts the duration.
  }, [step, date, staffId, subdomain, selectedIds, durationMin, rescheduleId]);

  const back = () => {
    setError(null);
    if (showConfirm) { setShowConfirm(false); return; }
    if (step === 'staff') setStep('services');
    else if (step === 'time') setStep(eligibleStaff.length > 1 ? 'staff' : 'services');
    else router.push('/');
  };
  const advance = (ids: string[] = selectedIds) => {
    setError(null);
    if (ids.length === 0) return;
    const elig = staff.filter((st) => ids.every((id) => st.offeringIds.includes(id)));
    if (elig.length === 0) {
      setError('Bu xizmatlarni bitta mutaxassis bajara olmaydi — alohida band qiling.');
      return;
    }
    if (elig.length === 1) {
      setStaffId(elig[0].id);
      setStep('time');
    } else setStep('staff');
  };
  const goFromServices = () => advance();
  const toggleService = (id: string) => {
    const svc = services.find((s) => s.id === id);
    if (!svc) return;
    if (isUnitService(svc)) {
      // Unit / time-rate service is exclusive — select it alone and skip the
      // multi-service page straight to the unit/time picker.
      setSelectedIds([id]);
      advance([id]);
      return;
    }
    // Fixed service: replace any unit selection, otherwise multi-toggle.
    setSelectedIds((prev) => {
      const prevHasUnit = prev.some((pid) => {
        const p = services.find((s) => s.id === pid);
        return p ? isUnitService(p) : false;
      });
      if (prevHasUnit) return [id];
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };
  const sendCode = async () => {
    if (busy) return;
    // Reschedule: OTP goes to the ORIGINAL booking's phone (server-resolved) —
    // the customer never re-enters their number.
    if (rescheduleId) {
      setError(null);
      setBusy(true);
      const r = await requestRescheduleOtpAction(subdomain, rescheduleId);
      setBusy(false);
      if (r.ok) {
        setMaskedPhone(r.maskedPhone);
        setIsNewCustomer(false); // existing customer → no name needed
        setOtpSent(true);
        setResendIn(60);
      } else setError(r.error);
      return;
    }
    if (phone.length !== 9) return;
    setError(null);
    setBusy(true);
    const r = await requestOtpAction(`+998${phone}`);
    setBusy(false);
    if (r.ok) {
      setIsNewCustomer(r.isNewCustomer);
      setOtpSent(true);
      setResendIn(60);
    } else setError(r.error);
  };

  // Lock background scroll while the confirm modal is open.
  useEffect(() => {
    if (!showConfirm) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [showConfirm]);

  // Tick down the resend cooldown once per second.
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn(resendIn - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);
  const confirm = async () => {
    // Remembered session → no OTP needed; otherwise require the 5-digit code.
    if (!slot || !staffId || busy || (!sessionActive && code.length < 5)) return;
    setError(null);
    setBusy(true);
    const r = await createBookingAction(subdomain, {
      date,
      start: slot,
      // Hourly (time-rate) booking carries an explicit start+end on its single item.
      items: hourly
        ? [{ offeringId: selectedIds[0], resourceId: staffId, start: slot, end: addHm(slot, durationMin) }]
        : selectedIds.map((id) => ({ offeringId: id, resourceId: staffId })),
      name: name.trim() || undefined,
      // Phone/code only matter for the OTP path; the cookie session is attached
      // server-side by the action. Reschedule resolves the phone server-side.
      phone: sessionActive || rescheduleId ? undefined : `+998${phone}`,
      code: sessionActive ? undefined : code,
      rescheduleId,
    });
    if (r.ok) {
      // Reschedule: the backend already cancelled the old booking and linked it
      // to this new one (rescheduledToId), so nothing extra to do here.
      router.push(`/bookings/${r.id}?created=1`);
      return; // keep `busy` while the page navigates
    }
    setBusy(false);
    // Session expired → drop one-tap and fall back to the OTP flow.
    if (r.needsOtp) {
      setSessionActive(false);
      if (rescheduleId) void sendCode(); // resend to the original number
      return;
    }
    setError(r.error);
  };

  // ---- success ----
  if (step === 'done') {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-background px-6">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          className="grid size-24 place-items-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/30"
        >
          <Check size={48} strokeWidth={3} />
        </motion.div>
        <h1 className="mt-7 text-2xl font-extrabold text-foreground">Band qilindi!</h1>
        <p className="mt-1.5 text-center text-muted-foreground">Tafsilotlarni SMS orqali tasdiqlaymiz.</p>
        <div className="mt-7 w-full rounded-3xl border border-border bg-card p-5">
          <div className="space-y-3">
            <FieldRow label={resourcesAreAssets ? 'Joy' : 'Mutaxassis'} value={selectedStaff?.name ?? '—'} />
            <FieldRow label="Vaqt" value={`${selDate?.day} ${selDate?.mon} · ${slot}`} />
          </div>
          <div className="mt-3 border-t border-border pt-3">
            {selected.map((s) => (
              <div key={s.id} className="flex justify-between py-0.5 text-sm">
                <span className="text-muted-foreground">{localized(s.name as LocalizedText)}</span>
                <span className="font-medium text-foreground">{priceLabel(s, business.currency)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
              <span>Jami</span>
              <span>{money(totalPrice, business.currency)}</span>
            </div>
          </div>
        </div>
        <PrimaryBtn onClick={() => router.push('/')} className="mt-6">
          Tayyor
        </PrimaryBtn>
      </div>
    );
  }

  const stepShort = (s: Step) =>
    s === 'services' ? 'Xizmatlar'
    : s === 'staff' ? (resourcesAreAssets ? 'Joy' : 'Mutaxassis')
    : s === 'time' ? 'Vaqt'
    : 'Tasdiqlash';
  const bigTitle =
    step === 'staff' && resourcesAreAssets ? 'Joyni tanlang'
    : step === 'time' && rescheduleId ? 'Yangi sana va vaqt'
    : STEP_TITLE[step];

  // Context-aware primary action (drives both the desktop summary and mobile bar)
  const action =
    step === 'services'
      ? { label: 'Davom etish', disabled: selected.length === 0, onClick: goFromServices }
      : step === 'staff'
        ? { label: 'Davom etish', disabled: !staffId, onClick: () => { setError(null); setStep('time'); } }
        : { label: 'Davom etish', disabled: !slot, onClick: () => { if (slot) { setError(null); setShowConfirm(true); } } };

  // Modal's primary button:
  //  - remembered session → one tap, no OTP;
  //  - reschedule (no session) → confirm the time first ("Davom etish" sends OTP);
  //  - new (no session) → confirm after the phone + OTP.
  const confirmBtn = sessionActive
    ? { label: rescheduleId ? "Vaqtni o'zgartirish" : 'Bandlikni tasdiqlash', disabled: busy, onClick: confirm }
    : rescheduleId && !otpSent
      ? { label: 'Davom etish', disabled: busy, onClick: sendCode }
      : {
          label: rescheduleId ? "Vaqtni o'zgartirish" : 'Bandlikni tasdiqlash',
          disabled: !otpSent || code.length < 5 || busy || (isNewCustomer && !name.trim()),
          onClick: confirm,
        };

  return (
    <div className="mx-auto min-h-screen max-w-[1300px] px-4 pb-32 lg:pb-12">
      {/* Top chrome: back + close */}
      <div className="flex items-center justify-between py-4">
        <button type="button" onClick={back} aria-label="Orqaga" className="grid size-11 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-foreground/5">
          <ChevronLeft size={22} />
        </button>
        <button type="button" onClick={() => router.push('/')} aria-label="Yopish" className="grid size-11 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-foreground/5">
          <X size={20} />
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_420px] lg:items-start lg:gap-20">
        {/* ===== LEFT: breadcrumb + title + choices ===== */}
        <div className="min-w-0 lg:order-1">
          {/* breadcrumb stepper — click a reached step to jump back to it */}
          <nav className="scrollbar-hide flex items-center gap-x-1.5 overflow-x-auto whitespace-nowrap text-sm">
            {FLOW.map((s, i) => {
              // Reachable once every step before it is satisfied (so completing the
              // current step unlocks the next breadcrumb item).
              const reached = s === step || FLOW.slice(0, i).every((ps) =>
                ps === 'services' ? selected.length > 0
                : ps === 'staff' ? staffId != null
                : ps === 'time' ? slot != null
                : true,
              );
              return (
                <span key={s} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight size={14} className="text-muted-foreground/50" />}
                  <button
                    type="button"
                    disabled={!reached}
                    onClick={() => { setError(null); setStep(s); }}
                    className={`transition-colors disabled:cursor-default ${
                      s === step
                        ? 'font-bold text-foreground'
                        : reached
                          ? 'text-muted-foreground hover:text-foreground'
                          : 'text-muted-foreground/50'
                    }`}
                  >
                    {stepShort(s)}
                  </button>
                </span>
              );
            })}
          </nav>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">{bigTitle}</h1>

          <div className="mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
            >
              {/* ---- services ---- */}
              {step === 'services' && (
                <div className="flex flex-col gap-3">
                  {services.map((s, i) => {
                    const on = selectedIds.includes(s.id);
                    const price = priceLabel(s, business.currency);
                    return (
                      <motion.button
                        key={s.id}
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4), ease: 'easeOut' }}
                        onClick={() => toggleService(s.id)}
                        className={`rounded-2xl border-2 bg-card p-5 text-left transition-colors ${on ? 'border-accent' : 'border-border hover:border-foreground/20'}`}
                      >
                        <h3 className="font-bold text-foreground">{localized(s.name as LocalizedText)}</h3>
                        {s.durationMinutes != null && <p className="mt-1 text-sm text-muted-foreground">{dur(s.durationMinutes)}</p>}
                        <div className="mt-4 flex items-center justify-between gap-3">
                          {price && <p className="font-bold text-foreground">{price}</p>}
                          {/* A unit (time-rate) selection is exclusive — other services can't be
                              added, only switched to — so show a select (radio) circle, not a +. */}
                          <span className={`ml-auto grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-foreground'}`}>
                            {/* "+" only for fixed services that can be added (not units, and not
                                while a unit/hourly service is selected); otherwise a select dot. */}
                            {on
                              ? <Check size={18} strokeWidth={3} />
                              : !isUnitService(s) && !hourly
                                ? <Plus size={18} />
                                : <span className="size-2.5 rounded-full bg-foreground/30" />}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* ---- staff ---- */}
              {step === 'staff' && (
                <div className="flex flex-col gap-2.5">
                  {eligibleStaff.map((st, i) => {
                    const on = staffId === st.id;
                    return (
                      <motion.button
                        key={st.id}
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4), ease: 'easeOut' }}
                        onClick={() => {
                          setStaffId(st.id);
                          // Units (assets) auto-advance on pick; staff confirm via "Davom etish".
                          if (st.type === 'asset') {
                            setError(null);
                            setStep('time');
                          }
                        }}
                        className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-foreground/20"
                      >
                        {st.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={st.photoUrl} alt={st.name} className="size-12 rounded-full object-cover" />
                        ) : (
                          <span className="grid size-12 place-items-center rounded-full bg-foreground/5 text-lg font-bold text-foreground ring-1 ring-border">
                            {st.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="font-semibold text-foreground">{st.name}</span>
                        <span className={`ml-auto grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? 'border-accent bg-accent text-accent-foreground' : 'border-border'}`}>
                          {on ? <Check size={16} strokeWidth={3} /> : <span className="size-2 rounded-full bg-foreground/30" />}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* ---- time ---- */}
              {step === 'time' && (
                <div>
                  {/* quick chips + calendar field */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip on={date === todayIso} onClick={() => setDate(todayIso)}>Bugun</Chip>
                    <Chip on={date === tomorrowIso} onClick={() => setDate(tomorrowIso)}>Ertaga</Chip>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCal((v) => !v)}
                        className="flex h-13 items-center gap-2.5 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:border-foreground/40"
                      >
                        <Calendar size={16} className="text-muted-foreground" />
                        {dateLabel}
                        <ChevronDown size={16} className={`text-muted-foreground transition-transform ${showCal ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {showCal && (
                          <>
                            <div className="fixed inset-0 z-20" onClick={() => setShowCal(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-0 top-full z-30 mt-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card p-4 shadow-xl"
                            >
                              <DayPicker
                                value={date}
                                todayIso={todayIso}
                                maxIso={maxIso}
                                onSelect={(iso) => { setDate(iso); setShowCal(false); }}
                              />
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* duration stepper (hourly / time-rate services) */}
                  {hourly && (() => {
                    const minDur = avail?.minMinutes ?? 30;
                    const maxDur = 8 * 60;
                    const setDur = (d: number) => { setDurationMin(Math.min(maxDur, Math.max(minDur, d))); setSlot(null); };
                    return (
                      <div className="mt-5">
                        <p className="mb-3 text-lg font-extrabold text-foreground">Davomiyligi</p>
                        <div className="inline-flex h-14 items-center gap-1 rounded-xl border border-border bg-card px-1">
                          <button
                            type="button"
                            onClick={() => setDur(durationMin - 30)}
                            disabled={durationMin <= minDur}
                            aria-label="Kamaytirish"
                            className="grid size-10 place-items-center rounded-lg text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-25"
                          >
                            <Minus size={18} />
                          </button>
                          <span className="min-w-[112px] text-center text-sm font-bold text-foreground tabular-nums">{dur(durationMin)}</span>
                          <button
                            type="button"
                            onClick={() => setDur(durationMin + 30)}
                            disabled={durationMin >= maxDur}
                            aria-label="Ko&apos;paytirish"
                            className="grid size-10 place-items-center rounded-lg text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-25"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="mt-6">
                    {availLoading && futureSlots.length === 0 ? (
                      // First load (no estimate yet) — generic white skeleton cards.
                      <div className="flex flex-col gap-2.5">
                        {Array.from({ length: skeletonCount }).map((_, i) => (
                          <div key={i} className="flex h-16 w-full items-center justify-between rounded-2xl border border-border bg-card px-5">
                            <span className="h-4 w-16 animate-pulse rounded-md bg-foreground/10" />
                            <ChevronRight size={18} className="text-muted-foreground/30" />
                          </div>
                        ))}
                      </div>
                    ) : futureSlots.length === 0 ? (
                      <div className="py-14 text-center">
                        <Clock size={28} className="mx-auto text-muted-foreground/40" />
                        <p className="mt-3 text-sm text-muted-foreground">Bu kunga bo&apos;sh vaqt yo&apos;q.</p>
                      </div>
                    ) : (
                      PERIODS.map((p) => {
                        const items = futureSlots.filter((s) => {
                          const h = Number(s.start.slice(0, 2));
                          return h >= p.from && h < p.to;
                        });
                        if (items.length === 0) return null;
                        return (
                          <div key={p.label} className="mb-6">
                            <p className="mb-3 text-lg font-extrabold text-foreground">{p.label}</p>
                            <div className="flex flex-col gap-2.5">
                              {items.map((s) => {
                                const on = slot === s.start;
                                // While refetching, keep the white card + period labels
                                // but skeletonise the time (it may have just been booked).
                                if (availLoading) {
                                  return (
                                    <div key={s.start} className="flex h-16 w-full items-center justify-between rounded-2xl border border-border bg-card px-5">
                                      <span className="h-4 w-16 animate-pulse rounded-md bg-foreground/10" />
                                      <ChevronRight size={18} className="text-muted-foreground/30" />
                                    </div>
                                  );
                                }
                                return (
                                  <motion.button
                                    key={s.start}
                                    type="button"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.22, delay: Math.min(futureSlots.indexOf(s) * 0.025, 0.6), ease: 'easeOut' }}
                                    onClick={() => { setSlot(s.start); setError(null); setShowConfirm(true); }}
                                    className={`flex h-16 w-full items-center justify-between rounded-2xl border px-5 text-base font-semibold transition-colors ${on ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-foreground hover:border-foreground/40'}`}
                                  >
                                    <span className="tabular-nums">{s.start}</span>
                                    <ChevronRight size={18} className={on ? 'text-background/70' : 'text-muted-foreground'} />
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {error && !showConfirm && <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{error}</p>}
            </motion.div>
          </AnimatePresence>
          </div>
        </div>

        {/* ===== RIGHT: live summary (desktop) ===== */}
        <aside className="hidden lg:order-2 lg:block lg:sticky lg:top-24">
          <motion.div layout className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            {/* business header */}
            <div className="flex items-start gap-3">
              {business.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={business.avatarUrl} alt={business.name} className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-border" />
              ) : (
                <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-foreground/5 text-xl font-black text-foreground ring-1 ring-border">
                  {business.name.trim().charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-lg font-bold leading-tight text-foreground">{business.name}</p>
                {business.category && (
                  <p className="mt-0.5 text-sm font-medium text-muted-foreground">{localized(business.category.name)}</p>
                )}
                {branch?.address && (
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{localized(branch.address)}</p>
                )}
              </div>
            </div>

            <div className="my-4 border-t border-border" />

            <SummaryBody
              selected={selected}
              currency={business.currency}
              staffName={selectedStaff?.name ?? null}
              staffIsAsset={resourcesAreAssets}
              when={slot && selDate ? `${selDate.day} ${selDate.mon} · ${slot}${hourly ? `–${addHm(slot, durationMin)}` : ''}` : null}
              totalMin={totalMin}
              totalPrice={totalPrice}
            />

            <PrimaryBtn className="mt-5" disabled={action.disabled} onClick={action.onClick}>
              <span className="inline-flex items-center gap-2">{action.label}<ArrowRight size={18} /></span>
            </PrimaryBtn>
          </motion.div>
        </aside>
      </div>

      {/* ===== Mobile bottom bar (summary fallback) ===== */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 p-4 backdrop-blur lg:hidden">
        {selected.length > 0 && (
          <div className="mb-2.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {selected.length} xizmat{totalMin ? ` · ${dur(totalMin)}` : ''}
            </span>
            <span className="text-base font-extrabold text-foreground">{money(totalPrice, business.currency)}</span>
          </div>
        )}
        <PrimaryBtn disabled={action.disabled} onClick={action.onClick}>
          <span className="inline-flex items-center gap-2">{action.label}<ArrowRight size={18} /></span>
        </PrimaryBtn>
      </div>

      {/* ===== Confirm / OTP modal (opens on slot select) ===== */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!busy) { setShowConfirm(false); setError(null); } }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[1px] sm:items-center sm:p-4"
          >
            <motion.div
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 28, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl sm:p-6"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-xl font-extrabold text-foreground">
                    {otpSent ? 'SMS kodni kiriting' : rescheduleId ? "O'zgarishlarni tasdiqlaysizmi?" : 'Bandlikni tasdiqlash'}
                  </h3>
                  {otpSent && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{rescheduleId ? maskedPhone : `+998 ${fmtPhone(phone)}`}</span> raqamiga 5 xonali kod yuborildi.
                    </p>
                  )}
                </div>
                <button type="button" onClick={() => { if (!busy) { setShowConfirm(false); setError(null); } }} aria-label="Yopish" className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5">
                  <X size={18} />
                </button>
              </div>

              {/* compact summary — hidden once we're entering the SMS code */}
              {!otpSent && (
                <div className="mb-5 space-y-2.5">
                  {modalWhen && (
                    <p className="flex items-center gap-2.5 text-[15px] font-semibold text-foreground">
                      <Clock size={18} className="shrink-0 text-muted-foreground" />
                      {modalWhen}
                    </p>
                  )}
                  <p className="flex items-center gap-2.5 text-[15px] font-bold text-foreground">
                    <Wallet size={18} className="shrink-0 text-muted-foreground" />
                    {money(totalPrice, business.currency)}
                  </p>
                </div>
              )}

              {/* New booking → phone entry (hidden for a remembered session or once the code is sent). */}
              {!rescheduleId && !otpSent && !sessionActive && (
                <>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Telefon raqamingiz</label>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex h-14 w-full min-w-0 items-center rounded-2xl bg-foreground/[0.04] px-4 focus-within:ring-2 focus-within:ring-inset focus-within:ring-foreground/20">
                      <Phone size={16} className="mr-2 shrink-0 text-muted-foreground" />
                      <span className="font-bold text-foreground/80">+998</span>
                      <input
                        autoFocus
                        value={fmtPhone(phone)}
                        onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 9)); setOtpSent(false); setCode(''); }}
                        inputMode="numeric"
                        placeholder="90 123 45 67"
                        className="ml-2 h-full w-full min-w-0 bg-transparent tabular-nums tracking-wide text-foreground outline-none"
                      />
                    </div>
                    {!otpSent && (
                      <button
                        type="button"
                        onClick={sendCode}
                        disabled={phone.length !== 9 || busy}
                        className="h-14 w-full shrink-0 whitespace-nowrap rounded-2xl bg-foreground px-5 text-sm font-bold text-background transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                      >
                        {busy ? 'Yuborilmoqda…' : 'Kod yuborish'}
                      </button>
                    )}
                  </div>
                </>
              )}


              <AnimatePresence>
                {otpSent && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                    {isNewCustomer && (
                      <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold text-foreground">Ismingiz</label>
                        <input
                          autoFocus
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ism"
                          className="h-14 w-full rounded-2xl bg-foreground/[0.04] px-4 text-foreground outline-none focus:ring-2 focus:ring-inset focus:ring-foreground/20"
                        />
                      </div>
                    )}

                    <div className={isNewCustomer ? 'mt-5' : ''}>
                      <OtpInput value={code} onChange={setCode} length={5} autoFocus={!isNewCustomer} />
                      <button
                        type="button"
                        onClick={sendCode}
                        disabled={busy || resendIn > 0}
                        className="mt-3 text-sm font-semibold text-accent disabled:text-muted-foreground"
                      >
                        {resendIn > 0 ? `Kodni qayta yuborish · 0:${pad2(resendIn)}` : 'Kodni qayta yuborish'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{error}</p>}

              <PrimaryBtn className="mt-5" disabled={confirmBtn.disabled} onClick={confirmBtn.onClick}>
                <span className="inline-flex items-center gap-2">{busy ? 'Yuborilmoqda…' : confirmBtn.label}<ArrowRight size={18} /></span>
              </PrimaryBtn>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryBody({
  selected,
  currency,
  staffName,
  staffIsAsset = false,
  when,
  totalMin,
  totalPrice,
}: {
  selected: PublicTenant['services'];
  currency: string;
  staffName: string | null;
  /** The picked resource is a place/unit (e.g. a lane), not a person. */
  staffIsAsset?: boolean;
  when: string | null;
  totalMin: number;
  totalPrice: number;
}) {
  return (
    <>
      <AnimatePresence initial={false} mode="wait">
        {selected.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="py-1 text-base text-muted-foreground"
          >
            Hali xizmat tanlanmagan.
          </motion.p>
        ) : (
          <motion.div key="list" layout>
            <AnimatePresence initial={false}>
              {selected.map((s) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3 pb-3.5">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Xizmat</p>
                      <p className="mt-0.5 text-base font-semibold text-foreground">{localized(s.name as LocalizedText)}</p>
                      {s.durationMinutes != null && <p className="mt-0.5 text-sm text-muted-foreground">{dur(s.durationMinutes)}</p>}
                    </div>
                    <span className="whitespace-nowrap text-base font-semibold text-foreground">
                      {priceLabel(s, currency)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {(staffName || when) && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              {staffName && <FieldRow label={staffIsAsset ? 'Joy' : 'Mutaxassis'} value={staffName} />}
              {when && <FieldRow label="Vaqt" value={when} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout className="mt-4 border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">Jami{totalMin ? ` · ${dur(totalMin)}` : ''}</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={totalPrice}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="text-3xl font-extrabold text-foreground"
          >
            {money(totalPrice, currency)}
          </motion.p>
        </AnimatePresence>
      </motion.div>
    </>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-13 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition-colors ${
        on ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-foreground hover:border-foreground/40'
      }`}
    >
      {children}
    </button>
  );
}

function DayPicker({
  value,
  todayIso,
  maxIso,
  onSelect,
}: {
  value: string;
  todayIso: string;
  maxIso: string;
  onSelect: (iso: string) => void;
}) {
  const v = isoParts(value);
  const [vy, setVy] = useState(Number(value.slice(0, 4)));
  const [vm, setVm] = useState(v.monIdx);
  const daysIn = new Date(Date.UTC(vy, vm + 1, 0)).getUTCDate();
  const firstWd = (new Date(Date.UTC(vy, vm, 1)).getUTCDay() + 6) % 7; // Monday-first
  const cells: (number | null)[] = [...Array(firstWd).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  const curMonth = `${vy}-${pad2(vm + 1)}`;
  const prevDisabled = curMonth <= todayIso.slice(0, 7);
  const nextDisabled = curMonth >= maxIso.slice(0, 7);
  const go = (delta: number) => {
    let m = vm + delta;
    let y = vy;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setVm(m);
    setVy(y);
  };
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" disabled={prevDisabled} onClick={() => go(-1)} aria-label="Oldingi oy" className="grid size-9 place-items-center rounded-full text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-25">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold text-foreground">{MONTHS_FULL[vm]} {vy}</span>
        <button type="button" disabled={nextDisabled} onClick={() => go(1)} aria-label="Keyingi oy" className="grid size-9 place-items-center rounded-full text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-25">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {WEEK.map((w) => (
          <span key={w} className="py-1 text-center text-[11px] font-semibold text-muted-foreground">{w}</span>
        ))}
        {cells.map((d, i) => {
          if (d == null) return <span key={`b${i}`} />;
          const iso = `${vy}-${pad2(vm + 1)}-${pad2(d)}`;
          const disabled = iso < todayIso || iso > maxIso;
          const sel = iso === value;
          return (
            <div key={iso} className="flex justify-center py-0.5">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(iso)}
                className={`grid size-10 place-items-center rounded-full text-sm font-semibold transition-colors ${
                  sel
                    ? 'bg-foreground text-background'
                    : disabled
                      ? 'text-muted-foreground/30'
                      : iso === todayIso
                        ? 'text-foreground ring-1 ring-border hover:bg-foreground/5'
                        : 'text-foreground hover:bg-foreground/5'
                }`}
              >
                {d}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** A labeled summary field — small muted label above a bold value (e.g. "Joy" / "Yo'lak 2"). */
function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

/**
 * Segmented OTP input — one box per digit. Handles sequential typing,
 * backspace (clear current, else step back), arrow keys, click-to-focus, and
 * paste/autofill (distributes digits across boxes). `value` is the compact code
 * string; `onChange` receives it as boxes fill left-to-right.
 */
function OtpInput({
  value,
  onChange,
  length = 5,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [slots, setSlots] = useState<string[]>(() => Array.from({ length }, (_, i) => value[i] ?? ''));
  // Mirror of `slots` for synchronous reads (focus handlers run before re-render).
  const slotsRef = useRef(slots);

  // The only editable box: the first empty one (or the last when full).
  const activeIndex = () => {
    const i = slotsRef.current.findIndex((s) => !s);
    return i === -1 ? length - 1 : i;
  };
  const focusActive = () => refs.current[activeIndex()]?.focus();

  const commit = (next: string[]) => {
    slotsRef.current = next;
    setSlots(next);
    onChange(next.join(''));
  };

  // External reset (e.g. resend clears the code) → clear the boxes.
  useEffect(() => {
    if (value === '') commit(Array.from({ length }, () => ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, length]);

  useEffect(() => {
    if (autoFocus) focusActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  // Write digits starting at `from`, then focus the next empty box.
  const fill = (from: number, raw: string) => {
    const ds = raw.replace(/\D/g, '');
    if (!ds) return;
    const next = [...slots];
    let k = from;
    for (const ch of ds) {
      if (k >= length) break;
      next[k] = ch;
      k++;
    }
    commit(next);
    refs.current[Math.min(k, length - 1)]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...slots];
      if (next[i]) {
        next[i] = '';
        commit(next);
        refs.current[i]?.focus();
      } else if (i > 0) {
        next[i - 1] = '';
        commit(next);
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault();
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      e.preventDefault();
      refs.current[i + 1]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={slots[i] ?? ''}
          onChange={(e) => fill(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={(e) => { e.preventDefault(); fill(0, e.clipboardData.getData('text')); }}
          // Only the active (first-empty) box is editable — clicking any other
          // box redirects focus there instead of focusing the clicked one.
          onMouseDown={(e) => { if (i !== activeIndex()) { e.preventDefault(); focusActive(); } }}
          onFocus={(e) => { if (i !== activeIndex()) { focusActive(); return; } e.currentTarget.select(); }}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Kod ${i + 1}`}
          className="h-14 w-full min-w-0 rounded-2xl bg-foreground/[0.04] text-center text-2xl font-bold tabular-nums text-foreground outline-none transition-shadow focus:ring-2 focus:ring-inset focus:ring-foreground/30"
        />
      ))}
    </div>
  );
}

function PrimaryBtn({
  disabled,
  onClick,
  children,
  className = '',
}: {
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-14 w-full items-center justify-center rounded-full bg-foreground text-base font-bold text-background shadow-lg transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-40 disabled:shadow-none ${className}`}
    >
      {children}
    </button>
  );
}
