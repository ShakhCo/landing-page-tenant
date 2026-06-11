import type { Metadata } from "next";
import {
  CalendarClock,
  Scissors,
  Globe,
  Users,
  MessageSquareText,
  Gift,
  Star,
} from "lucide-react";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GradientCard } from "@/components/ui/gradient-card";
import { PricingSection } from "@/components/Pricing";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, breadcrumbSchema, organizationSchema } from "@/lib/seo";

const PAGE_URL = `${SITE_URL}/business/barbershops`;

/** Real Telegram logo — blue circle, white paper plane. */
function TelegramLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#229ED9" />
      <path
        fill="#fff"
        d="M17.34 7.13 15.5 15.99c-.13.62-.5.77-1.02.48l-2.82-2.08-1.36 1.31c-.15.15-.28.28-.57.28l.2-2.87 5.23-4.72c.23-.2-.05-.31-.35-.11l-6.46 4.07-2.78-.87c-.6-.19-.62-.6.13-.9l10.86-4.18c.5-.18.94.12.78.73Z"
      />
    </svg>
  );
}

/** Real Instagram logo — rounded square + camera, brand gradient. */
function InstagramLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <radialGradient id="ig-bs" cx="0.3" cy="1" r="1.2">
          <stop offset="0" stopColor="#FEDA75" />
          <stop offset="0.45" stopColor="#FA7E1E" />
          <stop offset="0.6" stopColor="#D62976" />
          <stop offset="0.9" stopColor="#962FBF" />
          <stop offset="1" stopColor="#4F5BD5" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="7" fill="url(#ig-bs)" />
      <rect x="5" y="5" width="14" height="14" rx="4.5" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3.4" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="16.3" cy="7.7" r="1.05" fill="#fff" />
    </svg>
  );
}

export const metadata: Metadata = {
  title: "Sartaroshxonalar uchun onlayn navbat va boshqaruv",
  description:
    "Sartaroshxonangiz uchun BOOKUP — ustalar bo‘yicha onlayn navbat, xizmatlar narxi, SMS eslatma va mijozlar bazasi. Mijozlar Telegram, Instagram yoki bepul saytingiz orqali 24/7 yoziladi.",
  keywords: [
    "sartaroshxona uchun navbat", "sartaroshxona onlayn yozilish", "barbershop CRM",
    "usta jadvali", "sartaroshxona dasturi", "barber booking",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    siteName: "BOOKUP",
    title: "Sartaroshxonalar uchun onlayn navbat — BOOKUP",
    description:
      "Ustalar bo‘yicha onlayn navbat, narxlar, SMS eslatma va mijozlar bazasi — bitta panelda.",
    url: PAGE_URL,
    locale: "uz_UZ",
  },
};

