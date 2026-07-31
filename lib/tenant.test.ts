import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./newapi', () => ({ newApiFetch: vi.fn(), NEW_API_ORIGIN: 'https://api.test.local' }));

import { newApiFetch } from './newapi';
import {
  cleanAddress,
  formatBranchAddress,
  getBooking,
  getTenant,
  localized,
  locateBooking,
  mediaUrl,
} from './tenant';

const fetchMock = vi.mocked(newApiFetch);

const json = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

// getTenant remembers confirmed-missing subdomains in module state, so every
// test uses its own name — otherwise one test's 404 would silence the next.
let n = 0;
const uniqueSub = () => `tenant-${Date.now()}-${n++}`;

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe('localized', () => {
  it('prefers the asked-for language and falls back across the others', () => {
    const text = { uz: 'Soch olish', ru: 'Стрижка', en: 'Haircut' };

    expect(localized(text)).toBe('Soch olish'); // Uzbek-first by default
    expect(localized(text, '', 'ru')).toBe('Стрижка');
    expect(localized(text, '', 'en')).toBe('Haircut');

    // A missing translation falls through rather than rendering blank.
    expect(localized({ uz: 'Soch olish' }, '', 'ru')).toBe('Soch olish');
    expect(localized({ ru: 'Стрижка' }, '', 'en')).toBe('Стрижка');
  });

  it('uses the fallback for missing or empty text', () => {
    expect(localized(null, 'Xizmat')).toBe('Xizmat');
    expect(localized({}, 'Xizmat')).toBe('Xizmat');
    expect(localized(undefined, '')).toBe('');
  });
});

describe('cleanAddress', () => {
  it('drops the plus code, postcode and country from a geocoded address', () => {
    const raw = "8736+P98, Rakatboshi ko'chasi, 100031, Toshkent, Toshkent, O'zbekiston";

    // What's left is what a customer needs to find the place.
    expect(cleanAddress(raw)).toBe("Rakatboshi ko'chasi, Toshkent");
  });

  it('de-duplicates parts that differ only by Cyrillic lookalikes, keeping the Latin one', () => {
    // "Тоshkent" (Cyrillic Т and о) and "Toshkent" are the same city typed two
    // ways; the more-Latin spelling wins.
    expect(cleanAddress('Amir Temur, \u0422\u043eshkent, Toshkent')).toBe('Amir Temur, Toshkent');
  });

  it('handles an empty address', () => {
    expect(cleanAddress('')).toBe('');
  });
});

describe('formatBranchAddress', () => {
  it('inserts the district Google leaves out of Tashkent addresses', () => {
    const branch = {
      address: { uz: "Bunyodkor ko'chasi, 100031, Toshkent, O'zbekiston" },
      district: { uz: 'Chilonzor' },
    };

    expect(formatBranchAddress(branch)).toBe("Bunyodkor ko'chasi, Chilonzor, Toshkent");
  });

  it('does not repeat a district the address already names', () => {
    const branch = {
      address: { uz: "Bunyodkor ko'chasi, Chilonzor, Toshkent" },
      district: { uz: 'Chilonzor' },
    };

    expect(formatBranchAddress(branch)).toBe("Bunyodkor ko'chasi, Chilonzor, Toshkent");
  });

  it('falls back to whichever part exists', () => {
    expect(formatBranchAddress({ address: null, district: { uz: 'Chilonzor' } })).toBe('Chilonzor');
    expect(formatBranchAddress({ address: { uz: 'Toshkent' }, district: null })).toBe('Toshkent');
    expect(formatBranchAddress({})).toBe('');
  });

  it('follows the requested locale', () => {
    const branch = {
      address: { uz: 'Bunyodkor, Toshkent', ru: 'Бунёдкор, Ташкент' },
      district: { uz: 'Chilonzor', ru: 'Чиланзар' },
    };

    expect(formatBranchAddress(branch, 'ru')).toContain('Чиланзар');
  });
});

