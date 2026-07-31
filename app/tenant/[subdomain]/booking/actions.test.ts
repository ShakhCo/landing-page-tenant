import { beforeEach, describe, expect, it, vi } from 'vitest';

// next/headers only exists inside a request; these stand in for the cookie jar
// and the Host header the actions read.
const jar = {
  store: new Map<string, string>(),
  set: vi.fn(),
  get: vi.fn(),
  has: vi.fn(),
};
let host = 'barber.bookup.uz';

vi.mock('next/headers', () => ({
  cookies: async () => jar,
  headers: async () => new Headers({ host }),
}));
vi.mock('@/lib/serverFetch', () => ({
  serverFetch: vi.fn(),
  NETWORK_ERROR_UZ: 'network-error',
}));

import { serverFetch } from '@/lib/serverFetch';
import {
  createBookingAction,
  hasSessionAction,
  loginAction,
  logoutAction,
  myBookingsAction,
  requestOtpAction,
} from './actions';

const fetchMock = vi.mocked(serverFetch);
const res = (status: number, body: unknown = {}) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

const bookingInput = {
  date: '2026-08-15',
  start: '10:00',
  items: [{ offeringId: 'off-1', resourceId: 'res-1' }],
  phone: '+998901112233',
  code: '12345',
};

/** The options a cookie was written with. */
const cookieCall = (name: string) =>
  jar.set.mock.calls.find(([n]) => n === name) as [string, string, Record<string, unknown>];

beforeEach(() => {
  vi.clearAllMocks();
  host = 'barber.bookup.uz';
  jar.get.mockReturnValue(undefined);
  jar.has.mockReturnValue(false);
});

describe('createBookingAction', () => {
  it('books, and remembers the customer across every tenant', async () => {
    fetchMock.mockResolvedValue(res(200, { id: 'bk-1', sessionToken: 'jwt-token' }));

    const result = await createBookingAction('barber', bookingInput);

    expect(result).toEqual({ ok: true, id: 'bk-1' });
    const [, value, opts] = cookieCall('bookup_session');
    expect(value).toBe('jwt-token');
    // Domain-wide, so the next tenant's site knows them too.
    expect(opts).toMatchObject({ domain: '.bookup.uz', httpOnly: true, secure: true, path: '/' });
  });

  it('sends the remembered session so a returning customer needs no code', async () => {
    jar.get.mockReturnValue({ value: 'jwt-token' });
    fetchMock.mockResolvedValue(res(200, { id: 'bk-2' }));

    await createBookingAction('barber', { ...bookingInput, code: undefined, phone: undefined });

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.sessionToken).toBe('jwt-token');
  });

  it('clears a rejected session and asks the UI to fall back to a code', async () => {
    jar.get.mockReturnValue({ value: 'stale-token' });
    fetchMock.mockResolvedValue(res(401, { code: 'INVALID_SESSION' }));

    const result = await createBookingAction('barber', bookingInput);

    expect(result).toMatchObject({ ok: false, needsOtp: true });
    // Cleared with the SAME domain it was set with — a bare delete can't match
    // a `.bookup.uz`-scoped cookie, and the flow would loop on INVALID_SESSION.
    const [, value, opts] = cookieCall('bookup_session');
    expect(value).toBe('');
    expect(opts).toMatchObject({ domain: '.bookup.uz', maxAge: 0 });
  });

  it('flags a locked code so the customer is offered a fresh one', async () => {
    fetchMock.mockResolvedValue(res(429, { code: 'TOO_MANY_OTP_ATTEMPTS' }));

    const result = await createBookingAction('barber', bookingInput);

    expect(result).toMatchObject({ ok: false, otpExhausted: true });
    expect((result as { error: string }).error).toContain('kod');
  });

  it('translates a clash instead of leaking the backend wording', async () => {
    fetchMock.mockResolvedValue(res(409, { code: 'BOOKING_CONFLICT', message: 'slot taken' }));

    const result = await createBookingAction('barber', bookingInput);

    expect(result).toMatchObject({ ok: false, code: 'BOOKING_CONFLICT' });
    expect((result as { error: string }).error).toBe(
      'Bu vaqt allaqachon band — iltimos, boshqa vaqtni tanlang.'
    );
  });

  it('falls back to a generic message for an unknown code', async () => {
    fetchMock.mockResolvedValue(res(500, { code: 'SOMETHING_NEW' }));

    const result = await createBookingAction('barber', bookingInput);

    expect((result as { error: string }).error).toMatch(/Xatolik yuz berdi/);
  });

  it('survives an unreachable backend', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    expect(await createBookingAction('barber', bookingInput)).toEqual({
      ok: false,
      error: 'network-error',
    });
  });
});

