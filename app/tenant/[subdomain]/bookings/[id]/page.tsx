import { permanentRedirect } from 'next/navigation';

/** Legacy path — the booking page moved to /b/[id]; old shared links live on. */
export default async function LegacyBookingRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === 'string') qs.set(k, v);
  }
  const q = qs.toString();
  permanentRedirect(`/b/${encodeURIComponent(id)}${q ? `?${q}` : ''}`);
}
