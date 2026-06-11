import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";
import uzDict from "@/lib/dictionaries/home.uz";

// Title/description/OG come from app/layout.tsx — only hreflang/canonical here.
export const metadata: Metadata = {
  alternates: {
    canonical: "https://bookup.uz",
    languages: {
      uz: "https://bookup.uz",
      ru: "https://bookup.uz/ru",
      en: "https://bookup.uz/en",
    },
  },
};

export default function Home() {
  return <HomePage dict={uzDict} locale="uz" />;
}
