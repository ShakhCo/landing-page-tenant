import type { MetadataRoute } from 'next';

/**
 * Served at /sitemap.xml — the public marketing pages on the apex. Tenant
 * subdomains are dynamic (one per business) and aren't enumerated here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://bookup.uz';
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/narxlar`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/business/sartaroshxonalar`, changeFrequency: 'monthly', priority: 0.7 },
  ];
}
