import type { LocaleShape } from '../../types';
import type { pos as thPos } from '../th/pos';

export const pos: LocaleShape<typeof thPos> = {
  cashierFallback: 'Cashier',
  orderType: {
    normal: 'Normal',
    preorder: 'Pre-order',
    delivery: 'Delivery',
    dinein: 'Dine-in',
  },
};
