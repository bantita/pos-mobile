import React, { useState } from 'react';
import { View, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';
import { SyncQueueItem, SyncItemStatus, SyncItemType } from '@/features/dashboard/domain/dashboard';
import { cn } from '@/shared/lib/cn';
import { formatDateTime } from '@/shared/lib/format';
import { Text } from '@/shared/tw/index';

const MOCK_QUEUE: SyncQueueItem[] = [
  { id: '1', type: 'sale', documentNo: 'INV00125', description: 'ขายสินค้า 3 รายการ', status: 'failed', createdAt: new Date(Date.now() - 5 * 60000), retryCount: 2, errorMessage: 'Connection timeout' },
  { id: '2', type: 'sale', documentNo: 'INV00124', description: 'ขายสินค้า 5 รายการ', status: 'pending', createdAt: new Date(Date.now() - 10 * 60000), retryCount: 0 },
  { id: '3', type: 'stock', documentNo: 'RCV00012', description: 'รับสินค้า 2 รายการ', status: 'pending', createdAt: new Date(Date.now() - 15 * 60000), retryCount: 0 },
  { id: '4', type: 'payment', documentNo: 'PAY00088', description: 'ชำระเงิน QR Code', status: 'success', createdAt: new Date(Date.now() - 20 * 60000), retryCount: 1 },
  { id: '5', type: 'product', documentNo: 'PRD00045', description: 'อัปเดตราคาสินค้า', status: 'success', createdAt: new Date(Date.now() - 30 * 60000), retryCount: 0 },
];

const STATUS_CONFIG: Record<SyncItemStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  pending:  { label: 'รอ Sync',  color: '#a16207', bgColor: '#fed7aa', icon: 'time-outline' },
  syncing:  { label: 'กำลัง Sync', color: '#f87171', bgColor: '#fee2e2', icon: 'sync-outline' },
  success:  { label: 'สำเร็จ',   color: '#0f766e', bgColor: '#d1fae5', icon: 'checkmark-circle-outline' },
  failed:   { label: 'ล้มเหลว',  color: '#ef4444', bgColor: '#ffe4e6', icon: 'close-circle-outline' },
};

const TYPE_CONFIG: Record<SyncItemType, { label: string; icon: string; color: string }> = {
  sale:     { label: 'ขายสินค้า', icon: 'cart-outline',     color: '#f87171' },
  stock:    { label: 'สต๊อก',    icon: 'archive-outline',   color: '#0f766e' },
  product:  { label: 'สินค้า',   icon: 'cube-outline',      color: '#f87171' },
  payment:  { label: 'ชำระเงิน', icon: 'card-outline',      color: '#a16207' },
};

interface SyncStatusScreenProps {
  onBack: () => void;
  canRetry?: boolean;
}

