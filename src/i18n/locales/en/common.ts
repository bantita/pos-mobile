import type { LocaleShape } from '../../types';
import type { common as thCommon } from '../th/common';

export const common: LocaleShape<typeof thCommon> = {
  save: 'Save',
  cancel: 'Cancel',
  confirm: 'Confirm',
  close: 'Close',
  back: 'Back',
  loading: 'Loading...',
  error: 'Something went wrong',
  errorTitle: 'Error',
  noData: 'No data',
  retry: 'Retry',
  search: 'Search',
  langShort: {
    th: 'TH',
    en: 'EN',
  },
  docType: {
    receipt: 'Receipt',
    taxShort: 'Abbreviated Tax Invoice',
    taxFull: 'Tax Invoice',
  },
};
