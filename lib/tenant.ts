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
  staff: Array<{
    id: string;
    name: string;
    type?: string;
    photoUrl: string | null;
    offeringIds: string[];
  }>;
}

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://bookup-api.automations.uz';

export interface AvailabilitySlot {
  start: string;
  startAt: string;
}
export interface AvailabilityResult {
  pricingMode: string;
  durationMinutes: number;
  slots?: AvailabilitySlot[];
}
export interface CreateBookingInput {
  date: string;
  start: string;
  items: { offeringId: string; resourceId: string }[];
  name?: string;
  phone: string;
  code: string;
  note?: string;
}

export interface PublicBookingView {
  business: { name: string; currency: string; timezone: string };
  booking: {
    id: string;
    status: string;
    startAt: string;
    endAt: string | null;
    totalPrice: number | null;
    customer?: {
      type: 'user' | 'guest';
      user: { id: string; fullName: string } | null;
      guest: { name: string; phone: string } | null;
    } | null;
    items: Array<{
      offeringId: string;
      name: LocalizedText | null;
      resourceName: string;
      price: number;
    }>;
  };
}

/** Fetch a single booking's public details by id. Null when missing. */
export async function getBooking(subdomain: string, id: string): Promise<PublicBookingView | null> {
  try {
    const res = await fetch(
      `${API_BASE}/public/tenants/${encodeURIComponent(subdomain)}/bookings/${encodeURIComponent(id)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as PublicBookingView;
    if (!data?.booking?.id) return null;
    return data;
  } catch {
    return null;
  }
}

/** Fetch a tenant's public business + services by subdomain. Null when missing. */
export async function getTenant(subdomain: string): Promise<PublicTenant | null> {
  try {
    const res = await fetch(
      `${API_BASE}/public/tenants/${encodeURIComponent(subdomain)}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<PublicTenant>;
    if (!data || !data.business) return null;
    // Normalize: an older/partial backend may omit arrays — never let the UI
    // read `.length` of undefined.
    return {
      business: data.business,
      branches: Array.isArray(data.branches) ? data.branches : [],
      services: Array.isArray(data.services) ? data.services : [],
      staff: Array.isArray(data.staff) ? data.staff : [],
    };
  } catch {
    return null;
  }
}

/** Pick a localized string (Uzbek first), with a fallback. */
export function localized(t: LocalizedText | null | undefined, fallback = ''): string {
  if (!t) return fallback;
  return t.uz || t.ru || t.en || fallback;
}
