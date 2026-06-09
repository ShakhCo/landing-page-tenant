'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, ChevronDown } from 'lucide-react';
import { localized, type LocalizedText, type PublicTenant } from '@/lib/tenant';

const DAY_NAMES = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
const FEATURED_LIMIT = 6;

function money(amount: number, currency: string) {
  const n = amount.toLocaleString('ru-RU');
  return currency === 'UZS' ? `${n} so'm` : `${n} ${currency}`;
}
function dur(min: number | null) {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? (m ? `${h} soat ${m} daqiqa` : `${h} soat`) : `${m} daqiqa`;
}
function hm(t: string | null) {
  if (!t) return null;
  const [h, m] = t.split(':');
  return Number(h) * 60 + Number(m);
}
function nowInTz(tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return { weekday: map[get('weekday')] ?? 1, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

export function TenantView({ tenant }: { tenant: PublicTenant }) {
  const { business } = tenant;
  const branches = tenant.branches ?? [];
  const services = tenant.services ?? [];
  const staff = tenant.staff ?? [];
  const branch = branches[0];
  const canBook = services.length > 0 && staff.length > 0;

  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showHours, setShowHours] = useState(false);

  const now = branch ? nowInTz(branch.timezone) : null;
  const today = branch?.workingHours.find((w) => w.weekday === now?.weekday);
  const oMin = hm(today?.openTime ?? null);
  const cMin = hm(today?.closeTime ?? null);
  const open = !!now && !!today && !today.isDayOff && oMin != null && cMin != null && now.minutes >= oMin && now.minutes < cMin;
  const closing = today?.closeTime?.slice(0, 5) ?? null;

  const cats = Array.from(
    new Set(services.map((s) => localized(s.category as LocalizedText | null, 'Boshqa'))),
  );
  const filtered = activeCat
    ? services.filter((s) => localized(s.category as LocalizedText | null, 'Boshqa') === activeCat)
    : services;
  const visible = showAll ? filtered : filtered.slice(0, FEATURED_LIMIT);
  const mapsQuery = branch ? `${branch.latitude},${branch.longitude}` : '';

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-6 lg:grid lg:grid-cols-[1fr_360px] lg:gap-10 lg:py-10">
        {/* ===== Business card (right on desktop, top on mobile) ===== */}
        <aside className="mb-6 lg:order-2 lg:mb-0 lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-3xl font-extrabold leading-tight text-foreground xl:text-4xl">
              {business.name}
            </h1>
            {business.category && (
              <span className="mt-3 inline-block rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
                {localized(business.category.name)}
              </span>
            )}
            {canBook && (
              <Link
                href="/booking"
                className="mt-5 flex h-14 w-full items-center justify-center rounded-full bg-accent text-base font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-transform active:scale-[0.99]"
              >
                Bron qilish
              </Link>
            )}
          </div>

          {branch && (
            <div className="mt-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
              <button
                type="button"
                onClick={() => setShowHours(true)}
                className="flex w-full items-center gap-3 text-left"
              >
                <Clock size={20} className="shrink-0 text-muted-foreground" />
                <span className="flex-1 text-[15px]">
                  <span className={open ? 'font-semibold text-emerald-600' : 'font-semibold text-foreground'}>
                    {open ? 'Ochiq' : 'Yopiq'}
                  </span>
                  {open && closing && <span className="text-muted-foreground"> · {closing} gacha</span>}
                </span>
                <ChevronDown size={18} className="text-muted-foreground" />
              </button>
              {branch.address && (
                <div className="mt-4 flex items-start gap-3 border-t border-border pt-4">
                  <MapPin size={20} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <p className="text-[15px] text-foreground">
                    {localized(branch.address)}{' '}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-accent"
                    >
                      Yo&apos;l ko&apos;rsatish
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ===== Services (left) ===== */}
        <section className="lg:order-1">
          <h2 className="text-2xl font-extrabold text-foreground lg:text-3xl">Xizmatlar</h2>

          {cats.length > 1 && (
            <div className="scrollbar-hide -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
              <Pill active={activeCat === null} onClick={() => { setActiveCat(null); setShowAll(false); }}>
                Barchasi
              </Pill>
              {cats.map((c) => (
                <Pill key={c} active={activeCat === c} onClick={() => { setActiveCat(c); setShowAll(false); }}>
                  {c}
                </Pill>
              ))}
            </div>
          )}

          {services.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
              Hozircha xizmatlar yo&apos;q.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {visible.map((s) => {
                const price =
                  s.pricingMode === 'time_rate'
                    ? s.ratePerHour != null
                      ? `${money(s.ratePerHour, business.currency)}/soat`
                      : ''
                    : s.price != null
                      ? money(s.price, business.currency)
                      : '';
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/20"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-foreground">{localized(s.name as LocalizedText)}</h3>
                      {s.durationMinutes != null && (
                        <p className="mt-1 text-sm text-muted-foreground">{dur(s.durationMinutes)}</p>
                      )}
                      {price && <p className="mt-3 font-bold text-foreground">{price}</p>}
                    </div>
                    {canBook && (
                      <Link
                        href={`/booking?service=${s.id}`}
                        className="shrink-0 rounded-full border border-border px-6 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-foreground/5"
                      >
                        Bron
                      </Link>
                    )}
                  </div>
                );
              })}

              {filtered.length > FEATURED_LIMIT && !showAll && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="mt-1 self-start rounded-full border border-border px-6 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-foreground/5"
                >
                  Barchasini ko&apos;rish
                </button>
              )}
            </div>
          )}

          <a
            href="https://bookup.uz"
            target="_blank"
            rel="noreferrer"
            className="mt-10 flex items-center gap-2 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          >
            <span className="text-sm">powered by</span>
            <span className="text-lg font-bold tracking-wider">BOOKUP</span>
          </a>
        </section>
      </div>

      {/* Mobile sticky Book CTA */}
      {canBook && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 p-4 backdrop-blur lg:hidden">
          <Link
            href="/booking"
            className="flex h-14 items-center justify-center rounded-full bg-accent text-base font-bold text-accent-foreground shadow-lg active:scale-[0.99]"
          >
            Bron qilish
          </Link>
        </div>
      )}

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
              <div className="flex justify-center pt-3 lg:hidden">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>
              <div className="px-6 pb-2 pt-5">
                <h3 className="text-2xl font-bold text-foreground">Ish vaqti</h3>
              </div>
              <div className="px-6 pb-7">
                {branch.workingHours.map((w) => (
                  <div
                    key={w.weekday}
                    className={`flex justify-between py-2 text-base ${w.weekday === now?.weekday ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
                  >
                    <span>{DAY_NAMES[w.weekday - 1] ?? w.weekday}</span>
                    <span className="tabular-nums">
                      {w.isDayOff || !w.openTime || !w.closeTime
                        ? 'Dam olish'
                        : `${w.openTime.slice(0, 5)} – ${w.closeTime.slice(0, 5)}`}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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
