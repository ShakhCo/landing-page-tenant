'use server';

import { API_BASE } from '@/lib/tenant';

/** Cancel a booking from its public link (no OTP — possession of the id authorizes it). */
export async function cancelBookingAction(
  subdomain: string,
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(
    `${API_BASE}/public/tenants/${encodeURIComponent(subdomain)}/bookings/${encodeURIComponent(id)}/cancel`,
    { method: 'POST', cache: 'no-store' },
  );
  if (res.ok) return { ok: true };

  let code = '';
  try {
    code = (await res.json())?.code ?? '';
  } catch {
    /* ignore */
  }
  const map: Record<string, string> = {
    INVALID_BOOKING: "Bu bandlikni bekor qilib bo'lmaydi.",
    BOOKING_CONFLICT: "Boshlangan bandlikni bekor qilib bo'lmaydi.",
    BUSINESS_NOT_FOUND: 'Biznes topilmadi.',
  };
  return { ok: false, error: map[code] || "Bekor qilishda xatolik. Qayta urinib ko'ring." };
}
