// UI strings for the booking result / status page (/b/[id]).

export const dict = {
  monthsFull: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
  // Sunday-indexed (Date.getDay).
  weekdaysFull: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],

  statusPending: 'Kutilmoqda',
  statusConfirmed: 'Tasdiqlangan',
  statusCompleted: 'Yakunlangan',
  statusCancelled: 'Bekor qilingan',
  statusNoShow: 'Kelmagan',
  booked: 'Band qilindi',

  som: "so'm",
  perHour: '/soat',
  durHour: 'soat',
  durMin: 'daqiqa',
  durZero: '0 daqiqa',

  today: 'Bugun',
  tomorrow: 'Ertaga',

  resourceUnit: 'Joy',
  resourceStaff: 'Mutaxassis',
  fieldTime: 'Vaqt',
  customer: 'Mijoz',
  total: 'Jami',
  itemFallback: 'Xizmat',

  bookAgain: 'Yana bron qilish',
  bookingRef: 'Bron raqami',
  help: 'Yordam',

  // reschedule offer
  rescheduleQ: "Vaqtni o'zgartirasizmi?",
  rescheduleHint: "Bekor qilish shart emas — bronni o'zingizga qulay boshqa vaqtga ko'chirishingiz mumkin.",
  rescheduleYes: "Ha, vaqtni o'zgartirish",
  cancelNo: "Yo'q, bekor qilish",

  // cancel flow
  cancelTitle: 'Bronni bekor qilish',
  smsTitle: 'SMS kodni kiriting',
  reasonQ: 'Sababi nima?',
  optional: '(ixtiyoriy)',
  codeSentPre: '',
  codeSentPost: ' raqamiga 5 xonali kod yuborildi.',
  resendCode: 'Kodni qayta yuborish',
  cancelConfirm: 'Bronni bekor qilish',
  cancelling: 'Bekor qilinmoqda…',

  // manage rows
  manageReschedule: "Vaqtni o'zgartirish",
  manageCancel: 'Bekor qilish, bora olmayman',

  ariaBack: 'Orqaga',
  ariaClose: 'Yopish',

  reviewTitle: 'Bahoyingizni qoldiring',
  reviewRatingLabel: 'Bahoyingiz',
  reviewCommentLabel: 'Izoh (ixtiyoriy)',
  reviewSubmit: 'Yuborish',
  reviewThanks: 'Bahoyingiz uchun rahmat!',
  startedNotice: "Yozuv vaqti allaqachon boshlangan — uni endi o'zgartirish yoki bekor qilish mumkin emas.",
};

export type ResultDict = typeof dict;
