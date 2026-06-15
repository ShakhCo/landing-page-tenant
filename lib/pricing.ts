export const ANNUAL_DISCOUNT = 2 / 12; // 2 oy bepul (16.67%)
export const SMS_OVERAGE_PRICE = 130; // UZS per SMS beyond included pack

export interface BillingPeriod {
  id: string;
  months: number;
  label: string;
  /** Discount applied to monthly price (0 = no discount). */
  discount: number;
  /** Short badge text shown on the option (empty = no badge). */
  badge?: string;
}

export const BILLING_PERIODS: BillingPeriod[] = [
  { id: "1m", months: 1, label: "1 oy", discount: 0 },
  { id: "3m", months: 3, label: "3 oy", discount: 0.05, badge: "-5%" },
  { id: "6m", months: 6, label: "6 oy", discount: 0.1, badge: "-10%" },
  { id: "12m", months: 12, label: "12 oy", discount: ANNUAL_DISCOUNT, badge: "2 oy bepul" },
];

/** Base plan that always includes: 1 master, 50 SMS, schedule, Telegram bot, web booking, customer database. */
export const BASE_PRICE = 49_000; // UZS / oy
export const BASE_INCLUDED_STAFF = 1;
export const BASE_INCLUDED_SMS = 50;
export const PRICE_PER_EXTRA_STAFF = 25_000; // UZS / master / oy

/** Staff quick-pick options shown above the calculator. */
export const STAFF_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1);

export type BusinessType =
  | "sartaroshxonalar"
  | "salonlar"
  | "stomatologiya"
  | "bilyard"
  | "tennis"
  | "fitness";

export const BUSINESS_LABELS: Record<BusinessType, string> = {
  sartaroshxonalar: "Sartaroshxonalar",
  salonlar: "Salonlar",
  stomatologiya: "Stomatologiya",
  bilyard: "Bilyard",
  tennis: "Tennis",
  fitness: "Fitness",
};

export interface SmsPack {
  id: string;
  label: string;
  /** Total SMS the user gets per month if this pack is chosen (includes the base 50). */
  totalSms: number;
  /** Add-on cost on top of the base price (0 = the included pack, no extra cost). */
  price: number;
}

export const SMS_PACKS: SmsPack[] = [
  { id: "included", label: "50 ta SMS", totalSms: BASE_INCLUDED_SMS, price: 0 },
  { id: "p200", label: "250 ta SMS", totalSms: BASE_INCLUDED_SMS + 200, price: 29_000 },
  { id: "p600", label: "650 ta SMS", totalSms: BASE_INCLUDED_SMS + 600, price: 79_000 },
  { id: "p1200", label: "1250 ta SMS", totalSms: BASE_INCLUDED_SMS + 1200, price: 149_000 },
];

export interface Addon {
  id: string;
  name: string;
  description: string;
  /** UZS / oy */
  price: number;
  recommended?: boolean;
}

export const ADDONS: Addon[] = [
  {
    id: "sms-reminder",
    name: "SMS eslatma",
    description:
      "Mijozga tashrifdan 2 soat oldin avtomatik SMS eslatma yuboriladi — «no-show» mijozlar kamayadi.",
    price: 19_000,
    recommended: true,
  },
  {
    id: "instagram",
    name: "Instagram integratsiyasi",
    description:
      "DM xabarlarga AI yordamida avto-javob, izohlar boshqaruvi va profil bio'da «Bron qilish» tugmasi.",
    price: 29_000,
    recommended: true,
  },
  {
    id: "loyalty",
    name: "Chegirma va sodiqlik dasturi",
    description:
      "Bonus ballar, chegirma kodlari va takroriy mijozlar uchun avtomatik aksiyalar.",
    price: 19_000,
  },
  {
    id: "reviews",
    name: "Mijoz baholari",
    description:
      "Tashrifdan keyin mijoz baho va izoh qoldiradi — eng kuchli ustalaringizni ko'rsating.",
    price: 9_000,
    recommended: true,
  },
  {
    id: "analytics",
    name: "Kengaytirilgan tahlil",
    description:
      "Daromad, mijoz qaytishi, eng kuchli ustalar va eng band soatlar bo'yicha hisobotlar.",
    price: 19_000,
  },
  {
    id: "ai",
    name: "AI yordamchi",
    description:
      "Mijoz bilan suhbatda smart javoblar, ravon SMS matnlari va xizmat tavsiyalari.",
    price: 49_000,
  },
  {
    id: "branding",
    name: "Maxsus domen va brending",
    description:
      "Sizning domeningiz (masalan: barber.uz), logotip va ranglar — biznes saytida.",
    price: 39_000,
  },
  {
    id: "api",
    name: "API kirish",
    description:
      "O'z saytingiz, CRM yoki POS tizimingiz bilan to'g'ridan-to'g'ri integratsiya.",
    price: 39_000,
  },
  {
    id: "location",
    name: "Qo'shimcha filial",
    description:
      "Har bir qo'shimcha filial uchun, alohida jadval va statistika bilan.",
    price: 69_000,
  },
];

