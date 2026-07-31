// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));
vi.mock('./actions', () => ({
  getAvailabilityAction: vi.fn(),
  createBookingAction: vi.fn(),
  requestOtpAction: vi.fn(),
  requestRescheduleOtpAction: vi.fn(),
}));

import {
  createBookingAction,
  getAvailabilityAction,
  requestOtpAction,
} from './actions';
import { BOOKING_DICTS } from '@/lib/dictionaries/booking';
import type { PublicTenant } from '@/lib/tenant';
import { BookingFlow } from './BookingFlow';

const dict = BOOKING_DICTS.uz;
const getAvailability = vi.mocked(getAvailabilityAction);
const createBooking = vi.mocked(createBookingAction);
const requestOtp = vi.mocked(requestOtpAction);

const TZ = 'Asia/Tashkent';

const service = (id: string, name: string, patch: Record<string, unknown> = {}) => ({
  id,
  name: { uz: name },
  category: null,
  pricingMode: 'fixed',
  price: 50_000,
  durationMinutes: 30,
  ratePerHour: null,
  ...patch,
});

const member = (id: string, name: string, offeringIds: string[]) => ({
  id,
  name,
  photoUrl: null,
  offeringIds,
});

const tenant = (patch: Partial<PublicTenant> = {}): PublicTenant =>
  ({
    business: {
      name: 'Barber',
      subdomain: 'barber',
      avatarUrl: null,
      currency: 'UZS',
      category: null,
    },
    branches: [
      {
        id: 'branch-1',
        name: null,
        latitude: 41.31,
        longitude: 69.24,
        timezone: TZ,
        address: null,
        workingHours: [],
      },
    ],
    services: [service('off-cut', 'Soch olish'), service('off-beard', 'Soqol')],
    staff: [member('res-a', 'Aziz', ['off-cut', 'off-beard'])],
    ...patch,
  }) as PublicTenant;

/** Availability answer for the fixed-price path. */
const slotsAt = (...starts: string[]) => ({
  ok: true as const,
  data: {
    pricingMode: 'fixed',
    durationMinutes: 30,
    slots: starts.map((start) => ({ start, startAt: `2026-08-15T${start}:00.000+05:00` })),
  },
});

function renderFlow(props: Record<string, unknown> = {}, t = tenant()) {
  return render(
    <BookingFlow
      tenant={t}
      subdomain="barber"
      dict={dict}
      locale="uz"
      {...props}
    />
  );
}

// Every CTA is rendered twice — once in the mobile action bar, once in the
// desktop summary — with CSS deciding which is visible. Click the first
// enabled one; either fires the same handler.
const cta = async (text: string) => {
  const matches = await screen.findAllByText(text);
  const buttons = matches
    .map((el) => el.closest('button'))
    .filter((b): b is HTMLButtonElement => !!b);
  if (buttons.length === 0) {
    throw new Error(`no button carries the text "${text}" (headings share some labels)`);
  }
  return buttons.find((b) => !b.disabled) ?? buttons[0];
};
const clickText = async (ui: ReturnType<typeof userEvent.setup>, text: string) => {
  await ui.click(await cta(text));
};

/** The first free slot rendered on the time step. */
const pickFirstSlot = async (ui: ReturnType<typeof userEvent.setup>, hhmm = '10:00') => {
  await ui.click(await screen.findByText(hhmm));
};

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  getAvailability.mockResolvedValue(slotsAt('10:00', '10:30', '11:00'));
  createBooking.mockResolvedValue({ ok: true, id: 'abcd1234-0000-0000-0000-000000000000' });
  requestOtp.mockResolvedValue({ ok: true, isNewCustomer: false });
  // jsdom has no layout APIs the flow touches for scrolling/animation.
  window.scrollTo = () => {};
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});
});

