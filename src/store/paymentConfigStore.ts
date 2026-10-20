/**
 * Payment Config Store — Zustand + Persist
 * เก็บการตั้งค่าช่องทางชำระเงินระดับร้าน:
 * - PromptPay ID (เบอร์โทร/เลขบัตรประชาชน) ที่ใช้ encode ลง QR
 * - เลขบัญชี/ชื่อธนาคาร สำหรับช่องทางโอนเงิน
 * - รายการช่องทางชำระเงิน (เปิด/ปิด + ลำดับการแสดงผล)
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from './persistStorage';
import { logAction } from './auditLogStore';

/** ช่องทางชำระเงินหนึ่งรายการ */
export interface PaymentChannel {
  /** รหัสช่องทาง (คงที่ เช่น cash/qr/transfer/credit/wallet/coupon หรือ custom_*) */
  id: string;
  /** ชื่อที่แสดงผล (ภาษาไทย) */
  label: string;
  /** ชื่อไอคอน Ionicons */
  icon: string;
  /** สีประจำช่องทาง (hex) */
  color: string;
  /** เปิด/ปิดช่องทางนี้ */
  enabled: boolean;
}

interface PaymentConfigState {
  /** หมายเลข PromptPay (เบอร์โทร 10 หลัก หรือ เลขบัตรประชาชน 13 หลัก) */
  promptPayId: string;
  /** เลขบัญชีธนาคารสำหรับช่องทางโอนเงิน */
  bankAccount: string;
  /** ชื่อธนาคาร */
  bankName: string;
  /** ชื่อบัญชี/ชื่อร้านผู้รับเงิน */
  accountName: string;
  /** ช่องทางชำระเงินทั้งหมด (เรียงตามลำดับการแสดงผล) */
  channels: PaymentChannel[];

  setPromptPayId: (id: string) => void;
  setBankAccount: (account: string) => void;
  setBankName: (name: string) => void;
  setAccountName: (name: string) => void;
  toggleChannel: (id: string) => void;
  /** ย้ายช่องทางขึ้น/ลง เพื่อจัดลำดับการแสดงผล */
  moveChannel: (id: string, direction: 'up' | 'down') => void;
  addChannel: (channel: Omit<PaymentChannel, 'enabled'>) => void;
  removeChannel: (id: string) => void;
  setChannels: (channels: PaymentChannel[]) => void;
}

const DEFAULT_CHANNELS: PaymentChannel[] = [
  { id: 'cash',     label: 'เงินสด',                         icon: 'cash',            color: '#22C55E', enabled: true },
  { id: 'qr',       label: 'QR Code / PromptPay',            icon: 'qr-code',         color: '#8B5CF6', enabled: true },
  { id: 'transfer', label: 'โอนเงิน (Transfer)',             icon: 'swap-horizontal', color: '#3B82F6', enabled: true },
  { id: 'credit',   label: 'บัตรเครดิต / เดบิต',             icon: 'card',            color: '#F59E0B', enabled: true },
  { id: 'wallet',   label: 'E-Wallet (Line Pay, TrueMoney)', icon: 'wallet',          color: '#EC6B9D', enabled: false },
  { id: 'coupon',   label: 'คูปอง / Voucher',                icon: 'pricetag',        color: '#EF4444', enabled: false },
];

export const usePaymentConfigStore = create<PaymentConfigState>()(
  persist(
    (set) => ({
      promptPayId: '',
      bankAccount: '',
      bankName: '',
      accountName: '',
      channels: DEFAULT_CHANNELS,

      setPromptPayId: (promptPayId) => {
        set({ promptPayId: promptPayId.trim() });
        logAction('ตั้งค่า', 'ตั้งค่า PromptPay', 'อัพเดทหมายเลข PromptPay สำหรับ QR');
      },
      setBankAccount: (bankAccount) => { set({ bankAccount: bankAccount.trim() }); },
      setBankName: (bankName) => { set({ bankName }); },
      setAccountName: (accountName) => { set({ accountName }); },
      toggleChannel: (id) =>
        set((s) => ({
          channels: s.channels.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)),
        })),
      moveChannel: (id, direction) =>
        set((s) => {
          const idx = s.channels.findIndex((c) => c.id === id);
          if (idx < 0) return s;
          const target = direction === 'up' ? idx - 1 : idx + 1;
          if (target < 0 || target >= s.channels.length) return s;
          const next = [...s.channels];
          [next[idx], next[target]] = [next[target], next[idx]];
          return { channels: next };
        }),
      addChannel: (channel) =>
        set((s) => ({ channels: [...s.channels, { ...channel, enabled: true }] })),
      removeChannel: (id) =>
        set((s) => ({ channels: s.channels.filter((c) => c.id !== id) })),
      setChannels: (channels) => set({ channels }),
    }),
    { name: 'pos-payment-config', storage: createJSONStorage(() => persistStorage) }
  )
);

// ─── Non-hook accessor (สำหรับใช้นอก React component) ─────────────────────────
export const getPaymentConfig = () => usePaymentConfigStore.getState();
