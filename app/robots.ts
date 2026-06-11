import type { MetadataRoute } from 'next';

/** Served at /robots.txt on every host. Booking flows are app surfaces, not for search. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/booking', '/bookings/', '/b/'],
      },
    ],
    sitemap: 'https://bookup.uz/sitemap.xml',
    host: 'https://bookup.uz',
  };
}
