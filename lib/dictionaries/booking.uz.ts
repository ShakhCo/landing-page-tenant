// UI strings for the tenant booking flow. Content (service/category/unit names)
// comes from the tenant payload via localized(); these are the fixed labels.

export const dict = {
  // step titles / breadcrumb
  stepServices: 'Xizmatlarni tanlang',
  stepTime: 'Sana va vaqt',
  stepConfirm: 'Bronni tasdiqlash',
  shortServices: 'Xizmatlar',
  shortTime: 'Vaqt',
  shortConfirm: 'Tasdiqlash',
  // "<resource>ni tanlang" — uz appends the suffix, ru/en prepend a verb.
  choosePrefix: '',
  chooseSuffix: 'ni tanlang',

  // calendar / dates
  monthsShort: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
  monthsFull: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
  // Sunday-indexed (Date.getUTCDay) for the date chips.
  weekdaysSun: ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'],
  // Monday-first for the calendar header.
  weekdaysMon: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'],
  periods: ['Ertalab', 'Kunduzi', 'Kechqurun'],
  today: 'Bugun',
  tomorrow: 'Ertaga',
  duration: 'Davomiyligi',
  noSlots: "Bu kunga bo'sh vaqt yo'q.",

  // money / duration
  som: "so'm",
  perHour: '/soat',
  durHour: 'soat',
  durMin: 'daq',

  // resource labels
  resourceUnit: 'Joy',
  resourceStaff: 'Mutaxassis',
  bookings: 'ta bron',

  // services / staff cards
  all: 'Barchasi',
  otherCategory: 'Boshqa',
  selectedLabel: 'Tanlandi',
  add: "Qo'shish",
  choose: 'Tanlash',

  // errors
  errMultiStaff: 'Bu xizmatlarni bitta mutaxassis bajara olmaydi — alohida band qiling.',

  // done screen
  doneTitle: 'Band qilindi!',
  doneSubtitle: 'Tafsilotlarni SMS orqali tasdiqlaymiz.',
  ready: 'Tayyor',
  fieldTime: 'Vaqt',
  total: 'Jami',

  // confirm titles
  titleSmsCode: 'SMS kodni kiriting',
  titleConfirmChanges: "O'zgarishlarni tasdiqlaysizmi?",
  titleNewDateTime: 'Yangi sana va vaqt',

  // primary action labels
  actContinue: 'Davom etish',
  actChooseServices: 'Xizmatlarni tanlash',
  actUpdating: 'O‘zgartirilmoqda…',
  actSending: 'Yuborilmoqda…',
  actBooking: 'Bron qilinmoqda…',
  actPickTime: 'Vaqtni tanlang',
  actChange: 'O‘zgartirish',
  actBook: 'Bron qilish',
  actConfirmBooking: 'Bronni tasdiqlash',
  actChangeTime: "Vaqtni o'zgartirish",

  // confirm form
  codeSentPre: '',
  codeSentPost: ' raqamiga 5 xonali kod yuborildi.',
  phoneLabel: 'Telefon raqamingiz',
  phonePlaceholder: '90 123 45 67',
  sendCode: 'Kod yuborish',
  nameLabel: 'Ismingiz',
  namePlaceholder: 'Ism',
  resendCode: 'Kodni qayta yuborish',
  changePhone: "Telefon raqamni o'zgartirish",

  // summary
  servicesHeading: 'Xizmatlar',
  noServiceYet: 'Hali xizmat tanlanmagan.',
  serviceCount: 'xizmat', // `${n} xizmat`

  // aria
  ariaBack: 'Orqaga',
  ariaClose: 'Yopish',
  ariaPickDate: 'Sana tanlash',
  ariaDecrease: 'Kamaytirish',
  ariaIncrease: "Ko'paytirish",
  prevMonth: 'Oldingi oy',
  nextMonth: 'Keyingi oy',

  // invalid reschedule link screen
  invalidLinkTitle: 'Havola yaroqsiz',
  invalidLinkText: "Bu o'zgartirish havolasi eskirgan yoki yaroqsiz. Yangi bron qilishingiz mumkin.",
  newBooking: 'Yangi bron qilish',
};

export type BookingDict = typeof dict;