describe('mediaUrl', () => {
  it('resolves a backend-relative upload against the API origin', () => {
    // The API stores "/uploads/…" when its public URL is unset; resolving that
    // against this site would 404 on every avatar.
    expect(mediaUrl('/uploads/a.jpg')).toMatch(/^https?:\/\/.+\/uploads\/a\.jpg$/);
  });

  it('leaves an absolute URL alone', () => {
    expect(mediaUrl('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg');
  });
});

describe('getTenant', () => {
  it('normalizes a partial payload so the UI never reads length of undefined', async () => {
    fetchMock.mockResolvedValue(json(200, { business: { name: 'Barber', subdomain: 'barber' } }));

    const tenant = await getTenant(uniqueSub());

    expect(tenant?.business.name).toBe('Barber');
    expect(tenant?.branches).toEqual([]);
    expect(tenant?.services).toEqual([]);
    expect(tenant?.staff).toEqual([]);
    expect(tenant?.reviews).toEqual([]);
    expect(tenant?.reviewCount).toBe(0);
  });

  it('lowercases the subdomain before asking the backend', async () => {
    fetchMock.mockResolvedValue(json(200, { business: { name: 'Barber' } }));

    await getTenant('BarBer-MiXeD');

    expect(fetchMock).toHaveBeenCalledWith('/public/tenants/barber-mixed');
  });

  it('returns null for a subdomain that does not exist, and stops asking again', async () => {
    const sub = uniqueSub();
    fetchMock.mockResolvedValue(json(404, {}));

    expect(await getTenant(sub)).toBeNull();
    const callsAfterFirst = fetchMock.mock.calls.length;

    expect(await getTenant(sub)).toBeNull();
    // A dead link doing one backend round-trip per hit is exactly what the
    // negative cache exists to prevent.
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
  });

  it('does not remember a transient failure as "missing"', async () => {
    const sub = uniqueSub();
    fetchMock.mockResolvedValueOnce(json(503, {}));
    expect(await getTenant(sub)).toBeNull();

    fetchMock.mockResolvedValueOnce(json(200, { business: { name: 'Barber' } }));
    // A 5xx must not poison the cache — the tenant is real and comes back.
    expect((await getTenant(sub))?.business.name).toBe('Barber');
  });

  it('returns null instead of throwing when the backend is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(getTenant(uniqueSub())).resolves.toBeNull();
  });
});

describe('getBooking', () => {
  it('returns the booking when the payload is complete', async () => {
    fetchMock.mockResolvedValue(
      json(200, { business: { name: 'Barber' }, booking: { id: 'bk-1', items: [] } })
    );

    const view = await getBooking('barber', 'bk-1');
    expect(view?.booking.id).toBe('bk-1');
    expect(fetchMock).toHaveBeenCalledWith('/public/tenants/barber/bookings/bk-1');
  });

  it('treats a payload with no booking as missing', async () => {
    fetchMock.mockResolvedValue(json(200, { business: { name: 'Barber' } }));

    expect(await getBooking('barber', 'bk-2')).toBeNull();
  });

  it('url-encodes what it is given', async () => {
    fetchMock.mockResolvedValue(json(404, {}));

    await getBooking('bar ber', 'a/b');

    expect(fetchMock).toHaveBeenCalledWith('/public/tenants/bar%20ber/bookings/a%2Fb');
  });
});

describe('locateBooking', () => {
  it('resolves a short id to its tenant', async () => {
    fetchMock.mockResolvedValue(json(200, { subdomain: 'barber' }));

    expect(await locateBooking('ABCD1234')).toBe('barber');
  });

  it('is null for an unknown id, and never throws', async () => {
    fetchMock.mockResolvedValueOnce(json(404, {}));
    expect(await locateBooking('NOPE0001')).toBeNull();

    fetchMock.mockRejectedValueOnce(new Error('offline'));
    expect(await locateBooking('NOPE0002')).toBeNull();
  });
});
