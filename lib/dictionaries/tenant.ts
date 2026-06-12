import type { TenantLocale } from '@/lib/tenant';
import { dict as uz, type TenantDict } from './tenant.uz';
import { dict as ru } from './tenant.ru';
import { dict as en } from './tenant.en';

export type { TenantDict };

export const TENANT_DICTS: Record<TenantLocale, TenantDict> = { uz, ru, en };

export function getTenantDict(locale: TenantLocale): TenantDict {
  return TENANT_DICTS[locale] ?? uz;
}
