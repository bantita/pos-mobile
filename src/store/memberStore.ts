/**
 * Member Store — Zustand
 * M06 CRM & Loyalty
 *
 * Store topology (cycle-safe): memberStore <-> memberTypeStore import กันและกัน
 * ฟังก์ชันของ memberTypeStore ถูกเรียกเฉพาะภายใน action (ไม่มีโค้ด top-level เรียกใช้)
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Member, PointTransaction, PointConfig, MemberLevel, MemberLevelConfig } from '../types/member';
import { MOCK_MEMBERS, MOCK_POINT_TRANSACTIONS, MOCK_POINT_CONFIG, MOCK_LEVEL_CONFIGS } from '../data/mockMembers';
import { DEFAULT_MEMBER_TYPE_ID, DEFAULT_MEMBER_TYPE_NAME } from '../data/mockMemberTypes';
import { getDefaultMemberType, getMemberType, resolveMemberType } from './memberTypeStore';
import { calcEarnedPoints } from '../utils/memberTypeBenefits';
import { logAction } from './auditLogStore';
import { isFreshStore } from './freshStore';
import { persistStorage } from './persistStorage';
import {
  triggerWelcomeCoupon,
  triggerLevelUpReward,
  triggerBirthdayCoupon,
  triggerWinBackCoupon,
} from '../services/autoCouponTriggers';

// ลำดับระดับสมาชิก ใช้ตรวจว่าเป็นการ "เลื่อนขึ้น" จริง (2H level-up trigger)
const LEVEL_ORDER: MemberLevel[] = ['member', 'silver', 'gold', 'platinum', 'vip'];

// ─── Helper ───────────────────────────────────────────────────────────────────
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const genMemberNo = () => 'MEM-' + Math.floor(100000 + Math.random() * 900000).toString();

/** กำหนดประเภทเริ่มต้น (ลูกค้าทั่วไป) ให้สมาชิกที่ยังไม่มีประเภท */
function withDefaultType(m: Member): Member {
  return m.memberTypeId
    ? m
    : { ...m, memberTypeId: DEFAULT_MEMBER_TYPE_ID, memberTypeName: DEFAULT_MEMBER_TYPE_NAME };
}

/**
 * Migration v0 -> v1: สมาชิกที่บันทึกไว้ก่อนมีประเภทสมาชิก จะได้ประเภท "ลูกค้าทั่วไป"
 * สมาชิกที่มีประเภทอยู่แล้วไม่ถูกแตะต้อง
 */
