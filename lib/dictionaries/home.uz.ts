/**
 * Uzbek (default) dictionary for the marketing landing page.
 * This file is the single type source: ru/en dictionaries must satisfy
 * `HomeDict` so a missing/extra key fails the typecheck.
 */
const dict = {
  header: {
    nav: {
      home: "Bosh sahifa",
      features: "Imkoniyatlar",
      forBusiness: "Biznesga",
      forCustomers: "Mijozlarga",
      pricing: "Narxlar",
      partners: "Hamkorlar",
      about: "Biz haqimizda",
    },
    a11yEye: "Версия для слабовидящих",
    businessTab: "Biznes uchun",
    customersTab: "Mijozlar uchun",
    connectBusiness: "Biznesni ulash",
    menuOpen: "Menyu ochish",
    menuClose: "Menyu yopish",
  },
  hero: {
    card1: {
      titleLine1: "Biznesingiz uchun",
      titleLine2Accent: "onlayn band qilish",
      body: "Biznesingiz uchun qulay online yozilish tizimi. Mijozlar o'zlari bo'sh vaqtni tanlashadi, siz esa hamma jarayonni tartibli boshqarasiz.",
      cta: "Hoziroq boshlash",
      imageAlt: "Zamonaviy salon interyeri",
    },
    card2: {
      titleLine1Accent: "Mijozlar uchun",
      titleLine2: "band qilish sahifasi",
      body1: "Mijozlar sizni onlayn topishlari, xizmatlar ro'yxati va narxlarni ko'rishlari mumkin. Shuningdek, reytinglar, sharhlar, joylashuv va ish vaqti ham ochiq ko'rinadi.",
      body2: "Bir necha soniyada o'zlariga qulay vaqtni tanlab, osongina yozilishlari mumkin.",
      imageAlt: "Mijoz uchun ilova ko'rinishi",
    },
    card3: {
      titleLine1Accent: "Aqlli onlayn",
      titleLine2: "jadval va kalendar",
      body1: "Barcha yozuvlar bitta tizimda: xodimlar, xonalar va stollar bandligi doim nazoratda bo'ladi.",
      body2: "Mijozlar esa bo'sh vaqtlarni online ko'rib, o'zlariga qulay vaqtni tanlashadi.",
      cta: "Batafsil",
    },
    card4: {
      titleLine1: "Mijozlar bazasi",
      titleLine2Accent: "va eslatmalar",
      body1: "Mijozlar tarixi, oldingi tashriflari va eslatmalar barchasi bir joyda saqlanadi.",
      body2: "SMS xabarnomalar avtomatik yuboriladi. Hech narsa unutib qolinmaydi.",
      cta: "Batafsil",
    },
  },
  solutions: {
    eyebrow: "Kim uchun",
    title: "Har qanday biznes uchun",
    more: "Batafsil",
    items: [
      {
        title: "Sartaroshxonalar",
        description:
          "Ustalar bo'yicha jadval, xizmatlar narxlari va onlayn yozilish — bitta panelda.",
      },
      {
        title: "Go'zallik salonlari",
        description:
          "Manikyur, soch, qosh va boshqa xizmatlarga oson yozilish va xodimlar boshqaruvi.",
      },
      {
        title: "Bilyard va bouling klublari",
        description:
          "Stollar va yo'laklar bo'yicha jonli jadval, soatbay tariflar va to'lovlar.",
      },
      {
        title: "Tennis va sport maydonchalari",
        description:
          "Kortlar va maydonchalarni soatlik band qilish, abonementlar va guruh mashg'ulotlari.",
      },
      {
        title: "Stomatologiya va klinikalar",
        description:
          "Shifokor qabullari, davolanish bosqichlari va eslatmalar — barchasi nazoratda.",
      },
      {
        title: "Massaj va SPA salonlari",
        description:
          "Xonalar va terapevtlar jadvali, paketlar va sodiqlik dasturlari bitta joyda.",
      },
    ],
  },
  sticky: {
    eyebrow: "Imkoniyatlar",
    title: "Bitta platforma — to'liq nazorat",
    subtitle:
      "Yozilishdan tahlilgacha — biznesni boshqarishning hamma jarayonlari bitta joyda.",
    /** Rendered as `${freeSitePrefix} <strong>sizning-biznes.bookup.uz</strong>` */
    freeSitePrefix: "Bepul shaxsiy sayt:",
    features: [
      {
        title: "Aqlli jadval va kalendar",
        intro: "Xodimlar, xonalar va stollar — bitta panelda.",
        bullets: [
          "Vaqt to'qnashuvlari avtomatik oldini olinadi",
          "Real vaqt rejimidagi jonli jadval",
          "Bir nechta xodim va xizmat turi qo'llab-quvvatlanadi",
        ],
      },
      {
        title: "Onlayn yozilish 24/7",
        intro: "Mijozlar siz uxlayotganingizda ham yozilishadi.",
        // The free-site bullet (freeSitePrefix) is prepended in the component.
        bullets: [
          "Instagram va Telegramdan to'g'ridan-to'g'ri ulanish",
          "Ilova o'rnatish shart emas",
          "Tasdiqlash va SMS eslatmalar avtomatik",
        ],
      },
      {
        title: "Mijozlar bazasi va eslatmalar",
        intro: "Hech bir mijoz yo'qolmaydi, hech bir tashrif unutilmaydi.",
        bullets: [
          "Tashriflar tarixi va shaxsiy izohlar",
          "SMS va push xabarnomalar",
          "Sodiqlik dasturlari va bonus ballar",
          "Tug'ilgan kun va aksiya eslatmalari",
        ],
      },
      {
        title: "Sevimli vositalaringiz bilan ulanadi",
        intro: "Bookup siz ishlatib turgan platformalarga oson bog'lanadi.",
        bullets: [
          "Telegram bot orqali yozilish va xabarlar",
          "Instagram profilidan to'g'ridan-to'g'ri ulanish",
          "Veb-sayt vidjeti — bir qator kod bilan",
        ],
      },
    ],
  },
  supportCta: {
    marqueeAccent: "Bepul",
    marqueeRest: "yordam va qo'llab-quvvatlash",
    card1: {
      titlePre: "Yozilishlarni hali ham",
      titleAccent: "daftarga yozasiz yoki yodda",
      titlePost: "saqlaysizmi?",
      p1Pre: "Agar javob",
      p1Quote: '"daftarni ochib ko\'rishim kerak"',
      p1Mid: "bo'lsa, biznesingiz",
      p1Risk: "xavf ostida",
      p1Post:
        ". Yo'qolgan daftar, o'chirilgan yozuv yoki noto'g'ri eslab qolingan vaqt bir kunlik daromadingizni yo'qqa chiqaradi.",
      p2Pre: "Onlayn yozilish bilan har bir mijoz va har bir bo'sh joy bir ekranda. Biz hammasini o'rnatamiz va jamoangizni o'rgatamiz —",
      p2Free: "BEPUL",
      cta: "Menejer bilan bog'lanish",
    },
    card2: {
      titlePre: "Boshqa tizimdan",
      titleAccent: "ko'chish qiyin",
      titlePost: "deb o'ylayapsizmi?",
      p1Pre: "Ko'pchilik yangi platformaga o'tishdan",
      p1Quote1: '"ma\'lumotlar yo\'qoladi"',
      p1Quote2: '"ish to\'xtaydi"',
      p1Post:
        "deb qo'rqadi. Bookup'da bunday muammo yo'q — mavjud mijozlaringiz, yozilishlar tarixi va jadvalingizni biz o'zimiz ko'chirib o'tkazamiz.",
      p2Pre: "Siz hech narsa qilmaysiz, biznesingiz esa",
      p2Bold: "bir kun ham to'xtamaydi",
      cta: "Menejer bilan bog'lanish",
    },
  },
  integrations: {
    eyebrow: "Integratsiyalar",
    titleMain: "Sevimli vositalaringiz",
    titleAccent: "bilan ulanadi",
    subtitle:
      "Bookup siz ishlatib turgan platformalarga osongina bog'lanadi — hech narsani yangidan boshlashga hojat yo'q.",
    more: "Batafsil",
    slideLabel: "Slayd",
    items: [
      {
        name: "Telegram",
        title: "Telegram'da yozilish va aloqa",
        description:
          "Mijozlar Telegram'dan chiqmasdan to'liq bron qiladi — Mini App orqali xizmat va vaqtni tanlaydi, bot esa tasdiq va eslatmalarni avtomatik yuboradi.",
        bullets: [
          "Mini App ichida to'liq bron",
          "Bot eslatmalar va tasdiqlar",
          "Operator chati Telegram'da",
        ],
      },
      {
        name: "Instagram",
        title: "Instagram profilingizdan to'g'ridan-to'g'ri",
        description:
          "DM va profil bio'sini yozilish kanaliga aylantiring. AI mijozlar bilan suhbatlashadi, vaqt taklif qiladi va bronni yopadi — siz esa hammasini bir joyda ko'rasiz.",
        bullets: [
          "DM ga AI avto-javob",
          "Profilda «Bron qilish» tugmasi",
          "Suhbatlar tarixi saqlanadi",
        ],
      },
      {
        name: "Veb-sayt",
        title: "Biznesingiz — bookup.uz subdomenida",
        description:
          "Mijozlar uchun chiroyli, tezkor va SEO uchun tayyor sayt. Hisob ochasiz, xizmatlarni qo'shasiz — sayt o'zi tayyor bo'ladi. sizning-biznes.bookup.uz manzili bepul.",
        bullets: [
          "sizning-biznes.bookup.uz bepul",
          "Mobil va desktop'da chiroyli",
          "Google'da topilish uchun tayyor",
        ],
      },
      {
        name: "SMS",
        title: "SMS tasdiq va eslatmalar",
        description:
          "Beeline, Ucell, Mobiuz va Humans operatorlari orqali — har bir mijozga xabar yetib boradi. OTP bilan xavfsiz kirish, bron tasdig'i va tashrifdan 1 soat oldin eslatma.",
        bullets: [
          "Barcha O'zbekiston operatorlari",
          "OTP orqali xavfsiz kirish",
          "Avto-tasdiq va eslatma",
        ],
      },
    ],
  },
  pro: {
    badge: "Mobil ilova",
    titleLine1: "Biznesni",
    titleAccent: "cho'ntakda",
    titlePost: "olib yuring",
    body: "Bookup Business — biznes egalari uchun mobil ilova. Yozilishlarni qabul qiling, mijozlar bilan ishlang va daromadni real vaqtda kuzating.",
    features: [
      "Onlayn jadval va kalendar",
      "Mijozlar bazasi va tashriflar tarixi",
      "SMS va push xabarnomalar",
      "Tahlil va hisobotlar",
    ],
    download: "Yuklash",
    ios: "iOS uchun",
    android: "Android uchun",
    imageAlt: "Bookup Business mobil ilova",
  },
  faq: {
    eyebrow: "FAQ",
    titleLine1: "Savollar bormi?",
    titleAccent: "Bizda javoblar bor!",
    subtitle:
      "Biz bilan bog'laning — barcha savollaringizga tez va aniq javob beramiz.",
    popular: "Eng ko'p so'raladigan",
    items: [
      {
        q: "Bookup nima?",
        a: "Bookup — O'zbekiston bizneslari uchun onlayn yozilish va mijozlar bazasini boshqarish platformasi. Sartaroshxona, salon, stomatologiya, bilyard, tennis va boshqa xizmat ko'rsatish bizneslari uchun mo'ljallangan.",
      },
      {
        q: "Qanday biznes turlari ulanadi?",
        a: "Sartaroshxonalar, go'zallik salonlari, stomatologiya, SPA, bilyard, bouling, tennis, fitness — qisqasi, vaqt asosida xizmat ko'rsatadigan har qanday biznes ulansa bo'ladi.",
      },
      {
        q: "Onlayn to'lovlar qanday ishlaydi?",
        a: "Onlayn to'lovlar tez orada qo'shiladi — Click, Payme, Uzum va bank kartalari orqali. Pul to'g'ridan-to'g'ri sizning hisobingizga tushadi, biz vositachilik qilmaymiz. Yangilanishlar haqida xabardor bo'lish uchun obuna bo'ling.",
      },
      {
        q: "Mijozlar uchun mobil ilova bormi?",
        a: "Alohida ilova o'rnatish shart emas. Mijozlaringiz Telegram orqali yoki sizning bookup.uz subdomenidagi sayt orqali bron qilishadi — mobil va desktop'da bir xil chiroyli ishlaydi.",
      },
      {
        q: "Komissiya qancha?",
        a: "Bookup bronlardan komissiya olmaydi. Faqat oylik obuna to'lovi mavjud — biznes hajmiga qarab tariflar farq qiladi. Batafsil narxlar bilan menejer tanishtiradi.",
      },
      {
        q: "Demo versiyani sinab ko'rsa bo'ladimi?",
        a: "Albatta. 14 kunlik bepul sinov muddati taqdim etamiz — bank kartasi talab qilinmaydi. Menejerimiz tizimni sozlashda va jamoangizni o'qitishda yordam beradi.",
      },
      {
        q: "Texnik yordam qanday ishlaydi?",
        a: "Telefon (+998 88 363 40 20), Telegram va elektron pochta orqali — kuniga 24 soat, haftada 7 kun aloqadamiz. O'rtacha javob vaqti — 5 daqiqa.",
      },
      {
        q: "Hamkor bo'lish mumkinmi?",
        a: "Ha. Hamkorlik dasturimiz mavjud — siz olib kelgan har bir biznes uchun komissiya to'laymiz. Batafsil shartlar uchun menejer bilan bog'laning.",
      },
    ],
  },
  footer: {
    ctaTitleLine1: "Biznesingizni bugun",
    ctaTitleLine2: "Bookup'ga ulang.",
    ctaStart: "Hoziroq boshlash",
    about:
      "O'zbekiston bizneslari uchun onlayn yozilish va mijozlar bazasini boshqarish platformasi.",
    columns: {
      business: {
        heading: "Biznes uchun",
        links: [
          "Sartaroshxonalar",
          "Salonlar",
          "Stomatologiya",
          "Bilyard",
          "Tennis",
          "Fitness",
        ],
      },
      features: {
        heading: "Imkoniyatlar",
        links: [
          "Onlayn jadval",
          "Mijozlar bazasi",
          "SMS xabarnomalar",
          "Telegram bot",
          "Instagram ulanish",
          "Tahlil va hisobotlar",
        ],
      },
      company: {
        heading: "Kompaniya",
        links: ["Biz haqimizda", "Hamkorlar", "Vakansiyalar", "Aloqa"],
      },
      docs: {
        heading: "Hujjatlar",
        links: ["Foydalanish shartlari", "Maxfiylik siyosati", "Oferta"],
      },
    },
    rights: "Barcha huquqlar himoyalangan.",
    privacy: "Maxfiylik siyosati",
    terms: "Foydalanish shartlari",
    offer: "Oferta",
  },
};

export type HomeDict = typeof dict;

export default dict;
