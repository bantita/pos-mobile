import React, { useState } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { useSyncStore } from '@/features/sync/application/stores/syncStore';
import { LocalTransaction, SyncStatus, ENTITY_LABELS, ENTITY_ICONS } from '@/features/sync/domain/sync';
import { formatDateTime } from '@/shared/lib/format';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';
import { Text } from '@/shared/tw/index';

const STATUS_CFG: Record<SyncStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:  { label: 'รอ',          color: '#a16207', bg: '#fed7aa',  icon: 'time-outline' },
  syncing:  { label: 'กำลังซิงค์', color: '#0284c7', bg: '#e0f2fe', icon: 'sync-outline' },
  success:  { label: 'สำเร็จ',      color: '#0f766e',  bg: '#d1fae5',  icon: 'checkmark-circle-outline' },
  failed:   { label: 'ล้มเหลว',    color: '#ef4444',   bg: '#ffe4e6',   icon: 'close-circle-outline' },
  conflict: { label: 'ขัดแย้ง',    color: '#e11d48',  bg: '#fee2e2',  icon: 'alert-circle-outline' },
};

interface Props {
  onBack: () => void;
  onOpenConflict: (txId: string) => void;
}

type FilterTab = SyncStatus | 'all';

export const SyncQueueScreen: React.FC<Props> = ({ onBack, onOpenConflict }) => {
  const { transactions, isOnline, isSyncing, lastSyncAt, getStats, retryTransaction, retryAllFailed, startSync } = useSyncStore();
  const stats = getStats();
  const [filterTab, setFilterTab] = useState<FilterTab>('all');

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMsg, setConfirmMsg] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  const showConfirm = (title: string, msg: string, onConfirm: () => void) => {
    setConfirmTitle(title);
    setConfirmMsg(msg);
    setConfirmAction(() => onConfirm);
    setConfirmVisible(true);
  };

  const filtered = filterTab === 'all'
    ? transactions
    : transactions.filter(t => t.status === filterTab);

  const failedCount = stats.failed;
  const conflictCount = stats.conflict;
  const actionNeeded = failedCount + conflictCount;

  const handleRetryAll = () => {
    showConfirm('Retry ทั้งหมด', `จะลอง Sync ${failedCount} รายการที่ล้มเหลวอีกครั้ง`, retryAllFailed);
  };

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all',      label: 'ทั้งหมด', count: stats.total },
    { key: 'pending',  label: 'รอ',      count: stats.pending },
    { key: 'failed',   label: 'ล้มเหลว', count: stats.failed },
    { key: 'conflict', label: 'ขัดแย้ง', count: stats.conflict },
    { key: 'success',  label: 'สำเร็จ',  count: stats.success },
  ];

  const renderItem = ({ item }: { item: LocalTransaction }) => {
    const sc = STATUS_CFG[item.status];
    return (
      <View className={cn('bg-white rounded-2xl p-3 gap-2 border border-rose-100 shadow-sm')}>
        <View className={cn('flex-row items-start gap-2')}>
          <View className={cn('w-[38px] h-[38px] rounded-xl bg-rose-100 items-center justify-center mt-0.5')}>
            <Ionicons name={ENTITY_ICONS[item.entityType] as any} size={18} color="#e11d48" />
          </View>
          <View style={{ flex: 1 }}>
            <View className={cn('flex-row items-center justify-between')}>
              <Text className={cn('text-xs font-bold text-slate-800')}>{item.documentNo}</Text>
              <View className={cn('flex-row items-center gap-[3px] rounded-full px-2 py-0.5', sc.bg)}>
                <Ionicons name={sc.icon as any} size={10} color={sc.color} />
                <Text className={cn('text-[11px] font-bold')} style={{ color: sc.color }}>{sc.label}</Text>
              </View>
            </View>
            <Text className={cn('text-xs text-slate-700 font-medium')} numberOfLines={1}>{item.description}</Text>
            <Text className={cn('text-[10px] text-slate-500 font-medium mt-0.5')}>
              {ENTITY_LABELS[item.entityType]} · {item.deviceName} · {formatDateTime(item.createdAt)}
            </Text>
            {item.status === 'failed' && item.errorMessage && (
              <Text className={cn('text-xs text-rose-600 font-medium mt-0.5')} numberOfLines={1}>{item.errorMessage}</Text>
            )}
            {item.status === 'conflict' && item.conflictData && (
              <View className={cn('flex-row items-center gap-1 mt-0.5')}>
                <Ionicons name="alert-circle-outline" size={11} color="#e11d48" />
                <Text className={cn('text-xs text-rose-600 font-medium capitalize')}>{item.conflictData.conflictType.replace(/_/g, ' ')}</Text>
              </View>
            )}
          </View>
        </View>

        <View className={cn('flex-row items-center gap-2')}>
          {item.status === 'failed' && (
            <TouchableOpacity className={cn('flex-row items-center gap-1 bg-amber-100 rounded-xl px-2 py-1 border border-amber-600')} onPress={() => retryTransaction(item.id)}>
              <Ionicons name="refresh-outline" size={13} color="#a16207" />
              <Text className={cn('text-xs text-amber-700 font-bold')}>Retry</Text>
            </TouchableOpacity>
          )}
          {item.status === 'conflict' && (
            <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-100 rounded-xl px-2 py-1 border border-rose-400')} onPress={() => onOpenConflict(item.id)}>
              <Ionicons name="git-merge-outline" size={13} color="#e11d48" />
              <Text className={cn('text-xs text-rose-600 font-bold')}>แก้ไขปัญหา</Text>
            </TouchableOpacity>
          )}
          {item.syncAttempts > 0 && (
            <Text className={cn('text-[10px] text-slate-500 font-medium')}>ลอง {item.syncAttempts} ครั้ง</Text>
          )}
          {item.syncedAt && (
            <Text className={cn('text-[10px] text-emerald-600 font-medium ml-auto')}>Synced {formatDateTime(item.syncedAt)}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-rose-50')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-3 py-3 border-b border-rose-700 shadow-sm')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-base font-extrabold text-white')}>Sync Queue</Text>
          <Text className={cn('text-[10px] text-rose-100 font-medium')}>
            {lastSyncAt ? `ซิงค์ล่าสุด ${formatDateTime(lastSyncAt)}` : 'ยังไม่เคยซิงค์'}
          </Text>
        </View>
        <View className={cn('flex-row items-center gap-[5px] rounded-full px-2 py-1', isOnline ? 'bg-emerald-100' : 'bg-rose-200')}>
          <View className={cn('w-[7px] h-[7px] rounded-full', isOnline ? 'bg-emerald-600' : 'bg-red-500')} />
          <Text className={cn('text-[9px] font-bold', isOnline ? 'text-emerald-700' : 'text-red-600')}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {actionNeeded > 0 && (
        <View className={cn('flex-row items-center gap-2 bg-amber-50 px-3 py-2 border-b border-amber-200')}>
          <Ionicons name="warning-outline" size={16} color="#a16207" />
          <Text className={cn('text-xs text-amber-700 flex-1 font-medium')}>
            {failedCount > 0 ? `${failedCount} รายการล้มเหลว` : ''}{failedCount > 0 && conflictCount > 0 ? ' และ ' : ''}{conflictCount > 0 ? `${conflictCount} รายการขัดแย้ง` : ''} ต้องการดำเนินการ
          </Text>
          <View className={cn('flex-row gap-1')}>
            {failedCount > 0 && (
              <TouchableOpacity className={cn('bg-amber-600 rounded-xl px-2 py-1 shadow-sm')} onPress={handleRetryAll} disabled={isSyncing}>
                <Text className={cn('text-[9px] text-white font-bold')}>{isSyncing ? 'กำลัง...' : `Retry ${failedCount}`}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {isSyncing && (
        <View className={cn('flex-row items-center gap-2 bg-sky-50 px-3 py-2 border-b border-sky-200')}>
          <Ionicons name="sync-outline" size={14} color="#0284c7" />
          <Text className={cn('text-xs text-sky-700 font-medium')}>กำลัง Sync...</Text>
          <View className={cn('flex-1 h-1 bg-rose-100 rounded overflow-hidden')}>
            <View className={cn('h-full w-[60%] bg-rose-500 rounded')} />
          </View>
        </View>
      )}

      <View className={cn('flex-row bg-white border-b border-rose-100')}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            className={cn('flex-1 flex-row items-center justify-center gap-[3px] py-2 border-b-2', filterTab === tab.key ? 'border-b-rose-500' : 'border-b-transparent')}
            onPress={() => setFilterTab(tab.key)}
          >
            <Text className={cn('text-[10px]', filterTab === tab.key ? 'text-rose-600 font-bold' : 'text-slate-500 font-medium')}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View className={cn('rounded-lg px-[5px] py-[1px]', filterTab === tab.key ? 'bg-rose-100' : 'bg-rose-50')}>
                <Text className={cn('text-[10px] font-bold', filterTab === tab.key ? 'text-rose-600' : 'text-slate-500')}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={t => t.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className={cn('items-center py-[60px] gap-3')}>
            <Ionicons name="cloud-done-outline" size={56} color="#fecdd3" />
            <Text className={cn('text-base font-semibold text-slate-400')}>ไม่มีรายการ</Text>
          </View>
        }
      />

      <View className={cn('p-3 bg-white border-t border-rose-200')}>
        <TouchableOpacity
          className={cn('flex-row items-center justify-center gap-2 bg-rose-500 rounded-2xl py-3 shadow-sm', (!isOnline || isSyncing) && 'bg-rose-200')}
          onPress={startSync}
          disabled={!isOnline || isSyncing}
        >
          <Ionicons name={isSyncing ? 'hourglass-outline' : 'cloud-upload-outline'} size={18} color="#fafafa" />
          <Text className={cn('text-xs font-bold text-white')}>{isSyncing ? 'กำลัง Sync...' : 'Force Sync ทั้งหมด'}</Text>
        </TouchableOpacity>
      </View>

      <ConfirmModal visible={confirmVisible} onClose={() => setConfirmVisible(false)} title={confirmTitle} message={confirmMsg} variant="warning" onConfirm={() => { confirmAction(); setConfirmVisible(false); }} />
    </SafeAreaView>
  );
};
