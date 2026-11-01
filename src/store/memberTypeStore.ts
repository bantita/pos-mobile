/**
 * Member Type Store — ประเภทสมาชิก (ลูกค้าทั่วไป / พนักงาน ฯลฯ) master CRUD
 * Zustand + Persist — function-API house style (see categoryStore.ts / brandStore.ts)
 *
 * ประเภทสมาชิก "แยก" จากระดับสมาชิก (MemberLevel): ระดับคือ tier ตามยอดซื้อ (auto-upgrade)
 * ส่วนประเภทคือกลุ่มที่ร้านกำหนดเอง พร้อมสิทธิ์ ส่วนลด % / สะสมคะแนน / ตัวคูณคะแนน
 *
 * Store topology (cycle-safe): memberTypeStore <-> memberStore import กันและกัน
 * แต่ไม่มีโค้ด top-level ฝั่งใดเรียกใช้อีกฝั่ง (เรียกเฉพาะภายในฟังก์ชัน) — แพทเทิร์นเดียวกับ categoryStore -> productStore
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MemberType, MemberTypeStatus } from '../types/memberType';
import { Member } from '../types/member';
import { persistStorage } from './persistStorage';
import { MOCK_MEMBER_TYPES, DEFAULT_MEMBER_TYPE_ID } from '../data/mockMemberTypes';
import { useMemberStore } from './memberStore';
import { logAction } from './auditLogStore';

const MODULE = 'ประเภทสมาชิก';
/** ตัวคูณคะแนนสูงสุดที่อนุญาต */
export const MAX_POINT_MULTIPLIER = 10;

interface MemberTypeState {
  types: MemberType[];
}

/** ผลลัพธ์ของการแก้ไขข้อมูล (ไม่ throw — ให้หน้าจอแสดง error เอง) */
export type MemberTypeResult =
  | { ok: true; type?: MemberType }
  | { ok: false; error: string; memberCount?: number };

/** ข้อมูลสำหรับสร้างประเภทใหม่ */
export type MemberTypeInput = Omit<MemberType, 'id' | 'createdAt' | 'updatedAt' | 'isDefault' | 'status'> & {
  isDefault?: boolean;
  status?: MemberTypeStatus;
};

const seed = (): MemberType[] => MOCK_MEMBER_TYPES.map(t => ({ ...t }));

/**
 * บังคับกฎของรายการประเภท (ใช้ตอน rehydrate):
 * - ว่าง -> seed ใหม่
 * - ต้องมีประเภทเริ่มต้น 1 ประเภทพอดี และต้อง active
 *   (เก็บ default ที่ active ตัวแรก / ถ้าไม่มี ใช้ประเภท active ตัวแรก / ถ้าไม่มี active เลย เปิดตัวแรก)
 */
export function ensureMemberTypeInvariants(types: MemberType[] | undefined | null): MemberType[] {
  if (!Array.isArray(types) || types.length === 0) return seed();
  const activeDefaults = types.filter(t => t.isDefault && t.status === 'active');
  const allDefaults = types.filter(t => t.isDefault);
  if (activeDefaults.length === 1 && allDefaults.length === 1) return types;
  const keep = activeDefaults[0] ?? types.find(t => t.status === 'active') ?? types[0];
  return types.map(t => (
    t.id === keep.id
      ? { ...t, isDefault: true, status: 'active' as const }
      : (t.isDefault ? { ...t, isDefault: false } : t)
  ));
}

export const useMemberTypeStore = create<MemberTypeState>()(
  persist(
    () => ({
      // ประเภทสมาชิกเป็นค่าตั้งค่า (configuration) — seed เสมอ แม้เป็นร้านใหม่ (isFreshStore)
      types: seed(),
    }),
    {
      name: 'pos-member-types',
      version: 1,
      storage: createJSONStorage(() => persistStorage),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<MemberTypeState>;
        return { ...current, ...p, types: ensureMemberTypeInvariants(p.types ?? current.types) };
      },
    }
  )
);

// ─── Queries ──────────────────────────────────────────────────────────────────
export function getMemberTypes(): MemberType[] { return [...useMemberTypeStore.getState().types]; }
export function getActiveMemberTypes(): MemberType[] {
  return useMemberTypeStore.getState().types.filter(t => t.status === 'active');
}
export function getMemberType(id: string | undefined | null): MemberType | undefined {
  if (!id) return undefined;
  return useMemberTypeStore.getState().types.find(t => t.id === id);
}
/** ประเภทเริ่มต้น (มีเสมอ — fallback เป็น seed ถ้าข้อมูลเสีย) */
export function getDefaultMemberType(): MemberType {
  const types = useMemberTypeStore.getState().types;
  return types.find(t => t.isDefault && t.status === 'active')
    ?? types.find(t => t.isDefault)
    ?? types.find(t => t.status === 'active')
    ?? MOCK_MEMBER_TYPES[0];
}

