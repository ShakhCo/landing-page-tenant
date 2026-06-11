import { ImageResponse } from 'next/og';

// Applied site-wide as the default OG/Twitter card (1200×630) unless a route
// sets its own openGraph.images (e.g. tenant pages use the business avatar).
export const alt = 'BOOKUP — Onlayn band qilish platformasi';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
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
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: '-2px',
              color: '#111111',
            }}
          >
            BOOK
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <div style={{ width: 48, height: 48, borderRadius: 999, background: '#111111' }} />
            <div style={{ width: 48, height: 48, borderRadius: 999, background: '#e11d6c' }} />
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: '-2px',
              color: '#111111',
            }}
          >
            UP
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', fontSize: 66, fontWeight: 800, color: '#111111', lineHeight: 1.05, letterSpacing: '-2px' }}>
            Biznesingiz uchun
          </div>
          <div style={{ display: 'flex', fontSize: 66, fontWeight: 800, color: '#e11d6c', lineHeight: 1.05, letterSpacing: '-2px' }}>
            onlayn band qilish
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: '#555555', maxWidth: 900 }}>
            Mijozlar 24/7 bron qiladi · jadval, mijozlar va to&apos;lovlar bitta panelda
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 28, color: '#888888' }}>
          <span>bookup.uz</span>
          <span style={{ color: '#e11d6c', fontWeight: 700 }}>Bepul boshlang</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
