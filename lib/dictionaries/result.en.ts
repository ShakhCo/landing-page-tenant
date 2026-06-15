import type { ResultDict } from './result.uz';

export const dict: ResultDict = {
  monthsFull: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  weekdaysFull: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

  statusPending: 'Pending',
  statusConfirmed: 'Confirmed',
  statusCompleted: 'Completed',
  statusCancelled: 'Cancelled',
  statusNoShow: 'No-show',
  booked: 'Booked',

  som: "so'm",
  perHour: '/hr',
  durHour: 'h',
  durMin: 'min',
  durZero: '0 min',

  today: 'Today',
  tomorrow: 'Tomorrow',

  resourceUnit: 'Spot',
  resourceStaff: 'Specialist',
  fieldTime: 'Time',
  customer: 'Customer',
  total: 'Total',
  itemFallback: 'Service',

  bookAgain: 'Book again',
  bookingRef: 'Booking no.',
  help: 'Help',

  rescheduleQ: 'Change the time?',
  rescheduleHint: 'No need to cancel — you can move the booking to a time that suits you.',
  rescheduleYes: 'Yes, change the time',
  cancelNo: 'No, cancel',

  cancelTitle: 'Cancel booking',
  smsTitle: 'Enter the SMS code',
  reasonQ: 'Reason?',
  optional: '(optional)',
  codeSentPre: 'A 5-digit code was sent to ',
  codeSentPost: '.',
  resendCode: 'Resend code',
  cancelConfirm: 'Cancel booking',
  cancelling: 'Cancelling…',

  manageReschedule: 'Change time',
  manageCancel: "Cancel, I can't make it",

  ariaBack: 'Back',
  ariaClose: 'Close',

  reviewTitle: 'Leave a review',
  reviewRatingLabel: 'Your rating',
  reviewCommentLabel: 'Comment (optional)',
  reviewSubmit: 'Submit',
  reviewThanks: 'Thanks for your review!',
};
