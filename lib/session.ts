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

/**
 * The logged-in customer's phone (from the booking-session JWT), formatted for
 * display — or null when there's no session. The token is only DECODED, never
 * verified: it's used purely to show "who's signed in", never for authorization
 * (every privileged call still re-verifies the token server-side).
 */
export async function getSessionPhone(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      phone?: string;
    };
    return claims.phone ? formatPhone(claims.phone) : null;
  } catch {
    return null;
  }
}
