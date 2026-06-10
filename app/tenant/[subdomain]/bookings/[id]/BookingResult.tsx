'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { localized, type LocalizedText, type PublicBookingView } from '@/lib/tenant';

const MONTHS_FULL = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const WEEKDAYS_FULL = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const STATUS_UZ: Record<string, string> = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlangan',
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
  no_show: 'Kelmagan',
};
const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  confirmed: 'bg-emerald-50 text-emerald-600',
  completed: 'bg-emerald-50 text-emerald-600',
  cancelled: 'bg-destructive/10 text-destructive',
  no_show: 'bg-foreground/5 text-muted-foreground',
};

function money(amount: number, currency: string) {
  const n = amount.toLocaleString('ru-RU');
  return currency === 'UZS' ? `${n} so'm` : `${n} ${currency}`;
}
function fmtDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h ? `${h} soat` : '', m ? `${m} daqiqa` : ''].filter(Boolean).join(' ') || '0 daqiqa';
}
function dateParts(iso: string, tz: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = Number(get('day'));
  const mon = MONTHS_FULL[Number(get('month')) - 1];
  const wd = WEEKDAYS_FULL[wdMap[get('weekday')] ?? 0];
  return { date: `${wd}, ${day}-${mon}`, time: `${get('hour')}:${get('minute')}` };
}

export function BookingResult({ created, data }: { created: boolean; data: PublicBookingView }) {
  const router = useRouter();
  const { business, booking } = data;
  const staff = [...new Set(booking.items.map((i) => i.resourceName))].filter(Boolean).join(', ');
  const total = booking.totalPrice ?? booking.items.reduce((s, i) => s + (i.price ?? 0), 0);
  const when = dateParts(booking.startAt, business.timezone);
  // Hourly-charged (time-rate) bookings have a chosen duration worth showing.
  const hourly = booking.items.some((i) => i.pricingMode === 'time_rate');
  const end = booking.endAt ? dateParts(booking.endAt, business.timezone) : null;
  const durationMin = booking.endAt
    ? Math.round((Date.parse(booking.endAt) - Date.parse(booking.startAt)) / 60000)
    : null;

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 py-12 sm:px-6">
      {created ? (
        <div className="mb-8 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            className="grid size-24 place-items-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/30 sm:size-28"
          >
            <Check size={52} strokeWidth={3} />
          </motion.div>
          <h1 className="mt-7 text-3xl font-extrabold text-foreground">Band qilindi!</h1>
          <p className="mt-2 text-center text-base text-muted-foreground">Tafsilotlar SMS orqali yuborildi.</p>
        </div>
      ) : (
        <div className="mb-5 w-full">
          <h1 className="text-3xl font-extrabold text-foreground">Bron tafsilotlari</h1>
          <span className={`mt-2.5 inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[booking.status] ?? 'bg-foreground/5 text-muted-foreground'}`}>
            {STATUS_UZ[booking.status] ?? booking.status}
          </span>
        </div>
      )}

      {/* Labeled details */}
      <div className="w-full rounded-3xl border border-border bg-card">
        <div className="divide-y divide-border">
          <Row label="Biznes" value={business.name} />
          {staff && <Row label="Mutaxassis" value={staff} />}
          <Row label="Sana" value={when.date} />
          <Row label="Vaqt" value={hourly && end ? `${when.time}–${end.time}` : when.time} />
          {hourly && durationMin != null && <Row label="Davomiyligi" value={fmtDuration(durationMin)} />}
        </div>

        <div className="border-t border-border px-6 py-5">
          <p className="mb-3 text-sm text-muted-foreground">Xizmatlar</p>
          <div className="space-y-2.5">
            {booking.items.map((it, i) => (
              <div key={`${it.offeringId}-${i}`} className="flex items-center justify-between gap-4">
                <span className="text-base font-medium text-foreground">{localized(it.name as LocalizedText | null, 'Xizmat')}</span>
                <span className="whitespace-nowrap text-base font-semibold text-foreground">{money(it.price, business.currency)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-5">
          <span className="text-lg font-bold text-foreground">Jami</span>
          <span className="text-lg font-bold text-foreground">{money(total, business.currency)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push('/')}
        className="mt-7 flex h-16 w-full items-center justify-center rounded-full bg-foreground text-lg font-bold text-background shadow-lg transition-all hover:opacity-90 active:scale-[0.99]"
      >
        {created ? 'Tayyor' : business.name}
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <span className="shrink-0 text-base text-muted-foreground">{label}</span>
      <span className="text-right text-base font-semibold text-foreground">{value}</span>
    </div>
  );
}
