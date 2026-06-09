'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, Clock, Calendar, User, Phone } from 'lucide-react';
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

  const [step, setStep] = useState<Step>('services');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialServiceId && services.some((s) => s.id === initialServiceId) ? [initialServiceId] : [],
  );
  const [staffId, setStaffId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(dates[0]?.iso ?? '');
  const [slot, setSlot] = useState<string | null>(null);
  const [avail, setAvail] = useState<AvailabilityResult | null>(null);
  const [availLoading, setAvailLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = services.filter((s) => selectedIds.includes(s.id));
  const eligibleStaff = staff.filter((st) => selectedIds.every((id) => st.offeringIds.includes(id)));
  const selectedStaff = staff.find((st) => st.id === staffId) ?? null;
  const totalPrice = selected.reduce((s, x) => s + (x.price ?? 0), 0);
  const totalMin = selected.reduce((s, x) => s + (x.durationMinutes ?? 0), 0);
  const futureSlots = (avail?.slots ?? []).filter((s) => new Date(s.startAt).getTime() > Date.now());

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
  const toggleService = (id: string) =>
    setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const goFromServices = () => {
    setError(null);
    if (selected.length === 0) return;
    if (eligibleStaff.length === 0) {
      setError('Bu xizmatlarni bitta mutaxassis bajara olmaydi — alohida band qiling.');
      return;
    }
    if (eligibleStaff.length === 1) {
      setStaffId(eligibleStaff[0].id);
      setStep('time');
    } else setStep('staff');
  };
  const sendCode = async () => {
    if (phone.length !== 9 || busy) return;
    setError(null);
    setBusy(true);
    const r = await requestOtpAction(`+998${phone}`);
    setBusy(false);
    if (r.ok) setOtpSent(true);
    else setError(r.error);
  };
  const confirm = async () => {
    if (!slot || !staffId || code.length < 4 || busy) return;
    setError(null);
    setBusy(true);
    const r = await createBookingAction(subdomain, {
      date,
      start: slot,
      items: selectedIds.map((id) => ({ offeringId: id, resourceId: staffId })),
      name: name.trim() || undefined,
      phone: `+998${phone}`,
      code,
    });
    setBusy(false);
    if (r.ok) setStep('done');
    else setError(r.error);
  };

  // ---- success ----
  if (step === 'done') {
    const d = dates.find((x) => x.iso === date);
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
        <p className="mt-1.5 text-center text-muted-foreground">
          Tafsilotlarni SMS orqali tasdiqlaymiz.
        </p>
        <div className="mt-7 w-full rounded-3xl border border-border bg-card p-5">
          <SummaryRow icon={<User size={16} />} text={selectedStaff?.name ?? '—'} />
          <SummaryRow icon={<Calendar size={16} />} text={`${d?.day} ${d?.mon} · ${slot}`} />
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
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mt-6 h-[54px] w-full rounded-2xl bg-accent text-base font-bold text-accent-foreground active:scale-[0.99]"
        >
          Tayyor
        </button>
      </div>
    );
  }

  const idx = FLOW.indexOf(step);
  const progress = ((idx + 1) / FLOW.length) * 100;
  const showBottom = step === 'services' || step === 'contact';

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-32">
      {/* Header + progress */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-3">
          <button type="button" onClick={back} className="grid size-10 place-items-center rounded-full hover:bg-foreground/5">
            <ChevronLeft size={22} className="text-foreground" />
          </button>
          <div className="-mt-0.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {idx + 1}/{FLOW.length}
            </p>
            <h1 className="text-lg font-extrabold leading-tight text-foreground">{STEP_TITLE[step]}</h1>
          </div>
        </div>
        <div className="h-1 bg-foreground/5">
          <div className="h-full rounded-r-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.18 }}
          className="px-5 pt-5"
        >
          {/* context summary on later steps */}
          {step !== 'services' && selected.length > 0 && (
            <div className="mb-5 rounded-2xl bg-foreground/[0.03] p-4">
              <div className="flex flex-wrap gap-1.5">
                {selected.map((s) => (
                  <span key={s.id} className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                    {localized(s.name as LocalizedText)}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {dur(totalMin)} · <span className="font-bold text-foreground">{money(totalPrice, business.currency)}</span>
              </p>
            </div>
          )}

          {/* ---- services ---- */}
          {step === 'services' && (
            <div className="flex flex-col gap-2.5">
              {services.map((s) => {
                const on = selectedIds.includes(s.id);
                const price =
                  s.pricingMode === 'time_rate'
                    ? s.ratePerHour != null
                      ? `${money(s.ratePerHour, business.currency)}/soat`
                      : ''
                    : s.price != null
                      ? money(s.price, business.currency)
                      : '';
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all ${on ? 'border-accent bg-accent/5' : 'border-border bg-card'}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{localized(s.name as LocalizedText)}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {s.durationMinutes ? `${dur(s.durationMinutes)}${price ? ' · ' : ''}` : ''}
                        {price}
                      </p>
                    </div>
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? 'border-accent bg-accent text-accent-foreground' : 'border-border'}`}
                    >
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
              {eligibleStaff.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => { setStaffId(st.id); setStep('time'); }}
                  className="flex items-center gap-4 rounded-2xl border-2 border-border bg-card p-4 text-left transition-colors active:border-accent"
                >
                  {st.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={st.photoUrl} alt={st.name} className="size-12 rounded-full object-cover" />
                  ) : (
                    <span className="grid size-12 place-items-center rounded-full bg-accent/10 text-lg font-bold text-accent">
                      {st.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="font-semibold text-foreground">{st.name}</span>
                  <ChevronLeft size={18} className="ml-auto rotate-180 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          {/* ---- time ---- */}
          {step === 'time' && (
            <div>
              <div className="scrollbar-hide -mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1">
                {dates.map((d) => {
                  const on = date === d.iso;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => setDate(d.iso)}
                      className={`flex w-[58px] shrink-0 flex-col items-center rounded-2xl py-2.5 transition-colors ${on ? 'bg-accent text-accent-foreground' : 'bg-foreground/[0.04] text-foreground'}`}
                    >
                      <span className="text-[11px] font-medium opacity-70">{d.wd}</span>
                      <span className="text-xl font-extrabold leading-tight">{d.day}</span>
                      <span className="text-[10px] opacity-60">{d.mon}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                {availLoading ? (
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 12 }).map((_, i) => (
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
                    return (
                      <div key={p.label} className="mb-5">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{p.label}</p>
                        <div className="grid grid-cols-4 gap-2">
                          {items.map((s) => (
                            <button
                              key={s.start}
                              type="button"
                              onClick={() => { setSlot(s.start); setStep('contact'); }}
                              className="h-11 rounded-xl border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:border-accent active:bg-accent active:text-accent-foreground"
                            >
                              {s.start}
                            </button>
                          ))}
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
            <div>
              <div className="mb-5 rounded-2xl border border-border bg-card p-4">
                <SummaryRow icon={<User size={16} />} text={selectedStaff?.name ?? '—'} />
                <SummaryRow icon={<Calendar size={16} />} text={`${dates.find((x) => x.iso === date)?.day} ${dates.find((x) => x.iso === date)?.mon} · ${slot}`} />
              </div>

              <label className="mb-1.5 block text-sm font-semibold text-foreground">Ismingiz</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ism"
                className="mb-4 h-14 w-full rounded-2xl bg-foreground/[0.04] px-4 text-foreground outline-none focus:ring-2 focus:ring-accent"
              />

              <label className="mb-1.5 block text-sm font-semibold text-foreground">Telefon raqamingiz</label>
              <div className="flex h-14 items-center rounded-2xl bg-foreground/[0.04] px-4 focus-within:ring-2 focus-within:ring-accent">
                <Phone size={16} className="mr-2 text-muted-foreground" />
                <span className="font-bold text-foreground/80">+998</span>
                <input
                  value={fmtPhone(phone)}
                  onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 9)); setOtpSent(false); setCode(''); }}
                  inputMode="numeric"
                  placeholder="90 123 45 67"
                  className="ml-2 h-full w-full bg-transparent tabular-nums tracking-wide text-foreground outline-none"
                />
              </div>

              <AnimatePresence>
                {otpSent && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                    <div className="mt-4">
                      <label className="mb-1.5 block text-sm font-semibold text-foreground">Tasdiqlash kodi</label>
                      <input
                        autoFocus
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        inputMode="numeric"
                        placeholder="• • • • •"
                        className="h-14 w-full rounded-2xl bg-foreground/[0.04] px-4 text-center text-xl font-bold tracking-[0.4em] tabular-nums text-foreground outline-none focus:ring-2 focus:ring-accent"
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

      {/* Bottom action */}
      {showBottom && (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg border-t border-border bg-card/95 p-4 backdrop-blur">
          {step === 'services' && (
            <>
              {selected.length > 0 && (
                <div className="mb-2.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{selected.length} xizmat · {dur(totalMin)}</span>
                  <span className="text-base font-extrabold text-foreground">{money(totalPrice, business.currency)}</span>
                </div>
              )}
              <PrimaryBtn disabled={selected.length === 0} onClick={goFromServices}>Davom etish</PrimaryBtn>
            </>
          )}
          {step === 'contact' && !otpSent && (
            <PrimaryBtn disabled={phone.length !== 9 || busy} onClick={sendCode}>
              {busy ? 'Yuborilmoqda…' : 'Kod yuborish'}
            </PrimaryBtn>
          )}
          {step === 'contact' && otpSent && (
            <PrimaryBtn disabled={code.length < 4 || busy} onClick={confirm}>
              {busy ? 'Tasdiqlanmoqda…' : 'Bandlikni tasdiqlash'}
            </PrimaryBtn>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1 text-foreground">
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-semibold">{text}</span>
    </div>
  );
}

function PrimaryBtn({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-[56px] w-full items-center justify-center rounded-2xl bg-accent text-base font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:shadow-none"
    >
      {children}
    </button>
  );
}
