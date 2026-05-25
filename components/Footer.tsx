'use client';

import Image from "next/image";
import {
  PhoneIcon,
  SocialFacebookIcon,
  SocialInstagramIcon,
  SocialTelegramIcon,
  SocialYoutubeIcon,
} from "./icons";

const COLS = [
  {
    heading: "Biznes uchun",
    links: [
      { label: "Sartaroshxonalar", href: "/business/sartaroshxonalar" },
      { label: "Salonlar", href: "/business/salonlar" },
      { label: "Stomatologiya", href: "/business/stomatologiya" },
      { label: "Bilyard", href: "/business/bilyard" },
      { label: "Tennis", href: "/business/tennis" },
      { label: "Fitness", href: "/business/fitness" },
    ],
  },
  {
    heading: "Imkoniyatlar",
    links: [
      { label: "Onlayn jadval", href: "#" },
      { label: "Mijozlar bazasi", href: "#" },
      { label: "SMS xabarnomalar", href: "#" },
      { label: "Telegram bot", href: "#" },
      { label: "Instagram ulanish", href: "#" },
      { label: "Tahlil va hisobotlar", href: "#" },
    ],
  },
  {
    heading: "Kompaniya",
    links: [
      { label: "Biz haqimizda", href: "#" },
      { label: "Hamkorlar", href: "#" },
      { label: "Vakansiyalar", href: "#" },
      { label: "Aloqa", href: "#" },
    ],
  },
  {
    heading: "Hujjatlar",
    links: [
      { label: "Foydalanish shartlari", href: "#" },
      { label: "Maxfiylik siyosati", href: "#" },
      { label: "Oferta", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 rounded-t-[2rem] bg-gray-950 text-white md:rounded-t-[3rem] lg:rounded-t-[5rem] 2xl:rounded-t-[10rem]">
      {/* Top CTA strip */}
      <div className="mx-auto max-w-[1360px] px-5 pt-20 pb-14 md:pt-24">
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between md:gap-12">
          <div>
            <h2 className="text-3xl font-extrabold leading-[1.05] tracking-tight md:text-4xl lg:text-5xl">
              Biznesingizni bugun
              <br />
              <span className="text-gray-500">Bookup&apos;ga ulang.</span>
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              Hoziroq boshlash
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
              alt="Bookup"
              width={600}
              height={112}
              className="h-7 w-auto brightness-0 invert"
            />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-gray-400">
              O&apos;zbekiston bizneslari uchun onlayn yozilish va mijozlar
              bazasini boshqarish platformasi.
            </p>

            <div className="mt-7 flex gap-2.5">
              <FooterSocial label="Telegram" href="#">
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
          {COLS.map((col) => (
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
            © {new Date().getFullYear()} Bookup. Barcha huquqlar himoyalangan.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href="#" className="transition hover:text-white">
              Maxfiylik siyosati
            </a>
            <a href="#" className="transition hover:text-white">
              Foydalanish shartlari
            </a>
            <a href="#" className="transition hover:text-white">
              Oferta
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
