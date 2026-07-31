import { beforeEach, describe, expect, it, vi } from 'vitest';

const jar = { set: vi.fn(), get: vi.fn(), has: vi.fn() };

vi.mock('next/headers', () => ({
  cookies: async () => jar,
  headers: async () => new Headers({ host: 'barber.bookup.uz' }),
}));
vi.mock('@/lib/serverFetch', () => ({
  serverFetch: vi.fn(),
  NETWORK_ERROR_UZ: 'network-error',
}));

import { serverFetch } from '@/lib/serverFetch';
import { cancelBookingAction, submitReviewAction } from './actions';

const fetchMock = vi.mocked(serverFetch);
const res = (status: number, body: unknown = {}) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

const sentBody = () => JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);

beforeEach(() => {
  vi.clearAllMocks();
  jar.get.mockReturnValue(undefined);
});

describe('submitReviewAction', () => {
  it('names the service being reviewed', async () => {
    fetchMock.mockResolvedValue(res(200));

    const result = await submitReviewAction('barber', 'bk-1', 5, 'Zo‘r', {
      offeringId: 'off-1',
      resourceId: 'res-1',
    });

    expect(result).toEqual({ ok: true });
    // Reviews are per service now: the backend rejects a submission that
    // doesn't say which service (and whose staff) is being rated.
    expect(sentBody()).toEqual({
      rating: 5,
      comment: 'Zo‘r',
      offeringId: 'off-1',
      resourceId: 'res-1',
    });
  });

  it('omits an empty comment instead of sending whitespace', async () => {
    fetchMock.mockResolvedValue(res(200));

    await submitReviewAction('barber', 'bk-1', 4, '   ', {
      offeringId: 'off-1',
      resourceId: 'res-1',
    });

    expect(sentBody().comment).toBeUndefined();
  });

  it('reports a rejected review in Uzbek, not raw backend text', async () => {
    fetchMock.mockResolvedValue(res(409, { code: 'REVIEW_ALREADY_SUBMITTED', message: 'dup' }));

    const result = await submitReviewAction('barber', 'bk-1', 5, '', {
      offeringId: 'off-1',
      resourceId: 'res-1',
    });

    expect(result.ok).toBe(false);
    expect((result as { error: string }).error).not.toContain('dup');
  });

  it('survives an unreachable backend', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    expect(
      await submitReviewAction('barber', 'bk-1', 5, '', { offeringId: null, resourceId: null })
    ).toEqual({ ok: false, error: 'network-error' });
  });
});

describe('cancelBookingAction', () => {
  it('explains a booking that has already started', async () => {
    fetchMock.mockResolvedValue(res(409, { code: 'BOOKING_CONFLICT' }));

    const result = await cancelBookingAction('barber', 'bk-1', { code: '12345' });

    expect(result.ok).toBe(false);
    expect((result as { error: string }).error).toBe("Boshlangan bronni bekor qilib bo'lmaydi.");
  });
});
