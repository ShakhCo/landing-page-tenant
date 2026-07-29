import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTenant, localized, type TenantLocale } from '@/lib/tenant';
import { getTenantDict } from '@/lib/dictionaries/tenant';
import { getSessionPhone } from '@/lib/session';
import { TenantView } from '../TenantView';

// uz is served at the subdomain root (../page.tsx); only ru/en live here.
const SUPPORTED: TenantLocale[] = ['ru', 'en'];

function isSupported(value: string): value is TenantLocale {
  return (SUPPORTED as string[]).includes(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string; locale: string }>;
}): Promise<Metadata> {
  const { subdomain, locale } = await params;
  if (!isSupported(locale)) {
    return { robots: { index: false, follow: false } };
  }
  const dict = getTenantDict(locale);
  const tenant = await getTenant(subdomain);
  if (!tenant) {
    return { title: dict.notFoundTitle, robots: { index: false, follow: false } };
  }
  const b = tenant.business;
  const cat = b.category ? localized(b.category.name, '', locale) : '';
  const branch = (tenant.branches ?? [])[0];
  const city = branch?.address ? localized(branch.address, '', locale) : '';
  const base = `https://${subdomain}.bookup.uz`;
  const url = `${base}/${locale}`;
  const bits = [cat, city].filter(Boolean).join(' · ');
  const title = `${b.name} — ${dict.metaTitleSuffix}`;
  const description = `${b.name}${bits ? ` · ${bits}` : ''}. ${dict.metaDescLong}`;
  // OG/Twitter image lives at ../opengraph-image.tsx. Point at it explicitly on the
  // subdomain root — Next would otherwise resolve it against the root metadataBase,
  // and /tenant/* there 307-redirects, breaking the link preview.
  const ogImage = { url: `${base}/opengraph-image`, width: 1200, height: 630, alt: title };

  return {
    title: { absolute: `${title} | BOOKUP` },
    description,
    applicationName: b.name,
    alternates: {
      canonical: url,
      languages: { uz: base, ru: `${base}/ru`, en: `${base}/en` },
    },
    openGraph: {
      type: 'website',
      siteName: b.name,
      title,
      description,
      url,
      locale: locale === 'ru' ? 'ru_RU' : 'en_US',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage.url],
    },
    robots: { index: true, follow: true },
  };
}

export default async function TenantLocalePage({
  params,
}: {
  params: Promise<{ subdomain: string; locale: string }>;
}) {
  const { subdomain, locale } = await params;
  if (!isSupported(locale)) notFound();
  const dict = getTenantDict(locale);
  const tenant = await getTenant(subdomain);
  const customerPhone = await getSessionPhone();

  if (!tenant) {
    // Unknown subdomain → bounce to the marketing home instead of a dead end.
    redirect('https://bookup.uz');
  }

  return (
    <main className="min-h-screen bg-background">
      <TenantView tenant={tenant} dict={dict} locale={locale} customerPhone={customerPhone} />
    </main>
  );
}
