'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Calendar, User } from 'lucide-react';
import { localized, type LocalizedText, type PublicBookingView } from '@/lib/tenant';

const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
const STATUS_UZ: Record<string, string> = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlangan',
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
  no_show: 'Kelmagan',
};

function money(amount: number, currency: string) {
  const n = amount.toLocaleString('ru-RU');
  return currency === 'UZS' ? `${n} so'm` : `${n} ${currency}`;
}
function fmtWhen(iso: string, tz: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${Number(get('day'))} ${MONTHS[Number(get('month')) - 1]} · ${get('hour')}:${get('minute')}`;
}

export function BookingResult({ created, data }: { created: boolean; data: PublicBookingView }) {
  const router = useRouter();
  const { business, booking } = data;
  const staff = [...new Set(booking.items.map((i) => i.resourceName))].filter(Boolean).join(', ');
  const total = booking.totalPrice ?? booking.items.reduce((s, i) => s + (i.price ?? 0), 0);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-12">
      {created ? (
        <>
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
        </>
      ) : (
        <div className="w-full">
          <h1 className="text-2xl font-extrabold text-foreground">Bandlik tafsilotlari</h1>
          <span className="mt-2 inline-block rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
            {STATUS_UZ[booking.status] ?? booking.status}
          </span>
        </div>
      )}

      <div className={`w-full rounded-3xl border border-border bg-card p-5 ${created ? 'mt-7' : 'mt-4'}`}>
        {staff && <SummaryRow icon={<User size={16} />} text={staff} />}
        <SummaryRow icon={<Calendar size={16} />} text={fmtWhen(booking.startAt, business.timezone)} />
        <div className="mt-3 border-t border-border pt-3">
          {booking.items.map((it, i) => (
            <div key={`${it.offeringId}-${i}`} className="flex justify-between py-0.5 text-sm">
              <span className="text-muted-foreground">{localized(it.name as LocalizedText | null, 'Xizmat')}</span>
              <span className="font-medium text-foreground">{money(it.price, business.currency)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
            <span>Jami</span>
            <span>{money(total, business.currency)}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push('/')}
        className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-foreground text-base font-bold text-background shadow-lg transition-all hover:opacity-90 active:scale-[0.99]"
      >
        {created ? 'Tayyor' : business.name}
      </button>
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
