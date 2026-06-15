import { ImageResponse } from 'next/og';
import { getTenant, localized, mediaUrl } from '@/lib/tenant';

// Per-business OG/Twitter card (1200×630) — mirrors the tenant page identity:
// avatar/initials, name + verified, address, rating, on the BOOKUP brand.
export const alt = 'BOOKUP — Onlayn bron qilish';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** BOOK ●● UP wordmark, matching the root OG image. */
function Wordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-1.5px', color: '#111111' }}>BOOK</div>
      <div style={{ display: 'flex', gap: 3 }}>
        <div style={{ width: 32, height: 32, borderRadius: 999, background: '#111111' }} />
        <div style={{ width: 32, height: 32, borderRadius: 999, background: '#e11d6c' }} />
      </div>
      <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-1.5px', color: '#111111' }}>UP</div>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
  const tenant = await getTenant(subdomain);

  const name = tenant?.business.name ?? 'BOOKUP';
  const avatar = tenant?.business.avatarUrl ? mediaUrl(tenant.business.avatarUrl) : null;
  const category = tenant?.business.category ? localized(tenant.business.category.name) : '';
  const address = tenant?.branches?.[0]?.address ? localized(tenant.branches[0].address) : '';
  const reviewCount = tenant?.reviewCount ?? 0;
  const averageRating = tenant?.averageRating ?? null;

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
          padding: '76px 88px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Identity: avatar + name + address */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} width={156} height={156} style={{ borderRadius: 999, objectFit: 'cover' }} alt="" />
          ) : (
            <div
              style={{
                display: 'flex',
                width: 156,
                height: 156,
                borderRadius: 999,
                background: '#1b1b1f',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: 64,
                fontWeight: 700,
              }}
            >
              {initials(name)}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ fontSize: 76, fontWeight: 800, color: '#111111', letterSpacing: '-2px', lineHeight: 1 }}>
                {name}
              </div>
              <svg width="48" height="48" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#1d9bf0" />
                <path d="M8.5 12.4l2.3 2.3 4.7-5" stroke="#ffffff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {address ? <div style={{ display: 'flex', fontSize: 34, color: '#666666' }}>{address}</div> : null}
          </div>
        </div>

        {/* Rating + category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, fontSize: 36 }}>
          {reviewCount > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#111111', fontWeight: 700 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#f5a623">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
              </svg>
              <span>{averageRating}</span>
              <span style={{ color: '#888888', fontWeight: 400 }}>· {reviewCount} ta sharh</span>
            </div>
          ) : null}
          {category ? <div style={{ display: 'flex', color: '#666666' }}>{category}</div> : null}
        </div>

        {/* Brand footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Wordmark />
          <div style={{ display: 'flex', fontSize: 32, fontWeight: 700, color: '#e11d6c' }}>Onlayn bron qilish</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