/**
 * ประเภทที่ใช้คำนวณสิทธิ์ตอนขาย: ประเภทของสมาชิก (ถ้ามีและเปิดใช้งาน) ไม่เช่นนั้นใช้ประเภทเริ่มต้น
 * คืน null เมื่อไม่มีสมาชิก (ลูกค้า walk-in)
 */
export function resolveMemberType(member: Pick<Member, 'memberTypeId'> | null | undefined): MemberType | null {
  if (!member) return null;
  const own = getMemberType(member.memberTypeId);
  if (own && own.status === 'active') return own;
  return getDefaultMemberType();
}

/** id ของประเภทที่สมาชิกสังกัด (ไม่มี/ไม่พบ -> ประเภทเริ่มต้น) */
function memberTypeIdOf(member: Pick<Member, 'memberTypeId'>, types: MemberType[], defaultId: string): string {
  return member.memberTypeId && types.some(t => t.id === member.memberTypeId) ? member.memberTypeId : defaultId;
}

/** จำนวนสมาชิกต่อประเภท (สด จาก memberStore) */
export function getMemberTypeCounts(members?: Pick<Member, 'memberTypeId'>[]): Record<string, number> {
  const types = useMemberTypeStore.getState().types;
  const defaultId = getDefaultMemberType().id;
  const list = members ?? useMemberStore.getState().members;
  const counts: Record<string, number> = {};
  types.forEach(t => { counts[t.id] = 0; });
  list.forEach(m => {
    const id = memberTypeIdOf(m, types, defaultId);
    counts[id] = (counts[id] ?? 0) + 1;
  });
  return counts;
}
export function getMemberTypeMemberCount(id: string): number {
  return getMemberTypeCounts()[id] ?? 0;
}

