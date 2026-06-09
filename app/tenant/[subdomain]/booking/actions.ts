'use server';

import { API_BASE, type AvailabilityResult, type CreateBookingInput } from '@/lib/tenant';

/** Map a backend error body to a user-facing Uzbek message. */
async function errorMessage(res: Response): Promise<string> {
  let code = '';
  let message = '';
  try {
    const body = await res.json();
    code = body?.code ?? '';
    message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message ?? '';
  } catch {
    /* ignore */
  }
  const map: Record<string, string> = {
    BOOKING_CONFLICT: "Bu vaqt allaqachon band — boshqasini tanlang.",
    INVALID_BOOKING: "Bandlikni yaratib bo'lmadi — ma'lumotlarni tekshiring.",
    INVALID_OR_EXPIRED_CODE: "Kod noto'g'ri yoki muddati o'tgan.",
    TOO_MANY_OTP_REQUESTS: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring.",
    INVALID_PHONE_NUMBER: "To'g'ri telefon raqamini kiriting.",
    CODE_REQUIRED: "Tasdiqlash kodini kiriting.",
  };
  return map[code] || message || "Xatolik yuz berdi. Qayta urinib ko'ring.";
}

export async function getAvailabilityAction(
  subdomain: string,
  date: string,
  offeringIds: string[],
  resourceId: string,
): Promise<{ ok: true; data: AvailabilityResult } | { ok: false; error: string }> {
  const qs = new URLSearchParams({ date, offeringIds: offeringIds.join(','), resourceId });
  const res = await fetch(`${API_BASE}/public/tenants/${subdomain}/availability?${qs}`, {
    cache: 'no-store',
  });
  if (!res.ok) return { ok: false, error: await errorMessage(res) };
  return { ok: true, data: (await res.json()) as AvailabilityResult };
}

export async function requestOtpAction(
  phone: string,
): Promise<{ ok: true; isNewCustomer: boolean } | { ok: false; error: string }> {
  const res = await fetch(`${API_BASE}/public/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) return { ok: false, error: await errorMessage(res) };
  const body = (await res.json().catch(() => ({}))) as { isNewCustomer?: boolean };
  // Unknown (older backend) → treat as new so we still ask for a name.
  return { ok: true, isNewCustomer: body.isNewCustomer ?? true };
}

export async function createBookingAction(
  subdomain: string,
  input: CreateBookingInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(`${API_BASE}/public/tenants/${subdomain}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) return { ok: false, error: await errorMessage(res) };
  return { ok: true };
}
