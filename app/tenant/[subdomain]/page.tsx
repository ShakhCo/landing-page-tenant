import type { Metadata } from 'next';
import { getTenant, localized } from '@/lib/tenant';
import { getTenantDict } from '@/lib/dictionaries/tenant';
import { getSessionPhone } from '@/lib/session';
import { TenantView } from './TenantView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const tenant = await getTenant(subdomain);
  if (!tenant) {
    return { title: 'Topilmadi', robots: { index: false, follow: false } };
  }
  const b = tenant.business;
  const cat = b.category ? localized(b.category.name) : '';
  const branch = (tenant.branches ?? [])[0];
  const city = branch?.address ? localized(branch.address) : '';
  const url = `https://${subdomain}.bookup.uz`;
  const bits = [cat, city].filter(Boolean).join(' · ');
  const title = `${b.name} — Onlayn bron qilish`;
  // Tenant pages are uz-only — single-language meta (default uz, no mixing).
  const description = `${b.name}${bits ? ` · ${bits}` : ''}. Xizmatlar va narxlarni ko‘ring, bo‘sh vaqtni tanlang va onlayn bron qiling.`;
  // OG/Twitter image lives at ./opengraph-image.tsx. We point at it explicitly on
  // the subdomain — Next would otherwise resolve it against the root metadataBase,
  // and /tenant/* there 307-redirects, breaking the link preview.
  const ogImage = { url: `${url}/opengraph-image`, width: 1200, height: 630, alt: title };

  return {
    title: { absolute: `${title} | BOOKUP` },
    description,
    applicationName: b.name,
    alternates: {
      canonical: url,
      languages: { uz: url, ru: `${url}/ru`, en: `${url}/en` },
    },
    openGraph: {
      type: 'website',
      siteName: b.name,
      title,
      description,
      url,
      locale: 'uz_UZ',
      images: [ogImage],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage.url] },
    robots: { index: true, follow: true },
  };
}

export default async function TenantPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenant(subdomain);
  const customerPhone = await getSessionPhone();

  if (!tenant) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Topilmadi</h1>
          <p className="mt-2 text-muted-foreground">Bunday sahifa mavjud emas.</p>
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
      <TenantView tenant={tenant} dict={getTenantDict('uz')} locale="uz" customerPhone={customerPhone} />
    </main>
  );
}
