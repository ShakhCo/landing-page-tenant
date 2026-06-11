import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";
import { JsonLd } from "@/components/JsonLd";
import uzDict from "@/lib/dictionaries/home.uz";
import {
  organizationSchema,
  websiteSchema,
  softwareApplicationSchema,
  faqSchema,
} from "@/lib/seo";

// Title/description/OG come from app/layout.tsx — only hreflang/canonical here.
export const metadata: Metadata = {
  alternates: {
    canonical: "https://bookup.uz",
    languages: {
      uz: "https://bookup.uz",
      "uz-Cyrl": "https://bookup.uz/oz",
      ru: "https://bookup.uz/ru",
      en: "https://bookup.uz/en",
    },
  },
};

export default function Home() {
  return (
    <>
      <JsonLd
        schema={[
          organizationSchema(),
          websiteSchema(),
          softwareApplicationSchema(),
          faqSchema(uzDict.faq.items),
        ]}
      />
      <HomePage dict={uzDict} locale="uz" />
    </>
  );
}
