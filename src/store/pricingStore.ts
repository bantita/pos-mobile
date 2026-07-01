/**
 * Pricing Store — Zustand + Persist
 * จัดการเอกสารกำหนดราคา (กลาง/สาขา, ถาวร/ชั่วคราว)
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from './persistStorage';
import { PricingDocument, PricingItem, PricingScope, PricingDuration, PricingDocStatus, ResolvedPrice } from '../types/pricing';
import { logAction } from './auditLogStore';

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const genDocNo = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `PRC-${ymd}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_DOCS: PricingDocument[] = [
  {
    id: 'prc-001', docNo: 'PRC-20260601-001', name: 'ราคากลาง มิ.ย. 69',
    description: 'ปรับราคาสินค้าทั่วไป', scope: 'central', duration: 'permanent',
    effectiveDate: '2026-06-01', status: 'active',
    items: [
      { productId: 'P001', productCode: 'P001', productName: 'น้ำดื่มสิงห์ 600ml', unit: 'ขวด', costPrice: 6, originalPrice: 10, newPrice: 12 },
      { productId: 'P002', productCode: 'P002', productName: 'น้ำอัดลม Pepsi 325ml', unit: 'กระป๋อง', costPrice: 9, originalPrice: 15, newPrice: 15 },
      { productId: 'P004', productCode: 'P004', productName: 'มาม่า หมูสับ', unit: 'ซอง', costPrice: 5, originalPrice: 7, newPrice: 8 },
    ],
    createdBy: 'admin', createdAt: '2026-05-28T10:00:00Z',
  },
  {
    id: 'prc-002', docNo: 'PRC-20260615-001', name: 'โปรซัมเมอร์ สาขาหลัก',
    description: 'ราคาพิเศษช่วงซัมเมอร์ เฉพาะสาขาหลัก', scope: 'branch', branchId: 'branch-01', branchName: 'สาขาหลัก',
    duration: 'temporary', effectiveDate: '2026-06-15', expiryDate: '2026-07-15', status: 'active',
    items: [
      { productId: 'P001', productCode: 'P001', productName: 'น้ำดื่มสิงห์ 600ml', unit: 'ขวด', costPrice: 6, originalPrice: 12, newPrice: 9, remark: 'ลดราคาซัมเมอร์' },
      { productId: 'P003', productCode: 'P003', productName: 'ขนมปังกรอบ 7-11', unit: 'ชิ้น', costPrice: 15, originalPrice: 25, newPrice: 20 },
    ],
    createdBy: 'admin', createdAt: '2026-06-14T09:00:00Z',
  },
  {
    id: 'prc-003', docNo: 'PRC-20260620-001', name: 'ราคาสาขาท่องเที่ยว',
    description: 'ราคาพิเศษสำหรับสาขาที่ตั้งในแหล่งท่องเที่ยว', scope: 'branch', branchId: 'branch-02', branchName: 'สาขา เกาะสมุย',
    duration: 'permanent', effectiveDate: '2026-06-20', status: 'active',
    items: [
      { productId: 'P001', productCode: 'P001', productName: 'น้ำดื่มสิงห์ 600ml', unit: 'ขวด', costPrice: 6, originalPrice: 12, newPrice: 15, remark: 'ราคาท่องเที่ยว' },
      { productId: 'P002', productCode: 'P002', productName: 'น้ำอัดลม Pepsi 325ml', unit: 'กระป๋อง', costPrice: 9, originalPrice: 15, newPrice: 20 },
    ],
    createdBy: 'admin', createdAt: '2026-06-19T14:00:00Z',
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────
interface PricingState {
  documents: PricingDocument[];

  // CRUD
  createDocument: (data: Omit<PricingDocument, 'id' | 'docNo' | 'createdAt' | 'status'>) => PricingDocument;
  updateDocument: (id: string, data: Partial<PricingDocument>) => void;
  deleteDocument: (id: string) => void;
  cancelDocument: (id: string) => void;
  copyDocument: (id: string, newName: string) => PricingDocument;

  // Query
  getDocsByScope: (scope: PricingScope) => PricingDocument[];
  getDocsByBranch: (branchId: string) => PricingDocument[];
  getActiveDocsByBranch: (branchId: string) => PricingDocument[];

  // Price Resolution (POS ใช้ราคาไหน?)
  resolvePrice: (productId: string, branchId?: string) => ResolvedPrice | null;
  resolvePriceList: (branchId?: string) => ResolvedPrice[];

  // Import
  importItems: (docId: string, items: PricingItem[]) => void;
}

export const usePricingStore = create<PricingState>()(
  persist(
    (set, get) => ({
      documents: MOCK_DOCS,

      createDocument: (data) => {
        const doc: PricingDocument = {
          ...data,
          id: genId(),
          docNo: genDocNo(),
          status: 'draft',
          createdAt: new Date().toISOString(),
        };
        set(s => ({ documents: [doc, ...s.documents] }));
        logAction('กำหนดราคา', 'สร้างเอกสาร', `สร้าง "${doc.name}" (${doc.docNo}) — ${doc.scope === 'central' ? 'ราคากลาง' : `สาขา: ${doc.branchName}`} ${doc.duration === 'permanent' ? 'ถาวร' : 'ชั่วคราว'}`, { docId: doc.id });
        return doc;
      },

      updateDocument: (id, data) => {
        set(s => ({
          documents: s.documents.map(d => d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString() } : d),
        }));
        logAction('กำหนดราคา', 'แก้ไขเอกสาร', `แก้ไข ${id}`, { docId: id, changes: data });
      },

      deleteDocument: (id) => {
        set(s => ({ documents: s.documents.filter(d => d.id !== id) }));
        logAction('กำหนดราคา', 'ลบเอกสาร', `ลบ ${id}`);
      },

      cancelDocument: (id) => {
        set(s => ({
          documents: s.documents.map(d => d.id === id ? { ...d, status: 'cancelled' as const } : d),
        }));
        logAction('กำหนดราคา', 'ยกเลิกเอกสาร', `ยกเลิก ${id}`);
      },

      copyDocument: (id, newName) => {
        const source = get().documents.find(d => d.id === id);
        if (!source) throw new Error('ไม่พบเอกสารต้นฉบับ');
        const doc: PricingDocument = {
          ...source,
          id: genId(),
          docNo: genDocNo(),
          name: newName,
          status: 'draft',
          copiedFrom: source.docNo,
          createdAt: new Date().toISOString(),
          updatedAt: undefined,
        };
        set(s => ({ documents: [doc, ...s.documents] }));
        logAction('กำหนดราคา', 'คัดลอกเอกสาร', `คัดลอก "${source.name}" → "${newName}"`);
        return doc;
      },

      getDocsByScope: (scope) => get().documents.filter(d => d.scope === scope),

      getDocsByBranch: (branchId) => get().documents.filter(d => d.scope === 'branch' && d.branchId === branchId),

      getActiveDocsByBranch: (branchId) => {
        const today = new Date().toISOString().slice(0, 10);
        return get().documents.filter(d => {
          if (d.status !== 'active') return false;
          if (d.effectiveDate > today) return false;
          if (d.duration === 'temporary' && d.expiryDate && d.expiryDate < today) return false;
          if (d.scope === 'branch' && d.branchId !== branchId) return false;
          return d.scope === 'branch' && d.branchId === branchId;
        });
      },

      resolvePrice: (productId, branchId) => {
        const today = new Date().toISOString().slice(0, 10);
        const docs = get().documents.filter(d => {
          if (d.status !== 'active') return false;
          if (d.effectiveDate > today) return false;
          if (d.duration === 'temporary' && d.expiryDate && d.expiryDate < today) return false;
          return true;
        });

        // Priority: branch-temp > branch-perm > central-temp > central-perm
        const priorities: { scope: PricingScope; duration: PricingDuration }[] = [
          { scope: 'branch', duration: 'temporary' },
          { scope: 'branch', duration: 'permanent' },
          { scope: 'central', duration: 'temporary' },
          { scope: 'central', duration: 'permanent' },
        ];

        for (const p of priorities) {
          const matching = docs.filter(d => {
            if (d.scope !== p.scope || d.duration !== p.duration) return false;
            if (p.scope === 'branch' && d.branchId !== branchId) return false;
            return d.items.some(i => i.productId === productId);
          });
          if (matching.length > 0) {
            // ใช้เอกสารที่ effectiveDate ล่าสุด
            matching.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
            const doc = matching[0];
            const item = doc.items.find(i => i.productId === productId)!;
            return {
              productId,
              productName: item.productName,
              price: item.newPrice,
              sourceDocNo: doc.docNo,
              sourceType: doc.scope,
              sourceDuration: doc.duration,
            };
          }
        }
        return null;
      },

      resolvePriceList: (branchId) => {
        const allProductIds = new Set<string>();
        get().documents.forEach(d => d.items.forEach(i => allProductIds.add(i.productId)));
        const results: ResolvedPrice[] = [];
        for (const pid of allProductIds) {
          const resolved = get().resolvePrice(pid, branchId);
          if (resolved) results.push(resolved);
        }
        return results;
      },

      importItems: (docId, items) => {
        set(s => ({
          documents: s.documents.map(d => d.id === docId ? { ...d, items, updatedAt: new Date().toISOString() } : d),
        }));
        logAction('กำหนดราคา', 'Import', `Import ${items.length} รายการ → ${docId}`);
      },
    }),
    {
      name: 'pos-pricing',
      storage: createJSONStorage(() => persistStorage),
    }
  )
);
