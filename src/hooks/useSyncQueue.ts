/**
 * useSyncQueue — Hook เชื่อม SyncService กับ syncStore
 * ใช้ใน screens/components ที่ต้อง trigger sync
 */
import { useCallback, useEffect, useRef } from 'react';
import { useSyncStore } from '../store/syncStore';
import { getSyncService } from '../services/sync';
import { SyncStatus, LocalTransaction } from '../types/sync';

export function useSyncQueue() {
  const {
    transactions, isOnline, isSyncing, lastSyncAt,
    getStats, addTransaction, setOnlineStatus,
  } = useSyncStore();

  const serviceRef = useRef(
    getSyncService((txId: string, status: SyncStatus, extra?: Partial<LocalTransaction>) => {
      useSyncStore.setState((s) => ({
        transactions: s.transactions.map((t) =>
          t.id === txId ? { ...t, status, ...extra } : t
        ),
        lastSyncAt: status === 'success' ? new Date() : s.lastSyncAt,
      }));
    })
  );

  // Start service on mount
  useEffect(() => {
    const svc = serviceRef.current;
    svc.start();
    return () => svc.stop();
  }, []);

  // Sync online status
  useEffect(() => {
    serviceRef.current.setOnline(isOnline);
  }, [isOnline]);

  // Auto-flush when online and has pending
  useEffect(() => {
    if (isOnline && !isSyncing) {
      const pending = transactions.filter((t) => t.status === 'pending');
      if (pending.length > 0) {
        serviceRef.current.flushQueue(transactions);
      }
    }
  }, [isOnline, transactions, isSyncing]);

  const flushNow = useCallback(async () => {
    useSyncStore.setState({ isSyncing: true });
    const results = await serviceRef.current.flushQueue(transactions);
    useSyncStore.setState({ isSyncing: false });
    return results;
  }, [transactions]);

  const retrySingle = useCallback(async (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return;
    return serviceRef.current.retrySingle(tx);
  }, [transactions]);

  return {
    transactions,
    stats: getStats(),
    isOnline,
    isSyncing,
    lastSyncAt,
    addTransaction,
    flushNow,
    retrySingle,
    setOnlineStatus,
  };
}
