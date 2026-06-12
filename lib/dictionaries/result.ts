import type { TenantLocale } from '@/lib/tenant';
import { dict as uz, type ResultDict } from './result.uz';
import { dict as ru } from './result.ru';
import { dict as en } from './result.en';

export type { ResultDict };

export const RESULT_DICTS: Record<TenantLocale, ResultDict> = { uz, ru, en };

export function getResultDict(locale: TenantLocale): ResultDict {
  return RESULT_DICTS[locale] ?? uz;
}