describe('the session cookie', () => {
  it('is host-only and insecure on localhost, so dev over http still works', async () => {
    host = 'localhost:3000';
    fetchMock.mockResolvedValue(res(200, { sessionToken: 'jwt-token' }));

    await loginAction('+998901112233', '12345');

    const [, , opts] = cookieCall('bookup_session');
    expect(opts.domain).toBeUndefined();
    expect(opts.secure).toBe(false);
  });

  it('is expired on logout', async () => {
    await logoutAction();

    const [, value, opts] = cookieCall('bookup_session');
    expect(value).toBe('');
    expect(opts).toMatchObject({ maxAge: 0, domain: '.bookup.uz' });
  });

  it('is reported present or absent without being read', async () => {
    jar.has.mockReturnValue(true);
    expect(await hasSessionAction()).toBe(true);
  });
});

describe('loginAction', () => {
  it('refuses a response with no token rather than claiming success', async () => {
    fetchMock.mockResolvedValue(res(200, {}));

    expect(await loginAction('+998901112233', '12345')).toEqual({
      ok: false,
      error: 'network-error',
    });
    expect(jar.set).not.toHaveBeenCalled();
  });

  it('translates a wrong code', async () => {
    fetchMock.mockResolvedValue(res(400, { code: 'INVALID_OR_EXPIRED_CODE' }));

    const result = await loginAction('+998901112233', '00000');
    expect((result as { error: string }).error).toMatch(/Kod noto/);
  });
});

describe('requestOtpAction', () => {
  it('passes the purpose through and reports whether this is a new customer', async () => {
    fetchMock.mockResolvedValue(res(200, { isNewCustomer: false }));

    expect(await requestOtpAction('+998901112233', 'login')).toEqual({
      ok: true,
      isNewCustomer: false,
    });
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toEqual({ phone: '+998901112233', purpose: 'login' });
  });

  it('assumes a new customer when the backend does not say', async () => {
    fetchMock.mockResolvedValue(res(200, {}));

    // Better to ask for a name that isn't needed than to book one without it.
    expect(await requestOtpAction('+998901112233')).toEqual({ ok: true, isNewCustomer: true });
  });
});

describe('myBookingsAction', () => {
  it('asks for a login when there is no session at all', async () => {
    expect(await myBookingsAction('barber')).toEqual({ ok: false, needsLogin: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns the customer\'s bookings', async () => {
    jar.get.mockReturnValue({ value: 'jwt-token' });
    fetchMock.mockResolvedValue(res(200, { business: { name: 'Barber' }, bookings: [] }));

    const result = await myBookingsAction('barber');
    expect(result).toMatchObject({ ok: true });
  });

  it('clears a session the backend rejects, so the page stops pretending to be logged in', async () => {
    jar.get.mockReturnValue({ value: 'stale-token' });
    fetchMock.mockResolvedValue(res(401, {}));

    expect(await myBookingsAction('barber')).toEqual({ ok: false, needsLogin: true });
    const [, value, opts] = cookieCall('bookup_session');
    expect(value).toBe('');
    expect(opts).toMatchObject({ maxAge: 0 });
  });
});
