'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/tenant';

/**
 * Live updates for the public booking page: a WebSocket to the backend's
 * per-booking room (the unguessable ref is the capability — the socket only
 * ever carries a bare "refetch" signal, no booking data). Any change to the
 * booking — owner reschedule/cancel, staff edits, auto-completion — re-runs
 * the server render so the page updates without a manual reload.
 */
export function LiveRefresh({ refId }: { refId: string }) {
  const router = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let closed = false;
    let attempts = 0;
    let pingTimer: ReturnType<typeof setInterval> | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let hadDrop = false;

    const refresh = () => {
      // Coalesce bursts (multi-row groups fire one signal per mutation batch).
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => router.refresh(), 300);
    };

    const connect = () => {
      if (closed) return;
      const base = API_BASE.replace(/^http/, 'ws');
      try {
        ws = new WebSocket(`${base}/realtime/booking?ref=${encodeURIComponent(refId)}`);
      } catch {
        retry();
        return;
      }
      ws.onopen = () => {
        attempts = 0;
        // A reconnect may have missed a signal — catch up once.
        if (hadDrop) {
          hadDrop = false;
          refresh();
        }
        pingTimer = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) ws.send('ping');
        }, 120_000);
      };
      ws.onmessage = (ev) => {
        if (typeof ev.data !== 'string' || ev.data === 'pong') return;
        try {
          const msg = JSON.parse(ev.data) as { type?: string };
          if (msg.type === 'booking.changed') refresh();
        } catch {
          // Not JSON — ignore.
        }
      };
      ws.onclose = () => {
        clearInterval(pingTimer);
        if (!closed) {
          hadDrop = true;
          retry();
        }
      };
      ws.onerror = () => {
        ws?.close();
      };
    };

    const retry = () => {
      attempts += 1;
      const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempts, 5));
      retryTimer = setTimeout(connect, delay);
    };

    connect();
    return () => {
      closed = true;
      clearInterval(pingTimer);
      clearTimeout(retryTimer);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      ws?.close();
    };
  }, [refId, router]);

  return null;
}
