/**
 * Member Store — Zustand
 * M06 CRM & Loyalty
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Member, PointTransaction, PointConfig } from '@/features/member/domain/member';
import { MOCK_MEMBERS, MOCK_POINT_TRANSACTIONS, MOCK_POINT_CONFIG } from '@/features/member/data/mocks/mockMembers';
import { logAction } from '@/features/audit/application/stores/auditLogStore';
import { persistStorage } from '@/shared/infrastructure/storage/persistStorage';

// ─── Helper ───────────────────────────────────────────────────────────────────
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const genMemberNo = () => 'MEM-' + Math.floor(100000 + Math.random() * 900000).toString();

// ─── Store ────────────────────────────────────────────────────────────────────
interface MemberStore {
  members: Member[];
  selectedMember: Member | null;
  pointTransactions: PointTransaction[];
  pointConfig: PointConfig;

  // Actions
  searchMembers: (keyword: string) => Member[];
  addMember: (data: Omit<Member, 'id' | 'memberNo' | 'pointBalance' | 'totalSpent' | 'joinDate'>) => Member;
  updateMember: (id: string, data: Partial<Member>) => void;
  selectMember: (member: Member | null) => void;
  earnPoints: (memberId: string, saleAmount: number, saleNo: string, createdBy: string) => PointTransaction;
  redeemPoints: (memberId: string, points: number, saleNo: string, createdBy: string) => PointTransaction;
  getPointHistory: (memberId: string) => PointTransaction[];
  getMemberById: (id: string) => Member | undefined;
}

export const useMemberStore = create<MemberStore>()(
  persist(
    (set, get) => ({
  members: MOCK_MEMBERS,
  selectedMember: null,
  pointTransactions: MOCK_POINT_TRANSACTIONS,
  pointConfig: MOCK_POINT_CONFIG,

  searchMembers: (keyword) => {
    const k = keyword.toLowerCase().trim();
    if (!k) return get().members;
    return get().members.filter(m =>
      m.name.toLowerCase().includes(k) ||
      m.phone.includes(k) ||
      m.memberNo.toLowerCase().includes(k)
    );
  },

  addMember: (data) => {
    const newMember: Member = {
      ...data,
      id: genId(),
      memberNo: genMemberNo(),
      pointBalance: 0,
      totalSpent: 0,
      joinDate: new Date().toISOString(),
    };
    set(s => ({ members: [...s.members, newMember] }));
    logAction('CRM', 'เพิ่มสมาชิก', `เพิ่มสมาชิก ${newMember.name} (${newMember.memberNo})`, { memberId: newMember.id, phone: newMember.phone });
    return newMember;
  },

  updateMember: (id, data) => {
    const member = get().members.find(m => m.id === id);
    set(s => ({
      members: s.members.map(m => m.id === id ? { ...m, ...data } : m),
      selectedMember: s.selectedMember?.id === id
        ? { ...s.selectedMember, ...data }
        : s.selectedMember,
    }));
    logAction('CRM', 'แก้ไขสมาชิก', `แก้ไขข้อมูล ${member?.name || id}`, { memberId: id, changes: data });
  },

  selectMember: (member) => set({ selectedMember: member }),

  earnPoints: (memberId, saleAmount, saleNo, createdBy) => {
    const { pointConfig } = get();
    const points = Math.floor(saleAmount / pointConfig.earnRate);
    const member = get().members.find(m => m.id === memberId);
    const newBalance = (member?.pointBalance ?? 0) + points;

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
    }),
    { name: 'pos-members', storage: createJSONStorage(() => persistStorage) }
  )
);
