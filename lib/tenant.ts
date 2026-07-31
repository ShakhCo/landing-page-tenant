import { cache } from 'react';
import { newApiFetch } from './newapi';

export type LocalizedText = { uz?: string; ru?: string; en?: string };

/** Languages the public tenant pages support. */
export type TenantLocale = 'uz' | 'ru' | 'en';

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
    district?: LocalizedText | null;
    region?: LocalizedText | null;
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
  averageRating?: number | null;
  reviewCount?: number;
  reviews?: Array<{
    id: string;
    rating: number | null;
    comment: string | null;
    submittedAt: string | null;
    customerName: string;
    services: LocalizedText[];
    servedBy?: string | null;
    servedAt?: string | null;
  }>;
}

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://apis.automations.uz/v1';

/**
 * Resolves a backend media URL for <img src>. The API stores relative paths
 * ("/uploads/…") when its APP_PUBLIC_URL is unset — resolve those against the
 * API origin, not this site's.
 */
export function mediaUrl(url: string): string {
  return url.startsWith('/') ? `${API_BASE}${url}` : url;
}

/** One logical booking in the customer's "my bookings" list. */
export interface MyBooking {
  id: string;
  status: string;
  startAt: string;
  endAt: string | null;
  totalPrice: number | null;
  items: Array<{
    name: LocalizedText | null;
    resourceName: string;
    startAt: string;
    price: number;
  }>;
}
export interface MyBookingsResult {
  business: { name: string; currency: string; timezone: string };
  bookings: MyBooking[];
}

/** Resolve a short booking id to its tenant subdomain; null when unknown/ambiguous. */
export const locateBooking = cache(async function locateBooking(shortId: string): Promise<string | null> {
  try {
    const res = await newApiFetch(
      `/public/bookings/${encodeURIComponent(shortId)}/locate`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { subdomain?: string };
    return data?.subdomain ?? null;
  } catch {
    return null;
  }
});

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
    /** Per-service reviews — one per service whose staff enabled reviews. Join
     *  each to an item by (offeringId, resourceId) for the service + staff name. */
    reviews?: Array<{
      offeringId: string | null;
      resourceId: string | null;
      submitted: boolean;
      rating: number | null;
      comment: string | null;
      submittedAt: string | null;
    }>;
  };
}

