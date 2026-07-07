/**
 * Staff/Employee Types — ระบบจัดการพนักงานและผู้ใช้งาน
 *
 * หลักการ:
 * - พนักงาน (Employee) ไม่จำเป็นต้องมี User Account
 * - ผู้ใช้งาน (User) ต้องเชื่อมกับ Employee เสมอ
 */

// ─── 1. ข้อมูลส่วนบุคคล (Personal Information) ──────────────────────────────
export interface PersonalInfo {
  firstName: string;
  lastName: string;
  nickname?: string;
  idCard: string;           // เลขบัตรประจำตัวประชาชน (13 หลัก)
  dateOfBirth: string;      // YYYY-MM-DD
  nationality: string;
  registeredAddress: string; // ที่อยู่ตามทะเบียนบ้าน
  currentAddress: string;    // ที่อยู่ปัจจุบัน
  photo?: string;           // URL หรือ base64
}

// ─── 2. ช่องทางติดต่อ ────────────────────────────────────────────────────────
export interface ContactInfo {
  phone: string;            // เบอร์โทรศัพท์มือถือ
  email?: string;
  lineId?: string;
  emergencyContactName: string;     // บุคคลที่ติดต่อได้ในกรณีฉุกเฉิน
  emergencyContactPhone: string;
  emergencyContactRelation: string; // ความสัมพันธ์
}

// ─── 3. เอกสาร ───────────────────────────────────────────────────────────────
export interface EmployeeDocuments {
  idCardCopy?: boolean;       // มีสำเนาบัตรประชาชน
  houseCopy?: boolean;        // สำเนาทะเบียนบ้าน
  photoUploaded?: boolean;    // รูปถ่าย
  pdpaConsent?: boolean;      // ยินยอมเปิดเผยข้อมูลส่วนบุคคล (PDPA)
  pdpaConsentDate?: string;   // วันที่ยินยอม
}

// ─── 4. ข้อมูลการจ้างงาน (Employment Details) ─────────────────────────────────
export type ContractType = 'probation' | 'permanent' | 'temporary' | 'parttime';
export type EmployeeStatus = 'active' | 'inactive' | 'resigned' | 'terminated';

export interface EmploymentInfo {
  position: string;       // ตำแหน่ง
  department: string;     // แผนก
  branchId?: string;      // สาขา (สำหรับ ENTERPRISE)
  startDate: string;      // วันที่เริ่มงาน YYYY-MM-DD
  endDate?: string;       // วันที่สิ้นสุดสัญญา (ถ้ามี)
  contractType: ContractType;
  salary?: number;        // เงินเดือน (อาจไม่แสดงทุก role)
}

// ─── Employee (พนักงาน) ──────────────────────────────────────────────────────
export interface Employee {
  id: string;
  employeeCode: string;    // รหัสพนักงาน เช่น EMP001
  personal: PersonalInfo;
  contact: ContactInfo;
  documents: EmployeeDocuments;
  employment: EmploymentInfo;
  status: EmployeeStatus;
  // ถ้าเป็นช่างบริการ
  isTechnician: boolean;
  technicianStatus?: 'available' | 'unavailable';
  createdAt: Date;
  updatedAt: Date;
}

// ─── User Account (ผู้ใช้งาน) ─────────────────────────────────────────────────
export type UserRole = 'owner' | 'manager' | 'cashier' | 'stock_staff' | 'report_viewer' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'inactive';

export interface UserAccount {
  id: string;
  employeeId: string;    // เชื่อม Employee เสมอ
  username: string;      // เบอร์โทร หรือ username
  role: UserRole;
  status: UserStatus;
  branchIds?: string[];  // สาขาที่เข้าถึงได้ (ถ้าไม่ระบุ = ทุกสาขา สำหรับ owner/admin)
  lastLogin?: Date;
  createdAt: Date;
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  probation: 'ทดลองงาน',
  permanent: 'พนักงานประจำ',
  temporary: 'สัญญาจ้างชั่วคราว',
  parttime: 'พาร์ทไทม์',
};

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: 'ทำงานอยู่',
  inactive: 'ไม่ทำงาน',
  resigned: 'ลาออก',
  terminated: 'พ้นสภาพ',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  owner: 'เจ้าของร้าน',
  manager: 'ผู้จัดการ',
  cashier: 'แคชเชียร์',
  stock_staff: 'พนักงานคลัง',
  report_viewer: 'ดูรายงาน',
  admin: 'ผู้ดูแลระบบ',
};

export const DEPARTMENTS = [
  'บริหาร', 'ขาย', 'คลังสินค้า', 'บัญชี', 'บริการ', 'ช่าง', 'อื่นๆ',
];

export const POSITIONS = [
  'เจ้าของ', 'ผู้จัดการ', 'แคชเชียร์', 'พนักงานคลัง',
  'ช่างตัดผม', 'ช่างทำเล็บ', 'ช่างสปา', 'พนักงานทั่วไป',
];