export default function SartaroshxonalarPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-white text-[oklch(0.18_0_0)]">
      <JsonLd
        schema={[
          organizationSchema(),
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Sartaroshxonalar uchun onlayn band qilish",
            serviceType: "Online appointment booking for barbershops",
            provider: { "@id": `${SITE_URL}/#organization` },
            areaServed: { "@type": "Country", name: "Uzbekistan" },
            url: PAGE_URL,
          },
          breadcrumbSchema([
            { name: "Bosh sahifa", url: SITE_URL },
            { name: "Sartaroshxonalar", url: PAGE_URL },
          ]),
        ]}
      />
      <Header />
      <main className="pb-8 md:pb-24">
        <Hero />
        <div className="mx-auto max-w-[1360px] px-5">
          <PainPoints />
          <Features />
        </div>
        <HowItWorks />
        <div className="mx-auto max-w-[1360px] px-5">
          <PricingSection />
          <ClosingCta />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-[1360px] px-5 pt-4">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-gray-900 md:rounded-[2.5rem]">
        {/* Background photo */}
        <Image
          src="/cat-barbershop.jpg"
          alt="Sartaroshxona"
          fill
          sizes="(min-width: 1360px) 1360px, 100vw"
          className="object-cover"
          priority
        />

        {/* Overall darken for consistent legibility */}
        <div
          aria-hidden
          className="absolute inset-0 bg-black/30"
        />
        {/* Stronger gradient on the left where the text sits */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10"
        />
        {/* Bottom fade for mobile readability */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent md:hidden"
        />

        {/* Content overlay */}
        <div className="relative flex min-h-[34rem] flex-col justify-end px-6 pb-12 pt-16 md:min-h-[40rem] md:justify-center md:px-12 md:py-20 lg:min-h-[44rem] lg:px-16 lg:py-24">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md md:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              Sartaroshxonalar uchun
            </p>
            <h1 className="mt-4 text-3xl font-extrabold leading-[1.05] tracking-tight text-white md:text-4xl lg:text-5xl">
              Sartaroshxonangizni
              <br />
              <span className="text-white/60">onlayn boshqaring.</span>
            </h1>
            <p className="mt-6 max-w-md text-base text-white/85 md:text-lg">
              Daftarlardan voz keching. Masterlaringiz, mijozlaringiz va har bir
              bo&apos;sh vaqt — bitta ekranda. Mijozlar esa o&apos;zlari onlayn
              yozilishadi.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:brightness-110"
              >
                Bepul boshlash
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                Demo ko&apos;rsatishni so&apos;rash
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PainPoints() {
  return (
    <section className="mt-16 grid gap-5 md:mt-20 md:grid-cols-2">
      <article className="flex flex-col rounded-3xl bg-gray-50 p-8 md:p-10">
        <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
          Yozilishlarni hali ham{" "}
          <span className="text-[var(--accent)]">yodda saqlaysizmi?</span>
        </h3>
        <p className="mt-4 text-base text-gray-600">
          <span className="font-semibold italic text-gray-900">
            &ldquo;U mijoz qachon edi?&rdquo;
          </span>{" "}
          degan gaplar kuniga bir necha marta bo&apos;ladi.
          Qo&apos;ng&apos;iroq, Instagram DM yoki qog&apos;ozdagi yozuvlar —
          har safar qidirishga to&apos;g&apos;ri keladi. BOOKUPda esa
          hammasi ko&apos;rinib turadi.
        </p>
      </article>

      <article className="flex flex-col rounded-3xl bg-gray-50 p-8 md:p-10">
        <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
          Mijozlar{" "}
          <span className="text-[var(--accent)]">kelmay qolayaptimi?</span>
        </h3>
        <p className="mt-4 text-base text-gray-600">
          <span className="font-semibold italic text-gray-900">
            &ldquo;Kelaman degan edi, lekin kelmadi&rdquo;
          </span>{" "}
          — shu gap ko&apos;p eshitiladi. Natijada bo&apos;sh vaqt ham,
          daromad ham ketadi. BOOKUP esa tashrifdan 2 soat oldin mijozga
          avtomatik SMS eslatma yuboradi — mijoz unutib qo&apos;ymaydi.
        </p>
      </article>
    </section>
  );
}

/** `icon` is rendered inside a tinted tile (`tile`); brand icons (Telegram,
 * Instagram) carry their own colors, the rest take an accent tint. */
const FEATURES: Array<{
  title: string;
  text: string;
  icon: React.ReactNode;
  tile: string;
}> = [
  {
    title: "Aqlli jadval",
    text: "Kun, hafta va oy bo'yicha jonli jadval. Bron qo'yilganda vaqt avtomatik band bo'ladi — to'qnashuv bo'lmaydi.",
    icon: <CalendarClock className="h-6 w-6 text-white" strokeWidth={2} />,
    tile: "bg-blue-500",
  },
  {
    title: "Ustalar va xizmatlar",
    text: "Har bir master uchun alohida xizmatlar, narxlar va ish vaqti. Mijoz o'zi yoqtirgan ustani tanlaydi.",
    icon: <Scissors className="h-6 w-6 text-white" strokeWidth={2} />,
    tile: "bg-[var(--accent)]",
  },
  {
    title: "Tayyor sayt va onlayn bron",
    text: "Bepul saytingiz tayyor: sizning-biznes.bookup.uz. Linkni Instagram bio'ga qo'ying — mijozlar to'g'ridan-to'g'ri bron qiladi.",
    icon: <Globe className="h-6 w-6 text-white" strokeWidth={2} />,
    tile: "bg-violet-500",
  },
  {
    title: "Telegram bot",
    text: "Mijozlar Telegram'dan chiqmasdan vaqt va masterni tanlab bron qiladi. Bot tasdiq va eslatma yuboradi.",
    // Real Telegram logo — fills the tile, no colored background.
    icon: <TelegramLogo className="h-12 w-12" />,
    tile: "",
  },
  {
    title: "Instagram integratsiyasi",
    text: "DM xabarlarga AI yordamida avto-javob, izohlarni boshqarish va profil bio'da «Bron qilish» tugmasi.",
    // Real Instagram logo — fills the tile, no colored background.
    icon: <InstagramLogo className="h-12 w-12" />,
    tile: "",
  },
  {
    title: "Mijozlar bazasi",
    text: "Har bir mijozning tashriflar tarixi, sevimli xizmatlari va shaxsiy izohlar avtomatik saqlanadi.",
    icon: <Users className="h-6 w-6 text-white" strokeWidth={2} />,
    tile: "bg-emerald-500",
  },
  {
    title: "SMS tasdiq va eslatma",
    text: "Bron tasdig'i va tashrifdan 2 soat oldin avtomatik eslatma — har bir mijozga yetib boradi.",
    icon: <MessageSquareText className="h-6 w-6 text-white" strokeWidth={2} />,
    tile: "bg-amber-500",
  },
  {
    title: "Chegirma va sodiqlik dasturi",
    text: "Chegirma kodlari, takroriy tashriflar uchun bonus ballar va tug'ilgan kun aksiyalari.",
    icon: <Gift className="h-6 w-6 text-white" strokeWidth={2} />,
    tile: "bg-fuchsia-500",
  },
  {
    title: "Mijoz baholari",
    text: "Tashrifdan keyin mijoz baho va izoh qoldiradi. Eng kuchli ustalaringizni ajratib ko'rsating, sifatni nazorat qiling.",
    icon: <Star className="h-6 w-6 text-white" strokeWidth={2} />,
    tile: "bg-yellow-400",
  },
];

function Features() {
  return (
    <section className="mt-20 md:mt-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Imkoniyatlar
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
          Sartaroshxonangiz uchun{" "}
          <span className="text-gray-500">to&apos;liq tizim.</span>
        </h2>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:mt-14">
        {FEATURES.map((f) => (
          <article
            key={f.title}
            className="rounded-3xl bg-gray-50 p-6 transition hover:bg-gray-100 md:p-7"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${f.tile}`}>
              {f.icon}
            </div>
            <h3 className="mt-5 text-lg 2xl:text-xl font-bold tracking-tight text-gray-900">
              {f.title}
            </h3>
            <p className="mt-2 text-base leading-relaxed text-gray-600">
              {f.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

const STEPS: Array<{
  title: string;
  text: string;
  badgeText: string;
  badgeColor: string;
  gradient: "blue" | "green" | "orange" | "pink" | "purple" | "gray";
  ctaText: string;
}> = [
  {
    title: "Hisob ochasiz",
    text: "Telefon raqamingizni kiritib, biznesingiz haqida bir necha savolga javob berasiz — bor-yo'g'i 2 daqiqada.",
    badgeText: "Tezda",
    badgeColor: "#3B82F6",
    gradient: "blue",
    ctaText: "Hisob ochish",
  },
  {
    title: "Masterlar va xizmatlarni qo'shasiz",
    text: "Har bir master uchun xizmatlar, narxlar va ish jadvalini sozlaysiz. Tayyor shablonlar yordamida tez to'ldiriladi.",
    badgeText: "Oson sozlash",
    badgeColor: "#10B981",
    gradient: "green",
    ctaText: "Imkoniyatlar",
  },
  {
    title: "Mijozlar yoza boshlaydi",
    text: "Telegram bot va saytingiz tayyor. Linkni Instagram bio'ga qo'ying — mijozlar darhol onlayn yozila boshlaydi.",
    badgeText: "Tayyor",
    badgeColor: "#F43F5E",
    gradient: "pink",
    ctaText: "Demo ko'rish",
  },
];

function HowItWorks() {
  return (
    <section className="mt-20 rounded-t-[2rem] bg-white pt-14 pb-12 shadow-[0_-10px_25px_rgba(0,0,0,0.1)] md:mt-28 md:rounded-t-[3rem] md:pt-20 lg:rounded-t-[5rem] lg:pt-24 2xl:rounded-t-[10rem] 2xl:pt-32">
      <div className="mx-auto max-w-[1360px] px-5">
        <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Qanday ishlaydi
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
          <span className="text-[var(--accent)]">5 daqiqada.</span>{" "}
          <span className="text-gray-500">3 ta oddiy qadam.</span>
        </h2>
      </div>

      <div className="my-12 grid gap-5 md:mt-16 md:grid-cols-3 md:gap-6">
        {STEPS.map((s) => (
          <GradientCard
            key={s.title}
            gradient={s.gradient}
            badgeText={s.badgeText}
            badgeColor={s.badgeColor}
            title={s.title}
            description={s.text}
            ctaText={s.ctaText}
            ctaHref="#"
            className="min-h-[20rem]"
          />
        ))}
      </div>
      </div>

      <div className="mx-auto mt-14 rounded-[3rem] bg-[var(--accent)]/10 px-8 py-14 md:mt-20 md:rounded-[5rem] md:px-16 md:py-24 lg:px-20">
        <div className="mx-auto max-w-[1360px] px-5 grid gap-8 md:grid-cols-2 md:items-center md:gap-12 lg:gap-20">
          <h3 className="text-3xl font-extrabold leading-[1.4] tracking-tight text-gray-900 md:text-4xl">
            O&apos;rnatib beramiz. Sozlaymiz.  <br />O&apos;rgatamiz.{" "}
            <span className="text-[var(--accent)]">Bepul.</span>
          </h3>
          <p className="max-w-md text-base leading-[1.8] text-gray-600 md:text-lg">
            Menejerimiz tizimni o&apos;rnatishda, masterlaringizni
            o&apos;qitishda va xizmatlarni qo&apos;shishda yordam beradi —
            ustiga{" "}
            <span className="font-semibold text-[var(--accent)]">14 kun</span> bepul
            foydalanish ham beriladi!
          </p>
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="mt-20 md:mt-28">
      <div className="relative overflow-hidden rounded-[2.25rem] bg-gray-950 p-8 text-white md:p-14 lg:p-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[var(--accent)]/30 blur-3xl"
        />
        <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="max-w-xl">
            <h2 className="text-2xl font-extrabold leading-[1.1] tracking-tight md:text-3xl lg:text-4xl">
              Sartaroshxonangizni bugun{" "}
              <span className="text-gray-500">BOOKUP&apos;ga ulang.</span>
            </h2>
            <p className="mt-5 text-base text-gray-300">
              14 kun bepul. Bank kartasi talab qilinmaydi. Menejerimiz
              hammasini siz uchun o&apos;rnatadi.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              Bepul boshlash
            </a>
            <a
              href="tel:+998883634020"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              +998 88 363 40 20
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
