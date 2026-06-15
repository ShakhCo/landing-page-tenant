'use server';

import { cookies, headers } from 'next/headers';
import { API_BASE, type AvailabilityResult, type CreateBookingInput } from '@/lib/tenant';
import { serverFetch, NETWORK_ERROR_UZ } from '@/lib/serverFetch';

/** "Remember me" session cookie, scoped to all *.bookup.uz subdomains. */
const SESSION_COOKIE = 'bookup_session';

/** Map a backend error code to a friendly Uzbek message (never raw text). */
function mapErrorCode(code: string): string {
  const map: Record<string, string> = {
    BOOKING_CONFLICT: "Bu vaqt allaqachon band — iltimos, boshqa vaqtni tanlang.",
    INVALID_BOOKING: "Bron qilib bo'lmadi. Iltimos, ma'lumotlarni tekshiring.",
    INVALID_OR_EXPIRED_CODE: "Kod noto'g'ri yoki muddati o'tgan. Qaytadan urinib ko'ring.",
    TOO_MANY_OTP_ATTEMPTS: "Juda ko'p marta noto'g'ri kod kiritildi. Iltimos, yangi kod so'rang.",
    TOO_MANY_OTP_REQUESTS: "Juda ko'p urinish bo'ldi. Bir necha daqiqadan so'ng qayta urinib ko'ring.",
    TOO_MANY_REQUESTS: "Juda ko'p so'rov yuborildi. Iltimos, bir daqiqa kutib turing.",
    INVALID_PHONE_NUMBER: "Telefon raqami noto'g'ri. Iltimos, tekshirib qayta kiriting.",
    CODE_REQUIRED: "Tasdiqlash kodini kiriting.",
    BOOKING_NOT_FOUND: "Bron topilmadi. Sahifani yangilab qayta urinib ko'ring.",
    BUSINESS_NOT_FOUND: "Biznes topilmadi.",
    BRANCH_NOT_FOUND: "Filial topilmadi.",
    OFFERING_NOT_FOUND: "Tanlangan xizmat hozir mavjud emas.",
    RESOURCE_NOT_FOUND: "Tanlangan mutaxassis yoki resurs mavjud emas.",
  };
  return map[code] || "Xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.";
}

/** Read the backend error code + a friendly message from a failed response. */
async function readError(res: Response): Promise<{ code: string; message: string }> {
  let code = '';
  try {
    code = (await res.json())?.code ?? '';
  } catch {
    /* ignore */
  }
  return { code, message: mapErrorCode(code) };
}
async function errorMessage(res: Response): Promise<string> {
  return (await readError(res)).message;
}

/** Cookie options: domain-wide on bookup.uz, host-only on localhost (http dev). */
async function sessionCookieOpts() {
  const host = (await headers()).get('host') ?? '';
  const onBookup = host === 'bookup.uz' || host.endsWith('.bookup.uz');
  return {
    httpOnly: true,
    secure: onBookup,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days — matches the backend token TTL
    ...(onBookup ? { domain: '.bookup.uz' } : {}),
  };
}

export async function getAvailabilityAction(
  subdomain: string,
  date: string,
  offeringIds: string[],
  resourceId: string,
  excludeBookingId?: string,
): Promise<{ ok: true; data: AvailabilityResult } | { ok: false; error: string }> {
  const qs = new URLSearchParams({ date, offeringIds: offeringIds.join(','), resourceId });
  if (excludeBookingId) qs.set('excludeBookingId', excludeBookingId);
  try {
    const res = await serverFetch(`${API_BASE}/public/tenants/${encodeURIComponent(subdomain)}/availability?${qs}`, {
      cache: 'no-store',
    });
    if (!res.ok) return { ok: false, error: await errorMessage(res) };
    return { ok: true, data: (await res.json()) as AvailabilityResult };
  } catch {
    return { ok: false, error: NETWORK_ERROR_UZ };
  }
}

