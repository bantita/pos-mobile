/**
 * receiptStore — เก็บ config บิล (header logo, ข้อความ, paper size ฯลฯ)
 */
import { create } from 'zustand';

export interface ReceiptConfig {
  shopName:    string;
  shopAddr:    string;
  shopTel:     string;
  shopTaxId:   string;
  shopBranch:  string;
  posRegNo:    string;
  paperSize:   '58mm' | '80mm' | 'A4';
  headerLogo:  string;   // base64 / blob URI ของรูปหัวบิล
  headerText:  string;   // ข้อความเพิ่มเติมบนหัวบิล (เช่น สโลแกน)
  footerText:  string;   // ข้อความท้ายบิล
  showLogo:    boolean;
  copies:      number;
}

interface ReceiptStoreState {
  config: ReceiptConfig;
  setConfig: (c: Partial<ReceiptConfig>) => void;
}

const DEFAULT: ReceiptConfig = {
  shopName:   'ร้านสะดวกซื้อ ABC',
  shopAddr:   '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
  shopTel:    '02-123-4567',
  shopTaxId:  '0105560123456',
  shopBranch: 'สำนักงานใหญ่',
  posRegNo:   'POS-001',
  paperSize:  '80mm',
  headerLogo: '',
  headerText: '',
  footerText: 'ขอบคุณที่ใช้บริการ',
  showLogo:   true,
  copies:     1,
};

export const useReceiptStore = create<ReceiptStoreState>((set) => ({
  config: DEFAULT,
  setConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),
}));
