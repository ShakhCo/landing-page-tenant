'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, Check, Clock, Calendar, User, Phone, Minus, Plus } from 'lucide-react';
import { localized, type LocalizedText, type PublicTenant, type AvailabilityResult } from '@/lib/tenant';
import { getAvailabilityAction, requestOtpAction, createBookingAction } from './actions';

type Step = 'services' | 'staff' | 'time' | 'contact' | 'done';
const FLOW: Step[] = ['services', 'staff', 'time', 'contact'];
const STEP_TITLE: Record<Step, string> = {
  services: 'Xizmatlarni tanlang',
  staff: 'Mutaxassisni tanlang',
  time: 'Sana va vaqt',
  contact: 'Tasdiqlash',
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
  { label: 'Kunduzi', from: 12, to: 17 },
  { label: 'Kechqurun', from: 17, to: 24 },
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
/** TIME_RATE: start times where [start, start+duration] fits a free window, stepped by stepMin. */
function hourlySlots(
  res: { free: Array<{ fromAt: string; toAt: string }> } | undefined,
  durationMin: number,
  stepMin: number,
  tz: string,
): { start: string; startAt: string }[] {
  if (!res) return [];
  const out: { start: string; startAt: string }[] = [];
  const stepMs = stepMin * 60_000;
  const durMs = durationMin * 60_000;
  for (const w of res.free ?? []) {
    const startMs = Date.parse(w.fromAt);
    const endMs = Date.parse(w.toAt);
    for (let ms = startMs; ms + durMs <= endMs; ms += stepMs) {
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
}: {
  tenant: PublicTenant;
  subdomain: string;
  initialServiceId?: string;
}) {
  const router = useRouter();
  const { business } = tenant;
  const branches = tenant.branches ?? [];
  const services = tenant.services ?? [];
  const staff = tenant.staff ?? [];
  const tz = branches[0]?.timezone ?? 'Asia/Tashkent';
  const dates = nextDates(tz);

  // With exactly one service, skip the services step: preselect it and start
  // at the next meaningful step (staff if there's a choice, else straight to time).
  const onlyService = services.length === 1 ? services[0] : null;
  const onlyStaffForOnly = onlyService
    ? staff.filter((st) => st.offeringIds.includes(onlyService.id))
    : [];

  const [step, setStep] = useState<Step>(() => {
    if (!onlyService) return 'services';
    if (onlyStaffForOnly.length === 1) return 'time';
    if (onlyStaffForOnly.length > 1) return 'staff';
    return 'services'; // no eligible staff → keep on services
  });
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    onlyService
      ? [onlyService.id]
      : initialServiceId && services.some((s) => s.id === initialServiceId)
        ? [initialServiceId]
        : [],
  );
  const [staffId, setStaffId] = useState<string | null>(
    onlyService && onlyStaffForOnly.length === 1 ? onlyStaffForOnly[0].id : null,
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
  const [hourSlots, setHourSlots] = useState<{ start: string; startAt: string }[] | null>(null);
  const [durationMin, setDurationMin] = useState(60);

  const selected = services.filter((s) => selectedIds.includes(s.id));
  const hourly = selected.some(isUnitService); // time-rate (unit or staff) booking
  const selectedIsUnit = hourly;
  const eligibleStaff = staff.filter((st) => selectedIds.every((id) => st.offeringIds.includes(id)));
  const resourcesAreAssets = eligibleStaff.length > 0 && eligibleStaff.every((r) => r.type === 'asset');
  const selectedStaff = staff.find((st) => st.id === staffId) ?? null;

  const stepMin = avail?.stepMinutes ?? 15;
  const availRes = avail?.resources?.find((r) => r.resourceId === staffId) ?? avail?.resources?.[0];
  const ratePerHour = hourly ? (availRes?.ratePerHour ?? selected[0]?.ratePerHour ?? 0) : 0;

  const totalPrice = hourly
    ? Math.round((ratePerHour * durationMin) / 60)
    : selected.reduce((s, x) => s + (x.price ?? 0), 0);
  const totalMin = hourly ? durationMin : selected.reduce((s, x) => s + (x.durationMinutes ?? 0), 0);

  const allSlots = hourly ? hourlySlots(availRes, durationMin, stepMin, tz) : (avail?.slots ?? []);
  const futureSlots = allSlots.filter((s) => new Date(s.startAt).getTime() > Date.now());

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

  useEffect(() => {
    if (step !== 'time' || !staffId || !date) return;
    let alive = true;
    setAvailLoading(true);
    setSlot(null);
    getAvailabilityAction(subdomain, date, selectedIds, staffId).then((r) => {
      if (!alive) return;
      setAvail(r.ok ? r.data : null);
      setError(r.ok ? null : r.error);
      setAvailLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [step, date, staffId, subdomain, selectedIds]);

  const back = () => {
    setError(null);
    if (step === 'staff') setStep('services');
    else if (step === 'time') setStep(eligibleStaff.length > 1 ? 'staff' : 'services');
    else if (step === 'contact') setStep('time');
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
    if (phone.length !== 9 || busy) return;
    setError(null);
    setBusy(true);
    const r = await requestOtpAction(`+998${phone}`);
    setBusy(false);
    if (r.ok) {
      setIsNewCustomer(r.isNewCustomer);
      setOtpSent(true);
    } else setError(r.error);
  };
  const confirm = async () => {
    if (!slot || !staffId || code.length < 4 || busy) return;
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
      phone: `+998${phone}`,
      code,
    });
    if (r.ok) {
      // Go to the booking result page on this subdomain: /bookings/<id>?created=1
      router.push(`/bookings/${r.id}?created=1`);
      return; // keep `busy` while the page navigates
    }
    setBusy(false);
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
          <SummaryRow icon={<User size={16} />} text={selectedStaff?.name ?? '—'} />
          <SummaryRow icon={<Calendar size={16} />} text={`${selDate?.day} ${selDate?.mon} · ${slot}`} />
          <div className="mt-3 border-t border-border pt-3">
            {selected.map((s) => (
              <div key={s.id} className="flex justify-between py-0.5 text-sm">
                <span className="text-muted-foreground">{localized(s.name as LocalizedText)}</span>
                <span className="font-medium text-foreground">{s.price != null ? money(s.price, business.currency) : ''}</span>
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

  const idx = FLOW.indexOf(step);
  const progress = ((idx + 1) / FLOW.length) * 100;

  // Context-aware primary action (drives both the desktop summary and mobile bar)
  const action =
    step === 'services'
      ? { label: 'Davom etish', disabled: selected.length === 0, onClick: goFromServices }
      : step === 'staff'
        ? { label: 'Davom etish', disabled: !staffId, onClick: () => { setError(null); setStep('time'); } }
        : step === 'time'
          ? { label: 'Davom etish', disabled: !slot, onClick: () => { setError(null); setStep('contact'); } }
          : { label: busy ? 'Tasdiqlanmoqda…' : 'Bandlikni tasdiqlash', disabled: !otpSent || code.length < 4 || busy || (isNewCustomer && !name.trim()), onClick: confirm };

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-32 lg:pb-12">
      {/* Header + progress */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/90 px-4 backdrop-blur">
        <div className="flex items-center gap-2 py-3">
          <button type="button" onClick={back} className="grid size-10 place-items-center rounded-full hover:bg-foreground/5">
            <ChevronLeft size={22} className="text-foreground" />
          </button>
          <h1 className="text-lg font-extrabold leading-tight text-foreground">
            {step === 'staff' && resourcesAreAssets ? 'Joyni tanlang' : STEP_TITLE[step]}
          </h1>
        </div>
        <div className="-mx-4 h-1 bg-foreground/5">
          <div className="h-full rounded-r-full bg-foreground transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="pt-6 lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-10">
        {/* ===== LEFT: choices ===== */}
        <div className="min-w-0 lg:order-1">
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
                <div className="flex flex-col gap-2.5">
                  {services.map((s) => {
                    const on = selectedIds.includes(s.id);
                    const price =
                      s.pricingMode === 'time_rate'
                        ? s.ratePerHour != null ? `${money(s.ratePerHour, business.currency)}/soat` : ''
                        : s.price != null ? money(s.price, business.currency) : '';
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleService(s.id)}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-foreground/20"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground">{localized(s.name as LocalizedText)}</p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {s.durationMinutes ? `${dur(s.durationMinutes)}${price ? ' · ' : ''}` : ''}
                            {price}
                          </p>
                        </div>
                        <span className={`grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? 'border-accent bg-accent text-accent-foreground' : 'border-border'}`}>
                          {on && <Check size={16} strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ---- staff ---- */}
              {step === 'staff' && (
                <div className="flex flex-col gap-2.5">
                  {eligibleStaff.map((st) => {
                    const on = staffId === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
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
                          {on && <Check size={16} strokeWidth={3} />}
                        </span>
                      </button>
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
                        className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-foreground/40"
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
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Davomiyligi</p>
                        <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1">
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
                    {availLoading ? (
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                        {Array.from({ length: 15 }).map((_, i) => (
                          <span key={i} className="h-11 animate-pulse rounded-xl bg-foreground/5" />
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
                        // group consecutive slots by hour (items are time-sorted)
                        const groups: { hour: string; slots: typeof items }[] = [];
                        for (const s of items) {
                          const h = s.start.slice(0, 2);
                          const last = groups[groups.length - 1];
                          if (last && last.hour === h) last.slots.push(s);
                          else groups.push({ hour: h, slots: [s] });
                        }
                        return (
                          <div key={p.label} className="mb-5">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{p.label}</p>
                            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                              {groups.map((g) => {
                                // >2 options in this hour → collapse into one hour button + modal
                                if (g.slots.length > 2) {
                                  const selIn = slot && slot.slice(0, 2) === g.hour ? slot : null;
                                  return (
                                    <button
                                      key={`g${g.hour}`}
                                      type="button"
                                      onClick={() => setHourSlots(g.slots)}
                                      className={`flex h-11 items-center justify-center gap-1 rounded-xl border text-sm font-semibold transition-colors ${selIn ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-foreground hover:border-foreground/40'}`}
                                    >
                                      {selIn ?? `${g.hour}:00`}
                                      <ChevronRight size={14} className={selIn ? 'text-background/70' : 'text-muted-foreground'} />
                                    </button>
                                  );
                                }
                                // ≤2 options → render them directly
                                return g.slots.map((s) => {
                                  const on = slot === s.start;
                                  return (
                                    <button
                                      key={s.start}
                                      type="button"
                                      onClick={() => setSlot(s.start)}
                                      className={`h-11 rounded-xl border text-sm font-semibold transition-colors ${on ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-foreground hover:border-foreground/40'}`}
                                    >
                                      {s.start}
                                    </button>
                                  );
                                });
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ---- contact + OTP ---- */}
              {step === 'contact' && (
                <div className="max-w-lg">
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Telefon raqamingiz</label>
                  <div className="flex gap-2">
                    <div className="flex h-14 min-w-0 flex-1 items-center rounded-2xl bg-foreground/[0.04] px-4 focus-within:ring-2 focus-within:ring-foreground/20">
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
                        className="h-14 shrink-0 whitespace-nowrap rounded-2xl bg-foreground px-5 text-sm font-bold text-background transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                      >
                        {busy ? 'Yuborilmoqda…' : 'Kod yuborish'}
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {otpSent && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                        {/* New customer → ask for a name */}
                        {isNewCustomer && (
                          <div className="mt-4">
                            <label className="mb-1.5 block text-sm font-semibold text-foreground">Ismingiz</label>
                            <input
                              autoFocus
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Ism"
                              className="h-14 w-full rounded-2xl bg-foreground/[0.04] px-4 text-foreground outline-none focus:ring-2 focus:ring-foreground/20"
                            />
                          </div>
                        )}

                        <div className="mt-4">
                          <label className="mb-1.5 block text-sm font-semibold text-foreground">Tasdiqlash kodi</label>
                          <input
                            autoFocus={!isNewCustomer}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            inputMode="numeric"
                            placeholder="• • • • •"
                            className="h-14 w-full rounded-2xl bg-foreground/[0.04] px-4 text-center text-xl font-bold tracking-[0.4em] tabular-nums text-foreground outline-none focus:ring-2 focus:ring-foreground/20"
                          />
                          <button type="button" onClick={sendCode} disabled={busy} className="mt-2 text-sm font-semibold text-accent disabled:opacity-50">
                            Kodni qayta yuborish
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {error && <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{error}</p>}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ===== RIGHT: live summary (desktop) ===== */}
        <aside className="hidden lg:order-2 lg:block lg:sticky lg:top-24">
          <motion.div layout className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            {/* business */}
            <div className="flex items-center gap-3">
              {business.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={business.avatarUrl} alt={business.name} className="size-11 shrink-0 rounded-xl object-cover ring-1 ring-border" />
              ) : (
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-foreground/5 text-lg font-black text-foreground ring-1 ring-border">
                  {business.name.trim().charAt(0).toUpperCase()}
                </div>
              )}
              <p className="min-w-0 truncate text-lg font-bold text-foreground">{business.name}</p>
            </div>

            <div className="my-4 border-t border-border" />

            <SummaryBody
              selected={selected}
              currency={business.currency}
              staffName={selectedStaff?.name ?? null}
              when={slot && selDate ? `${selDate.day} ${selDate.mon} · ${slot}${hourly ? `–${addHm(slot, durationMin)}` : ''}` : null}
              totalMin={totalMin}
              totalPrice={totalPrice}
            />

            <PrimaryBtn className="mt-5" disabled={action.disabled} onClick={action.onClick}>
              {action.label}
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
          {action.label}
        </PrimaryBtn>
      </div>

      {/* ===== Hour-slot picker modal ===== */}
      <AnimatePresence>
        {hourSlots && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHourSlots(null)}
          >
            <motion.div
              className="w-full overflow-hidden rounded-t-[28px] bg-card sm:max-w-md sm:rounded-3xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 sm:hidden">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>
              <div className="px-6 pb-3 pt-5">
                <h3 className="text-xl font-bold text-foreground">Vaqtni tanlang</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {hourSlots[0].start} – {hourSlots[hourSlots.length - 1].start}
                </p>
              </div>
              <div className="grid max-h-[55vh] grid-cols-4 gap-2 overflow-y-auto px-6 pb-7">
                {hourSlots.map((s) => {
                  const on = slot === s.start;
                  return (
                    <button
                      key={s.start}
                      type="button"
                      onClick={() => { setSlot(s.start); setHourSlots(null); setError(null); setStep('contact'); }}
                      className={`h-11 rounded-xl border text-sm font-semibold transition-colors ${on ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-foreground hover:border-foreground/40'}`}
                    >
                      {s.start}
                    </button>
                  );
                })}
              </div>
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
  when,
  totalMin,
  totalPrice,
}: {
  selected: PublicTenant['services'];
  currency: string;
  staffName: string | null;
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
                      <p className="text-base font-semibold text-foreground">{localized(s.name as LocalizedText)}</p>
                      {s.durationMinutes != null && <p className="mt-0.5 text-sm text-muted-foreground">{dur(s.durationMinutes)}</p>}
                    </div>
                    <span className="whitespace-nowrap text-base font-semibold text-foreground">
                      {s.price != null ? money(s.price, currency) : ''}
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
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              {staffName && <SummaryRow icon={<User size={16} />} text={staffName} />}
              {when && <SummaryRow icon={<Calendar size={16} />} text={when} />}
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
      className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
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

function SummaryRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2.5 py-0.5 text-foreground">
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-semibold">{text}</span>
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
