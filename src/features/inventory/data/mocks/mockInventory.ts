import {
  StockItem, Warehouse, Supplier, StockTransaction,
} from '@/features/inventory/domain/inventory';

export const MOCK_WAREHOUSES: Warehouse[] = [
  { id: 'wh1', name: 'คลังหลัก',    branchId: 'b1', branchName: 'สาขาหลัก', type: 'main' },
  { id: 'wh2', name: 'POS 1',       branchId: 'b1', branchName: 'สาขาหลัก', type: 'pos'  },
  { id: 'wh3', name: 'POS 2',       branchId: 'b1', branchName: 'สาขาหลัก', type: 'pos'  },
  { id: 'wh4', name: 'คลังสาขา 2', branchId: 'b2', branchName: 'สาขา 2',   type: 'main' },
];

export const MOCK_SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'บริษัท สิงห์ คอร์เปอเรชั่น',  taxId: '0105563000001', phone: '021234567', contactName: 'คุณสมชาย' },
  { id: 's2', name: 'บริษัท เป๊ปซี่-โคล่า ไทย',    taxId: '0105563000002', phone: '021234568', contactName: 'คุณสมหญิง' },
  { id: 's3', name: 'ห้างหุ้นส่วน ABC ซัพพลาย',     taxId: '0105563000003', phone: '081234567', contactName: 'คุณมานะ' },
  { id: 's4', name: 'ร้านค้าส่ง ใจดี',              phone: '089999999' },
];

export const MOCK_STOCK: StockItem[] = [
  { productId: 'p1', productCode: 'P001', productName: 'น้ำดื่มสิงห์ 600ml',        categoryName: 'เครื่องดื่ม', warehouseId: 'wh1', warehouseName: 'คลังหลัก',    onHandQty: 100, minStock: 20,  unit: 'ขวด',     costPrice: 6,  salePrice: 10, lastUpdated: new Date() },
  { productId: 'p2', productCode: 'P002', productName: 'น้ำอัดลม Pepsi 325ml',      categoryName: 'เครื่องดื่ม', warehouseId: 'wh1', warehouseName: 'คลังหลัก',    onHandQty: 50,  minStock: 10,  unit: 'กระป๋อง', costPrice: 9,  salePrice: 15, lastUpdated: new Date() },
  { productId: 'p3', productCode: 'P003', productName: 'ขนมปังกรอบ 7-11',           categoryName: 'อาหาร',       warehouseId: 'wh1', warehouseName: 'คลังหลัก',    onHandQty: 30,  minStock: 10,  unit: 'ชิ้น',    costPrice: 18, salePrice: 25, lastUpdated: new Date() },
  { productId: 'p4', productCode: 'P004', productName: 'มาม่า หมูสับ',              categoryName: 'อาหาร',       warehouseId: 'wh1', warehouseName: 'คลังหลัก',    onHandQty: 200, minStock: 50,  unit: 'ซอง',     costPrice: 4,  salePrice: 7,  lastUpdated: new Date() },
  { productId: 'p5', productCode: 'P005', productName: 'เลย์ รสออริจินัล',          categoryName: 'ขนม',         warehouseId: 'wh1', warehouseName: 'คลังหลัก',    onHandQty: 70,  minStock: 15,  unit: 'ถุง',     costPrice: 14, salePrice: 20, lastUpdated: new Date() },
  { productId: 'p6', productCode: 'P006', productName: 'สบู่ Dove ก้อน',            categoryName: 'ของใช้',      warehouseId: 'wh1', warehouseName: 'คลังหลัก',    onHandQty: 3,   minStock: 10,  unit: 'ก้อน',    costPrice: 30, salePrice: 45, lastUpdated: new Date() },
  { productId: 'p7', productCode: 'P007', productName: 'แชมพู Head & Shoulders',    categoryName: 'ของใช้',      warehouseId: 'wh1', warehouseName: 'คลังหลัก',    onHandQty: 2,   minStock: 5,   unit: 'ขวด',     costPrice: 65, salePrice: 89, lastUpdated: new Date() },
  { productId: 'p1', productCode: 'P001', productName: 'น้ำดื่มสิงห์ 600ml',        categoryName: 'เครื่องดื่ม', warehouseId: 'wh2', warehouseName: 'POS 1',       onHandQty: 24,  minStock: 6,   unit: 'ขวด',     costPrice: 6,  salePrice: 10, lastUpdated: new Date() },
  { productId: 'p4', productCode: 'P004', productName: 'มาม่า หมูสับ',              categoryName: 'อาหาร',       warehouseId: 'wh2', warehouseName: 'POS 1',       onHandQty: 48,  minStock: 12,  unit: 'ซอง',     costPrice: 4,  salePrice: 7,  lastUpdated: new Date() },
];

export const MOCK_TRANSACTIONS: StockTransaction[] = [
  { id: 't1', type: 'receive', productId: 'p1', productName: 'น้ำดื่มสิงห์ 600ml',  productCode: 'P001', qty: +50, beforeQty: 50,  afterQty: 100, unitLabel: 'ขวด',     cost: 6,  warehouseId: 'wh1', warehouseName: 'คลังหลัก', documentNo: 'RCV00045', createdBy: 'สมชาย', createdAt: new Date(Date.now() - 2 * 86400000) },
  { id: 't2', type: 'sale',    productId: 'p1', productName: 'น้ำดื่มสิงห์ 600ml',  productCode: 'P001', qty: -8,  beforeQty: 100, afterQty: 92,  unitLabel: 'ขวด',     warehouseId: 'wh2', warehouseName: 'POS 1',    documentNo: 'INV00122', createdBy: 'สมหญิง', createdAt: new Date(Date.now() - 86400000) },
  { id: 't3', type: 'transfer',productId: 'p1', productName: 'น้ำดื่มสิงห์ 600ml',  productCode: 'P001', qty: -24, beforeQty: 92,  afterQty: 68,  unitLabel: 'ขวด',     warehouseId: 'wh1', warehouseName: 'คลังหลัก', documentNo: 'TRF00012', createdBy: 'สมชาย', createdAt: new Date(Date.now() - 3600000) },
  { id: 't4', type: 'adjust',  productId: 'p6', productName: 'สบู่ Dove ก้อน',      productCode: 'P006', qty: -2,  beforeQty: 5,   afterQty: 3,   unitLabel: 'ก้อน',    reason: 'เสียหาย', warehouseId: 'wh1', warehouseName: 'คลังหลัก', documentNo: 'ADJ00008', createdBy: 'ผู้จัดการ', createdAt: new Date(Date.now() - 7200000) },
  { id: 't5', type: 'count',   productId: 'p4', productName: 'มาม่า หมูสับ',        productCode: 'P004', qty: +5,  beforeQty: 195, afterQty: 200, unitLabel: 'ซอง',     warehouseId: 'wh1', warehouseName: 'คลังหลัก', documentNo: 'CNT00003', createdBy: 'พนักงาน', createdAt: new Date(Date.now() - 10800000) },
];
