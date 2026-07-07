/**
 * usePermission Hook — M10
 * Convenience hook สำหรับ permission checking
 */
import { usePermissionStore, Module, Action } from '@/features/settings/application/stores/permissionStore';

export const usePermission = () => {
  const { currentRole, hasPermission, getVisibleActions } = usePermissionStore();

  return {
    /** ตรวจสอบว่า role ปัจจุบันมีสิทธิ์ module/action นั้นหรือไม่ */
    can: (module: Module, action: Action) =>
      hasPermission(currentRole, module, action),

    /** ตรวจสอบว่า role ปัจจุบันมีสิทธิ์ action ใด action หนึ่งใน module หรือไม่ */
    canAny: (module: Module, actions: Action[]) =>
      actions.some((a) => hasPermission(currentRole, module, a)),

    /** Actions ที่ role ปัจจุบันทำได้ใน module นี้ */
    visibleActions: (module: Module) => getVisibleActions(currentRole, module),

    role: currentRole,
    isOwner: currentRole === 'owner',
    isManager: currentRole === 'manager' || currentRole === 'owner',
    isCashier: currentRole === 'cashier',
    isAdmin: currentRole === 'admin' || currentRole === 'owner',
  };
};
