import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PricingSection } from "@/components/Pricing";

export const metadata = {
  title: "Narxlar",
  description:
    "Bookup uchun narxlar — asosiy tarif va kerakli imkoniyatlarni qo'shing. Komissiya yo'q, faqat oddiy oylik to'lov.",
  alternates: { canonical: "https://bookup.uz/narxlar" },
};

export default function NarxlarPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-white text-[oklch(0.18_0_0)]">
      <Header />
      <main className="pb-12">
        <div className="mx-auto max-w-[1360px] px-5">
          <PricingSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
