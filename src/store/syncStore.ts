/**
 * Sync Store — Zustand + Persist
 * M11 Offline First & Sync
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  LocalTransaction, SyncQueueStats, SyncStatus,
  ConflictResolution, DeviceSyncInfo,
} from '../types/sync';
import { isFreshStore } from './freshStore';
import { persistStorage } from './persistStorage';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const now = new Date();
const ago = (m: number) => new Date(now.getTime() - m * 60000);

const MOCK_TRANSACTIONS: LocalTransaction[] = [
  {
    id: 'tx001', entityType: 'sale', entityId: 'sale_1001', documentNo: 'INV2406-0045',
    description: 'ขายสินค้า 3 รายการ ยอด ฿450.00', payload: { total: 450 },
    status: 'failed', deviceId: 'dev001', deviceName: 'POS 1 (iPad)',
    createdBy: 'สมชาย', createdAt: ago(5), syncAttempts: 3, lastAttemptAt: ago(1),
    errorMessage: 'Connection timeout — ไม่สามารถเชื่อมต่อ Server ได้',
  },
  {
    id: 'tx002', entityType: 'payment', entityId: 'pay_1001', documentNo: 'PAY2406-0045',
    description: 'ชำระเงิน QR Code ฿450.00', payload: { method: 'qr', amount: 450 },
    status: 'pending', deviceId: 'dev001', deviceName: 'POS 1 (iPad)',
    createdBy: 'สมชาย', createdAt: ago(5), syncAttempts: 0,
  },
  {
    id: 'tx003', entityType: 'stock_receive', entityId: 'rcv_0012', documentNo: 'RCV2406-0012',
    description: 'รับสินค้าจาก สิงห์ คอร์เปอเรชั่น 2 รายการ', payload: { items: 2 },
    status: 'conflict', deviceId: 'dev002', deviceName: 'POS 2 (iPhone)',
    createdBy: 'มานะ', createdAt: ago(12), syncAttempts: 1, lastAttemptAt: ago(10),
    conflictData: {
      field: 'stockQty',
      conflictType: 'stock_changed',
      clientValue: 'น้ำดื่มสิงห์: 150 ขวด',
      serverValue: 'น้ำดื่มสิงห์: 98 ขวด (มีการขายระหว่างนั้น)',
    },
  },
  {
    id: 'tx004', entityType: 'sale', entityId: 'sale_1000', documentNo: 'INV2406-0044',
    description: 'ขายสินค้า 5 รายการ ยอด ฿1,250.00', payload: { total: 1250 },
    status: 'success', deviceId: 'dev001', deviceName: 'POS 1 (iPad)',
    createdBy: 'สมชาย', createdAt: ago(30), syncAttempts: 1, syncedAt: ago(25),
  },
  {
    id: 'tx005', entityType: 'stock_adjust', entityId: 'adj_0008', documentNo: 'ADJ2406-0008',
    description: 'ปรับสต๊อกสบู่ Dove -2 เหตุผล: เสียหาย', payload: { qty: -2 },
    status: 'success', deviceId: 'dev003', deviceName: 'คลังหลัก (Android)',
    createdBy: 'วิชัย', createdAt: ago(45), syncAttempts: 1, syncedAt: ago(40),
  },
  {
    id: 'tx006', entityType: 'sale', entityId: 'sale_1002', documentNo: 'INV2406-0046',
    description: 'ขายสินค้า 2 รายการ ยอด ฿180.00', payload: { total: 180 },
    status: 'pending', deviceId: 'dev002', deviceName: 'POS 2 (iPhone)',
    createdBy: 'สุดา', createdAt: ago(3), syncAttempts: 0,
  },
  {
    id: 'tx007', entityType: 'product', entityId: 'prd_0042', documentNo: 'PRD-0042',
    description: 'อัปเดตราคาสินค้า: น้ำอัดลม Pepsi ฿12→฿15', payload: { price: 15 },
    status: 'conflict', deviceId: 'dev001', deviceName: 'POS 1 (iPad)',
    createdBy: 'สมชาย', createdAt: ago(20), syncAttempts: 2, lastAttemptAt: ago(8),
    conflictData: {
      field: 'salePrice',
      conflictType: 'data_modified',
      clientValue: '฿15.00 (แก้ไขจาก POS 1)',
      serverValue: '฿14.00 (แก้ไขจาก Back Office เมื่อ 5 นาทีก่อน)',
    },
  },
  {
    id: 'tx008', entityType: 'sale', entityId: 'sale_0999', documentNo: 'INV2406-0043',
    description: 'ขายสินค้า 8 รายการ ยอด ฿3,200.00', payload: { total: 3200 },
    status: 'success', deviceId: 'dev002', deviceName: 'POS 2 (iPhone)',
    createdBy: 'สุดา', createdAt: ago(60), syncAttempts: 1, syncedAt: ago(55),
  },
];

const MOCK_DEVICES: DeviceSyncInfo[] = [
  { deviceId: 'dev001', deviceName: 'POS 1 (iPad)',        platform: 'iOS 17.2',     appVersion: '1.0.0', lastOnlineAt: ago(5),  isOnline: false, pendingCount: 2 },
  { deviceId: 'dev002', deviceName: 'POS 2 (iPhone)',      platform: 'iOS 17.1',     appVersion: '1.0.0', lastOnlineAt: ago(2),  isOnline: true,  pendingCount: 1 },
  { deviceId: 'dev003', deviceName: 'คลังหลัก (Android)', platform: 'Android 14',   appVersion: '1.0.0', lastOnlineAt: ago(0),  isOnline: true,  pendingCount: 0 },
];

// ─── Store ────────────────────────────────────────────────────────────────────
interface SyncState {
  transactions: LocalTransaction[];
  devices: DeviceSyncInfo[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;

  getStats: () => SyncQueueStats;
  retryTransaction: (id: string) => void;
  retryAllFailed: () => void;
  resolveConflict: (id: string, resolution: ConflictResolution, manualValue?: string) => void;
  markSynced: (id: string) => void;
  addTransaction: (tx: Omit<LocalTransaction, 'id' | 'createdAt' | 'syncAttempts'>) => void;
  setOnlineStatus: (online: boolean) => void;
  startSync: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
  transactions: isFreshStore() ? [] : MOCK_TRANSACTIONS,
  devices: isFreshStore() ? [] : MOCK_DEVICES,
  isOnline: true,
  isSyncing: false,
  lastSyncAt: isFreshStore() ? null : ago(25),

  getStats: () => {
    const txs = get().transactions;
    return {
      total:    txs.length,
      pending:  txs.filter(t => t.status === 'pending').length,
      syncing:  txs.filter(t => t.status === 'syncing').length,
      success:  txs.filter(t => t.status === 'success').length,
      failed:   txs.filter(t => t.status === 'failed').length,
      conflict: txs.filter(t => t.status === 'conflict').length,
      lastSyncAt: get().lastSyncAt ?? undefined,
    };
  },

  retryTransaction: (id) => {
    set(s => ({
      transactions: s.transactions.map(t =>
        t.id === id
          ? { ...t, status: 'pending' as SyncStatus, syncAttempts: t.syncAttempts + 1, errorMessage: undefined }
          : t
      ),
    }));
    // simulate async sync
    setTimeout(() => {
      set(s => ({
        transactions: s.transactions.map(t =>
          t.id === id ? { ...t, status: 'success' as SyncStatus, syncedAt: new Date() } : t
        ),
        lastSyncAt: new Date(),
      }));
    }, 1500);
  },

  retryAllFailed: () => {
    set(s => ({
      isSyncing: true,
      transactions: s.transactions.map(t =>
        t.status === 'failed'
          ? { ...t, status: 'syncing' as SyncStatus, syncAttempts: t.syncAttempts + 1 }
          : t
      ),
    }));
    setTimeout(() => {
      set(s => ({
        isSyncing: false,
        lastSyncAt: new Date(),
        transactions: s.transactions.map(t =>
          t.status === 'syncing'
            ? { ...t, status: 'success' as SyncStatus, syncedAt: new Date() }
            : t
        ),
      }));
    }, 2000);
  },

  resolveConflict: (id, resolution, manualValue) => {
    set(s => ({
      transactions: s.transactions.map(t => {
        if (t.id !== id || !t.conflictData) return t;
        const resolvedValue = resolution === 'server_wins'
          ? t.conflictData.serverValue
          : resolution === 'client_wins'
            ? t.conflictData.clientValue
            : manualValue ?? t.conflictData.clientValue;
        return {
          ...t,
          status: 'pending' as SyncStatus,
          conflictData: {
            ...t.conflictData,
            resolution,
            resolvedBy: 'ผู้ใช้',
            resolvedAt: new Date(),
          },
        };
      }),
    }));
    setTimeout(() => {
      set(s => ({
        transactions: s.transactions.map(t =>
          t.id === id && t.status === 'pending'
            ? { ...t, status: 'success' as SyncStatus, syncedAt: new Date() }
            : t
        ),
        lastSyncAt: new Date(),
      }));
    }, 1200);
  },

  markSynced: (id) => {
    set(s => ({
      transactions: s.transactions.map(t =>
        t.id === id ? { ...t, status: 'success' as SyncStatus, syncedAt: new Date() } : t
      ),
    }));
  },

  addTransaction: (tx) => {
    const newTx: LocalTransaction = {
      ...tx,
      id: `tx_${Date.now()}`,
      createdAt: new Date(),
      syncAttempts: 0,
    };
    set(s => ({ transactions: [newTx, ...s.transactions] }));
  },

  setOnlineStatus: (online) => set({ isOnline: online }),

  startSync: () => {
    set({ isSyncing: true });
    setTimeout(() => {
      set(s => ({
        isSyncing: false,
        lastSyncAt: new Date(),
        transactions: s.transactions.map(t =>
          t.status === 'pending' ? { ...t, status: 'success' as SyncStatus, syncedAt: new Date() } : t
        ),
      }));
    }, 2500);
  },
    }),
    { name: 'pos-sync', storage: createJSONStorage(() => persistStorage) }
  )
);
