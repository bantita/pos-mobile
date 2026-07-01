/**
 * Sale History Store — Zustand + Persist
 * บันทึกประวัติบิลทุกรายการ
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { logAction } from './auditLogStore';
import { persistStorage } from './persistStorage';
import { CartItem, Payment, Discount } from '../types/sale';
import { isFreshStore } from './freshStore';

export interface SaleRecord {
  id: string;
  saleNo: string;
  items: CartItem[];
  payments: Payment[];
  discount: Discount | null;
  subtotal: number;
  discountTotal: number;
  serviceCharge: number;
  vatAmount: number;
  grandTotal: number;
  receivedAmount: number;
  changeAmount: number;
  memberId?: string;
  memberName?: string;
  pointsEarned?: number;
  cashierName: string;
  posName: string;
  branchName?: string;
  status: 'completed' | 'voided' | 'returned';
  returnedItems?: { productId: string; qty: number; amount: number }[];
  createdAt: Date;
}

interface SaleHistoryState {
  sales: SaleRecord[];
  addSale: (sale: SaleRecord) => void;
  voidSale: (saleNo: string, reason: string) => void;
  returnItems: (saleNo: string, items: { productId: string; qty: number; amount: number }[]) => void;
  getSaleByNo: (saleNo: string) => SaleRecord | undefined;
  searchSales: (keyword: string) => SaleRecord[];
  getSalesToday: () => SaleRecord[];
}

// Mock history
const MOCK_SALES: SaleRecord[] = [
  { id: 's1', saleNo: 'INV20670622001', items: [
    { product: { id: 'p1', code: 'SKU001', barcode: '8851234', name: 'น้ำดื่มสิงห์ 600ml', category: 'เครื่องดื่ม', price: 10, cost: 6, vatIncluded: true, vatRate: 7, unit: 'ขวด', stockQty: 100 }, qty: 5, unitPrice: 10, discountAmount: 0, discountPercent: 0, subtotal: 50 },
    { product: { id: 'p2', code: 'SKU002', barcode: '8851235', name: 'ขนมปังกรอบ 7-11', category: 'ขนม', price: 25, cost: 15, vatIncluded: true, vatRate: 7, unit: 'ห่อ', stockQty: 50 }, qty: 4, unitPrice: 25, discountAmount: 0, discountPercent: 0, subtotal: 100 },
    { product: { id: 'p3', code: 'SKU003', barcode: '8851236', name: 'มาม่า หมูสับ', category: 'อาหาร', price: 7, cost: 5, vatIncluded: true, vatRate: 7, unit: 'ซอง', stockQty: 200 }, qty: 10, unitPrice: 7, discountAmount: 0, discountPercent: 0, subtotal: 70 },
    { product: { id: 'p4', code: 'SKU004', barcode: '8851237', name: 'เลย์ รสออริจินัล', category: 'ขนม', price: 20, cost: 12, vatIncluded: true, vatRate: 7, unit: 'ถุง', stockQty: 80 }, qty: 5, unitPrice: 20, discountAmount: 0, discountPercent: 0, subtotal: 100 },
  ], payments: [{ method: 'cash', amount: 320 }], discount: null, subtotal: 320, discountTotal: 0, serviceCharge: 0, vatAmount: 22.4, grandTotal: 320, receivedAmount: 500, changeAmount: 180, cashierName: 'สมศักดิ์', posName: 'POS 1', status: 'completed', createdAt: new Date('2024-06-22T08:30:00') },
  { id: 's2', saleNo: 'INV20670622002', items: [
    { product: { id: 'p5', code: 'SKU005', barcode: '8851238', name: 'สบู่ Dove ก้อน', category: 'ของใช้', price: 45, cost: 30, vatIncluded: true, vatRate: 7, unit: 'ก้อน', stockQty: 60 }, qty: 3, unitPrice: 45, discountAmount: 0, discountPercent: 0, subtotal: 135 },
    { product: { id: 'p6', code: 'SKU006', barcode: '8851239', name: 'แชมพู Head & Shoulders', category: 'ของใช้', price: 89, cost: 55, vatIncluded: true, vatRate: 7, unit: 'ขวด', stockQty: 40 }, qty: 2, unitPrice: 89, discountAmount: 10, discountPercent: 0, subtotal: 158 },
    { product: { id: 'p7', code: 'SKU007', barcode: '8851240', name: 'ผ้าอ้อม Pampers M', category: 'ของใช้', price: 399, cost: 280, vatIncluded: true, vatRate: 7, unit: 'แพ็ค', stockQty: 25 }, qty: 2, unitPrice: 399, discountAmount: 0, discountPercent: 0, subtotal: 798 },
    { product: { id: 'p8', code: 'SKU008', barcode: '8851241', name: 'นมจืด Meiji 200ml', category: 'เครื่องดื่ม', price: 14, cost: 9, vatIncluded: true, vatRate: 7, unit: 'กล่อง', stockQty: 120 }, qty: 10, unitPrice: 14, discountAmount: 0, discountPercent: 0, subtotal: 140 },
    { product: { id: 'p1', code: 'SKU001', barcode: '8851234', name: 'น้ำดื่มสิงห์ 600ml', category: 'เครื่องดื่ม', price: 10, cost: 6, vatIncluded: true, vatRate: 7, unit: 'ขวด', stockQty: 100 }, qty: 8, unitPrice: 10, discountAmount: 0, discountPercent: 0, subtotal: 80 },
  ], payments: [{ method: 'qr', amount: 1250 }], discount: { type: 'percent', value: 10 }, subtotal: 1389, discountTotal: 139, serviceCharge: 0, vatAmount: 87.5, grandTotal: 1250, receivedAmount: 1250, changeAmount: 0, memberName: 'สมชาย ใจดี', pointsEarned: 50, cashierName: 'สมศักดิ์', posName: 'POS 1', status: 'completed', createdAt: new Date('2024-06-22T09:15:00') },
  { id: 's3', saleNo: 'INV20670622003', items: [
    { product: { id: 'p3', code: 'SKU003', barcode: '8851236', name: 'มาม่า หมูสับ', category: 'อาหาร', price: 7, cost: 5, vatIncluded: true, vatRate: 7, unit: 'ซอง', stockQty: 200 }, qty: 5, unitPrice: 7, discountAmount: 0, discountPercent: 0, subtotal: 35 },
    { product: { id: 'p9', code: 'SKU009', barcode: '8851242', name: 'Pepsi 325ml', category: 'เครื่องดื่ม', price: 15, cost: 9, vatIncluded: true, vatRate: 7, unit: 'กระป๋อง', stockQty: 90 }, qty: 2, unitPrice: 15, discountAmount: 0, discountPercent: 0, subtotal: 30 },
  ], payments: [{ method: 'cash', amount: 89 }], discount: null, subtotal: 89, discountTotal: 0, serviceCharge: 0, vatAmount: 6.23, grandTotal: 89, receivedAmount: 100, changeAmount: 11, cashierName: 'สมหญิง', posName: 'POS 1', status: 'voided', createdAt: new Date('2024-06-22T11:30:00') },
  { id: 's4', saleNo: 'INV20670622004', items: [
    { product: { id: 'p10', code: 'SKU010', barcode: '8851243', name: 'iPhone 15 Case', category: 'อุปกรณ์', price: 590, cost: 250, vatIncluded: true, vatRate: 7, unit: 'ชิ้น', stockQty: 30 }, qty: 2, unitPrice: 590, discountAmount: 0, discountPercent: 0, subtotal: 1180 },
    { product: { id: 'p11', code: 'SKU011', barcode: '8851244', name: 'สายชาร์จ Type-C 1m', category: 'อุปกรณ์', price: 290, cost: 120, vatIncluded: true, vatRate: 7, unit: 'เส้น', stockQty: 45 }, qty: 3, unitPrice: 290, discountAmount: 0, discountPercent: 0, subtotal: 870 },
    { product: { id: 'p12', code: 'SKU012', barcode: '8851245', name: 'หูฟัง Bluetooth TWS', category: 'อุปกรณ์', price: 890, cost: 450, vatIncluded: true, vatRate: 7, unit: 'อัน', stockQty: 15 }, qty: 2, unitPrice: 890, discountAmount: 0, discountPercent: 0, subtotal: 1780 },
  ], payments: [{ method: 'credit', amount: 4500 }], discount: null, subtotal: 4500, discountTotal: 0, serviceCharge: 0, vatAmount: 315, grandTotal: 4500, receivedAmount: 4500, changeAmount: 0, memberName: 'สภาพร แสงทอง', pointsEarned: 180, cashierName: 'สมศักดิ์', posName: 'POS 1', status: 'completed', createdAt: new Date('2024-06-22T14:00:00') },
  { id: 's5', saleNo: 'INV20670621001', items: [
    { product: { id: 'p1', code: 'SKU001', barcode: '8851234', name: 'น้ำดื่มสิงห์ 600ml', category: 'เครื่องดื่ม', price: 10, cost: 6, vatIncluded: true, vatRate: 7, unit: 'ขวด', stockQty: 100 }, qty: 20, unitPrice: 10, discountAmount: 0, discountPercent: 0, subtotal: 200 },
    { product: { id: 'p4', code: 'SKU004', barcode: '8851237', name: 'เลย์ รสออริจินัล', category: 'ขนม', price: 20, cost: 12, vatIncluded: true, vatRate: 7, unit: 'ถุง', stockQty: 80 }, qty: 10, unitPrice: 20, discountAmount: 0, discountPercent: 0, subtotal: 200 },
    { product: { id: 'p6', code: 'SKU006', barcode: '8851239', name: 'แชมพู Head & Shoulders', category: 'ของใช้', price: 89, cost: 55, vatIncluded: true, vatRate: 7, unit: 'ขวด', stockQty: 40 }, qty: 3, unitPrice: 89, discountAmount: 0, discountPercent: 0, subtotal: 267 },
  ], payments: [{ method: 'cash', amount: 750 }], discount: null, subtotal: 750, discountTotal: 0, serviceCharge: 0, vatAmount: 52.5, grandTotal: 750, receivedAmount: 1000, changeAmount: 250, cashierName: 'สมหญิง', posName: 'POS 2', status: 'completed', createdAt: new Date('2024-06-21T10:00:00') },
  { id: 's6', saleNo: 'INV20670621002', items: [
    { product: { id: 'p5', code: 'SKU005', barcode: '8851238', name: 'สบู่ Dove ก้อน', category: 'ของใช้', price: 45, cost: 30, vatIncluded: true, vatRate: 7, unit: 'ก้อน', stockQty: 60 }, qty: 20, unitPrice: 45, discountAmount: 0, discountPercent: 0, subtotal: 900 },
    { product: { id: 'p8', code: 'SKU008', barcode: '8851241', name: 'นมจืด Meiji 200ml', category: 'เครื่องดื่ม', price: 14, cost: 9, vatIncluded: true, vatRate: 7, unit: 'กล่อง', stockQty: 120 }, qty: 50, unitPrice: 14, discountAmount: 0, discountPercent: 0, subtotal: 700 },
    { product: { id: 'p9', code: 'SKU009', barcode: '8851242', name: 'Pepsi 325ml', category: 'เครื่องดื่ม', price: 15, cost: 9, vatIncluded: true, vatRate: 7, unit: 'กระป๋อง', stockQty: 90 }, qty: 20, unitPrice: 15, discountAmount: 0, discountPercent: 0, subtotal: 300 },
  ], payments: [{ method: 'transfer', amount: 2100 }], discount: { type: 'amount', value: 100 }, subtotal: 2200, discountTotal: 100, serviceCharge: 0, vatAmount: 147, grandTotal: 2100, receivedAmount: 2100, changeAmount: 0, cashierName: 'สมศักดิ์', posName: 'POS 1', status: 'returned', returnedItems: [{ productId: 'p5', qty: 2, amount: 90 }], createdAt: new Date('2024-06-21T16:30:00') },
];

export const useSaleHistoryStore = create<SaleHistoryState>()(
  persist(
    (set, get) => ({
      sales: isFreshStore() ? [] : MOCK_SALES,

      addSale: (sale) => { set(s => ({ sales: [sale, ...s.sales] })); logAction('POS', 'ขายสินค้า', `บิล ${sale.saleNo} ยอด ฿${sale.grandTotal}`, { saleNo: sale.saleNo, grandTotal: sale.grandTotal }); },

      voidSale: (saleNo, reason) => { set(s => ({ sales: s.sales.map(sale => sale.saleNo === saleNo ? { ...sale, status: 'voided' as const } : sale) })); logAction('POS', 'ยกเลิกบิล', `ยกเลิก ${saleNo} — ${reason}`, { saleNo, reason }); },

      returnItems: (saleNo, items) => { set(s => ({ sales: s.sales.map(sale => sale.saleNo === saleNo ? { ...sale, status: 'returned' as const, returnedItems: items } : sale) })); logAction('POS', 'คืนสินค้า', `คืนสินค้า ${saleNo} (${items.length} รายการ)`, { saleNo, items }); },

      getSaleByNo: (saleNo) => get().sales.find(s => s.saleNo === saleNo),

      searchSales: (keyword) => {
        const k = keyword.toLowerCase();
        return get().sales.filter(s =>
          s.saleNo.toLowerCase().includes(k) ||
          s.memberName?.toLowerCase().includes(k) ||
          s.cashierName.toLowerCase().includes(k)
        );
      },

      getSalesToday: () => {
        const today = new Date().toDateString();
        return get().sales.filter(s => new Date(s.createdAt).toDateString() === today);
      },
    }),
    { name: 'pos-sale-history', storage: createJSONStorage(() => persistStorage) }
  )
);
