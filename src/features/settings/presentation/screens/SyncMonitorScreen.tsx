import React, { useState } from 'react';
import { FlatList, Modal } from 'react-native';
import { Text, TouchableOpacity, View } from '@/shared/tw/index';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';
import { formatDateTime } from '@/shared/lib/format';
import { usePermissionStore } from '@/features/settings/application/stores/permissionStore';

type SyncStatus = 'pending' | 'success' | 'failed' | 'conflict';
type SyncType = 'sale' | 'product' | 'inventory' | 'user' | 'settings';

interface SyncItem {
  id: string;
  type: SyncType;
  docNo: string;
  deviceName: string;
  timestamp: Date;
  status: SyncStatus;
  errorMessage?: string;
}

const now = new Date();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60000);

const MOCK_SYNC: SyncItem[] = [
  { id: 's_001', type: 'sale',      docNo: 'INV-20250101-0045', deviceName: 'POS-001', timestamp: minutesAgo(2),   status: 'success' },
  { id: 's_002', type: 'sale',      docNo: 'INV-20250101-0046', deviceName: 'POS-002', timestamp: minutesAgo(3),   status: 'pending' },
  { id: 's_003', type: 'inventory', docNo: 'RCV-20250101-003',  deviceName: 'POS-003', timestamp: minutesAgo(5),   status: 'failed',  errorMessage: 'Network timeout — ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' },
  { id: 's_004', type: 'product',   docNo: 'PRD-00042',         deviceName: 'POS-001', timestamp: minutesAgo(8),   status: 'conflict' },
  { id: 's_005', type: 'sale',      docNo: 'INV-20250101-0044', deviceName: 'POS-001', timestamp: minutesAgo(10),  status: 'success' },
  { id: 's_006', type: 'settings',  docNo: 'SET-CONFIG',        deviceName: 'POS-002', timestamp: minutesAgo(12),  status: 'failed',  errorMessage: 'Authentication error — Token หมดอายุ' },
  { id: 's_007', type: 'sale',      docNo: 'INV-20250101-0043', deviceName: 'POS-003', timestamp: minutesAgo(15),  status: 'success' },
  { id: 's_008', type: 'inventory', docNo: 'ADJ-20250101-002',  deviceName: 'POS-001', timestamp: minutesAgo(18),  status: 'pending' },
  { id: 's_009', type: 'product',   docNo: 'PRD-00015',         deviceName: 'POS-002', timestamp: minutesAgo(22),  status: 'conflict' },
  { id: 's_010', type: 'user',      docNo: 'USR-UPDATE',        deviceName: 'POS-001', timestamp: minutesAgo(30),  status: 'success' },
];

const TYPE_ICONS: Record<SyncType, string> = {
  sale: 'receipt-outline',
  product: 'cube-outline',
  inventory: 'archive-outline',
  user: 'person-outline',
  settings: 'settings-outline',
};

const TYPE_COLORS: Record<SyncType, string> = {
  sale: '#0f766e',
  product: '#f87171',
  inventory: '#a16207',
  user: '#f87171',
  settings: '#4b5563',
};

const STATUS_CONFIG: Record<SyncStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:  { label: 'รอซิงค์',  color: '#a16207',  bg: '#fed7aa',  icon: 'time-outline' },
  success:  { label: 'สำเร็จ',   color: '#0f766e',  bg: '#d1fae5',  icon: 'checkmark-circle-outline' },
  failed:   { label: 'ล้มเหลว', color: '#ef4444',   bg: '#ffe4e6',   icon: 'close-circle-outline' },
  conflict: { label: 'ขัดแย้ง', color: '#f87171',       bg: '#fee2e2',            icon: 'alert-circle-outline' },
};

interface SyncMonitorScreenProps {
  onBack: () => void;
}

