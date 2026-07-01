// Types สำหรับ M08 Supplier & Purchase

/** สถานะใบขอซื้อ (Purchase Requisition) */
export type PRStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'converted';

/** สถานะใบสั่งซื้อ (Purchase Order) */
export type POStatus = 'draft' | 'approved' | 'partial_receive' | 'completed' | 'cancelled';

/** ข้อมูลผู้จำหน่าย (Supplier) */
export interface Supplier {
  id: string;
  /** รหัสผู้จำหน่าย */
  supplierCode: string;
  /** ชื่อผู้จำหน่าย */
  name: string;
  /** ชื่อผู้ติดต่อ */
  contactName?: string;
  /** เบอร์โทรศัพท์ */
  phone?: string;
  /** อีเมล */
  email?: string;
  /** ที่อยู่ */
  address?: string;
  /** เลขประจำตัวผู้เสียภาษี */
  taxId?: string;
  /** เงื่อนไขการชำระเงิน (เช่น '30 days', 'COD') */
  paymentTerms?: string;
  /** สถานะใช้งาน */
  isActive: boolean;
  /** รหัสร้านค้า */
  shopId: string;
  /** วันที่สร้าง (ISO date) */
  createdAt: string;
}

/** ใบขอซื้อ (Purchase Requisition) */
export interface PurchaseRequisition {
  id: string;
  /** เลขที่ใบขอซื้อ (auto-gen: PR-YYYYMM-XXXX) */
  prNo: string;
  /** สถานะ */
  status: PRStatus;
  /** รายการสินค้า */
  items: PRItem[];
  /** เหตุผลในการขอซื้อ */
  reason: string;
  /** ผู้ขอซื้อ */
  requestedBy: string;
  /** วันที่ขอซื้อ (ISO date) */
  requestedAt: string;
  /** ผู้อนุมัติ */
  approvedBy?: string;
  /** วันที่อนุมัติ (ISO date) */
  approvedAt?: string;
  /** รหัสร้านค้า */
  shopId: string;
  /** รหัสสาขา */
  branchId: string;
}

/** รายการสินค้าในใบขอซื้อ */
export interface PRItem {
  /** รหัสสินค้า */
  productId: string;
  /** ชื่อสินค้า */
  productName: string;
  /** รหัสสินค้า (SKU) */
  productCode: string;
  /** จำนวนที่ขอซื้อ */
  requestQty: number;
  /** หน่วยนับ */
  unit: string;
  /** สต็อกปัจจุบัน */
  currentStock: number;
  /** สต็อกขั้นต่ำ */
  minStock: number;
  /** ราคาประเมิน (บาท) */
  estimatedCost?: number;
  /** รหัสผู้จำหน่ายที่ต้องการ */
  preferredSupplierId?: string;
}

/** ใบสั่งซื้อ (Purchase Order) */
export interface PurchaseOrder {
  id: string;
  /** เลขที่ใบสั่งซื้อ (auto-gen: PO-YYYYMM-XXXX) */
  poNo: string;
  /** สถานะ */
  status: POStatus;
  /** รหัสผู้จำหน่าย */
  supplierId: string;
  /** ชื่อผู้จำหน่าย */
  supplierName: string;
  /** รหัสใบขอซื้อที่อ้างอิง (ถ้ามี) */
  prId?: string;
  /** รายการสินค้า */
  items: POItem[];
  /** ยอดรวมก่อน VAT (บาท) */
  subtotal: number;
  /** ยอด VAT (บาท) */
  vatAmount: number;
  /** ยอดรวมสุทธิ (บาท) */
  grandTotal: number;
  /** วันที่กำหนดส่ง (ISO date) */
  deliveryDate: string;
  /** เงื่อนไขการชำระเงิน */
  paymentTerms: string;
  /** หมายเหตุ */
  notes?: string;
  /** ผู้สร้าง */
  createdBy: string;
  /** วันที่สร้าง (ISO date) */
  createdAt: string;
  /** ผู้อนุมัติ */
  approvedBy?: string;
  /** วันที่อนุมัติ (ISO date) */
  approvedAt?: string;
  /** รหัสร้านค้า */
  shopId: string;
  /** รหัสสาขา */
  branchId: string;
}

/** รายการสินค้าในใบสั่งซื้อ */
export interface POItem {
  /** รหัสสินค้า */
  productId: string;
  /** ชื่อสินค้า */
  productName: string;
  /** รหัสสินค้า (SKU) */
  productCode: string;
  /** จำนวนที่สั่งซื้อ */
  orderQty: number;
  /** จำนวนที่รับแล้ว */
  receivedQty: number;
  /** หน่วยนับ */
  unit: string;
  /** ราคาต่อหน่วย (บาท) */
  unitCost: number;
  /** ราคารวม (บาท) */
  totalCost: number;
}

/** ใบรับสินค้า (PO Receive) */
export interface POReceive {
  id: string;
  /** เลขที่ใบรับสินค้า */
  receiveNo: string;
  /** รหัสใบสั่งซื้อ */
  poId: string;
  /** เลขที่ใบสั่งซื้อ */
  poNo: string;
  /** รายการสินค้าที่รับ */
  items: POReceiveItem[];
  /** ผู้รับสินค้า */
  receivedBy: string;
  /** วันที่รับสินค้า (ISO date) */
  receivedAt: string;
  /** หมายเหตุ */
  notes?: string;
}

/** รายการสินค้าที่รับ */
export interface POReceiveItem {
  /** รหัสสินค้า */
  productId: string;
  /** ชื่อสินค้า */
  productName: string;
  /** จำนวนที่รับ */
  receiveQty: number;
  /** หน่วยนับ */
  unit: string;
  /** ต้นทุนจริง (บาท) */
  actualCost: number;
  /** เลข Lot */
  lotNo?: string;
  /** วันหมดอายุ (ISO date) */
  expireDate?: string;
}
