import type { Metadata } from 'next';
import { getTenant, localized } from '@/lib/tenant';
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
  const description = `${b.name}${bits ? ` · ${bits}` : ''}. Xizmatlar va narxlarni ko‘ring, bo‘sh vaqtni tanlang va onlayn bron qiling. Онлайн запись · Online booking.`;
  const images = [{ url: b.avatarUrl ?? 'https://bookup.uz/og.jpg' }];

  return {
    title: { absolute: `${title} | Bookup` },
    description,
    applicationName: b.name,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: b.name,
      title,
      description,
      url,
      locale: 'uz_UZ',
      alternateLocale: ['ru_RU', 'en_US'],
      images,
    },
    twitter: { card: b.avatarUrl ? 'summary' : 'summary_large_image', title, description, images: [b.avatarUrl ?? 'https://bookup.uz/og.jpg'] },
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
      <TenantView tenant={tenant} />
    </main>
  );
}
