/**
 * Branch Permission Store — Phase 2
 * สิทธิ์ตามสาขา: กำหนดว่า user แต่ละคนเข้าถึงสาขาไหนได้บ้าง
 * + active branch context สำหรับ filter ข้อมูลตามสาขาปัจจุบัน
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from './persistStorage';
import { logAction } from './auditLogStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BranchPermissionEntry {
  userId: string;
  branchIds: string[];  // สาขาที่ user เข้าถึงได้
  isAllBranches: boolean; // true = เข้าถึงทุกสาขา (owner/admin)
}

interface BranchPermissionState {
  /** mapping userId → branch access */
  entries: BranchPermissionEntry[];

  /** สาขาที่ user ปัจจุบันเลือกใช้งานอยู่ (active context) */
  activeBranchId: string | null;

  // ─── Actions ──────────────────────────────────────────────────────────────
  setActiveBranch: (branchId: string | null) => void;
  grantBranchAccess: (userId: string, branchIds: string[]) => void;
  revokeBranchAccess: (userId: string, branchIds: string[]) => void;
  setAllBranches: (userId: string, isAll: boolean) => void;
  getUserBranches: (userId: string) => BranchPermissionEntry | undefined;
  canAccessBranch: (userId: string, branchId: string) => boolean;
  removeUser: (userId: string) => void;
}

// ─── Default entries (demo users) ─────────────────────────────────────────────
const DEFAULT_ENTRIES: BranchPermissionEntry[] = [
  { userId: 'usr-001', branchIds: [], isAllBranches: true },   // owner — ทุกสาขา
  { userId: 'usr-002', branchIds: ['b1', 'b2'], isAllBranches: false }, // manager — 2 สาขา
  { userId: 'usr-003', branchIds: ['b1'], isAllBranches: false }, // cashier — สาขาหลักเท่านั้น
  { userId: 'usr-004', branchIds: ['b1'], isAllBranches: false }, // stock staff
  { userId: 'usr-005', branchIds: ['b1', 'b2', 'b3'], isAllBranches: false }, // report viewer
  { userId: 'admin', branchIds: [], isAllBranches: true },     // admin — ทุกสาขา
];

// ─── Store ────────────────────────────────────────────────────────────────────
export const useBranchPermissionStore = create<BranchPermissionState>()(
  persist(
    (set, get) => ({
      entries: DEFAULT_ENTRIES,
      activeBranchId: 'b1', // default = สาขาหลัก

      setActiveBranch: (branchId) => {
        set({ activeBranchId: branchId });
      },

      grantBranchAccess: (userId, branchIds) => {
        set((s) => {
          const existing = s.entries.find((e) => e.userId === userId);
          if (existing) {
            const merged = Array.from(new Set([...existing.branchIds, ...branchIds]));
            return {
              entries: s.entries.map((e) =>
                e.userId === userId ? { ...e, branchIds: merged } : e
              ),
            };
          }
          return {
            entries: [...s.entries, { userId, branchIds, isAllBranches: false }],
          };
        });
        logAction('roles', 'BRANCH_PERMISSION_GRANT', `อนุญาตสาขา [${branchIds.join(', ')}] ให้ user ${userId}`);
      },

      revokeBranchAccess: (userId, branchIds) => {
        set((s) => ({
          entries: s.entries.map((e) =>
            e.userId === userId
              ? { ...e, branchIds: e.branchIds.filter((id) => !branchIds.includes(id)) }
              : e
          ),
        }));
        logAction('roles', 'BRANCH_PERMISSION_REVOKE', `ถอนสิทธิ์สาขา [${branchIds.join(', ')}] จาก user ${userId}`);
      },

      setAllBranches: (userId, isAll) => {
        set((s) => {
          const existing = s.entries.find((e) => e.userId === userId);
          if (existing) {
            return {
              entries: s.entries.map((e) =>
                e.userId === userId ? { ...e, isAllBranches: isAll } : e
              ),
            };
          }
          return {
            entries: [...s.entries, { userId, branchIds: [], isAllBranches: isAll }],
          };
        });
      },

      getUserBranches: (userId) => {
        return get().entries.find((e) => e.userId === userId);
      },

      canAccessBranch: (userId, branchId) => {
        const entry = get().entries.find((e) => e.userId === userId);
        if (!entry) return false;
        if (entry.isAllBranches) return true;
        return entry.branchIds.includes(branchId);
      },

      removeUser: (userId) => {
        set((s) => ({
          entries: s.entries.filter((e) => e.userId !== userId),
        }));
      },
    }),
    {
      name: 'pos-branch-permissions',
      storage: createJSONStorage(() => persistStorage),
    }
  )
);
