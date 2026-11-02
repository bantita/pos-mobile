import type { LocaleShape } from '../../types';
import type { payment as thPayment } from '../th/payment';

export const payment: LocaleShape<typeof thPayment> = {
  method: {
    cash: 'Cash',
    transfer: 'Transfer',
    qr: 'QR Code',
    credit: 'Card',
    wallet: 'Wallet',
    ewallet: 'E-Wallet',
    coupon: 'Coupon',
  },
  ewalletOther: 'E-Wallet / Other',
  memberTypeDiscount: '{name} discount {percent}%',
  couponInvalid: 'Invalid coupon',
  title: 'Charge',
  confirmPrint: 'Confirm & print bill',
  amountDue: 'Amount due',
  removeSplit: 'Remove this payment',
  paidSoFar: 'Paid:',
  remaining: 'Remaining:',
  chooseMethod: 'Choose a payment method:',
  addMethod: 'Add a payment (split):',
  amountFor: 'Amount ({method}):',
  amountPlaceholder: 'Enter amount (remaining ฿{amount})',
  fullAmount: 'Exact amount',
  walletBalance: 'Wallet: ฿{amount}',
  change: 'Change',
  walletNeedMember: 'Please select a member before paying by Wallet',
  walletInsufficient: 'Insufficient Wallet balance (balance ฿{balance}, due ฿{amount})',
  settings: {
    title: 'Payment type settings',
    subtitle: 'Add or remove the payment types to show',
    defaultTag: 'Default',
    newPlaceholder: 'New payment type name, e.g. Rabbit Card',
    add: 'Add',
  },
};
