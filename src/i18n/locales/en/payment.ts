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
};
