/**
 * Shared SEO constants + JSON-LD builders for the marketing site. Keeping the
 * structured data here (not inline) makes it easy to reuse across pages and
 * keeps a single source of truth for the brand entity.
 */

export const SITE_URL = 'https://bookup.uz';
export const SITE_NAME = 'BOOKUP';
export const BRAND_COLOR = '#e11d6c';
export const PHONE = '+998883634020';
export const TELEGRAM = 'https://t.me/ShakhCo';
export const INSTAGRAM = 'https://instagram.com/bookup.uz';

/** The brand as a knowledge-graph entity — logo, contacts, social profiles. */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    legalName: 'BOOKUP',
    url: SITE_URL,
    logo: `${SITE_URL}/bookup-logo.png`,
    image: `${SITE_URL}/og.jpg`,
    description:
      "BOOKUP — O'zbekiston bizneslari uchun onlayn band qilish va boshqaruv platformasi.",
    sameAs: [TELEGRAM, INSTAGRAM],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: PHONE,
      contactType: 'customer support',
      areaServed: 'UZ',
      availableLanguage: ['uz', 'ru', 'en'],
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'UZ',
      addressLocality: 'Toshkent',
    },
  };
}

/** The website entity — ties pages to the brand and declares language alternates. */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: ['uz', 'ru', 'en'],
  };
}

/** The product itself — a SaaS booking platform — for software/app rich results. */
export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    url: SITE_URL,
    description:
      "Biznesingiz uchun onlayn band qilish tizimi: mijozlar xizmatlarni 24/7 bron qiladi; jadval, mijozlar va to'lovlar bitta panelda.",
    provider: { '@id': `${SITE_URL}/#organization` },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'UZS',
      description: 'Bepul boshlang — bank kartasi talab qilinmaydi.',
    },
  };
}

/** FAQ rich result from the on-page Q&A (the answers must match what's visible). */
export function faqSchema(items: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

/** Breadcrumb trail for a sub-page (helps Google show a path in results). */
export function breadcrumbSchema(trail: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: t.url,
    })),
  };
}
