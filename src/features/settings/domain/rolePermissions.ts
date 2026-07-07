/**
 * Role Permissions — Dynamic (persisted in permissionStore)
 * Default permissions + canAccess helper
 */
import { UserRole } from '@/features/auth/application/stores/authStore';

// ─── Screen/Feature list ─────────────────────────────────────────────────────
export interface ScreenPermission {
  key: string;
  label: string;
  group: string;
}

export const ALL_SCREENS: ScreenPermission[] = [
  // ขาย
  { key: 'pos',            label: 'ขายสินค้า',         group: 'การขาย' },
  { key: 'salehistory',   label: 'ประวัติการขาย',     group: 'การขาย' },
  { key: 'payment',       label: 'ชำระเงิน',          group: 'การขาย' },
  { key: 'void_bill',     label: 'ยกเลิกบิล',         group: 'การขาย' },
  { key: 'return_bill',   label: 'คืนสินค้า/Refund',  group: 'การขาย' },

  // สินค้า
  { key: 'products',      label: 'รายการสินค้า',       group: 'สินค้า' },
  { key: 'product_add',   label: 'เพิ่มสินค้า',       group: 'สินค้า' },
  { key: 'product_edit',  label: 'แก้ไขสินค้า',       group: 'สินค้า' },
  { key: 'pricing',       label: 'กำหนดราคา',         group: 'สินค้า' },
  { key: 'inventory',     label: 'คลังสินค้า',         group: 'สินค้า' },

  // CRM
  { key: 'crm_members',   label: 'ข้อมูลสมาชิก',      group: 'CRM' },
  { key: 'crm_add',       label: 'เพิ่มสมาชิก',       group: 'CRM' },
  { key: 'crm_history',   label: 'ประวัติการซื้อ',     group: 'CRM' },
  { key: 'crm_points',    label: 'จัดการคะแนน',       group: 'CRM' },
  { key: 'crm_levels',    label: 'ระดับสมาชิก',       group: 'CRM' },
  { key: 'crm_coupons',   label: 'คูปอง/Voucher',     group: 'CRM' },
  { key: 'crm_campaign',  label: 'Campaign',          group: 'CRM' },
  { key: 'crm_communication', label: 'ส่งข้อความ',    group: 'CRM' },

  // รายงาน
  { key: 'reports',        label: 'รายงานยอดขาย',      group: 'รายงาน' },
  { key: 'report_profit',  label: 'รายงานกำไร',       group: 'รายงาน' },
  { key: 'report_product', label: 'รายงานสินค้า',     group: 'รายงาน' },
  { key: 'report_inventory', label: 'รายงานคลัง',     group: 'รายงาน' },

  // โปรโมชั่น
  { key: 'promotions',    label: 'จัดการโปรโมชั่น',    group: 'โปรโมชั่น' },

  // ตั้งค่า / ระบบ
  { key: 'dashboard',     label: 'หน้าหลัก',          group: 'ระบบ' },
  { key: 'settings',      label: 'ตั้งค่า',            group: 'ระบบ' },
  { key: 'team',          label: 'จัดการทีม/พนักงาน',  group: 'ระบบ' },
  { key: 'auditlog',      label: 'Audit Log',         group: 'ระบบ' },
];

// ─── Default permissions per role ────────────────────────────────────────────
export const DEFAULT_SCREEN_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ALL_SCREENS.map(s => s.key), // admin เข้าได้ทุกหน้า
  owner: ALL_SCREENS.map(s => s.key), // owner เข้าได้ทุกหน้า
  manager: [
    'pos', 'salehistory', 'payment', 'void_bill', 'return_bill',
    'products', 'product_add', 'product_edit', 'pricing', 'inventory',
    'crm_members', 'crm_add', 'crm_history', 'crm_points', 'crm_levels', 'crm_coupons', 'crm_campaign', 'crm_communication',
    'reports', 'report_profit', 'report_product', 'report_inventory',
    'promotions', 'dashboard', 'auditlog',
  ],
  cashier: [
    'pos', 'salehistory', 'payment',
    'crm_members', 'crm_add', 'crm_history',
    'dashboard',
  ],
  stock_staff: [
    'products', 'inventory', 'dashboard',
  ],
  report_viewer: [
    'reports', 'report_profit', 'report_product', 'report_inventory', 'dashboard',
  ],
};

// ─── Backward compat: old route → screen keys mapping ────────────────────────
const ROUTE_TO_SCREEN: Record<string, string> = {
  dashboard: 'dashboard',
  pos: 'pos',
  salehistory: 'salehistory',
  products: 'products',
  pricing: 'pricing',
  inventory: 'inventory',
  reports: 'reports',
  crm: 'crm_members',
  promotions: 'promotions',
  communication: 'crm_communication',
  purchase: 'inventory',
  team: 'team',
  users: 'team',
  auditlog: 'auditlog',
  settings: 'settings',
};

// ─── canAccess (reads from permissionStore if available, else defaults) ───────
let _customPermissions: Record<string, string[]> | null = null;

export function setCustomPermissions(perms: Record<string, string[]>) {
  _customPermissions = perms;
}

export function getScreenPermissions(role: UserRole): string[] {
  if (_customPermissions && _customPermissions[role]) {
    return _customPermissions[role];
  }
  return DEFAULT_SCREEN_PERMISSIONS[role] || [];
}

export const canAccess = (role: UserRole, route: string): boolean => {
  if (role === 'admin') return true;
  const screenKey = ROUTE_TO_SCREEN[route] || route;
  const allowed = getScreenPermissions(role);
  return allowed.includes(screenKey);
};

/** label ภาษาไทยของ role */
export const ROLE_LABELS: Record<UserRole, string> = {
  owner:         'เจ้าของร้าน',
  manager:       'ผู้จัดการ',
  cashier:       'แคชเชียร์',
  admin:         'ผู้ดูแลระบบ',
  stock_staff:   'พนักงานคลัง',
  report_viewer: 'ผู้ดูรายงาน',
};
