import { common } from './common';
import { nav } from './nav';
import { auth } from './auth';
import { pos } from './pos';
import { payment } from './payment';
import { receipt } from './receipt';
import { receiptScreen } from './receiptScreen';
import { settings } from './settings';

/** พจนานุกรมภาษาไทย — แหล่งความจริงของชุด key ทั้งหมด */
export const th = { common, nav, auth, pos, payment, receipt, receiptScreen, settings } as const;
