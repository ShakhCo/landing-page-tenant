export const LOCALES = ['uz', 'ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'uz';

/** Build a path for a locale: uz keeps URLs unchanged, ru/en get a prefix. */
export function localePath(locale: Locale, path = '/'): string {
  if (locale === DEFAULT_LOCALE) return path;
  return `/${locale}` + (path === '/' ? '' : path);
}
