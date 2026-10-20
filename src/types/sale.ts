// Types สำหรับ M03 POS Sale

export interface Product {
  id: string;
  code: string;
  barcode: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  vatIncluded: boolean;
  vatRate: number; // 0 | 7
  unit: string;
  image?: string;
  stockQty: number;
}

export interface CartItem {
  product: Product;
  qty: number;
  unitPrice: number;
  discountAmount: number;  // ส่วนลดรายสินค้า (บาท)
  discountPercent: number; // ส่วนลดรายสินค้า (%)
  subtotal: number;        // (unitPrice - discount) * qty
  /** ID ของช่าง/พนักงานบริการ — ใช้กับสินค้าประเภท service */
  technicianId?: string;
  /** ชื่อช่าง/พนักงานบริการ — แสดงใน Cart line item */
  technicianName?: string;
}

export interface Discount {
  type: 'amount' | 'percent';
  value: number;
  reason?: string;
  approvedBy?: string;
}

export interface Payment {
  method: 'cash' | 'transfer' | 'qr' | 'credit' | 'ewallet';
  amount: number;
  reference?: string; // สำหรับ transfer/QR/credit
}

export interface HoldBill {
  id: string;
  items: CartItem[];
  discount: Discount | null;
  customerRef?: string;
  remark?: string;
  heldAt: Date;
  heldBy: string;
}

export interface SaleOrder {
  saleNo: string;
  items: CartItem[];
  discount: Discount | null;
  payments: Payment[];
  subtotal: number;
  discountTotal: number;
  vatAmount: number;
  grandTotal: number;
  receivedAmount: number;
  changeAmount: number;
  cashierId: string;
  posId: string;
  branchId: string;
  createdAt: Date;
  status: 'pending' | 'completed' | 'cancelled';
}

// ─── Order Type (ประเภทการสั่งซื้อ) ────────────────────────────────────────────
// แยกจาก saleMode (ช่องทางรับออเดอร์: ปุ่ม/สแกน) — orderType คือ "รูปแบบการขาย"
export type OrderType = 'normal' | 'preorder' | 'delivery' | 'dinein';

export interface OrderDetails {
  /** สั่งจอง — วันที่นัดรับสินค้า (ISO string) */
  readyDate?: string;
  /** เดลิเวอรี — ที่อยู่จัดส่ง */
  address?: string;
  /** เดลิเวอรี — เบอร์ติดต่อ */
  phone?: string;
  /** เดลิเวอรี — หมายเหตุ */
  note?: string;
  /** ทานที่ร้าน — เลขโต๊ะ */
  tableNo?: string;
  /** ทานที่ร้าน — โซน */
  zone?: string;
}

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  normal: 'ปกติ',
  preorder: 'สั่งจอง',
  delivery: 'เดลิเวอรี',
  dinein: 'ทานที่ร้าน',
};

export const ORDER_TYPE_ICONS: Record<OrderType, string> = {
  normal: 'cart-outline',
  preorder: 'calendar-outline',
  delivery: 'bicycle-outline',
  dinein: 'restaurant-outline',
};

export type PaymentMethod = Payment['method'];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'เงินสด',
  transfer: 'โอนเงิน',
  qr: 'QR Code',
  credit: 'บัตรเครดิต',
  ewallet: 'E-Wallet',
};

export const PAYMENT_ICONS: Record<PaymentMethod, string> = {
  cash: 'cash-outline',
  transfer: 'phone-portrait-outline',
  qr: 'qr-code-outline',
  credit: 'card-outline',
  ewallet: 'wallet-outline',
};
