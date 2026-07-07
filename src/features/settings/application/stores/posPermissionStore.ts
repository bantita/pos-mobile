/**
 * POS Permission Store — Zustand + Persist
 * สิทธิ์การทำรายการ POS + PIN 4 หลัก
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from '@/shared/infrastructure/storage/persistStorage';

/** Actions ที่ต้องใช้สิทธิ์ */
export type POSAction = 'void_bill' | 'cancel_hold' | 'change_price' | 'reprint';

export const POS_ACTION_LABELS: Record<POSAction, string> = {
  void_bill: 'ยกเลิกบิล',
  cancel_hold: 'ยกเลิกพักบิล',
  change_price: 'เปลี่ยนราคา',
  reprint: 'Reprint ใบเสร็จ',
};

export interface POSUser {
  id: string;
  name: string;
  pin: string; // 4 หลัก
  role: string;
  permissions: POSAction[];
}

/** ตั้งค่าเปิด/ปิดระบบสิทธิ์ POS */
export interface PermissionConfig {
  /** เปิดใช้ระบบสิทธิ์ (true = ต้องใส่ PIN, false = ไม่ต้อง) */
  enabled: boolean;
  /** actions ที่ต้องขอสิทธิ์ (ถ้า enabled) */
  requiredActions: POSAction[];
}

interface POSPermissionState {
  users: POSUser[];
  /** ตั้งค่าระดับบริษัท */
  companyConfig: PermissionConfig | null;
  /** ตั้งค่าระดับสาขา (key = branchId) */
  branchConfigs: Record<string, PermissionConfig>;

  // CRUD
  addUser: (user: Omit<POSUser, 'id'>) => POSUser;
  updateUser: (id: string, data: Partial<POSUser>) => void;
  deleteUser: (id: string) => void;
  generatePin: () => string;

  // Config
  setCompanyConfig: (config: PermissionConfig | null) => void;
  setBranchConfig: (branchId: string, config: PermissionConfig | null) => void;

  /** ดึง config ที่มีผล: สาขา → บริษัท → null (ไม่ต้องใช้สิทธิ์) */
  getEffectiveConfig: (branchId?: string) => PermissionConfig | null;

  /** ตรวจว่า action นี้ต้องใช้สิทธิ์ไหม */
  isActionRequired: (action: POSAction, branchId?: string) => boolean;

  // Auth
  verifyPin: (pin: string) => POSUser | null;
  checkPermission: (pin: string, action: POSAction) => { allowed: boolean; user?: POSUser; message?: string };
}

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const genPin = () => String(Math.floor(1000 + Math.random() * 9000));

const DEFAULT_USERS: POSUser[] = [
  { id: 'pu-001', name: 'สมชาย ใจดี (Owner)', pin: '1234', role: 'owner', permissions: ['void_bill', 'cancel_hold', 'change_price', 'reprint'] },
  { id: 'pu-002', name: 'ผู้จัดการ', pin: '5678', role: 'manager', permissions: ['void_bill', 'cancel_hold', 'change_price', 'reprint'] },
  { id: 'pu-003', name: 'สมหญิง (Cashier)', pin: '9999', role: 'cashier', permissions: ['reprint'] },
];

export const usePOSPermissionStore = create<POSPermissionState>()(
  persist(
    (set, get) => ({
      users: DEFAULT_USERS,
      companyConfig: null,  // null = ไม่เปิดใช้ระบบสิทธิ์
      branchConfigs: {},

      addUser: (data) => {
        const user: POSUser = { ...data, id: genId() };
        set(s => ({ users: [...s.users, user] }));
        return user;
      },

      updateUser: (id, data) => {
        set(s => ({ users: s.users.map(u => u.id === id ? { ...u, ...data } : u) }));
      },

      deleteUser: (id) => {
        set(s => ({ users: s.users.filter(u => u.id !== id) }));
      },

      generatePin: () => {
        const existing = get().users.map(u => u.pin);
        let pin = genPin();
        while (existing.includes(pin)) pin = genPin();
        return pin;
      },

      // Config
      setCompanyConfig: (config) => set({ companyConfig: config }),

      setBranchConfig: (branchId, config) => {
        set(s => {
          const updated = { ...s.branchConfigs };
          if (config === null) { delete updated[branchId]; }
          else { updated[branchId] = config; }
          return { branchConfigs: updated };
        });
      },

      getEffectiveConfig: (branchId) => {
        const { branchConfigs, companyConfig } = get();
        // 1. อ่านสาขาก่อน
        if (branchId && branchConfigs[branchId]) return branchConfigs[branchId];
        // 2. อ่านบริษัท
        if (companyConfig) return companyConfig;
        // 3. ไม่ตั้งทั้ง 2 ที่ = ไม่ต้องใช้สิทธิ์
        return null;
      },

      isActionRequired: (action, branchId) => {
        const config = get().getEffectiveConfig(branchId);
        if (!config || !config.enabled) return false;
        return config.requiredActions.includes(action);
      },

      verifyPin: (pin) => {
        return get().users.find(u => u.pin === pin) || null;
      },

      checkPermission: (pin, action) => {
        const user = get().users.find(u => u.pin === pin);
        if (!user) return { allowed: false, message: 'PIN ไม่ถูกต้อง' };
        if (!user.permissions.includes(action)) {
          return { allowed: false, user, message: `${user.name} ไม่มีสิทธิ์ "${POS_ACTION_LABELS[action]}"` };
        }
        return { allowed: true, user };
      },
    }),
    {
      name: 'pos-permissions',
      storage: createJSONStorage(() => persistStorage),
    }
  )
);