/* -------------------------------------------------------------------------- */
/*  Fixed plans (barbershop page — 3-tier layout)                              */
/* -------------------------------------------------------------------------- */

export interface PlanFeature {
  text: string;
  /** Emphasised feature — rendered bolder with an accent check. */
  highlight?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  tagline: string;
  /** Base monthly price in UZS (before the billing-period discount). */
  price: number;
  /** Visually lifts the card and shows the badge. */
  highlighted?: boolean;
  badge?: string;
  /** Price is charged per team member (vs. a flat monthly fee). */
  perMember?: boolean;
  /** Minimum billable team members (shown as a note under the price). */
  minMembers?: number;
  /** Contact-sales tier: shows priceLabel + description instead of a price & features. */
  custom?: boolean;
  /** Headline shown in place of the numeric price (custom tiers). */
  priceLabel?: string;
  /** Paragraph shown in place of the feature list (custom tiers). */
  description?: string;
  /** Small label shown above the feature list (e.g. "…dagi hammasi, plyus"). */
  featuresIntro?: string;
  features: PlanFeature[];
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Yolg'iz",
    tagline: "Yakka master va kichik salonlar uchun",
    price: 74_000,
    features: [
      { text: "30 ta bepul SMS" },
      { text: "5 ta marketing SMS" },
      { text: "bookup.uz'da bron sayti" },
      { text: "Mijozlar ro'yxati va tashriflar tarixi" },
      { text: "Telegram orqali qo'llab-quvvatlash" },
    ],
  },
  {
    id: "pro",
    name: "Jamoa",
    tagline: "O'sayotgan sartaroshxonalar uchun",
    price: 49_500,
    highlighted: true,
    badge: "Tavsiya",
    perMember: true,
    minMembers: 2,
    features: [
      { text: "Har bir a'zoga 30 ta bepul SMS" },
      { text: "Har bir a'zoga 5 ta marketing SMS" },
      { text: "bookup.uz'da bron sayti" },
      { text: "Mijozlar ro'yxati va tashriflar tarixi" },
      { text: "Telefon yoki Telegram orqali qo'llab-quvvatlash" },
      { text: "Instagram integratsiyasi — izohlarga avto-javob, DM orqali bron" },
      { text: "WhatsApp integratsiyasi — DM orqali bron" },
    ],
  },
  {
    id: "premium",
    name: "Enterprise",
    tagline: "Tarmoq va yirik bizneslar uchun",
    price: 98_000,
    perMember: true,
    minMembers: 10,
    features: [
      { text: "Har bir a'zoga 100 ta bepul SMS" },
      { text: "Har bir a'zoga 10 ta marketing SMS" },
      { text: "bookup.uz yoki maxsus domen" },
      { text: "Mijozlar ro'yxati va tashriflar tarixi" },
      { text: "Shaxsiy menejer" },
      { text: "Instagram integratsiyasi — izohlarga avto-javob, DM orqali bron" },
      { text: "WhatsApp integratsiyasi — DM orqali bron" },
      { text: "API kirish" },
      { text: "Maxsus brending" },
    ],
  },
];

/** Apply a billing-period discount to a base monthly price (rounded to 100 UZS). */
export function planMonthly(price: number, discount: number): number {
  return Math.round((price * (1 - discount)) / 100) * 100;
}

