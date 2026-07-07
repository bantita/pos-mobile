/**
 * Auth API — Login, Register, Token refresh, OTP
 */
import { apiClient, ApiResponse, setTokens, clearTokens } from '@/shared/infrastructure/api/client';

export interface LoginRequest {
  username: string;
  password: string;
  deviceId?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    name: string;
    username: string;
    role: string;
    shopId: string;
    shopName: string;
    branchId: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  phone: string;
  name: string;
  password: string;
  shopName: string;
  shopType?: string;
}

export interface OTPRequest {
  phone: string;
}

export interface OTPVerifyRequest {
  phone: string;
  code: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
    if (res.data.success) {
      setTokens(res.data.data.accessToken, res.data.data.refreshToken);
    }
    return res.data;
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<LoginResponse>> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/register', data);
    if (res.data.success) {
      setTokens(res.data.data.accessToken, res.data.data.refreshToken);
    }
    return res.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },

  requestOTP: async (data: OTPRequest): Promise<ApiResponse<{ refCode: string }>> => {
    const res = await apiClient.post<ApiResponse<{ refCode: string }>>('/auth/otp/request', data);
    return res.data;
  },

  verifyOTP: async (data: OTPVerifyRequest): Promise<ApiResponse<LoginResponse>> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/otp/verify', data);
    if (res.data.success) {
      setTokens(res.data.data.accessToken, res.data.data.refreshToken);
    }
    return res.data;
  },

  forgotPassword: async (phone: string): Promise<ApiResponse<{ message: string }>> => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { phone });
    return res.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', { token, newPassword });
    return res.data;
  },

  getProfile: async (): Promise<ApiResponse<LoginResponse['user']>> => {
    const res = await apiClient.get<ApiResponse<LoginResponse['user']>>('/auth/profile');
    return res.data;
  },
};
