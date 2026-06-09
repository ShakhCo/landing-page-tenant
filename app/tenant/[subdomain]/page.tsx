import { getTenant } from '@/lib/tenant';
import { TenantView } from './TenantView';

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
