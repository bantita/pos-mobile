/**
 * masterPorts — ผูกโมดูล masterImportExport (pure) เข้ากับ store จริง
 * (productStore / categoryStore / brandStore / supplierStore / auditLogStore)
 */
import { useProductStore } from '../store/productStore';
import * as categoryStore from '../store/categoryStore';
import * as brandStore from '../store/brandStore';
import * as supplierStore from '../store/supplierStore';
import { logAction } from '../store/auditLogStore';
import {
  ImportContext, MasterEntity, MasterPorts, MigrationPlan, Workbook,
  exportProducts, exportCategories, exportBrands, exportSuppliers, buildTemplate, buildErrorWorkbook,
} from './masterImportExport';
import { FileFormat, downloadBlob, exportFileName, workbookToBlob } from './spreadsheetIO';

export const storePorts: MasterPorts = {
  addProduct: (p) => useProductStore.getState().addProduct(p),
  updateProduct: (id, d) => useProductStore.getState().updateProduct(id, d),
  addCategory: (d) => categoryStore.addCategory(d),
  updateCategory: (id, d) => categoryStore.updateCategory(id, d),
  addBrand: (d) => brandStore.addBrand(d),
  updateBrand: (id, d) => brandStore.updateBrand(id, d),
  addSupplier: (d) => supplierStore.addSupplier(d),
  updateSupplier: (id, d) => supplierStore.updateSupplier(id, d),
  logAction: (module, action, description, metadata) => logAction(module, action, description, metadata),
};

export function getImportContext(): ImportContext {
  return {
    products: useProductStore.getState().products,
    categories: categoryStore.getCategories(),
    brands: brandStore.getBrands(),
    suppliers: supplierStore.getSuppliers(),
  };
}

/** จำนวนรายการในมาสเตอร์ปัจจุบัน */
export function getMasterCount(entity: MasterEntity): number {
  switch (entity) {
    case 'product': return useProductStore.getState().products.length;
    case 'category': return categoryStore.getCategories().length;
    case 'brand': return brandStore.getBrands().length;
    case 'supplier': return supplierStore.getSuppliers().length;
  }
}

/** Workbook สำหรับ export ข้อมูลทั้งหมดของมาสเตอร์ (จำนวนสินค้านับสดจาก productStore) */
export function buildExportWorkbook(entity: MasterEntity): Workbook {
  switch (entity) {
    case 'product':
      return exportProducts(useProductStore.getState().products);
    case 'category': {
      const cats = categoryStore.getCategories();
      return exportCategories(cats, Object.fromEntries(cats.map(c => [c.id, categoryStore.getCategoryProductCount(c.id)])));
    }
    case 'brand': {
      const brands = brandStore.getBrands();
      return exportBrands(brands, Object.fromEntries(brands.map(b => [b.id, brandStore.getBrandProductCount(b.id)])));
    }
    case 'supplier':
      return exportSuppliers(supplierStore.getSuppliers());
  }
}

/** ดาวน์โหลดข้อมูลปัจจุบันทั้งหมดของมาสเตอร์เป็น .xlsx (สำรองก่อนนำเข้า) */
export async function downloadBackup(entity: MasterEntity): Promise<void> {
  const wb = buildExportWorkbook(entity);
  downloadBlob(exportFileName(entity, 'backup', 'xlsx'), await workbookToBlob(entity, wb, 'xlsx'));
}

/** ดาวน์โหลดรายการข้อผิดพลาดจากการนำเข้าเป็น .xlsx */
export async function downloadErrorFile(mp: MigrationPlan): Promise<void> {
  downloadBlob(exportFileName(mp.entity, 'errors', 'xlsx'), await workbookToBlob(mp.entity, buildErrorWorkbook(mp), 'xlsx'));
}

/** ดาวน์โหลดไฟล์ export ทั้งหมด หรือ template ของมาสเตอร์ (เว็บ) */
export async function downloadMasterFile(entity: MasterEntity, kind: 'export' | 'template', fmt: FileFormat): Promise<void> {
  const wb = kind === 'export' ? buildExportWorkbook(entity) : buildTemplate(entity);
  downloadBlob(exportFileName(entity, kind, fmt), await workbookToBlob(entity, wb, fmt));
}