export const SyncMonitorScreen: React.FC<SyncMonitorScreenProps> = ({ onBack }) => {
  const { addAuditLog, currentRole } = usePermissionStore();
  const [syncItems, setSyncItems] = useState<SyncItem[]>(MOCK_SYNC);
  const [statusFilter, setStatusFilter] = useState<SyncStatus | 'all'>('all');
  const [isOnline] = useState(true);
  const [resolveModal, setResolveModal] = useState<SyncItem | null>(null);

  const [alertDialog, setAlertDialog] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });
  const [confirmForceSync, setConfirmForceSync] = useState(false);

  const filtered = statusFilter === 'all'
    ? syncItems
    : syncItems.filter((i) => i.status === statusFilter);

  const counts = {
    pending:  syncItems.filter((i) => i.status === 'pending').length,
    failed:   syncItems.filter((i) => i.status === 'failed').length,
    success:  syncItems.filter((i) => i.status === 'success').length,
    conflict: syncItems.filter((i) => i.status === 'conflict').length,
  };

  const handleRetry = (item: SyncItem) => {
    setSyncItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'pending', errorMessage: undefined } : i))
    );
    setTimeout(() => {
      setSyncItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'success' } : i))
      );
    }, 1500);
  };

  const handleRetryAll = () => {
    const failedItems = syncItems.filter((i) => i.status === 'failed');
    if (failedItems.length === 0) return;
    setSyncItems((prev) =>
      prev.map((i) => (i.status === 'failed' ? { ...i, status: 'pending', errorMessage: undefined } : i))
    );
    setAlertDialog({ visible: true, title: 'Retry', message: `กำลังลองใหม่ ${failedItems.length} รายการ` });
  };

  const handleForceSync = () => {
    setConfirmForceSync(true);
  };

  const confirmForceSyncAction = () => {
    addAuditLog({
      userId: 'usr_001',
      userName: 'สมชาย เจ้าของร้าน',
      userRole: currentRole,
      action: 'FORCE_SYNC',
      module: 'sync',
      description: 'บังคับซิงค์ข้อมูลทั้งหมด',
    });
    setConfirmForceSync(false);
    setAlertDialog({ visible: true, title: 'สำเร็จ', message: 'เริ่มการ Force Sync แล้ว' });
  };

  const handleResolveConflict = (resolution: 'server' | 'client' | 'manual') => {
    if (!resolveModal) return;
    setSyncItems((prev) =>
      prev.map((i) =>
        i.id === resolveModal.id
          ? { ...i, status: resolution === 'manual' ? 'pending' : 'success' }
          : i
      )
    );
    addAuditLog({
      userId: 'usr_001',
      userName: 'สมชาย เจ้าของร้าน',
      userRole: currentRole,
      action: 'SYNC_CONFLICT_RESOLVE',
      module: 'sync',
      description: `แก้ไข Conflict: ${resolveModal.docNo} — ${resolution === 'server' ? 'Server Wins' : resolution === 'client' ? 'Client Wins' : 'Manual'}`,
      documentNo: resolveModal.docNo,
    });
    setResolveModal(null);
  };

  const renderItem = ({ item }: { item: SyncItem }) => {
    const sc = STATUS_CONFIG[item.status];
    const typeColor = TYPE_COLORS[item.type];

    return (
      <View className={cn('bg-white rounded-2xl p-3 flex-row gap-3 shadow-sm')}>
        <View className={cn('w-9 h-9 rounded-xl items-center justify-center')} style={{ backgroundColor: typeColor + '20' }}>
          <Ionicons name={TYPE_ICONS[item.type] as any} size={18} color={typeColor} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <View className={cn('flex-row items-center justify-between')}>
            <Text className={cn('text-xs font-bold text-slate-950')}>{item.docNo}</Text>
            <View className={cn('flex-row items-center gap-0.5 rounded px-1.5 py-0.5')} style={{ backgroundColor: sc.bg }}>
              <Ionicons name={sc.icon as any} size={10} color={sc.color} />
              <Text style={[{ color: sc.color }]} className={cn('text-xs font-bold')}>{sc.label}</Text>
            </View>
          </View>
          <View className={cn('flex-row items-center gap-1')}>
            <Ionicons name="desktop-outline" size={12} color="#57534e" />
            <Text className={cn('text-xs font-medium text-slate-600')}>{item.deviceName}</Text>
            <Text className={cn('text-xs font-medium text-slate-600')}>·</Text>
            <Text className={cn('text-xs font-medium text-slate-600')}>{formatDateTime(item.timestamp)}</Text>
          </View>
          {item.errorMessage && (
            <Text className={cn('text-xs font-medium text-rose-600 italic')}>{item.errorMessage}</Text>
          )}
          {item.status === 'failed' && (
            <TouchableOpacity className={cn('min-h-9 flex-row items-center gap-1 self-start rounded-xl border border-rose-600 px-3 py-2')} onPress={() => handleRetry(item)}>
              <Ionicons name="refresh-outline" size={14} color="#ef4444" />
              <Text className={cn('text-xs font-bold text-rose-600')}>Retry</Text>
            </TouchableOpacity>
          )}
          {item.status === 'conflict' && (
            <TouchableOpacity className={cn('min-h-9 flex-row items-center gap-1 self-start rounded-xl border px-3 py-2')} style={{ borderColor: '#f87171' }} onPress={() => setResolveModal(item)}>
              <Ionicons name="git-merge-outline" size={14} color="#f87171" />
              <Text style={{ color: '#f87171' }} className={cn('text-xs font-bold')}>Resolve Conflict</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-3 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-lg font-extrabold text-white')}>Sync Monitor</Text>
          <Text className={cn('text-xs font-medium text-rose-100')}>{syncItems.length} รายการในคิว</Text>
        </View>
        <View className={cn('flex-row items-center gap-1 px-2.5 py-1.5 rounded-full border', isOnline ? 'bg-emerald-100 border-emerald-700' : 'bg-rose-50 border-rose-600')}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isOnline ? '#0f766e' : '#ef4444' }} />
          <Text style={{ color: isOnline ? '#0f766e' : '#ef4444' }} className={cn('text-xs font-bold')}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      <View className={cn('flex-row p-3 gap-2')}>
        {(['pending', 'failed', 'success', 'conflict'] as const).map((s) => {
          const sc = STATUS_CONFIG[s];
          return (
            <TouchableOpacity
              key={s}
              className={cn('min-h-14 flex-1 items-center justify-center gap-0.5 rounded-2xl border-2 py-2', statusFilter === s ? 'border-rose-500' : 'border-transparent')}
              style={{ backgroundColor: sc.bg }}
              onPress={() => setStatusFilter(statusFilter === s ? 'all' : s)}
            >
              <Text style={[{ color: sc.color }]} className={cn('text-2xl font-extrabold')}>{counts[s]}</Text>
              <Text style={[{ color: sc.color }]} className={cn('text-xs font-bold')}>{sc.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 4 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className={cn('items-center pt-6 gap-2')}>
            <Ionicons name="cloud-done-outline" size={48} color="#d1d5db" />
            <Text className={cn('text-base font-medium text-slate-600')}>ไม่มีรายการที่ตรงกัน</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      <View className={cn('bg-white border-t border-rose-200 p-3 gap-2')} style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        {counts.failed > 0 && (
          <TouchableOpacity className={cn('flex-row items-center justify-center gap-2 py-3 rounded-xl border-2 border-rose-600')} onPress={handleRetryAll}>
            <Ionicons name="refresh-circle-outline" size={18} color="#ef4444" />
            <Text className={cn('text-base font-bold text-rose-600')}>Retry ทั้งหมด ({counts.failed})</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity className={cn('flex-row items-center justify-center gap-2 py-3 rounded-xl bg-rose-600 shadow-sm')} onPress={handleForceSync}>
          <Ionicons name="cloud-upload-outline" size={18} color="#fafafa" />
          <Text className={cn('text-base font-bold text-white')}>Force Sync ทันที</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={resolveModal !== null} animationType="fade" transparent>
        <View className={cn('flex-1 items-center justify-center p-4')} style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View className={cn('bg-white rounded-2xl p-4 w-full gap-2 shadow-sm')}>
            <Text className={cn('text-lg font-extrabold text-slate-950')}>แก้ไข Conflict</Text>
            <Text className={cn('text-xs font-bold text-rose-500')}>{resolveModal?.docNo}</Text>
            <Text className={cn('text-base font-medium text-slate-600')}>ข้อมูลในเครื่องกับเซิร์ฟเวอร์ไม่ตรงกัน เลือกวิธีการแก้ไข:</Text>
            {[
              { key: 'server' as const, icon: 'cloud-outline', label: 'Server Wins', desc: 'ใช้ข้อมูลจากเซิร์ฟเวอร์', color: '#f87171' },
              { key: 'client' as const, icon: 'phone-portrait-outline', label: 'Client Wins', desc: 'ใช้ข้อมูลจากเครื่องนี้', color: '#0f766e' },
              { key: 'manual' as const, icon: 'create-outline', label: 'Manual', desc: 'แก้ไขด้วยตนเอง', color: '#a16207' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                className={cn('flex-row items-center gap-2 py-2 border-t border-slate-200')}
                onPress={() => handleResolveConflict(opt.key)}
              >
                <View className={cn('w-10 h-10 rounded-xl items-center justify-center')} style={{ backgroundColor: opt.color + '20' }}>
                  <Ionicons name={opt.icon as any} size={20} color={opt.color} />
                </View>
                <View>
                  <Text className={cn('text-xs font-bold text-slate-950')}>{opt.label}</Text>
                  <Text className={cn('text-xs font-medium text-slate-600')}>{opt.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity className={cn('mt-1 py-3 rounded-xl bg-[#f6f7fb] items-center')} onPress={() => setResolveModal(null)}>
              <Text className={cn('text-base font-bold text-slate-600')}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AlertDialog
        visible={alertDialog.visible}
        title={alertDialog.title}
        message={alertDialog.message}
        onClose={() => setAlertDialog({ visible: false, title: '', message: '' })}
        onConfirm={() => setAlertDialog({ visible: false, title: '', message: '' })}
      />

      <ConfirmModal
        visible={confirmForceSync}
        title="Force Sync"
        message="บังคับซิงค์ข้อมูลทั้งหมดทันที?"
        variant="warning"
        confirmLabel="Force Sync"
        cancelLabel="ยกเลิก"
        onConfirm={confirmForceSyncAction}
        onCancel={() => setConfirmForceSync(false)}
        onClose={() => setConfirmForceSync(false)}
      />
    </SafeAreaView>
  );
};
