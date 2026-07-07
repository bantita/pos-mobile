export type DateRangePreset = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  from: Date;
  to: Date;
}

// ─── Sales Report ─────────────────────────────────────────────────────────────
export interface SalesSummary {
  totalSales: number;
  totalBills: number;
  totalDiscount: number;
  totalVat: number;
  netSales: number;
  avgPerBill: number;
  cashAmount: number;
  transferAmount: number;
  qrAmount: number;
  creditAmount: number;
  ewalletAmount: number;
  cancelledBills: number;
  cancelledAmount: number;
}

export interface SalesByPeriod {
  label: string;       // วัน / สัปดาห์ / เดือน
  date: Date;
  sales: number;
  bills: number;
  profit: number;
}

export interface SalesByCategory {
  categoryName: string;
  sales: number;
  qty: number;
  percent: number;
}

export interface SalesByCashier {
  cashierName: string;
  posName: string;
  sales: number;
  bills: number;
  avgPerBill: number;
}

// ─── Product Report ───────────────────────────────────────────────────────────
export interface ProductSalesItem {
  productCode: string;
  productName: string;
  categoryName: string;
  brandName?: string;
  unitsSold: number;
  unit: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  rank: number;
}

// ─── Inventory Report ─────────────────────────────────────────────────────────
export interface StockOnHandItem {
  productCode: string;
  productName: string;
  categoryName: string;
  warehouseName: string;
  onHandQty: number;
  minStock: number;
  unit: string;
  costPrice: number;
  inventoryValue: number;
  status: 'ok' | 'low' | 'out' | 'dead';
  lastMovement?: Date;
  turnover?: number;   // รอบหมุนเวียน
}

export interface InventorySummary {
  totalSKU: number;
  lowStockSKU: number;
  outOfStockSKU: number;
  deadStockSKU: number;
  totalInventoryValue: number;
}

// ─── Profit Report ────────────────────────────────────────────────────────────
export interface ProfitByPeriod {
  label: string;
  date: Date;
  revenue: number;
  cost: number;
  grossProfit: number;
  margin: number;
}

export interface ProfitByProduct {
  productName: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  qty: number;
}

// ─── Enterprise Report ────────────────────────────────────────────────────────
export interface BranchKPI {
  branchId: string;
  branchName: string;
  sales: number;
  bills: number;
  profit: number;
  margin: number;
  avgPerBill: number;
  inventoryValue: number;
  inventoryTurnover: number;
  gmroi: number;
}

export interface POSPerformance {
  posName: string;
  branchName: string;
  cashierName: string;
  sales: number;
  bills: number;
  avgPerBill: number;
}
