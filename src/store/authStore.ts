/**
 * Auth Store — Zustand + Persist
 * จัดการ Login/Logout + เก็บ registered users
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from './persistStorage';

export type UserRole = 'owner' | 'manager' | 'cashier' | 'stock_staff' | 'report_viewer' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  shopName?: string;
  shopLogo?: string;
}

interface RegisteredUser extends AuthUser {
  password: string;
}

interface AuthState {
  user: AuthUser | null;
  registeredUsers: RegisteredUser[];
  /** OTP ที่ออกล่าสุดแบบ mock (เบอร์ -> รหัส 6 หลัก) */
  pendingOTPs: Record<string, string>;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  register: (data: { phone: string; name: string; password: string; shopName: string }) => AuthUser;
  setShopName: (name: string) => void;
  setShopLogo: (uri: string) => void;
  /** ขอ OTP (mock) — สร้างรหัส 6 หลักแล้วเก็บไว้ใน state คืนค่ารหัสเพื่อโชว์ตอน dev */
  requestOTP: (phone: string) => string;
  /** ยืนยัน OTP (mock) — ถ้าถูกต้อง login ด้วยบัญชีที่ผูกเบอร์นั้น (หรือสร้าง session เจ้าของ) */
  verifyOTP: (phone: string, otp: string) => boolean;
  /** รีเซ็ตรหัสผ่านของ user ที่ตรง username/เบอร์ */
  resetPassword: (username: string, newPassword: string) => boolean;
}

// Demo users (ใช้ทดสอบ)
const DEMO_USERS: RegisteredUser[] = [
  { id: 'u-super', name: 'Super Admin', username: 'xclnc', password: 'KobKun@You', role: 'admin' },
  { id: 'u1', name: 'สมชาย ใจดี', username: 'admin', password: '1234', role: 'owner' },
  { id: 'u2', name: 'ผู้จัดการ', username: 'manager', password: '1234', role: 'manager' },
  { id: 'u3', name: 'สมหญิง จริงใจ', username: 'cashier', password: '1234', role: 'cashier' },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      registeredUsers: DEMO_USERS,
      pendingOTPs: {},

      login: (username, password) => {
        // Super Admin hardcoded — เข้าได้เสมอไม่ว่า persist state จะเป็นอะไร
        if (username === 'xclnc' && password === 'KobKun@You') {
          set({ user: { id: 'u-super', name: 'Super Admin', username: 'xclnc', role: 'admin' } });
          return true;
        }
        const allUsers = get().registeredUsers;
        const found = allUsers.find(u =>
          (u.username === username || u.username === username.replace(/-/g, '')) &&
          u.password === password
        );
        if (found) {
          const { password: _, ...user } = found;
          try {
            const storeConfig = require('./storeConfigStore').useStoreConfigStore.getState();
            if (storeConfig.storeName) {
              user.shopName = storeConfig.storeName;
            }
          } catch (e) {}
          set({ user });
          return true;
        }
        return false;
      },

      logout: () => set({ user: null }),

      register: (data) => {
        // ล้างข้อมูลทั้งหมด — เริ่มต้นร้านใหม่จาก 0
        if (typeof localStorage !== 'undefined') {
          localStorage.clear();
          // set flag ให้ store อื่นรู้ว่าเป็นร้านใหม่ → ไม่ใช้ mock data
          localStorage.setItem('pos-fresh-store', 'true');
        }

        const newUser: RegisteredUser = {
          id: `u_${Date.now()}`,
          name: data.name || 'เจ้าของร้าน',
          username: data.phone.replace(/-/g, ''),
          password: data.password,
          role: 'owner',
          shopName: data.shopName,
        };
        const superAdmin: RegisteredUser = { id: 'u-super', name: 'Super Admin', username: 'xclnc', password: 'KobKun@You', role: 'admin' };
        // บันทึก auth ลง localStorage โดยตรง
        const authData = { state: { user: { id: newUser.id, name: newUser.name, username: newUser.username, role: newUser.role, shopName: newUser.shopName }, registeredUsers: [superAdmin, newUser] }, version: 0 };
        try { localStorage.setItem('pos-auth', JSON.stringify(authData)); } catch (_) {}
        // Reload เพื่อให้ทุก store อ่าน flag แล้วเริ่มจาก 0
        if (typeof window !== 'undefined') {
          setTimeout(() => window.location.reload(), 100);
        }
        set({ registeredUsers: [superAdmin, newUser], user: { ...newUser, password: undefined } as any as AuthUser });
        return newUser;
      },

      setShopName: (shopName) =>
        set((s) => ({ user: s.user ? { ...s.user, shopName } : s.user })),

      setShopLogo: (shopLogo) =>
        set((s) => ({ user: s.user ? { ...s.user, shopLogo } : s.user })),

      requestOTP: (phone) => {
        const normalized = phone.replace(/-/g, '');
        // MOCK: สร้าง OTP 6 หลักแบบ mock แทนการยิง SMS gateway จริง
        // เมื่อต่อ backend จริง: ให้เรียก src/services/api/* ส่ง SMS แล้วไม่ต้องเก็บรหัสฝั่ง client
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        set((s) => ({ pendingOTPs: { ...s.pendingOTPs, [normalized]: otp } }));
        return otp;
      },

      verifyOTP: (phone, otp) => {
        const normalized = phone.replace(/-/g, '');
        // MOCK: ตรวจ OTP จาก state ภายใน (ยังไม่ต่อ OTP service จริง)
        const expected = get().pendingOTPs[normalized];
        if (!expected || expected !== otp.trim()) return false;
        // ล้าง OTP ที่ใช้แล้ว
        set((s) => {
          const rest = { ...s.pendingOTPs };
          delete rest[normalized];
          return { pendingOTPs: rest };
        });
        // ผูก session: หา user ที่ username ตรงเบอร์ ไม่พบ -> ใช้บัญชีเจ้าของ demo
        const found = get().registeredUsers.find(
          (u) => u.username === normalized || u.username === phone
        );
        if (found) {
          const { password: _pw, ...user } = found;
          set({ user });
        } else {
          set({ user: { id: 'u-otp', name: 'ผู้ใช้ OTP', username: normalized, role: 'owner' } });
        }
        return true;
      },

      resetPassword: (username, newPassword) => {
        const normalized = username.replace(/-/g, '');
        const found = get().registeredUsers.find(
          (u) => u.username === username || u.username === normalized
        );
        if (!found) return false;
        set((s) => ({
          registeredUsers: s.registeredUsers.map((u) =>
            u.id === found.id ? { ...u, password: newPassword } : u
          ),
        }));
        return true;
      },
    }),
    {
      name: 'pos-auth',
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({ registeredUsers: state.registeredUsers }),
    }
  )
);