export function migrateMembersToV1<T extends { members?: Member[]; selectedMember?: Member | null }>(state: T): T {
  if (!state || typeof state !== 'object') return state;
  return {
    ...state,
    ...(Array.isArray(state.members) ? { members: state.members.map(withDefaultType) } : {}),
    ...(state.selectedMember ? { selectedMember: withDefaultType(state.selectedMember) } : {}),
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────
interface MemberStore {
  members: Member[];
  selectedMember: Member | null;
  pointTransactions: PointTransaction[];
  pointConfig: PointConfig;
  /** ตั้งค่าระดับสมาชิก (threshold/ส่วนลด/ตัวคูณคะแนน) — แก้ได้จากหน้า CRM config */
  levelConfigs: MemberLevelConfig[];

  // Actions
  searchMembers: (keyword: string) => Member[];
  /** 3B: อัปเดตการตั้งค่าคะแนน (earn/redeem/min/expire) */
  setPointConfig: (config: Partial<PointConfig>) => void;
  /** 3B: อัปเดตการตั้งค่าระดับสมาชิกทั้งชุด */
  setLevelConfigs: (configs: MemberLevelConfig[]) => void;
  /** 3B: อัปเดตระดับเดียวตาม level key */
  updateLevelConfig: (level: MemberLevel, data: Partial<MemberLevelConfig>) => void;
  addMember: (data: Omit<Member, 'id' | 'memberNo' | 'pointBalance' | 'totalSpent' | 'joinDate'>) => Member;
  updateMember: (id: string, data: Partial<Member>) => void;
  selectMember: (member: Member | null) => void;
  /** สะสมคะแนนตามกฎของประเภทสมาชิก — คืน null เมื่อประเภทไม่ได้รับคะแนน (ยอดซื้อสะสมยังเพิ่มตามปกติ) */
  earnPoints: (memberId: string, saleAmount: number, saleNo: string, createdBy: string) => PointTransaction | null;
  redeemPoints: (memberId: string, points: number, saleNo: string, createdBy: string) => PointTransaction;
  getPointHistory: (memberId: string) => PointTransaction[];
  getMemberById: (id: string) => Member | undefined;
  /** 2H: สแกนสมาชิกทั้งหมด แล้วยิง trigger ตามเงื่อนไข (win-back 30 วัน + วันเกิด) — idempotent */
  runScheduledAutoCoupons: () => void;
}

export const useMemberStore = create<MemberStore>()(
  persist(
    (set, get) => ({
  members: isFreshStore() ? [] : MOCK_MEMBERS,
  selectedMember: null,
  pointTransactions: isFreshStore() ? [] : MOCK_POINT_TRANSACTIONS,
  pointConfig: MOCK_POINT_CONFIG,
  levelConfigs: MOCK_LEVEL_CONFIGS,

  setPointConfig: (config) => {
    set(s => ({ pointConfig: { ...s.pointConfig, ...config } }));
    logAction('CRM', 'ตั้งค่าคะแนน', 'อัปเดตการตั้งค่าระบบคะแนนสะสม', { config });
  },

  setLevelConfigs: (configs) => {
    set({ levelConfigs: configs });
    logAction('CRM', 'ตั้งค่าระดับสมาชิก', 'อัปเดตการตั้งค่าระดับสมาชิก', { count: configs.length });
  },

  updateLevelConfig: (level, data) => {
    set(s => ({
      levelConfigs: s.levelConfigs.map(c => c.level === level ? { ...c, ...data } : c),
    }));
    logAction('CRM', 'ตั้งค่าระดับสมาชิก', `แก้ไขระดับ ${level}`, { level, changes: data });
  },

  searchMembers: (keyword) => {
    const k = keyword.toLowerCase().trim();
    if (!k) return get().members;
    return get().members.filter(m =>
      m.name.toLowerCase().includes(k) ||
      m.phone.includes(k) ||
      m.memberNo.toLowerCase().includes(k) ||
      (m.memberTypeName ?? '').toLowerCase().includes(k)
    );
  },

  addMember: (data) => {
    const type = getMemberType(data.memberTypeId) ?? getDefaultMemberType();
    const newMember: Member = {
      ...data,
      memberTypeId: type.id,
      memberTypeName: type.name,
      id: genId(),
      memberNo: genMemberNo(),
      pointBalance: 0,
      totalSpent: 0,
      joinDate: new Date().toISOString(),
    };
    set(s => ({ members: [...s.members, newMember] }));
    logAction('CRM', 'เพิ่มสมาชิก', `เพิ่มสมาชิก ${newMember.name} (${newMember.memberNo})`, { memberId: newMember.id, phone: newMember.phone });
    // 2H: สมาชิกใหม่ -> คูปองต้อนรับ (+ คูปองวันเกิดถ้าสมัครตรงวันเกิด) — idempotent ในตัว trigger
    triggerWelcomeCoupon(newMember);
    triggerBirthdayCoupon(newMember);
    return newMember;
  },

  updateMember: (id, input) => {
    const member = get().members.find(m => m.id === id);
    let data = input;
    // เปลี่ยนประเภทสมาชิก -> อัปเดตชื่อประเภท (snapshot) ให้ตรงกัน
    if (input.memberTypeId && input.memberTypeId !== member?.memberTypeId) {
      const type = getMemberType(input.memberTypeId);
      if (type) {
        data = { ...input, memberTypeName: type.name };
        logAction('CRM', 'เปลี่ยนประเภทสมาชิก', `เปลี่ยนประเภท ${member?.name || id} เป็น ${type.name}`, {
          memberId: id, from: member?.memberTypeId, to: type.id,
        });
      }
    }
    set(s => ({
      members: s.members.map(m => m.id === id ? { ...m, ...data } : m),
      selectedMember: s.selectedMember?.id === id
        ? { ...s.selectedMember, ...data }
        : s.selectedMember,
    }));
    logAction('CRM', 'แก้ไขสมาชิก', `แก้ไขข้อมูล ${member?.name || id}`, { memberId: id, changes: data });
    // 2H: ตรวจการเลื่อนระดับ (level-up) -> ของรางวัลเลื่อนระดับ
    if (member && data.level && data.level !== member.level) {
      const prevIdx = LEVEL_ORDER.indexOf(member.level);
      const nextIdx = LEVEL_ORDER.indexOf(data.level);
      if (nextIdx > prevIdx) {
        const updated = get().members.find(m => m.id === id);
        if (updated) triggerLevelUpReward(updated, data.level);
      }
    }
  },

  selectMember: (member) => set({ selectedMember: member }),

  earnPoints: (memberId, saleAmount, saleNo, createdBy) => {
    const { pointConfig } = get();
    const member = get().members.find(m => m.id === memberId);
    // กฎคะแนนตามประเภทสมาชิก (ประเภทค่าเริ่มต้น earn=true ×1 => เท่าเดิม floor(amount/earnRate))
    const memberType = member ? resolveMemberType(member) : null;
    const points = calcEarnedPoints(saleAmount, pointConfig.earnRate, memberType);
    const newBalance = (member?.pointBalance ?? 0) + points;

    if (memberType && memberType.earnPoints === false) {
      // ประเภทที่ไม่ได้รับคะแนน: เพิ่มยอดซื้อสะสม (ใช้เลื่อนระดับ) แต่ไม่สร้างรายการคะแนน
      set(s => ({
        members: s.members.map(m =>
          m.id === memberId ? { ...m, totalSpent: m.totalSpent + saleAmount } : m
        ),
      }));
      return null;
    }

    // Update member balance & totalSpent
    set(s => ({
      members: s.members.map(m =>
        m.id === memberId
          ? { ...m, pointBalance: newBalance, totalSpent: m.totalSpent + saleAmount }
          : m
      ),
    }));

    const transaction: PointTransaction = {
      id: genId(),
      memberId,
      type: 'earn',
      points,
      balanceAfter: newBalance,
      refType: 'sale',
      refNo: saleNo,
      description: `สะสมคะแนนจากยอดซื้อ ${saleAmount.toLocaleString()} บาท`,
      expireDate: pointConfig.pointExpireDays > 0
        ? new Date(Date.now() + pointConfig.pointExpireDays * 86400000).toISOString()
        : undefined,
      createdAt: new Date().toISOString(),
      createdBy,
    };

    set(s => ({ pointTransactions: [transaction, ...s.pointTransactions] }));
    logAction('CRM', 'สะสมคะแนน', `สะสม ${points} คะแนน (${saleNo})`, { memberId, points, saleNo });
    return transaction;
  },

  redeemPoints: (memberId, points, saleNo, createdBy) => {
    const member = get().members.find(m => m.id === memberId);
    if (!member || member.pointBalance < points) {
      throw new Error('คะแนนไม่เพียงพอ');
    }

    const newBalance = member.pointBalance - points;

    set(s => ({
      members: s.members.map(m =>
        m.id === memberId ? { ...m, pointBalance: newBalance } : m
      ),
    }));

    const transaction: PointTransaction = {
      id: genId(),
      memberId,
      type: 'redeem',
      points: -points,
      balanceAfter: newBalance,
      refType: 'sale',
      refNo: saleNo,
      description: `แลกคะแนนเป็นส่วนลด ${points.toLocaleString()} บาท`,
      createdAt: new Date().toISOString(),
      createdBy,
    };

    set(s => ({ pointTransactions: [transaction, ...s.pointTransactions] }));
    logAction('CRM', 'ใช้คะแนน', `ใช้ ${points} คะแนน (${saleNo})`, { memberId, points, saleNo });
    return transaction;
  },

  getPointHistory: (memberId) => {
    return get().pointTransactions.filter(t => t.memberId === memberId);
  },

  getMemberById: (id) => {
    return get().members.find(m => m.id === id);
  },

  runScheduledAutoCoupons: () => {
    // 2H: ยิง win-back (ไม่ซื้อเกิน 30 วัน) + birthday (วันเกิดวันนี้) — trigger idempotent ในตัว
    get().members.forEach(m => {
      if (!m.isActive) return;
      triggerWinBackCoupon(m);
      triggerBirthdayCoupon(m);
    });
  },
    }),
    {
      name: 'pos-members',
      version: 1,
      storage: createJSONStorage(() => persistStorage),
      // v1: เพิ่มประเภทสมาชิก — สมาชิกเดิมที่ไม่มีประเภทได้ "ลูกค้าทั่วไป"
      migrate: (persisted, fromVersion) => {
        if (fromVersion < 1) return migrateMembersToV1(persisted as Partial<MemberStore>) as MemberStore;
        return persisted as MemberStore;
      },
    }
  )
);