// ─── Validation ───────────────────────────────────────────────────────────────
/** ตรวจข้อมูลประเภท — คืนข้อความ error ภาษาไทย หรือ null ถ้าถูกต้อง */
export function validateMemberTypeInput(
  data: Pick<MemberType, 'name' | 'discountPercent' | 'pointMultiplier'>,
  excludeId?: string
): string | null {
  const name = (data.name ?? '').trim();
  if (!name) return 'กรุณากรอกชื่อประเภทสมาชิก';
  const dup = useMemberTypeStore.getState().types.some(
    t => t.id !== excludeId && t.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (dup) return 'ชื่อประเภทสมาชิกซ้ำกับที่มีอยู่แล้ว';
  if (!Number.isFinite(data.discountPercent) || data.discountPercent < 0 || data.discountPercent > 100) {
    return 'ส่วนลดต้องอยู่ระหว่าง 0 ถึง 100%';
  }
  if (!Number.isFinite(data.pointMultiplier) || data.pointMultiplier <= 0 || data.pointMultiplier > MAX_POINT_MULTIPLIER) {
    return `ตัวคูณคะแนนต้องมากกว่า 0 และไม่เกิน ${MAX_POINT_MULTIPLIER}`;
  }
  return null;
}

// ─── Mutations ────────────────────────────────────────────────────────────────
/** อัปเดตชื่อประเภท (snapshot) ในสมาชิกทุกคนที่ใช้ประเภทนี้ */
function propagateTypeName(typeId: string, name: string): void {
  useMemberStore.setState(s => ({
    members: s.members.map(m => (m.memberTypeId === typeId ? { ...m, memberTypeName: name } : m)),
    selectedMember: s.selectedMember && s.selectedMember.memberTypeId === typeId
      ? { ...s.selectedMember, memberTypeName: name }
      : s.selectedMember,
  }));
}

export function addMemberType(data: MemberTypeInput): MemberTypeResult {
  const error = validateMemberTypeInput(data);
  if (error) return { ok: false, error };
  const status: MemberTypeStatus = data.status ?? 'active';
  const isDefault = data.isDefault === true;
  if (isDefault && status !== 'active') return { ok: false, error: 'ประเภทเริ่มต้นต้องเปิดใช้งาน' };
  const now = new Date().toISOString();
  const type: MemberType = {
    id: `mt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: data.name.trim(),
    description: data.description?.trim() || undefined,
    color: data.color,
    discountPercent: data.discountPercent,
    earnPoints: data.earnPoints,
    pointMultiplier: data.pointMultiplier,
    isDefault,
    status,
    createdAt: now,
    updatedAt: now,
  };
  useMemberTypeStore.setState(s => ({
    types: [...(isDefault ? s.types.map(t => ({ ...t, isDefault: false })) : s.types), type],
  }));
  logAction(MODULE, 'เพิ่ม', `เพิ่มประเภทสมาชิก "${type.name}"`, { memberTypeId: type.id });
  return { ok: true, type };
}

export function updateMemberType(id: string, updates: Partial<Omit<MemberType, 'id' | 'createdAt'>>): MemberTypeResult {
  const existing = getMemberType(id);
  if (!existing) return { ok: false, error: 'ไม่พบประเภทสมาชิก' };
  const merged: MemberType = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
  merged.name = merged.name.trim();
  merged.description = merged.description?.trim() || undefined;
  const error = validateMemberTypeInput(merged, id);
  if (error) return { ok: false, error };
  if (existing.isDefault && updates.isDefault === false) {
    return { ok: false, error: 'ต้องมีประเภทเริ่มต้น 1 ประเภท — กรุณาตั้งประเภทอื่นเป็นค่าเริ่มต้นแทน' };
  }
  if (merged.isDefault && merged.status !== 'active') {
    return { ok: false, error: 'ไม่สามารถปิดใช้งานประเภทเริ่มต้นได้' };
  }
  const becomesDefault = !existing.isDefault && merged.isDefault;
  useMemberTypeStore.setState(s => ({
    types: s.types.map(t => {
      if (t.id === id) return merged;
      return becomesDefault && t.isDefault ? { ...t, isDefault: false } : t;
    }),
  }));
  if (merged.name !== existing.name) propagateTypeName(id, merged.name);
  logAction(MODULE, 'แก้ไข', `แก้ไขประเภทสมาชิก "${merged.name}"`, { memberTypeId: id, changes: updates });
  return { ok: true, type: merged };
}

export function setDefaultMemberType(id: string): MemberTypeResult {
  const target = getMemberType(id);
  if (!target) return { ok: false, error: 'ไม่พบประเภทสมาชิก' };
  if (target.status !== 'active') return { ok: false, error: 'ประเภทที่ปิดใช้งานไม่สามารถเป็นค่าเริ่มต้นได้' };
  useMemberTypeStore.setState(s => ({
    types: s.types.map(t => ({ ...t, isDefault: t.id === id })),
  }));
  logAction(MODULE, 'ตั้งค่าเริ่มต้น', `ตั้ง "${target.name}" เป็นประเภทเริ่มต้น`, { memberTypeId: id });
  return { ok: true, type: { ...target, isDefault: true } };
}

export function deleteMemberType(id: string): MemberTypeResult {
  const target = getMemberType(id);
  if (!target) return { ok: false, error: 'ไม่พบประเภทสมาชิก' };
  if (target.isDefault) return { ok: false, error: 'ไม่สามารถลบประเภทเริ่มต้นได้' };
  const memberCount = getMemberTypeMemberCount(id);
  if (memberCount > 0) {
    return {
      ok: false,
      error: `มีสมาชิก ${memberCount} คนใช้ประเภทนี้อยู่ กรุณาย้ายไปประเภทอื่นก่อนลบ`,
      memberCount,
    };
  }
  useMemberTypeStore.setState(s => ({ types: s.types.filter(t => t.id !== id) }));
  logAction(MODULE, 'ลบ', `ลบประเภทสมาชิก "${target.name}"`, { memberTypeId: id });
  return { ok: true };
}

/** ย้ายสมาชิกทั้งหมดของประเภท id ไปยัง targetId แล้วลบประเภท id */
export function reassignAndDeleteMemberType(id: string, targetId: string): MemberTypeResult {
  const source = getMemberType(id);
  if (!source) return { ok: false, error: 'ไม่พบประเภทสมาชิก' };
  if (source.isDefault) return { ok: false, error: 'ไม่สามารถลบประเภทเริ่มต้นได้' };
  const target = getMemberType(targetId);
  if (!target || target.id === id) return { ok: false, error: 'กรุณาเลือกประเภทปลายทางที่ต่างจากประเภทที่จะลบ' };
  if (target.status !== 'active') return { ok: false, error: 'ประเภทปลายทางต้องเปิดใช้งาน' };
  const moved = getMemberTypeMemberCount(id);
  useMemberStore.setState(s => ({
    members: s.members.map(m => (
      m.memberTypeId === id ? { ...m, memberTypeId: target.id, memberTypeName: target.name } : m
    )),
    selectedMember: s.selectedMember && s.selectedMember.memberTypeId === id
      ? { ...s.selectedMember, memberTypeId: target.id, memberTypeName: target.name }
      : s.selectedMember,
  }));
  logAction(MODULE, 'ย้ายสมาชิก', `ย้ายสมาชิก ${moved} คนจาก "${source.name}" ไป "${target.name}"`, {
    fromMemberTypeId: id, toMemberTypeId: target.id, count: moved,
  });
  useMemberTypeStore.setState(s => ({ types: s.types.filter(t => t.id !== id) }));
  logAction(MODULE, 'ลบ', `ลบประเภทสมาชิก "${source.name}"`, { memberTypeId: id });
  return { ok: true };
}

export { DEFAULT_MEMBER_TYPE_ID };
