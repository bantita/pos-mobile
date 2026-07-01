/**
 * Store Config Store — Zustand + Persist
 * จัดการ Store Type (SERVICE / RETAIL / ENTERPRISE) และ Service Charge
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StoreType, BusinessType, BusinessScale, ServiceChargeConfig, StoreConfig } from '../types/store';
import { persistStorage } from './persistStorage';
import { logAction } from './auditLogStore';

interface StoreConfigState extends StoreConfig {
  /** ที่อยู่ร้าน */
  storeAddress: string;
  /** เบอร์โทร */
  storePhone: string;
  /** เลขประจำตัวผู้เสียภาษี */
  storeTaxId: string;
  /** โลโก้ร้าน (base64 หรือ URL) */
  shopLogo: string;
  /** เปิด/ปิด variant fields ของสินค้า */
  variantColor: boolean;
  variantLot: boolean;
  variantSize: boolean;
  variantYear: boolean;
  /** เปิด/ปิดเมนู CRM (super admin เท่านั้นที่ตั้งได้) */
  crmEnabled: boolean;
  /** เปิด/ปิดโมดูลทั้งหมด (super admin จัดการ) */
  moduleEnabled: Record<string, boolean>;

  setStoreType: (type: StoreType) => void;
  setBusinessType: (type: BusinessType) => void;
  setBusinessScale: (scale: BusinessScale) => void;
  setServiceCharge: (config: ServiceChargeConfig) => void;
  setStoreName: (name: string) => void;
  setStoreAddress: (addr: string) => void;
  setStorePhone: (phone: string) => void;
  setStoreTaxId: (taxId: string) => void;
  setShopLogo: (uri: string) => void;
  setVariantColor: (enabled: boolean) => void;
  setVariantLot: (enabled: boolean) => void;
  setVariantSize: (enabled: boolean) => void;
  setVariantYear: (enabled: boolean) => void;
  setCrmEnabled: (enabled: boolean) => void;
  setModuleEnabled: (moduleId: string, enabled: boolean) => void;
}

export const useStoreConfigStore = create<StoreConfigState>()(
  persist(
    (set) => ({
      storeType: 'RETAIL',
      businessType: 'RETAIL',
      businessScale: 'BUSINESS',
      storeName: '',
      storeAddress: '',
      storePhone: '',
      storeTaxId: '',
      shopLogo: '',
      variantColor: false,
      variantLot: false,
      variantSize: false,
      variantYear: false,
      crmEnabled: true,
      moduleEnabled: {
        pos: true, salehistory: true, products: true, pricing: true,
        reports: true, crm: true, promotions: true, inventory: true,
        team: true, auditlog: true, settings: true, communication: true,
        kiosk: true, customerDisplay: true, splitPayment: true,
        pointSystem: true, wallet: true, lineIntegration: true,
      },
      serviceCharge: {
        enabled: false,
        mode: 'percentage',
        value: 10,
      },

      setStoreType: (storeType) => set({ storeType }),
      setBusinessType: (businessType) => set({ businessType }),
      setBusinessScale: (businessScale) => set({ businessScale }),
      setServiceCharge: (serviceCharge) => set({ serviceCharge }),
      setStoreName: (storeName) => { set({ storeName }); logAction('ตั้งค่า', 'เปลี่ยนชื่อร้าน', `เปลี่ยนเป็น "${storeName}"`); },
      setStoreAddress: (storeAddress) => { set({ storeAddress }); logAction('ตั้งค่า', 'เปลี่ยนที่อยู่', `อัพเดทที่อยู่ร้าน`); },
      setStorePhone: (storePhone) => { set({ storePhone }); logAction('ตั้งค่า', 'เปลี่ยนเบอร์โทร', `เปลี่ยนเป็น ${storePhone}`); },
      setStoreTaxId: (storeTaxId) => { set({ storeTaxId }); logAction('ตั้งค่า', 'เปลี่ยนเลขภาษี', `เปลี่ยนเป็น ${storeTaxId}`); },
      setShopLogo: (shopLogo) => { set({ shopLogo }); logAction('ตั้งค่า', 'เปลี่ยนโลโก้', 'อัปโหลดโลโก้ร้านใหม่'); },
      setVariantColor: (variantColor) => { set({ variantColor }); logAction('ตั้งค่า', variantColor ? 'เปิด' : 'ปิด', 'ตัวเลือกสีสินค้า'); },
      setVariantLot: (variantLot) => { set({ variantLot }); logAction('ตั้งค่า', variantLot ? 'เปิด' : 'ปิด', 'ตัวเลือก Lot/Batch'); },
      setVariantSize: (variantSize) => { set({ variantSize }); logAction('ตั้งค่า', variantSize ? 'เปิด' : 'ปิด', 'ตัวเลือกไซส์'); },
      setVariantYear: (variantYear) => { set({ variantYear }); logAction('ตั้งค่า', variantYear ? 'เปิด' : 'ปิด', 'ตัวเลือกปี/รุ่น'); },
      setCrmEnabled: (crmEnabled) => { set({ crmEnabled }); logAction('ตั้งค่า', crmEnabled ? 'เปิดเมนู CRM' : 'ปิดเมนู CRM', `CRM ${crmEnabled ? 'เปิด' : 'ปิด'}`); },
      setModuleEnabled: (moduleId, enabled) => { set(s => ({ moduleEnabled: { ...s.moduleEnabled, [moduleId]: enabled } })); logAction('Super Admin', `${enabled ? 'เปิด' : 'ปิด'}โมดูล`, moduleId); },
    }),
    { name: 'pos-store-config', storage: createJSONStorage(() => persistStorage) }
  )
);

// ─── Non-hook accessors (สำหรับใช้นอก React component) ─────────────────────────
export const getStoreType = (): StoreType => useStoreConfigStore.getState().storeType;
export const getBusinessType = (): BusinessType => useStoreConfigStore.getState().businessType;
export const getBusinessScale = (): BusinessScale => useStoreConfigStore.getState().businessScale;
export const getStoreConfig = () => useStoreConfigStore.getState();
export const getServiceCharge = () => useStoreConfigStore.getState().serviceCharge;
export const setStoreType = (type: StoreType) => useStoreConfigStore.getState().setStoreType(type);
export const setServiceCharge = (config: ServiceChargeConfig) => useStoreConfigStore.getState().setServiceCharge(config);

// ─── Store Type Metadata ───────────────────────────────────────────────────────
export const STORE_TYPE_META: Record<StoreType, {
  label: string;
  description: string;
  icon: string;
  features: string[];
}> = {
  SERVICE: {
    label: 'ร้านบริการ',
    description: 'ร้านตัดผม, สปา, นวด, เสริมสวย',
    icon: 'cut-outline',
    features: [
      'เลือกช่าง/พนักงานบริการ',
      'เซอร์วิสชาร์จ',
      'จองคิว (เร็วๆ นี้)',
    ],
  },
  RETAIL: {
    label: 'ร้านค้าปลีก/ค้าส่ง',
    description: 'ร้านค้าทั่วไป มี 1 จุดบริการขึ้นไป',
    icon: 'storefront-outline',
    features: [
      'จุดขาย POS หลายจุด',
      'ระบบคลังสินค้า',
      'จัดการสมาชิก',
    ],
  },
  ENTERPRISE: {
    label: 'ร้านค้าขนาดใหญ่',
    description: 'หลายสาขา หลายจุดขายต่อสาขา',
    icon: 'business-outline',
    features: [
      'หลายสาขา + หลายจุดขาย',
      'รายงานรวมระดับองค์กร',
      'Sync ข้อมูลข้ามสาขา',
    ],
  },
};
