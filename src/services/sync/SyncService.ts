/**
 * SyncService — Real Offline Queue with Retry + Exponential Backoff
 * Phase 2: แทน mock setTimeout ด้วย logic จริง
 *
 * หลักการ:
 * 1. เมื่อ app ทำ transaction → addToQueue()
 * 2. ถ้า online → flush ทันที
 * 3. ถ้า offline → เก็บใน queue, retry เมื่อ online กลับมา
 * 4. Retry ใช้ exponential backoff: 1s, 2s, 4s, 8s, 16s (max 5 attempts)
 * 5. ถ้า 5 attempts ยังไม่สำเร็จ → mark as failed, ต้อง manual retry
 */
import { ENV } from '../../config/env';
import { LocalTransaction, SyncStatus, SyncEntityType, ConflictData } from '../../types/sync';

// ─── Config ───────────────────────────────────────────────────────────────────

const MAX_RETRY_ATTEMPTS = 5;
const BASE_DELAY_MS = 1000; // 1 second
const MAX_DELAY_MS = 30000; // 30 seconds
const BATCH_SIZE = 10; // flush 10 items at a time
const AUTO_SYNC_INTERVAL_MS = 60000; // auto-sync ทุก 60 วินาที

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SyncResult {
  success: boolean;
  transactionId: string;
  serverResponse?: unknown;
  error?: string;
  conflict?: ConflictData;
}

export type SyncEventHandler = (event: SyncEvent) => void;

export interface SyncEvent {
  type: 'SYNC_START' | 'SYNC_COMPLETE' | 'SYNC_ERROR' | 'SYNC_CONFLICT' | 'ONLINE_STATUS_CHANGE';
  transactionId?: string;
  data?: unknown;
}

type OnStatusChange = (txId: string, status: SyncStatus, extra?: Partial<LocalTransaction>) => void;

// ─── Endpoint Mapping ─────────────────────────────────────────────────────────

const ENTITY_ENDPOINTS: Record<SyncEntityType, string> = {
  sale: '/sales',
  payment: '/payments',
  stock_receive: '/inventory/receive',
  stock_issue: '/inventory/issue',
  stock_adjust: '/inventory/adjust',
  product: '/products',
  customer: '/members',
};

// ─── Service ──────────────────────────────────────────────────────────────────

export class SyncService {
  private isOnline = true;
  private isSyncing = false;
  private autoSyncTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: SyncEventHandler[] = [];
  private onStatusChange: OnStatusChange;

