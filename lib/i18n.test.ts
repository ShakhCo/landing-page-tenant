import { describe, expect, it } from 'vitest';

import { DEFAULT_LOCALE, LOCALES, LOCALE_META, localePath } from './i18n';

describe('localePath', () => {
  it('leaves URLs unprefixed for the default language', () => {
    // Uzbek is the canonical URL space — /narxlar, not /uz/narxlar.
    expect(localePath('uz', '/narxlar')).toBe('/narxlar');
    expect(localePath('uz')).toBe('/');
  });

  it('prefixes every other language', () => {
    expect(localePath('ru', '/narxlar')).toBe('/ru/narxlar');
    expect(localePath('en', '/narxlar')).toBe('/en/narxlar');
    expect(localePath('oz', '/narxlar')).toBe('/oz/narxlar');
  });

  it('never leaves a trailing slash on the home path', () => {
    // "/ru/" and "/ru" would be two URLs for one page.
    expect(localePath('ru')).toBe('/ru');
    expect(localePath('en', '/')).toBe('/en');
  });
});

describe('locale metadata', () => {
  it('describes every supported locale', () => {
    for (const locale of LOCALES) {
      expect(LOCALE_META[locale], locale).toBeTruthy();
      expect(LOCALE_META[locale].hreflang, locale).toBeTruthy();
      expect(LOCALE_META[locale].native, locale).toBeTruthy();
    }
    expect(LOCALES).toContain(DEFAULT_LOCALE);
  });

  it('gives the two Uzbek scripts distinct hreflang values', () => {
    // Both are Uzbek; only the script differs, and search engines need to know.
    expect(LOCALE_META.uz.hreflang).toBe('uz');
    expect(LOCALE_META.oz.hreflang).toBe('uz-Cyrl');
    const tags = LOCALES.map((l) => LOCALE_META[l].hreflang);
    expect(new Set(tags).size).toBe(tags.length);
  });
});
