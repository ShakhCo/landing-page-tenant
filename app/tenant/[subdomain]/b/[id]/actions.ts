'use server';

import { cookies, headers } from 'next/headers';
import { API_BASE } from '@/lib/tenant';
import { serverFetch, NETWORK_ERROR_UZ } from '@/lib/serverFetch';

const SESSION_COOKIE = 'bookup_session';

/** Map a backend error code to a friendly Uzbek message (never raw text). */
function mapErrorCode(code: string): string {
  const map: Record<string, string> = {
    BOOKING_NOT_FOUND: "Bron topilmadi.",
    REVIEW_ALREADY_SUBMITTED: "Siz allaqachon baholagan edingiz.",
    INVALID_REVIEW: "Sharhni yuborib bo'lmadi. Iltimos, qaytadan urinib ko'ring.",
    BUSINESS_NOT_FOUND: 'Biznes topilmadi.',
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

/**
 * Clear the session cookie with the SAME domain/path it was set with
 * (`.bookup.uz` in prod) — a bare delete(name) doesn't match the scoped cookie,
 * so the browser would keep the stale session and loop on INVALID_SESSION.
 */
async function clearSession(jar: Awaited<ReturnType<typeof cookies>>) {
  const host = (await headers()).get('host') ?? '';
  const onBookup = host === 'bookup.uz' || host.endsWith('.bookup.uz');
  jar.delete({ name: SESSION_COOKIE, path: '/', ...(onBookup ? { domain: '.bookup.uz' } : {}) });
}

/**
 * Send the cancel-confirmation OTP to the booking's own phone (server-resolved,
 * never exposed). Returns the masked number for the "code sent to …40 20" line.
 */
export async function requestCancelOtpAction(
  subdomain: string,
  id: string,
  turnstileToken?: string | null,
): Promise<{ ok: true; maskedPhone: string } | { ok: false; error: string }> {
  try {
    const res = await serverFetch(
      `${API_BASE}/public/tenants/${encodeURIComponent(subdomain)}/bookings/${encodeURIComponent(id)}/cancel/otp`,
      {
        method: 'POST',
        cache: 'no-store',
        ...(turnstileToken ? { headers: { 'cf-turnstile-response': turnstileToken } } : {}),
      },
    );
    if (!res.ok) {
      let code = '';
      try {
        code = (await res.json())?.code ?? '';
      } catch {
        /* ignore */
      }
      return {
        ok: false,
        error:
          code === 'TOO_MANY_OTP_REQUESTS'
            ? "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring."
            : "Kod yuborishda xatolik. Qayta urinib ko'ring.",
      };
    }
    const body = (await res.json()) as { maskedPhone?: string };
    return { ok: true, maskedPhone: body.maskedPhone ?? '•••' };
  } catch {
    return { ok: false, error: NETWORK_ERROR_UZ };
  }
}

/**
 * Cancel a booking. Identity comes from the remembered-customer cookie when
 * present, else the OTP `code` confirmed against the booking's phone.
 * `reason` is optional customer feedback.
 */
export async function cancelBookingAction(
  subdomain: string,
  id: string,
  opts: { reason?: string; code?: string } = {},
): Promise<{ ok: true } | { ok: false; error: string; needsOtp?: boolean; otpExhausted?: boolean }> {
  const jar = await cookies();
  const sessionToken = opts.code ? undefined : jar.get(SESSION_COOKIE)?.value;
  let res: Response;
  try {
    res = await serverFetch(
      `${API_BASE}/public/tenants/${encodeURIComponent(subdomain)}/bookings/${encodeURIComponent(id)}/cancel`,
      {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(opts.reason ? { reason: opts.reason } : {}),
          ...(opts.code ? { code: opts.code } : {}),
          ...(sessionToken ? { sessionToken } : {}),
        }),
      },
    );
  } catch {
    return { ok: false, error: NETWORK_ERROR_UZ };
  }
  if (res.ok) return { ok: true };

  let code = '';
  try {
    code = (await res.json())?.code ?? '';
  } catch {
    /* ignore */
  }
  // Stale/expired session, or a session that doesn't own this booking → the UI
  // must fall back to the OTP path (the cookie is cleared so we don't loop).
  if (code === 'INVALID_SESSION' || code === 'FORBIDDEN') {
    if (sessionToken) await clearSession(jar);
    return { ok: false, error: '', needsOtp: true };
  }
  if (code === 'TOO_MANY_OTP_ATTEMPTS') {
    return { ok: false, error: "Juda ko'p noto'g'ri urinish. Yangi kod so'rang.", otpExhausted: true };
  }
  const map: Record<string, string> = {
    INVALID_OR_EXPIRED_CODE: "Kod noto'g'ri yoki eskirgan.",
    INVALID_BOOKING: "Bu bronni bekor qilib bo'lmaydi.",
    BOOKING_CONFLICT: "Boshlangan bronni bekor qilib bo'lmaydi.",
    BUSINESS_NOT_FOUND: 'Biznes topilmadi.',
  };
  return { ok: false, error: map[code] || "Bekor qilishda xatolik. Qayta urinib ko'ring." };
}

export async function submitReviewAction(
  subdomain: string,
  bookingId: string,
  rating: number,
  comment: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await serverFetch(
      `${API_BASE}/public/tenants/${encodeURIComponent(subdomain)}/bookings/${encodeURIComponent(bookingId)}/review`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      },
    );
    if (!res.ok) return { ok: false, error: await errorMessage(res) };
    return { ok: true };
  } catch {
    return { ok: false, error: NETWORK_ERROR_UZ };
  }
}
