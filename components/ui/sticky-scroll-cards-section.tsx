'use client';

import React, { useState, useEffect, useRef } from 'react';
import homeUz, { type HomeDict } from '@/lib/dictionaries/home.uz';

type StickyDict = HomeDict['sticky'];

// --- Visual config for the feature cards (copy comes from the dictionary) ---
const FEATURE_STYLES = [
  {
    imageUrl: "/schedule-photo.jpg",
    bgColor: "bg-rose-100 dark:bg-rose-950/40",
    textColor: "text-gray-700 dark:text-gray-200",
    checkColor: "bg-rose-500 text-white",
  },
  {
    imageUrl: "/booking-mobile.png",
    bgColor: "bg-cyan-100 dark:bg-cyan-950/40",
    textColor: "text-gray-700 dark:text-gray-200",
    checkColor: "bg-cyan-500 text-white",
  },
  {
    imageUrl: "/cat-salon.jpg",
    bgColor: "bg-amber-100 dark:bg-amber-950/40",
    textColor: "text-gray-700 dark:text-gray-200",
    checkColor: "bg-amber-500 text-white",
  },
  {
    imageUrl: "/app-mockup.png",
    bgColor: "bg-stone-200 dark:bg-stone-900/60",
    textColor: "text-gray-700 dark:text-gray-200",
    checkColor: "bg-stone-600 text-white",
  },
];

function buildFeatures(dict: StickyDict) {
  return dict.features.map((f, i) => ({
    ...FEATURE_STYLES[i],
    title: f.title,
    intro: f.intro,
    bullets:
      i === 1
        ? ([
            <>
              {dict.freeSitePrefix}{" "}
              <strong className="font-semibold text-gray-900">
                sizning-biznes.bookup.uz
              </strong>
            </>,
            ...f.bullets,
          ] as React.ReactNode[])
        : ([...f.bullets] as React.ReactNode[]),
  }));
}

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
const AnimatedHeader = ({ dict }: { dict: StickyDict }) => {
  const [headerRef, headerInView] = useScrollAnimation();
  const [pRef, pInView] = useScrollAnimation();

  return (
    <div className="mx-auto mb-16 max-w-3xl text-center">
      <p className="text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
        {dict.eyebrow}
      </p>
      <h2
        ref={headerRef as React.RefObject<HTMLHeadingElement>}
        className={`mt-3 text-3xl font-semibold tracking-tight transition-all duration-700 ease-out md:text-4xl ${
          headerInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        } text-gray-900 dark:text-white`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {dict.title}
      </h2>
      <p
        ref={pRef as React.RefObject<HTMLParagraphElement>}
        className={`mt-4 text-base text-gray-600 transition-all delay-200 duration-700 ease-out md:text-lg dark:text-gray-300 ${
          pInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {dict.subtitle}
      </p>
    </div>
  );
};

// This is the main component that orchestrates everything.
export function StickyFeatureSection({
  dict = homeUz.sticky,
}: {
  dict?: StickyDict;
}) {
  const features = buildFeatures(dict);

  return (
    <div className="bg-gray-50 rounded-2xl font-sans dark:bg-gray-950">
      <div className="px-[5%]">
        <div className="mx-auto max-w-7xl">
          <section className="flex flex-col items-center py-16 md:py-24">
            <AnimatedHeader dict={dict} />

            <div className="w-full">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`${feature.bgColor} sticky top-20 mb-10 grid grid-cols-1 items-center gap-4 rounded-3xl p-6 sm:p-8 md:top-24 md:mb-16 md:grid-cols-2 md:gap-8 md:p-12 lg:top-32`}
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
