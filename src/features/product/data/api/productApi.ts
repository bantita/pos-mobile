/**
 * Product API — CRUD สินค้า, หมวดหมู่, UOM, ราคา
 */
import { apiClient, ApiResponse, PaginationParams } from '@/shared/infrastructure/api/client';

export interface ProductDTO {
  id: string;
  code: string;
  barcode?: string;
  name: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  salePrice: number;
  costPrice: number;
  stockQty: number;
  minStockQty: number;
  imageUrl?: string;
  isActive: boolean;
  uoms: ProductUOM[];
}

export interface ProductUOM {
  id: string;
  unit: string;
  ratio: number;
  barcode?: string;
  salePrice: number;
  costPrice: number;
}

export interface CategoryDTO {
  id: string;
  name: string;
  color: string;
  productCount: number;
}

export interface ProductFilter extends PaginationParams {
  categoryId?: string;
  isActive?: boolean;
  lowStock?: boolean;
}

export const productApi = {
  // ─── Products ──────────────────────────────────────────────────────────────
  getAll: async (params?: ProductFilter): Promise<ApiResponse<ProductDTO[]>> => {
    const res = await apiClient.get<ApiResponse<ProductDTO[]>>('/products', { params });
    return res.data;
  },

  getById: async (id: string): Promise<ApiResponse<ProductDTO>> => {
    const res = await apiClient.get<ApiResponse<ProductDTO>>(`/products/${id}`);
    return res.data;
  },

  getByBarcode: async (barcode: string): Promise<ApiResponse<ProductDTO>> => {
    const res = await apiClient.get<ApiResponse<ProductDTO>>('/products/barcode', { params: { barcode } });
    return res.data;
  },

  create: async (data: Omit<ProductDTO, 'id' | 'stockQty' | 'categoryName'>): Promise<ApiResponse<ProductDTO>> => {
    const res = await apiClient.post<ApiResponse<ProductDTO>>('/products', data);
    return res.data;
  },

  update: async (id: string, data: Partial<ProductDTO>): Promise<ApiResponse<ProductDTO>> => {
    const res = await apiClient.put<ApiResponse<ProductDTO>>(`/products/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(`/products/${id}`);
    return res.data;
  },

  // ─── Categories ────────────────────────────────────────────────────────────
  getCategories: async (): Promise<ApiResponse<CategoryDTO[]>> => {
    const res = await apiClient.get<ApiResponse<CategoryDTO[]>>('/products/categories');
    return res.data;
  },

  createCategory: async (data: { name: string; color: string }): Promise<ApiResponse<CategoryDTO>> => {
    const res = await apiClient.post<ApiResponse<CategoryDTO>>('/products/categories', data);
    return res.data;
  },

  // ─── Pricing ───────────────────────────────────────────────────────────────
  updatePrice: async (productId: string, data: { salePrice: number; costPrice?: number }): Promise<ApiResponse<ProductDTO>> => {
    const res = await apiClient.patch<ApiResponse<ProductDTO>>(`/products/${productId}/price`, data);
    return res.data;
  },

  bulkUpdatePrice: async (items: { productId: string; salePrice: number }[]): Promise<ApiResponse<{ updated: number }>> => {
    const res = await apiClient.post<ApiResponse<{ updated: number }>>('/products/price/bulk', { items });
    return res.data;
  },
};
