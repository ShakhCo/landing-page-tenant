'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown, ChevronLeft, ChevronRight, X, CalendarDays, Clock } from 'lucide-react';
import type { TenantDict } from '@/lib/dictionaries/tenant';
import { localized, type MyBooking, type MyBookingsResult } from '@/lib/tenant';
import { OtpInput } from './booking/OtpInput';
import { requestOtpAction, loginAction, logoutAction, myBookingsAction } from './booking/actions';

const UZ_MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];

/** Break an ISO instant into day/month/hour/minute parts in the tenant timezone. */
const fmtParts = (iso: string, tz: string) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      day: '2-digit',
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  ) as Record<'day' | 'month' | 'hour' | 'minute', string>;

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
  // Set when the server action itself fails — typically a tab loaded
  // before the latest deploy (stale action id). A refresh fixes it.
  const [drawerStale, setDrawerStale] = useState(false);
  // The booking whose details are shown inside the drawer (null = list view).
  // The drawer slides horizontally between the list and this detail panel.
  const [selected, setSelected] = useState<MyBooking | null>(null);
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
    setSelected(null);
    setDrawerMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setDrawerVisible(true)));
    setDrawerLoading(true);
    setDrawerStale(false);
    void myBookingsAction(subdomain)
      .then((r) => {
        setDrawerLoading(false);
        // Only a genuine success shows the list (empty list => "no bookings").
        // Any failure — expired session, backend blip, timeout, or a stale
        // server action after a deploy — must NOT masquerade as "no bookings";
        // show the reload prompt instead. A reload is the only reliable
        // recovery (it re-runs SSR and rebinds fresh action ids).
        if (r.ok) setDrawerData(r.data);
        else setDrawerStale(true);
      })
      .catch(() => {
        setDrawerLoading(false);
        setDrawerStale(true);
      });
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setTimeout(() => {
      setDrawerMounted(false);
      setSelected(null); // reset to the list for the next open (after slide-out)
    }, 300); // let the slide-out play
  };

  // Escape closes the drawer; background scroll locks while it is open.
  useEffect(() => {
    if (!drawerMounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selected) setSelected(null); // detail → list first
      else closeDrawer();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerMounted, selected]);

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
        className={`absolute inset-0 bg-black/25 transition-opacity duration-300 ${drawerVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeDrawer}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={dict.myBookings}
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-card shadow-2xl transition-transform duration-300 ease-out ${drawerVisible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-1">
            {selected && (
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label={dict.back}
                className="-ml-2 mr-0.5 grid size-8 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-foreground/5"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className="truncate text-lg font-extrabold text-foreground">
              {selected ? dict.bookingDetails : dict.myBookings}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label={dict.back}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-foreground/5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div
            className={`flex h-full w-[200%] transition-transform duration-300 ease-out ${selected ? '-translate-x-1/2' : 'translate-x-0'}`}
          >
            {/* ---- panel 1: the list ---- */}
            <div className="h-full w-1/2 overflow-y-auto p-4" aria-hidden={selected ? true : undefined}>
              {drawerLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-foreground/5" />
                  ))}
                </div>
              ) : drawerStale ? (
                <div className="grid h-full place-items-center">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-muted-foreground">{dict.refreshPrompt}</p>
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="mt-4 h-11 rounded-2xl bg-foreground px-6 text-sm font-bold text-background transition-opacity hover:opacity-90"
                    >
                      {dict.refresh}
                    </button>
                  </div>
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
                    const parts = fmtParts(b.startAt, drawerData.business.timezone);
                    const services = b.items
                      .map((it) => (it.name ? localized(it.name, 'uz') : ''))
                      .filter(Boolean)
                      .join(' · ');
                    return (
                      <li key={b.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(b)}
                          className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-3.5 text-left transition-colors hover:bg-foreground/[0.03]"
                        >
                          <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-foreground/5">
                            <div className="text-center leading-none">
                              <div className="text-lg font-extrabold tabular-nums text-foreground">{parts.day}</div>
                              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                {UZ_MONTHS[Number(parts.month) - 1]}
                              </div>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-[15px] font-bold text-foreground">{services || '—'}</p>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[b.status] ?? 'bg-muted text-muted-foreground'}`}
                              >
                                {statusLabel[b.status] ?? b.status}
                              </span>
                            </div>
                            <p className="mt-0.5 text-sm font-semibold tabular-nums text-muted-foreground">
                              {parts.hour}:{parts.minute}
                              {b.totalPrice != null && (
                                <span> · {b.totalPrice.toLocaleString('ru-RU')} {drawerData.business.currency}</span>
                              )}
                            </p>
                          </div>
                          <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* ---- panel 2: the selected booking's details ---- */}
            <div className="h-full w-1/2 overflow-y-auto p-4" aria-hidden={selected ? undefined : true}>
              {selected && (() => {
                const tz = drawerData?.business.timezone ?? 'Asia/Tashkent';
                const currency = drawerData?.business.currency ?? '';
                const start = fmtParts(selected.startAt, tz);
                const end = selected.endAt ? fmtParts(selected.endAt, tz) : null;
                return (
                  <div className="space-y-4">
                    {/* summary */}
                    <div className="rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-2xl font-extrabold tabular-nums text-foreground">
                            {start.day} {UZ_MONTHS[Number(start.month) - 1]}
                          </div>
                          <div className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold tabular-nums text-muted-foreground">
                            <Clock size={14} />
                            {start.hour}:{start.minute}
                            {end && ` – ${end.hour}:${end.minute}`}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[selected.status] ?? 'bg-muted text-muted-foreground'}`}
                        >
                          {statusLabel[selected.status] ?? selected.status}
                        </span>
                      </div>
                    </div>

                    {/* line items */}
                    <ul className="space-y-2">
                      {selected.items.map((it, i) => {
                        const t = fmtParts(it.startAt, tz);
                        return (
                          <li key={i} className="rounded-2xl border border-border bg-card p-3.5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[15px] font-bold text-foreground">
                                  {it.name ? localized(it.name, 'uz') : '—'}
                                </p>
                                {it.resourceName && (
                                  <p className="mt-0.5 text-sm text-muted-foreground">{it.resourceName}</p>
                                )}
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-sm font-semibold tabular-nums text-foreground">
                                  {t.hour}:{t.minute}
                                </p>
                                {it.price != null && (
                                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-muted-foreground">
                                    {it.price.toLocaleString('ru-RU')} {currency}
                                  </p>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    {/* total */}
                    {selected.totalPrice != null && (
                      <div className="flex items-center justify-between rounded-2xl bg-foreground/5 px-4 py-3.5">
                        <span className="text-sm font-bold text-foreground">{dict.total}</span>
                        <span className="text-base font-extrabold tabular-nums text-foreground">
                          {selected.totalPrice.toLocaleString('ru-RU')} {currency}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </aside>
    </div>
  ) : null;

  const sendCode = async () => {
    if (digits.length !== UZ_LEN || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await requestOtpAction(`+998${digits}`, 'login');
      setBusy(false);
      if (r.ok) {
        setSent(true);
        setResendIn(60); // 60s cooldown before the next code can be requested
      } else setError(r.error);
    } catch {
      // A rejected server action (typically a stale action id after a deploy)
      // would otherwise leave the button stuck in its busy state with no
      // feedback. Unstick it and point the user at a reload.
      setBusy(false);
      setError(dict.refreshPrompt);
    }
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
    try {
      const r = await loginAction(`+998${digits}`, c);
      if (r.ok) {
        reset();
        router.refresh();
        return; // keep busy while the route refreshes
      }
      setBusy(false);
      setCode(''); // wrong code → clear the boxes for a fresh entry
      setError(r.error);
    } catch {
      setBusy(false);
      setCode('');
      setError(dict.refreshPrompt); // stale action / hard failure → prompt reload
    }
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
