export type LocalizedText = { uz?: string; ru?: string; en?: string };

export interface PublicTenant {
  business: {
    name: string;
    subdomain: string;
    avatarUrl: string | null;
    currency: string;
    category: { slug: string; name: LocalizedText } | null;
  };
  branches: Array<{
    id: string;
    name: string | null;
    latitude: number;
    longitude: number;
    timezone: string;
    address: LocalizedText | null;
    workingHours: Array<{
      weekday: number;
      isDayOff: boolean;
      openTime: string | null;
      closeTime: string | null;
    }>;
  }>;
  services: Array<{
    id: string;
    name: LocalizedText;
    category: LocalizedText | null;
    pricingMode: string;
    price: number | null;
    durationMinutes: number | null;
    ratePerHour: number | null;
  }>;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://bookup-api.automations.uz';

/** Fetch a tenant's public business + services by subdomain. Null when missing. */
export async function getTenant(subdomain: string): Promise<PublicTenant | null> {
  try {
    const res = await fetch(
      `${API_BASE}/public/tenants/${encodeURIComponent(subdomain)}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    return (await res.json()) as PublicTenant;
  } catch {
    return null;
  }
}

/** Pick a localized string (Uzbek first), with a fallback. */
export function localized(t: LocalizedText | null | undefined, fallback = ''): string {
  if (!t) return fallback;
  return t.uz || t.ru || t.en || fallback;
}