export function calcTotal(opts: {
  staff: number;
  smsPackId: string;
  addonIds: Iterable<string>;
}): number {
  const { staff, smsPackId, addonIds } = opts;
  const staffExtras =
    Math.max(0, staff - BASE_INCLUDED_STAFF) * PRICE_PER_EXTRA_STAFF;
  const pack =
    SMS_PACKS.find((p) => p.id === smsPackId) ?? SMS_PACKS[0];
  const idSet = new Set(addonIds);
  const addonsTotal = ADDONS.filter((a) => idSet.has(a.id)).reduce(
    (sum, a) => sum + a.price,
    0,
  );
  return BASE_PRICE + staffExtras + pack.price + addonsTotal;
}

export interface PricingFAQ {
  q: string;
  a: string;
}

export const PRICING_FAQ: PricingFAQ[] = [
  {
    q: "Qo'shimcha imkoniyatlarni keyin yoqsa yoki o'chirsa bo'ladimi?",
    a: "Ha, istalgan paytda. Yoqsangiz o'sha kundan boshlab to'lov hisoblanadi, o'chirsangiz qolgan vaqt uchun pul qaytariladi.",
  },
  {
    q: "SMS limitidan oshib ketsam nima bo'ladi?",
    a: "Har bir qo'shimcha SMS uchun 130 UZS hisoblanadi — paketdagi narx bilan bir xil. Limitdan oshmaslik uchun kattaroq SMS paketni tanlash mumkin.",
  },
  {
    q: "Uzoq muddatli to'lov chegirmasi qanday ishlaydi?",
    a: "Davrni qancha uzoqroq tanlasangiz, oylik narx shuncha arzon bo'ladi: 3 oy — 5%, 6 oy — 10%, 12 oy uchun esa 2 oy bepul (16.67%) chegirma.",
  },
  {
    q: "Qanday to'lov usullari qabul qilinadi?",
    a: "Click, Payme, Uzum, Uzcard va Humo kartalari, shuningdek yuridik shaxslar uchun bank o'tkazmasi orqali to'lash mumkin.",
  },
  {
    q: "Bir nechta filialim bor — narx qanday hisoblanadi?",
    a: "Har bir qo'shimcha filial uchun «Qo'shimcha filial» imkoniyatini yoqasiz — har biri alohida jadval, masterlar va statistikaga ega bo'ladi. Asosiy tarif faqat bir marta to'lanadi.",
  },
  {
    q: "Masterlar soni davr o'rtasida o'zgarsa, narx qanday qayta hisoblanadi?",
    a: "Yangi masterni qo'shgan kuningizdan boshlab faqat qolgan kunlar uchun proporsional to'lov olinadi. Masterni o'chirsangiz — qolgan kunlar uchun pul keyingi to'lovingizdan ayriladi.",
  },
  {
    q: "Hozir tanlagan narx kelajakda oshadimi?",
    a: "Siz tanlagan tarif va davr uchun narx kafolatlanadi — obunangiz tugagunga qadar o'zgarmaydi. Yangi narxlar faqat keyingi obunaga taalluqli bo'ladi.",
  },
];

