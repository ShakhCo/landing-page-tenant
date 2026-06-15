'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, Check, Clock, Calendar, Phone, Minus, Plus, X, ArrowRight } from 'lucide-react';
import { localized, mediaUrl, type LocalizedText, type PublicTenant, type AvailabilityResult, type TenantLocale } from '@/lib/tenant';
import type { BookingDict } from '@/lib/dictionaries/booking';
import { getAvailabilityAction, requestOtpAction, requestRescheduleOtpAction, createBookingAction } from './actions';
import { OtpInput } from './OtpInput';
import { ServiceMonogram } from '../ServiceMonogram';

type Step = 'services' | 'staff' | 'time' | 'confirm' | 'done';
const FLOW: Step[] = ['services', 'staff', 'time', 'confirm'];
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
const PERIOD_RANGES = [
  { from: 0, to: 12 },
  { from: 12, to: 18 },
  { from: 18, to: 24 },
];

function money(amount: number, currency: string, dict: BookingDict) {
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
function dur(min: number, dict: BookingDict) {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? (m ? `${h} ${dict.durHour} ${m} ${dict.durMin}` : `${h} ${dict.durHour}`) : `${m} ${dict.durMin}`;
}
function isUnitService(s: { pricingMode: string }) {
  return s.pricingMode === 'time_rate';
}
/** Per-service price label: hourly rate for a unit/time-rate service, flat price for fixed. */
function priceLabel(
  s: { pricingMode: string; ratePerHour: number | null; price: number | null },
  currency: string,
  dict: BookingDict,
) {
  return s.pricingMode === 'time_rate'
    ? s.ratePerHour != null ? `${money(s.ratePerHour, currency, dict)}${dict.perHour}` : ''
    : s.price != null ? money(s.price, currency, dict) : '';
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
function nextDates(tz: string, dict: BookingDict, n = 14) {
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
  const base = new Date(`${todayStr}T00:00:00Z`);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(base.getTime() + i * 86_400_000);
    return { iso: d.toISOString().slice(0, 10), day: d.getUTCDate(), wd: dict.weekdaysSun[d.getUTCDay()], mon: dict.monthsShort[d.getUTCMonth()] };
  });
}