describe('BookingFlow — choosing what to book', () => {
  it('opens on the service list when the business offers several', async () => {
    renderFlow();

    expect(await screen.findByText('Soch olish')).toBeInTheDocument();
    expect(screen.getByText('Soqol')).toBeInTheDocument();
  });

  it('skips straight past the pickers when there is one service and one specialist', async () => {
    renderFlow(
      {},
      tenant({
        services: [service('off-cut', 'Soch olish')],
        staff: [member('res-a', 'Aziz', ['off-cut'])],
      } as Partial<PublicTenant>)
    );

    // Nothing to choose, so the customer lands on the times.
    await waitFor(() => expect(getAvailability).toHaveBeenCalled());
    expect(await screen.findByText('10:00')).toBeInTheDocument();
  });

  it('asks which specialist when more than one performs the service', async () => {
    const ui = userEvent.setup();
    renderFlow(
      {},
      tenant({
        staff: [member('res-a', 'Aziz', ['off-cut']), member('res-b', 'Bobur', ['off-cut'])],
      } as Partial<PublicTenant>)
    );

    await clickText(ui, 'Soch olish');
    await clickText(ui, dict.actContinue);

    expect(await screen.findByText('Bobur')).toBeInTheDocument();
    expect(getAvailability).not.toHaveBeenCalled();
  });

  it('refuses a combination no single specialist can perform', async () => {
    const ui = userEvent.setup();
    renderFlow(
      {},
      tenant({
        staff: [member('res-a', 'Aziz', ['off-cut']), member('res-b', 'Bobur', ['off-beard'])],
      } as Partial<PublicTenant>)
    );

    await clickText(ui, 'Soch olish');
    await clickText(ui, 'Soqol');
    await clickText(ui, dict.actContinue);

    // Two services, no shared specialist — say so instead of failing at submit.
    expect(await screen.findByText(dict.errMultiStaff)).toBeInTheDocument();
    expect(getAvailability).not.toHaveBeenCalled();
  });

  it('books an hourly service alone, replacing any fixed selection', async () => {
    const ui = userEvent.setup();
    getAvailability.mockResolvedValue({
      ok: true,
      data: {
        pricingMode: 'time_rate',
        minMinutes: 60,
        stepMinutes: 30,
        resources: [
          {
            resourceId: 'res-t',
            name: 'Stol 1',
            ratePerHour: 40_000,
            free: [
              {
                from: '10:00',
                to: '18:00',
                fromAt: '2026-08-15T10:00:00.000+05:00',
                toAt: '2026-08-15T18:00:00.000+05:00',
              },
            ],
          },
        ],
      },
    });
    renderFlow(
      {},
      tenant({
        services: [
          service('off-cut', 'Soch olish'),
          service('off-pool', 'Bilyard', { pricingMode: 'time_rate', price: null, ratePerHour: 40_000 }),
        ],
        staff: [member('res-t', 'Stol 1', ['off-pool']), member('res-a', 'Aziz', ['off-cut'])],
      } as Partial<PublicTenant>)
    );

    await clickText(ui, 'Soch olish'); // a fixed pick first…
    await clickText(ui, 'Bilyard'); // …then an hourly one, which is exclusive

    // Selecting the unit service advances on its own — it can't share a booking.
    await waitFor(() => expect(getAvailability).toHaveBeenCalled());
    const [, , offeringIds] = getAvailability.mock.calls[0];
    expect(offeringIds).toEqual(['off-pool']);
  });
});

