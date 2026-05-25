'use client';

import React, { useState, useEffect, useRef } from 'react';

// --- Data for the feature cards ---
const features = [
  {
    title: "Aqlli jadval va kalendar",
    intro: "Xodimlar, xonalar va stollar — bitta panelda.",
    bullets: [
      "Vaqt to'qnashuvlari avtomatik oldini olinadi",
      "Real vaqt rejimidagi jonli jadval",
      "Bir nechta xodim va xizmat turi qo'llab-quvvatlanadi",
    ],
    imageUrl: "/schedule-photo.jpg",
    bgColor: "bg-rose-100 dark:bg-rose-950/40",
    textColor: "text-gray-700 dark:text-gray-200",
    checkColor: "bg-rose-500 text-white",
  },
  {
    title: "Onlayn yozilish 24/7",
    intro: "Mijozlar siz uxlayotganingizda ham yozilishadi.",
    bullets: [
      <>
        Bepul shaxsiy sayt:{" "}
        <strong className="font-semibold text-gray-900">
          sizning-biznes.bookup.uz
        </strong>
      </>,
      "Instagram va Telegramdan to'g'ridan-to'g'ri ulanish",
      "Ilova o'rnatish shart emas",
      "Tasdiqlash va SMS eslatmalar avtomatik",
    ],
    imageUrl: "/booking-mobile.png",
    bgColor: "bg-cyan-100 dark:bg-cyan-950/40",
    textColor: "text-gray-700 dark:text-gray-200",
    checkColor: "bg-cyan-500 text-white",
  },
  {
    title: "Mijozlar bazasi va eslatmalar",
    intro: "Hech bir mijoz yo'qolmaydi, hech bir tashrif unutilmaydi.",
    bullets: [
      "Tashriflar tarixi va shaxsiy izohlar",
      "SMS va push xabarnomalar",
      "Sodiqlik dasturlari va bonus ballar",
      "Tug'ilgan kun va aksiya eslatmalari",
    ],
    imageUrl: "/cat-salon.jpg",
    bgColor: "bg-amber-100 dark:bg-amber-950/40",
    textColor: "text-gray-700 dark:text-gray-200",
    checkColor: "bg-amber-500 text-white",
  },
  {
    title: "Sevimli vositalaringiz bilan ulanadi",
    intro: "Bookup siz ishlatib turgan platformalarga oson bog'lanadi.",
    bullets: [
      "Telegram bot orqali yozilish va xabarlar",
      "Instagram profilidan to'g'ridan-to'g'ri ulanish",
      "Veb-sayt vidjeti — bir qator kod bilan",
    ],
    imageUrl: "/app-mockup.png",
    bgColor: "bg-stone-200 dark:bg-stone-900/60",
    textColor: "text-gray-700 dark:text-gray-200",
    checkColor: "bg-stone-600 text-white",
  },
];

// --- Check icon for bullets ---
const CheckIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m5 12 5 5L20 7" />
  </svg>
);

// --- Custom Hook for Scroll Animation ---
const useScrollAnimation = () => {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, inView] as const;
};

// --- Header Component ---
const AnimatedHeader = () => {
  const [headerRef, headerInView] = useScrollAnimation();
  const [pRef, pInView] = useScrollAnimation();

  return (
    <div className="mx-auto mb-16 max-w-3xl text-center">
      <p className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
        Imkoniyatlar
      </p>
      <h2
        ref={headerRef as React.RefObject<HTMLHeadingElement>}
        className={`text-4xl font-bold tracking-tight transition-all duration-700 ease-out md:text-5xl ${
          headerInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        } text-gray-900 dark:text-white`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        Bitta platforma — to'liq nazorat
      </h2>
      <p
        ref={pRef as React.RefObject<HTMLParagraphElement>}
        className={`mt-4 text-lg text-gray-600 transition-all duration-700 ease-out delay-200 dark:text-gray-300 ${
          pInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        Yozilishdan tahlilgacha — biznesni boshqarishning hamma jarayonlari bitta joyda.
      </p>
    </div>
  );
};

// This is the main component that orchestrates everything.
export function StickyFeatureSection() {
  return (
    <div className="bg-gray-50 rounded-2xl font-sans dark:bg-gray-950">
      <div className="px-[5%]">
        <div className="mx-auto max-w-7xl">
          <section className="flex flex-col items-center py-16 md:py-24">
            <AnimatedHeader />

            <div className="w-full">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`${feature.bgColor} sticky mb-16 grid grid-cols-1 items-center gap-4 rounded-3xl p-8 md:grid-cols-2 md:gap-8 md:p-12`}
                  style={{ top: '120px' }}
                >
                  <div className="flex flex-col justify-center">
                    <h3 className="mb-3 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl dark:text-white">
                      {feature.title}
                    </h3>
                    <p className={`mb-5 text-base md:text-lg ${feature.textColor}`}>
                      {feature.intro}
                    </p>
                    <ul className="space-y-2.5">
                      {feature.bullets.map((b, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full shadow-sm ${feature.checkColor}`}
                          >
                            <CheckIcon />
                          </span>
                          <span className={`text-sm md:text-base ${feature.textColor}`}>
                            {b}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="relative mx-auto mt-8 aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl shadow-lg md:mt-0">
                    <img
                      src={feature.imageUrl}
                      alt={feature.title}
                      loading="lazy"
                      className="h-full w-full object-cover object-top"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src =
                          'https://placehold.co/600x400/eeeeee/999999?text=Bookup';
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
