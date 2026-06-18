import { describe, it, expect, beforeEach } from 'vitest';
import { isBanned, recordTenantMiss, __resetJail } from './tenant-jail';

const t0 = 1_000_000;

describe('tenant-jail', () => {
  beforeEach(() => __resetJail());

  it('does not ban under the threshold', () => {
    const ip = '1.2.3.4';
    for (let i = 0; i < 4; i++) expect(recordTenantMiss(ip, t0)).toBe(false);
    expect(isBanned(ip, t0)).toBe(false);
  });

  it('bans on the 5th miss within the window and stays banned for 12h', () => {
    const ip = '1.2.3.4';
    for (let i = 0; i < 4; i++) recordTenantMiss(ip, t0);
    expect(recordTenantMiss(ip, t0)).toBe(true); // 5th → ban
    expect(isBanned(ip, t0)).toBe(true);
    expect(isBanned(ip, t0 + 11 * 60 * 60_000)).toBe(true); // still banned at 11h
    expect(isBanned(ip, t0 + 13 * 60 * 60_000)).toBe(false); // cleared after 12h
  });

  it('resets the count after the 1h window lapses (no ban)', () => {
    const ip = '1.2.3.4';
    for (let i = 0; i < 4; i++) recordTenantMiss(ip, t0);
    // next miss is >1h later → fresh window, count restarts
    expect(recordTenantMiss(ip, t0 + 61 * 60_000)).toBe(false);
    expect(isBanned(ip, t0 + 61 * 60_000)).toBe(false);
  });

  it('tracks IPs independently', () => {
    for (let i = 0; i < 5; i++) recordTenantMiss('9.9.9.9', t0);
    expect(isBanned('9.9.9.9', t0)).toBe(true);
    expect(isBanned('8.8.8.8', t0)).toBe(false);
  });
});
