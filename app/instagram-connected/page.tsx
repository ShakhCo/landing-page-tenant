import type { Metadata } from "next";

// Deep link that reopens the BOOKUP business bot. `startapp=ig_connected` is read
// by the mini-app on launch to jump straight to Settings → Instagram.
const BOT_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL ??
  "https://t.me/bookup_business_bot?startapp=ig_connected";

export const metadata: Metadata = {
  title: "Instagram ulandi",
  description: "Instagram hisobingiz BOOKUP'ga muvaffaqiyatli ulandi.",
  // Transactional landing — keep it out of search results.
  robots: { index: false, follow: false },
};

export default function InstagramConnectedPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[oklch(0.96_0.0015_9.15)] px-6 py-12 text-[oklch(0.21_0.0015_9.15)]">
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-black/[0.06] ring-1 ring-black/[0.04]">
        {/* Instagram-gradient badge with a success check */}
        <div className="mx-auto grid size-20 place-items-center rounded-[1.4rem] bg-[linear-gradient(135deg,#feda75_0%,#fa7e1e_25%,#d62976_50%,#962fbf_75%,#4f5bd5_100%)] shadow-lg shadow-[#d62976]/25">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12.5 9.8 17.3 19 7"
              stroke="white"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="mt-7 text-[26px] font-extrabold leading-tight tracking-tight">
          Instagram ulandi 🎉
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[oklch(0.55_0.003_9.15)]">
          Instagram hisobingiz BOOKUP&apos;ga muvaffaqiyatli ulandi. Endi mijozlaringizning
          Instagram&apos;dagi xabar va izohlariga avtomatik javob berishingiz mumkin.
        </p>

        <a
          href={BOT_URL}
          className="mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[var(--accent)] px-7 py-4 text-[15px] font-semibold text-white shadow-lg shadow-black/10 transition hover:brightness-110 active:scale-[0.99]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M21.94 4.27a1.2 1.2 0 0 0-1.27-.2L3.4 11.04c-.86.34-.83 1.57.05 1.86l4.35 1.45 1.7 5.18c.26.78 1.27.97 1.79.33l2.45-3 4.32 3.18c.55.4 1.34.11 1.49-.56l3.13-14.2a1.2 1.2 0 0 0-.49-1.21ZM9.9 14.62l-.47 3.32-.99-3.02 7.9-6.43-6.44 6.13Z" />
          </svg>
          Telegramga qaytish
        </a>

        <p className="mt-4 text-[13px] leading-snug text-[oklch(0.6_0.003_9.15)]">
          Tugmani bossangiz BOOKUP boti ochiladi va Instagram sozlamalari avtomatik yangilanadi.
        </p>
      </div>

      <p className="mt-8 text-[13px] font-semibold tracking-tight text-[oklch(0.6_0.003_9.15)]">
        BOOKUP
      </p>
    </main>
  );
}
