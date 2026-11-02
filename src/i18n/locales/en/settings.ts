import type { LocaleShape } from '../../types';
import type { settings as thSettings } from '../th/settings';

export const settings: LocaleShape<typeof thSettings> = {
  language: 'ภาษา / Language',
  uiLanguage: 'Display language',
  receiptLanguage: 'ภาษาใบเสร็จ / Receipt language',
  receiptLanguageHint: 'Legal tax invoices should be issued in Thai',
};
