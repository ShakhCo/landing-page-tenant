'use client'

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { StickyFeatureSection } from "@/components/ui/sticky-scroll-cards-section";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  SocialFacebookIcon,
  SocialInstagramIcon,
  SocialTelegramIcon,
} from "@/components/icons";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-white text-[oklch(0.18_0_0)]">
      <Header />
      <main className="pb-8 md:pb-24">
        <div className="mx-auto max-w-[1360px] px-5">
          <HeroGrid />
          <SolutionsSection />
          <AcquiringSection />
          <SupportCtaSection />
        </div>
        <IntegrationsSection />
        <div className="mx-auto max-w-[1360px] px-5">
          <ProSection />
          <FaqSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function HeroGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-3 md:grid-rows-2 md:gap-5">
      {/* Big card top-left: spans 2 cols, row 1 */}
      <article className="group relative grid items-center gap-6 overflow-hidden rounded-3xl bg-gray-100 p-6 transition-shadow duration-300 hover:shadow-sm sm:p-8 md:col-span-2 md:grid-cols-[1fr_minmax(0,46%)] md:p-10">
        <div className="flex flex-col justify-center">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">
            Biznesingiz uchun<br /><span className="text-gray-500">onlayn band qilish</span>
          </h1>
          <p className="mt-6 max-w-xs text-base text-gray-600">
            Biznesingiz uchun qulay online yozilish tizimi. Mijozlar
            o&apos;zlari bo&apos;sh vaqtni tanlashadi, siz esa hamma
            jarayonni tartibli boshqarasiz.
          </p>
          <button className="mt-7 w-fit rounded-full bg-[var(--accent)] px-7 py-3 text-sm font-medium text-white shadow-sm transition hover:brightness-95">
            Hoziroq boshlash
          </button>
        </div>
        <div className="ml-auto h-56 w-full rounded-3xl bg-gray-50 p-2 sm:h-72">
          <div className="relative h-full w-full overflow-hidden rounded-[1.25rem]">
            <Image
              src="/hero-salon.jpg"
              alt="Zamonaviy salon interyeri"
              fill
              sizes="(min-width: 768px) 46vw, 100vw"
              className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
              priority
            />
          </div>
        </div>
      </article>

      {/* Tall card on the right: col 3, spans 2 rows */}
      <article className="group relative flex flex-col overflow-hidden rounded-3xl bg-gray-100 py-8 px-6 transition-shadow duration-300 hover:shadow-sm md:col-start-3 md:row-span-2">
        <div className="shrink-0 px-2">
          <h3 className="text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">
            <span className="text-gray-500">Mijozlar uchun</span><br />band qilish sahifasi
          </h3>
          <p className="mt-4 text-base text-gray-600">
            Mijozlar sizni onlayn topishlari, xizmatlar ro&apos;yxati va
            narxlarni ko&apos;rishlari mumkin. Shuningdek, reytinglar,
            sharhlar, joylashuv va ish vaqti ham ochiq ko&apos;rinadi.
          </p>
          <p className="mt-3 text-base text-gray-600">
            Bir necha soniyada o&apos;zlariga qulay vaqtni tanlab,
            osongina yozilishlari mumkin.
          </p>
        </div>
        <div className="mt-6 min-h-0 w-full flex-1 rounded-3xl bg-white p-2">
          <div className="relative h-full w-full overflow-hidden rounded-[1.25rem]">
            <Image
              src="/app-mockup.png"
              alt="Mijoz uchun ilova ko'rinishi"
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </div>
        </div>
      </article>

      {/* Bottom-left small card */}
      <article className="relative flex flex-col overflow-hidden rounded-3xl bg-gray-100 p-6 transition-shadow duration-300 hover:shadow-sm sm:p-8">
        <div className="flex items-start justify-between">
          <h3 className="text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">
            <span className="text-gray-500">Aqlli onlayn</span><br />jadval va kalendar
          </h3>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
            <IconScan />
          </span>
        </div>
        <p className="mt-6 text-base text-gray-600">
          Barcha yozuvlar bitta tizimda: xodimlar, xonalar va stollar
          bandligi doim nazoratda bo&apos;ladi.
        </p>
        <p className="mt-4 text-base text-gray-600">
          Mijozlar esa bo&apos;sh vaqtlarni online ko&apos;rib,
          o&apos;zlariga qulay vaqtni tanlashadi.
        </p>
        <button className="mt-auto self-start rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:brightness-95">
          Batafsil
        </button>
      </article>

      {/* Bottom-middle small card */}
      <article className="relative flex flex-col overflow-hidden rounded-3xl bg-gray-100 p-8 transition-shadow duration-300 hover:shadow-sm">
        <div className="flex items-start justify-between">
          <h3 className="text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">
            Mijozlar bazasi<br /><span className="text-gray-500">va eslatmalar</span>
          </h3>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
            <IconUserCard />
          </span>
        </div>
        <p className="mt-6 text-base text-gray-600">
          Mijozlar tarixi, oldingi tashriflari va eslatmalar barchasi
          bir joyda saqlanadi.
        </p>
        <p className="mt-4 text-base text-gray-600">
          SMS xabarnomalar avtomatik yuboriladi. Hech narsa unutib
          qolinmaydi.
        </p>
        <button className="mt-auto self-start rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:brightness-95">
          Batafsil
        </button>
      </article>
    </section>
  );
}

