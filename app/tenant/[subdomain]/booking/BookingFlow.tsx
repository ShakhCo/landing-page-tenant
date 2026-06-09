'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check } from 'lucide-react';
import { localized, type LocalizedText, type PublicTenant, type AvailabilityResult } from '@/lib/tenant';
import { getAvailabilityAction, requestOtpAction, createBookingAction } from './actions';

type Step = 'services' | 'staff' | 'time' | 'contact' | 'done';

const WD = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh']; // getUTCDay 0=Sun

function money(amount: number, currency: string) {
  const n = amount.toLocaleString('ru-RU');
  return currency === 'UZS' ? `${n} so'm` : `${n} ${currency}`;
}

function nextDates(tz: string, n = 14) {
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
  const base = new Date(`${todayStr}T00:00:00Z`);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(base.getTime() + i * 86_400_000);
    return { iso: d.toISOString().slice(0, 10), day: d.getUTCDate(), wd: WD[d.getUTCDay()] };
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
  const totalPrice = selected.reduce((s, x) => s + (x.price ?? 0), 0);
  const totalMin = selected.reduce((s, x) => s + (x.durationMinutes ?? 0), 0);

  // Fetch slots when we reach the time step (and whenever date/staff change there).
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
    else router.push('/'); // services step → back to tenant home
  };

  const toggleService = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const goFromServices = () => {
    setError(null);
    if (selected.length === 0) return;
    if (eligibleStaff.length === 0) {
      setError("Bu xizmatlarni bitta mutaxassis bajara olmaydi — alohida band qiling.");
      return;
    }
    if (eligibleStaff.length === 1) {
      setStaffId(eligibleStaff[0].id);
      setStep('time');
    } else {
      setStep('staff');
    }
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

  const TITLES: Record<Step, string> = {
    services: 'Xizmatlar',
    staff: 'Mutaxassis',
    time: 'Vaqt',
    contact: 'Maʼlumotlaringiz',
    done: '',
  };

  if (step === 'done') {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-card px-6 text-center">
        <div className="grid size-16 place-items-center rounded-full bg-accent text-accent-foreground">
          <Check size={32} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-foreground">Band qilindi!</h1>
        <p className="mt-2 text-muted-foreground">
          {selected.map((s) => localized(s.name)).join(', ')} · {date} {slot}
        </p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mt-6 rounded-full bg-accent px-6 py-3 text-sm font-bold text-accent-foreground"
        >
          Tayyor
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-card pb-28">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <button type="button" onClick={back} className="flex size-9 items-center justify-center rounded-full hover:bg-foreground/5">
          <ChevronLeft size={22} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">{TITLES[step]}</h1>
      </div>

      <div className="px-4 pt-4">
        {/* ---- Services ---- */}
        {step === 'services' && (
          <ul className="overflow-hidden rounded-2xl border border-border">
            {services.map((s, i) => {
              const on = selectedIds.includes(s.id);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-4 text-left ${i > 0 ? 'border-t border-border' : ''}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{localized(s.name as LocalizedText)}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.durationMinutes ? `${s.durationMinutes} daqiqa · ` : ''}
                        {s.price != null ? money(s.price, business.currency) : ''}
                      </p>
                    </div>
                    <span
                      className={`grid size-6 shrink-0 place-items-center rounded-full border ${on ? 'border-accent bg-accent text-accent-foreground' : 'border-border'}`}
                    >
                      {on && <Check size={14} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* ---- Staff ---- */}
        {step === 'staff' && (
          <ul className="overflow-hidden rounded-2xl border border-border">
            {eligibleStaff.map((st, i) => (
              <li key={st.id}>
                <button
                  type="button"
                  onClick={() => { setStaffId(st.id); setStep('time'); }}
                  className={`flex w-full items-center gap-3 px-4 py-4 text-left ${i > 0 ? 'border-t border-border' : ''}`}
                >
                  <span className="grid size-10 place-items-center rounded-full bg-muted-foreground/10 font-bold text-foreground">
                    {st.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-semibold text-foreground">{st.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* ---- Time ---- */}
        {step === 'time' && (
          <div>
            <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-3">
              {dates.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setDate(d.iso)}
                  className={`flex w-12 shrink-0 flex-col items-center rounded-2xl py-2 ${date === d.iso ? 'bg-accent text-accent-foreground' : 'bg-muted-foreground/5 text-foreground'}`}
                >
                  <span className="text-[11px] opacity-70">{d.wd}</span>
                  <span className="text-lg font-bold">{d.day}</span>
                </button>
              ))}
            </div>
            {(() => {
              // Hide slots already in the past (today). Future dates: all kept.
              const futureSlots = (avail?.slots ?? []).filter(
                (s) => new Date(s.startAt).getTime() > Date.now(),
              );
              return availLoading ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Yuklanmoqda…</p>
              ) : futureSlots.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Bu kunga boʻsh vaqt yoʻq.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {futureSlots.map((s) => (
                    <button
                      key={s.start}
                      type="button"
                      onClick={() => { setSlot(s.start); setStep('contact'); }}
                      className="rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:border-accent"
                    >
                      {s.start}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ---- Contact + OTP ---- */}
        {step === 'contact' && (
          <div className="flex flex-col gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ismingiz"
              className="w-full rounded-2xl bg-muted-foreground/5 px-4 py-3.5 text-foreground outline-none"
            />
            <div className="flex items-center rounded-2xl bg-muted-foreground/5 px-4">
              <span className="font-bold text-foreground/80">+998</span>
              <input
                value={phone}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 9)); setOtpSent(false); setCode(''); }}
                inputMode="numeric"
                placeholder="90 123 45 67"
                className="ml-2 h-[52px] w-full bg-transparent tabular-nums text-foreground outline-none"
              />
            </div>
            {otpSent && (
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                placeholder="Tasdiqlash kodi"
                className="w-full rounded-2xl bg-muted-foreground/5 px-4 py-3.5 tabular-nums text-foreground outline-none"
              />
            )}
          </div>
        )}

        {error && <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>}
      </div>

      {/* Bottom action */}
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-lg border-t border-border bg-card p-4">
        {(step === 'services' || step === 'time') && selected.length > 0 && (
          <div className="mb-2 flex justify-between text-sm text-muted-foreground">
            <span>{selected.length} xizmat · {totalMin} daqiqa</span>
            <span className="font-bold text-foreground">{money(totalPrice, business.currency)}</span>
          </div>
        )}
        {step === 'services' && (
          <PrimaryBtn disabled={selected.length === 0} onClick={goFromServices}>Davom etish</PrimaryBtn>
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
      className="flex h-[52px] w-full items-center justify-center rounded-2xl bg-accent text-base font-bold text-accent-foreground transition-all active:scale-[0.99] disabled:opacity-50"
    >
      {children}
    </button>
  );
}
