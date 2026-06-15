import { cookies } from 'next/headers';

// Must match the cookie the booking flow sets (booking/actions.ts).
const SESSION_COOKIE = 'bookup_session';

/** "+998901234567" → "+998 90 858 02 04"; returns the input as-is otherwise. */
function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (!d.startsWith('998') || d.length !== 12) return phone;
  const l = d.slice(3);
  return `+998 ${l.slice(0, 2)} ${l.slice(2, 5)} ${l.slice(5, 7)} ${l.slice(7, 9)}`;
}

export interface SessionInfo {
  /** Customer user id (JWT `sub`). */
  userId: string;
  /** Their phone, formatted for display ("+998 90 858 02 04"). */
  phone: string | null;
}

/**
 * Decode the booking-session JWT (NEVER verified — display only; every
 * privileged call re-verifies server-side). Returns the customer's user id and
 * formatted phone, or null when there's no session.
 */
export async function getSession(): Promise<SessionInfo | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: string;
      phone?: string;
    };
    if (!claims.sub) return null;
    return { userId: claims.sub, phone: claims.phone ? formatPhone(claims.phone) : null };
  } catch {
    return null;
  }
}

/** The logged-in customer's phone, formatted for display — or null. */
export async function getSessionPhone(): Promise<string | null> {
  return (await getSession())?.phone ?? null;
}