describe('BookingFlow — a remembered customer', () => {
  it('books in one tap, with no phone and no code', async () => {
    const ui = userEvent.setup();
    renderFlow(
      { hasSession: true, initialServiceIds: ['off-cut'] },
      tenant({ staff: [member('res-a', 'Aziz', ['off-cut'])] } as Partial<PublicTenant>)
    );

    await pickFirstSlot(ui);
    await clickText(ui, dict.actBook);

    await waitFor(() => expect(createBooking).toHaveBeenCalled());
    const [subdomain, input] = createBooking.mock.calls[0];
    expect(subdomain).toBe('barber');
    expect(input).toMatchObject({
      start: '10:00',
      items: [{ offeringId: 'off-cut', resourceId: 'res-a' }],
    });
    // The cookie is attached server-side; sending a phone or code would be wrong.
    expect(input.phone).toBeUndefined();
    expect(input.code).toBeUndefined();
  });

  it('lands on the booking it just created', async () => {
    const ui = userEvent.setup();
    renderFlow({ hasSession: true, initialServiceIds: ['off-cut'] });

    await pickFirstSlot(ui);
    await clickText(ui, dict.actBook);

    // The short id is what the /b/<shortid> page expects.
    await waitFor(() => expect(push).toHaveBeenCalledWith('/b/abcd1234?created=1'));
  });

  it('falls back to a code when the remembered session turns out to be dead', async () => {
    const ui = userEvent.setup();
    createBooking.mockResolvedValue({ ok: false, error: 'session gone', needsOtp: true });
    renderFlow({ hasSession: true, initialServiceIds: ['off-cut'] });

    await pickFirstSlot(ui);
    await clickText(ui, dict.actBook);

    // The confirm step opens so they can enter a phone instead of a dead end.
    expect(await screen.findByPlaceholderText(dict.phonePlaceholder)).toBeInTheDocument();
  });
});

describe('BookingFlow — a new customer', () => {
  const startAtConfirm = async (ui: ReturnType<typeof userEvent.setup>) => {
    renderFlow({ initialServiceIds: ['off-cut'] });
    await pickFirstSlot(ui);
    await clickText(ui, dict.actConfirmBooking);
    return screen.findByPlaceholderText(dict.phonePlaceholder);
  };

  it('asks for a phone, sends a code, then books with both', async () => {
    const ui = userEvent.setup();
    const phoneField = await startAtConfirm(ui);

    await ui.type(phoneField, '901112233');
    await clickText(ui, dict.sendCode);

    await waitFor(() => expect(requestOtp).toHaveBeenCalledWith('+998901112233'));
  });

  it('will not submit until a code has actually been sent and typed', async () => {
    const ui = userEvent.setup();
    const phoneField = await startAtConfirm(ui);

    // Before a code is sent there is no book button at all — the only way
    // forward is asking for one.
    await expect(cta(dict.actBook)).rejects.toThrow();

    await ui.type(phoneField, '901112233');
    await clickText(ui, dict.sendCode);
    await waitFor(() => expect(requestOtp).toHaveBeenCalled());

    // A code was sent, but nothing was typed into it — still nothing to submit.
    expect(await cta(dict.actBook)).toBeDisabled();
    expect(createBooking).not.toHaveBeenCalled();
  });
});

describe('BookingFlow — rescheduling', () => {
  it('carries the booking being moved, and explains one that already started', async () => {
    const ui = userEvent.setup();
    createBooking.mockResolvedValue({
      ok: false,
      error: 'nope',
      code: 'INVALID_BOOKING',
    });
    renderFlow({
      hasSession: true,
      rescheduleId: 'bk-1',
      initialServiceIds: ['off-cut'],
      initialStaffId: 'res-a',
    });

    await pickFirstSlot(ui);
    await clickText(ui, dict.actChange);

    await waitFor(() => expect(createBooking).toHaveBeenCalled());
    expect(createBooking.mock.calls[0][1]).toMatchObject({ rescheduleId: 'bk-1' });
    // A booking whose time has arrived can't be moved — say that plainly.
    expect(await screen.findByText(dict.rescheduleStarted)).toBeInTheDocument();
  });
});

describe('BookingFlow — availability', () => {
  it('asks for the picked service, specialist and day', async () => {
    renderFlow({ initialServiceIds: ['off-cut'] });

    await waitFor(() => expect(getAvailability).toHaveBeenCalled());
    const [subdomain, date, offeringIds, resourceId] = getAvailability.mock.calls[0];
    expect(subdomain).toBe('barber');
    expect(offeringIds).toEqual(['off-cut']);
    expect(resourceId).toBe('res-a');
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('says nothing is free rather than showing an empty grid', async () => {
    getAvailability.mockResolvedValue({ ok: true, data: { pricingMode: 'fixed', slots: [] } });
    renderFlow({ initialServiceIds: ['off-cut'] });

    expect(await screen.findByText(dict.noSlots)).toBeInTheDocument();
  });
});
