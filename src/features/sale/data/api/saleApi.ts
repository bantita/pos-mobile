/**
 * Sale API — การขาย, บิล, ประวัติ, กะเงิน
 */
import { apiClient, ApiResponse, PaginationParams } from '@/shared/infrastructure/api/client';

export interface SaleItemDTO {
  productId: string;
  productName: string;
  productCode: string;
  qty: number;
  unitPrice: number;
  discount: number;
  total: number;
  unit: string;
  uomId?: string;
  staffId?: string;
  staffName?: string;
}

export interface PaymentDTO {
  method: 'cash' | 'credit' | 'qr' | 'transfer' | 'ewallet';
  amount: number;
  ref?: string;
  change?: number;
}

export interface SaleDTO {
  id: string;
  billNo: string;
  items: SaleItemDTO[];
  payments: PaymentDTO[];
  subtotal: number;
  discount: number;
  total: number;
  received: number;
  change: number;
  memberId?: string;
  memberName?: string;
  pointsEarned?: number;
  pointsRedeemed?: number;
  couponCode?: string;
  promoApplied?: string[];
  note?: string;
  posId: string;
  cashierId: string;
  cashierName: string;
  shiftId: string;
  branchId: string;
  createdAt: string;
  status: 'completed' | 'voided' | 'returned';
}

export interface CreateSaleRequest {
  items: Omit<SaleItemDTO, 'productName' | 'productCode'>[];
  payments: PaymentDTO[];
  memberId?: string;
  pointsRedeemed?: number;
  couponCode?: string;
  note?: string;
  saleMode?: string;
}

export interface ShiftDTO {
  id: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  closingCash?: number;
  totalSales: number;
  totalBills: number;
  cashierId: string;
  cashierName: string;
  posId: string;
  status: 'open' | 'closed';
}

export interface SaleFilter extends PaginationParams {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  cashierId?: string;
  memberId?: string;
}

export const saleApi = {
  // ─── Sales ─────────────────────────────────────────────────────────────────
  create: async (data: CreateSaleRequest): Promise<ApiResponse<SaleDTO>> => {
    const res = await apiClient.post<ApiResponse<SaleDTO>>('/sales', data);
    return res.data;
  },

  getAll: async (params?: SaleFilter): Promise<ApiResponse<SaleDTO[]>> => {
    const res = await apiClient.get<ApiResponse<SaleDTO[]>>('/sales', { params });
    return res.data;
  },

  getById: async (id: string): Promise<ApiResponse<SaleDTO>> => {
    const res = await apiClient.get<ApiResponse<SaleDTO>>(`/sales/${id}`);
    return res.data;
  },

  void: async (id: string, reason: string): Promise<ApiResponse<SaleDTO>> => {
    const res = await apiClient.post<ApiResponse<SaleDTO>>(`/sales/${id}/void`, { reason });
    return res.data;
  },

  return: async (id: string, data: {
    items: { productId: string; qty: number; reason: string }[];
    refundMethod: 'cash' | 'transfer' | 'points';
  }): Promise<ApiResponse<SaleDTO>> => {
    const res = await apiClient.post<ApiResponse<SaleDTO>>(`/sales/${id}/return`, data);
    return res.data;
  },

  // ─── Shift ─────────────────────────────────────────────────────────────────
  openShift: async (openingCash: number): Promise<ApiResponse<ShiftDTO>> => {
    const res = await apiClient.post<ApiResponse<ShiftDTO>>('/shifts/open', { openingCash });
    return res.data;
  },

  closeShift: async (shiftId: string, closingCash: number): Promise<ApiResponse<ShiftDTO>> => {
    const res = await apiClient.post<ApiResponse<ShiftDTO>>(`/shifts/${shiftId}/close`, { closingCash });
    return res.data;
  },

  getCurrentShift: async (): Promise<ApiResponse<ShiftDTO | null>> => {
    const res = await apiClient.get<ApiResponse<ShiftDTO | null>>('/shifts/current');
    return res.data;
  },

  // ─── Daily Summary ─────────────────────────────────────────────────────────
  getDailySummary: async (date: string): Promise<ApiResponse<{
    totalSales: number;
    totalBills: number;
    totalDiscount: number;
    avgPerBill: number;
    paymentBreakdown: Record<string, number>;
    topProducts: { name: string; qty: number; revenue: number }[];
  }>> => {
    const res = await apiClient.get<ApiResponse<any>>('/sales/summary/daily', { params: { date } });
    return res.data;
  },
};
