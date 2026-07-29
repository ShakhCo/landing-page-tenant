import { ImageResponse } from 'next/og';
import { BOOKING_STATUS_UZ, bookingWhen } from '@/lib/booking-og';
import { INTER_SEMIBOLD_WOFF_B64 } from '@/lib/og-fonts';
import type { PublicBookingView, PublicTenant } from '@/lib/tenant';

export const OG_SIZE = { width: 1200, height: 630 };

// Decode the embedded semibold face once per isolate. Satori applies no
// synthetic weight, so a real font must be supplied for headline text to render
// heavier than the default regular face.
const INTER_SEMIBOLD = Uint8Array.from(atob(INTER_SEMIBOLD_WOFF_B64), (c) => c.charCodeAt(0)).buffer;

// A short cache so crawlers/CDN don't re-render on every fetch, but the card
// still reflects a booking's current status within a few minutes (a long cache
// would pin a stale status). Crawlers cache the image on their side regardless.
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=300, s-maxage=300',
};

/** The shared per-booking OG card, used by both the root /b/<short> link and
 *  the tenant <sub>.bookup.uz/b/<id> page. */
export function renderBookingOg(
  data: PublicBookingView,
  _tenant: PublicTenant | null,
): ImageResponse {
  const rawName = data.business.name || 'BOOKUP';
  // Guard the layout against very long names: hard-cap the length, and scale the
  // font down so it wraps to at most ~2 lines instead of colliding with the pill.
  const name = rawName.length > 42 ? `${rawName.slice(0, 41).trimEnd()}…` : rawName;
  const nameSize = name.length <= 14 ? 68 : name.length <= 24 ? 56 : 46;
  const tz = data.business.timezone || 'Asia/Tashkent';
  const status = BOOKING_STATUS_UZ[data.booking.status] ?? {
    label: data.booking.status,
    bg: '#f3f4f6',
    fg: '#4b5563',
  };
  const start = bookingWhen(data.booking.startAt, tz);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#ffffff',
          padding: '72px 84px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Business name (left, wraps/shrinks) · status pill (right, fixed) */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 36 }}>
          <div style={{ display: 'flex', flexShrink: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', fontFamily: 'Inter', fontWeight: 600, fontSize: nameSize, color: '#111111', letterSpacing: '-1.5px', lineHeight: 1.08 }}>
              {name}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexShrink: 0,
              alignItems: 'center',
              gap: 15,
              background: status.bg,
              color: status.fg,
              fontFamily: 'Inter',
              fontWeight: 600,
              fontSize: 38,
              padding: '17px 36px',
              borderRadius: 999,
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ display: 'flex', width: 18, height: 18, borderRadius: 999, background: status.fg }} />
            {status.label}
          </div>
        </div>

        {/* Date & time — the hero */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 38, color: '#9a9aa2', letterSpacing: '0.5px' }}>
            Sana va vaqt
          </div>
          <div style={{ display: 'flex', fontFamily: 'Inter', fontWeight: 600, marginTop: 12, fontSize: 82, color: '#111111', letterSpacing: '-2px', lineHeight: 1 }}>
            {start.dateShort}, {start.time}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      headers: CACHE_HEADERS,
      fonts: [{ name: 'Inter', data: INTER_SEMIBOLD, weight: 600, style: 'normal' }],
    },
  );
}
