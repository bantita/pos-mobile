/**
 * API Client — Axios instance with interceptors
 * - Auto-attach auth token
 * - Auto-refresh token on 401
 * - Request/Response logging (dev)
 * - Offline queue support
 */
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ENV } from '@/shared/config/env';

// ─── Create Instance ─────────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ─── Token Management ────────────────────────────────────────────────────────
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
};

export const getAccessToken = () => accessToken;

// ─── Request Interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (ENV.LOG_LEVEL === 'debug') {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    if (ENV.LOG_LEVEL === 'debug') {
      console.log(`[API] ✓ ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Auto-refresh on 401
    if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${ENV.API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        const { accessToken: newAccess, refreshToken: newRefresh } = res.data;
        setTokens(newAccess, newRefresh);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearTokens();
        // Emit event for auth store to handle logout
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        return Promise.reject(refreshError);
      }
    }

    if (ENV.LOG_LEVEL === 'debug') {
      console.error(`[API] ✗ ${error.response?.status || 'NETWORK'} ${originalRequest?.url}`, error.message);
    }

    return Promise.reject(error);
  }
);

export { apiClient };

// ─── Helper Types ────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

// ─── Pagination Params ───────────────────────────────────────────────────────
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
