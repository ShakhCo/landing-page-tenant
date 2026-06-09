'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Navigation } from 'lucide-react';
import { localized, type LocalizedText, type PublicTenant } from '@/lib/tenant';

const DAY_NAMES = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];

function formatPrice(amount: number, currency: string): string {
  const n = amount.toLocaleString('ru-RU');
  return currency === 'UZS' ? `${n} so'm` : `${n} ${currency}`;
}

function formatDuration(min: number | null): string {
  if (!min) return '';
  if (min < 60) return `${min} daqiqa`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} soat ${m} daqiqa` : `${h} soat`;
}

function hm(t: string | null): number | null {
  if (!t) return null;
  const [h, m] = t.split(':');
  return Number(h) * 60 + Number(m);
}

function nowInTz(tz: string): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showHours, setShowHours] = useState(false);

  const now = branch ? nowInTz(branch.timezone) : null;
  const today = branch?.workingHours.find((w) => w.weekday === now?.weekday);
  const openMin = hm(today?.openTime ?? null);
  const closeMin = hm(today?.closeTime ?? null);
  const open =
    !!now && !!today && !today.isDayOff && openMin != null && closeMin != null &&
    now.minutes >= openMin && now.minutes < closeMin;
  const closing = today?.closeTime?.slice(0, 5) ?? null;

  const grouped: Record<string, typeof services> = {};
  for (const s of services) {
    const key = localized(s.category as LocalizedText | null, 'Boshqa');
    (grouped[key] ??= []).push(s);
  }
  const categories = Object.keys(grouped);
  const visible = activeCategory ? grouped[activeCategory] ?? [] : services;

  const mapsQuery = branch ? `${branch.latitude},${branch.longitude}` : '';

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl bg-card shadow-lg lg:px-3">
      {/* ---------- Profile header ---------- */}
      <div className="px-4 pb-2 pt-4 text-left">
        <div className="mb-6 flex items-center justify-between">
          {branch && (
            <button
              type="button"
              onClick={() => document.getElementById('location')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex size-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-foreground/5"
              aria-label="Manzil"
            >
              <MapPin size={18} className="text-muted-foreground" />
            </button>
          )}
          <span className="text-sm font-bold tracking-wider text-muted-foreground/50">BOOKUP</span>
        </div>

        {business.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.avatarUrl}
            alt={business.name}
            className="mb-4 size-20 rounded-3xl object-cover shadow-lg ring-4 ring-card"
          />
        )}

        <h1 className="text-3xl font-bold text-foreground xl:text-5xl">{business.name}</h1>

        {branch?.address && <p className="mt-2 text-muted-foreground">{localized(branch.address)}</p>}

        {branch && (
          <button
            type="button"
            onClick={() => setShowHours(true)}
            className="mt-2 flex items-center gap-1.5 text-base transition-opacity hover:opacity-70"
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: open ? 'var(--success)' : 'var(--destructive)' }}
            />
            <span className="text-muted-foreground">
              {open && closing ? `Ochiq · ${closing} gacha` : 'Hozir yopiq'}
            </span>
            <Clock size={15} className="text-muted-foreground/60" />
          </button>
        )}
      </div>

      {/* ---------- Content ---------- */}
      <div className="px-4 pb-24">
        {/* Services */}
        <div className="pt-6">
          <h2 className="mb-4 text-2xl font-bold text-foreground">Xizmatlar</h2>

          {categories.length > 1 && (
            <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-4">
              <Pill active={activeCategory === null} onClick={() => setActiveCategory(null)}>
                Barchasi
              </Pill>
              {categories.map((c) => (
                <Pill
                  key={c}
                  active={activeCategory === c}
                  onClick={() => setActiveCategory(c === activeCategory ? null : c)}
                >
                  {c}
                </Pill>
              ))}
            </div>
          )}

          {services.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Hozircha xizmatlar yo&apos;q.</div>
          ) : (
            <div>
              {visible.map((s, i) => {
                const price =
                  s.pricingMode === 'time_rate'
                    ? s.ratePerHour != null
                      ? `${formatPrice(s.ratePerHour, business.currency)}/soat`
                      : ''
                    : s.price != null
                      ? formatPrice(s.price, business.currency)
                      : '';
                const cls = `flex items-center justify-between py-4 ${i > 0 ? 'border-t border-border' : ''} ${canBook ? '-mx-2 rounded-lg px-2 transition-colors active:bg-foreground/5' : ''}`;
                const inner = (
                  <>
                    <div className="min-w-0 flex-1 pr-4">
                      <h4 className="line-clamp-1 text-lg font-semibold text-foreground">
                        {localized(s.name)}
                      </h4>
                      {s.durationMinutes != null && (
                        <p className="mt-0.5 text-base text-muted-foreground">
                          {formatDuration(s.durationMinutes)}
                        </p>
                      )}
                    </div>
                    {price && (
                      <p className="shrink-0 text-base font-semibold text-foreground xl:text-lg">{price}</p>
                    )}
                  </>
                );
                return canBook ? (
                  <Link key={s.id} href={`/booking?service=${s.id}`} className={cls}>
                    {inner}
                  </Link>
                ) : (
                  <div key={s.id} className={cls}>
                    {inner}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Location */}
        {branch && (
          <div id="location" className="mt-10 scroll-mt-4">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">Manzil</h2>
            <div className="overflow-hidden rounded-3xl border border-border">
              <iframe
                title="map"
                className="h-56 w-full"
                loading="lazy"
                src={`https://www.google.com/maps?q=${mapsQuery}&z=16&output=embed`}
              />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-card py-3.5 text-base font-semibold text-accent"
              >
                <Navigation size={18} />
                Yo&apos;l ko&apos;rsatish
              </a>
            </div>
          </div>
        )}

        {/* Powered by */}
        <a
          href="https://bookup.uz"
          target="_blank"
          rel="noreferrer"
          className="mt-12 flex items-center justify-center gap-2 pb-2 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
        >
          <span className="text-sm">powered by</span>
          <span className="text-xl font-bold tracking-wider">BOOKUP</span>
        </a>
      </div>

      {/* ---------- Sticky booking CTA ---------- */}
      {canBook && (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-3xl bg-gradient-to-t from-card via-card to-transparent px-4 pb-4 pt-8">
          <Link
            href="/booking"
            className="flex h-[54px] items-center justify-center rounded-2xl bg-accent text-base font-bold text-accent-foreground shadow-lg transition-transform active:scale-[0.99]"
          >
            Bron qilish
          </Link>
        </div>
      )}

      {/* ---------- Working hours sheet ---------- */}
      <AnimatePresence>
        {showHours && branch && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 lg:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHours(false)}
          >
            <motion.div
              className="w-full overflow-hidden rounded-t-[28px] bg-card lg:w-[420px] lg:rounded-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
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
                {branch.workingHours.map((w) => {
                  const isToday = w.weekday === now?.weekday;
                  return (
                    <div
                      key={w.weekday}
                      className={`flex justify-between py-2 text-base ${isToday ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
                    >
                      <span>{DAY_NAMES[w.weekday - 1] ?? w.weekday}</span>
                      <span className="tabular-nums">
                        {w.isDayOff || !w.openTime || !w.closeTime
                          ? 'Dam olish'
                          : `${w.openTime.slice(0, 5)} – ${w.closeTime.slice(0, 5)}`}
                      </span>
                    </div>
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

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 rounded-full px-4 py-2 text-base font-medium transition-all ${
        active
          ? 'bg-accent text-accent-foreground'
          : 'border border-border bg-card text-muted-foreground hover:bg-foreground/5'
      }`}
    >
      {children}
    </button>
  );
}
