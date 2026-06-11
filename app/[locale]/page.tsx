import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePage } from "@/components/home/HomePage";
import ozDict from "@/lib/dictionaries/home.oz";
import ruDict from "@/lib/dictionaries/home.ru";
import enDict from "@/lib/dictionaries/home.en";
import type { HomeDict } from "@/lib/dictionaries/home.uz";

/**
 * Localized marketing landing page: /oz, /ru and /en. The default (uz) lives
 * at /. Tenant subdomains never reach this route — the middleware rewrites
 * them to /tenant/<sub>/..., which has no [locale] segment.
 */

type PageLocale = 'oz' | 'ru' | 'en';

const DICTS: Record<PageLocale, HomeDict> = {
  oz: ozDict,
  ru: ruDict,
  en: enDict,
};

const META: Record<PageLocale, { title: string; description: string }> = {
  oz: {
    title: "BOOKUP — Онлайн банд қилиш платформаси",
    description:
      "BOOKUP — бизнесингиз учун онлайн банд қилиш тизими. Мижозлар хизматларингизни 24/7 брон қилади; жадвал, мижозлар ва тўловларни битта жойда бошқаринг. Сартарошхона, гўзаллик салони, клиника, спорт ва бошқа хизматлар учун.",
  },
  ru: {
    title: "BOOKUP — Платформа онлайн-записи",
    description:
      "BOOKUP — система онлайн-записи для вашего бизнеса. Клиенты бронируют ваши услуги 24/7; расписание, клиенты и оплаты — в одном месте. Для барбершопов, салонов красоты, клиник, спорта и других услуг.",
  },
  en: {
    title: "BOOKUP — Online Booking Platform",
    description:
      "BOOKUP is an online booking system for your business. Customers book your services 24/7; manage your schedule, clients, and payments in one place. For barbershops, beauty salons, clinics, sports, and other services.",
  },
};

const LANGUAGES = {
  uz: "https://bookup.uz",
  "uz-Cyrl": "https://bookup.uz/oz",
  ru: "https://bookup.uz/ru",
  en: "https://bookup.uz/en",
};

const CANONICALS: Record<PageLocale, string> = {
  oz: LANGUAGES["uz-Cyrl"],
  ru: LANGUAGES.ru,
  en: LANGUAGES.en,
};

function isPageLocale(value: string): value is PageLocale {
  return value === 'oz' || value === 'ru' || value === 'en';
}

// Only the three known locales exist at the root — anything else is a hard 404,
// never an SSR pass through this page.
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: 'oz' }, { locale: 'ru' }, { locale: 'en' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isPageLocale(locale)) return {};
  const meta = META[locale];
  // OG/Twitter must be fully overridden here — page-level openGraph replaces
  // the layout's whole block, otherwise /ru and /en would ship Uzbek OG text.
  const ogLocale: Record<PageLocale, string> = { oz: 'uz_UZ', ru: 'ru_RU', en: 'en_US' };
  return {
    title: { absolute: meta.title },
    description: meta.description,
    alternates: {
      canonical: CANONICALS[locale],
      languages: LANGUAGES,
    },
    openGraph: {
      type: 'website',
      siteName: 'BOOKUP',
      title: meta.title,
      description: meta.description,
      url: CANONICALS[locale],
      locale: ogLocale[locale],
      images: [{ url: '/og.jpg', width: 640, height: 360, alt: 'BOOKUP — bookup.uz' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: ['/og.jpg'],
    },
  };
}

export default async function LocalizedHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isPageLocale(locale)) notFound();
  return <HomePage dict={DICTS[locale]} locale={locale} />;
}
