export interface DashboardSummary {
  todaySales: number;
  todayBillCount: number;
  todayProfit: number;
  monthSales: number;
  topProducts: { name: string; qty: number; amount: number }[];
  lowStockProducts: { name: string; stockQty: number; minStock: number }[];
  syncStatus: 'synced' | 'pending' | 'failed';
  pendingCount: number;
}

export interface ShiftSummary {
  shiftStart: Date;
  salesAmount: number;
  billCount: number;
  cashierName: string;
  posName: string;
}

export type SyncItemStatus = 'pending' | 'syncing' | 'success' | 'failed';
export type SyncItemType = 'sale' | 'stock' | 'product' | 'payment';

export interface SyncQueueItem {
  id: string;
  type: SyncItemType;
  documentNo: string;
  description: string;
  status: SyncItemStatus;
  createdAt: Date;
  retryCount: number;
  errorMessage?: string;
}
