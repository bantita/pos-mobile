import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  StockDocument, StockDocItem, DocType,
  generateDocNo,
} from '@/features/inventory/domain/stockDocument';
import { persistStorage } from '@/shared/infrastructure/storage/persistStorage';

const INITIAL_DOCS: StockDocument[] = [
  {
    id: 'doc1', docNo: 'RCV2406-0001', revNo: 0,
    docType: 'receive', status: 'confirmed',
    warehouseId: 'wh1', warehouseName: 'คลังหลัก',
    supplierId: 's1', supplierName: 'บริษัท สิงห์ คอร์เปอเรชั่น',
    remark: 'รับสินค้าประจำเดือน',
    items: [
      { id: 'i1', productId: 'p1', productCode: 'P001', productName: 'น้ำดื่มสิงห์ 600ml',  uomId: 'u1_3', unit: 'ลัง',     ratio: 24, onHandQty: 100, qty: 2,  qtyBase: 48, costPrice: 120 },
      { id: 'i2', productId: 'p2', productCode: 'P002', productName: 'น้ำอัดลม Pepsi 325ml', uomId: 'u2_1', unit: 'กระป๋อง', ratio: 1,  onHandQty: 50,  qty: 50, qtyBase: 50, costPrice: 9  },
    ],
    totalItems: 2, totalQtyBase: 98, totalCost: 690,
    createdBy: 'สมชาย', createdAt: new Date(Date.now() - 2 * 86400000),
    confirmedBy: 'ผู้จัดการ', confirmedAt: new Date(Date.now() - 2 * 86400000),
    revisionHistory: [],
  },
  {
    id: 'doc2', docNo: 'RCV2406-0002', revNo: 0,
    docType: 'receive', status: 'draft',
    warehouseId: 'wh1', warehouseName: 'คลังหลัก',
    supplierId: 's3', supplierName: 'ห้างหุ้นส่วน ABC ซัพพลาย',
    items: [
      { id: 'i3', productId: 'p5', productCode: 'P005', productName: 'เลย์ รสออริจินัล', uomId: 'u5_2', unit: 'แพ็ค', ratio: 8, onHandQty: 70, qty: 5, qtyBase: 40, costPrice: 100 },
    ],
    totalItems: 1, totalQtyBase: 40, totalCost: 500,
    createdBy: 'สมหญิง', createdAt: new Date(Date.now() - 86400000),
    revisionHistory: [],
  },
  {
    id: 'doc3', docNo: 'ISS2406-0001', revNo: 0,
    docType: 'issue', status: 'confirmed',
    warehouseId: 'wh1', warehouseName: 'คลังหลัก',
    toWarehouseId: 'wh2', toWarehouseName: 'POS 1',
    items: [
      { id: 'i4', productId: 'p1', productCode: 'P001', productName: 'น้ำดื่มสิงห์ 600ml', uomId: 'u1_2', unit: 'แพ็ค', ratio: 6,  onHandQty: 100, qty: 4, qtyBase: 24, costPrice: 33 },
      { id: 'i5', productId: 'p4', productCode: 'P004', productName: 'มาม่า หมูสับ',       uomId: 'u4_2', unit: 'โหล',  ratio: 12, onHandQty: 200, qty: 4, qtyBase: 48, costPrice: 42 },
    ],
    totalItems: 2, totalQtyBase: 72, totalCost: 300,
    createdBy: 'พนักงาน', createdAt: new Date(Date.now() - 3600000),
    confirmedBy: 'ผู้จัดการ', confirmedAt: new Date(Date.now() - 3600000),
    revisionHistory: [],
  },
];

