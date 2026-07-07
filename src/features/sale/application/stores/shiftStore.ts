/**
 * Shift Store — Zustand + Persist
 * เปิดกะ / ปิดกะ / เงินเข้าออกลิ้นชัก
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from '@/shared/infrastructure/storage/persistStorage';
import { logAction } from '@/features/audit/application/stores/auditLogStore';

export interface CashMovement {
  id: string;
  type: 'in' | 'out';
  amount: number;
  reason: string;
  createdAt: string;
  createdBy: string;
}

export interface Shift {
  id: string;
  posId: string;
  posName: string;
  cashierName: string;
  /** เงินตั้งต้นในลิ้นชัก */
  openingAmount: number;
  /** เงินในลิ้นชักตอนปิดกะ (นับจริง) */
  closingAmount?: number;
  /** ยอดขายเงินสดระหว่างกะ */
  cashSalesTotal: number;
  /** เงินเข้าออกระหว่างวัน */
  movements: CashMovement[];
  /** จำนวนบิล */
  billCount: number;
  /** เวลาเปิดกะ */
  openedAt: string;
  /** เวลาปิดกะ */
  closedAt?: string;
  /** สถานะ */
  status: 'open' | 'closed';
  /** ผลต่าง (closingAmount - expected) */
  difference?: number;
}

interface ShiftState {
  currentShift: Shift | null;
  shiftHistory: Shift[];

  openShift: (data: { posId: string; posName: string; cashierName: string; openingAmount: number }) => Shift;
  closeShift: (closingAmount: number) => Shift | null;
  addCashMovement: (type: 'in' | 'out', amount: number, reason: string) => void;
  addCashSale: (amount: number) => void;
  addBill: () => void;
  isShiftOpen: () => boolean;
  getExpectedCash: () => number;
}

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const useShiftStore = create<ShiftState>()(
  persist(
    (set, get) => ({
      currentShift: null,
      shiftHistory: [],

      openShift: (data) => {
        const shift: Shift = {
          id: genId(),
          ...data,
          openingAmount: data.openingAmount,
          cashSalesTotal: 0,
          movements: [],
          billCount: 0,
          openedAt: new Date().toISOString(),
          status: 'open',
        };
        set({ currentShift: shift });
        logAction('POS', 'เปิดกะ', `เปิดกะ ${data.posName} เงินตั้งต้น ฿${data.openingAmount}`, { shiftId: shift.id });
        return shift;
      },

      closeShift: (closingAmount) => {
        const current = get().currentShift;
        if (!current) return null;
        const expected = get().getExpectedCash();
        const diff = closingAmount - expected;
        const closed: Shift = {
          ...current,
          closingAmount,
          closedAt: new Date().toISOString(),
          status: 'closed',
          difference: diff,
        };
        set(s => ({
          currentShift: null,
          shiftHistory: [closed, ...s.shiftHistory],
        }));
        logAction('POS', 'ปิดกะ', `ปิดกะ นับเงิน ฿${closingAmount} (คาดหวัง ฿${expected}, ต่าง ฿${diff})`, { shiftId: closed.id });
        return closed;
      },

      addCashMovement: (type, amount, reason) => {
        const current = get().currentShift;
        if (!current) return;
        const mv: CashMovement = {
          id: genId(), type, amount, reason,
          createdAt: new Date().toISOString(),
          createdBy: current.cashierName,
        };
        set(s => ({
          currentShift: s.currentShift ? { ...s.currentShift, movements: [...s.currentShift.movements, mv] } : null,
        }));
        logAction('POS', type === 'in' ? 'นำเงินเข้าลิ้นชัก' : 'นำเงินออกจากลิ้นชัก', `${type === 'in' ? '+' : '-'}฿${amount} — ${reason}`);
      },

      addCashSale: (amount) => {
        set(s => ({
          currentShift: s.currentShift ? { ...s.currentShift, cashSalesTotal: s.currentShift.cashSalesTotal + amount } : null,
        }));
      },

      addBill: () => {
        set(s => ({
          currentShift: s.currentShift ? { ...s.currentShift, billCount: s.currentShift.billCount + 1 } : null,
        }));
      },

      isShiftOpen: () => get().currentShift !== null && get().currentShift!.status === 'open',

      getExpectedCash: () => {
        const s = get().currentShift;
        if (!s) return 0;
        const movIn = s.movements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.amount, 0);
        const movOut = s.movements.filter(m => m.type === 'out').reduce((sum, m) => sum + m.amount, 0);
        return s.openingAmount + s.cashSalesTotal + movIn - movOut;
      },
    }),
    {
      name: 'pos-shift',
      storage: createJSONStorage(() => persistStorage),
    }
  )
);
