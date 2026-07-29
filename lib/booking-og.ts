// Shared formatting for the /b/<short> booking link — used by both the page
// metadata (title/description) and the OG image. Workers' ICU can't be trusted
// for the 'uz' locale, so month/weekday names are mapped by hand.

const UZ_MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
];

const UZ_WEEKDAYS: Record<string, string> = {
  Mon: 'dushanba',
  Tue: 'seshanba',
  Wed: 'chorshanba',
  Thu: 'payshanba',
  Fri: 'juma',
  Sat: 'shanba',
  Sun: 'yakshanba',
};

/** Tinted status pill, matching the booking result page. */
export const BOOKING_STATUS_UZ: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: 'Kutilmoqda', bg: '#fef3c7', fg: '#b45309' },
  confirmed: { label: 'Tasdiqlangan', bg: '#d1fae5', fg: '#047857' },
  completed: { label: 'Yakunlangan', bg: '#d1fae5', fg: '#047857' },
  cancelled: { label: 'Bekor qilingan', bg: '#fee2e2', fg: '#b91c1c' },
  no_show: { label: 'Kelmagan', bg: '#f3f4f6', fg: '#4b5563' },
};

export function statusLabel(status: string): string {
  return BOOKING_STATUS_UZ[status]?.label ?? status;
}

/**
 * Local booking date/time for a timezone:
 *  - `date`      → "26 iyul, yakshanba" (with weekday, for descriptions)
 *  - `dateShort` → "26 iyul" (no weekday, for the OG card)
 *  - `time`      → "17:25"
 */
export function bookingWhen(
  iso: string,
  tz: string,
): { date: string; dateShort: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const month = Number(get('month'));
  const dateShort = `${get('day')} ${UZ_MONTHS[month - 1] ?? ''}`;
  return {
    date: `${dateShort}, ${UZ_WEEKDAYS[get('weekday')] ?? ''}`,
    dateShort,
    time: `${get('hour')}:${get('minute')}`,
  };
}
