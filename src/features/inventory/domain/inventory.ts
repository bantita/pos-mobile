export type TransactionType = 'receive' | 'issue' | 'transfer' | 'adjust' | 'count' | 'sale';

export interface StockTransaction {
  id: string;
  type: TransactionType;
  productId: string;
  productName: string;
  productCode: string;
  qty: number;             // + เพิ่ม / - ลด
  beforeQty: number;
  afterQty: number;
  cost?: number;
  unitLabel: string;
  warehouseId: string;
  warehouseName: string;
  documentNo: string;
  reason?: string;
  createdBy: string;
  createdAt: Date;
}

export interface StockItem {
  productId: string;
  productCode: string;
  productName: string;
  categoryName: string;
  warehouseId: string;
  warehouseName: string;
  onHandQty: number;
  minStock: number;
  unit: string;
  costPrice: number;
  salePrice: number;
  lastUpdated: Date;
}

export interface Warehouse {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
  type: 'main' | 'pos' | 'transit';
}

export interface Supplier {
  id: string;
  name: string;
  taxId?: string;
  phone?: string;
  contactName?: string;
}

export interface ReceiveItem {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  qty: number;
  costPrice: number;
  lot?: string;
  expireDate?: Date;
}

export interface IssueItem {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  onHandQty: number;
  requestQty: number;
  unit2?: string;
}

export interface TransferItem {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  qty: number;
}

export interface StockCountItem {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  systemQty: number;
  actualQty: number | null;
  variance: number | null;
  countedAt?: Date;
}

export type AdjustReason = 'damage' | 'lost' | 'expire' | 'recount' | 'other';
export const ADJUST_REASON_LABELS: Record<AdjustReason, string> = {
  damage: 'เสียหาย',
  lost: 'สูญหาย',
  expire: 'หมดอายุ',
  recount: 'นับผิด',
  other: 'อื่นๆ',
};