/** FAQ for the 3-plan barbershop page (Yolg'iz / Jamoa / Enterprise). */
export const PLAN_FAQ: PricingFAQ[] = [
  {
    q: "Bepul sinab ko'rsam bo'ladimi?",
    a: "Ha, barcha tariflar uchun 14 kunlik bepul sinov mavjud. Bank kartasi talab qilinmaydi — xohlagan tarifingizni to'liq sinab ko'rasiz.",
  },
  {
    q: "Qaysi tarif menga mos?",
    a: "Yolg'iz — yakka usta yoki kichik biznes uchun, oyiga belgilangan narx. Jamoa — bir nechta xodimli o'sayotgan jamoalar uchun, Instagram va WhatsApp avtomatlashtirish bilan. Enterprise — yirik tarmoq va bizneslar uchun: maxsus domen, shaxsiy menejer, API kirish va maxsus brending.",
  },
  {
    q: "Jamoa va Enterprise narxi qanday hisoblanadi?",
    a: "Bu tariflarda to'lov har bir jamoa a'zosi uchun olinadi: Jamoa — kamida 2 ta a'zo, Enterprise — kamida 10 ta a'zo. A'zolar sonini istalgan paytda o'zgartirishingiz mumkin, narx shunga qarab qayta hisoblanadi. Yolg'iz tarifi esa oyiga belgilangan narxda.",
  },
  {
    q: "Keyinchalik tarifni o'zgartira olamanmi?",
    a: "Ha, istalgan paytda boshqa tarifga o'tishingiz mumkin. Narx faqat qolgan kunlar uchun proporsional hisoblanadi — ortiqcha to'lov olinmaydi.",
  },
  {
    q: "Instagram va WhatsApp avtomatlashtirish qanday ishlaydi?",
    a: "Akkauntingizni bir marta ulaysiz — shundan so'ng tizim obunachilardan to'g'ridan-to'g'ri bron qabul qiladi, izoh va shaxsiy xabarlarga avtomatik javob beradi. Ikkala integratsiya ham Jamoa va Enterprise tariflarida mavjud.",
  },
  {
    q: "SMS eslatma limitidan oshib ketsam-chi?",
    a: "Har bir tarifda oylik bepul SMS soni belgilangan: Yolg'iz — 30 ta, Jamoa — har bir a'zoga 30 ta, Enterprise — har bir a'zoga 100 ta. Limit tugasa, qo'shimcha SMS paket ulashingiz yoki yuqori tarifga o'tishingiz mumkin.",
  },
  {
    q: "Qanday to'lov usullari bor va uzoq muddatga chegirma bormi?",
    a: "Click, Payme, Uzum, Uzcard va Humo kartalari, shuningdek yuridik shaxslar uchun bank o'tkazmasi qabul qilinadi. Uzoqroq davrni tanlasangiz arzonroq: 3 oy — 5%, 6 oy — 10%, 12 oy uchun — 16.67% chegirma.",
  },
  {
    q: "Obunani istalgan paytda bekor qila olamanmi?",
    a: "Ha. Bekor qilganingizdan keyin ham to'langan davr oxirigacha xizmatdan foydalanasiz, keyingi davr uchun to'lov olinmaydi.",
  },
];

export const GENERAL_FAQ: PricingFAQ[] = [
  {
    q: "Bepul sinab ko'rish mumkinmi?",
    a: "Ha, 14 kunlik bepul sinov muddati mavjud. Bank kartasi talab qilinmaydi.",
  },
  {
    q: "Obunani istalgan paytda bekor qilsa bo'ladimi?",
    a: "Ha, bir nechta tugmacha bilan. Bekor qilganingizdan keyin to'langan davr oxirigacha xizmatdan foydalanishda davom etasiz, keyingisi uchun to'lov olinmaydi.",
  },
  {
    q: "Yuridik shaxs uchun shartnoma va hisob-faktura beriladimi?",
    a: "Ha. To'liq rasmiy shartnoma, hisob-faktura va bajarilgan ishlar dalolatnomasi (akt) tayyorlab beramiz — buxgalteringiz uchun barcha hujjatlar joyida bo'ladi.",
  },
  {
    q: "Texnik yordam qanday ko'rsatiladi?",
    a: "Telegram va telefon orqali har kuni 09:00–21:00 oraliqida javob beramiz. Murakkab masalalar uchun ekranni ulashib yordam beruvchi mutaxassis ham biriktiriladi.",
  },
  {
    q: "Mijozlarim bron qilish uchun ilova yuklab olishlari kerakmi?",
    a: "Yo'q. Mijozlar oddiy havola orqali sayt yoki Telegram bot orqali, hech narsa o'rnatmasdan bron qilishadi. Faqat siz va xodimlaringiz boshqaruv ilovasidan foydalanadi.",
  },
  {
    q: "Eski tizim yoki Excel jadvalidan ma'lumotlarni ko'chirib o'tkazsa bo'ladimi?",
    a: "Ha. Mijozlar bazasi, xizmatlar ro'yxati va jadvalingizni Excel yoki CSV fayldan import qilamiz. Murakkab holatlarda bizning jamoa bepul yordam beradi.",
  },
  {
    q: "Ma'lumotlarim va mijozlar bazasi xavfsizmi?",
    a: "Ha. Barcha ma'lumotlar shifrlangan holatda O'zbekistondagi serverlarda saqlanadi, har kuni avtomatik zaxira (backup) olinadi. Mijozlar bazasi faqat sizga tegishli — uchinchi tomonlarga berilmaydi.",
  },
];
