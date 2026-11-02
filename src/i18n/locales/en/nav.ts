import type { LocaleShape } from '../../types';
import type { nav as thNav } from '../th/nav';

export const nav: LocaleShape<typeof thNav> = {
  logout: 'Log out',
  role: {
    owner: 'Owner',
    manager: 'Manager',
    cashier: 'Cashier',
    admin: 'Administrator',
    stock_staff: 'Stock Staff',
    report_viewer: 'Report Viewer',
  },
};
