import type { LocaleShape } from '../../types';
import type { th } from '../th';
import { common } from './common';
import { nav } from './nav';
import { auth } from './auth';
import { pos } from './pos';
import { payment } from './payment';
import { receipt } from './receipt';
import { receiptScreen } from './receiptScreen';
import { settings } from './settings';

/** English dictionary — shape is checked against the Thai source of truth */
export const en: LocaleShape<typeof th> = { common, nav, auth, pos, payment, receipt, receiptScreen, settings };
