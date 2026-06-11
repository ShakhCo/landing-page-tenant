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
    title: "Bookup — Онлайн банд қилиш платформаси",
    description:
      "Bookup — бизнесингиз учун онлайн банд қилиш тизими. Мижозлар хизматларингизни 24/7 брон қилади; жадвал, мижозлар ва тўловларни битта жойда бошқаринг. Сартарошхона, гўзаллик салони, клиника, спорт ва бошқа хизматлар учун.",
  },
  ru: {
    title: "Bookup — Платформа онлайн-записи",
    description:
      "Bookup — система онлайн-записи для вашего бизнеса. Клиенты бронируют ваши услуги 24/7; расписание, клиенты и оплаты — в одном месте. Для барбершопов, салонов красоты, клиник, спорта и других услуг.",
  },
  en: {
    title: "Bookup — Online Booking Platform",
    description:
      "Bookup is an online booking system for your business. Customers book your services 24/7; manage your schedule, clients, and payments in one place. For barbershops, beauty salons, clinics, sports, and other services.",
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
  return {
    title: { absolute: meta.title },
    description: meta.description,
    alternates: {
      canonical: CANONICALS[locale],
      languages: LANGUAGES,
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
