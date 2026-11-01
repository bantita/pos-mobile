/**
 * Tests — memberStore + ประเภทสมาชิก: migration, addMember default type, search, กฎสะสมคะแนน,
 *         promoStore.validateCoupon จำกัดประเภทสมาชิก
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
// memberStore -> autoCouponTriggers -> featureFlags -> env -> expo-constants (native)
vi.mock('expo-constants', () => ({ default: { expoConfig: { extra: {} } } }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import { useMemberStore, migrateMembersToV1 } from '../memberStore';
import { useMemberTypeStore, updateMemberType } from '../memberTypeStore';
import { usePromoStore } from '../promoStore';
import { MOCK_MEMBER_TYPES, DEFAULT_MEMBER_TYPE_ID, STAFF_MEMBER_TYPE_ID } from '../../data/mockMemberTypes';
import { MOCK_MEMBERS, MOCK_POINT_CONFIG } from '../../data/mockMembers';
import { Member } from '../../types/member';
import { Promotion } from '../../types/promotion';

const baseMember = (over: Partial<Member>): Member => ({
  id: 'x', memberNo: 'MEM-1', phone: '000', name: 'ทดสอบ', level: 'member',
  pointBalance: 0, totalSpent: 0, joinDate: '2026-01-01', isActive: true,
  shopId: 'shop-01', branchId: 'b1', ...over,
});

beforeEach(() => {
  useMemberTypeStore.setState({ types: MOCK_MEMBER_TYPES.map(t => ({ ...t })) });
  useMemberStore.setState({
    members: MOCK_MEMBERS.map(m => ({ ...m })),
    selectedMember: null,
    pointTransactions: [],
    pointConfig: { ...MOCK_POINT_CONFIG },
  });
});

describe('migrateMembersToV1', () => {
  test('สมาชิกที่ไม่มีประเภทได้ ลูกค้าทั่วไป, ที่มีแล้วไม่เปลี่ยน', () => {
    const old = baseMember({ id: 'old' });
    const typed = baseMember({ id: 'typed', memberTypeId: STAFF_MEMBER_TYPE_ID, memberTypeName: 'พนักงาน' });
    const out = migrateMembersToV1({ members: [old, typed], selectedMember: old });
    expect(out.members![0].memberTypeId).toBe(DEFAULT_MEMBER_TYPE_ID);
    expect(out.members![0].memberTypeName).toBe('ลูกค้าทั่วไป');
    expect(out.members![1]).toBe(typed);
    expect(out.selectedMember!.memberTypeId).toBe(DEFAULT_MEMBER_TYPE_ID);
  });

  test('persist migrate เรียก migrateMembersToV1 เมื่อ fromVersion < 1', () => {
    const migrate = useMemberStore.persist.getOptions().migrate!;
    const out = migrate({ members: [baseMember({ id: 'old' })] }, 0) as { members: Member[] };
    expect(out.members[0].memberTypeId).toBe(DEFAULT_MEMBER_TYPE_ID);
    const blob = { members: [baseMember({ id: 'old' })] };
    expect(migrate(blob, 1)).toBe(blob);
  });
});

describe('addMember / updateMember / search', () => {
  test('addMember ไม่ระบุประเภท -> ลูกค้าทั่วไป', () => {
    const m = useMemberStore.getState().addMember({
      phone: '099', name: 'ใหม่', level: 'member', isActive: true, shopId: 'shop-01', branchId: 'b1',
    });
    expect(m.memberTypeId).toBe(DEFAULT_MEMBER_TYPE_ID);
    expect(m.memberTypeName).toBe('ลูกค้าทั่วไป');
  });

  test('addMember ระบุพนักงาน', () => {
    const m = useMemberStore.getState().addMember({
      phone: '098', name: 'พนง', level: 'member', isActive: true, shopId: 'shop-01', branchId: 'b1',
      memberTypeId: STAFF_MEMBER_TYPE_ID,
    });
    expect(m.memberTypeName).toBe('พนักงาน');
  });

  test('updateMember เปลี่ยนประเภท -> ชื่อประเภทอัปเดต', () => {
    useMemberStore.getState().updateMember('mem-001', { memberTypeId: STAFF_MEMBER_TYPE_ID });
    const m = useMemberStore.getState().getMemberById('mem-001')!;
    expect(m.memberTypeName).toBe('พนักงาน');
  });

  test('searchMembers("พนักงาน") พบสมาชิกประเภทพนักงาน', () => {
    const ids = useMemberStore.getState().searchMembers('พนักงาน').map(m => m.id).sort();
    expect(ids).toEqual(['mem-003', 'mem-008']);
  });
});

describe('earnPoints ตามประเภทสมาชิก', () => {
  const earnRate = MOCK_POINT_CONFIG.earnRate; // 25

  test('ประเภทเริ่มต้น = floor(amount / earnRate) เท่าเดิม', () => {
    const before = useMemberStore.getState().getMemberById('mem-001')!;
    const tx = useMemberStore.getState().earnPoints('mem-001', 1010, 'S1', 'test');
    expect(tx?.points).toBe(Math.floor(1010 / earnRate));
    const after = useMemberStore.getState().getMemberById('mem-001')!;
    expect(after.pointBalance).toBe(before.pointBalance + 40);
    expect(after.totalSpent).toBe(before.totalSpent + 1010);
  });

  test('earnPoints=false -> 0 คะแนน, ไม่มีรายการ, ยอดซื้อสะสมยังเพิ่ม', () => {
    updateMemberType(STAFF_MEMBER_TYPE_ID, { earnPoints: false });
    const before = useMemberStore.getState().getMemberById('mem-003')!;
    const tx = useMemberStore.getState().earnPoints('mem-003', 1000, 'S2', 'test');
    expect(tx).toBeNull();
    const after = useMemberStore.getState().getMemberById('mem-003')!;
    expect(after.pointBalance).toBe(before.pointBalance);
    expect(after.totalSpent).toBe(before.totalSpent + 1000);
    expect(useMemberStore.getState().pointTransactions).toHaveLength(0);
  });

  test('pointMultiplier 2 -> คะแนน x2', () => {
    updateMemberType(STAFF_MEMBER_TYPE_ID, { pointMultiplier: 2 });
    const tx = useMemberStore.getState().earnPoints('mem-003', 1000, 'S3', 'test');
    expect(tx?.points).toBe(80);
  });

  test('ประเภทปิดใช้งาน -> ใช้กฎของประเภทเริ่มต้น', () => {
    updateMemberType(STAFF_MEMBER_TYPE_ID, { earnPoints: false });
    updateMemberType(STAFF_MEMBER_TYPE_ID, { status: 'inactive' });
    const tx = useMemberStore.getState().earnPoints('mem-003', 1000, 'S4', 'test');
    expect(tx?.points).toBe(40);
  });
});

describe('promoStore.validateCoupon — จำกัดประเภทสมาชิก', () => {
  const coupon: Promotion = {
    id: 'cp-staff', promoCode: 'STAFF10', name: 'คูปองพนักงาน', description: '', type: 'coupon',
    status: 'active', startDate: '2020-01-01', endDate: '2099-12-31', couponCode: 'STAFF10',
    discountAmount: 10, applicableMemberTypeIds: [STAFF_MEMBER_TYPE_ID], stackable: false, priority: 5,
    usageCount: 0, totalDiscountGiven: 0, createdAt: '2020-01-01', createdBy: 'test', shopId: 'shop-01',
  };

  beforeEach(() => {
    usePromoStore.setState({ promotions: [coupon] });
  });

  test('ประเภทตรง -> ใช้ได้', () => {
    expect(usePromoStore.getState().validateCoupon('STAFF10', 100, 'member', STAFF_MEMBER_TYPE_ID).valid).toBe(true);
  });
  test('ประเภทไม่ตรง / ไม่มีสมาชิก -> ใช้ไม่ได้', () => {
    const r = usePromoStore.getState().validateCoupon('STAFF10', 100, 'member', DEFAULT_MEMBER_TYPE_ID);
    expect(r).toEqual({ valid: false, error: 'คูปองนี้ใช้ได้เฉพาะประเภทสมาชิกที่กำหนด' });
    expect(usePromoStore.getState().validateCoupon('STAFF10', 100).valid).toBe(false);
  });
});
