/**
 * Member API — CRM สมาชิก, คะแนน, ระดับ
 */
import { apiClient, ApiResponse, PaginationParams } from '@/shared/infrastructure/api/client';

export interface MemberDTO {
  id: string;
  memberNo: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  level: 'member' | 'silver' | 'gold' | 'platinum' | 'vip';
  pointBalance: number;
  totalSpent: number;
  visitCount: number;
  lastVisitDate?: string;
  joinDate: string;
  isActive: boolean;
  lineUserId?: string;
  tags?: string[];
}

export interface PointTransactionDTO {
  id: string;
  memberId: string;
  type: 'earn' | 'redeem' | 'expire' | 'adjust';
  points: number;
  description: string;
  refNo: string;
  createdAt: string;
  createdBy: string;
}

export interface MemberFilter extends PaginationParams {
  level?: string;
  isActive?: boolean;
  hasLine?: boolean;
  tag?: string;
}

export const memberApi = {
  // ─── Members ───────────────────────────────────────────────────────────────
  getAll: async (params?: MemberFilter): Promise<ApiResponse<MemberDTO[]>> => {
    const res = await apiClient.get<ApiResponse<MemberDTO[]>>('/members', { params });
    return res.data;
  },

  getById: async (id: string): Promise<ApiResponse<MemberDTO>> => {
    const res = await apiClient.get<ApiResponse<MemberDTO>>(`/members/${id}`);
    return res.data;
  },

  getByPhone: async (phone: string): Promise<ApiResponse<MemberDTO | null>> => {
    const res = await apiClient.get<ApiResponse<MemberDTO | null>>('/members/phone', { params: { phone } });
    return res.data;
  },

  create: async (data: Omit<MemberDTO, 'id' | 'memberNo' | 'pointBalance' | 'totalSpent' | 'visitCount' | 'joinDate'>): Promise<ApiResponse<MemberDTO>> => {
    const res = await apiClient.post<ApiResponse<MemberDTO>>('/members', data);
    return res.data;
  },

  update: async (id: string, data: Partial<MemberDTO>): Promise<ApiResponse<MemberDTO>> => {
    const res = await apiClient.put<ApiResponse<MemberDTO>>(`/members/${id}`, data);
    return res.data;
  },

  // ─── Points ────────────────────────────────────────────────────────────────
  earnPoints: async (memberId: string, data: {
    points: number;
    saleId: string;
    saleAmount: number;
    description?: string;
  }): Promise<ApiResponse<PointTransactionDTO>> => {
    const res = await apiClient.post<ApiResponse<PointTransactionDTO>>(`/members/${memberId}/points/earn`, data);
    return res.data;
  },

  redeemPoints: async (memberId: string, data: {
    points: number;
    saleId?: string;
    description?: string;
  }): Promise<ApiResponse<PointTransactionDTO>> => {
    const res = await apiClient.post<ApiResponse<PointTransactionDTO>>(`/members/${memberId}/points/redeem`, data);
    return res.data;
  },

  getPointHistory: async (memberId: string, params?: PaginationParams): Promise<ApiResponse<PointTransactionDTO[]>> => {
    const res = await apiClient.get<ApiResponse<PointTransactionDTO[]>>(`/members/${memberId}/points/history`, { params });
    return res.data;
  },

  adjustPoints: async (memberId: string, data: {
    points: number;
    reason: string;
  }): Promise<ApiResponse<PointTransactionDTO>> => {
    const res = await apiClient.post<ApiResponse<PointTransactionDTO>>(`/members/${memberId}/points/adjust`, data);
    return res.data;
  },

  // ─── Segments ──────────────────────────────────────────────────────────────
  getSegments: async (): Promise<ApiResponse<{ id: string; name: string; conditions: string; memberCount: number }[]>> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/members/segments');
    return res.data;
  },
};