export const SyncStatusScreen: React.FC<SyncStatusScreenProps> = ({
  onBack,
  canRetry = true,
}) => {
  const [queue, setQueue] = useState<SyncQueueItem[]>(MOCK_QUEUE);
  const [retrying, setRetrying] = useState(false);
  const [filter, setFilter] = useState<SyncItemStatus | 'all'>('all');
  const [showRetryModal, setShowRetryModal] = useState(false);

  const counts = {
    pending: queue.filter((q) => q.status === 'pending').length,
    failed:  queue.filter((q) => q.status === 'failed').length,
    success: queue.filter((q) => q.status === 'success').length,
  };

  const filtered = filter === 'all' ? queue : queue.filter((q) => q.status === filter);

  const handleRetryAll = () => {
    setShowRetryModal(true);
  };

  const handleRetryOne = (id: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'pending', retryCount: item.retryCount + 1, errorMessage: undefined } : item
      )
    );
  };

  const renderItem = ({ item }: { item: SyncQueueItem }) => {
    const st = STATUS_CONFIG[item.status];
    const tp = TYPE_CONFIG[item.type];
    return (
      <View className="flex-row items-start gap-2 bg-white rounded-2xl p-3 shadow-sm">
        <View className="w-10 h-10 rounded-lg items-center justify-center mt-[2px]" style={{ backgroundColor: tp.color + '18' }}>
          <Ionicons name={tp.icon as any} size={20} color={tp.color} />
        </View>
        <View className="flex-1 gap-[2px]">
          <View className="flex-row justify-between items-center">
            <Text className="text-xs font-extrabold leading-[18px] text-slate-950">{item.documentNo}</Text>
            <View className="flex-row items-center gap-[3px] rounded-full px-2 py-[2px]" style={{ backgroundColor: st.bgColor }}>
              <Ionicons name={st.icon as any} size={11} color={st.color} />
              <Text className="text-[10px] font-bold" style={{ color: st.color }}>{st.label}</Text>
            </View>
          </View>
          <Text className="text-base leading-[22px] text-slate-950 font-medium">{item.description}</Text>
          <Text className="text-xs leading-[18px] text-slate-500 font-medium">
            {tp.label} · {formatDateTime(item.createdAt)}
            {item.retryCount > 0 ? ` · Retry ${item.retryCount}ครั้ง` : ''}
          </Text>
          {item.errorMessage && (
            <View className="mt-[2px] flex-row items-center gap-1">
              <Ionicons name="warning-outline" size={13} color="#e11d48" />
              <Text className="flex-1 text-xs leading-[18px] text-rose-600 font-medium">{item.errorMessage}</Text>
            </View>
          )}
        </View>
        {item.status === 'failed' && canRetry && (
          <TouchableOpacity className="w-8 h-8 rounded-lg bg-rose-50 items-center justify-center mt-1" onPress={() => handleRetryOne(item.id)}>
            <Ionicons name="refresh-outline" size={16} color="#f87171" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-rose-50" edges={['top']}>
      <View className="flex-row items-center justify-between bg-rose-600 px-3 py-3">
        <TouchableOpacity onPress={onBack} className="p-1">
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className="text-lg font-extrabold leading-[26px] text-white">สถานะ Sync</Text>
        <View style={{ width: 40 }} />
      </View>

      <View className="flex-row gap-2 p-3">
        {[
          { key: 'pending', label: 'รอ Sync', count: counts.pending, color: '#a16207', bg: '#fed7aa', icon: 'time-outline' },
          { key: 'failed',  label: 'ล้มเหลว', count: counts.failed,  color: '#ef4444', bg: '#ffe4e6', icon: 'close-circle-outline' },
          { key: 'success', label: 'สำเร็จ',  count: counts.success, color: '#0f766e', bg: '#d1fae5', icon: 'checkmark-circle-outline' },
        ].map((s) => (
          <TouchableOpacity
            key={s.key}
            className={cn('flex-1 items-center gap-1 bg-white rounded-2xl py-3 border', filter === s.key ? 'border-2' : 'border border-slate-200')}
            style={filter === s.key ? { borderColor: s.color } : {}}
            onPress={() => setFilter(filter === s.key ? 'all' : s.key as SyncItemStatus)}
            activeOpacity={0.8}
          >
            <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: s.bg }}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
            </View>
            <Text className="text-2xl font-extrabold" style={{ color: s.color }}>{s.count}</Text>
            <Text className="text-xs leading-[18px] text-slate-500 font-medium">{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="flex-row px-3 gap-2 mb-1">
        {(['all', 'pending', 'failed', 'success'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            className={cn('px-3 py-1 rounded-full bg-gray-100 border border-slate-200', filter === f && 'bg-rose-500 border-rose-500')}
            onPress={() => setFilter(f)}
          >
            <Text className={cn('text-xs leading-[18px] text-slate-500 font-medium', filter === f && 'text-white font-bold')}>
              {{ all: 'ทั้งหมด', pending: 'รอ', failed: 'ล้มเหลว', success: 'สำเร็จ' }[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerClassName="px-3 pb-20 gap-2"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-6 gap-3">
            <Ionicons name="cloud-done-outline" size={56} color="#d1d5db" />
            <Text className="text-base leading-[26px] text-gray-400">ไม่มีรายการ</Text>
          </View>
        }
      />

      {counts.failed > 0 && canRetry && (
        <View className="p-3 bg-white border-t border-slate-200">
          <TouchableOpacity
            className={cn('flex-row items-center justify-center gap-2 rounded-xl py-3', retrying ? 'bg-gray-300' : 'bg-rose-500')}
            onPress={handleRetryAll}
            disabled={retrying}
            activeOpacity={0.85}
          >
            <Ionicons name={retrying ? 'hourglass-outline' : 'refresh-outline'} size={20} color="#fafafa" />
            <Text className="text-base font-bold leading-[22px] text-white">
              {retrying ? 'กำลัง Retry...' : `Retry ทั้งหมด (${counts.failed} รายการ)`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ConfirmModal
        visible={showRetryModal}
        onClose={() => setShowRetryModal(false)}
        title="Retry ทั้งหมด"
        message={`จะลอง Sync ${counts.failed} รายการที่ล้มเหลวอีกครั้ง`}
        confirmLabel="Retry"
        cancelLabel="ยกเลิก"
        variant="warning"
        onConfirm={() => {
          setRetrying(true);
          setTimeout(() => {
            setQueue((prev) =>
              prev.map((item) =>
                item.status === 'failed' ? { ...item, status: 'pending', retryCount: item.retryCount + 1, errorMessage: undefined } : item
              )
            );
            setRetrying(false);
          }, 1500);
          setShowRetryModal(false);
        }}
        onCancel={() => setShowRetryModal(false)}
      />
    </SafeAreaView>
  );
};
