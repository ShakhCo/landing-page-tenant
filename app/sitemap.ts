import type { MetadataRoute } from 'next';

/**
 * Served at /sitemap.xml — the public marketing pages on the apex. Tenant
 * subdomains are dynamic (one per business) and aren't enumerated here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://bookup.uz';
  const lastModified = new Date();
  // hreflang alternates for the localized home, so Google clusters them.
  const homeLanguages = {
    uz: base,
    'uz-Cyrl': `${base}/oz`,
    ru: `${base}/ru`,
    en: `${base}/en`,
  };
  return [
    { url: base, lastModified, changeFrequency: 'weekly', priority: 1, alternates: { languages: homeLanguages } },
    { url: `${base}/oz`, lastModified, changeFrequency: 'weekly', priority: 0.9, alternates: { languages: homeLanguages } },
    { url: `${base}/ru`, lastModified, changeFrequency: 'weekly', priority: 0.9, alternates: { languages: homeLanguages } },
    { url: `${base}/en`, lastModified, changeFrequency: 'weekly', priority: 0.9, alternates: { languages: homeLanguages } },
    { url: `${base}/narxlar`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/business/sartaroshxonalar`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
  ];
}
