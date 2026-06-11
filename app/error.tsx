'use client';

import { useEffect } from 'react';

/**
 * Route-level error boundary. Any unhandled render/data error in a page shows
 * this branded, recoverable screen (retry resets the segment) instead of the
 * default Next.js error page. The error detail goes to the console, not the user.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-background px-6 text-center">
      <div className="grid size-20 place-items-center rounded-full bg-foreground/5 text-foreground ring-1 ring-border">
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 8.5v4.5M12 16h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="mt-7 text-2xl font-extrabold text-foreground">Xatolik yuz berdi</h1>
      <p className="mt-1.5 text-muted-foreground">
        Kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko&apos;ring.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-7 flex h-14 w-full max-w-xs items-center justify-center rounded-full bg-foreground text-base font-bold text-background shadow-lg transition-all hover:opacity-90 active:scale-[0.99]"
      >
        Qayta urinish
      </button>
    </main>
  );
}
