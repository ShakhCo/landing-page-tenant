'use client';

import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { PhoneIcon } from "./icons";
import homeUz, { type HomeDict } from "@/lib/dictionaries/home.uz";
import { LOCALES, localePath, type Locale } from "@/lib/i18n";

export function Header({
  locale = 'uz',
  dict = homeUz.header,
}: {
  locale?: Locale;
  dict?: HomeDict['header'];
}) {
  const [open, setOpen] = useState(false);

  const navItems: Array<{ label: string; href: string }> = [
    { label: dict.nav.home, href: localePath(locale) },
    { label: dict.nav.features, href: "#" },
    { label: dict.nav.forBusiness, href: "#" },
    { label: dict.nav.forCustomers, href: "#" },
    { label: dict.nav.pricing, href: "/narxlar" },
    { label: dict.nav.partners, href: "#" },
    { label: dict.nav.about, href: "#" },
  ];

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur">
      {/* Top utility bar — desktop only */}
      <div className="hidden border-b border-black/10 md:block">
        <div className="mx-auto flex max-w-[1360px] items-center gap-5 px-5 py-3">
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto text-sm">
            {navItems.map((item, i) => (
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
            <LanguageSwitcher locale={locale} />
            <IconButton aria-label={dict.a11yEye}>
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

      {/* Main brand bar */}
      <div className="mx-auto flex max-w-[1360px] items-center gap-3 px-5 py-4 md:gap-5 md:py-5">
        <a href={localePath(locale)} className="flex items-center">
          <Image
            src="/bookup-logo.png"
            alt="Bookup"
            width={600}
            height={112}
            priority
            className="h-5 w-auto"
          />
        </a>
        <div className="ml-3 hidden items-center gap-2 text-sm md:flex">
          <button className="rounded-full bg-[var(--accent)] px-5 py-2 font-medium text-white">
            {dict.businessTab}
          </button>
          <button className="rounded-full px-5 py-2 font-medium text-gray-700 hover:bg-gray-50">
            {dict.customersTab}
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="hidden items-center gap-2 rounded-full border-2 border-[var(--accent)] bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-[var(--accent)]/5 md:inline-flex">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            {dict.connectBusiness}
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? dict.menuClose : dict.menuOpen}
            aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-700 transition hover:bg-gray-100 md:hidden"
          >
            {open ? (
              <X className="size-5" strokeWidth={2.25} />
            ) : (
              <Menu className="size-5" strokeWidth={2.25} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div
            className="fixed inset-x-0 bottom-0 top-[var(--header-h,72px)] z-20 bg-black/30 md:hidden"
            style={{ top: "72px" }}
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative z-30 border-t border-black/10 bg-white md:hidden">
            <nav className="mx-auto flex max-w-[1360px] flex-col gap-1 px-5 py-4">
              {navItems.map((item, i) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={
                    i === 0
                      ? "inline-flex items-center gap-2 rounded-full px-4 py-3 text-base font-semibold text-[var(--accent)]"
                      : "rounded-full px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
                  }
                >
                  {i === 0 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  )}
                  {item.label}
                </a>
              ))}

              <div className="mt-2 px-4">
                <LanguageSwitcher locale={locale} />
              </div>

              <div className="mt-3 flex gap-2">
                <button className="flex-1 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white">
                  {dict.businessTab}
                </button>
                <button className="flex-1 rounded-full bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-700">
                  {dict.customersTab}
                </button>
              </div>

              <a
                href="tel:+998883634020"
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900"
              >
                <PhoneIcon />
                +998 88 363 40 20
              </a>

              <button className="mt-2 inline-flex items-center justify-center gap-2 rounded-full border-2 border-[var(--accent)] bg-white px-5 py-3 text-sm font-semibold text-gray-900">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                {dict.connectBusiness}
              </button>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}

function LanguageSwitcher({ locale }: { locale: Locale }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-gray-50 px-2 py-2 text-sm font-medium">
      {LOCALES.map((l, i) => (
        <span key={l} className="inline-flex items-center">
          {i > 0 && (
            <span aria-hidden className="mx-1 h-3.5 w-px bg-gray-200" />
          )}
          <a
            href={localePath(l)}
            aria-current={l === locale ? "true" : undefined}
            className={`rounded-full px-1.5 uppercase transition ${
              l === locale
                ? "font-semibold text-gray-900"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            {l}
          </a>
        </span>
      ))}
    </div>
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
