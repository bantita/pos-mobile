import {
  SalesSummary, SalesByPeriod, SalesByCategory, SalesByCashier,
  ProductSalesItem, StockOnHandItem, InventorySummary,
  ProfitByPeriod, ProfitByProduct, BranchKPI, POSPerformance,
} from '../types/reports';

// helper
const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000);

export const MOCK_SALES_SUMMARY: SalesSummary = {
  totalSales: 48320, totalBills: 156, totalDiscount: 1240,
  totalVat: 3156, netSales: 47080, avgPerBill: 309.7,
  cashAmount: 28000, transferAmount: 9500, qrAmount: 7200,
  creditAmount: 3120, ewalletAmount: 500,
  cancelledBills: 3, cancelledAmount: 890,
};

export const MOCK_SALES_BY_DAY: SalesByPeriod[] = Array.from({ length: 7 }, (_, i) => ({
  label: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][new Date(d(6 - i)).getDay()],
  date: d(6 - i),
  sales: [4200, 5100, 6300, 4800, 7200, 9800, 8500][i],
  bills: [14, 17, 21, 16, 24, 33, 28][i],
  profit: [1050, 1275, 1575, 1200, 1800, 2450, 2125][i],
}));

export const MOCK_SALES_BY_MONTH: SalesByPeriod[] = [
  { label: 'ม.ค.', date: d(150), sales: 312000, bills: 1020, profit: 78000 },
  { label: 'ก.พ.', date: d(120), sales: 298000, bills:  980, profit: 74500 },
  { label: 'มี.ค.', date: d(90),  sales: 325000, bills: 1060, profit: 81250 },
  { label: 'เม.ย.', date: d(60),  sales: 280000, bills:  920, profit: 70000 },
  { label: 'พ.ค.', date: d(30),  sales: 342000, bills: 1120, profit: 85500 },
  { label: 'มิ.ย.', date: d(0),   sales: 328000, bills: 1080, profit: 82000 },
];

export const MOCK_SALES_BY_CATEGORY: SalesByCategory[] = [
  { categoryName: 'เครื่องดื่ม', sales: 18500, qty: 1850, percent: 38.3 },
  { categoryName: 'อาหาร',       sales: 12300, qty:  820,  percent: 25.5 },
  { categoryName: 'ขนม',         sales: 9800,  qty: 1225,  percent: 20.3 },
  { categoryName: 'ของใช้',      sales: 7720,  qty:  178,  percent: 16.0 },
];

export const MOCK_SALES_BY_CASHIER: SalesByCashier[] = [
  { cashierName: 'สมชาย ใจดี',    posName: 'POS 1', sales: 24800, bills: 80, avgPerBill: 310 },
  { cashierName: 'สมหญิง รักดี',  posName: 'POS 2', sales: 23520, bills: 76, avgPerBill: 310 },
];

export const MOCK_TOP_PRODUCTS: ProductSalesItem[] = [
  { rank: 1, productCode: 'P001', productName: 'น้ำดื่มสิงห์ 600ml', categoryName: 'เครื่องดื่ม', brandName: 'สิงห์', unitsSold: 1200, unit: 'ขวด', revenue: 12000, cost: 7200, profit: 4800, margin: 40 },
  { rank: 2, productCode: 'P004', productName: 'มาม่า หมูสับ',       categoryName: 'อาหาร',       unitsSold: 980,  unit: 'ซอง',  revenue: 6860,  cost: 3920, profit: 2940, margin: 42.9 },
  { rank: 3, productCode: 'P005', productName: 'เลย์ รสออริจินัล',   categoryName: 'ขนม', brandName: 'เลย์', unitsSold: 760, unit: 'ถุง',  revenue: 15200, cost: 10640, profit: 4560, margin: 30 },
  { rank: 4, productCode: 'P002', productName: 'น้ำอัดลม Pepsi',     categoryName: 'เครื่องดื่ม', brandName: 'เป๊ปซี่', unitsSold: 650, unit: 'กระป๋อง', revenue: 9750, cost: 5850, profit: 3900, margin: 40 },
  { rank: 5, productCode: 'P003', productName: 'ขนมปังกรอบ 7-11',   categoryName: 'อาหาร', unitsSold: 420, unit: 'ชิ้น', revenue: 10500, cost: 7560, profit: 2940, margin: 28 },
  { rank: 6, productCode: 'P007', productName: 'กาแฟ Nescafe',       categoryName: 'เครื่องดื่ม', unitsSold: 380, unit: 'แก้ว', revenue: 4560, cost: 2660, profit: 1900, margin: 41.7 },
  { rank: 7, productCode: 'P006', productName: 'สบู่ Dove ก้อน',    categoryName: 'ของใช้', brandName: 'Unilever', unitsSold: 180, unit: 'ก้อน', revenue: 8100, cost: 5400, profit: 2700, margin: 33.3 },
];