/** Verify an OTP and start a remembered customer session (standalone login). */
export async function loginAction(
  phone: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await serverFetch(`${API_BASE}/public/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    if (!res.ok) return { ok: false, error: await errorMessage(res) };
    const body = (await res.json().catch(() => ({}))) as { sessionToken?: string };
    if (!body.sessionToken) return { ok: false, error: NETWORK_ERROR_UZ };
    (await cookies()).set(SESSION_COOKIE, body.sessionToken, await sessionCookieOpts());
    return { ok: true };
  } catch {
    return { ok: false, error: NETWORK_ERROR_UZ };
  }
}

/** Clear the remembered customer session (log out). Expires the domain cookie. */
export async function logoutAction(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, '', { ...(await sessionCookieOpts()), maxAge: 0 });
}

export async function requestOtpAction(
  phone: string,
  purpose?: 'login' | 'booking',
): Promise<{ ok: true; isNewCustomer: boolean } | { ok: false; error: string }> {
  try {
    const res = await serverFetch(`${API_BASE}/public/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, purpose }),
    });
    if (!res.ok) return { ok: false, error: await errorMessage(res) };
    const body = (await res.json().catch(() => ({}))) as { isNewCustomer?: boolean };
    // Unknown (older backend) → treat as new so we still ask for a name.
    return { ok: true, isNewCustomer: body.isNewCustomer ?? true };
  } catch {
    return { ok: false, error: NETWORK_ERROR_UZ };
  }
}

export async function requestRescheduleOtpAction(
  subdomain: string,
  bookingId: string,
): Promise<{ ok: true; maskedPhone: string } | { ok: false; error: string }> {
  try {
    const res = await serverFetch(
      `${API_BASE}/public/tenants/${encodeURIComponent(subdomain)}/bookings/${encodeURIComponent(bookingId)}/reschedule/otp`,
      { method: 'POST', cache: 'no-store' },
    );
    if (!res.ok) return { ok: false, error: await errorMessage(res) };
    const body = (await res.json().catch(() => ({}))) as { maskedPhone?: string };
    return { ok: true, maskedPhone: body.maskedPhone ?? '' };
  } catch {
    return { ok: false, error: NETWORK_ERROR_UZ };
  }
}

export async function createBookingAction(
  subdomain: string,
  input: CreateBookingInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string; needsOtp?: boolean; otpExhausted?: boolean }> {
  const jar = await cookies();
  // Reschedule keeps its OTP-to-original-phone path; the remembered session is
  // for normal one-tap bookings (and reschedules) by the same customer.
  const sessionToken = jar.get(SESSION_COOKIE)?.value;

  let res: Response;
  try {
    res = await serverFetch(`${API_BASE}/public/tenants/${encodeURIComponent(subdomain)}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, sessionToken }),
    });
  } catch {
    return { ok: false, error: NETWORK_ERROR_UZ };
  }

  if (!res.ok) {
    const { code, message } = await readError(res);
    // Stale/expired session → clear it and tell the UI to fall back to OTP.
    if (code === 'INVALID_SESSION') {
      jar.delete(SESSION_COOKIE);
      return { ok: false, error: message, needsOtp: true };
    }
    // Code locked after too many wrong guesses → the UI must reset it and let
    // the customer request a fresh code.
    if (code === 'TOO_MANY_OTP_ATTEMPTS') {
      return { ok: false, error: message, otpExhausted: true };
    }
    return { ok: false, error: message };
  }

  const body = (await res.json().catch(() => ({}))) as { id?: string; sessionToken?: string };
  // Remember the customer (sliding 30-day window) across all *.bookup.uz tenants.
  if (body.sessionToken) {
    jar.set(SESSION_COOKIE, body.sessionToken, await sessionCookieOpts());
  }
  return { ok: true, id: body.id ?? '' };
}

/** True when a remembered customer session cookie is present (read-only check). */
export async function hasSessionAction(): Promise<boolean> {
  return (await cookies()).has(SESSION_COOKIE);
}
