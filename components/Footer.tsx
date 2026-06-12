'use client';

import Image from "next/image";
import {
  PhoneIcon,
  SocialFacebookIcon,
  SocialInstagramIcon,
  SocialTelegramIcon,
  SocialYoutubeIcon,
} from "./icons";
import homeUz, { type HomeDict } from "@/lib/dictionaries/home.uz";

/** Link targets per column — labels come from the dictionary, zipped by index. */
const COLUMN_HREFS = {
  business: [
    "/business/barbershops",
    "/business/salonlar",
    "/business/stomatologiya",
    "/business/bilyard",
    "/business/tennis",
    "/business/fitness",
  ],
  features: ["#", "#", "#", "#", "#", "#"],
  company: ["#", "#", "#", "#"],
  docs: ["#", "#", "#"],
};

export function Footer({ dict = homeUz.footer }: { dict?: HomeDict['footer'] }) {
  const cols = (
    [
      ['business', dict.columns.business],
      ['features', dict.columns.features],
      ['company', dict.columns.company],
      ['docs', dict.columns.docs],
    ] as const
  ).map(([key, col]) => ({
    heading: col.heading,
    links: col.links.map((label, i) => ({
      label,
      href: COLUMN_HREFS[key][i] ?? "#",
    })),
  }));

  return (
    <footer className="mt-12 rounded-t-[2rem] bg-gray-950 text-white md:mt-24 md:rounded-t-[3rem]">
      {/* Top CTA strip */}
      <div className="mx-auto max-w-[1360px] px-5 pt-20 pb-14 md:pt-24">
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between md:gap-12">
          <div>
            <h2 className="text-2xl font-extrabold leading-[1.05] tracking-tight md:text-3xl lg:text-4xl">
              {dict.ctaTitleLine1}
              <br />
              <span className="text-gray-500">{dict.ctaTitleLine2}</span>
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              {dict.ctaStart}
            </a>
            <a
              href="tel:+998883634020"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <PhoneIcon />
              +998 88 363 40 20
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10" />

      {/* Main grid */}
      <div className="mx-auto max-w-[1360px] px-5 py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.6fr_repeat(4,1fr)] lg:gap-12">
          {/* Brand column */}
          <div className="md:col-span-2 lg:col-span-1">
            <Image
              src="/bookup-logo.png"
              alt="BOOKUP"
              width={600}
              height={112}
              className="h-7 w-auto brightness-0 invert"
            />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-gray-400">
              {dict.about}
            </p>

            <div className="mt-7 flex gap-2.5">
              <FooterSocial label="Telegram" href="https://t.me/ShakhCo">
                <SocialTelegramIcon />
              </FooterSocial>
              <FooterSocial label="Instagram" href="#">
                <SocialInstagramIcon />
              </FooterSocial>
              <FooterSocial label="Facebook" href="#">
                <SocialFacebookIcon />
              </FooterSocial>
              <FooterSocial label="YouTube" href="#">
                <SocialYoutubeIcon />
              </FooterSocial>
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.heading}>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
                {col.heading}
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-gray-400">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="transition hover:text-white">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1360px] flex-col items-start justify-between gap-4 px-5 py-6 text-xs text-gray-500 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} BOOKUP. {dict.rights}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href="#" className="transition hover:text-white">
              {dict.privacy}
            </a>
            <a href="#" className="transition hover:text-white">
              {dict.terms}
            </a>
            <a href="#" className="transition hover:text-white">
              {dict.offer}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterSocial({
  label,
  href,
  children,
}: {
  label: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-[var(--accent)]/60 hover:bg-[var(--accent)] hover:text-white"
    >
      {children}
    </a>
  );
}
