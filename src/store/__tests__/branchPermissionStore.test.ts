import { describe, it, expect, beforeEach } from 'vitest';
import { useBranchPermissionStore } from '../branchPermissionStore';

describe('branchPermissionStore', () => {
  beforeEach(() => {
    // Reset store to defaults
    useBranchPermissionStore.setState({
      entries: [
        { userId: 'usr-001', branchIds: [], isAllBranches: true },
        { userId: 'usr-002', branchIds: ['b1', 'b2'], isAllBranches: false },
        { userId: 'usr-003', branchIds: ['b1'], isAllBranches: false },
      ],
      activeBranchId: 'b1',
    });
  });

  describe('canAccessBranch', () => {
    it('owner (isAllBranches) สามารถเข้าถึงทุกสาขาได้', () => {
      const { canAccessBranch } = useBranchPermissionStore.getState();
      expect(canAccessBranch('usr-001', 'b1')).toBe(true);
      expect(canAccessBranch('usr-001', 'b2')).toBe(true);
      expect(canAccessBranch('usr-001', 'b99')).toBe(true);
    });

    it('manager เข้าได้เฉพาะสาขาที่กำหนด', () => {
      const { canAccessBranch } = useBranchPermissionStore.getState();
      expect(canAccessBranch('usr-002', 'b1')).toBe(true);
      expect(canAccessBranch('usr-002', 'b2')).toBe(true);
      expect(canAccessBranch('usr-002', 'b3')).toBe(false);
    });

    it('cashier เข้าได้เฉพาะสาขาเดียว', () => {
      const { canAccessBranch } = useBranchPermissionStore.getState();
      expect(canAccessBranch('usr-003', 'b1')).toBe(true);
      expect(canAccessBranch('usr-003', 'b2')).toBe(false);
    });

    it('user ที่ไม่มี entry เข้าไม่ได้เลย', () => {
      const { canAccessBranch } = useBranchPermissionStore.getState();
      expect(canAccessBranch('usr-unknown', 'b1')).toBe(false);
    });
  });

  describe('grantBranchAccess', () => {
    it('เพิ่มสาขาให้ user ที่มี entry แล้ว', () => {
      const { grantBranchAccess, canAccessBranch } = useBranchPermissionStore.getState();
      grantBranchAccess('usr-003', ['b2', 'b3']);

      const state = useBranchPermissionStore.getState();
      expect(state.canAccessBranch('usr-003', 'b1')).toBe(true);
      expect(state.canAccessBranch('usr-003', 'b2')).toBe(true);
      expect(state.canAccessBranch('usr-003', 'b3')).toBe(true);
    });

    it('สร้าง entry ใหม่ถ้า user ยังไม่มี', () => {
      const { grantBranchAccess } = useBranchPermissionStore.getState();
      grantBranchAccess('usr-new', ['b1']);

      const state = useBranchPermissionStore.getState();
      expect(state.canAccessBranch('usr-new', 'b1')).toBe(true);
      expect(state.canAccessBranch('usr-new', 'b2')).toBe(false);
    });
  });

  describe('revokeBranchAccess', () => {
    it('ลบสาขาออกจาก user', () => {
      const { revokeBranchAccess } = useBranchPermissionStore.getState();
      revokeBranchAccess('usr-002', ['b2']);

      const state = useBranchPermissionStore.getState();
      expect(state.canAccessBranch('usr-002', 'b1')).toBe(true);
      expect(state.canAccessBranch('usr-002', 'b2')).toBe(false);
    });
  });

  describe('setAllBranches', () => {
    it('เปลี่ยนให้ user เข้าถึงทุกสาขาได้', () => {
      const { setAllBranches } = useBranchPermissionStore.getState();
      setAllBranches('usr-003', true);

      const state = useBranchPermissionStore.getState();
      expect(state.canAccessBranch('usr-003', 'b99')).toBe(true);
    });
  });

  describe('setActiveBranch', () => {
    it('เปลี่ยน active branch ได้', () => {
      const { setActiveBranch } = useBranchPermissionStore.getState();
      setActiveBranch('b2');

      expect(useBranchPermissionStore.getState().activeBranchId).toBe('b2');
    });
  });
});
