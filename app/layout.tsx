import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bookup.uz"),
  title: {
    default: "BOOKUP — Onlayn band qilish platformasi",
    template: "%s — BOOKUP",
  },
  description:
    "BOOKUP — biznesingiz uchun onlayn band qilish tizimi. Mijozlar xizmatlaringizni 24/7 bron qiladi; jadval, mijozlar va to‘lovlarni bitta joyda boshqaring. Sartaroshxona, go‘zallik saloni, klinika, sport va boshqa xizmatlar uchun.",
  applicationName: "BOOKUP",
  manifest: "/manifest.webmanifest",
  keywords: [
    // brand
    "bookup", "bookup uz", "bookup.uz", "BOOKUP",
    // uz
    "onlayn band qilish", "onlayn bron", "onlayn navbat", "navbat olish", "online yozilish", "bron qilish",
    "sartaroshxona uchun navbat", "go‘zallik saloni navbat", "biznes uchun CRM", "mijozlar bazasi",
    // ru
    "онлайн запись", "запись на услуги", "бронирование", "запись клиентов", "онлайн бронирование",
    "система записи", "CRM для бизнеса", "Узбекистан", "Ташкент",
    // en
    "online booking", "online appointments", "appointment scheduling", "booking system",
    "appointment booking software", "reservations", "salon booking", "Uzbekistan", "Tashkent",
  ],
  authors: [{ name: "BOOKUP", url: "https://bookup.uz" }],
  creator: "BOOKUP",
  publisher: "BOOKUP",
  category: "business",
  alternates: { canonical: "https://bookup.uz" },
  // Search-engine site verification (renders <meta name="yandex-verification" …>).
  verification: { yandex: "481b12bd09fa6c6f" },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    siteName: "BOOKUP",
    title: "BOOKUP — Onlayn band qilish platformasi",
    description:
      "Mijozlar xizmatlaringizni onlayn bron qiladi, siz esa jadval, mijozlar va to‘lovlarni bitta joyda boshqarasiz.",
    url: "https://bookup.uz",
    locale: "uz_UZ",
    alternateLocale: ["ru_RU", "en_US"],
    // og image comes from app/opengraph-image.tsx (1200×630), applied site-wide.
  },
  twitter: {
    card: "summary_large_image",
    title: "BOOKUP — Onlayn band qilish platformasi",
    description: "Biznesingiz uchun onlayn band qilish va boshqaruv platformasi.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