/** Fetch a single booking's public details by id. Null when missing. */
export const getBooking = cache(async function getBooking(subdomain: string, id: string): Promise<PublicBookingView | null> {
  try {
    const res = await newApiFetch(
      `/public/tenants/${encodeURIComponent(subdomain)}/bookings/${encodeURIComponent(id)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as PublicBookingView;
    if (!data?.booking?.id) return null;
    return data;
  } catch {
    return null;
  }
});

// Negative cache of confirmed-missing subdomains (outcome only — never a list).
// A fake subdomain that 404s is remembered briefly so repeat hits (and the
// page + OG image of the same junk request) skip the backend entirely. Bounds
// the "many users hit the same dead link" case; the IP jail bounds the
// "one IP enumerates many names" case.
const MISSING_TTL_MS = 10 * 60_000;
const MISSING_MAX = 50_000;
const missingTenants = new Map<string, number>(); // subdomain -> expiresAt

function isKnownMissing(sub: string): boolean {
  const until = missingTenants.get(sub);
  if (until === undefined) return false;
  if (Date.now() >= until) {
    missingTenants.delete(sub);
    return false;
  }
  return true;
}

function rememberMissing(sub: string): void {
  if (missingTenants.size > MISSING_MAX) {
    const now = Date.now();
    for (const [k, exp] of missingTenants) if (now >= exp) missingTenants.delete(k);
    if (missingTenants.size > MISSING_MAX) missingTenants.clear();
  }
  missingTenants.set(sub, Date.now() + MISSING_TTL_MS);
}

/** Fetch a tenant's public business + services by subdomain. Null when missing. */
export const getTenant = cache(async function getTenant(subdomain: string): Promise<PublicTenant | null> {
  const sub = subdomain.toLowerCase();
  // Negative cache: recently confirmed missing → no backend round-trip.
  if (isKnownMissing(sub)) return null;
  try {
    // Signed read from the Workers backend; its own 60s edge cache does
    // the caching (Next's data cache can't, since signatures vary).
    const res = await newApiFetch(`/public/tenants/${encodeURIComponent(sub)}`);
    if (res.status === 404) {
      rememberMissing(sub); // definitively absent — cache the negative outcome
      return null;
    }
    if (!res.ok) return null; // transient (5xx/timeout) — don't poison the cache
    const data = (await res.json()) as Partial<PublicTenant>;
    if (!data || !data.business) {
      rememberMissing(sub);
      return null;
    }
    // Normalize: an older/partial backend may omit arrays — never let the UI
    // read `.length` of undefined.
    return {
      business: data.business,
      branches: Array.isArray(data.branches) ? data.branches : [],
      services: Array.isArray(data.services) ? data.services : [],
      staff: Array.isArray(data.staff) ? data.staff : [],
      averageRating: data.averageRating ?? null,
      reviewCount: data.reviewCount ?? 0,
      reviews: Array.isArray(data.reviews) ? data.reviews : [],
    };
  } catch {
    return null;
  }
});

/**
 * Pick a localized string for `locale`, falling back across the other languages
 * (then to `fallback`). Defaults to Uzbek-first so existing callers are unchanged.
 */
export function localized(
  t: LocalizedText | null | undefined,
  fallback = '',
  locale: TenantLocale = 'uz',
): string {
  if (!t) return fallback;
  if (locale === 'ru') return t.ru || t.uz || t.en || fallback;
  if (locale === 'en') return t.en || t.uz || t.ru || fallback;
  return t.uz || t.ru || t.en || fallback;
}

// Cyrillic letters that look identical to a Latin one (Тоshkent vs Toshkent).
const CYRILLIC_LOOKALIKE: Record<string, string> = {
  а: 'a', в: 'b', е: 'e', к: 'k', м: 'm', н: 'h', о: 'o',
  р: 'p', с: 'c', т: 't', у: 'y', х: 'x',
};
const lookalikeKey = (s: string) =>
  s.toLowerCase().replace(/[а-я]/g, (ch) => CYRILLIC_LOOKALIKE[ch] ?? ch);
const cyrillicCount = (s: string) => (s.match(/[а-яё]/gi) ?? []).length;

// Trims a raw geocoded address ("8736+P98, Rakatboshi ko'chasi, 100031,
// Toshkent, Toshkent, O'zbekiston") down to "street, district, city": drops the
// Plus Code, postal code, and country, and de-duplicates repeated parts —
// including ones that differ only by Cyrillic/Latin lookalikes, preferring the
// more-Latin spelling.
export function cleanAddress(full: string): string {
  if (!full) return '';
  const parts = full
    .split(',')
    .map((p) => p.trim())
    .filter(
      (p) =>
        !!p &&
        !p.includes('+') && // Plus Code, e.g. 8736+P98
        !/^\d{3,6}$/.test(p) && // postal code, e.g. 100031
        !/^(o['’ʻ`]?zbekiston|uzbekistan|узбекистан)$/i.test(p), // country
    );
  const chosen = new Map<string, string>();
  const order: string[] = [];
  for (const p of parts) {
    const key = lookalikeKey(p);
    const prev = chosen.get(key);
    if (prev === undefined) {
      chosen.set(key, p);
      order.push(key);
    } else if (cyrillicCount(p) < cyrillicCount(prev)) {
      chosen.set(key, p); // keep the more-Latin variant
    }
  }
  return order.map((k) => chosen.get(k)!).join(', ');
}

// Branch address for display: "street, district, city". Uses the cleaned
// formatted address for street + city, and inserts the branch's district (tuman)
// between them — Google's formatted address omits it for Tashkent, but it's
// stored on the branch. Skips the district if it's already in the string.
export function formatBranchAddress(
  branch: { address?: LocalizedText | null; district?: LocalizedText | null },
  locale: TenantLocale = 'uz',
): string {
  const cleaned = cleanAddress(localized(branch.address ?? null, '', locale));
  const district = localized(branch.district ?? null, '', locale);
  if (!district) return cleaned;
  if (!cleaned) return district;
  const parts = cleaned.split(', ');
  const dKey = lookalikeKey(district);
  if (parts.some((p) => lookalikeKey(p) === dKey)) return cleaned; // already present
  const street = parts[0];
  const city = parts[parts.length - 1];
  return street === city
    ? `${street}, ${district}`
    : `${street}, ${district}, ${city}`;
}
