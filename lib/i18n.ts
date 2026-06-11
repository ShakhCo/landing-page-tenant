export const LOCALES = ['uz', 'oz', 'ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'uz';

/** Display metadata for each locale (switcher UI + hreflang). */
export const LOCALE_META: Record<
  Locale,
  { code: string; native: string; flag: string; hreflang: string }
> = {
  uz: { code: 'UZ', native: "O'zbekcha", flag: '🇺🇿', hreflang: 'uz' },
  oz: { code: 'ЎЗ', native: 'Ўзбекча', flag: '🇺🇿', hreflang: 'uz-Cyrl' },
  ru: { code: 'RU', native: 'Русский', flag: '🇷🇺', hreflang: 'ru' },
  en: { code: 'EN', native: 'English', flag: '🇬🇧', hreflang: 'en' },
};

/** Build a path for a locale: uz keeps URLs unchanged, oz/ru/en get a prefix. */
export function localePath(locale: Locale, path = '/'): string {
  if (locale === DEFAULT_LOCALE) return path;
  return `/${locale}` + (path === '/' ? '' : path);
}
