import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncService } from './SyncService';
import { LocalTransaction, SyncStatus } from '../../types/sync';

const mockTransaction: LocalTransaction = {
  id: 'tx-test-001',
  entityType: 'sale',
  entityId: 'sale_001',
  documentNo: 'INV-TEST-001',
  description: 'ทดสอบขาย',
  payload: { total: 100 },
  status: 'pending',
  deviceId: 'dev001',
  deviceName: 'Test POS',
  createdBy: 'tester',
  createdAt: new Date(),
  syncAttempts: 0,
};

describe('SyncService', () => {
  let service: SyncService;
  let statusChanges: Array<{ txId: string; status: SyncStatus }>;

  beforeEach(() => {
    statusChanges = [];
    service = new SyncService((txId, status) => {
      statusChanges.push({ txId, status });
    });
  });

  it('สร้าง instance ได้', () => {
    expect(service).toBeDefined();
  });

  it('default เป็น online', () => {
    expect(service.getIsOnline()).toBe(true);
  });

  it('เปลี่ยน online status ได้', () => {
    service.setOnline(false);
    expect(service.getIsOnline()).toBe(false);

    service.setOnline(true);
    expect(service.getIsOnline()).toBe(true);
  });

  it('ไม่ flush ถ้า offline', async () => {
    service.setOnline(false);
    const results = await service.flushQueue([mockTransaction]);
    expect(results).toEqual([]);
    expect(statusChanges).toHaveLength(0);
  });

  it('retry single ไม่ทำงานถ้า offline', async () => {
    service.setOnline(false);
    const result = await service.retrySingle(mockTransaction);
    expect(result?.success).toBe(false);
    expect(result?.error).toContain('offline');
  });

  it('flush จะ mark เป็น syncing ก่อน', async () => {
    // Mock fetch to simulate network error (no server)
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await service.flushQueue([mockTransaction]);

    // First change should be 'syncing'
    expect(statusChanges[0]).toEqual({ txId: 'tx-test-001', status: 'syncing' });
  });

  it('flush ที่ล้มเหลวจะ mark เป็น pending (ยัง retry ได้)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    await service.flushQueue([mockTransaction]);

    // syncing → pending (because attempts < MAX_RETRY)
    expect(statusChanges).toContainEqual({ txId: 'tx-test-001', status: 'syncing' });
    expect(statusChanges).toContainEqual({ txId: 'tx-test-001', status: 'pending' });
  });

  it('flush ที่ attempts >= 5 จะ mark เป็น failed', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Server down'));
    const txMaxRetry = { ...mockTransaction, syncAttempts: 4 }; // will become 5

    await service.flushQueue([txMaxRetry]);

    expect(statusChanges).toContainEqual({ txId: 'tx-test-001', status: 'failed' });
  });

  it('flush สำเร็จ mark เป็น success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'server-001' }),
    });

    await service.flushQueue([mockTransaction]);

    expect(statusChanges).toContainEqual({ txId: 'tx-test-001', status: 'success' });
  });

  it('server ตอบ 409 → conflict', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({
        field: 'stockQty',
        conflictType: 'stock_changed',
        clientValue: '100',
        serverValue: '80',
      }),
    });

    await service.flushQueue([mockTransaction]);

    expect(statusChanges).toContainEqual({ txId: 'tx-test-001', status: 'conflict' });
  });

  it('event listener ทำงาน', async () => {
    const events: string[] = [];
    service.on((e) => events.push(e.type));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await service.flushQueue([mockTransaction]);

    expect(events).toContain('SYNC_START');
    expect(events).toContain('SYNC_COMPLETE');
  });
});
