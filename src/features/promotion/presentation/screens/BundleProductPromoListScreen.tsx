import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { BundlePromotion, BundlePromoStatus } from '@/features/promotion/domain/bundlePromo';
import { usePromoManagementStore } from '@/features/promotion/application/stores/promoManagementStore';

interface Props {
  onBack: () => void;
  onCreateNew: () => void;
}

const STATUS_CONFIG: Record<BundlePromoStatus, { label: string; color: string; bgColor: string }> = {
  draft:    { label: 'แบบร่าง', color: '#4b5563',  bgColor: '#e5e7eb' },
  active:   { label: 'Active',  color: '#0f766e',  bgColor: '#d1fae5' },
  expired:  { label: 'Expired', color: '#a16207',  bgColor: '#fed7aa' },
  disabled: { label: 'Disabled', color: '#ef4444',  bgColor: '#ffe4e6' },
};

const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  set_price: 'ตั้งราคาขาย',
  fixed_amount: 'ส่วนลดเงิน',
  percent: 'ส่วนลด %',
  free_product: 'แถมสินค้า',
};

const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

const formatDiscount = (promo: BundlePromotion): string => {
  switch (promo.discountType) {
    case 'percent':
      return `ส่วนลด ${promo.discountValue}%`;
    case 'fixed_amount':
      return `ส่วนลด ฿${promo.discountValue.toLocaleString()}`;
    case 'set_price':
      return `ราคาเซ็ต ฿${promo.discountValue.toLocaleString()}`;
    case 'free_product':
      return `แถมสินค้า ${promo.freeProducts.length} รายการ`;
    default:
      return '';
  }
};

export const BundleProductPromoListScreen: React.FC<Props> = ({ onBack, onCreateNew }) => {
  const { bundlePromos } = usePromoManagementStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return bundlePromos;
    const keyword = search.toLowerCase();
    return bundlePromos.filter((p) =>
      p.name.toLowerCase().includes(keyword)
    );
  }, [bundlePromos, search]);

  const renderPromo = ({ item }: { item: BundlePromotion }) => {
    const statusCfg = STATUS_CONFIG[item.status];

    return (
      <View className={cn('bg-white rounded-2xl p-4 shadow-sm gap-2')}>
        <View className={cn('flex-row items-center gap-2')}>
          <View className={cn('w-11 h-11 rounded-2xl bg-sky-100 items-center justify-center')}>
            <Ionicons name="layers-outline" size={20} color="#0284c7" />
          </View>
          <View className={cn('flex-1')}>
            <Text className={cn('text-sm font-extrabold text-slate-950')} numberOfLines={1}>{item.name}</Text>
            <Text className={cn('text-xs font-medium text-slate-500')}>{DISCOUNT_TYPE_LABELS[item.discountType] || item.discountType}</Text>
          </View>
          <View className={cn('rounded-full px-2 py-0.5')} style={{ backgroundColor: statusCfg.bgColor }}>
            <Text className={cn('text-xs font-bold')} style={{ color: statusCfg.color }}>{statusCfg.label}</Text>
          </View>
        </View>

        <View className={cn('gap-1')}>
          <View className={cn('flex-row items-center gap-1.5')}>
            <Ionicons name="pricetag-outline" size={13} color="#57534e" />
            <Text className={cn('text-xs font-medium text-slate-950')}>{formatDiscount(item)}</Text>
          </View>
          {item.minBillTotal > 0 && (
            <View className={cn('flex-row items-center gap-1.5')}>
              <Ionicons name="cart-outline" size={13} color="#57534e" />
              <Text className={cn('text-xs font-medium text-slate-950')}>ขั้นต่ำ ฿{item.minBillTotal.toLocaleString()}</Text>
            </View>
          )}
          <View className={cn('flex-row items-center gap-1.5')}>
            <Ionicons name="calendar-outline" size={13} color="#57534e" />
            <Text className={cn('text-xs font-medium text-slate-950')}>
              {formatDate(item.startDate)} ~ {item.endDate ? formatDate(item.endDate) : 'ไม่กำหนด'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('bg-rose-600 flex-row items-center px-3 py-3 gap-2 shadow-sm')}>
        <TouchableOpacity className={cn('w-10 h-10 rounded-full items-center justify-center bg-white/20')} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fafafa" />
        </TouchableOpacity>
        <Text className={cn('text-xl font-extrabold text-white flex-1')}>สินค้าร่วม</Text>
        <TouchableOpacity className={cn('flex-row items-center gap-1 bg-white/20 rounded-xl px-3 py-2 min-h-10')} onPress={onCreateNew} activeOpacity={0.7}>
          <Ionicons name="add" size={18} color="#fafafa" />
          <Text className={cn('text-base font-bold text-white')}>เพิ่ม</Text>
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
        keyExtractor={(p) => p.id}
        renderItem={renderPromo}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 100, gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className={cn('items-center py-20 gap-3')}>
            <Ionicons name="layers-outline" size={56} color="#d1d5db" />
            <Text className={cn('text-xl font-extrabold text-gray-400')}>ยังไม่มีโปรโมชั่นสินค้าร่วม</Text>
            <Text className={cn('text-sm font-medium text-slate-500')}>กดปุ่มด้านล่างเพื่อสร้างโปรโมชั่นใหม่</Text>
            <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-500 rounded-xl px-4 py-2 mt-3 shadow-lg shadow-rose-500/40')} onPress={onCreateNew} activeOpacity={0.85}>
              <Ionicons name="add" size={18} color="#fafafa" />
              <Text className={cn('text-base font-bold text-white')}>สร้างโปรโมชั่น</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {bundlePromos.length > 0 && (
        <TouchableOpacity
          className={cn('absolute bottom-4 right-4 flex-row items-center gap-1 bg-rose-600 rounded-full px-4 py-3 shadow-lg shadow-rose-500/40')}
          onPress={onCreateNew}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={22} color="#fafafa" />
          <Text className={cn('text-base font-bold text-white')}>สร้างโปรโมชั่น</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};
