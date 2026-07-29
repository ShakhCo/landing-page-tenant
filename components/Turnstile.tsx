'use client';

import { useEffect, useRef } from 'react';

/**
 * Cloudflare Turnstile widget (invisible/managed) that gates the OTP-send step.
 * Renders nothing and reports a null token when no site key is configured, so
 * the booking flow keeps working before Turnstile is switched on (the backend
 * fails open too). Mostly invisible for real users; only bots see friction.
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
      appearance?: 'always' | 'execute' | 'interaction-only';
      theme?: 'auto' | 'light' | 'dark';
      size?: 'normal' | 'flexible' | 'compact';
    },
  ) => string;
  remove: (id: string) => void;
  reset: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __turnstileLoading?: Promise<void>;
  }
}

function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (window.__turnstileLoading) return window.__turnstileLoading;
  window.__turnstileLoading = new Promise<void>((resolve) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => resolve(); // fail open — flow proceeds without a token
    document.head.appendChild(s);
  });
  return window.__turnstileLoading;
}

export function Turnstile({
  onToken,
  className,
}: {
  /** Fresh token on solve, null on mount/expiry/error (caller sends what it has). */
  onToken: (token: string | null) => void;
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!SITE_KEY) {
      onTokenRef.current(null);
      return;
    }
    let cancelled = false;
    void loadScript().then(() => {
      if (cancelled || !boxRef.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(boxRef.current, {
        sitekey: SITE_KEY!,
        appearance: 'interaction-only',
        size: 'flexible',
        callback: (token) => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(null),
        'error-callback': () => onTokenRef.current(null),
      });
    });
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          // already gone
        }
      }
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={boxRef} className={className} />;
}