/** True at >= lg (1024px) — confirm shows as a modal on desktop, inline on mobile. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return isDesktop;
}

export function BookingFlow({
  tenant,
  subdomain,
  dict,
  locale,
  initialServiceIds,
  rescheduleId,
  initialDuration,
  initialStaffId,
  scopedStaffId,
  hasSession = false,
}: {
  tenant: PublicTenant;
  subdomain: string;
  dict: BookingDict;
  locale: TenantLocale;
  /** Preselected services (full ids, already validated against this tenant by the page). */
  initialServiceIds?: string[];
  rescheduleId?: string;
  initialDuration?: number;
  /** Reschedule: the original booking's resource — preselected so only the time is re-picked. */
  initialStaffId?: string;
  /** Staff-scoped entry (a specialist's "Bron"): lock the flow to this resource —
   *  offer only their services and skip the staff-pick step. */
  scopedStaffId?: string;
  hasSession?: boolean;
}) {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  // Desktop shows confirm as a modal overlay WITHOUT advancing the step, so the
  // time step stays mounted behind it (no availability refetch when it closes).
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { business } = tenant;
  const branches = tenant.branches ?? [];
  const services = tenant.services ?? [];
  const staff = tenant.staff ?? [];
  const branch = branches[0];
  const tz = branch?.timezone ?? 'Asia/Tashkent';
  const dates = nextDates(tz, dict);

  // Staff-scoped entry: the customer tapped a specific specialist's "Bron" on
  // the tenant page. Lock the flow to that resource — offer only the services
  // they perform and drop the staff-pick step from the journey.
  const scopedStaff = scopedStaffId ? staff.find((st) => st.id === scopedStaffId) ?? null : null;
  const offerServices = scopedStaff
    ? services.filter((s) => scopedStaff.offeringIds.includes(s.id))
    : services;
  const flowSteps = scopedStaff ? FLOW.filter((s) => s !== 'staff') : FLOW;

  // Skip the services step and go straight to the resource/time picker when:
  //  - the business has exactly one service, OR
  //  - the entry service (?service=…) is a unit (time-rate) — units are exclusive,
  //    so the user should pick a unit next, not browse other services, OR
  //  - the entry service is fixed-price but every OTHER service is a unit —
  //    units can't be co-selected with it, so the list offers no real choice.
  const onlyService = offerServices.length === 1 ? offerServices[0] : null;
  // Sanitize the preselection: a unit (time-rate) service is exclusive, so if
  // one sneaks into a multi-select URL it wins alone.
  const initIds = (() => {
    const valid = (initialServiceIds ?? []).filter((id) => services.some((s) => s.id === id));
    const unit = valid.find((id) => {
      const s = services.find((x) => x.id === id);
      return s ? isUnitService(s) : false;
    });
    return unit ? [unit] : valid;
  })();
  const initService = initIds.length === 1 ? services.find((s) => s.id === initIds[0]) ?? null : null;
  const initSkip =
    initService && (isUnitService(initService) || offerServices.every((s) => s.id === initService.id || isUnitService(s)))
      ? initService
      : null;
  const skipService = onlyService ?? initSkip;
  const skipEligible = skipService ? staff.filter((st) => st.offeringIds.includes(skipService.id)) : [];
  // The pre-locked resource: the scoped specialist (staff "Bron"), or — on a
  // reschedule — the original booking's resource if it still serves the service.
  const initStaff =
    scopedStaff ??
    (initialStaffId && skipService ? skipEligible.find((st) => st.id === initialStaffId) ?? null : null);

  const [step, setStep] = useState<Step>(() => {
    if (!skipService) return 'services';
    if (skipEligible.length === 1 || initStaff) return 'time';
    if (skipEligible.length > 1) return 'staff';
    return 'services'; // no eligible resource → keep on services
  });
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    skipService ? [skipService.id] : initIds,
  );
  const [staffId, setStaffId] = useState<string | null>(
    initStaff ? initStaff.id : skipService && skipEligible.length === 1 ? skipEligible[0].id : null,
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
  const [showStaff, setShowStaff] = useState(false); // time-step specialist switcher
  const [durationMin, setDurationMin] = useState(initialDuration && initialDuration > 0 ? initialDuration : 60);
  // Reschedule: masked phone of the original booking ("••• •• 40 20") for the OTP step.
  const [maskedPhone, setMaskedPhone] = useState('');
  // Remembered customer (cookie) → one-tap, no phone/OTP. Flips off if the
  // session turns out to be expired when we try to book.
  const [sessionActive, setSessionActive] = useState(hasSession);
  // Seconds left before the customer can request a new OTP (60s cooldown).
  const [resendIn, setResendIn] = useState(0);

  // Category filter for the services step (mirrors the landing page pills).
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const cats = Array.from(new Set(offerServices.map((s) => localized(s.category as LocalizedText | null, dict.otherCategory, locale))));
  const filteredServices = activeCat
    ? offerServices.filter((s) => localized(s.category as LocalizedText | null, dict.otherCategory, locale) === activeCat)
    : offerServices;
  // Services preselected via the URL float to the top — fixed at load time
  // (a reload shows your picks first), NOT re-sorted as you toggle live.
  const shownServices =
    initIds.length > 0
      ? [...filteredServices].sort((a, b) => Number(initIds.includes(b.id)) - Number(initIds.includes(a.id)))
      : filteredServices;

  const selected = services.filter((s) => selectedIds.includes(s.id));
  const hourly = selected.some(isUnitService); // time-rate (unit or staff) booking
  const eligibleStaff = staff.filter((st) => selectedIds.every((id) => st.offeringIds.includes(id)));
  const resourcesAreAssets = eligibleStaff.length > 0 && eligibleStaff.every((r) => r.type === 'asset');
  const selectedStaff = staff.find((st) => st.id === staffId) ?? null;
  // Specialists (not assets) who can do the selected service(s) — the options
  // for the time-step specialist switcher.
  const eligibleSpecialists = eligibleStaff.filter((st) => st.type !== 'asset');
  // Field/step label for the resource: a unit service's own localized label
  // ("Yo'laklar", "Stollar") when set, else generic "Joy"; staff → "Mutaxassis".
  const unitSvc = selected.find(isUnitService);
  const resourceLabel = resourcesAreAssets
    ? unitSvc?.unitLabel
      ? localized(unitSvc.unitLabel, '', locale)
      : dict.resourceUnit
    : dict.resourceStaff;

  const availRes = avail?.resources?.find((r) => r.resourceId === staffId) ?? avail?.resources?.[0];
  const ratePerHour = hourly ? (availRes?.ratePerHour ?? selected[0]?.ratePerHour ?? 0) : 0;

  const totalPrice = hourly
    ? Math.round((ratePerHour * durationMin) / 60)
    : selected.reduce((s, x) => s + (x.price ?? 0), 0);
  const totalMin = hourly ? durationMin : selected.reduce((s, x) => s + (x.durationMinutes ?? 0), 0);
  // Hourly: the duration stepper lives on the time step — before the user has
  // seen it, summaries show the rate ("…/soat"), not a presumed 1-hour total.
  const durationKnown = !hourly || step === 'time' || step === 'confirm' || step === 'done';
  const summaryPrice = durationKnown
    ? money(totalPrice, business.currency, dict)
    : `${money(ratePerHour, business.currency, dict)}${dict.perHour}`;

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
  const selDate = selP ? { day: selP.day, mon: dict.monthsShort[selP.monIdx] } : null;
  // "Bugun, 16:00 dan 19:30 gacha" — relative day + chosen time range, for the confirm modal.

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

  // Open confirm: a modal on desktop (step stays where it is), inline step on mobile.
  // The live summary card IS the recap, so there's no intermediate confirm view:
  //  - remembered customer → "Bron qilish"/"O'zgartirish" acts straight from the time step;
  //  - reschedule without a session → the OTP is sent first, and the code entry
  //    opens only once it actually went out (a failure surfaces on the time step).
  const openConfirm = () => {
    setError(null);
    if (sessionActive) {
      void confirm();
      return;
    }
    if (rescheduleId && !otpSent) {
      void sendCode().then((ok) => {
        if (!ok) return;
        if (isDesktop) setConfirmOpen(true);
        else setStep('confirm');
      });
      return;
    }
    if (isDesktop) setConfirmOpen(true);
    else setStep('confirm');
  };
  const closeConfirm = () => {
    setError(null);
    setConfirmOpen(false);
  };

  const back = () => {
    if (busy) return;
    setError(null);
    if (step === 'confirm') setStep('time');
    else if (step === 'staff') setStep('services');
    else if (step === 'time') setStep(!scopedStaff && eligibleStaff.length > 1 ? 'staff' : 'services');
    else router.push('/');
  };
  const advance = (ids: string[] = selectedIds) => {
    setError(null);
    if (ids.length === 0) return;
    // Staff-scoped: the resource is already fixed — skip the staff step.
    if (scopedStaff) {
      setStaffId(scopedStaff.id);
      setStep('time');
      return;
    }
    const elig = staff.filter((st) => ids.every((id) => st.offeringIds.includes(id)));
    if (elig.length === 0) {
      setError(dict.errMultiStaff);
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
  /** Sends the OTP; resolves true when it actually went out. */
  const sendCode = async (): Promise<boolean> => {
    if (busy) return false;
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
        return true;
      }
      setError(r.error);
      return false;
    }
    if (phone.length !== 9) return false;
    setError(null);
    setBusy(true);
    const r = await requestOtpAction(`+998${phone}`);
    setBusy(false);
    if (r.ok) {
      setIsNewCustomer(r.isNewCustomer);
      setOtpSent(true);
      setResendIn(60);
      return true;
    }
    setError(r.error);
    return false;
  };

  // Each step starts at the top (the time step's slot list can be very long).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // Mirror the selection into the URL (short 8-char id prefixes) so a reload —
  // or a shared link — restores it. replaceState keeps it shallow: no
  // navigation, no server roundtrip, and no history spam while toggling.
  useEffect(() => {
    const qs = new URLSearchParams();
    if (selectedIds.length > 0) qs.set('services', selectedIds.map((id) => id.slice(0, 8)).join(','));
    // Keep the staff scope on the URL so a reload stays locked to this specialist
    // — and reflects a switch made via the time-step dropdown.
    if (scopedStaff && staffId) qs.set('staff', staffId.slice(0, 8));
    if (rescheduleId) qs.set('reschedule', rescheduleId);
    const q = qs.toString();
    window.history.replaceState(window.history.state, '', q ? `/booking?${q}` : '/booking');
  }, [selectedIds, rescheduleId, scopedStaff, staffId]);

  // Lock background scroll while the desktop confirm modal is open.
  useEffect(() => {
    if (!confirmOpen || !isDesktop) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [confirmOpen, isDesktop]);

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
      router.push(`/b/${r.id.slice(0, 8)}?created=1`);
      return; // keep `busy` while the page navigates
    }
    setBusy(false);
    // Session expired → drop one-tap and fall back to the OTP flow. The direct
    // book path never opened the confirm UI, so open it once the OTP is on its way.
    if (r.needsOtp) {
      setSessionActive(false);
      if (rescheduleId) {
        // OTP goes to the original booking's phone; show the code entry when sent.
        void sendCode().then((ok) => {
          if (!ok) return;
          if (isDesktop) setConfirmOpen(true);
          else setStep('confirm');
        });
      } else if (isDesktop) setConfirmOpen(true);
      else setStep('confirm');
      return;
    }
    // Code locked after too many wrong guesses → wipe it and let them request a
    // fresh one immediately (the old code is dead server-side anyway).
    if (r.otpExhausted) {
      setCode('');
      setResendIn(0);
    }
    setError(r.error);
  };

  // ---- success ----
  if (step === 'done') {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-card px-6">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          className="grid size-24 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
        >
          <Check size={48} strokeWidth={3} />
        </motion.div>
        <h1 className="mt-7 text-2xl font-extrabold text-foreground">{dict.doneTitle}</h1>
        <p className="mt-1.5 text-center text-muted-foreground">{dict.doneSubtitle}</p>
        <div className="mt-7 w-full rounded-2xl border border-foreground/12 bg-card p-5 shadow-xs shadow-black/5">
          <div className="space-y-3">
            <FieldRow label={resourceLabel} value={selectedStaff?.name ?? '—'} />
            <FieldRow label={dict.fieldTime} value={`${selDate?.day} ${selDate?.mon} · ${slot}`} />
          </div>
          <div className="mt-3 border-t border-border pt-3">
            {selected.map((s) => (
              <div key={s.id} className="flex justify-between py-0.5 text-sm">
                <span className="text-muted-foreground">{localized(s.name as LocalizedText, '', locale)}</span>
                <span className="font-medium text-foreground">{priceLabel(s, business.currency, dict)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
              <span>{dict.total}</span>
              <span>{money(totalPrice, business.currency, dict)}</span>
            </div>
          </div>
        </div>
        <PrimaryBtn onClick={() => router.push('/')} className="mt-6">
          {dict.ready}
        </PrimaryBtn>
      </div>
    );
  }

  const stepShort = (s: Step) =>
    s === 'services' ? dict.shortServices
    : s === 'staff' ? resourceLabel
    : s === 'time' ? dict.shortTime
    : dict.shortConfirm;
  // Where the back button leads — mirrors back()'s routing exactly.
  const backLabel =
    step === 'confirm' ? stepShort('time')
    : step === 'staff' ? stepShort('services')
    : step === 'time' ? (!scopedStaff && eligibleStaff.length > 1 ? stepShort('staff') : stepShort('services'))
    : business.name;
  const chooseLabel = (label: string) => `${dict.choosePrefix}${label}${dict.chooseSuffix}`;
  const stepBigTitle: Record<Step, string> = {
    services: dict.stepServices,
    staff: chooseLabel(resourceLabel),
    time: dict.stepTime,
    confirm: dict.stepConfirm,
    done: '',
  };
  const bigTitle =
    step === 'confirm'
      ? otpSent ? dict.titleSmsCode : rescheduleId ? dict.titleConfirmChanges : dict.stepConfirm
    : step === 'staff' && resourcesAreAssets ? chooseLabel(resourceLabel)
    : step === 'time' && rescheduleId ? dict.titleNewDateTime
    : stepBigTitle[step];

  // Context-aware primary action (drives both the desktop summary and mobile bar)
  const action =
    step === 'services'
      ? { label: selected.length > 0 ? dict.actContinue : dict.actChooseServices, disabled: selected.length === 0, onClick: goFromServices }
      : step === 'staff'
        ? { label: staffId ? dict.actContinue : chooseLabel(resourceLabel), disabled: !staffId, onClick: () => { setError(null); setStep('time'); } }
        : {
            label: busy
              ? rescheduleId
                ? sessionActive ? dict.actUpdating : dict.actSending
                : dict.actBooking
              : !slot
                ? dict.actPickTime
                : rescheduleId
                  ? dict.actChange
                  : sessionActive
                    ? dict.actBook
                    : dict.actConfirmBooking,
            disabled: !slot || busy,
            onClick: () => { if (slot) openConfirm(); },
          };

  // Confirm step's primary button:
  //  - remembered session → one tap, no OTP;
  //  - reschedule (no session) → confirm the time first ("Davom etish" sends OTP);
  //  - new (no session) → confirm after the phone + OTP.
  const confirmBtn = sessionActive
    ? { label: rescheduleId ? dict.actChangeTime : dict.actBook, disabled: busy, onClick: confirm }
    : rescheduleId && !otpSent
      ? { label: dict.actContinue, disabled: busy, onClick: sendCode }
      : {
          label: rescheduleId ? dict.actChangeTime : dict.actBook,
          disabled: !otpSent || code.length < 5 || busy || (isNewCustomer && !name.trim()),
          onClick: confirm,
        };

  // Confirm body — rendered inline on mobile, or inside the desktop modal below.
  const confirmContent = (
    <>
      {otpSent && (
        <p className="-mt-2 mb-6 text-sm text-muted-foreground">
          {dict.codeSentPre}<span className="font-semibold text-foreground">{rescheduleId ? maskedPhone : `+998 ${fmtPhone(phone)}`}</span>{dict.codeSentPost}
        </p>
      )}

      {/* No recap here — the live summary card is the recap; every path lands
          straight on its action (phone entry, OTP code, or one-tap). */}

      {/* New booking → phone entry (hidden for a remembered session or once the code is sent). */}
      {!rescheduleId && !otpSent && !sessionActive && (
        <>
          {!isDesktop && <label className="mb-3 block text-lg font-bold text-foreground">{dict.phoneLabel}</label>}
          <div className="flex flex-col gap-4">
            <div className="flex h-14 w-full min-w-0 items-center rounded-full border border-border bg-card px-5 transition-colors duration-200 focus-within:border-foreground">
              <Phone size={16} className="mr-2 shrink-0 text-muted-foreground" />
              <span className="font-bold text-foreground/80">+998</span>
              <input
                autoFocus
                value={fmtPhone(phone)}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 9)); setOtpSent(false); setCode(''); }}
                inputMode="numeric"
                placeholder={dict.phonePlaceholder}
                className="ml-2 h-full w-full min-w-0 bg-transparent tabular-nums tracking-wide text-foreground outline-none"
              />
            </div>
            <button
              type="button"
              onClick={sendCode}
              disabled={phone.length !== 9 || busy}
              className="h-14 w-full shrink-0 whitespace-nowrap rounded-full bg-foreground px-5 text-sm font-bold text-background shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
            >
              {busy ? dict.actSending : dict.sendCode}
            </button>
          </div>
        </>
      )}

      <AnimatePresence>
        {otpSent && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
            {isNewCustomer && (
              <div>
                <label className="mb-3 block text-lg font-bold text-foreground">{dict.nameLabel}</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={dict.namePlaceholder}
                  className="h-14 w-full rounded-full border border-border bg-card px-5 text-foreground outline-none transition-colors duration-200 focus:border-foreground"
                />
              </div>
            )}

            <div className={isNewCustomer ? 'mt-5' : ''}>
              <OtpInput value={code} onChange={(v) => { setCode(v); if (error) setError(null); }} length={5} autoFocus={!isNewCustomer} />
              <button
                type="button"
                onClick={sendCode}
                disabled={busy || resendIn > 0}
                className="mt-3 text-sm font-semibold text-foreground underline underline-offset-4 disabled:no-underline disabled:text-muted-foreground"
              >
                {resendIn > 0 ? `${dict.resendCode} · 0:${pad2(resendIn)}` : dict.resendCode}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {error && (
          <motion.div
            key="confirm-error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* One action at a time: the new-booking phone stage uses the inline
          "Kod yuborish" above; the bottom button appears only once it's the
          real action (after OTP, or the session/reschedule flows). */}
      {(otpSent || sessionActive || rescheduleId) && (
        <PrimaryBtn className="mt-6" disabled={confirmBtn.disabled} onClick={confirmBtn.onClick}>
          <span className="inline-flex items-center gap-2">{busy ? (rescheduleId ? dict.actUpdating : dict.actBooking) : confirmBtn.label}<ArrowRight size={18} /></span>
        </PrimaryBtn>
      )}

      {/* Wrong number? Go back to phone entry (new-booking OTP stage only —
          a reschedule's phone comes from the original booking). */}
      {otpSent && !rescheduleId && (
        <button
          type="button"
          disabled={busy}
          onClick={() => { setOtpSent(false); setCode(''); setError(null); setResendIn(0); }}
          className="mt-3 h-12 w-full rounded-full text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:bg-foreground/5 disabled:opacity-40"
        >
          {dict.changePhone}
        </button>
      )}
    </>
  );

  return (
    <div className="mx-auto min-h-screen max-w-[1300px] px-4 pb-32 lg:pb-12">
      {/* Top chrome: back + close */}
      <div className="flex items-center justify-between py-4">
        <button
          type="button"
          onClick={back}
          aria-label={dict.ariaBack}
          className="flex h-11 max-w-[60vw] items-center gap-1 rounded-full border border-border bg-card pl-2.5 pr-4 text-foreground shadow-xs shadow-black/5 transition-colors duration-200 hover:bg-foreground/5"
        >
          <ChevronLeft size={20} className="shrink-0" />
          <span className="truncate text-sm font-semibold">{backLabel}</span>
        </button>
        <button type="button" onClick={() => router.push('/')} aria-label={dict.ariaClose} className="grid size-11 place-items-center rounded-full border border-border bg-card text-foreground shadow-xs shadow-black/5 transition-colors duration-200 hover:bg-foreground/5">
          <X size={20} />
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_420px] lg:items-start lg:gap-20">
        {/* ===== LEFT: breadcrumb + title + choices ===== */}
        <div className="min-w-0 lg:order-1">
          {/* breadcrumb stepper — click a reached step to jump back to it */}
          <nav className="scrollbar-hide flex items-center gap-x-1.5 overflow-x-auto whitespace-nowrap text-sm">
            {flowSteps.map((s, i) => {
              // Reachable once every step before it is satisfied (so completing the
              // current step unlocks the next breadcrumb item).
              const reached = s === step || flowSteps.slice(0, i).every((ps) =>
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
                <div>
                  {cats.length > 1 && (
                    <div className="scrollbar-hide -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
                      <CatPill active={activeCat === null} onClick={() => setActiveCat(null)}>{dict.all}</CatPill>
                      {cats.map((c) => (
                        <CatPill key={c} active={activeCat === c} onClick={() => setActiveCat(c)}>{c}</CatPill>
                      ))}
                    </div>
                  )}
                  {/* Photo-led cards in a 2-col grid; services without a photo
                      get a tinted monogram tile so the grid stays uniform. */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {shownServices.map((s, i) => {
                      const on = selectedIds.includes(s.id);
                      const sName = localized(s.name as LocalizedText, '', locale);
                      const price = priceLabel(s, business.currency, dict);
                      // A unit (time-rate) selection is exclusive — other services can't be
                      // added, only switched to — so it gets "Tanlash", addable fixed
                      // services get "Qo'shish", and a selected one shows "Tanlandi".
                      const canAdd = !isUnitService(s) && !hourly;
                      const actionBtn = (
                        <span className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-border py-2.5 text-center text-sm font-bold text-foreground transition-colors duration-200 group-hover:bg-foreground/5">
                          {on ? <Check size={15} strokeWidth={3} /> : canAdd ? <Plus size={15} /> : null}
                          {on ? dict.selectedLabel : canAdd ? dict.add : dict.choose}
                          {!on && !canAdd && <ChevronRight size={15} />}
                        </span>
                      );
                      return (
                        <motion.button
                          key={s.id}
                          type="button"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4), ease: 'easeOut' }}
                          onClick={() => toggleService(s.id)}
                          className="group relative overflow-hidden rounded-2xl border border-foreground/12 bg-card text-left shadow-xs shadow-black/5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5"
                        >
                          {on && (
                            <span className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-foreground text-background shadow-md ring-2 ring-white">
                              <Check size={16} strokeWidth={3} />
                            </span>
                          )}
                          {s.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={mediaUrl(s.photoUrl)} alt={sName} className="aspect-[16/10] w-full object-cover" loading="lazy" />
                          ) : (
                            <ServiceMonogram />
                          )}
                          <div className="p-4">
                            <h3 className="truncate font-semibold text-foreground">{sName}</h3>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              {price && <span className="font-bold text-foreground">{price}</span>}
                              {s.durationMinutes != null && (
                                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock size={14} />
                                  {dur(s.durationMinutes, dict)}
                                </span>
                              )}
                            </div>
                            {actionBtn}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
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
                        className={`flex items-center gap-3.5 rounded-2xl border bg-card p-4 text-left shadow-xs shadow-black/5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5 ${
                          on ? 'border-foreground' : 'border-foreground/12'
                        }`}
                      >
                        {st.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={mediaUrl(st.photoUrl)} alt={st.name} className="size-12 shrink-0 rounded-full object-cover ring-1 ring-border" />
                        ) : (
                          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-900 text-sm font-semibold text-white">
                            {initials(st.name)}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-foreground">{st.name}</span>
                          {st.type !== 'asset' && (st.bookingsCount ?? 0) > 0 && (
                            <span className="mt-0.5 block text-sm text-muted-foreground">{st.bookingsCount} {dict.bookings}</span>
                          )}
                        </span>
                        <span
                          className={`ml-auto flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition-colors duration-200 ${
                            on ? 'border-foreground bg-foreground text-background' : 'border-border text-foreground'
                          }`}
                        >
                          {on && <Check size={15} strokeWidth={3} />}
                          {on ? dict.selectedLabel : dict.choose}
                          {!on && <ChevronRight size={15} />}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* ---- time ---- */}
              {step === 'time' && (
                <div>
                  {/* quick chips + calendar field — the picker drops below the whole
                      row (anchoring it to the narrow icon button overflows the screen) */}
                  <div className="relative flex flex-wrap items-center gap-2">
                    <Chip on={date === todayIso} onClick={() => setDate(todayIso)}>{dict.today}</Chip>
                    <Chip on={date === tomorrowIso} onClick={() => setDate(tomorrowIso)}>{dict.tomorrow}</Chip>
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowCal((v) => !v)}
                        aria-label={dict.ariaPickDate}
                        className={`flex h-12 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors duration-200 ${
                          date !== todayIso && date !== tomorrowIso
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border bg-card text-foreground hover:bg-foreground/5'
                        }`}
                      >
                        <Calendar size={18} className={date !== todayIso && date !== tomorrowIso ? '' : 'text-muted-foreground'} />
                        {date !== todayIso && date !== tomorrowIso && selP && (
                          <span>{selP.day}-{dict.monthsShort[selP.monIdx]}</span>
                        )}
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
                              className="absolute left-0 top-full z-30 mt-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-foreground/12 bg-card p-4 shadow-xl shadow-black/10"
                            >
                              <DayPicker
                                value={date}
                                todayIso={todayIso}
                                maxIso={maxIso}
                                dict={dict}
                                onSelect={(iso) => { setDate(iso); setShowCal(false); }}
                              />
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* The specialist you're booking with — pinned to the right of
                        the date row, styled like the top back pill. A chevron +
                        dropdown lets the customer switch specialist when more than
                        one can do the chosen service (picking one refetches slots). */}
                    {selectedStaff && selectedStaff.type !== 'asset' && (
                      eligibleSpecialists.length > 1 ? (
                        <div className="relative hidden sm:ml-auto sm:block">
                          <button
                            type="button"
                            onClick={() => setShowStaff((v) => !v)}
                            aria-label={selectedStaff.name}
                            className="flex h-12 max-w-[55vw] items-center gap-2 rounded-full border border-border bg-card py-1 pl-1.5 pr-3 text-foreground shadow-xs shadow-black/5 transition-colors duration-200 hover:bg-foreground/5"
                          >
                            <StaffAvatar st={selectedStaff} />
                            <span className="truncate text-sm font-semibold">{selectedStaff.name}</span>
                            <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition-transform duration-200 ${showStaff ? 'rotate-180' : ''}`} />
                          </button>
                          <AnimatePresence>
                            {showStaff && (
                              <>
                                <div className="fixed inset-0 z-20" onClick={() => setShowStaff(false)} />
                                <motion.div
                                  initial={{ opacity: 0, y: -6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -6 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute left-0 top-full z-30 mt-2 w-[260px] max-w-[calc(100vw-2rem)] rounded-2xl border border-foreground/12 bg-card p-1.5 shadow-xl shadow-black/10 sm:left-auto sm:right-0"
                                >
                                  {eligibleSpecialists.map((st) => (
                                    <button
                                      key={st.id}
                                      type="button"
                                      onClick={() => { setStaffId(st.id); setShowStaff(false); }}
                                      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-150 hover:bg-foreground/5"
                                    >
                                      <StaffAvatar st={st} className="size-9" />
                                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{st.name}</span>
                                      {st.id === staffId && <Check size={16} strokeWidth={3} className="shrink-0 text-foreground" />}
                                    </button>
                                  ))}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="hidden h-12 max-w-[55vw] items-center gap-2 rounded-full border border-border bg-card py-1 pl-1.5 pr-4 text-foreground shadow-xs shadow-black/5 sm:ml-auto sm:flex">
                          <StaffAvatar st={selectedStaff} />
                          <span className="truncate text-sm font-semibold">{selectedStaff.name}</span>
                        </div>
                      )
                    )}
                  </div>

                  {/* duration stepper (hourly / time-rate services) */}
                  {hourly && (() => {
                    const minDur = avail?.minMinutes ?? 30;
                    const maxDur = 8 * 60;
                    const setDur = (d: number) => { setDurationMin(Math.min(maxDur, Math.max(minDur, d))); setSlot(null); };
                    return (
                      <div className="mt-5">
                        <p className="mb-3 text-lg font-bold text-foreground">{dict.duration}</p>
                        <div className="inline-flex h-13 items-center gap-1 rounded-full border border-border bg-card px-1.5">
                          <button
                            type="button"
                            onClick={() => setDur(durationMin - 30)}
                            disabled={durationMin <= minDur}
                            aria-label={dict.ariaDecrease}
                            className="grid size-10 place-items-center rounded-full text-foreground transition-colors duration-200 hover:bg-foreground/5 disabled:opacity-25"
                          >
                            <Minus size={18} />
                          </button>
                          <span className="min-w-[112px] text-center text-sm font-bold text-foreground tabular-nums">{dur(durationMin, dict)}</span>
                          <button
                            type="button"
                            onClick={() => setDur(durationMin + 30)}
                            disabled={durationMin >= maxDur}
                            aria-label={dict.ariaIncrease}
                            className="grid size-10 place-items-center rounded-full text-foreground transition-colors duration-200 hover:bg-foreground/5 disabled:opacity-25"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="mt-6">
                    {availLoading && futureSlots.length === 0 ? (
                      // First load (no estimate yet) — generic skeleton chips.
                      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                        {Array.from({ length: skeletonCount }).map((_, i) => (
                          <div key={i} className="h-12 animate-pulse rounded-full border border-foreground/12 bg-foreground/5" />
                        ))}
                      </div>
                    ) : futureSlots.length === 0 ? (
                      <div className="rounded-2xl border border-foreground/12 bg-card py-14 text-center shadow-xs shadow-black/5">
                        <Clock size={28} className="mx-auto text-muted-foreground/40" />
                        <p className="mt-3 text-sm text-muted-foreground">{dict.noSlots}</p>
                      </div>
                    ) : (
                      PERIOD_RANGES.map((p, pi) => {
                        const periodLabel = dict.periods[pi];
                        const items = futureSlots.filter((s) => {
                          const h = Number(s.start.slice(0, 2));
                          return h >= p.from && h < p.to;
                        });
                        if (items.length === 0) return null;
                        return (
                          <div key={periodLabel} className="mb-6">
                            <p className="mb-3 text-lg font-bold text-foreground">{periodLabel}</p>
                            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                              {items.map((s) => {
                                const on = slot === s.start;
                                // While refetching, keep the grid + period labels but
                                // skeletonise the chips (a slot may have just been booked).
                                if (availLoading) {
                                  return <div key={s.start} className="h-12 animate-pulse rounded-full border border-foreground/12 bg-foreground/5" />;
                                }
                                return (
                                  <motion.button
                                    key={s.start}
                                    type="button"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.22, delay: Math.min(futureSlots.indexOf(s) * 0.015, 0.45), ease: 'easeOut' }}
                                    onClick={() => setSlot(s.start)}
                                    className={`flex h-12 items-center justify-center rounded-full border text-sm font-semibold tabular-nums transition-colors duration-200 ${
                                      on
                                        ? 'border-foreground bg-foreground text-background'
                                        : 'border-border bg-card text-foreground hover:bg-foreground/5'
                                    }`}
                                  >
                                    {s.start}
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

              {/* ---- confirm — inline on mobile; on desktop it renders as the modal below ---- */}
              {step === 'confirm' && !isDesktop && (
                <div className="max-w-md">{confirmContent}</div>
              )}

              <AnimatePresence initial={false}>
                {error && step !== 'confirm' && !confirmOpen && (
                  <motion.div
                    key="flow-error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
          </div>
        </div>

        {/* ===== RIGHT: live summary (desktop) ===== */}
        <aside className="hidden lg:order-2 lg:block lg:sticky lg:top-24">
          <motion.div
            layout
            transition={{ layout: { duration: 0.2, ease: 'easeOut' } }}
            className="rounded-2xl border border-foreground/12 bg-card p-6 shadow-xs shadow-black/5"
          >
            {/* business header */}
            <div className="flex items-start gap-3">
              {business.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(business.avatarUrl)} alt={business.name} className="size-14 shrink-0 rounded-full object-cover ring-1 ring-border" />
              ) : (
                <div className="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-zinc-600 via-zinc-800 to-zinc-950 text-lg font-semibold tracking-wide text-white">
                  {initials(business.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-lg font-bold leading-tight text-foreground">{business.name}</p>
                {branch?.address && (
                  <p className="mt-1 truncate text-sm text-muted-foreground">{localized(branch.address, '', locale)}</p>
                )}
              </div>
            </div>

            <div className="my-4 border-t border-border" />

            <SummaryBody
              selected={selected}
              currency={business.currency}
              dict={dict}
              locale={locale}
              staffName={selectedStaff?.name ?? null}
              resourceLabel={resourceLabel}
              when={slot && selDate ? `${selDate.day} ${selDate.mon} · ${slot}${hourly ? `–${addHm(slot, durationMin)}` : ''}` : null}
              startTime={slot ?? null}
              totalMin={durationKnown ? totalMin : 0}
              priceText={summaryPrice}
            />

            {/* The confirm step carries its own actions (send code / book) inline. */}
            {step !== 'confirm' && !confirmOpen && (
              <PrimaryBtn className="mt-5" disabled={action.disabled} onClick={action.onClick}>
                <span className="inline-flex items-center gap-2">{action.label}<ArrowRight size={18} /></span>
              </PrimaryBtn>
            )}
          </motion.div>
        </aside>
      </div>

      {/* ===== Mobile bottom bar (summary fallback) — the confirm step has inline actions ===== */}
      {step !== 'confirm' && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 p-4 backdrop-blur lg:hidden">
          {selected.length > 0 && (
            <div className="mb-2.5 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selected.length} {dict.serviceCount}{durationKnown && totalMin ? ` · ${dur(totalMin, dict)}` : ''}
              </span>
              <span className="text-base font-extrabold text-foreground">{summaryPrice}</span>
            </div>
          )}
          <PrimaryBtn disabled={action.disabled} onClick={action.onClick}>
            <span className="inline-flex items-center gap-2">{action.label}<ArrowRight size={18} /></span>
          </PrimaryBtn>
        </div>
      )}

      {/* ===== Desktop: confirm as a centered modal (mobile uses the inline step above) ===== */}
      <AnimatePresence>
        {confirmOpen && isDesktop && (
          <motion.div
            key="confirm-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!busy) closeConfirm(); }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <h3 className="text-xl font-extrabold text-foreground">
                  {otpSent ? dict.titleSmsCode : rescheduleId ? dict.titleConfirmChanges : sessionActive ? dict.stepConfirm : dict.phoneLabel}
                </h3>
                <button
                  type="button"
                  onClick={() => { if (!busy) closeConfirm(); }}
                  aria-label={dict.ariaClose}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5"
                >
                  <X size={18} />
                </button>
              </div>

              {confirmContent}
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
  dict,
  locale,
  staffName,
  resourceLabel,
  when,
  startTime,
  totalMin,
  priceText,
}: {
  selected: PublicTenant['services'];
  currency: string;
  dict: BookingDict;
  locale: TenantLocale;
  staffName: string | null;
  /** Field label for the picked resource — unit label ("Yo'laklar") or "Mutaxassis". */
  resourceLabel: string;
  when: string | null;
  /** Chosen slot start ("HH:MM"); when set, each service shows its start–end window. */
  startTime: string | null;
  totalMin: number;
  /** Pre-formatted total — a money amount, or an hourly rate ("…/soat") while the duration is still unchosen. */
  priceText: string;
}) {
  // Once a slot is picked, walk the services in order to show each one's
  // start–end window (back-to-back from the chosen start time).
  let cursor = startTime;
  const windows = new Map<string, string>();
  for (const s of selected) {
    if (!cursor || s.durationMinutes == null) continue;
    const end = addHm(cursor, s.durationMinutes);
    windows.set(s.id, `${cursor}–${end}`);
    cursor = end;
  }

  return (
    <>
      {/* popLayout (not "wait"): the leaving element pops out of the flow at
          once, so the incoming one and the card's layout resize move together —
          a "wait" here stacks fade-out → resize → fade-in and reads as a glitch. */}
      <AnimatePresence initial={false} mode="popLayout">
        {selected.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="py-1 text-base text-muted-foreground"
          >
            {dict.noServiceYet}
          </motion.p>
        ) : (
          <motion.div
            key="list"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            // The last row's pb-3.5 would stack with the next section's mt-4,
            // making Xizmatlar visually bottom-heavy vs the other sections.
            className="[&>div:last-child>div]:pb-0"
          >
            <p className="pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {dict.servicesHeading}
            </p>
            <AnimatePresence initial={false} mode="popLayout">
              {selected.map((s) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], layout: { duration: 0.26, ease: [0.22, 1, 0.36, 1] } }}
                >
                  <div className="flex items-start justify-between gap-3 pb-3.5">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-foreground">{localized(s.name as LocalizedText, '', locale)}</p>
                      {s.durationMinutes != null && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{dur(s.durationMinutes, dict)}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <span className="whitespace-nowrap text-base font-semibold text-foreground">
                        {priceLabel(s, currency, dict)}
                      </span>
                      {windows.has(s.id) && (
                        <span className="mt-0.5 whitespace-nowrap text-sm text-muted-foreground">
                          {windows.get(s.id)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false} mode="popLayout">
        {(staffName || when) && (
          <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], layout: { duration: 0.26, ease: [0.22, 1, 0.36, 1] } }}
          >
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              {staffName && <FieldRow label={resourceLabel} value={staffName} />}
              {when && <FieldRow label={dict.fieldTime} value={when} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout className="mt-4 border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">{dict.total}{totalMin ? ` · ${dur(totalMin, dict)}` : ''}</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={priceText}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="text-3xl font-extrabold text-foreground"
          >
            {priceText}
          </motion.p>
        </AnimatePresence>
      </motion.div>
    </>
  );
}

/** Round staff avatar: photo if set, else an initials gradient circle. */
function StaffAvatar({ st, className = 'size-8' }: { st: { name: string; photoUrl: string | null }; className?: string }) {
  return st.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={mediaUrl(st.photoUrl)} alt={st.name} className={`${className} shrink-0 rounded-full object-cover`} />
  ) : (
    <span className={`grid ${className} shrink-0 place-items-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-900 text-xs font-semibold text-white`}>
      {initials(st.name)}
    </span>
  );
}

function CatPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
        active ? 'bg-foreground text-background' : 'border border-border bg-card text-foreground hover:bg-foreground/5'
      }`}
    >
      {children}
    </button>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 items-center justify-center rounded-full border px-5 text-sm font-semibold transition-colors duration-200 ${
        on ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-foreground hover:bg-foreground/5'
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
  dict,
  onSelect,
}: {
  value: string;
  todayIso: string;
  maxIso: string;
  dict: BookingDict;
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
        <button type="button" disabled={prevDisabled} onClick={() => go(-1)} aria-label={dict.prevMonth} className="grid size-9 place-items-center rounded-full text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-25">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold text-foreground">{dict.monthsFull[vm]} {vy}</span>
        <button type="button" disabled={nextDisabled} onClick={() => go(1)} aria-label={dict.nextMonth} className="grid size-9 place-items-center rounded-full text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-25">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {dict.weekdaysMon.map((w) => (
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
