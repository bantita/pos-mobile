import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { usePromoManagementStore } from '@/features/promotion/application/stores/promoManagementStore';
import { QuantityPromotion, QuantityPromoStatus } from '@/features/promotion/domain/quantityPromo';
import { cn } from '@/shared/lib/cn';

const STATUS_CONFIG: Record<QuantityPromoStatus, { label: string; color: string; bgColor: string }> = {
  draft:    { label: 'แบบร่าง', color: '#4b5563',  bgColor: '#e5e7eb' },
  active:   { label: 'Active',  color: '#0f766e',  bgColor: '#d1fae5' },
  expired:  { label: 'Expired', color: '#a16207',  bgColor: '#fed7aa' },
  disabled: { label: 'Disabled', color: '#ef4444',  bgColor: '#ffe4e6' },
};

interface Props {
  onBack: () => void;
  onCreateNew: () => void;
}

const formatDate = (isoDate: string): string => {
  try {
    const d = new Date(isoDate);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return isoDate;
  }
};

export const QuantityPromoListScreen: React.FC<Props> = ({ onBack, onCreateNew }) => {
  const { quantityPromos } = usePromoManagementStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return quantityPromos;
    const keyword = search.toLowerCase();
    return quantityPromos.filter(
      (p) => p.name.toLowerCase().includes(keyword)
    );
  }, [quantityPromos, search]);

  const renderItem = ({ item, index }: { item: QuantityPromotion; index: number }) => {
    const statusCfg = STATUS_CONFIG[item.status];

    return (
      <View className={cn('bg-white rounded-2xl p-4 shadow-sm')}>
        <View className={cn('flex-row items-center gap-3')}>
          <View className={cn('w-8 h-8 rounded-2xl bg-rose-100 items-center justify-center')}>
            <Text className={cn('text-xs font-extrabold text-rose-600')}>{index + 1}</Text>
          </View>
          <View className={cn('flex-1')}>
            <Text className={cn('text-sm font-extrabold text-slate-950')} numberOfLines={1}>{item.name}</Text>
            <View className={cn('self-start rounded-full px-2 py-0.5 mt-1')} style={{ backgroundColor: statusCfg.bgColor }}>
              <Text className={cn('text-xs font-bold')} style={{ color: statusCfg.color }}>{statusCfg.label}</Text>
            </View>
          </View>
          <View className={cn('items-end gap-1')}>
            <Text className={cn('text-xs font-bold text-slate-500')}>เริ่ม</Text>
            <Text className={cn('text-xs font-medium text-slate-950')}>{formatDate(item.startDate)}</Text>
          </View>
          <View className={cn('items-end gap-1')}>
            <Text className={cn('text-xs font-bold text-slate-500')}>สิ้นสุด</Text>
            <Text className={cn('text-xs font-medium text-slate-950')}>
              {item.noEndDate ? 'ไม่กำหนด' : item.endDate ? formatDate(item.endDate) : '-'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('bg-rose-600 flex-row items-center px-3 py-3 gap-2 shadow-sm')}>
        <TouchableOpacity
          onPress={onBack}
          className={cn('w-9 h-9 rounded-full items-center justify-center bg-white/20')}
          accessibilityRole="button"
          accessibilityLabel="กลับ"
        >
          <Ionicons name="arrow-back" size={22} color="#fafafa" />
        </TouchableOpacity>
        <View className={cn('flex-1')}>
          <Text className={cn('text-xl font-extrabold text-white')}>จำนวนสินค้า</Text>
          <Text className={cn('text-xs font-medium text-white/70')}>Quantity Promotions</Text>
        </View>
        <TouchableOpacity
          onPress={onCreateNew}
          className={cn('flex-row items-center gap-1 rounded-xl px-2 py-1 bg-white/20')}
          accessibilityRole="button"
          accessibilityLabel="เพิ่มโปรโมชั่นจำนวนสินค้า"
        >
          <Ionicons name="add" size={18} color="#fafafa" />
          <Text className={cn('text-sm font-bold text-white')}>เพิ่ม</Text>
        </TouchableOpacity>
      </View>

      <View className={cn('px-3 pb-1 pt-3')}>
        <View className={cn('flex-row items-center gap-2 bg-white rounded-xl px-3 h-11 border border-slate-200 shadow-sm')}>
          <Ionicons name="search-outline" size={16} color="#9ca3af" />
          <TextInput
            className={cn('flex-1 text-sm font-medium text-slate-950')}
            placeholder="ค้นหาชื่อโปรโมชั่น..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(p: QuantityPromotion) => p.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className={cn('items-center py-20 gap-3')}>
            <Ionicons name="calculator-outline" size={56} color="#d1d5db" />
            <Text className={cn('text-xl font-extrabold text-gray-400 text-center')}>ยังไม่มีโปรโมชั่นจำนวนสินค้า</Text>
            <Text className={cn('text-sm font-medium text-slate-600 text-center')}>กดปุ่ม "+ เพิ่ม" เพื่อสร้างโปรโมชั่นใหม่</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};