  constructor(onStatusChange: OnStatusChange) {
    this.onStatusChange = onStatusChange;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  start(): void {
    this.setupNetworkListener();
    this.autoSyncTimer = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.emit({ type: 'SYNC_START' });
      }
    }, AUTO_SYNC_INTERVAL_MS);
  }

  stop(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }

  // ─── Network Detection ──────────────────────────────────────────────────────

  private setupNetworkListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setOnline(true));
      window.addEventListener('offline', () => this.setOnline(false));
      this.isOnline = navigator.onLine;
    }
  }

  setOnline(online: boolean): void {
    const changed = this.isOnline !== online;
    this.isOnline = online;
    if (changed) {
      this.emit({ type: 'ONLINE_STATUS_CHANGE', data: { online } });
    }
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }

  // ─── Flush Queue ────────────────────────────────────────────────────────────

  async flushQueue(pendingTransactions: LocalTransaction[]): Promise<SyncResult[]> {
    if (!this.isOnline || this.isSyncing) return [];
    this.isSyncing = true;
    this.emit({ type: 'SYNC_START' });

    const results: SyncResult[] = [];
    const batch = pendingTransactions
      .filter((tx) => tx.status === 'pending' || tx.status === 'failed')
      .slice(0, BATCH_SIZE);

    for (const tx of batch) {
      // Mark as syncing
      this.onStatusChange(tx.id, 'syncing');

      const result = await this.syncTransaction(tx);
      results.push(result);

      if (result.success) {
        this.onStatusChange(tx.id, 'success', { syncedAt: new Date() });
      } else if (result.conflict) {
        this.onStatusChange(tx.id, 'conflict', {
          conflictData: result.conflict,
          lastAttemptAt: new Date(),
          syncAttempts: tx.syncAttempts + 1,
        });
        this.emit({ type: 'SYNC_CONFLICT', transactionId: tx.id, data: result.conflict });
      } else {
        const newAttempts = tx.syncAttempts + 1;
        const newStatus: SyncStatus = newAttempts >= MAX_RETRY_ATTEMPTS ? 'failed' : 'pending';
        this.onStatusChange(tx.id, newStatus, {
          syncAttempts: newAttempts,
          lastAttemptAt: new Date(),
          errorMessage: result.error,
        });

        if (newStatus === 'pending') {
          // Schedule retry with exponential backoff
          const delay = this.calculateBackoff(newAttempts);
          setTimeout(() => {
            this.emit({ type: 'SYNC_START', transactionId: tx.id });
          }, delay);
        } else {
          this.emit({ type: 'SYNC_ERROR', transactionId: tx.id, data: result.error });
        }
      }
    }

    this.isSyncing = false;
    this.emit({ type: 'SYNC_COMPLETE', data: { processed: results.length } });
    return results;
  }

  // ─── Single Transaction Sync ────────────────────────────────────────────────

  private async syncTransaction(tx: LocalTransaction): Promise<SyncResult> {
    const endpoint = ENTITY_ENDPOINTS[tx.entityType];
    if (!endpoint) {
      return { success: false, transactionId: tx.id, error: `Unknown entity type: ${tx.entityType}` };
    }

    const url = `${ENV.API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Token จะถูก inject จาก authStore ตอน production
        },
        body: JSON.stringify({
          localId: tx.id,
          entityId: tx.entityId,
          documentNo: tx.documentNo,
          payload: tx.payload,
          deviceId: tx.deviceId,
          createdAt: tx.createdAt,
        }),
        signal: AbortSignal.timeout(ENV.API_TIMEOUT),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, transactionId: tx.id, serverResponse: data };
      }

      // Handle conflict (409)
      if (response.status === 409) {
        const conflictBody = await response.json();
        const conflict: ConflictData = {
          field: conflictBody.field ?? 'unknown',
          conflictType: conflictBody.conflictType ?? 'data_modified',
          clientValue: String(conflictBody.clientValue ?? tx.payload),
          serverValue: String(conflictBody.serverValue ?? ''),
        };
        return { success: false, transactionId: tx.id, conflict };
      }

      // Other errors
      const errorText = await response.text().catch(() => response.statusText);
      return {
        success: false,
        transactionId: tx.id,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      return { success: false, transactionId: tx.id, error: message };
    }
  }

  // ─── Retry Single ───────────────────────────────────────────────────────────

  async retrySingle(tx: LocalTransaction): Promise<SyncResult> {
    if (!this.isOnline) {
      return { success: false, transactionId: tx.id, error: 'Device is offline' };
    }
    this.onStatusChange(tx.id, 'syncing');
    const result = await this.syncTransaction(tx);

    if (result.success) {
      this.onStatusChange(tx.id, 'success', { syncedAt: new Date() });
    } else if (result.conflict) {
      this.onStatusChange(tx.id, 'conflict', {
        conflictData: result.conflict,
        lastAttemptAt: new Date(),
        syncAttempts: tx.syncAttempts + 1,
      });
    } else {
      const newAttempts = tx.syncAttempts + 1;
      this.onStatusChange(tx.id, newAttempts >= MAX_RETRY_ATTEMPTS ? 'failed' : 'pending', {
        syncAttempts: newAttempts,
        lastAttemptAt: new Date(),
        errorMessage: result.error,
      });
    }

    return result;
  }

  // ─── Exponential Backoff ────────────────────────────────────────────────────

  private calculateBackoff(attempt: number): number {
    const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_DELAY_MS);
    // Add jitter ±20%
    const jitter = delay * 0.2 * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
  }

  // ─── Event System ───────────────────────────────────────────────────────────

  on(handler: SyncEventHandler): () => void {
    this.listeners.push(handler);
    return () => {
      this.listeners = this.listeners.filter((h) => h !== handler);
    };
  }

  private emit(event: SyncEvent): void {
    this.listeners.forEach((handler) => handler(event));
  }
}

// ─── Singleton (สร้างตอน import ครั้งแรก) ─────────────────────────────────────
let syncServiceInstance: SyncService | null = null;

export function getSyncService(onStatusChange: OnStatusChange): SyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService(onStatusChange);
  }
  return syncServiceInstance;
}
