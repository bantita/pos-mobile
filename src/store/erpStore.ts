/**
 * ERP Store — Zustand + Persist
 * ตั้งค่าการเชื่อมต่อ ERP หลังบ้าน (mock) — M11 Integration
 * Gated ด้วย FEATURE_FLAGS.MOCK_ERP: เมื่อเปิด = จำลองผล, เมื่อปิด = ต่อ service จริง (ยังเป็น stub)
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from './persistStorage';
import { FEATURE_FLAGS } from '../config/featureFlags';

export type ErpConnectionStatus = 'idle' | 'testing' | 'connected' | 'error';
export type ErpSyncKind = 'product' | 'sales';

export interface ErpSyncResult {
  kind: ErpSyncKind;
  success: boolean;
  recordCount: number;
  message: string;
  syncedAt: string; // ISO
}

interface ErpState {
  endpoint: string;
  apiKey: string;
  companyCode: string;
  connectionStatus: ErpConnectionStatus;
  lastError: string | null;
  lastSyncResult: ErpSyncResult | null;

  setEndpoint: (v: string) => void;
  setApiKey: (v: string) => void;
  setCompanyCode: (v: string) => void;
  /** ทดสอบการเชื่อมต่อ — คืน Promise<boolean> */
  testConnection: () => Promise<boolean>;
  /** sync สินค้า/ยอดขาย — คืนผลลัพธ์จำลอง */
  runSync: (kind: ErpSyncKind) => Promise<ErpSyncResult>;
}

export const useErpStore = create<ErpState>()(
  persist(
    (set, get) => ({
      endpoint: '',
      apiKey: '',
      companyCode: '',
      connectionStatus: 'idle',
      lastError: null,
      lastSyncResult: null,

      setEndpoint: (v) => set({ endpoint: v }),
      setApiKey: (v) => set({ apiKey: v }),
      setCompanyCode: (v) => set({ companyCode: v }),

      testConnection: async () => {
        set({ connectionStatus: 'testing', lastError: null });
        const { endpoint, apiKey } = get();
        // validate ขั้นต่ำก่อนเรียก (จริง/mock ใช้ร่วมกัน)
        if (!endpoint.trim() || !apiKey.trim()) {
          set({ connectionStatus: 'error', lastError: 'กรุณากรอก Endpoint และ API Key ให้ครบ' });
          return false;
        }
        if (FEATURE_FLAGS.MOCK_ERP) {
          // MOCK: จำลองการเชื่อมต่อสำเร็จหลัง delay (ยังไม่ต่อ ERP จริง)
          await new Promise((r) => setTimeout(r, 900));
          set({ connectionStatus: 'connected', lastError: null });
          return true;
        }
        // else: ต่อ ERP จริงผ่าน service stub (ยังไม่ implement)
        // const res = await erpApi.testConnection({ endpoint, apiKey });
        set({ connectionStatus: 'error', lastError: 'ยังไม่ได้เชื่อมต่อ ERP จริง' });
        return false;
      },

      runSync: async (kind) => {
        const label = kind === 'product' ? 'สินค้า' : 'ยอดขาย';
        if (FEATURE_FLAGS.MOCK_ERP) {
          // MOCK: จำลองผลการ sync (ยังไม่ต่อ ERP จริง)
          await new Promise((r) => setTimeout(r, 1100));
          const recordCount = kind === 'product' ? 128 : 342;
          const result: ErpSyncResult = {
            kind,
            success: true,
            recordCount,
            message: `ซิงก์${label} ${recordCount} รายการสำเร็จ`,
            syncedAt: new Date().toISOString(),
          };
          set({ lastSyncResult: result });
          return result;
        }
        // else: ต่อ ERP จริงผ่าน service stub (ยังไม่ implement)
        const result: ErpSyncResult = {
          kind,
          success: false,
          recordCount: 0,
          message: 'ยังไม่ได้เชื่อมต่อ ERP จริง',
          syncedAt: new Date().toISOString(),
        };
        set({ lastSyncResult: result });
        return result;
      },
    }),
    { name: 'pos-erp', storage: createJSONStorage(() => persistStorage) }
  )
);