interface StockDocState {
  documents: StockDocument[];
  addDocument:    (doc: Omit<StockDocument, 'id' | 'docNo' | 'createdAt' | 'revisionHistory'>) => StockDocument;
  updateDocument: (id: string, updates: Partial<StockDocument>) => void;
  confirmDocument:(id: string, confirmedBy: string) => void;
  cancelDocument: (id: string) => void;
  /**
   * สร้าง Revision ใหม่จากเอกสารที่ confirmed แล้ว
   * - เปลี่ยน status เดิม → 'revised'
   * - สร้าง document ใหม่ revNo+1, status='draft', copy items
   * - บันทึก revision history
   */
  reviseDocument: (id: string, reason: string, revisedBy: string) => StockDocument;
  getDocsByType:  (type: DocType) => StockDocument[];
  getDocById:     (id: string) => StockDocument | undefined;
  /** ดึง chain ทั้งหมดของเอกสาร (ต้นฉบับ + ทุก revision) เรียง revNo */
  getRevisionChain: (id: string) => StockDocument[];
}

const recalc = (doc: Partial<StockDocument>): Partial<StockDocument> => {
  if (!doc.items) return doc;
  return {
    ...doc,
    totalItems:   doc.items.length,
    totalQtyBase: doc.items.reduce((s, i) => s + i.qtyBase, 0),
    totalCost:    doc.items.reduce((s, i) => s + i.qty * i.costPrice, 0),
  };
};

export const useStockDocStore = create<StockDocState>()(
  persist(
    (set, get) => ({
  documents: INITIAL_DOCS,

  addDocument: (doc) => {
    const docNo = generateDocNo(doc.docType, get().documents);
    const newDoc: StockDocument = {
      ...recalc(doc) as StockDocument,
      id: `doc_${Date.now()}`,
      docNo,
      revNo: 0,
      createdAt: new Date(),
      revisionHistory: [],
      originalDocId: undefined,
    };
    set((s) => ({ documents: [newDoc, ...s.documents] }));
    return newDoc;
  },

  updateDocument: (id, updates) => {
    set((s) => ({
      documents: s.documents.map((d) => {
        if (d.id !== id) return d;
        return { ...d, ...recalc({ ...d, ...updates }) } as StockDocument;
      }),
    }));
  },

  confirmDocument: (id, confirmedBy) => {
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === id
          ? { ...d, status: 'confirmed', confirmedBy, confirmedAt: new Date() }
          : d
      ),
    }));
  },

  cancelDocument: (id) => {
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === id ? { ...d, status: 'cancelled' } : d
      ),
    }));
  },

  reviseDocument: (id, reason, revisedBy) => {
    const original = get().documents.find((d) => d.id === id);
    if (!original) throw new Error('Document not found');

    const now = new Date();
    const newRevNo = original.revNo + 1;
    const rootId = original.originalDocId ?? original.id;

    // เพิ่ม revision record ใน history
    const revRecord = {
      revNo: newRevNo,
      revisedBy,
      revisedAt: now,
      reason,
      prevDocId: original.id,
    };

    // สร้าง revision document (copy items + meta)
    const revDoc: StockDocument = {
      ...original,
      id: `doc_${Date.now()}`,
      revNo: newRevNo,
      status: 'draft',
      reviseReason: reason,
      originalDocId: rootId,
      createdBy: revisedBy,
      createdAt: now,
      confirmedBy: undefined,
      confirmedAt: undefined,
      revisionHistory: [...original.revisionHistory, revRecord],
      // copy items ใหม่ทุกตัว (id ใหม่)
      items: original.items.map((i) => ({
        ...i,
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      })),
    };
    recalc(revDoc);

    set((s) => ({
      documents: [
        revDoc,
        ...s.documents.map((d) =>
          d.id === id ? { ...d, status: 'revised' as const } : d
        ),
      ],
    }));

    return revDoc;
  },

  getDocsByType: (type) =>
    get().documents.filter((d) => d.docType === type),

  getDocById: (id) =>
    get().documents.find((d) => d.id === id),

  getRevisionChain: (id) => {
    const doc = get().documents.find((d) => d.id === id);
    if (!doc) return [];
    const rootId = doc.originalDocId ?? doc.id;
    return get()
      .documents
      .filter((d) => (d.originalDocId ?? d.id) === rootId)
      .sort((a, b) => a.revNo - b.revNo);
  },
    }),
    { name: 'pos-stockdocs', storage: createJSONStorage(() => persistStorage) }
  )
);
