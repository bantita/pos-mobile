/**
 * useBranchGuard — Phase 2 hook
 * ใช้สำหรับ:
 * 1. เช็คว่า user ปัจจุบันเข้าถึงสาขาไหนได้บ้าง
 * 2. filter ข้อมูลที่มี branchId ให้แสดงเฉพาะสาขาที่มีสิทธิ์
 * 3. ให้ active branch context สำหรับสร้างเอกสารใหม่
 */
import { useAuthStore } from '../store/authStore';
import { useBranchPermissionStore } from '../store/branchPermissionStore';
import { getBranches } from '../store/branchStore';

export interface BranchInfo {
  id: string;
  name: string;
}

export function useBranchGuard() {
  const { user } = useAuthStore();
  const { entries, activeBranchId, setActiveBranch, canAccessBranch } = useBranchPermissionStore();

  const userId = user?.id ?? '';
  const role = user?.role;
  const isAdmin = role === 'owner' || role === 'admin';

  // หา entry ของ user ปัจจุบัน
  const entry = entries.find((e) => e.userId === userId);
  const hasAllAccess = isAdmin || (entry?.isAllBranches ?? false);

  // สาขาทั้งหมดในระบบ
  const allBranches = getBranches();

  // สาขาที่ user เข้าถึงได้
  const accessibleBranches: BranchInfo[] = hasAllAccess
    ? allBranches.map((b) => ({ id: b.id, name: b.name }))
    : allBranches
        .filter((b) => entry?.branchIds.includes(b.id))
        .map((b) => ({ id: b.id, name: b.name }));

  // ถ้าไม่มี accessible branches เลย ให้ fallback เป็นสาขาแรก
  const effectiveBranches = accessibleBranches.length > 0
    ? accessibleBranches
    : allBranches.length > 0
      ? [{ id: allBranches[0].id, name: allBranches[0].name }]
      : [{ id: 'default', name: 'สาขาหลัก' }];

  // Active branch
  const currentBranchId = activeBranchId ?? effectiveBranches[0]?.id ?? 'default';
  const currentBranch = effectiveBranches.find((b) => b.id === currentBranchId) ?? effectiveBranches[0];

  return {
    /** สาขาที่ user เข้าถึงได้ทั้งหมด */
    accessibleBranches: effectiveBranches,

    /** user มีสิทธิ์ดูทุกสาขาไหม */
    hasAllAccess,

    /** สาขาที่กำลังใช้งานอยู่ */
    activeBranchId: currentBranchId,
    activeBranch: currentBranch,

    /** เปลี่ยนสาขาที่ใช้งาน */
    setActiveBranch,

    /** เช็คว่า branchId นี้ user เข้าถึงได้ไหม */
    canAccess: (branchId: string) => hasAllAccess || canAccessBranch(userId, branchId),

    /** filter array ของ item ที่มี branchId ให้เหลือเฉพาะที่ user เข้าถึงได้ */
    filterByBranch: <T extends { branchId?: string }>(items: T[]): T[] => {
      if (hasAllAccess) return items;
      return items.filter((item) => {
        if (!item.branchId) return true; // item ไม่มี branchId = ทุกคนเห็น
        return canAccessBranch(userId, item.branchId);
      });
    },

    /** filter ให้เหลือเฉพาะ active branch */
    filterByActiveBranch: <T extends { branchId?: string }>(items: T[]): T[] => {
      return items.filter((item) => {
        if (!item.branchId) return true;
        return item.branchId === currentBranchId;
      });
    },
  };
}
