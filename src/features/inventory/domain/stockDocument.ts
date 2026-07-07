/**
 * Stock Document Types
 * ใช้ร่วมกันทั้งหน้ารับสินค้า (Receive) และหน้าเบิกสินค้า (Issue)
 * รองรับ Revision: เอกสารที่ confirmed แล้วสามารถ revise สร้าง revision ใหม่ได้
 */

export type DocType   = 'receive' | 'issue';
export type DocStatus = 'draft' | 'confirmed' | 'cancelled' | 'revised';
//                                                                ↑ เพิ่ม revised = ถูก revise แล้ว (ไม่ใช้งานแล้ว)

export interface RevisionRecord {
  revNo: number;          // 1, 2, 3 ...
  revisedBy: string;
  revisedAt: Date;
  reason: string;
  prevDocId: string;      // id ของ revision ก่อนหน้า
}

export interface StockDocItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  uomId: string;
  unit: string;
  ratio: number;
  onHandQty: number;
  qty: number;
  qtyBase: number;
  costPrice: number;
  lot?: string;
  expireDate?: string;
}

export type DocItem = StockDocItem;

export interface StockDocument {
  id: string;
  docNo: string;          // เช่น RCV2406-0001 (คงเดิม ทุก revision)
  revNo: number;          // 0 = ต้นฉบับ, 1 = Rev.1, ...
  docType: DocType;
  status: DocStatus;
  warehouseId: string;
  warehouseName: string;
  supplierId?: string;
  supplierName?: string;
  toWarehouseId?: string;
  toWarehouseName?: string;
  remark?: string;
  items: StockDocItem[];
  totalItems: number;
  totalQtyBase: number;
  totalCost: number;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  confirmedBy?: string;
  confirmedAt?: Date;
  // Revision chain
  originalDocId?: string;   // id ของ revision แรกสุด (rev 0)
  revisionHistory: RevisionRecord[];
  reviseReason?: string;    // เหตุผลที่ revise ครั้งนี้
}

/** Running number format */
export const generateDocNo = (docType: DocType, existingDocs: StockDocument[]): string => {
  const prefix = docType === 'receive' ? 'RCV' : 'ISS';
  const now = new Date();
  const ym = `${now.getFullYear().toString().slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
  // นับจาก originalDocId (ไม่นับ revision ซ้ำ)
  const roots = existingDocs.filter((d) =>
    d.docNo.startsWith(`${prefix}${ym}`) && d.revNo === 0
  );
  const seq = String(roots.length + 1).padStart(4, '0');
  return `${prefix}${ym}-${seq}`;
};
