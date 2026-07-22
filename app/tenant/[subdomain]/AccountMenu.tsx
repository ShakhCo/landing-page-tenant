'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown, ChevronLeft, ChevronRight, X, CalendarDays } from 'lucide-react';
import type { TenantDict } from '@/lib/dictionaries/tenant';
import { localized, type MyBookingsResult } from '@/lib/tenant';
import { OtpInput } from './booking/OtpInput';
import { requestOtpAction, loginAction, logoutAction, myBookingsAction } from './booking/actions';

const UZ_LEN = 9;
const fmtLocal = (d: string) =>
  [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
const toLocal = (v: string) => v.replace(/\D/g, '').replace(/^998/, '').slice(0, UZ_LEN);

/** Trigger style shared with the LocaleSwitcher button — keeps the pair matched. */
const PILL =
  'inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition-shadow hover:shadow-md';

/**
 * Account control next to the language switcher: shows the signed-in customer's
 * phone with a log-out menu, or a "Log in" entry that opens a centered modal
 * running a phone + OTP flow.
 */
export function AccountMenu({
  customerPhone,
  dict,
  subdomain,
}: {
  customerPhone?: string | null;
  dict: TenantDict;
  subdomain: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // "My bookings" right drawer: mounted + visible are separate so the
  // slide/fade transition can play in both directions.
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerData, setDrawerData] = useState<MyBookingsResult | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [digits, setDigits] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0); // seconds left before a new code can be sent

  const reset = () => {
    setOpen(false);
    setSent(false);
    setCode('');
    setError(null);
    setBusy(false);
    setResendIn(0);
  };

  // Tick the resend cooldown down once per second.
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  // Lock background scroll and allow Escape-to-close while the login modal is open.
  useEffect(() => {
    if (!open || customerPhone) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setSent(false);
        setCode('');
        setError(null);
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, customerPhone]);

  const logout = async () => {
    if (busy) return;
    setBusy(true);
    await logoutAction();
    reset();
    router.refresh();
  };

  const openDrawer = () => {
    setOpen(false);
    setDrawerMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setDrawerVisible(true)));
    setDrawerLoading(true);
    void myBookingsAction(subdomain).then((r) => {
      setDrawerLoading(false);
      setDrawerData(r.ok ? r.data : null);
    });
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setTimeout(() => setDrawerMounted(false), 300); // let the slide-out play
  };

  // Escape closes the drawer; background scroll locks while it is open.
  useEffect(() => {
    if (!drawerMounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerMounted]);

  const STATUS_STYLE: Record<string, string> = {
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-blue-50 text-blue-700 border-blue-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
    no_show: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  const statusLabel: Record<string, string> = {
    confirmed: dict.statusConfirmed,
    completed: dict.statusCompleted,
    cancelled: dict.statusCancelled,
    no_show: dict.statusNoShow,
  };

  const drawer = drawerMounted ? (
    <div className="fixed inset-0 z-[100]">
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${drawerVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeDrawer}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={dict.myBookings}
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-card shadow-2xl transition-transform duration-300 ease-out ${drawerVisible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-foreground">{dict.myBookings}</h2>
            {drawerData && (
              <p className="text-xs font-semibold text-muted-foreground">{drawerData.business.name}</p>
            )}
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label={dict.back}
            className="grid size-9 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-foreground/5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {drawerLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-foreground/5" />
              ))}
            </div>
          ) : !drawerData || drawerData.bookings.length === 0 ? (
            <div className="grid h-full place-items-center">
              <div className="text-center">
                <CalendarDays size={32} className="mx-auto text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold text-muted-foreground">{dict.myBookingsEmpty}</p>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {drawerData.bookings.map((b) => {
                const fmt = new Intl.DateTimeFormat('ru-RU', {
                  timeZone: drawerData.business.timezone,
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const services = b.items
                  .map((it) => (it.name ? localized(it.name, 'uz') : ''))
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <li key={b.id}>
                    <a
                      href={`/b/${encodeURIComponent(b.id)}`}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[b.status] ?? 'border-border bg-muted text-muted-foreground'}`}
                          >
                            {statusLabel[b.status] ?? b.status}
                          </span>
                          <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                            {fmt.format(new Date(b.startAt))}
                          </span>
                        </div>
                        <p className="mt-1.5 truncate text-sm font-bold text-foreground">{services || '—'}</p>
                        {b.totalPrice != null && (
                          <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                            {b.totalPrice.toLocaleString('ru-RU')} {drawerData.business.currency}
                          </p>
                        )}
                      </div>
                      <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  ) : null;

  const sendCode = async () => {
    if (digits.length !== UZ_LEN || busy) return;
    setBusy(true);
    setError(null);
    const r = await requestOtpAction(`+998${digits}`, 'login');
    setBusy(false);
    if (r.ok) {
      setSent(true);
      setResendIn(60); // 60s cooldown before the next code can be requested
    } else setError(r.error);
  };

  // Code step → back to phone entry (keep the typed number).
  const backToPhone = () => {
    if (busy) return;
    setSent(false);
    setCode('');
    setError(null);
  };

  const submit = async (c: string = code) => {
    if (c.length < 5 || busy) return;
    setBusy(true);
    setError(null);
    const r = await loginAction(`+998${digits}`, c);
    if (r.ok) {
      reset();
      router.refresh();
      return; // keep busy while the route refreshes
    }
    setBusy(false);
    setCode(''); // wrong code → clear the boxes for a fresh entry
    setError(r.error);
  };

  // Auto-submit as soon as all 5 digits are in.
  const onCodeChange = (v: string) => {
    setCode(v);
    if (v.length === 5) void submit(v);
  };

  const errorAlert = error ? (
    <p className="mb-4 text-sm font-semibold text-red-600">{error}</p>
  ) : null;

  // ---- signed in: phone + menu (my bookings drawer, log out) ----
  if (customerPhone) {
    return (
      <>
      {drawer}
      <div className="relative">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={PILL}>
          <User size={16} className="text-muted-foreground" />
          <span className="tabular-nums">{customerPhone}</span>
          <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={2.25} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full z-50 mt-1.5 min-w-44 rounded-xl border border-border bg-card p-2 shadow-lg ring-1 ring-black/5">
              <button
                type="button"
                onClick={openDrawer}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/5"
              >
                <CalendarDays size={16} className="text-muted-foreground" />
                {dict.myBookings}
              </button>
              <button
                type="button"
                onClick={logout}
                disabled={busy}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
              >
                <LogOut size={16} />
                {dict.logout}
              </button>
            </div>
          </>
        )}
      </div>
      </>
    );
  }

  // ---- signed out: log-in entry + centered modal (phone / OTP) ----
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={PILL}>
        <User size={16} className="text-muted-foreground" />
        <span>{dict.login}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={reset} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={dict.loginTitle}
            className="relative z-10 w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={reset}
              aria-label={dict.back}
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-foreground/5"
            >
              <X size={18} />
            </button>

            <h2 className="pr-10 text-2xl font-extrabold text-foreground sm:text-3xl">
              {sent ? dict.codeTitle : dict.loginTitle}
            </h2>
            {sent ? (
              <div className="mt-2 flex items-start gap-1 pr-6">
                <button
                  type="button"
                  onClick={backToPhone}
                  disabled={busy}
                  aria-label={dict.back}
                  className="-ml-1 flex h-[1.42rem] shrink-0 items-center text-foreground transition-opacity hover:opacity-70 disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {dict.codeSentPre}
                  <button
                    type="button"
                    onClick={backToPhone}
                    disabled={busy}
                    className="font-semibold text-foreground underline-offset-2 transition-opacity hover:underline disabled:opacity-40"
                  >
                    +998 {fmtLocal(digits)}
                  </button>
                  {dict.codeSentPost}
                </p>
              </div>
            ) : (
              <p className="mt-2 pr-6 text-sm leading-relaxed text-muted-foreground">{dict.loginSubtitle}</p>
            )}

            {!sent ? (
              <div className="mt-6">
                {errorAlert}
                <div className="relative">
                  <input
                    id="login-phone"
                    autoFocus
                    type="tel"
                    inputMode="numeric"
                    placeholder=" "
                    value={fmtLocal(digits)}
                    onChange={(e) => { setError(null); setDigits(toLocal(e.target.value)); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') void sendCode(); }}
                    className="peer h-14 w-full rounded-2xl border border-border bg-transparent pl-[4.75rem] pr-4 text-base font-semibold tracking-wide tabular-nums text-foreground outline-none transition-colors focus:border-foreground"
                  />
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold text-foreground">+998</span>
                  {/* Format hint shows only while focused & empty. */}
                  <span className="pointer-events-none absolute left-[4.75rem] top-1/2 -translate-y-1/2 text-base font-medium tabular-nums text-muted-foreground/40 opacity-0 transition-opacity peer-[:focus:placeholder-shown]:opacity-100">
                    90 123 45 67
                  </span>
                  {/* Floating label: rests as the placeholder, lifts onto the border on focus/value. */}
                  <label
                    htmlFor="login-phone"
                    className="pointer-events-none absolute left-[4.75rem] top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground transition-all duration-150 peer-focus:left-4 peer-focus:top-0 peer-focus:bg-card peer-focus:px-1 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-foreground peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:bg-card peer-[:not(:placeholder-shown)]:px-1 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:text-foreground"
                  >
                    {dict.phoneLabel}
                  </label>
                </div>
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={digits.length !== UZ_LEN || busy}
                  className="mt-5 h-12 w-full rounded-2xl bg-foreground text-base font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-40 sm:h-14"
                >
                  {dict.loginPhoneCta}
                </button>
              </div>
            ) : (
              <div className="mt-6">
                {errorAlert}
                <div>
                  <OtpInput value={code} onChange={onCodeChange} autoFocus />
                </div>
                <button
                  type="button"
                  onClick={() => submit()}
                  disabled={code.length < 5 || busy}
                  className="mt-5 h-12 w-full rounded-2xl bg-foreground text-base font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-40 sm:h-14"
                >
                  {dict.loginConfirm}
                </button>
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={busy || resendIn > 0}
                  className="mt-2 h-11 w-full rounded-2xl text-sm font-semibold text-muted-foreground transition-colors hover:bg-foreground/5 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  {resendIn > 0
                    ? `${dict.loginResend} · ${Math.floor(resendIn / 60)}:${String(resendIn % 60).padStart(2, '0')}`
                    : dict.loginResend}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
