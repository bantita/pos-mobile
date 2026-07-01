/**
 * Purchase Store — Zustand + Persist
 * M08 Supplier & Purchase
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Supplier, PurchaseRequisition, PurchaseOrder, POReceive,
  PRItem, POReceiveItem,
} from '../types/purchase';
import {
  MOCK_SUPPLIERS, MOCK_PURCHASE_REQUISITIONS,
  MOCK_PURCHASE_ORDERS, MOCK_PO_RECEIVES,
} from '../data/mockPurchase';
import { isFreshStore } from './freshStore';
import { persistStorage } from './persistStorage';

// ─── Helper ───────────────────────────────────────────────────────────────────
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const genDocNo = (prefix: string) => {
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const seq = String(Math.floor(1000 + Math.random() * 9000));
  return `${prefix}-${yyyymm}-${seq}`;
};

// ─── Store ────────────────────────────────────────────────────────────────────
interface PurchaseStore {
  suppliers: Supplier[];
  requisitions: PurchaseRequisition[];
  purchaseOrders: PurchaseOrder[];
  receives: POReceive[];

  // Supplier
  addSupplier: (data: Omit<Supplier, 'id' | 'createdAt'>) => Supplier;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;

  // PR
  createPR: (items: PRItem[], reason: string, requestedBy: string, shopId: string, branchId: string) => PurchaseRequisition;
  approvePR: (id: string, approvedBy: string) => void;

  // PO
  createPO: (data: Omit<PurchaseOrder, 'id' | 'poNo' | 'createdAt'>) => PurchaseOrder;
  approvePO: (id: string, approvedBy: string) => void;

  // Receive
  receivePO: (poId: string, items: POReceiveItem[], receivedBy: string, notes?: string) => POReceive;
}

export const usePurchaseStore = create<PurchaseStore>()(
  persist(
    (set, get) => ({
  suppliers: isFreshStore() ? [] : MOCK_SUPPLIERS,
  requisitions: isFreshStore() ? [] : MOCK_PURCHASE_REQUISITIONS,
  purchaseOrders: isFreshStore() ? [] : MOCK_PURCHASE_ORDERS,
  receives: isFreshStore() ? [] : MOCK_PO_RECEIVES,

  // ─── Supplier ─────────────────────────────────────────────────────────────
  addSupplier: (data) => {
    const newSupplier: Supplier = {
      ...data,
      id: genId(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    set(s => ({ suppliers: [...s.suppliers, newSupplier] }));
    return newSupplier;
  },

  updateSupplier: (id, data) => {
    set(s => ({
      suppliers: s.suppliers.map(sup => sup.id === id ? { ...sup, ...data } : sup),
    }));
  },

  // ─── Purchase Requisition ─────────────────────────────────────────────────
  createPR: (items, reason, requestedBy, shopId, branchId) => {
    const newPR: PurchaseRequisition = {
      id: genId(),
      prNo: genDocNo('PR'),
      status: 'draft',
      items,
      reason,
      requestedBy,
      requestedAt: new Date().toISOString(),
      shopId,
      branchId,
    };
    set(s => ({ requisitions: [...s.requisitions, newPR] }));
    return newPR;
  },

  approvePR: (id, approvedBy) => {
    set(s => ({
      requisitions: s.requisitions.map(pr =>
        pr.id === id
          ? { ...pr, status: 'approved' as const, approvedBy, approvedAt: new Date().toISOString() }
          : pr
      ),
    }));
  },

  // ─── Purchase Order ───────────────────────────────────────────────────────
  createPO: (data) => {
    const newPO: PurchaseOrder = {
      ...data,
      id: genId(),
      poNo: genDocNo('PO'),
      createdAt: new Date().toISOString(),
    };
    set(s => ({ purchaseOrders: [...s.purchaseOrders, newPO] }));
    return newPO;
  },

  approvePO: (id, approvedBy) => {
    set(s => ({
      purchaseOrders: s.purchaseOrders.map(po =>
        po.id === id
          ? { ...po, status: 'approved' as const, approvedBy, approvedAt: new Date().toISOString() }
          : po
      ),
    }));
  },

  // ─── Receive PO ──────────────────────────────────────────────────────────
  receivePO: (poId, items, receivedBy, notes?) => {
    const po = get().purchaseOrders.find(p => p.id === poId);
    if (!po) {
      throw new Error('ไม่พบใบสั่งซื้อ');
    }

    // Update receivedQty in PO items
    const updatedPOItems = po.items.map(poItem => {
      const receiveItem = items.find(ri => ri.productId === poItem.productId);
      if (receiveItem) {
        return { ...poItem, receivedQty: poItem.receivedQty + receiveItem.receiveQty };
      }
      return poItem;
    });

    // Determine new PO status
    const allFullyReceived = updatedPOItems.every(item => item.receivedQty >= item.orderQty);
    const newStatus = allFullyReceived ? 'completed' as const : 'partial_receive' as const;

    // Update PO
    set(s => ({
      purchaseOrders: s.purchaseOrders.map(p =>
        p.id === poId ? { ...p, items: updatedPOItems, status: newStatus } : p
      ),
    }));

    // Create receive record
    const receive: POReceive = {
      id: genId(),
      receiveNo: genDocNo('RCV'),
      poId,
      poNo: po.poNo,
      items,
      receivedBy,
      receivedAt: new Date().toISOString(),
      notes,
    };

    set(s => ({ receives: [...s.receives, receive] }));
    return receive;
  },
    }),
    { name: 'pos-purchase', storage: createJSONStorage(() => persistStorage) }
  )
);
