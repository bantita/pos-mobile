/**
 * Sync API — Offline sync, conflict resolution
 */
import { apiClient, ApiResponse } from '@/shared/infrastructure/api/client';

export interface SyncPayload {
  deviceId: string;
  deviceName: string;
  transactions: {
    id: string;
    entityType: string;
    entityId: string;
    action: 'create' | 'update' | 'delete';
    payload: Record<string, any>;
    createdAt: string;
  }[];
}

export interface SyncResult {
  synced: number;
  failed: number;
  conflicts: {
    transactionId: string;
    entityType: string;
    field: string;
    clientValue: any;
    serverValue: any;
    serverUpdatedAt: string;
  }[];
}

export interface ConflictResolveRequest {
  transactionId: string;
  resolution: 'use_client' | 'use_server' | 'manual';
  manualValue?: any;
}

export const syncApi = {
  // ─── Push local changes to server ─────────────────────────────────────────
  push: async (data: SyncPayload): Promise<ApiResponse<SyncResult>> => {
    const res = await apiClient.post<ApiResponse<SyncResult>>('/sync/push', data);
    return res.data;
  },

  // ─── Pull server changes since timestamp ───────────────────────────────────
  pull: async (since: string, entityTypes?: string[]): Promise<ApiResponse<{
    changes: { entityType: string; entityId: string; action: string; data: any; updatedAt: string }[];
    serverTime: string;
  }>> => {
    const res = await apiClient.get<ApiResponse<any>>('/sync/pull', {
      params: { since, entityTypes: entityTypes?.join(',') },
    });
    return res.data;
  },

  // ─── Resolve conflict ──────────────────────────────────────────────────────
  resolveConflict: async (data: ConflictResolveRequest): Promise<ApiResponse<{ resolved: boolean }>> => {
    const res = await apiClient.post<ApiResponse<{ resolved: boolean }>>('/sync/resolve', data);
    return res.data;
  },

  // ─── Get device sync status ────────────────────────────────────────────────
  getStatus: async (deviceId: string): Promise<ApiResponse<{
    lastSyncAt: string;
    pendingCount: number;
    conflictCount: number;
  }>> => {
    const res = await apiClient.get<ApiResponse<any>>(`/sync/status/${deviceId}`);
    return res.data;
  },
};
