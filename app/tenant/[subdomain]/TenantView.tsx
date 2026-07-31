'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronDown, ChevronRight, BadgeCheck, Phone, Globe, Send, MapPin, ArrowRight, Star, X } from 'lucide-react';
import { formatBranchAddress, localized, mediaUrl, type LocalizedText, type PublicTenant, type TenantLocale } from '@/lib/tenant';
import type { TenantDict } from '@/lib/dictionaries/tenant';
import { ServiceMonogram } from './ServiceMonogram';
import { LocaleSwitcher } from './LocaleSwitcher';
import { AccountMenu } from './AccountMenu';

const FEATURED_LIMIT = 6;
const TEAM_LIMIT = 5;
const REVIEW_PREVIEW = 6;

// Lucide dropped brand icons, so Instagram is drawn locally in the same stroke style.
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}
// Stable per-name avatar color so a reviewer always gets the same swatch.
const AVATAR_COLORS = [
  'bg-slate-500', 'bg-indigo-500', 'bg-violet-500', 'bg-rose-500', 'bg-emerald-500',
  'bg-sky-500', 'bg-amber-500', 'bg-teal-500', 'bg-fuchsia-500', 'bg-cyan-600',
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function money(amount: number, currency: string, som: string) {
  const n = amount.toLocaleString('ru-RU');
  return currency === 'UZS' ? `${n} ${som}` : `${n} ${currency}`;
}
function dur(min: number | null, d: { hour: string; minute: string }) {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? (m ? `${h} ${d.hour} ${m} ${d.minute}` : `${h} ${d.hour}`) : `${m} ${d.minute}`;
}
function hm(t: string | null) {
  if (!t) return null;
  const [h, m] = t.split(':');
  return Number(h) * 60 + Number(m);
}
/** "15.06.2026" in the branch timezone — when the service was taken. */
function fmtServed(iso: string, tz: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(iso)).replace(/\//g, '.');
}
const DATE_LOCALE: Record<TenantLocale, string> = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-GB' };
/** "Mon, 22 Jun 2026, 8:30" — richer review timestamp, localized. */
function fmtReviewDate(iso: string, tz: string, locale: TenantLocale) {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale] ?? 'en-GB', {
    timeZone: tz, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso));
}
function nowInTz(tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return { weekday: map[get('weekday')] ?? 1, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

export function TenantView({
  tenant,
  dict,
  locale,
  customerPhone,
}: {
  tenant: PublicTenant;
  dict: TenantDict;
  locale: TenantLocale;
  /** Logged-in customer's phone (from the booking session) — shown top-right. */
  customerPhone?: string | null;
}) {
  const { business } = tenant;
  const branches = tenant.branches ?? [];
  const services = tenant.services ?? [];
  const staff = tenant.staff ?? [];
  // "Mutaxassislar" shows people only — assets/units (bowling lanes etc.) are
  // bookable resources but not team members.
  const team = staff.filter((st) => (st.type ?? 'staff') === 'staff');
  const branch = branches[0];
  const canBook = services.length > 0 && staff.length > 0;

  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showAllTeam, setShowAllTeam] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showHours, setShowHours] = useState(false);
  // Staff member whose details are shown in the big modal (null = closed).
  const [staffDetail, setStaffDetail] = useState<(typeof staff)[number] | null>(null);
  const [staffTab, setStaffTab] = useState<'profile' | 'services' | 'reviews'>('profile');
  // True once the big hero has scrolled past — fades in the compact header title.
  const [heroPassed, setHeroPassed] = useState(false);
  const staffScrollRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  // While a tab-click smooth-scroll is running, suppress scroll-spy so it can't
  // override the clicked tab mid-flight.
  const programmaticScrollRef = useRef(false);
  // Reviews section — the header rating jumps here on click.
  const reviewsSectionRef = useRef<HTMLElement>(null);
  // Sticky navbar appears once the business name scrolls out of view.
  const [scrolled, setScrolled] = useState(false);
  const nameRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Remember the chosen language so the booking flow (cookie-based) follows it.
  useEffect(() => {
    document.cookie = `bookup_locale=${locale}; path=/; max-age=31536000; samesite=lax`;
  }, [locale]);

  // Lock background scroll while the hours sheet is open.
  useEffect(() => {
    if (!showHours && !staffDetail) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showHours, staffDetail]);

  // Reset the staff modal to the top / Profile tab each time it opens.
  useEffect(() => {
    if (!staffDetail) return;
    setStaffTab('profile');
    setHeroPassed(false);
    programmaticScrollRef.current = false;
    requestAnimationFrame(() => staffScrollRef.current?.scrollTo({ top: 0 }));
  }, [staffDetail]);

  // Current time drives the open/closed status and today-highlighting. Computed
  // AFTER mount (null on the server + first client render) so the server clock
  // and the hydration clock can't disagree — that mismatch was the React #418
  // hydration error. It fills in a tick after load.
  const [now, setNow] = useState<{ weekday: number; minutes: number } | null>(null);
  useEffect(() => {
    if (branch) setNow(nowInTz(branch.timezone));
  }, [branch]);
  const today = branch?.workingHours.find((w) => w.weekday === now?.weekday);
  const oMin = hm(today?.openTime ?? null);
  const cMin = hm(today?.closeTime ?? null);
  const open = !!now && !!today && !today.isDayOff && oMin != null && cMin != null && now.minutes >= oMin && now.minutes < cMin;
  const closing = today?.closeTime?.slice(0, 5) ?? null;

  const cats = Array.from(new Set(services.map((s) => localized(s.category as LocalizedText | null, dict.otherCategory, locale))));
  const filtered = activeCat
    ? services.filter((s) => localized(s.category as LocalizedText | null, dict.otherCategory, locale) === activeCat)
    : services;
  const visible = showAll ? filtered : filtered.slice(0, FEATURED_LIMIT);
  const mapsQuery = branch ? `${branch.latitude},${branch.longitude}` : '';

  // Reviews: highest rating first, then most recent (by the shown service date).
  const sortedReviews = [...(tenant.reviews ?? [])].sort((a, b) => {
    const byStars = (b.rating ?? 0) - (a.rating ?? 0);
    if (byStars !== 0) return byStars;
    const da = a.servedAt ?? a.submittedAt ?? '';
    const db = b.servedAt ?? b.submittedAt ?? '';
    return da > db ? -1 : da < db ? 1 : 0;
  });

  const asUrl = (v: string | null | undefined, base: string) =>
    v ? (v.startsWith('http') ? v : `${base}${v.replace(/^@/, '')}`) : null;
  const contacts = [
    { label: 'Telegram', icon: Send, href: asUrl(business.telegram, 'https://t.me/'), tint: 'border-sky-500/40 bg-sky-500/10 text-sky-500' },
    { label: 'Instagram', icon: InstagramIcon, href: asUrl(business.instagram, 'https://instagram.com/'), tint: 'border-pink-500/40 bg-pink-500/10 text-pink-500' },
    { label: 'Veb-sayt', icon: Globe, href: asUrl(business.website, 'https://') ?? `https://${business.subdomain}.bookup.uz`, tint: 'border-violet-500/40 bg-violet-500/10 text-violet-500' },
    { label: 'Telefon', icon: Phone, href: business.phone ? `tel:${business.phone}` : null, tint: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500' },
  ];

  // What the open staff member offers and the reviews they've earned.
  const staffServices = staffDetail ? services.filter((s) => staffDetail.offeringIds?.includes(s.id)) : [];
  const staffReviews = staffDetail ? sortedReviews.filter((r) => r.servedBy === staffDetail.name) : [];
  const staffReviewCount = staffReviews.length;
  const staffAvg = staffReviewCount ? staffReviews.reduce((a, r) => a + (r.rating ?? 0), 0) / staffReviewCount : 0;
  // Tabs to render — Profile always, the others only when there's content.
  const staffTabs = (['profile', 'services', 'reviews'] as const).filter(
    (t) => t === 'profile' || (t === 'services' && staffServices.length) || (t === 'reviews' && staffReviewCount),
  );

  // Sticky-header height (compact title + tabs) and the compact title's own
  // height — the title only mounts once scrolled, so a tab-click target has to
  // add it back since the sections will shift down as it expands.
  const STAFF_STICKY = 112;
  const STAFF_COMPACT_H = 48;
  const sectionRef = (k: 'profile' | 'services' | 'reviews') =>
    k === 'profile' ? profileRef : k === 'services' ? servicesRef : reviewsRef;
  function handleStaffScroll() {
    const c = staffScrollRef.current;
    if (!c) return;
    setHeroPassed(c.scrollTop >= (heroRef.current?.offsetHeight ?? 0) - 8);
    // Don't let scroll-spy fight the tab the user just clicked.
    if (programmaticScrollRef.current) return;
    const pos = c.scrollTop + STAFF_STICKY + 12;
    let active: 'profile' | 'services' | 'reviews' = 'profile';
    for (const k of staffTabs) {
      const el = sectionRef(k).current;
      if (el && el.offsetTop <= pos) active = k;
    }
    setStaffTab(active);
  }
  function goToStaffSection(k: 'profile' | 'services' | 'reviews') {
    const c = staffScrollRef.current;
    if (!c) return;
    setStaffTab(k);
    // Lock out scroll-spy until the smooth scroll settles.
    programmaticScrollRef.current = true;
    setTimeout(() => { programmaticScrollRef.current = false; }, 700);
    if (k === 'profile') {
      setHeroPassed(false);
      c.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // Measure now (compact title still hidden in the DOM), then add its height
    // back: as it animates open the target section shifts down by that much.
    const el = sectionRef(k).current;
    if (!el) return;
    const shift = heroPassed ? 0 : STAFF_COMPACT_H;
    const top = c.scrollTop + el.getBoundingClientRect().top - c.getBoundingClientRect().top - STAFF_STICKY + shift;
    setHeroPassed(true);
    c.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  return (
    <div className="bg-card min-h-screen">
      <div className="max-w-[1350px] mx-auto">
      <div className="relative px-4 pt-3 lg:px-6 lg:pt-4">
        {/* Account + language stay pinned to the viewport while scrolling, but
            aligned to the right edge of the centered content (not the screen). */}
        <AnimatePresence initial={false}>
          {!scrolled ? (
            <motion.div
              key="float-controls"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none fixed inset-x-0 top-3 z-50"
            >
              <div className="mx-auto flex max-w-[1350px] justify-end px-3">
                <div className="pointer-events-auto flex items-center gap-2">
                  <AccountMenu customerPhone={customerPhone} dict={dict} subdomain={business.subdomain} />
                  <LocaleSwitcher current={locale} />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="sticky-navbar"
              initial={{ y: -96, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -96, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-x-0 top-0 z-50 border-b border-border bg-card/90 backdrop-blur"
            >
              <div className="mx-auto flex h-20 max-w-[1350px] items-center justify-between gap-3 px-4 lg:px-6">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {business.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(business.avatarUrl)} alt="" className="size-11 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className={`grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold text-muted-foreground bg-foreground/[0.08]`}>
                      {initials(business.name)}
                    </span>
                  )}
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-xl font-bold leading-tight text-foreground">{business.name}</span>
                    {branch && (
                      <span className="truncate text-[13px] leading-tight">
                        {open ? (
                          <span className="font-semibold text-emerald-600">{dict.open}{closing ? ` · ${dict.untilPrefix}${closing}${dict.untilSuffix}` : ''}</span>
                        ) : (
                          <span className="font-semibold text-muted-foreground">{dict.closed}</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="hidden items-center gap-2 sm:flex">
                    <AccountMenu customerPhone={customerPhone} dict={dict} subdomain={business.subdomain} />
                    <LocaleSwitcher current={locale} />
                  </div>
                  {canBook && (
                    <Link
                      href="/booking"
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-bold text-background transition-all hover:opacity-90 active:scale-[0.98]"
                    >
                      {dict.book}
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="w-full h-52 sm:h-80 rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-muted/15 to-muted/5">
          <iframe
            title="Map"
            src={`https://maps.google.com/maps?q=${branch.latitude},${branch.longitude}&z=15&output=embed&iwloc=near`}
            className="w-full border-0 h-[calc(100%+160px)] -mt-20 pointer-events-none"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
      <div className="mt-5 px-4 lg:mt-6 lg:px-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 lg:rounded-2xl lg:border lg:border-foreground/10 lg:bg-card lg:px-7 lg:py-5">
          {/* Avatar */}
          {business.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(business.avatarUrl)} alt={business.name} className="size-14 shrink-0 rounded-full object-cover ring-1 ring-border" />
          ) : (
            <span className={`grid size-14 shrink-0 place-items-center rounded-full text-base font-semibold text-muted-foreground bg-foreground/[0.08]`}>
              {initials(business.name)}
            </span>
          )}

          {/* Name + handle */}
          <div className="min-w-0">
            <h1 ref={nameRef} className="flex items-center gap-1.5 text-xl font-bold leading-tight tracking-tight text-foreground">
              <span className="truncate">{business.name}</span>
              <BadgeCheck className="size-5 shrink-0 fill-blue-500 text-card" />
            </h1>
            {branch?.address && (
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{formatBranchAddress(branch, locale)}</span>
              </p>
            )}
          </div>

          {/* Chip — rating if reviewed, otherwise the live open status */}
          {tenant.reviewCount ? (
            <button
              type="button"
              onClick={() => reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="hidden items-center gap-1.5 rounded-xl px-2.5 py-1 text-[13px] font-bold text-foreground transition-colors hover:bg-foreground/5 sm:inline-flex"
            >
              <Star size={13} className="fill-amber-400 text-amber-400" />
              {tenant.averageRating}
              <span className="font-medium text-muted-foreground">· {tenant.reviewCount} {dict.reviewsCount}</span>
            </button>
          ) : branch ? (
            open ? (
              <span className="hidden items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1 text-[13px] font-bold text-emerald-600 sm:inline-flex">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {dict.open}
              </span>
            ) : (
              <span className="hidden items-center gap-1.5 rounded-xl bg-foreground/5 px-3 py-1 text-[13px] font-bold text-muted-foreground sm:inline-flex">
                <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                {dict.closed}
              </span>
            )
          ) : null}

          {/* Right cluster — availability (opens hours) + book. On mobile it
              becomes a full-width row under the name with a top divider. */}
          <div className="flex w-full items-center gap-4 border-b border-border pb-3 sm:ml-auto sm:w-auto sm:border-b-0 sm:pb-0 sm:gap-6">
            {branch && <span className="hidden h-7 w-px bg-border sm:block" />}
            {branch && (
              <button
                type="button"
                onClick={() => setShowHours(true)}
                className="-mx-2.5 flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-sm font-semibold transition-colors hover:bg-foreground/5 sm:w-auto sm:justify-start"
              >
                <span className="flex items-center gap-2">
                  <Clock size={16} className={open ? 'text-emerald-600' : 'text-muted-foreground'} />
                  <span className={open ? 'text-emerald-600' : 'text-foreground'}>
                    {open ? `${dict.open}${closing ? ` · ${dict.untilPrefix}${closing}${dict.untilSuffix}` : ''}` : dict.closed}
                  </span>
                </span>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            )}
            {canBook && (
              <Link
                href="/booking"
                className="hidden h-11 shrink-0 items-center justify-center rounded-xl bg-foreground px-7 text-sm font-bold text-background transition-all hover:opacity-90 active:scale-[0.98] lg:inline-flex"
              >
                {dict.book}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ===== Body ===== */}
      <div className="mt-6 flex flex-col gap-12 px-4 pb-24 lg:mt-6 lg:grid lg:grid-cols-[1fr_480px] lg:items-start lg:gap-6 lg:px-6 lg:pb-12">
        {/* Right column: team/hours/contacts — on mobile it sits after services. */}
        <div className="order-2 space-y-6 lg:order-2">
          {/* Team */}
          {team.length > 0 && (
            <section className="lg:rounded-2xl lg:border lg:border-foreground/10 lg:bg-card lg:p-7">
              <h2 className="text-[26px] font-bold leading-none tracking-tight text-foreground">{dict.specialists}</h2>
              <div className="mt-4">
                {(showAllTeam ? team : team.slice(0, TEAM_LIMIT)).map((st, i) => (
                  <div key={st.id}>
                    {i > 0 && <div className="h-px bg-border" />}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setStaffDetail(st)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setStaffDetail(st); } }}
                      className="group flex cursor-pointer items-center gap-3.5 rounded-xl py-3.5 transition-colors hover:bg-foreground/5 lg:-mx-3 lg:px-3"
                    >
                    {st.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaUrl(st.photoUrl)} alt={st.name} className="size-12 shrink-0 rounded-full object-cover ring-1 ring-border" />
                    ) : (
                      <span className={`grid size-12 shrink-0 place-items-center rounded-full text-sm font-semibold text-muted-foreground bg-foreground/[0.08]`}>
                        {initials(st.name)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{st.name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{st.bookingsCount ?? 0} {dict.bookings}</p>
                    </div>
                    {canBook && (
                      <Link
                        href={`/booking?staff=${st.id.slice(0, 8)}`}
                        aria-label={`${st.name} — ${dict.book}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-foreground/5"
                      >
                        {dict.book}
                        <ArrowRight className="size-4" />
                      </Link>
                    )}
                    </div>
                  </div>
                ))}
              </div>
              {team.length > TEAM_LIMIT && (
                <button
                  type="button"
                  onClick={() => setShowAllTeam((v) => !v)}
                  className="mt-1 flex w-full items-center justify-center gap-1 rounded-xl border-[1.5px] border-foreground py-2 text-sm font-bold text-foreground transition-colors duration-200 hover:bg-foreground/5"
                >
                  {showAllTeam ? dict.showLess : `${dict.showMore} (${team.length})`}
                  <ChevronDown size={15} className={`transition-transform duration-200 ${showAllTeam ? 'rotate-180' : ''}`} />
                </button>
              )}
            </section>
          )}

          {/* Working hours (today highlighted) — shown in place of contacts for now. */}
          {branch && branch.workingHours.length > 0 && (
            <section className="lg:rounded-2xl lg:border lg:border-foreground/10 lg:bg-card lg:p-7">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[26px] font-bold leading-none tracking-tight text-foreground">{dict.workingHours}</h2>
                {open ? (
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">
                    {dict.open}{closing ? ` · ${dict.untilPrefix}${closing}${dict.untilSuffix}` : ''}
                  </span>
                ) : (
                  <span className="rounded-full bg-foreground/5 px-3 py-1 text-xs font-bold text-muted-foreground">{dict.closed}</span>
                )}
              </div>
              <div className="mt-4 divide-y divide-border">
                {branch.workingHours.map((w) => {
                  const isToday = w.weekday === now?.weekday;
                  const off = w.isDayOff || !w.openTime || !w.closeTime;
                  return (
                    <div
                      key={w.weekday}
                      className={`flex items-center justify-between py-3 text-sm ${
                        isToday ? 'font-semibold text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      <span>{dict.days[w.weekday - 1] ?? w.weekday}</span>
                      <span className="tabular-nums">
                        {off ? dict.dayOff : `${w.openTime!.slice(0, 5)} – ${w.closeTime!.slice(0, 5)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Location — map + address with a directions CTA (mobile only; desktop
              already shows the map in the hero header). */}
          {branch && (
            <section className="overflow-hidden lg:rounded-2xl lg:border lg:border-foreground/10 lg:bg-card">
              <div className="h-44 w-full bg-gradient-to-br from-muted/15 to-muted/5">
                <iframe
                  title="Map"
                  src={`https://maps.google.com/maps?q=${mapsQuery}&z=15&output=embed&iwloc=near`}
                  className="h-full w-full border-0 pointer-events-none"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="py-4 lg:p-7">
                <h2 className="text-[26px] font-bold leading-none tracking-tight text-foreground">{dict.location}</h2>
                {branch.address && (
                  <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    {formatBranchAddress(branch, locale)}
                  </p>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-foreground/5 py-2.5 text-center text-sm font-bold text-foreground transition-colors hover:bg-foreground/10"
                >
                  {dict.letsGo}
                  <ArrowRight className="size-4" />
                </a>
              </div>
            </section>
          )}

          {/* Contacts — temporarily hidden, kept for when contact data goes live. */}
          {false && (
            <section className="rounded-2xl border border-foreground/12 bg-card p-6 shadow-xs shadow-black/5">
              <h2 className="text-lg font-bold text-foreground">Aloqa</h2>
              <div className="mt-4 flex gap-3">
                {contacts.map((c) => (
                  <a
                    key={c.label}
                    href={c.href ?? '#'}
                    target={c.href?.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer"
                    aria-label={c.label}
                    title={c.label}
                    className={`flex size-12 items-center justify-center rounded-full border border-dashed transition-transform hover:scale-105 ${c.tint}`}
                  >
                    <c.icon className="size-5" />
                  </a>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Left column on desktop (services + reviews); on mobile `contents`
            lets services / sidebar / reviews reorder independently. */}
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-6 lg:order-1">
        <section className="order-1">
          <div className="lg:rounded-2xl lg:border lg:border-foreground/10 lg:bg-card lg:p-7">
          <h2 className="text-[26px] font-bold leading-none tracking-tight text-foreground">{dict.services}</h2>
          {cats.length > 1 && (
            <div className="scrollbar-hide mt-5 flex gap-2 overflow-x-auto pb-1 [mask-image:linear-gradient(to_right,#000_calc(100%_-_1.5rem),transparent)] [-webkit-mask-image:linear-gradient(to_right,#000_calc(100%_-_1.5rem),transparent)] lg:[mask-image:none] lg:[-webkit-mask-image:none]">
              <Pill active={activeCat === null} onClick={() => { setActiveCat(null); setShowAll(false); }}>{dict.all}</Pill>
              {cats.map((c) => (
                <Pill key={c} active={activeCat === c} onClick={() => { setActiveCat(c); setShowAll(false); }}>{c}</Pill>
              ))}
            </div>
          )}

          {services.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{dict.noServices}</p>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {visible.map((s) => {
                const name = localized(s.name as LocalizedText, '', locale);
                const price =
                  s.pricingMode === 'variable'
                    ? dict.individual
                    : s.pricingMode === 'time_rate'
                      ? s.ratePerHour != null ? `${money(s.ratePerHour, business.currency, dict.som)}${dict.perHour}` : ''
                      : s.price != null ? money(s.price, business.currency, dict.som) : '';
                const inner = (
                  <>
                    {s.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(s.photoUrl)}
                        alt={name}
                        className="aspect-[16/10] w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <ServiceMonogram />
                    )}
                    <div className="p-4">
                      <h3 className="truncate font-semibold text-foreground">{name}</h3>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        {price && <span className="font-bold text-foreground">{price}</span>}
                        {s.durationMinutes != null && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock size={14} />
                            {dur(s.durationMinutes, dict)}
                          </span>
                        )}
                      </div>
                      {canBook && (
                        <span className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-center text-sm font-bold text-foreground transition-colors group-hover:bg-foreground/5">
                          {dict.book}
                          <ArrowRight className="size-4" />
                        </span>
                      )}
                    </div>
                  </>
                );
                const cardClass = 'overflow-hidden rounded-2xl border border-foreground/8 bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5';
                return canBook ? (
                  <Link key={s.id} href={`/booking?services=${s.id.slice(0, 8)}`} className={`group block ${cardClass} active:scale-[0.99]`}>
                    {inner}
                  </Link>
                ) : (
                  <div key={s.id} className={cardClass}>{inner}</div>
                );
              })}
            </div>
          )}

          {filtered.length > FEATURED_LIMIT && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-4 rounded-xl border-[1.5px] border-foreground px-6 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-foreground/5"
            >
              {dict.showMore}
            </button>
          )}
          </div>
        </section>

        {/* ===== Reviews — left column on desktop, last on mobile ===== */}
        {(tenant.reviews?.length ?? 0) > 0 && (
          <section ref={reviewsSectionRef} className="order-3 scroll-mt-24">
            <div className="lg:rounded-2xl lg:border lg:border-foreground/10 lg:bg-card lg:p-7">
              <h2 className="text-[26px] font-bold leading-none tracking-tight text-foreground">{dict.reviews}</h2>
              {tenant.reviewCount ? (
                <div className="mt-4 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={22} className={Math.round(tenant.averageRating ?? 0) >= n ? 'fill-amber-400 text-amber-400' : 'text-foreground/15'} />
                  ))}
                </div>
              ) : null}
              <div className="mt-7 grid gap-x-10 gap-y-9 sm:grid-cols-2">
                {(showAllReviews ? sortedReviews : sortedReviews.slice(0, REVIEW_PREVIEW)).map((r) => {
                  const when = r.servedAt ?? r.submittedAt;
                  return (
                    <div key={r.id} className="min-w-0">
                      <div className="flex items-center gap-3.5">
                        <span className={`grid size-14 shrink-0 place-items-center rounded-full text-base font-semibold text-white ${avatarColor(r.customerName)}`}>
                          {initials(r.customerName)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{r.customerName}</p>
                          {when && (
                            <p className="truncate text-sm text-muted-foreground">{fmtReviewDate(when, branch?.timezone ?? 'Asia/Tashkent', locale)}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3.5 flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} size={16} className={(r.rating ?? 0) >= n ? 'fill-amber-400 text-amber-400' : 'text-foreground/15'} />
                        ))}
                      </div>
                      {r.comment && (
                        <p className="mt-3 text-[15px] leading-relaxed text-foreground/80">{r.comment}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              {sortedReviews.length > REVIEW_PREVIEW && !showAllReviews && (
                <button
                  type="button"
                  onClick={() => setShowAllReviews(true)}
                  className="mt-8 rounded-xl border-[1.5px] border-foreground px-6 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-foreground/5"
                >
                  {dict.showMore}
                </button>
              )}
            </div>
          </section>
        )}
        </div>
      </div>

      {/* Mobile sticky Book CTA — slides away once the top navbar (which carries
          its own Book button) appears on scroll, so there's never two at once. */}
      {canBook && (
        <div
          className={`fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 p-4 backdrop-blur transition-transform duration-300 ease-out lg:hidden ${scrolled ? 'translate-y-full' : 'translate-y-0'}`}
        >
          <Link href="/booking" className="flex h-14 items-center justify-center rounded-xl bg-foreground text-base font-bold text-background shadow-lg active:scale-[0.99]">
            {dict.book}
          </Link>
        </div>
      )}

      {/* Staff details modal — Fresha-style: gray hero, sticky tabs, sticky CTA */}
      <AnimatePresence>
        {staffDetail && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 lg:items-center lg:p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setStaffDetail(null)}
          >
            <motion.div
              className="relative flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-card lg:max-h-[88vh] lg:w-[640px] lg:rounded-3xl"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Persistent close button, top-right over everything */}
              <button
                type="button"
                onClick={() => setStaffDetail(null)}
                aria-label="Close"
                className="absolute right-4 top-4 z-30 grid size-9 place-items-center rounded-full bg-card/80 text-foreground backdrop-blur transition-colors hover:bg-foreground/10"
              >
                <X size={20} />
              </button>

              <div
                ref={staffScrollRef}
                onScroll={handleStaffScroll}
                className="relative flex-1 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/15 [&::-webkit-scrollbar-track]:bg-transparent"
              >
                {/* Hero */}
                <div ref={heroRef} className="bg-foreground/[0.03] px-6 pb-8 pt-12 text-center">
                  {staffDetail.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(staffDetail.photoUrl)} alt={staffDetail.name} className="mx-auto size-32 rounded-full object-cover ring-1 ring-border" />
                  ) : (
                    <span className={`mx-auto grid size-32 place-items-center rounded-full text-4xl font-semibold text-muted-foreground bg-foreground/[0.08]`}>
                      {initials(staffDetail.name)}
                    </span>
                  )}
                  <h3 className="mt-5 text-3xl font-bold tracking-tight text-foreground">{staffDetail.name}</h3>
                  {staffReviewCount > 0 && (
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-sm">
                      <span className="font-bold text-foreground">{staffAvg.toFixed(1)}</span>
                      <Star size={15} className="fill-amber-400 text-amber-400" />
                      <span className="text-muted-foreground">({staffReviewCount})</span>
                    </div>
                  )}
                </div>

                {/* Sticky header — compact title (on scroll) + tabs */}
                <div className="sticky top-0 z-20 bg-card/95 backdrop-blur">
                  <AnimatePresence initial={false}>
                    {heroPassed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center gap-2.5 px-6 pt-4">
                          {staffDetail.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <motion.img
                              src={mediaUrl(staffDetail.photoUrl)}
                              alt=""
                              className="size-8 shrink-0 rounded-full object-cover"
                              initial={{ scale: 0.6 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            />
                          ) : (
                            <span className={`grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-muted-foreground bg-foreground/[0.08]`}>{initials(staffDetail.name)}</span>
                          )}
                          <motion.span
                            className="truncate text-lg font-bold text-foreground"
                            initial={{ x: -8 }}
                            animate={{ x: 0 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                          >
                            {staffDetail.name}
                          </motion.span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex gap-2 px-6 py-3">
                    {staffTabs.map((k) => {
                      const label = k === 'profile' ? dict.profile : k === 'services' ? dict.services : dict.reviews;
                      const isActive = staffTab === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => goToStaffSection(k)}
                          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${isActive ? 'bg-foreground text-background' : 'border border-border text-foreground hover:bg-foreground/5'}`}
                        >
                          {label}
                          {k === 'reviews' && (
                            <span className={`rounded-md px-1.5 text-xs font-bold ${isActive ? 'bg-background/25 text-background' : 'bg-foreground/10 text-muted-foreground'}`}>
                              {staffReviewCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="h-px bg-border" />
                </div>

                {/* Profile */}
                <div ref={profileRef} className="px-6 pt-7">
                  <div className="flex items-center justify-between gap-3 text-[15px]">
                    <span className="text-foreground">{dict.appointmentsCompleted}</span>
                    <span className="font-semibold text-muted-foreground">{(staffDetail.bookingsCount ?? 0).toLocaleString('ru-RU')}</span>
                  </div>
                </div>

                {/* Services */}
                {staffServices.length > 0 && (
                  <div ref={servicesRef} className="mt-8 bg-foreground/[0.03] px-6 py-7">
                    <h4 className="text-[26px] font-bold leading-none tracking-tight text-foreground">{dict.services}</h4>
                    <div className="mt-4 space-y-3">
                      {staffServices.map((s) => {
                        const name = localized(s.name as LocalizedText, '', locale);
                        const price =
                          s.pricingMode === 'variable'
                            ? dict.individual
                            : s.pricingMode === 'time_rate'
                              ? s.ratePerHour != null ? `${money(s.ratePerHour, business.currency, dict.som)}${dict.perHour}` : ''
                              : s.price != null ? money(s.price, business.currency, dict.som) : '';
                        return (
                          <div key={s.id} className="rounded-2xl border border-foreground/10 bg-card p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground">{name}</p>
                                {s.durationMinutes != null && (
                                  <p className="mt-1 text-sm text-muted-foreground">{dur(s.durationMinutes, dict)}</p>
                                )}
                              </div>
                              {canBook && (
                                <Link
                                  // Booking a service FROM a specialist's card:
                                  // carry the specialist too, or the flow asks
                                  // the customer to pick one they already chose.
                                  href={`/booking?services=${s.id.slice(0, 8)}&staff=${staffDetail.id.slice(0, 8)}`}
                                  className="shrink-0 rounded-xl border-[1.5px] border-foreground px-5 py-2 text-sm font-bold text-foreground transition-colors hover:bg-foreground/5"
                                >
                                  {dict.bookShort}
                                </Link>
                              )}
                            </div>
                            {price && <p className="mt-3 font-bold text-foreground">{price}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {staffReviewCount > 0 && (
                  <div ref={reviewsRef} className="px-6 pt-8">
                    <h4 className="text-[26px] font-bold leading-none tracking-tight text-foreground">{dict.reviews}</h4>
                    <div className="mt-3 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={22} className={Math.round(staffAvg) >= n ? 'fill-amber-400 text-amber-400' : 'text-foreground/15'} />
                      ))}
                    </div>
                    <p className="mt-2.5 text-[15px]">
                      <span className="font-bold text-foreground">{staffAvg.toFixed(1)}</span>{' '}
                      <span className="text-muted-foreground">({staffReviewCount})</span>
                    </p>
                    <div className="mt-5 space-y-6">
                      {staffReviews.map((r) => {
                        const when = r.servedAt ?? r.submittedAt;
                        return (
                          <div key={r.id} className="border-t border-border pt-6 first:border-0 first:pt-0">
                            <div className="flex items-center gap-3">
                              <span className={`grid size-14 shrink-0 place-items-center rounded-full text-base font-semibold text-white ${avatarColor(r.customerName)}`}>
                                {initials(r.customerName)}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-foreground">{r.customerName}</p>
                                {when && (
                                  <p className="text-[13px] text-muted-foreground">{fmtServed(when, branch?.timezone ?? 'Asia/Tashkent')}</p>
                                )}
                              </div>
                            </div>
                            <div className="mt-2.5 flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <Star key={n} size={17} className={(r.rating ?? 0) >= n ? 'fill-amber-400 text-amber-400' : 'text-foreground/15'} />
                              ))}
                            </div>
                            {r.comment && <p className="mt-2 text-[15px] leading-relaxed text-foreground/80">{r.comment}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="h-6" />
              </div>

              {/* Sticky Book now */}
              {canBook && (
                <div className="border-t border-border bg-card p-4">
                  <Link
                    href={`/booking?staff=${staffDetail.id.slice(0, 8)}`}
                    className="flex w-full items-center justify-center rounded-xl bg-foreground py-4 text-base font-bold text-background transition-all hover:opacity-90 active:scale-[0.99]"
                  >
                    {dict.bookShort}
                  </Link>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Working hours modal */}
      <AnimatePresence>
        {showHours && branch && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 lg:items-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowHours(false)}
          >
            <motion.div
              className="w-full overflow-hidden rounded-t-[28px] bg-card lg:w-[420px] lg:rounded-2xl"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 lg:hidden"><div className="h-1 w-10 rounded-full bg-border" /></div>
              <div className="px-6 pb-2 pt-5"><h3 className="text-2xl font-bold text-foreground">{dict.workingHours}</h3></div>
              <div className="px-6 pb-7">
                {branch.workingHours.map((w) => (
                  <div key={w.weekday} className={`flex justify-between py-2 text-base ${w.weekday === now?.weekday ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                    <span>{dict.days[w.weekday - 1] ?? w.weekday}</span>
                    <span className="tabular-nums">
                      {w.isDayOff || !w.openTime || !w.closeTime ? dict.dayOff : `${w.openTime.slice(0, 5)} – ${w.closeTime.slice(0, 5)}`}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  )
  // return (
  //   <div className="min-h-screen bg-card pb-24 lg:pb-0">
  //     {/* ===== Body ===== */}
  //     <div className="mx-auto max-w-[1300px] px-4 py-8 lg:grid lg:grid-cols-[1fr_420px] lg:gap-20">
  //       {/* Right card (desktop) / mobile hero */}
  //       <aside className="mb-6 lg:order-2 lg:mb-0 lg:sticky lg:top-8 lg:self-start">
  //         {/* Mobile hero: blurred-logo cover + overlapping avatar (text-only when there's no logo) */}
  //         <div className="-mx-4 -mt-8 lg:hidden">
  //           {business.avatarUrl && (
  //             <div className="relative h-32 overflow-hidden">
  //               {/* eslint-disable-next-line @next/next/no-img-element */}
  //               <img
  //                 src={business.avatarUrl}
  //                 alt=""
  //                 aria-hidden
  //                 className="absolute inset-0 size-full scale-150 object-cover blur-2xl saturate-[1.35]"
  //               />
  //               <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/25 to-card" />
  //             </div>
  //           )}

  //           <div className={`relative px-4 ${business.avatarUrl ? '-mt-12' : 'pt-8'}`}>
  //             <div>
  //               {business.avatarUrl && (
  //                 // eslint-disable-next-line @next/next/no-img-element
  //                 <img
  //                   src={business.avatarUrl}
  //                   alt={business.name}
  //                   className="mb-3.5 size-[88px] rounded-[1.375rem] object-cover shadow-lg ring-4 ring-card"
  //                 />
  //               )}

  //               <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
  //                 {business.name}
  //               </h1>
  //               {business.category && (
  //                 <span className="mt-2 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
  //                   {localized(business.category.name)}
  //                 </span>
  //               )}

  //               {branch && (
  //                 <div className="mt-4 flex flex-wrap gap-2">
  //                   <button
  //                     type="button"
  //                     onClick={() => document.getElementById('ish-vaqti')?.scrollIntoView({ behavior: 'smooth' })}
  //                     className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-[13px] font-bold text-foreground shadow-sm transition-transform active:scale-[0.97]"
  //                   >
  //                     <Clock size={14} className={`shrink-0 ${open ? 'text-emerald-600' : 'text-muted-foreground'}`} />
  //                     <span className={open ? 'text-emerald-600' : ''}>{open ? 'Ochiq' : 'Yopiq'}</span>
  //                     {open && closing && <span className="font-medium text-muted-foreground">{closing} gacha</span>}
  //                     <ChevronDown size={14} className="text-muted-foreground" />
  //                   </button>
  //                   {branch.address && (
  //                     <button
  //                       type="button"
  //                       onClick={() => document.getElementById('manzil')?.scrollIntoView({ behavior: 'smooth' })}
  //                       className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-left text-[13px] font-bold text-foreground shadow-sm transition-transform active:scale-[0.97]"
  //                     >
  //                       <MapPin size={14} className="shrink-0 text-accent" />
  //                       <span className="truncate">{localized(branch.address)}</span>
  //                     </button>
  //                   )}
  //                 </div>
  //               )}
  //             </div>
  //           </div>
  //         </div>

  //         {/* Desktop profile card */}
  //         <div className="hidden lg:block lg:rounded-3xl lg:border lg:border-border lg:bg-card lg:px-6 lg:pb-6 lg:pt-6 lg:shadow-sm">
  //           <div className="flex items-start gap-3.5">
  //             {business.avatarUrl ? (
  //               // eslint-disable-next-line @next/next/no-img-element
  //               <img src={business.avatarUrl} alt={business.name} className="size-14 shrink-0 rounded-2xl object-cover ring-1 ring-border" />
  //             ) : (
  //               <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-foreground/5 text-2xl font-black text-foreground ring-1 ring-border">
  //                 {business.name.trim().charAt(0).toUpperCase()}
  //               </div>
  //             )}
  //             <div className="min-w-0 pt-0.5">
  //               <p className="text-xl font-extrabold leading-tight text-foreground sm:text-2xl" role="heading" aria-level={1}>{business.name}</p>
  //               {business.category && (
  //                 <span className="mt-1.5 inline-block rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
  //                   {localized(business.category.name)}
  //                 </span>
  //               )}
  //             </div>
  //           </div>
  //           {canBook && (
  //             <Link
  //               href="/booking"
  //               className="mt-5 hidden h-14 w-full items-center justify-center rounded-full bg-foreground text-base font-bold text-background shadow-lg transition-transform hover:opacity-90 active:scale-[0.99] lg:flex"
  //             >
  //               Bron qilish
  //             </Link>
  //           )}
  //         </div>
  //         {branch && (
  //           <div className="mt-4 hidden rounded-2xl border border-border bg-card p-5 lg:block lg:rounded-3xl lg:p-6 lg:shadow-sm">
  //             <button type="button" onClick={() => setShowHours(true)} className="flex w-full items-center gap-3 text-left">
  //               <Clock size={20} className="shrink-0 text-muted-foreground" />
  //               <span className="flex-1 text-[15px]">
  //                 <span className={open ? 'font-semibold text-emerald-600' : 'font-semibold text-foreground'}>
  //                   {open ? 'Ochiq' : 'Yopiq'}
  //                 </span>
  //                 {open && closing && <span className="text-muted-foreground"> · {closing} gacha</span>}
  //               </span>
  //               <ChevronDown size={18} className="text-muted-foreground" />
  //             </button>
  //             {branch.address && (
  //               <div className="mt-4 flex items-start gap-3 border-t border-border pt-4">
  //                 <MapPin size={20} className="mt-0.5 shrink-0 text-muted-foreground" />
  //                 <p className="text-[15px] text-foreground">
  //                   {localized(branch.address)}{' '}
  //                   <a href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`} target="_blank" rel="noreferrer" className="font-semibold text-accent">
  //                     Yo&apos;l ko&apos;rsatish
  //                   </a>
  //                 </p>
  //               </div>
  //             )}
  //           </div>
  //         )}
  //       </aside>

  //       {/* Left: services + team */}
  //       <section className="lg:order-1">
  //         <h2 className="text-2xl font-extrabold text-foreground lg:text-3xl">Xizmatlar</h2>

  //         {cats.length > 1 && (
  //           <div className="scrollbar-hide -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
  //             <Pill active={activeCat === null} onClick={() => { setActiveCat(null); setShowAll(false); }}>Barchasi</Pill>
  //             {cats.map((c) => (
  //               <Pill key={c} active={activeCat === c} onClick={() => { setActiveCat(c); setShowAll(false); }}>{c}</Pill>
  //             ))}
  //           </div>
  //         )}

  //         {services.length === 0 ? (
  //           <p className="mt-6 rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
  //             Hozircha xizmatlar yo&apos;q.
  //           </p>
  //         ) : (
  //           <div className="mt-4 flex flex-col gap-3">
  //             {visible.map((s) => {
  //               const price =
  //                 s.pricingMode === 'time_rate'
  //                   ? s.ratePerHour != null ? `${money(s.ratePerHour, business.currency)}/soat` : ''
  //                   : s.price != null ? money(s.price, business.currency) : '';
  //               const cardClass = 'flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md';
  //               const inner = (
  //                 <>
  //                   <div className="min-w-0 flex-1">
  //                     <h3 className="font-bold text-foreground">{localized(s.name as LocalizedText)}</h3>
  //                     {s.durationMinutes != null && <p className="mt-1 text-sm text-muted-foreground">{dur(s.durationMinutes)}</p>}
  //                     {price && <p className="mt-3 font-bold text-foreground">{price}</p>}
  //                   </div>
  //                   {canBook && (
  //                     <span className="shrink-0 rounded-full border border-border px-6 py-2.5 text-sm font-bold text-foreground transition-colors group-hover:bg-foreground/5">
  //                       Bron
  //                     </span>
  //                   )}
  //                 </>
  //               );
  //               return canBook ? (
  //                 <Link key={s.id} href={`/booking?service=${s.id}`} className={`group ${cardClass} active:scale-[0.99]`}>
  //                   {inner}
  //                 </Link>
  //               ) : (
  //                 <div key={s.id} className={cardClass}>{inner}</div>
  //               );
  //             })}
  //             {filtered.length > FEATURED_LIMIT && !showAll && (
  //               <button
  //                 type="button"
  //                 onClick={() => setShowAll(true)}
  //                 className="mt-1 self-start rounded-full border border-border px-6 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-foreground/5"
  //               >
  //                 Barchasini ko&apos;rish
  //               </button>
  //             )}
  //           </div>
  //         )}

  //         {/* Team */}
  //         {team.length > 0 && (
  //           <div className="mt-12">
  //             <h2 className="text-2xl font-extrabold text-foreground lg:text-3xl">Mutaxassislar</h2>
  //             <div className="mt-5 grid grid-cols-3 gap-x-4 gap-y-7 sm:grid-cols-4">
  //               {team.map((st) => (
  //                 <div key={st.id} className="flex flex-col items-center text-center">
  //                   {st.photoUrl ? (
  //                     // eslint-disable-next-line @next/next/no-img-element
  //                     <img src={st.photoUrl} alt={st.name} className="size-20 rounded-full object-cover ring-2 ring-card shadow-sm sm:size-24" />
  //                   ) : (
  //                     <span className="grid size-20 place-items-center rounded-full bg-foreground/5 text-2xl font-bold text-foreground ring-1 ring-border sm:size-24">
  //                       {st.name.charAt(0).toUpperCase()}
  //                     </span>
  //                   )}
  //                   <p className="mt-2.5 w-full truncate px-1 text-sm font-semibold text-foreground">{st.name}</p>
  //                 </div>
  //               ))}
  //             </div>
  //           </div>
  //         )}

  //         {/* Location / map */}
  //         {branch && (
  //           <div id="manzil" className="mt-12 scroll-mt-4">
  //             <h2 className="text-2xl font-extrabold text-foreground lg:text-3xl">Manzil</h2>
  //             <div className="mt-5 overflow-hidden rounded-2xl border border-border">
  //               <iframe
  //                 title="Map"
  //                 src={`https://maps.google.com/maps?q=${branch.latitude},${branch.longitude}&z=15&output=embed`}
  //                 className="h-80 w-full border-0 sm:h-[28rem]"
  //                 loading="lazy"
  //                 referrerPolicy="no-referrer-when-downgrade"
  //               />
  //             </div>
  //             {branch.address && (
  //               <p className="mt-3 flex items-start gap-2.5 text-[15px] text-foreground">
  //                 <MapPin size={20} className="mt-0.5 shrink-0 text-muted-foreground" />
  //                 <span>
  //                   {localized(branch.address)}{' '}
  //                   <a href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`} target="_blank" rel="noreferrer" className="font-semibold text-accent">
  //                     Yo&apos;l ko&apos;rsatish
  //                   </a>
  //                 </span>
  //               </p>
  //             )}
  //           </div>
  //         )}

  //         {/* Opening times */}
  //         {branch && branch.workingHours.length > 0 && (
  //           <div id="ish-vaqti" className="mt-12 scroll-mt-4">
  //             <h2 className="text-2xl font-extrabold text-foreground lg:text-3xl">Ish vaqti</h2>
  //             <div className="mt-5 w-full">
  //               {branch.workingHours.map((w) => {
  //                 const isToday = w.weekday === now?.weekday;
  //                 const off = w.isDayOff || !w.openTime || !w.closeTime;
  //                 return (
  //                   <div key={w.weekday} className="flex items-center justify-between border-b border-border py-3 last:border-0">
  //                     <span className="flex items-center gap-3">
  //                       <span className={`size-2 rounded-full ${off ? 'bg-stone-300' : 'bg-emerald-500'}`} />
  //                       <span className={isToday ? 'font-bold text-foreground' : 'text-foreground'}>{DAY_NAMES[w.weekday - 1] ?? w.weekday}</span>
  //                     </span>
  //                     <span className={`tabular-nums ${isToday ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
  //                       {off ? 'Dam olish' : `${w.openTime!.slice(0, 5)} – ${w.closeTime!.slice(0, 5)}`}
  //                     </span>
  //                   </div>
  //                 );
  //               })}
  //             </div>
  //           </div>
  //         )}

  //         <a href="https://bookup.uz" target="_blank" rel="noreferrer" className="mt-12 flex items-center gap-2 text-muted-foreground/60 transition-colors hover:text-muted-foreground">
  //           <span className="text-sm">powered by</span>
  //           <span className="text-lg font-bold tracking-wider">BOOKUP</span>
  //         </a>
  //       </section>
  //     </div>

  //     {/* Mobile sticky Book CTA */}
  //     {canBook && (
  //       <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 p-4 backdrop-blur lg:hidden">
  //         <Link href="/booking" className="flex h-14 items-center justify-center rounded-full bg-foreground text-base font-bold text-background shadow-lg active:scale-[0.99]">
  //           Bron qilish
  //         </Link>
  //       </div>
  //     )}

  //     {/* Working hours modal */}
  //     <AnimatePresence>
  //       {showHours && branch && (
  //         <motion.div
  //           className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 lg:items-center"
  //           initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
  //           onClick={() => setShowHours(false)}
  //         >
  //           <motion.div
  //             className="w-full overflow-hidden rounded-t-[28px] bg-card lg:w-[420px] lg:rounded-2xl"
  //             initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
  //             transition={{ type: 'spring', damping: 30, stiffness: 300 }}
  //             onClick={(e) => e.stopPropagation()}
  //           >
  //             <div className="flex justify-center pt-3 lg:hidden"><div className="h-1 w-10 rounded-full bg-border" /></div>
  //             <div className="px-6 pb-2 pt-5"><h3 className="text-2xl font-bold text-foreground">Ish vaqti</h3></div>
  //             <div className="px-6 pb-7">
  //               {branch.workingHours.map((w) => (
  //                 <div key={w.weekday} className={`flex justify-between py-2 text-base ${w.weekday === now?.weekday ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
  //                   <span>{DAY_NAMES[w.weekday - 1] ?? w.weekday}</span>
  //                   <span className="tabular-nums">
  //                     {w.isDayOff || !w.openTime || !w.closeTime ? 'Dam olish' : `${w.openTime.slice(0, 5)} – ${w.closeTime.slice(0, 5)}`}
  //                   </span>
  //                 </div>
  //               ))}
  //             </div>
  //           </motion.div>
  //         </motion.div>
  //       )}
  //     </AnimatePresence>
  //   </div>
  // );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
        active ? 'border-[1.5px] border-foreground bg-foreground/[0.04] text-foreground' : 'border border-border bg-card text-foreground hover:bg-foreground/5'
      }`}
    >
      {children}
    </button>
  );
}
