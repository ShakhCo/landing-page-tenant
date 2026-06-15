import type { ResultDict } from './result.uz';

export const dict: ResultDict = {
  monthsFull: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  weekdaysFull: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],

  statusPending: 'Ожидает',
  statusConfirmed: 'Подтверждено',
  statusCompleted: 'Завершено',
  statusCancelled: 'Отменено',
  statusNoShow: 'Не пришёл',
  booked: 'Забронировано',

  som: 'сум',
  perHour: '/час',
  durHour: 'ч',
  durMin: 'мин',
  durZero: '0 мин',

  today: 'Сегодня',
  tomorrow: 'Завтра',

  resourceUnit: 'Место',
  resourceStaff: 'Специалист',
  fieldTime: 'Время',
  customer: 'Клиент',
  total: 'Итого',
  itemFallback: 'Услуга',

  bookAgain: 'Записаться снова',
  bookingRef: 'Номер брони',
  help: 'Помощь',

  rescheduleQ: 'Изменить время?',
  rescheduleHint: 'Отменять не обязательно — можно перенести запись на удобное вам время.',
  rescheduleYes: 'Да, изменить время',
  cancelNo: 'Нет, отменить',

  cancelTitle: 'Отменить запись',
  smsTitle: 'Введите код из SMS',
  reasonQ: 'Причина?',
  optional: '(необязательно)',
  codeSentPre: 'На номер ',
  codeSentPost: ' отправлен 5-значный код.',
  resendCode: 'Отправить код повторно',
  cancelConfirm: 'Отменить запись',
  cancelling: 'Отменяем…',

  manageReschedule: 'Изменить время',
  manageCancel: 'Отменить, не смогу прийти',

  ariaBack: 'Назад',
  ariaClose: 'Закрыть',

  reviewTitle: 'Оставьте отзыв',
  reviewRatingLabel: 'Ваша оценка',
  reviewCommentLabel: 'Комментарий (необязательно)',
  reviewSubmit: 'Отправить',
  reviewThanks: 'Спасибо за ваш отзыв!',
};
