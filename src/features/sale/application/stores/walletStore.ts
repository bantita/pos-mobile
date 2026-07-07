/**
 * Wallet Store — Zustand + Persist
 * เติมเงิน / หักเงิน / ดูยอดคงเหลือ สมาชิก
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from '@/shared/infrastructure/storage/persistStorage';
import { logAction } from '@/features/audit/application/stores/auditLogStore';

export interface WalletTransaction {
  id: string;
  memberId: string;
  type: 'topup' | 'payment' | 'refund';
  amount: number;
  balanceAfter: number;
  refNo?: string;
  description: string;
  createdAt: string;
  createdBy: string;
}

interface WalletState {
  /** balance ต่อ memberId */
  balances: Record<string, number>;
  transactions: WalletTransaction[];

  getBalance: (memberId: string) => number;
  topUp: (memberId: string, amount: number, createdBy: string) => WalletTransaction;
  pay: (memberId: string, amount: number, saleNo: string, createdBy: string) => WalletTransaction;
  refund: (memberId: string, amount: number, saleNo: string, createdBy: string) => WalletTransaction;
  getHistory: (memberId: string) => WalletTransaction[];
}

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// Mock initial balances
const INITIAL_BALANCES: Record<string, number> = {
  'mem-001': 1500,
  'mem-002': 3200,
  'mem-003': 800,
  'mem-004': 0,
  'mem-005': 5000,
};

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balances: INITIAL_BALANCES,
      transactions: [],

      getBalance: (memberId) => get().balances[memberId] ?? 0,

      topUp: (memberId, amount, createdBy) => {
        const current = get().balances[memberId] ?? 0;
        const newBalance = current + amount;
        const tx: WalletTransaction = {
          id: genId(),
          memberId,
          type: 'topup',
          amount,
          balanceAfter: newBalance,
          description: `เติมเงิน ฿${amount.toLocaleString()}`,
          createdAt: new Date().toISOString(),
          createdBy,
        };
        set(s => ({
          balances: { ...s.balances, [memberId]: newBalance },
          transactions: [tx, ...s.transactions],
        }));
        logAction('Wallet', 'เติมเงิน', `เติม ฿${amount} ให้ ${memberId} (คงเหลือ ฿${newBalance})`, { memberId, amount });
        return tx;
      },

      pay: (memberId, amount, saleNo, createdBy) => {
        const current = get().balances[memberId] ?? 0;
        if (current < amount) throw new Error('ยอดเงินใน Wallet ไม่เพียงพอ');
        const newBalance = current - amount;
        const tx: WalletTransaction = {
          id: genId(),
          memberId,
          type: 'payment',
          amount: -amount,
          balanceAfter: newBalance,
          refNo: saleNo,
          description: `ชำระค่าสินค้า ${saleNo} ฿${amount.toLocaleString()}`,
          createdAt: new Date().toISOString(),
          createdBy,
        };
        set(s => ({
          balances: { ...s.balances, [memberId]: newBalance },
          transactions: [tx, ...s.transactions],
        }));
        logAction('Wallet', 'ชำระจาก Wallet', `หัก ฿${amount} จาก ${memberId} (บิล ${saleNo})`, { memberId, amount, saleNo });
        return tx;
      },

      refund: (memberId, amount, saleNo, createdBy) => {
        const current = get().balances[memberId] ?? 0;
        const newBalance = current + amount;
        const tx: WalletTransaction = {
          id: genId(),
          memberId,
          type: 'refund',
          amount,
          balanceAfter: newBalance,
          refNo: saleNo,
          description: `คืนเงิน ${saleNo} ฿${amount.toLocaleString()}`,
          createdAt: new Date().toISOString(),
          createdBy,
        };
        set(s => ({
          balances: { ...s.balances, [memberId]: newBalance },
          transactions: [tx, ...s.transactions],
        }));
        logAction('Wallet', 'คืนเงิน Wallet', `คืน ฿${amount} ให้ ${memberId}`, { memberId, amount, saleNo });
        return tx;
      },

      getHistory: (memberId) => get().transactions.filter(t => t.memberId === memberId),
    }),
    {
      name: 'pos-wallet',
      storage: createJSONStorage(() => persistStorage),
    }
  )
);
