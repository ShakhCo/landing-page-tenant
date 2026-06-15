import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
  const images = [{ url: b.avatarUrl ?? 'https://bookup.uz/og.jpg' }];

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
      images,
    },
    twitter: {
      card: b.avatarUrl ? 'summary' : 'summary_large_image',
      title,
      description,
      images: [b.avatarUrl ?? 'https://bookup.uz/og.jpg'],
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
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{dict.notFoundTitle}</h1>
          <p className="mt-2 text-muted-foreground">{dict.notFoundText}</p>
          <a
            href="https://bookup.uz"
            className="mt-5 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground"
          >
            bookup.uz
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <TenantView tenant={tenant} dict={dict} locale={locale} customerPhone={customerPhone} />
    </main>
  );
}
