/**
 * Permission Store — M10
 * Zustand store สำหรับจัดการ Role, Permission, Menu Visibility, Audit Log
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from './persistStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Role =
  | 'owner'
  | 'manager'
  | 'cashier'
  | 'stock_staff'
  | 'report_viewer'
  | 'admin';

export type Action = 'view' | 'add' | 'edit' | 'delete' | 'approve' | 'export';

export type Module =
  | 'sale'
  | 'product'
  | 'inventory'
  | 'reports'
  | 'crm'
  | 'promotion'
  | 'supplier'
  | 'settings'
  | 'users'
  | 'roles'
  | 'audit_log'
  | 'sync';

export interface Permission {
  module: Module;
  actions: Action[];
}

export interface RolePermission {
  role: Role;
  label: string;
  color: string;
  permissions: Permission[];
}

export interface MenuVisibility {
  module: Module;
  enabled: boolean;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  module: string;
  description: string;
  beforeValue?: string;
  afterValue?: string;
  documentNo?: string;
  ipAddress?: string;
  deviceId?: string;
}

// ─── Default Permissions ──────────────────────────────────────────────────────

const ALL_ACTIONS: Action[] = ['view', 'add', 'edit', 'delete', 'approve', 'export'];
const ALL_MODULES: Module[] = [
  'sale', 'product', 'inventory', 'reports', 'crm', 'promotion',
  'supplier', 'settings', 'users', 'roles', 'audit_log', 'sync',
];

const DEFAULT_ROLE_PERMISSIONS: RolePermission[] = [
  {
    role: 'owner',
    label: 'เจ้าของ',
    color: '#7C3AED',
    permissions: ALL_MODULES.map((m) => ({ module: m, actions: [...ALL_ACTIONS] })),
  },
  {
    role: 'manager',
    label: 'ผู้จัดการ',
    color: '#1a56db',
    permissions: [
      { module: 'sale',      actions: ['view', 'add', 'edit', 'delete', 'approve', 'export'] },
      { module: 'product',   actions: ['view', 'add', 'edit', 'approve', 'export'] },
      { module: 'inventory', actions: ['view', 'add', 'edit', 'delete', 'approve', 'export'] },
      { module: 'reports',   actions: ['view', 'export'] },
      { module: 'settings',  actions: ['view', 'edit'] },
      { module: 'users',     actions: ['view', 'add', 'edit'] },
    ],
  },
  {
    role: 'cashier',
    label: 'แคชเชียร์',
    color: '#10B981',
    permissions: [
      { module: 'sale',      actions: ['view', 'add'] },
      { module: 'product',   actions: ['view'] },
      { module: 'inventory', actions: ['view'] },
    ],
  },
  {
    role: 'stock_staff',
    label: 'พนักงานคลัง',
    color: '#F59E0B',
    permissions: [
      { module: 'inventory', actions: ['view', 'add', 'edit', 'delete', 'approve', 'export'] },
      { module: 'product',   actions: ['view'] },
      { module: 'reports',   actions: ['view'] },
    ],
  },
  {
    role: 'report_viewer',
    label: 'ดูรายงาน',
    color: '#EF4444',
    permissions: [
      { module: 'reports',   actions: ['view', 'export'] },
      { module: 'sale',      actions: ['view'] },
      { module: 'inventory', actions: ['view'] },
    ],
  },
  {
    role: 'admin',
    label: 'ผู้ดูแลระบบ',
    color: '#6B7280',
    permissions: [
      { module: 'settings',  actions: ['view', 'add', 'edit', 'delete', 'approve', 'export'] },
      { module: 'users',     actions: ['view', 'add', 'edit', 'delete', 'approve', 'export'] },
      { module: 'roles',     actions: ['view', 'add', 'edit', 'delete', 'approve', 'export'] },
      { module: 'audit_log', actions: ['view', 'add', 'edit', 'delete', 'approve', 'export'] },
      { module: 'sync',      actions: ['view', 'add', 'edit', 'delete', 'approve', 'export'] },
    ],
  },
];

const DEFAULT_MENU_VISIBILITY: MenuVisibility[] = ALL_MODULES.map((m) => ({
  module: m,
  enabled: true,
}));

// ─── Mock Audit Log ───────────────────────────────────────────────────────────

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);

const MOCK_AUDIT_LOG: AuditEntry[] = [
  {
    id: 'aud_001',
    timestamp: hoursAgo(1),
    userId: 'usr_001',
    userName: 'สมชาย เจ้าของร้าน',
    userRole: 'owner',
    action: 'LOGIN',
    module: 'auth',
    description: 'เข้าสู่ระบบสำเร็จ',
    ipAddress: '192.168.1.10',
    deviceId: 'POS-001',
  },
  {
    id: 'aud_002',
    timestamp: hoursAgo(2),
    userId: 'usr_002',
    userName: 'มานี ผู้จัดการ',
    userRole: 'manager',
    action: 'SALE_CREATE',
    module: 'sale',
    description: 'สร้างรายการขายใหม่',
    documentNo: 'INV-20250101-0001',
    afterValue: '฿1,250.00',
    ipAddress: '192.168.1.11',
    deviceId: 'POS-001',
  },
  {
    id: 'aud_003',
    timestamp: hoursAgo(3),
    userId: 'usr_003',
    userName: 'สุดา แคชเชียร์',
    userRole: 'cashier',
    action: 'SALE_CREATE',
    module: 'sale',
    description: 'สร้างรายการขายใหม่',
    documentNo: 'INV-20250101-0002',
    afterValue: '฿780.00',
    ipAddress: '192.168.1.12',
    deviceId: 'POS-002',
  },
  {
    id: 'aud_004',
    timestamp: hoursAgo(4),
    userId: 'usr_002',
    userName: 'มานี ผู้จัดการ',
    userRole: 'manager',
    action: 'SALE_CANCEL',
    module: 'sale',
    description: 'ยกเลิกรายการขาย',
    documentNo: 'INV-20241231-0015',
    beforeValue: 'สถานะ: ชำระแล้ว',
    afterValue: 'สถานะ: ยกเลิก',
    ipAddress: '192.168.1.11',
    deviceId: 'POS-001',
  },
  {
    id: 'aud_005',
    timestamp: hoursAgo(5),
    userId: 'usr_001',
    userName: 'สมชาย เจ้าของร้าน',
    userRole: 'owner',
    action: 'PRICE_CHANGE',
    module: 'product',
    description: 'เปลี่ยนราคาสินค้า: น้ำดื่มขนาด 600ml',
    documentNo: 'PRD-00042',
    beforeValue: '฿8.00',
    afterValue: '฿10.00',
    ipAddress: '192.168.1.10',
    deviceId: 'POS-001',
  },
  {
    id: 'aud_006',
    timestamp: hoursAgo(6),
    userId: 'usr_004',
    userName: 'วิชัย พนักงานคลัง',
    userRole: 'stock_staff',
    action: 'STOCK_ADJUST',
    module: 'inventory',
    description: 'ปรับยอดสต๊อก: ข้าวสาร 5kg',
    documentNo: 'ADJ-20250101-001',
    beforeValue: '120 ถุง',
    afterValue: '115 ถุง',
    ipAddress: '192.168.1.13',
    deviceId: 'POS-003',
  },
  {
    id: 'aud_007',
    timestamp: hoursAgo(8),
    userId: 'usr_001',
    userName: 'สมชาย เจ้าของร้าน',
    userRole: 'owner',
    action: 'USER_CHANGE',
    module: 'users',
    description: 'แก้ไขข้อมูลผู้ใช้: สุดา แคชเชียร์',
    beforeValue: 'Role: cashier, สาขา: สาขาหลัก',
    afterValue: 'Role: cashier, สาขา: สาขาลาดพร้าว',
    ipAddress: '192.168.1.10',
    deviceId: 'POS-001',
  },
  {
    id: 'aud_008',
    timestamp: hoursAgo(10),
    userId: 'usr_001',
    userName: 'สมชาย เจ้าของร้าน',
    userRole: 'owner',
    action: 'PERMISSION_CHANGE',
    module: 'roles',
    description: 'แก้ไข Permission: manager — เพิ่มสิทธิ์ delete ใน product',
    beforeValue: 'manager.product: [view, add, edit]',
    afterValue: 'manager.product: [view, add, edit, delete]',
    ipAddress: '192.168.1.10',
    deviceId: 'POS-001',
  },
  {
    id: 'aud_009',
    timestamp: hoursAgo(12),
    userId: 'usr_003',
    userName: 'สุดา แคชเชียร์',
    userRole: 'cashier',
    action: 'DISCOUNT_APPLY',
    module: 'sale',
    description: 'ใช้ส่วนลด 10% กับรายการขาย',
    documentNo: 'INV-20241231-0020',
    beforeValue: '฿2,500.00',
    afterValue: '฿2,250.00',
    ipAddress: '192.168.1.12',
    deviceId: 'POS-002',
  },
  {
    id: 'aud_010',
    timestamp: hoursAgo(14),
    userId: 'usr_002',
    userName: 'มานี ผู้จัดการ',
    userRole: 'manager',
    action: 'BILL_REPRINT',
    module: 'sale',
    description: 'พิมพ์ใบเสร็จซ้ำ',
    documentNo: 'INV-20241231-0010',
    ipAddress: '192.168.1.11',
    deviceId: 'POS-001',
  },
  {
    id: 'aud_011',
    timestamp: daysAgo(1),
    userId: 'usr_005',
    userName: 'ปิยะ ดูรายงาน',
    userRole: 'report_viewer',
    action: 'EXPORT_REPORT',
    module: 'reports',
    description: 'ส่งออกรายงานยอดขายประจำวัน',
    afterValue: 'รายงานวันที่ 31/12/2567 — 42 รายการ',
    ipAddress: '192.168.1.14',
    deviceId: 'POS-004',
  },
  {
    id: 'aud_012',
    timestamp: daysAgo(1),
    userId: 'usr_001',
    userName: 'สมชาย เจ้าของร้าน',
    userRole: 'owner',
    action: 'PRODUCT_EDIT',
    module: 'product',
    description: 'แก้ไขข้อมูลสินค้า: โค้กกระป๋อง 325ml',
    documentNo: 'PRD-00015',
    beforeValue: 'หมวด: เครื่องดื่ม, บาร์โค้ด: 8850999023214',
    afterValue: 'หมวด: เครื่องดื่มอัดลม, บาร์โค้ด: 8850999023214',
    ipAddress: '192.168.1.10',
    deviceId: 'POS-001',
  },
  {
    id: 'aud_013',
    timestamp: daysAgo(2),
    userId: 'usr_004',
    userName: 'วิชัย พนักงานคลัง',
    userRole: 'stock_staff',
    action: 'STOCK_ADJUST',
    module: 'inventory',
    description: 'รับสินค้าเข้าคลัง: PO-20241230-001',
    documentNo: 'RCV-20241230-001',
    afterValue: 'รับสินค้า 8 รายการ รวม 240 ชิ้น',
    ipAddress: '192.168.1.13',
    deviceId: 'POS-003',
  },
  {
    id: 'aud_014',
    timestamp: daysAgo(2),
    userId: 'usr_001',
    userName: 'สมชาย เจ้าของร้าน',
    userRole: 'owner',
    action: 'SHOP_SETTINGS_CHANGE',
    module: 'settings',
    description: 'แก้ไขตั้งค่าร้านค้า: เปิด VAT 7%',
    beforeValue: 'VAT: ปิด',
    afterValue: 'VAT: เปิด 7%',
    ipAddress: '192.168.1.10',
    deviceId: 'POS-001',
  },
  {
    id: 'aud_015',
    timestamp: daysAgo(3),
    userId: 'usr_001',
    userName: 'สมชาย เจ้าของร้าน',
    userRole: 'owner',
    action: 'SECURITY_SETTINGS_CHANGE',
    module: 'settings',
    description: 'แก้ไขนโยบายความปลอดภัย: เปิด Biometric Login',
    beforeValue: 'Biometric: ปิด',
    afterValue: 'Biometric: เปิด',
    ipAddress: '192.168.1.10',
    deviceId: 'POS-001',
  },
];

// ─── Store Interface ──────────────────────────────────────────────────────────

interface PermissionState {
  currentRole: Role;
  rolePermissions: RolePermission[];
  menuVisibility: MenuVisibility[];
  auditLog: AuditEntry[];

  /** Screen-level permissions per role (persisted) */
  screenPermissions: Record<string, string[]>;

  // Role
  setCurrentRole: (role: Role) => void;

  // Permission queries
  hasPermission: (role: Role, module: Module, action: Action) => boolean;
  getVisibleActions: (role: Role, module: Module) => Action[];
  getRolePermission: (role: Role) => RolePermission | undefined;

  // Screen permission queries
  canAccessScreen: (role: string, screenKey: string) => boolean;
  getScreensForRole: (role: string) => string[];
  setScreensForRole: (role: string, screens: string[]) => void;
  toggleScreenForRole: (role: string, screenKey: string) => void;

  // Mutations
  updateRolePermission: (role: Role, module: Module, actions: Action[]) => void;
  toggleMenuVisibility: (module: Module) => void;

  // Audit
  addAuditLog: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
  currentRole: 'owner',
  rolePermissions: DEFAULT_ROLE_PERMISSIONS,
  menuVisibility: DEFAULT_MENU_VISIBILITY,
  auditLog: MOCK_AUDIT_LOG,
  screenPermissions: {},

  setCurrentRole: (role) => set({ currentRole: role }),

  // ── Screen-level permissions ─────────────────────────────────────────────
  canAccessScreen: (role, screenKey) => {
    if (role === 'admin' || role === 'owner') return true;
    const custom = get().screenPermissions[role];
    if (custom) return custom.includes(screenKey);
    // fallback to default from rolePermissions.ts
    const { DEFAULT_SCREEN_PERMISSIONS } = require('../constants/rolePermissions');
    return (DEFAULT_SCREEN_PERMISSIONS[role] || []).includes(screenKey);
  },

  getScreensForRole: (role) => {
    const custom = get().screenPermissions[role];
    if (custom) return custom;
    const { DEFAULT_SCREEN_PERMISSIONS } = require('../constants/rolePermissions');
    return DEFAULT_SCREEN_PERMISSIONS[role] || [];
  },

  setScreensForRole: (role, screens) => {
    set(s => ({ screenPermissions: { ...s.screenPermissions, [role]: screens } }));
    // Sync to canAccess helper
    const { setCustomPermissions } = require('../constants/rolePermissions');
    setCustomPermissions({ ...get().screenPermissions, [role]: screens });
  },

  toggleScreenForRole: (role, screenKey) => {
    const current = get().getScreensForRole(role);
    const updated = current.includes(screenKey)
      ? current.filter((k: string) => k !== screenKey)
      : [...current, screenKey];
    get().setScreensForRole(role, updated);
  },

  hasPermission: (role, module, action) => {
    const rp = get().rolePermissions.find((r) => r.role === role);
    if (!rp) return false;
    const perm = rp.permissions.find((p) => p.module === module);
    if (!perm) return false;
    return perm.actions.includes(action);
  },

  getVisibleActions: (role, module) => {
    const rp = get().rolePermissions.find((r) => r.role === role);
    if (!rp) return [];
    const perm = rp.permissions.find((p) => p.module === module);
    return perm?.actions ?? [];
  },

  getRolePermission: (role) => get().rolePermissions.find((r) => r.role === role),

  updateRolePermission: (role, module, actions) => {
    set((state) => ({
      rolePermissions: state.rolePermissions.map((rp) => {
        if (rp.role !== role) return rp;
        const existing = rp.permissions.find((p) => p.module === module);
        if (existing) {
          return {
            ...rp,
            permissions: rp.permissions.map((p) =>
              p.module === module ? { ...p, actions } : p
            ),
          };
        }
        return {
          ...rp,
          permissions: [...rp.permissions, { module, actions }],
        };
      }),
    }));
  },

  toggleMenuVisibility: (module) => {
    set((state) => ({
      menuVisibility: state.menuVisibility.map((mv) =>
        mv.module === module ? { ...mv, enabled: !mv.enabled } : mv
      ),
    }));
  },

  addAuditLog: (entry) => {
    const newEntry: AuditEntry = {
      ...entry,
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date(),
    };
    set((state) => ({ auditLog: [newEntry, ...state.auditLog] }));
  },
    }),
    { name: 'pos-permissions', storage: createJSONStorage(() => persistStorage) }
  )
);
