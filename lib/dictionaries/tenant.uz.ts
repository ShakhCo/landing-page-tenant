// UI strings for the public tenant pages (Phase 1: home page).
// Content fields (service names, categories, address) come from the tenant
// payload via localized(); these are the fixed UI labels only.

export const dict = {
  services: 'Xizmatlar',
  specialists: 'Mutaxassislar',
  workingHours: 'Ish vaqti',
  open: 'Ochiq',
  closed: 'Yopiq',
  // Open status reads `{open} · {untilPrefix}{time}{untilSuffix}` — uz puts the
  // marker after the time ("23:00 gacha"), ru/en before it ("до 23:00").
  untilPrefix: '',
  untilSuffix: ' gacha',
  dayOff: 'Dam olish',
  all: 'Barchasi',
  otherCategory: 'Boshqa',
  book: 'Bron qilish',
  bookShort: 'Bron',
  bookings: 'ta bron',
  showMore: "Barchasini ko'rish",
  showLess: "Kamroq ko'rish",
  noServices: "Hozircha xizmatlar yo'q.",
  perHour: '/soat',
  som: "so'm",
  hour: 'soat',
  minute: 'daqiqa',
  days: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'],
  notFoundTitle: 'Topilmadi',
  notFoundText: 'Bunday sahifa mavjud emas.',
  metaTitleSuffix: 'Onlayn bron qilish',
  metaDescLong: "Xizmatlar va narxlarni ko'ring, bo'sh vaqtni tanlang va onlayn bron qiling.",
};

export type TenantDict = typeof dict;
