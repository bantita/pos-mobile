/**
 * useUserBranches — hook สำหรับเช็คสาขาที่ user ปัจจุบันเข้าถึงได้
 * owner / admin เห็นทุกสาขา
 * คนอื่นเห็นเฉพาะสาขาที่ถูกกำหนดใน branchIds
 */
import { useAuthStore } from '@/features/auth/application/stores/authStore';
import { useEmployeeStore } from '@/features/settings/application/stores/employeeStore';

/** สาขาทั้งหมดในระบบ (mock) */
export const ALL_BRANCHES = [
  { id: 'b1', name: 'สาขาหลัก' },
  { id: 'b2', name: 'สาขา 1' },
  { id: 'b3', name: 'สาขา เชียงใหม่' },
];

export function useUserBranches() {
  const { user } = useAuthStore();
  const { users } = useEmployeeStore();

  // หา user account จาก auth
  const currentUser = users.find(u => u.username === user?.username);
  const role = user?.role ?? currentUser?.role;

  // owner / admin เห็นทุกสาขา
  const canSeeAll = role === 'owner' || role === 'admin';

  // สาขาที่ user เข้าถึงได้
  const accessibleBranches = canSeeAll
    ? ALL_BRANCHES
    : ALL_BRANCHES.filter(b => currentUser?.branchIds?.includes(b.id));

  // ถ้าไม่ได้กำหนด branchIds ให้ default เป็นสาขาหลัก
  const effectiveBranches = accessibleBranches.length > 0 ? accessibleBranches : [ALL_BRANCHES[0]];

  return {
    allBranches: ALL_BRANCHES,
    accessibleBranches: effectiveBranches,
    canSeeAll,
    /** เช็คว่า branchId นี้ user เข้าถึงได้ไหม */
    canAccess: (branchId: string) => canSeeAll || effectiveBranches.some(b => b.id === branchId),
  };
}
