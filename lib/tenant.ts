export type LocalizedText = { uz?: string; ru?: string; en?: string };

/** Abort a stalled read so an SSR render can't hang. Client-safe (no next/headers). */
const READ_TIMEOUT_MS = 12_000;

export interface PublicTenant {
  business: {
    name: string;
    subdomain: string;
    avatarUrl: string | null;
    currency: string;
    category: { slug: string; name: LocalizedText } | null;
    /** Optional public contacts — absent until the API exposes them. */
    phone?: string | null;
    telegram?: string | null;
    instagram?: string | null;
    website?: string | null;
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
    /** Localized label for this service's bookable units ("Yo'laklar"); null → generic "Joy". */
    unitLabel?: LocalizedText | null;
    /** Owner-uploaded photo of the service; null/absent = none. */
    photoUrl?: string | null;
  }>;
  staff: Array<{
    id: string;
    name: string;
    type?: string;
    photoUrl: string | null;
    offeringIds: string[];
    /** Confirmed/completed bookings this member has performed; absent on older backends. */
    bookingsCount?: number;
  }>;
}

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://bookup-api.automations.uz';

/**
 * Resolves a backend media URL for <img src>. The API stores relative paths
 * ("/uploads/…") when its APP_PUBLIC_URL is unset — resolve those against the
 * API origin, not this site's.
 */
export function mediaUrl(url: string): string {
  return url.startsWith('/') ? `${API_BASE}${url}` : url;
}

/** Resolve a short booking id to its tenant subdomain; null when unknown/ambiguous. */
export async function locateBooking(shortId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${API_BASE}/public/bookings/${encodeURIComponent(shortId)}/locate`,
      { cache: 'no-store', signal: AbortSignal.timeout(READ_TIMEOUT_MS) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { subdomain?: string };
    return data?.subdomain ?? null;
  } catch {
    return null;
  }
}

export interface AvailabilitySlot {
  start: string;
  startAt: string;
}
export interface AvailabilityResult {
  pricingMode: string;
  durationMinutes?: number;
  slots?: AvailabilitySlot[];
  /** TIME_RATE: booking-range constraints + each resource's free windows. */
  minMinutes?: number;
  stepMinutes?: number;
  resources?: Array<{
    resourceId: string;
    name: string;
    ratePerHour: number;
    free: Array<{ from: string; to: string; fromAt: string; toAt: string }>;
  }>;
}
export interface CreateBookingInput {
  date: string;
  start: string;
  items: { offeringId: string; resourceId: string; start?: string; end?: string }[];
  name?: string;
  /** Omitted for a reschedule or a remembered session. */
  phone?: string;
  /** Omitted when a remembered session is used (no OTP). */
  code?: string;
  note?: string;
  /** Reschedule: the booking being replaced, ignored in conflict checks. */
  rescheduleId?: string;
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
      /** Pre-masked contact ("••• •• 40 20"); absent on older backends. */
      maskedPhone?: string | null;
      user: { id: string; fullName: string } | null;
      guest: { name: string; phone: string } | null;
    } | null;
    items: Array<{
      offeringId: string;
      name: LocalizedText | null;
      /** Booked resource (staff/unit) id — optional in case an older backend omits it. */
      resourceId?: string;
      resourceName: string;
      pricingMode?: string;
      startAt?: string;
      endAt?: string | null;
      price: number;
    }>;
  };
}

/** Fetch a single booking's public details by id. Null when missing. */
export async function getBooking(subdomain: string, id: string): Promise<PublicBookingView | null> {
  try {
    const res = await fetch(
      `${API_BASE}/public/tenants/${encodeURIComponent(subdomain)}/bookings/${encodeURIComponent(id)}`,
      { cache: 'no-store', signal: AbortSignal.timeout(READ_TIMEOUT_MS) },
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
    // Plain cached fetch (no per-request IP forwarding): this is a cacheable
    // read, and calling headers() would force dynamic rendering and defeat the
    // 60s ISR cache. Tenant reads aren't the rate-limit concern (OTP is).
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
