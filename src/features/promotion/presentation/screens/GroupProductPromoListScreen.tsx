import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { usePromoManagementStore } from '@/features/promotion/application/stores/promoManagementStore';
import { ProductGroupPromotion, ProductGroupPromoStatus } from '@/features/promotion/domain/productGroupPromo';

interface Props {
  onBack: () => void;
  onCreateNew: () => void;
}

const STATUS_CONFIG: Record<ProductGroupPromoStatus, { label: string; color: string; bgColor: string }> = {
  draft:    { label: 'แบบร่าง', color: '#4b5563',  bgColor: '#e5e7eb' },
  active:   { label: 'Active',  color: '#0f766e',  bgColor: '#d1fae5' },
  expired:  { label: 'Expired', color: '#a16207',  bgColor: '#fed7aa' },
  disabled: { label: 'Disabled', color: '#ef4444',  bgColor: '#ffe4e6' },
};

const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  set_price: 'ตั้งราคา',
  fixed_amount: 'ลดเงิน',
  percent: 'ลด %',
  free_product: 'แถมสินค้า',
};

function formatDate(isoDate?: string): string {
  if (!isoDate) return '-';
  const d = new Date(isoDate);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatDiscount(type: string, value: number): string {
  switch (type) {
    case 'percent': return `${value}%`;
    case 'fixed_amount': return `฿${value.toLocaleString()}`;
    case 'set_price': return `฿${value.toLocaleString()}`;
    case 'free_product': return 'แถมสินค้า';
    default: return `${value}`;
  }
}

export const GroupProductPromoListScreen: React.FC<Props> = ({ onBack, onCreateNew }) => {
  const { productGroupPromos } = usePromoManagementStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return productGroupPromos;
    const keyword = search.toLowerCase();
    return productGroupPromos.filter(
      (p) => p.name.toLowerCase().includes(keyword)
    );
  }, [productGroupPromos, search]);

  const renderRow = ({ item, index }: { item: ProductGroupPromotion; index: number }) => {
    const statusCfg = STATUS_CONFIG[item.status];
    return (
      <View className={cn('bg-white rounded-2xl p-4 shadow-sm')}>
        <View className={cn('flex-row items-center gap-2 mb-2')}>
          <View className={cn('flex-1')}>
            <Text className={cn('text-sm font-extrabold text-slate-950')} numberOfLines={1}>{item.name}</Text>
          </View>
          <View className={cn('rounded-full px-2 py-0.5')} style={{ backgroundColor: statusCfg.bgColor }}>
            <Text className={cn('text-xs font-bold')} style={{ color: statusCfg.color }}>{statusCfg.label}</Text>
          </View>
        </View>
        <View className={cn('flex-row gap-4')}>
          <View className={cn('flex-1')}>
            <Text className={cn('text-xs font-bold text-slate-500')}>ส่วนลด</Text>
            <Text className={cn('text-xs font-medium text-slate-950')}>{formatDiscount(item.discountType, item.discountValue)}</Text>
          </View>
          <View className={cn('flex-1')}>
            <Text className={cn('text-xs font-bold text-slate-500')}>ขั้นต่ำ</Text>
            <Text className={cn('text-xs font-medium text-slate-950')}>{item.minBillTotal > 0 ? `฿${item.minBillTotal.toLocaleString()}` : '-'}</Text>
          </View>
          <View className={cn('flex-1')}>
            <Text className={cn('text-xs font-bold text-slate-500')}>เริ่ม</Text>
            <Text className={cn('text-xs font-medium text-slate-950')}>{formatDate(item.startDate)}</Text>
          </View>
          <View className={cn('flex-1')}>
            <Text className={cn('text-xs font-bold text-slate-500')}>สิ้นสุด</Text>
            <Text className={cn('text-xs font-medium text-slate-950')}>{item.noEndDate ? 'ไม่กำหนด' : formatDate(item.endDate)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View className={cn('items-center py-20 gap-3')}>
      <Ionicons name="albums-outline" size={56} color="#d1d5db" />
      <Text className={cn('text-xl font-extrabold text-gray-400')}>ยังไม่มีโปรโมชั่นกลุ่มสินค้า</Text>
      <Text className={cn('text-sm font-medium text-slate-500')}>กดปุ่ม "+ เพิ่ม" เพื่อสร้างโปรโมชั่นใหม่</Text>
      <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-500 rounded-xl px-4 py-2 mt-3 shadow-lg shadow-rose-500/40')} onPress={onCreateNew} activeOpacity={0.8}>
        <Ionicons name="add" size={18} color="#fafafa" />
        <Text className={cn('text-base font-bold text-white')}>สร้างโปรโมชั่น</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('bg-rose-600 flex-row items-center px-3 py-3 gap-2 shadow-sm')}>
        <TouchableOpacity onPress={onBack} className={cn('w-10 h-10 rounded-full items-center justify-center bg-white/20')} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#fafafa" />
        </TouchableOpacity>
        <Text className={cn('text-lg font-extrabold text-white flex-1')}>กลุ่มสินค้า</Text>
        <TouchableOpacity onPress={onCreateNew} className={cn('flex-row items-center gap-1 bg-white/20 rounded-xl px-3 py-2 min-h-10')} activeOpacity={0.8}>
          <Ionicons name="add" size={16} color="#fafafa" />
          <Text className={cn('text-xs font-bold text-white')}>เพิ่ม</Text>
        </TouchableOpacity>
      </View>

      <View className={cn('p-3 pb-1')}>
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
        keyExtractor={(p: ProductGroupPromotion) => p.id}
        renderItem={renderRow}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 40, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
};
