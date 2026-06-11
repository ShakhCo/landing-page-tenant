'use server';

import { locateBooking } from '@/lib/tenant';

/** Resolve a short booking id to its tenant subdomain (null when unknown). */
export async function locateBookingAction(shortId: string): Promise<{ subdomain: string | null }> {
  return { subdomain: await locateBooking(shortId) };
}
