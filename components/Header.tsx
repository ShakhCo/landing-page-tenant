'use client';

import Image from "next/image";
import { PhoneIcon } from "./icons";

const NAV_ITEMS: Array<{ label: string; href: string }> = [
  { label: "Bosh sahifa", href: "/" },
  { label: "Imkoniyatlar", href: "#" },
  { label: "Biznesga", href: "#" },
  { label: "Mijozlarga", href: "#" },
  { label: "Narxlar", href: "/narxlar" },
  { label: "Hamkorlar", href: "#" },
  { label: "Biz haqimizda", href: "#" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur">
      <div className="border-b border-black/10">
        <div className="mx-auto flex max-w-[1360px] items-center gap-5 px-5 py-3">
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto text-sm">
            {NAV_ITEMS.map((item, i) => (
              <a
                key={item.label}
                href={item.href}
                className={
                  i === 0
                    ? "inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium text-[var(--accent)]"
                    : "rounded-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                }
              >
                {i === 0 && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                )}
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-sm">
            <button className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-3 py-2 font-medium">
              RU
              <span className="text-gray-400">▾</span>
            </button>
            <IconButton aria-label="Версия для слабовидящих">
              <EyeIcon />
            </IconButton>
            <IconButton aria-label="Telegram">
              <TelegramIcon />
            </IconButton>
            <a
              href="tel:+998883634020"
              className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-2 font-medium"
            >
              <PhoneIcon />
              +998 88 363 40 20
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1360px] items-center gap-5 px-5 pt-5 pb-5">
        <a href="/" className="flex items-center">
          <Image
            src="/bookup-logo.png"
            alt="Bookup"
            width={600}
            height={112}
            priority
            className="h-5 w-auto"
          />
        </a>
        <div className="ml-3 flex items-center gap-2 text-sm">
          <button className="rounded-full bg-[var(--accent)] px-5 py-2 font-medium text-white">
            Biznes uchun
          </button>
          <button className="rounded-full px-5 py-2 font-medium text-gray-700 hover:bg-gray-50">
            Mijozlar uchun
          </button>
        </div>
        <div className="ml-auto">
          <button className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--accent)] bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-[var(--accent)]/5">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            Biznesni ulash
          </button>
        </div>
      </div>
    </header>
  );
}

function IconButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-700 hover:bg-gray-200"
      {...rest}
    >
      {children}
    </button>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.04 15.39 8.86 19c.27 0 .39-.12.53-.26l1.27-1.22 2.64 1.93c.48.27.83.13.96-.45l1.75-8.18c.16-.74-.26-1.03-.74-.85L4.49 13.62c-.71.27-.7.66-.12.83l2.6.81 6.04-3.8c.28-.18.55-.08.33.1L9.04 15.39Z" />
    </svg>
  );
}
