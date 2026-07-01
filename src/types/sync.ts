/**
 * M11 — Offline First & Sync Types
 */

export type SyncStatus = 'pending' | 'syncing' | 'success' | 'failed' | 'conflict';
export type SyncEntityType = 'sale' | 'payment' | 'stock_receive' | 'stock_issue' | 'stock_adjust' | 'product' | 'customer';
export type ConflictResolution = 'server_wins' | 'client_wins' | 'manual_merge';

export interface LocalTransaction {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  documentNo: string;
  description: string;
  payload: Record<string, unknown>;  // raw data
  status: SyncStatus;
  deviceId: string;
  deviceName: string;
  createdBy: string;
  createdAt: Date;
  syncAttempts: number;
  lastAttemptAt?: Date;
  syncedAt?: Date;
  errorMessage?: string;
  conflictData?: ConflictData;
}

export interface ConflictData {
  clientValue: string;
  serverValue: string;
  field: string;
  conflictType: 'duplicate_docno' | 'stock_changed' | 'data_modified' | 'deleted_on_server';
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: ConflictResolution;
}

export interface SyncQueueStats {
  total: number;
  pending: number;
  syncing: number;
  success: number;
  failed: number;
  conflict: number;
  lastSyncAt?: Date;
  nextSyncAt?: Date;
}

export interface DeviceSyncInfo {
  deviceId: string;
  deviceName: string;
  platform: string;
  appVersion: string;
  lastOnlineAt: Date;
  isOnline: boolean;
  pendingCount: number;
}

export const ENTITY_LABELS: Record<SyncEntityType, string> = {
  sale:          'รายการขาย',
  payment:       'ชำระเงิน',
  stock_receive: 'รับสินค้า',
  stock_issue:   'เบิกสินค้า',
  stock_adjust:  'ปรับสต๊อก',
  product:       'สินค้า',
  customer:      'ลูกค้า',
};

export const ENTITY_ICONS: Record<SyncEntityType, string> = {
  sale:          'cart-outline',
  payment:       'card-outline',
  stock_receive: 'arrow-down-circle-outline',
  stock_issue:   'arrow-up-circle-outline',
  stock_adjust:  'create-outline',
  product:       'cube-outline',
  customer:      'person-outline',
};
