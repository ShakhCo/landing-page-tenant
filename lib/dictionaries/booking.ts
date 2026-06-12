import type { TenantLocale } from '@/lib/tenant';
import { dict as uz, type BookingDict } from './booking.uz';
import { dict as ru } from './booking.ru';
import { dict as en } from './booking.en';

export type { BookingDict };

export const BOOKING_DICTS: Record<TenantLocale, BookingDict> = { uz, ru, en };

export function getBookingDict(locale: TenantLocale): BookingDict {
  return BOOKING_DICTS[locale] ?? uz;
}
