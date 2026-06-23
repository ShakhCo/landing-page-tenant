'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown } from 'lucide-react';
import type { TenantLocale } from '@/lib/tenant';

// uz lives at the subdomain root; ru/en get a path prefix. Host-relative hrefs
// keep the middleware rewrite on the tenant subdomain.
const META: Record<TenantLocale, { code: string; native: string; flag: string; href: string }> = {
  uz: { code: 'UZ', native: "O'zbekcha", flag: '🇺🇿', href: '/' },
  ru: { code: 'RU', native: 'Русский', flag: '🇷🇺', href: '/ru' },
  en: { code: 'EN', native: 'English', flag: '🇬🇧', href: '/en' },
};
const ORDER: TenantLocale[] = ['uz', 'ru', 'en'];

export function LocaleSwitcher({
  current,
  className = '',
}: {
  current: TenantLocale;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const cur = META[current];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition-shadow hover:shadow-md"
      >
        <span aria-hidden>{cur.flag}</span>
        <span>{cur.code}</span>
        <ChevronDown
          aria-hidden
          className={`size-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2.25}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-1.5 min-w-44 rounded-xl border border-border bg-card p-2 shadow-lg ring-1 ring-black/5"
        >
          {ORDER.map((l) => {
            const meta = META[l];
            const active = l === current;
            return (
              <Link
                key={l}
                href={meta.href}
                aria-current={active ? 'true' : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? 'bg-accent/10 text-accent' : 'text-foreground hover:bg-foreground/5'
                }`}
              >
                <span aria-hidden>{meta.flag}</span>
                <span className="flex-1">{meta.native}</span>
                {active && <Check aria-hidden className="size-4" strokeWidth={2.5} />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
