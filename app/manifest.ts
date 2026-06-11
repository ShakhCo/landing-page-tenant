import type { MetadataRoute } from 'next';

/** PWA web app manifest — installable + signals a real app to search engines. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BOOKUP — Onlayn band qilish platformasi',
    short_name: 'BOOKUP',
    description:
      "Biznesingiz uchun onlayn band qilish tizimi. Mijozlar xizmatlaringizni 24/7 bron qiladi.",
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    lang: 'uz',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/favicon.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