function IconScan() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="7" y="7" width="10" height="10" rx="1.5" stroke="var(--accent)" strokeWidth="1.8" />
    </svg>
  );
}

function IconUserCard() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="var(--accent)" strokeWidth="1.8" />
      <circle cx="9" cy="11.5" r="2" stroke="var(--accent)" strokeWidth="1.8" />
      <path d="M5 16.5c.7-1.7 2.2-2.7 4-2.7s3.3 1 4 2.7M14 10h5M14 13h3" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SolutionsSection() {
  const items: Array<{
    title: string;
    description: string;
    image: string;
  }> = [
    {
      title: "Sartaroshxonalar",
      description:
        "Ustalar bo'yicha jadval, xizmatlar narxlari va onlayn yozilish — bitta panelda.",
      image: "/cat-barbershop.jpg",
    },
    {
      title: "Go'zallik salonlari",
      description:
        "Manikyur, soch, qosh va boshqa xizmatlarga oson yozilish va xodimlar boshqaruvi.",
      image: "/cat-salon.jpg",
    },
    {
      title: "Bilyard va bouling klublari",
      description:
        "Stollar va yo'laklar bo'yicha jonli jadval, soatbay tariflar va to'lovlar.",
      image: "/cat-billiards.jpg",
    },
    {
      title: "Tennis va sport maydonchalari",
      description:
        "Kortlar va maydonchalarni soatlik band qilish, abonementlar va guruh mashg'ulotlari.",
      image: "/cat-tennis.jpg",
    },
    {
      title: "Stomatologiya va klinikalar",
      description:
        "Shifokor qabullari, davolanish bosqichlari va eslatmalar — barchasi nazoratda.",
      image: "/cat-dental.jpg",
    },
    {
      title: "Massaj va SPA salonlari",
      description:
        "Xonalar va terapevtlar jadvali, paketlar va sodiqlik dasturlari bitta joyda.",
      image: "/cat-spa.jpg",
    },
  ];
  return (
    <section className="mt-24 text-center">
      <p className="text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
        Kim uchun
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
        Har qanday biznes uchun
      </h2>
      <div className="mt-10 grid gap-5 text-left sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ title, description, image }) => (
          <article
            key={title}
            className="group flex flex-col rounded-3xl bg-gray-50 p-3 transition-shadow duration-300 hover:shadow-sm"
          >
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-white">
              <Image
                src={image}
                alt={title}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col px-3 pt-5 pb-4">
              <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-base text-gray-600">{description}</p>
              <a
                href="#"
                className="mt-5 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--accent)] transition-all hover:gap-2"
              >
                Batafsil
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AcquiringSection() {
  const steps: Array<{ title: string; description: string }> = [
    {
      title: "Mijoz onlayn yoziladi",
      description: "Sayt, Instagram yoki Telegram orqali bo'sh vaqtni tanlab band qiladi.",
    },
    {
      title: "Eslatma avtomatik yuboriladi",
      description: "SMS va push xabarnomalar tashrifdan oldin mijozga jo'natiladi.",
    },
    {
      title: "Tashrif jadval bo'yicha",
      description: "Hech narsa unutilmaydi — siz faqat o'z ishingizga e'tibor qarating.",
    },
    {
      title: "Sodiqlik va tahlil",
      description: "Bonus ballar yig'iladi, daromad va trendlar real vaqtda ko'rinadi.",
    },
  ];

  return (
    <section className="mt-24">

      <div className="w-full">
      <StickyFeatureSection />
    </div>

      {/* <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
          Imkoniyatlar
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Bitta panelda — butun biznesingiz
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-gray-600">
          Yozilishlar, to'lovlar, mijozlar va tahlil — barchasi bir
          joyda. Hamma narsa o'zaro bog'langan, qo'lda ish yo'q.
        </p>
      </div>

      <div className="mt-12 overflow-hidden rounded-3xl bg-gray-50 p-3 md:p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-4">
          <DashboardMock />

          <div className="flex flex-col rounded-3xl bg-white p-6 md:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                Qanday ishlaydi
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                Yozilishdan sodiqlikgacha
              </h3>
            </div>
            <ol className="relative mt-7 space-y-6">
              {steps.map((s, i) => (
                <li key={s.title} className="relative pl-14">
                  {i < steps.length - 1 && (
                    <span className="absolute left-[19px] top-10 h-[calc(100%+0.25rem)] w-px bg-gradient-to-b from-[var(--accent)]/40 to-transparent" />
                  )}
                  <span className="absolute left-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10 text-sm font-bold text-[var(--accent)] ring-4 ring-white">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="font-semibold text-gray-900">{s.title}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {s.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div> */}
    </section>
  );
}

function DashboardMock() {
  const days = [
    { label: "YAK", num: 24, weekend: true },
    { label: "DUSH", num: 25, today: true },
    { label: "SESH", num: 26 },
    { label: "CHOR", num: 27 },
    { label: "PAY", num: 28 },
    { label: "JUM", num: 29 },
    { label: "SHAN", num: 30, weekend: true },
  ];

  const PX_PER_15 = 30;
  const TOTAL_MIN = 135;
  const HEIGHT = (TOTAL_MIN / 15) * PX_PER_15;

  const timeLabels = [
    { offset: 0, label: "10:00", major: true },
    { offset: 15, label: "15" },
    { offset: 30, label: "30" },
    { offset: 45, label: "45" },
    { offset: 60, label: "11:00", major: true },
    { offset: 75, label: "15" },
    { offset: 90, label: "30" },
    { offset: 105, label: "45" },
    { offset: 120, label: "12:00", major: true },
  ];

  const appointments = [
    {
      start: 0,
      duration: 30,
      timeRange: "10:00 – 10:30",
      service: "Soch olish",
      price: "30 000",
      bg: "bg-amber-50",
      bar: "bg-amber-400",
      text: "text-amber-600",
    },
    {
      start: 45,
      duration: 30,
      timeRange: "10:45 – 11:15",
      service: "Bosh massaji · Soqol olish",
      price: "35 000",
      bg: "bg-rose-50",
      bar: "bg-rose-400",
      text: "text-rose-500",
    },
    {
      start: 90,
      duration: 45,
      timeRange: "11:30 – 12:15",
      service: "Soch va soqol",
      price: "45 000",
      bg: "bg-indigo-50",
      bar: "bg-indigo-500",
      text: "text-indigo-600",
    },
  ];

  return (
    <div className="rounded-3xl bg-white p-5 md:p-6">
      <div className="flex items-center gap-1 pb-5">
        {days.map((d) => (
          <div
            key={d.num}
            className="flex flex-1 flex-col items-center gap-2"
          >
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                d.weekend ? "text-rose-500" : "text-gray-400"
              }`}
            >
              {d.label}
            </span>
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                d.today
                  ? "bg-gray-900 text-white"
                  : d.weekend
                    ? "text-gray-800"
                    : "text-gray-700"
              }`}
            >
              {d.num}
            </span>
          </div>
        ))}
      </div>

      <div
        className="relative"
        style={{ height: `${HEIGHT + 12}px` }}
      >
        {timeLabels.map((t) => (
          <div
            key={t.offset}
            className="absolute left-0 z-20"
            style={{
              top: `${(t.offset / 15) * PX_PER_15}px`,
              transform: "translateY(-50%)",
            }}
          >
            <span
              className={
                t.major
                  ? "text-[13px] font-medium text-gray-700"
                  : "text-[11px] text-gray-400"
              }
            >
              {t.label}
            </span>
          </div>
        ))}

        {[15, 30, 45, 60, 75, 90, 105, 120].map((min) => (
          <div
            key={min}
            className="absolute right-0 left-12 border-t border-dashed border-gray-100"
            style={{ top: `${(min / 15) * PX_PER_15}px` }}
          />
        ))}

        <div
          className="absolute right-0 left-12 z-10 flex items-center"
          style={{ top: `${(45 / 15) * PX_PER_15}px` }}
        >
          <span className="-ml-[5px] h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.18)]" />
          <span className="h-[1.5px] flex-1 bg-rose-500" />
        </div>

        {appointments.map((a) => (
          <div
            key={a.start}
            className={`absolute right-0 left-12 overflow-hidden rounded-md ${a.bg} py-1.5 pr-3 pl-4`}
            style={{
              top: `${(a.start / 15) * PX_PER_15}px`,
              height: `${(a.duration / 15) * PX_PER_15}px`,
            }}
          >
            <span
              className={`absolute top-0 bottom-0 left-0 w-[3px] ${a.bar}`}
            />
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${a.text}`}>
                {a.timeRange}
              </span>
              <span className={`text-xs font-bold ${a.text}`}>
                {a.price} so&apos;m
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-gray-700">
              {a.service}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SupportCtaSection() {
  const cta = (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );

  const renderRow = (prefix: string) =>
    Array.from({ length: 5 }).flatMap((_, i) => [
      <span
        key={`${prefix}-text-${i}`}
        className="text-2xl font-bold tracking-tight md:text-4xl"
      >
        <span className="text-gray-400">Bepul</span>{" "}
        <span className="text-gray-900">yordam va qo&apos;llab-quvvatlash</span>
      </span>,
      <span
        key={`${prefix}-dot-${i}`}
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
        aria-hidden
      />,
    ]);

  return (
    <section className="mt-16">
      <div
        className="overflow-hidden border-y border-gray-200 py-6"
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
          width: "100vw",
        }}
      >
        <div
          className="flex w-max whitespace-nowrap"
          style={{ animation: "marquee 60s linear infinite" }}
        >
          <div className="flex shrink-0 items-center gap-10 pr-10 md:gap-14 md:pr-14">
            {renderRow("a")}
          </div>
          <div
            className="flex shrink-0 items-center gap-10 pr-10 md:gap-14 md:pr-14"
            aria-hidden
          >
            {renderRow("b")}
          </div>
        </div>
      </div>

      <div className="mt-16 grid gap-5 md:grid-cols-2">
        <article className="flex flex-col rounded-3xl bg-gray-50 p-8 md:p-10">
          <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
            Yozilishlarni hali ham{" "}
            <span className="text-[var(--accent)]">daftarga yozasiz yoki yodda</span>{" "}
            saqlaysizmi?
          </h3>
          <p className="mt-4 text-base text-gray-600">
            Agar javob{" "}
            <span className="font-semibold italic text-gray-900">
              &quot;daftarni ochib ko&apos;rishim kerak&quot;
            </span>{" "}
            bo&apos;lsa, biznesingiz{" "}
            <span className="font-semibold text-red-600">xavf ostida</span>.
            Yo&apos;qolgan daftar, o&apos;chirilgan yozuv yoki
            noto&apos;g&apos;ri eslab qolingan vaqt bir kunlik daromadingizni
            yo&apos;qqa chiqaradi.
          </p>
          <p className="mt-3 text-base text-gray-600">
            Onlayn yozilish bilan har bir mijoz va har bir bo&apos;sh joy
            bir ekranda. Biz hammasini o&apos;rnatamiz va jamoangizni
            o&apos;rgatamiz —{" "}
            <span className="font-bold text-gray-900">BEPUL</span>.
          </p>
          <a
            href="#"
            className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:brightness-95"
          >
            Menejer bilan bog&apos;lanish
            {cta}
          </a>
        </article>

        <article className="flex flex-col rounded-3xl bg-gray-50 p-8 md:p-10">
          <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
            Boshqa tizimdan{" "}
            <span className="text-[var(--accent)]">ko&apos;chish qiyin</span>{" "}
            deb o&apos;ylayapsizmi?
          </h3>
          <p className="mt-4 text-base text-gray-600">
            Ko&apos;pchilik yangi platformaga o&apos;tishdan{" "}
            <span className="font-semibold italic text-gray-900">
              &quot;ma&apos;lumotlar yo&apos;qoladi&quot;
            </span>
            ,{" "}
            <span className="font-semibold italic text-gray-900">
              &quot;ish to&apos;xtaydi&quot;
            </span>{" "}
            deb qo&apos;rqadi. Bookup&apos;da bunday muammo yo&apos;q —
            mavjud mijozlaringiz, yozilishlar tarixi va jadvalingizni biz
            o&apos;zimiz ko&apos;chirib o&apos;tkazamiz.
          </p>
          <p className="mt-3 text-base text-gray-600">
            Siz hech narsa qilmaysiz, biznesingiz esa{" "}
            <span className="font-semibold text-gray-900">
              bir kun ham to&apos;xtamaydi
            </span>
            .
          </p>
          <a
            href="#"
            className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:brightness-95"
          >
            Menejer bilan bog&apos;lanish
            {cta}
          </a>
        </article>
      </div>
    </section>
  );
}

type Integration = {
  id: string;
  name: string;
  title: string;
  description: string;
  href: string;
  bullets: string[];
  Logo: () => React.ReactElement;
  cardBg: string;
  accentText: string;
  badgeBg: string;
  decorTint: string;
};

const INTEGRATIONS: Integration[] = [
  {
    id: "telegram",
    name: "Telegram",
    title: "Telegram'da yozilish va aloqa",
    description:
      "Mijozlar Telegram'dan chiqmasdan to'liq bron qiladi — Mini App orqali xizmat va vaqtni tanlaydi, bot esa tasdiq va eslatmalarni avtomatik yuboradi.",
    href: "#telegram",
    bullets: [
      "Mini App ichida to'liq bron",
      "Bot eslatmalar va tasdiqlar",
      "Operator chati Telegram'da",
    ],
    Logo: LogoTelegram,
    cardBg: "bg-gradient-to-br from-[#2AABEE] via-[#229ED9] to-[#1B82B3]",
    accentText: "text-white",
    badgeBg: "bg-white/15 backdrop-blur",
    decorTint: "bg-white/10",
  },
  {
    id: "instagram",
    name: "Instagram",
    title: "Instagram profilingizdan to'g'ridan-to'g'ri",
    description:
      "DM va profil bio'sini yozilish kanaliga aylantiring. AI mijozlar bilan suhbatlashadi, vaqt taklif qiladi va bronni yopadi — siz esa hammasini bir joyda ko'rasiz.",
    href: "#instagram",
    bullets: [
      "DM ga AI avto-javob",
      "Profilda «Bron qilish» tugmasi",
      "Suhbatlar tarixi saqlanadi",
    ],
    Logo: LogoInstagram,
    cardBg:
      "bg-[radial-gradient(circle_at_30%_110%,#FEDA77_0%,#F58529_20%,#DD2A7B_50%,#8134AF_75%,#515BD4_100%)]",
    accentText: "text-white",
    badgeBg: "bg-white/15 backdrop-blur",
    decorTint: "bg-white/10",
  },
  {
    id: "veb-sayt",
    name: "Veb-sayt",
    title: "Biznesingiz — bookup.uz subdomenida",
    description:
      "Mijozlar uchun chiroyli, tezkor va SEO uchun tayyor sayt. Hisob ochasiz, xizmatlarni qo'shasiz — sayt o'zi tayyor bo'ladi. sizning-biznes.bookup.uz manzili bepul.",
    href: "#veb-sayt",
    bullets: [
      "sizning-biznes.bookup.uz bepul",
      "Mobil va desktop'da chiroyli",
      "Google'da topilish uchun tayyor",
    ],
    Logo: LogoWeb,
    cardBg: "bg-gray-900",
    accentText: "text-white",
    badgeBg: "bg-white/10 backdrop-blur",
    decorTint: "bg-white/5",
  },
  {
    id: "sms",
    name: "SMS",
    title: "SMS tasdiq va eslatmalar",
    description:
      "Beeline, Ucell, Mobiuz va Humans operatorlari orqali — har bir mijozga xabar yetib boradi. OTP bilan xavfsiz kirish, bron tasdig'i va tashrifdan 1 soat oldin eslatma.",
    href: "#sms",
    bullets: [
      "Barcha O'zbekiston operatorlari",
      "OTP orqali xavfsiz kirish",
      "Avto-tasdiq va eslatma",
    ],
    Logo: LogoSms,
    cardBg: "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700",
    accentText: "text-white",
    badgeBg: "bg-white/15 backdrop-blur",
    decorTint: "bg-white/10",
  },
];

function IntegrationsSection() {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;
    const update = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    update();
    carouselApi.on("select", update);
    return () => {
      carouselApi.off("select", update);
    };
  }, [carouselApi]);

  return (
    <section className="relative mt-24 rounded-t-[2rem] bg-white pt-14 pb-24 shadow-[0_-10px_25px_rgba(0,0,0,0.1)] md:rounded-t-[3rem] md:pt-20 lg:rounded-t-[5rem] lg:pt-24 2xl:rounded-t-[10rem] 2xl:pt-32">
      <div className="container mx-auto max-w-[1360px] px-5">
        <div className="mb-10 flex items-end justify-between gap-6 md:mb-14 lg:mb-16">
          <div className="flex max-w-3xl flex-col gap-4">
            <p className="text-sm font-medium uppercase tracking-wider text-gray-500">
              Integratsiyalar
            </p>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-4xl lg:text-5xl">
              Sevimli vositalaringiz{" "}
              <span className="text-gray-500">bilan ulanadi</span>
            </h2>
            <p className="max-w-lg text-base text-gray-600">
              Bookup siz ishlatib turgan platformalarga osongina bog&apos;lanadi —
              hech narsani yangidan boshlashga hojat yo&apos;q.
            </p>
          </div>
          <div className="hidden shrink-0 gap-2 md:flex">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => carouselApi?.scrollPrev()}
              disabled={!canScrollPrev}
              className="disabled:pointer-events-auto rounded-full border border-gray-200 hover:bg-gray-100"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => carouselApi?.scrollNext()}
              disabled={!canScrollNext}
              className="disabled:pointer-events-auto rounded-full border border-gray-200 hover:bg-gray-100"
            >
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full">
        <Carousel
          setApi={setCarouselApi}
          opts={{
            breakpoints: {
              "(max-width: 768px)": { dragFree: true },
            },
          }}
        >
          <CarouselContent
            style={{
              marginLeft: "max(20px, calc((100vw - 1360px) / 2 + 10px))",
              marginRight: "max(0px, calc((100vw - 1360px) / 2))",
            }}
          >
            {INTEGRATIONS.map((it, idx) => (
              <CarouselItem
                key={it.id}
                className={`basis-auto ${idx === 0 ? "!pl-0" : "pl-5"}`}
              >
                <a href={it.href} className="group block">
                  <article
                    className={`relative flex h-[32rem] w-[20rem] flex-col justify-between overflow-hidden rounded-3xl p-7 shadow-xl sm:w-[22rem] md:h-[34rem] md:w-[24rem] md:p-8 ${it.cardBg} ${it.accentText}`}
                  >
                    {/* Decorative tints */}
                    <span
                      aria-hidden
                      className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl ${it.decorTint}`}
                    />
                    <span
                      aria-hidden
                      className={`pointer-events-none absolute -bottom-24 -left-12 h-72 w-72 rounded-full blur-3xl ${it.decorTint}`}
                    />

                    {/* Top: logo badge + name pill */}
                    <div className="relative flex items-start justify-between">
                      <div
                        className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg ring-1 ring-white/20 ${it.badgeBg}`}
                      >
                        <it.Logo />
                      </div>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
                        {it.name}
                      </span>
                    </div>

                    {/* Bottom: title, description, bullets, cta */}
                    <div className="relative flex flex-col items-start">
                      <h3 className="text-2xl font-semibold leading-tight tracking-tight md:text-[1.65rem]">
                        {it.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-white/85 md:text-[15px]">
                        {it.description}
                      </p>
                      <ul className="mt-5 space-y-2">
                        {it.bullets.map((b) => (
                          <li
                            key={b}
                            className="flex items-center gap-2 text-sm text-white/90"
                          >
                            <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/20">
                              <CheckMini />
                            </span>
                            {b}
                          </li>
                        ))}
                      </ul>
                      <span className="mt-6 flex items-center text-sm font-medium">
                        Batafsil{" "}
                        <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </article>
                </a>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="mt-8 flex justify-center gap-2">
          {INTEGRATIONS.map((it, index) => (
            <button
              key={it.id}
              type="button"
              className={`h-2 rounded-full transition-all ${
                currentSlide === index ? "w-8 bg-gray-900" : "w-2 bg-gray-300"
              }`}
              onClick={() => carouselApi?.scrollTo(index)}
              aria-label={`Slayd ${index + 1}: ${it.name}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CheckMini() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

function LogoTelegram() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
    </svg>
  );
}

function LogoInstagram() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LogoWeb() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

function LogoSms() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z" />
      <path d="M8 11h.01M12 11h.01M16 11h.01" strokeWidth="2.6" />
    </svg>
  );
}

