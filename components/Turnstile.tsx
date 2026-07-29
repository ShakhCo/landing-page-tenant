'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

/**
 * Cloudflare Turnstile widget (invisible/managed) for the OTP-send step.
 *
 * Turnstile tokens are SINGLE-USE and expire, so instead of holding one
 * auto-solved token in state (which fails the second time it's sent), we expose
 * an imperative `getToken()`: it resets the widget and awaits a fresh solve,
 * guaranteeing a brand-new token per OTP request. Renders nothing / resolves
 * null when no site key is configured (backend fails open too).
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export type TurnstileHandle = { getToken: () => Promise<string | null> };

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
      appearance?: 'always' | 'execute' | 'interaction-only';
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

export const Turnstile = forwardRef<TurnstileHandle, { className?: string }>(
  function Turnstile({ className }, ref) {
    const boxRef = useRef<HTMLDivElement | null>(null);
    const widgetId = useRef<string | null>(null);
    const latest = useRef<string | null>(null);
    // Resolvers waiting for the next fresh token.
    const waiters = useRef<((t: string | null) => void)[]>([]);

    const deliver = (token: string | null) => {
      latest.current = token;
      if (token) {
        const pending = waiters.current;
        waiters.current = [];
        pending.forEach((w) => w(token));
      }
    };

    useEffect(() => {
      if (!SITE_KEY) return;
      let cancelled = false;
      void loadScript().then(() => {
        if (cancelled || !boxRef.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(boxRef.current, {
          sitekey: SITE_KEY!,
          appearance: 'interaction-only',
          size: 'flexible',
          callback: (t) => deliver(t),
          'expired-callback': () => {
            latest.current = null;
          },
          'error-callback': () => {
            latest.current = null;
          },
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        getToken: () =>
          new Promise<string | null>((resolve) => {
            if (!SITE_KEY) {
              resolve(null);
              return;
            }
            let settled = false;
            const finish = (t: string | null) => {
              if (settled) return;
              settled = true;
              resolve(t);
            };
            waiters.current.push(finish);
            // Reset for a fresh single-use token; the callback resolves us.
            latest.current = null;
            try {
              if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
            } catch {
              // widget not ready — the safety timeout will resolve
            }
            // Safety net: never hang the OTP button.
            setTimeout(() => {
              const i = waiters.current.indexOf(finish);
              if (i >= 0) waiters.current.splice(i, 1);
              finish(latest.current);
            }, 8000);
          }),
      }),
      [],
    );

    if (!SITE_KEY) return null;
    return <div ref={boxRef} className={className} />;
  },
);
