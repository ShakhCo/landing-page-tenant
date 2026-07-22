'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown, ChevronLeft, X, CalendarDays } from 'lucide-react';
import type { TenantDict } from '@/lib/dictionaries/tenant';
import { OtpInput } from './booking/OtpInput';
import { requestOtpAction, loginAction, logoutAction } from './booking/actions';

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
export function AccountMenu({ customerPhone, dict }: { customerPhone?: string | null; dict: TenantDict }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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

  // ---- signed in: phone + log-out menu ----
  if (customerPhone) {
    return (
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
              <a
                href="/bookings"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/5"
              >
                <CalendarDays size={16} className="text-muted-foreground" />
                {dict.myBookings}
              </a>
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
