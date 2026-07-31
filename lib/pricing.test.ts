import { describe, expect, it } from 'vitest';

import {
  ADDONS,
  ANNUAL_DISCOUNT,
  BASE_INCLUDED_SMS,
  BASE_INCLUDED_STAFF,
  BASE_PRICE,
  BILLING_PERIODS,
  PLANS,
  PRICE_PER_EXTRA_STAFF,
  SMS_PACKS,
  calcTotal,
  planMonthly,
} from './pricing';

const total = (opts: Partial<Parameters<typeof calcTotal>[0]> = {}) =>
  calcTotal({ staff: 1, smsPackId: 'included', addonIds: [], ...opts });

describe('calcTotal', () => {
  it('charges the base price for one master with the included SMS and no add-ons', () => {
    expect(total()).toBe(BASE_PRICE);
  });

  it('charges only for masters beyond the included one', () => {
    expect(total({ staff: 3 })).toBe(BASE_PRICE + 2 * PRICE_PER_EXTRA_STAFF);
    // A nonsensical staff count must never produce a discount.
    expect(total({ staff: 0 })).toBe(BASE_PRICE);
    expect(total({ staff: -5 })).toBe(BASE_PRICE);
  });

  it('adds the chosen SMS pack', () => {
    const pack = SMS_PACKS.find((p) => p.id === 'p600')!;
    expect(total({ smsPackId: 'p600' })).toBe(BASE_PRICE + pack.price);
  });

  it('falls back to the included pack for an unknown id', () => {
    // A stale link or a renamed pack must not crash the calculator.
    expect(total({ smsPackId: 'no-such-pack' })).toBe(BASE_PRICE);
  });

  it('adds every selected add-on, and ignores ids that do not exist', () => {
    const reminder = ADDONS.find((a) => a.id === 'sms-reminder')!;
    const instagram = ADDONS.find((a) => a.id === 'instagram')!;

    expect(total({ addonIds: ['sms-reminder', 'instagram'] })).toBe(
      BASE_PRICE + reminder.price + instagram.price
    );
    expect(total({ addonIds: ['ghost-addon'] })).toBe(BASE_PRICE);
  });

  it('counts a repeated add-on once', () => {
    const reminder = ADDONS.find((a) => a.id === 'sms-reminder')!;
    expect(total({ addonIds: ['sms-reminder', 'sms-reminder'] })).toBe(BASE_PRICE + reminder.price);
  });

  it('adds everything together for a full configuration', () => {
    const pack = SMS_PACKS.find((p) => p.id === 'p1200')!;
    const addons = ADDONS.filter((a) => ['instagram', 'analytics'].includes(a.id));

    expect(total({ staff: 5, smsPackId: 'p1200', addonIds: ['instagram', 'analytics'] })).toBe(
      BASE_PRICE +
        4 * PRICE_PER_EXTRA_STAFF +
        pack.price +
        addons.reduce((sum, a) => sum + a.price, 0)
    );
  });
});

describe('planMonthly', () => {
  it('leaves the price alone with no discount', () => {
    expect(planMonthly(72_000, 0)).toBe(72_000);
  });

  it('rounds a discounted price to the nearest 100 so it reads like a price', () => {
    // 49 500 − 5% = 47 025 → 47 000, not 47 025.
    expect(planMonthly(49_500, 0.05) % 100).toBe(0);
    expect(planMonthly(49_500, 0.05)).toBe(47_000);
  });

  it('applies the annual discount as two free months', () => {
    const monthly = planMonthly(60_000, ANNUAL_DISCOUNT);
    // 12 × the discounted month ≈ 10 months at full price.
    expect(monthly * 12).toBeCloseTo(60_000 * 10, -3);
  });
});

describe('the published plans and packs', () => {
  it('offers longer periods at a bigger discount', () => {
    const discounts = BILLING_PERIODS.map((p) => p.discount);
    expect([...discounts].sort((a, b) => a - b)).toEqual(discounts);
    expect(BILLING_PERIODS[0].discount).toBe(0);
  });

  it('has a unique id for every period, pack, add-on and plan', () => {
    for (const list of [BILLING_PERIODS, SMS_PACKS, ADDONS, PLANS]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size, ids.join(',')).toBe(ids.length);
    }
  });

  it('prices bigger SMS packs higher, and includes the base allowance in each', () => {
    const paid = SMS_PACKS.filter((p) => p.price > 0);
    for (const pack of paid) {
      expect(pack.totalSms).toBeGreaterThan(BASE_INCLUDED_SMS);
    }
    const sorted = [...SMS_PACKS].sort((a, b) => a.totalSms - b.totalSms);
    expect(sorted.map((p) => p.price)).toEqual([...sorted.map((p) => p.price)].sort((a, b) => a - b));
    expect(SMS_PACKS[0]).toMatchObject({ price: 0, totalSms: BASE_INCLUDED_SMS });
    expect(BASE_INCLUDED_STAFF).toBe(1);
  });

  it('marks exactly one plan as the recommended one', () => {
    expect(PLANS.filter((p) => p.highlighted)).toHaveLength(1);
  });

  it('gives every per-member plan a minimum team size', () => {
    for (const plan of PLANS.filter((p) => p.perMember)) {
      expect(plan.minMembers, plan.id).toBeGreaterThan(0);
    }
  });
});
