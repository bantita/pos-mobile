/**
 * Inventory API — คลังสินค้า, รับ/เบิก, สต๊อก
 */
import { apiClient, ApiResponse, PaginationParams } from '@/shared/infrastructure/api/client';

export interface StockItemDTO {
  productId: string;
  productName: string;
  productCode: string;
  warehouseId: string;
  warehouseName: string;
  onHandQty: number;
  reservedQty: number;
  availableQty: number;
  unit: string;
  costValue: number;
  lastMovementAt?: string;
}

export interface StockDocDTO {
  id: string;
  docNo: string;
  docType: 'receive' | 'issue' | 'adjust' | 'transfer';
  status: 'draft' | 'confirmed' | 'cancelled' | 'revised';
  warehouseId: string;
  warehouseName: string;
  toWarehouseId?: string;
  toWarehouseName?: string;
  supplierId?: string;
  supplierName?: string;
  remark?: string;
  items: StockDocItemDTO[];
  totalItems: number;
  totalQtyBase: number;
  totalCost: number;
  createdBy: string;
  createdAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
}

export interface StockDocItemDTO {
  productId: string;
  productName: string;
  productCode: string;
  qty: number;
  unit: string;
  ratio: number;
  qtyBase: number;
  costPrice: number;
}

export interface WarehouseDTO {
  id: string;
  name: string;
  type: 'main' | 'branch' | 'pos';
  branchId: string;
  branchName: string;
  isDefault: boolean;
}

export interface StockFilter extends PaginationParams {
  warehouseId?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
}

export const inventoryApi = {
  // ─── Stock ─────────────────────────────────────────────────────────────────
  getStock: async (params?: StockFilter): Promise<ApiResponse<StockItemDTO[]>> => {
    const res = await apiClient.get<ApiResponse<StockItemDTO[]>>('/inventory/stock', { params });
    return res.data;
  },

  getStockByProduct: async (productId: string): Promise<ApiResponse<StockItemDTO[]>> => {
    const res = await apiClient.get<ApiResponse<StockItemDTO[]>>(`/inventory/stock/product/${productId}`);
    return res.data;
  },

  // ─── Documents ─────────────────────────────────────────────────────────────
  getDocs: async (params?: PaginationParams & { docType?: string; status?: string }): Promise<ApiResponse<StockDocDTO[]>> => {
    const res = await apiClient.get<ApiResponse<StockDocDTO[]>>('/inventory/documents', { params });
    return res.data;
  },

  getDocById: async (id: string): Promise<ApiResponse<StockDocDTO>> => {
    const res = await apiClient.get<ApiResponse<StockDocDTO>>(`/inventory/documents/${id}`);
    return res.data;
  },

  createDoc: async (data: Omit<StockDocDTO, 'id' | 'docNo' | 'createdAt' | 'confirmedBy' | 'confirmedAt'>): Promise<ApiResponse<StockDocDTO>> => {
    const res = await apiClient.post<ApiResponse<StockDocDTO>>('/inventory/documents', data);
    return res.data;
  },

  confirmDoc: async (id: string): Promise<ApiResponse<StockDocDTO>> => {
    const res = await apiClient.post<ApiResponse<StockDocDTO>>(`/inventory/documents/${id}/confirm`);
    return res.data;
  },

  cancelDoc: async (id: string, reason?: string): Promise<ApiResponse<StockDocDTO>> => {
    const res = await apiClient.post<ApiResponse<StockDocDTO>>(`/inventory/documents/${id}/cancel`, { reason });
    return res.data;
  },

  // ─── Warehouses ────────────────────────────────────────────────────────────
  getWarehouses: async (): Promise<ApiResponse<WarehouseDTO[]>> => {
    const res = await apiClient.get<ApiResponse<WarehouseDTO[]>>('/inventory/warehouses');
    return res.data;
  },
};
