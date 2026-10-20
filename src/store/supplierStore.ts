/**
 * Supplier Store — Supplier (ผู้จำหน่าย) master CRUD
 * Zustand + Persist — function-API house style (see branchStore.ts)
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Supplier } from '../types/inventory';
import { persistStorage } from './persistStorage';
import { MOCK_SUPPLIERS } from '../data/mockInventory';
import { logAction } from './auditLogStore';

interface SupplierState {
  suppliers: Supplier[];
}

const useSupplierStore = create<SupplierState>()(
  persist(
    () => ({
      suppliers: [...MOCK_SUPPLIERS] as Supplier[],
    }),
    { name: 'pos-suppliers', storage: createJSONStorage(() => persistStorage) }
  )
);

// ─── Supplier CRUD ──────────────────────────────────────────────────────────────
export function getSuppliers(): Supplier[] { return [...useSupplierStore.getState().suppliers]; }
export function getSupplier(id: string): Supplier | undefined { return useSupplierStore.getState().suppliers.find(s => s.id === id); }

export function addSupplier(data: Omit<Supplier, 'id'>): Supplier {
  const supplier: Supplier = { ...data, id: `sup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
  useSupplierStore.setState(s => ({ suppliers: [...s.suppliers, supplier] }));
  logAction('ผู้จำหน่าย', 'เพิ่ม', `เพิ่มผู้จำหน่าย "${supplier.name}"`, { supplierId: supplier.id });
  return supplier;
}

export function updateSupplier(id: string, updates: Partial<Omit<Supplier, 'id'>>): void {
  useSupplierStore.setState(s => ({
    suppliers: s.suppliers.map(sup => sup.id === id ? { ...sup, ...updates } : sup),
  }));
  const name = updates.name ?? getSupplier(id)?.name ?? '';
  logAction('ผู้จำหน่าย', 'แก้ไข', `แก้ไขผู้จำหน่าย "${name}"`, { supplierId: id });
}

export function deleteSupplier(id: string): void {
  const name = getSupplier(id)?.name ?? '';
  useSupplierStore.setState(s => ({
    suppliers: s.suppliers.filter(sup => sup.id !== id),
  }));
  logAction('ผู้จำหน่าย', 'ลบ', `ลบผู้จำหน่าย "${name}"`, { supplierId: id });
}