export const MOCK_STOCK_ITEMS: StockOnHandItem[] = [
  { productCode: 'P001', productName: 'น้ำดื่มสิงห์ 600ml',       categoryName: 'เครื่องดื่ม', warehouseName: 'คลังหลัก', onHandQty: 100, minStock: 20,  unit: 'ขวด',     costPrice: 6,   inventoryValue: 600,   status: 'ok',  lastMovement: d(1),  turnover: 12 },
  { productCode: 'P002', productName: 'น้ำอัดลม Pepsi 325ml',     categoryName: 'เครื่องดื่ม', warehouseName: 'คลังหลัก', onHandQty: 50,  minStock: 10,  unit: 'กระป๋อง', costPrice: 9,   inventoryValue: 450,   status: 'ok',  lastMovement: d(1),  turnover: 13 },
  { productCode: 'P003', productName: 'ขนมปังกรอบ 7-11',          categoryName: 'อาหาร',       warehouseName: 'คลังหลัก', onHandQty: 30,  minStock: 10,  unit: 'ชิ้น',    costPrice: 18,  inventoryValue: 540,   status: 'ok',  lastMovement: d(2),  turnover: 8  },
  { productCode: 'P004', productName: 'มาม่า หมูสับ',             categoryName: 'อาหาร',       warehouseName: 'คลังหลัก', onHandQty: 200, minStock: 50,  unit: 'ซอง',     costPrice: 4,   inventoryValue: 800,   status: 'ok',  lastMovement: d(1),  turnover: 15 },
  { productCode: 'P005', productName: 'เลย์ รสออริจินัล',         categoryName: 'ขนม',         warehouseName: 'คลังหลัก', onHandQty: 70,  minStock: 15,  unit: 'ถุง',     costPrice: 14,  inventoryValue: 980,   status: 'ok',  lastMovement: d(1),  turnover: 10 },
  { productCode: 'P006', productName: 'สบู่ Dove ก้อน',           categoryName: 'ของใช้',      warehouseName: 'คลังหลัก', onHandQty: 3,   minStock: 10,  unit: 'ก้อน',    costPrice: 30,  inventoryValue: 90,    status: 'low', lastMovement: d(5),  turnover: 4  },
  { productCode: 'P007', productName: 'แชมพู Head & Shoulders',   categoryName: 'ของใช้',      warehouseName: 'คลังหลัก', onHandQty: 2,   minStock: 5,   unit: 'ขวด',     costPrice: 65,  inventoryValue: 130,   status: 'low', lastMovement: d(7),  turnover: 3  },
  { productCode: 'P008', productName: 'โอรีโอ้ช็อกโกแลต',        categoryName: 'ขนม',         warehouseName: 'คลังหลัก', onHandQty: 0,   minStock: 10,  unit: 'ห่อ',     costPrice: 13,  inventoryValue: 0,     status: 'out', lastMovement: d(14), turnover: 0  },
  { productCode: 'P009', productName: 'ยาสีฟัน Colgate (หมดยุค)', categoryName: 'ของใช้',      warehouseName: 'คลังหลัก', onHandQty: 25,  minStock: 5,   unit: 'หลอด',    costPrice: 45,  inventoryValue: 1125,  status: 'dead',lastMovement: d(90), turnover: 0.5 },
];

export const MOCK_INV_SUMMARY: InventorySummary = {
  totalSKU: 9, lowStockSKU: 2, outOfStockSKU: 1, deadStockSKU: 1,
  totalInventoryValue: MOCK_STOCK_ITEMS.reduce((s, i) => s + i.inventoryValue, 0),
};

export const MOCK_PROFIT_BY_DAY: ProfitByPeriod[] = MOCK_SALES_BY_DAY.map((d) => ({
  label: d.label, date: d.date,
  revenue: d.sales, cost: d.sales * 0.65,
  grossProfit: d.profit, margin: parseFloat(((d.profit / d.sales) * 100).toFixed(1)),
}));

export const MOCK_PROFIT_BY_MONTH: ProfitByPeriod[] = MOCK_SALES_BY_MONTH.map((m) => ({
  label: m.label, date: m.date,
  revenue: m.sales, cost: m.sales * 0.65,
  grossProfit: m.profit, margin: parseFloat(((m.profit / m.sales) * 100).toFixed(1)),
}));

export const MOCK_PROFIT_BY_PRODUCT: ProfitByProduct[] = MOCK_TOP_PRODUCTS.map((p) => ({
  productName: p.productName, revenue: p.revenue, cost: p.cost,
  profit: p.profit, margin: p.margin, qty: p.unitsSold,
}));

export const MOCK_BRANCH_KPI: BranchKPI[] = [
  { branchId: 'b1', branchName: 'สาขาหลัก',    sales: 328000, bills: 1080, profit: 82000, margin: 25.0, avgPerBill: 304, inventoryValue: 4715, inventoryTurnover: 8.2,  gmroi: 17.4 },
  { branchId: 'b2', branchName: 'สาขา 2',       sales: 245000, bills:  820, profit: 61250, margin: 25.0, avgPerBill: 299, inventoryValue: 3620, inventoryTurnover: 7.5,  gmroi: 16.9 },
  { branchId: 'b3', branchName: 'สาขา Online',  sales: 128000, bills:  480, profit: 38400, margin: 30.0, avgPerBill: 267, inventoryValue: 1850, inventoryTurnover: 9.8,  gmroi: 20.8 },
];

export const MOCK_POS_PERFORMANCE: POSPerformance[] = [
  { posName: 'POS 1', branchName: 'สาขาหลัก', cashierName: 'สมชาย ใจดี',   sales: 168000, bills: 560, avgPerBill: 300 },
  { posName: 'POS 2', branchName: 'สาขาหลัก', cashierName: 'สมหญิง รักดี', sales: 160000, bills: 520, avgPerBill: 308 },
  { posName: 'POS 3', branchName: 'สาขา 2',   cashierName: 'มานะ ขยัน',     sales: 245000, bills: 820, avgPerBill: 299 },
];
