import React, { useState, useMemo } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { useSyncStore } from '@/features/sync/application/stores/syncStore';
import { LocalTransaction, SyncEntityType, SyncStatus, ENTITY_LABELS, ENTITY_ICONS } from '@/features/sync/domain/sync';
import { formatDateTime } from '@/shared/lib/format';
import { Text, TextInput } from '@/shared/tw/index';

const STATUS_CFG: Record<SyncStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:  { label: 'รอ Sync',     color: '#a16207', bg: '#fed7aa',  icon: 'time-outline' },
  syncing:  { label: 'กำลัง Sync', color: '#0ea5e9',   bg: '#e0f2fe', icon: 'sync-outline' },
  success:  { label: 'สำเร็จ',      color: '#0f766e',  bg: '#d1fae5',  icon: 'checkmark-circle-outline' },
  failed:   { label: 'ล้มเหลว',    color: '#ef4444',   bg: '#ffe4e6',   icon: 'close-circle-outline' },
  conflict: { label: 'ขัดแย้ง',    color: '#f87171',  bg: '#fee2e2',  icon: 'alert-circle-outline' },
};

interface Props { onBack: () => void; onOpenQueue: () => void }

export const LocalTransactionScreen: React.FC<Props> = ({ onBack, onOpenQueue }) => {
  const { transactions, isOnline, getStats } = useSyncStore();
  const stats = getStats();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<SyncStatus | 'all'>('all');

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = !search ||
        t.documentNo.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.createdBy.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [transactions, search, filterStatus]);

  const renderItem = ({ item }: { item: LocalTransaction }) => {
    const sc = STATUS_CFG[item.status];
    const entityIcon = ENTITY_ICONS[item.entityType];
    return (
      <View className={cn('bg-white rounded-xl p-3 gap-2 border border-slate-200')}
        style={{
          shadowColor: '#09090b', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12, shadowRadius: 6, boxShadow: '0 4px 14px rgba(15, 23, 42, 0.07)',
        }}>
        <View className={cn('flex-row items-center gap-2')}>
          <View className={cn('w-10 h-10 rounded-lg bg-sky-100 items-center justify-center')}>
            <Ionicons name={entityIcon as any} size={20} color="#0284c7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text className={cn('text-xs font-semibold text-slate-950 font-bold')}>{item.documentNo}</Text>
            <Text className={cn('text-xs text-slate-500')} numberOfLines={1}>{item.description}</Text>
          </View>
          <View className={cn('flex-row items-center gap-[3px] rounded-full px-2 py-[3px]')} style={{ backgroundColor: sc.bg }}>
            <Ionicons name={sc.icon as any} size={11} color={sc.color} />
            <Text className={cn('text-[11px] font-bold')} style={{ color: sc.color }}>{sc.label}</Text>
          </View>
        </View>
        <View className={cn('flex-row flex-wrap gap-2')}>
          <View className={cn('flex-row items-center gap-[3px]')}>
            <Ionicons name="layers-outline" size={11} color="#57534e" />
            <Text className={cn('text-xs text-slate-500')}>{ENTITY_LABELS[item.entityType]}</Text>
          </View>
          <View className={cn('flex-row items-center gap-[3px]')}>
            <Ionicons name="person-outline" size={11} color="#57534e" />
            <Text className={cn('text-xs text-slate-500')}>{item.createdBy}</Text>
          </View>
          <View className={cn('flex-row items-center gap-[3px]')}>
            <Ionicons name="phone-portrait-outline" size={11} color="#57534e" />
            <Text className={cn('text-xs text-slate-500')}>{item.deviceName}</Text>
          </View>
          <Text className={cn('text-xs text-slate-500 ml-auto')}>{formatDateTime(item.createdAt)}</Text>
        </View>
        {item.syncAttempts > 0 && (
          <Text className={cn('text-xs text-slate-500 italic')}>ลองซิงค์แล้ว {item.syncAttempts} ครั้ง</Text>
        )}
        {item.status === 'failed' && item.errorMessage && (
          <View className={cn('flex-row items-start gap-1 bg-rose-50 rounded-lg p-2')}>
            <Ionicons name="warning-outline" size={12} color="#ef4444" />
            <Text className={cn('text-xs text-rose-600 flex-1')} numberOfLines={2}>{item.errorMessage}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-white px-3 py-3 border-b border-slate-200')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#292524" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-lg font-semibold text-slate-950')}>Local Transactions</Text>
          <View className={cn('flex-row items-center gap-[5px]')}>
            <View className={cn('w-[7px] h-[7px] rounded-full')} style={{ backgroundColor: isOnline ? '#0f766e' : '#ef4444' }} />
            <Text className={cn('text-xs text-slate-500')}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
        <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-50 rounded-xl px-2 py-1 border border-rose-500')} onPress={onOpenQueue}>
          <Ionicons name="cloud-upload-outline" size={18} color="#f87171" />
          <Text className={cn('text-xs text-rose-600 font-bold')}>Queue</Text>
          {stats.pending + stats.failed > 0 && (
            <View className={cn('absolute -top-[6px] -right-[6px] bg-rose-600 rounded-full min-w-[16px] h-4 items-center justify-center px-[3px]')}>
              <Text className={cn('text-[10px] text-white font-extrabold')}>{stats.pending + stats.failed}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View className={cn('flex-row bg-white px-3 py-2 gap-2 border-b border-slate-200')}>
        {[
          { label: 'รอ Sync', count: stats.pending,  color: '#a16207' },
          { label: 'ล้มเหลว', count: stats.failed,   color: '#ef4444' },
          { label: 'ขัดแย้ง', count: stats.conflict, color: '#f87171' },
          { label: 'สำเร็จ',  count: stats.success,  color: '#0f766e' },
        ].map((s, i) => (
          <TouchableOpacity
            key={i}
            className={cn('flex-1 items-center py-1 rounded-lg', filterStatus === (['pending','failed','conflict','success'][i]) && 'bg-rose-50')}
            onPress={() => setFilterStatus((['pending','failed','conflict','success'][i]) as SyncStatus)}
          >
            <Text className={cn('text-[22px] font-extrabold')} style={{ color: s.color }}>{s.count}</Text>
            <Text className={cn('text-xs text-slate-500 text-[10px]')}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className={cn('flex-row items-center gap-2 p-3')}>
        <View className={cn('flex-1 flex-row items-center gap-2 bg-white rounded-xl px-3 h-[42px] border border-slate-200')}>
          <Ionicons name="search-outline" size={16} color="#57534e" />
          <TextInput
            className={cn('flex-1 text-base text-slate-950')}
            placeholder="ค้นหาเอกสาร, ผู้สร้าง..."
            placeholderTextColor="#57534e"
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#57534e" />
            </TouchableOpacity>
          )}
        </View>
        {filterStatus !== 'all' && (
          <TouchableOpacity className={cn('bg-rose-50 rounded-lg px-2 py-[6px]')} onPress={() => setFilterStatus('all')}>
            <Text className={cn('text-xs text-rose-600 font-semibold')}>ล้าง</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={t => t.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className={cn('items-center py-[60px] gap-3')}>
            <Ionicons name="document-outline" size={56} color="#e7e5e4" />
            <Text className={cn('text-base leading-relaxed text-slate-500')}>ไม่พบรายการ</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};
