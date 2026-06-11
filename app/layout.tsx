import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

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
  keywords: [
    // uz
    "onlayn band qilish", "onlayn bron", "navbat olish", "bron qilish", "sartaroshxona", "go‘zallik saloni", "biznes CRM",
    // ru
    "онлайн запись", "бронирование", "запись клиентов", "онлайн бронирование", "Узбекистан", "Ташкент",
    // en
    "online booking", "appointment scheduling", "booking system", "reservations", "Uzbekistan", "Tashkent",
  ],
  authors: [{ name: "BOOKUP" }],
  alternates: { canonical: "https://bookup.uz" },
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
    images: [{ url: "/og.jpg", width: 640, height: 360, alt: "BOOKUP — bookup.uz" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BOOKUP — Onlayn band qilish platformasi",
    description: "Biznesingiz uchun onlayn band qilish va boshqaruv platformasi.",
    images: ["/og.jpg"],
  },
  robots: { index: true, follow: true },
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