function ProSection() {
  const features = [
    "Onlayn jadval va kalendar",
    "Mijozlar bazasi va tashriflar tarixi",
    "SMS va push xabarnomalar",
    "Tahlil va hisobotlar",
  ];
  return (
    <section className="relative mt-12 overflow-hidden rounded-[2.25rem] bg-gray-950 p-8 md:p-12 lg:p-16">
      {/* Accent glow background */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[var(--accent)]/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[var(--accent)]/20 blur-3xl"
      />
      {/* Faint grid pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,42%)] lg:gap-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white ring-1 ring-inset ring-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
            Mobil ilova
          </span>
          <h2 className="mt-5 text-3xl font-bold leading-[1.1] tracking-tight text-white md:text-4xl lg:text-5xl">
            Biznesni
            <br />
            <span className="text-[var(--accent)]">cho&apos;ntakda</span> olib
            yuring
          </h2>
          <p className="mt-5 max-w-md text-base text-gray-400">
            Bookup Business — biznes egalari uchun mobil ilova. Yozilishlarni
            qabul qiling, mijozlar bilan ishlang va daromadni real vaqtda
            kuzating.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-3 text-sm text-gray-200"
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)] ring-1 ring-inset ring-[var(--accent)]/20">
                  <CheckIcon />
                </span>
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap gap-2 md:gap-3">
            <a
              href="#"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-gray-900 transition hover:bg-gray-50 md:gap-3 md:rounded-2xl md:px-5 md:py-3"
            >
              <PlatformIconIOS />
              <div className="text-left leading-tight">
                <p className="text-[9px] uppercase tracking-wider text-gray-500 md:text-[10px]">
                  Yuklash
                </p>
                <p className="text-sm font-semibold md:text-base">iOS uchun</p>
              </div>
            </a>
            <a
              href="#"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-gray-900 transition hover:bg-gray-50 md:gap-3 md:rounded-2xl md:px-5 md:py-3"
            >
              <PlatformIconAndroid />
              <div className="text-left leading-tight">
                <p className="text-[9px] uppercase tracking-wider text-gray-500 md:text-[10px]">
                  Yuklash
                </p>
                <p className="text-sm font-semibold md:text-base">Android uchun</p>
              </div>
            </a>
          </div>
        </div>

        <div className="relative mx-auto h-80 w-full max-w-xs md:h-[28rem] md:max-w-sm">
          <div
            aria-hidden
            className="absolute inset-x-8 top-10 bottom-10 rounded-[3rem] bg-[var(--accent)]/30 blur-3xl"
          />
          <div className="relative h-full w-full rotate-[-6deg] drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]">
            <div className="relative h-full w-full overflow-hidden rounded-[1.75rem]">
              <Image
                src="/app-mockup.png"
                alt="Bookup Business mobil ilova"
                fill
                sizes="(min-width: 1024px) 400px, 320px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

function PlatformIconIOS() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-[18px] md:size-[22px]">
      <path d="M14.94 5.19A4.38 4.38 0 0 0 16 2c-1 .07-2.25.74-2.97 1.52-.65.69-1.22 1.81-1.07 2.94 1.13.09 2.3-.6 2.98-1.27Zm2.52 6.16a4.41 4.41 0 0 1 2.1-3.7 4.5 4.5 0 0 0-3.55-1.92c-1.49-.15-2.92.88-3.68.88-.78 0-1.94-.86-3.2-.84-1.64.02-3.16.95-4.01 2.41-1.71 2.96-.44 7.34 1.22 9.75.81 1.18 1.78 2.5 3.04 2.45 1.22-.05 1.68-.78 3.16-.78 1.47 0 1.88.78 3.17.75 1.31-.02 2.14-1.19 2.95-2.38a10.5 10.5 0 0 0 1.34-2.73 4.27 4.27 0 0 1-2.54-3.89Z" />
    </svg>
  );
}

function PlatformIconAndroid() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-[18px] md:size-[22px]">
      <path d="M17.6 9.48 19.16 6.8a.3.3 0 0 0-.52-.3l-1.59 2.75a10.27 10.27 0 0 0-9.1 0L6.36 6.5a.3.3 0 1 0-.52.3L7.4 9.48a8.66 8.66 0 0 0-4.52 7.04h18.24a8.66 8.66 0 0 0-4.52-7.04ZM7.7 14.45a.85.85 0 1 1 0-1.7.85.85 0 0 1 0 1.7Zm8.6 0a.85.85 0 1 1 0-1.7.85.85 0 0 1 0 1.7Z" />
    </svg>
  );
}

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "Bookup nima?",
    a: "Bookup — O'zbekiston bizneslari uchun onlayn yozilish va mijozlar bazasini boshqarish platformasi. Sartaroshxona, salon, stomatologiya, bilyard, tennis va boshqa xizmat ko'rsatish bizneslari uchun mo'ljallangan.",
  },
  {
    q: "Qanday biznes turlari ulanadi?",
    a: "Sartaroshxonalar, go'zallik salonlari, stomatologiya, SPA, bilyard, bouling, tennis, fitness — qisqasi, vaqt asosida xizmat ko'rsatadigan har qanday biznes ulansa bo'ladi.",
  },
  {
    q: "Onlayn to'lovlar qanday ishlaydi?",
    a: "Onlayn to'lovlar tez orada qo'shiladi — Click, Payme, Uzum va bank kartalari orqali. Pul to'g'ridan-to'g'ri sizning hisobingizga tushadi, biz vositachilik qilmaymiz. Yangilanishlar haqida xabardor bo'lish uchun obuna bo'ling.",
  },
  {
    q: "Mijozlar uchun mobil ilova bormi?",
    a: "Alohida ilova o'rnatish shart emas. Mijozlaringiz Telegram orqali yoki sizning bookup.uz subdomenidagi sayt orqali bron qilishadi — mobil va desktop'da bir xil chiroyli ishlaydi.",
  },
  {
    q: "Komissiya qancha?",
    a: "Bookup bronlardan komissiya olmaydi. Faqat oylik obuna to'lovi mavjud — biznes hajmiga qarab tariflar farq qiladi. Batafsil narxlar bilan menejer tanishtiradi.",
  },
  {
    q: "Demo versiyani sinab ko'rsa bo'ladimi?",
    a: "Albatta. 14 kunlik bepul sinov muddati taqdim etamiz — bank kartasi talab qilinmaydi. Menejerimiz tizimni sozlashda va jamoangizni o'qitishda yordam beradi.",
  },
  {
    q: "Texnik yordam qanday ishlaydi?",
    a: "Telefon (+998 88 363 40 20), Telegram va elektron pochta orqali — kuniga 24 soat, haftada 7 kun aloqadamiz. O'rtacha javob vaqti — 5 daqiqa.",
  },
  {
    q: "Hamkor bo'lish mumkinmi?",
    a: "Ha. Hamkorlik dasturimiz mavjud — siz olib kelgan har bir biznes uchun komissiya to'laymiz. Batafsil shartlar uchun menejer bilan bog'laning.",
  },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="mt-24">
      <div className="grid grid-cols-1 items-start gap-12 sm:grid-cols-[5fr_7fr] sm:gap-10 lg:gap-16">
        {/* Left: heading + description + socials */}
        <aside className="flex flex-col sm:sticky sm:top-32">
          <p className="text-sm font-medium uppercase tracking-wider text-gray-500">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-gray-900 md:text-4xl">
            Savollar bormi?
            <br />
            <span className="text-[var(--accent)]">
              Bizda javoblar bor!
            </span>
          </h2>
          <p className="mt-6 max-w-sm text-base text-gray-500">
            Biz bilan bog&apos;laning — barcha savollaringizga tez va aniq
            javob beramiz.
          </p>

          <div className="mt-12 flex gap-3">
            <AccentSocialLink label="Telegram" href="#">
              <SocialTelegramIcon />
            </AccentSocialLink>
            <AccentSocialLink label="Instagram" href="#">
              <SocialInstagramIcon />
            </AccentSocialLink>
            <AccentSocialLink label="Facebook" href="#">
              <SocialFacebookIcon />
            </AccentSocialLink>
          </div>
        </aside>

        {/* Right: popular banner + question pills */}
        <div className="flex min-w-0 flex-col gap-3">
          <div className="rounded-2xl bg-[var(--accent)] py-4 text-center text-base font-semibold text-white">
            Eng ko&apos;p so&apos;raladigan
          </div>

          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-2xl bg-gray-100 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left md:px-7 md:py-6"
                >
                  <span className="text-base font-semibold tracking-tight text-gray-900 md:text-lg">
                    {item.q}
                  </span>
                  <Plus
                    className={`size-5 shrink-0 text-gray-500 transition-transform duration-300 ${
                      isOpen ? "rotate-45 text-[var(--accent)]" : ""
                    }`}
                    strokeWidth={2}
                  />
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-sm leading-relaxed text-gray-600 md:px-7 md:pb-7 md:text-base">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AccentSocialLink({
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
      className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-white transition hover:brightness-90"
    >
      {children}
    </a>
  );
}


