/**
 * Feature Flags — Mock gating
 * ธงเปิด/ปิดโหมด mock สำหรับส่วนที่ยังต้องต่อ backend จริง
 * ทุกธง default = ENV.ENABLE_MOCK (dev = true, ปิดเมื่อ ENABLE_MOCK=false)
 *
 * ไม่พึ่งพา React / store ใดๆ — import ได้จากทุกที่รวมถึง engine/adapter
 */
import { ENV } from './env';

export interface FeatureFlags {
  /** ยืนยันการชำระเงิน QR/บัตรอัตโนมัติแบบ mock (ยังไม่ต่อ payment gateway จริง) */
  MOCK_PAYMENT_AUTOCONFIRM: boolean;
  /** ส่งข้อความ/Flex ผ่าน LINE OA แบบ mock (ยังไม่ต่อ LINE Messaging API จริง) */
  MOCK_LINE: boolean;
  /** ซิงก์ข้อมูลออฟไลน์→ออนไลน์แบบ mock (ยังไม่ต่อ sync backend จริง) */
  MOCK_SYNC: boolean;
  /** ต่อ ERP/บัญชีแบบ mock (ยังไม่ต่อ ERP จริง) */
  MOCK_ERP: boolean;
}

export const FEATURE_FLAGS: FeatureFlags = {
  MOCK_PAYMENT_AUTOCONFIRM: ENV.ENABLE_MOCK,
  MOCK_LINE: ENV.ENABLE_MOCK,
  MOCK_SYNC: ENV.ENABLE_MOCK,
  MOCK_ERP: ENV.ENABLE_MOCK,
};
