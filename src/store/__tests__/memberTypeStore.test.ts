/**
 * Tests — memberTypeStore (ประเภทสมาชิก): CRUD, default เดียว, กันลบเมื่อมีสมาชิกใช้, invariants
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
// memberStore -> autoCouponTriggers -> featureFlags -> env -> expo-constants (native)
vi.mock('expo-constants', () => ({ default: { expoConfig: { extra: {} } } }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import {
  useMemberTypeStore,
  addMemberType,
  updateMemberType,
  setDefaultMemberType,
  deleteMemberType,
  reassignAndDeleteMemberType,
  validateMemberTypeInput,
  ensureMemberTypeInvariants,
  getDefaultMemberType,
  getMemberTypeCounts,
  resolveMemberType,
  MemberTypeInput,
} from '../memberTypeStore';
import { useMemberStore } from '../memberStore';
import { MOCK_MEMBER_TYPES, DEFAULT_MEMBER_TYPE_ID, STAFF_MEMBER_TYPE_ID } from '../../data/mockMemberTypes';
import { MOCK_MEMBERS } from '../../data/mockMembers';
import { MemberType } from '../../types/memberType';

const input = (over?: Partial<MemberTypeInput>): MemberTypeInput => ({
  name: 'วีไอพีพิเศษ',
  color: 'purple',
  discountPercent: 5,
  earnPoints: true,
  pointMultiplier: 2,
  ...over,
});

const defaults = () => useMemberTypeStore.getState().types.filter(t => t.isDefault);

beforeEach(() => {
  useMemberTypeStore.setState({ types: MOCK_MEMBER_TYPES.map(t => ({ ...t })) });
  useMemberStore.setState({ members: MOCK_MEMBERS.map(m => ({ ...m })), selectedMember: null });
});

describe('seed', () => {
  test('มี ลูกค้าทั่วไป (default) และ พนักงาน', () => {
    const types = useMemberTypeStore.getState().types;
    expect(types.map(t => t.name)).toEqual(['ลูกค้าทั่วไป', 'พนักงาน']);
    expect(getDefaultMemberType().id).toBe(DEFAULT_MEMBER_TYPE_ID);
    const staff = types.find(t => t.id === STAFF_MEMBER_TYPE_ID)!;
    expect(staff.discountPercent).toBe(0);
    expect(staff.earnPoints).toBe(true);
  });

  test('mock members: mem-003, mem-008 เป็นพนักงาน', () => {
    const counts = getMemberTypeCounts();
    expect(counts[STAFF_MEMBER_TYPE_ID]).toBe(2);
    expect(counts[DEFAULT_MEMBER_TYPE_ID]).toBe(MOCK_MEMBERS.length - 2);
  });
});

describe('validate', () => {
  test.each([
    [{ name: '  ' }, 'กรุณากรอกชื่อประเภทสมาชิก'],
    [{ name: 'พนักงาน' }, 'ชื่อประเภทสมาชิกซ้ำกับที่มีอยู่แล้ว'],
    [{ discountPercent: 101 }, 'ส่วนลดต้องอยู่ระหว่าง 0 ถึง 100%'],
    [{ discountPercent: -1 }, 'ส่วนลดต้องอยู่ระหว่าง 0 ถึง 100%'],
    [{ pointMultiplier: 0 }, 'ตัวคูณคะแนนต้องมากกว่า 0 และไม่เกิน 10'],
    [{ pointMultiplier: 11 }, 'ตัวคูณคะแนนต้องมากกว่า 0 และไม่เกิน 10'],
  ])('%o -> %s', (over, msg) => {
    expect(validateMemberTypeInput(input(over))).toBe(msg);
    expect(addMemberType(input(over))).toEqual({ ok: false, error: msg });
  });

  test('ชื่อเดิมของตัวเองไม่ถือว่าซ้ำตอนแก้ไข', () => {
    expect(validateMemberTypeInput({ name: 'พนักงาน', discountPercent: 10, pointMultiplier: 1 }, STAFF_MEMBER_TYPE_ID)).toBeNull();
  });
});

describe('add / update', () => {
  test('เพิ่มประเภทใหม่', () => {
    const res = addMemberType(input());
    expect(res.ok).toBe(true);
    expect(useMemberTypeStore.getState().types).toHaveLength(3);
    expect(defaults()).toHaveLength(1);
  });

  test('เพิ่มประเภทใหม่เป็น default -> default เดิมถูกยกเลิก', () => {
    const res = addMemberType(input({ isDefault: true }));
    expect(res.ok).toBe(true);
    expect(defaults()).toHaveLength(1);
    expect(defaults()[0].name).toBe('วีไอพีพิเศษ');
  });

  test('แก้ไขส่วนลดพนักงาน 10% + ไม่สะสมแต้ม', () => {
    const res = updateMemberType(STAFF_MEMBER_TYPE_ID, { discountPercent: 10, earnPoints: false });
    expect(res.ok).toBe(true);
    const staff = useMemberTypeStore.getState().types.find(t => t.id === STAFF_MEMBER_TYPE_ID)!;
    expect(staff.discountPercent).toBe(10);
    expect(staff.earnPoints).toBe(false);
  });

  test('เปลี่ยนชื่อ -> memberTypeName ของสมาชิกถูกอัปเดต', () => {
    updateMemberType(STAFF_MEMBER_TYPE_ID, { name: 'พนักงานร้าน' });
    const m = useMemberStore.getState().members.find(x => x.id === 'mem-003')!;
    expect(m.memberTypeName).toBe('พนักงานร้าน');
  });

  test('ปิดใช้งานประเภทเริ่มต้นไม่ได้', () => {
    const res = updateMemberType(DEFAULT_MEMBER_TYPE_ID, { status: 'inactive' });
    expect(res.ok).toBe(false);
    expect(getDefaultMemberType().status).toBe('active');
  });

  test('ยกเลิก isDefault ตรงๆ ไม่ได้ (ต้องมี default 1 ประเภท)', () => {
    const res = updateMemberType(DEFAULT_MEMBER_TYPE_ID, { isDefault: false });
    expect(res.ok).toBe(false);
    expect(defaults()).toHaveLength(1);
  });
});

describe('default', () => {
  test('setDefaultMemberType -> มี default เดียว', () => {
    expect(setDefaultMemberType(STAFF_MEMBER_TYPE_ID).ok).toBe(true);
    expect(defaults().map(t => t.id)).toEqual([STAFF_MEMBER_TYPE_ID]);
  });

  test('ตั้งประเภทที่ปิดใช้งานเป็น default ไม่ได้', () => {
    updateMemberType(STAFF_MEMBER_TYPE_ID, { status: 'inactive' });
    expect(setDefaultMemberType(STAFF_MEMBER_TYPE_ID).ok).toBe(false);
    expect(getDefaultMemberType().id).toBe(DEFAULT_MEMBER_TYPE_ID);
  });
});

describe('delete', () => {
  test('ลบประเภทเริ่มต้นไม่ได้', () => {
    const res = deleteMemberType(DEFAULT_MEMBER_TYPE_ID);
    expect(res).toEqual({ ok: false, error: 'ไม่สามารถลบประเภทเริ่มต้นได้' });
  });

  test('ลบประเภทที่มีสมาชิกใช้อยู่ไม่ได้ + คืนจำนวนสมาชิก', () => {
    const res = deleteMemberType(STAFF_MEMBER_TYPE_ID);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.memberCount).toBe(2);
      expect(res.error).toContain('มีสมาชิก 2 คน');
    }
    expect(useMemberTypeStore.getState().types).toHaveLength(2);
  });

  test('ลบประเภทที่ไม่มีสมาชิกได้', () => {
    const add = addMemberType(input());
    const id = add.ok ? add.type!.id : '';
    expect(deleteMemberType(id).ok).toBe(true);
    expect(useMemberTypeStore.getState().types).toHaveLength(2);
  });

  test('reassignAndDeleteMemberType ย้ายสมาชิกแล้วลบ', () => {
    const res = reassignAndDeleteMemberType(STAFF_MEMBER_TYPE_ID, DEFAULT_MEMBER_TYPE_ID);
    expect(res.ok).toBe(true);
    expect(useMemberTypeStore.getState().types.map(t => t.id)).toEqual([DEFAULT_MEMBER_TYPE_ID]);
    const m = useMemberStore.getState().members.find(x => x.id === 'mem-003')!;
    expect(m.memberTypeId).toBe(DEFAULT_MEMBER_TYPE_ID);
    expect(m.memberTypeName).toBe('ลูกค้าทั่วไป');
  });

  test('reassign ไปประเภทเดียวกัน / ไม่มีอยู่ ไม่ได้', () => {
    expect(reassignAndDeleteMemberType(STAFF_MEMBER_TYPE_ID, STAFF_MEMBER_TYPE_ID).ok).toBe(false);
    expect(reassignAndDeleteMemberType(STAFF_MEMBER_TYPE_ID, 'nope').ok).toBe(false);
  });
});

describe('resolveMemberType', () => {
  test('ประเภทปิดใช้งาน -> ใช้ประเภทเริ่มต้น', () => {
    updateMemberType(STAFF_MEMBER_TYPE_ID, { status: 'inactive' });
    expect(resolveMemberType({ memberTypeId: STAFF_MEMBER_TYPE_ID })?.id).toBe(DEFAULT_MEMBER_TYPE_ID);
  });
  test('ไม่มี/ไม่พบประเภท -> ประเภทเริ่มต้น, ไม่มีสมาชิก -> null', () => {
    expect(resolveMemberType({})?.id).toBe(DEFAULT_MEMBER_TYPE_ID);
    expect(resolveMemberType({ memberTypeId: 'ghost' })?.id).toBe(DEFAULT_MEMBER_TYPE_ID);
    expect(resolveMemberType(null)).toBeNull();
  });
});

describe('ensureMemberTypeInvariants', () => {
  const mk = (id: string, over?: Partial<MemberType>): MemberType => ({
    ...MOCK_MEMBER_TYPES[1], id, name: id, isDefault: false, ...over,
  });

  test('รายการว่าง -> seed', () => {
    expect(ensureMemberTypeInvariants([]).map(t => t.id)).toEqual(MOCK_MEMBER_TYPES.map(t => t.id));
    expect(ensureMemberTypeInvariants(undefined)).toHaveLength(2);
  });
  test('ไม่มี default -> ประเภท active ตัวแรกเป็น default', () => {
    const out = ensureMemberTypeInvariants([mk('a', { status: 'inactive' }), mk('b'), mk('c')]);
    expect(out.filter(t => t.isDefault).map(t => t.id)).toEqual(['b']);
  });
  test('default 2 ตัว -> เหลือตัวแรก', () => {
    const out = ensureMemberTypeInvariants([mk('a', { isDefault: true }), mk('b', { isDefault: true })]);
    expect(out.filter(t => t.isDefault).map(t => t.id)).toEqual(['a']);
  });
  test('ถูกต้องอยู่แล้ว -> คืน reference เดิม', () => {
    const list = [mk('a', { isDefault: true }), mk('b')];
    expect(ensureMemberTypeInvariants(list)).toBe(list);
  });
});
