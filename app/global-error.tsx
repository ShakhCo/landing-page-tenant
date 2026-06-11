'use client';

/**
 * Last-resort boundary for an error in the root layout itself. It replaces the
 * whole document (so it renders its own <html>/<body>) and uses inline styles —
 * Tailwind/globals.css may not be applied when the layout is what failed.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="uz">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#ffffff',
          color: '#111111',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>
            Xatolik yuz berdi
          </h1>
          <p style={{ color: '#666666', margin: '0 0 24px', fontSize: 15, lineHeight: 1.4 }}>
            Kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko&apos;ring.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              height: 52,
              padding: '0 28px',
              borderRadius: 999,
              border: 'none',
              background: '#111111',
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Qayta urinish
          </button>
        </div>
      </body>
    </html>
  );
}
