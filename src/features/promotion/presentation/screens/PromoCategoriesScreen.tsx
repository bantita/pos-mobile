import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { usePromoManagementStore } from '@/features/promotion/application/stores/promoManagementStore';
import { cn } from '@/shared/lib/cn';

const PROMO_CATEGORIES = [
  { id: '1', key: 'store' as const,    label: 'ร้านค้า',      icon: 'storefront-outline',   route: 'PromoList' },
  { id: '2', key: 'member' as const,   label: 'สมาชิก',       icon: 'people-outline',       route: 'MemberPromoList' },
  { id: '3', key: 'group' as const,    label: 'กลุ่มสินค้า',   icon: 'albums-outline',       route: 'GroupProductPromoList' },
  { id: '4', key: 'bundle' as const,   label: 'สินค้าร่วม',   icon: 'layers-outline',       route: 'BundleProductPromoList' },
  { id: '5', key: 'quantity' as const, label: 'จำนวนสินค้า',  icon: 'calculator-outline',   route: 'QuantityPromoList' },
];

const ICON_COLORS: Record<string, { color: string; bgColor: string }> = {
  store:    { color: '#f87171',    bgColor: '#fee2e2' },
  member:   { color: '#0284c7', bgColor: '#e0f2fe' },
  group:    { color: '#f87171',  bgColor: '#fee2e2' },
  bundle:   { color: '#a16207',    bgColor: '#fed7aa' },
  quantity: { color: '#0f766e',    bgColor: '#d1fae5' },
};

interface Props {
  onNavigate: (screen: string) => void;
}

export const PromoCategoriesScreen: React.FC<Props> = ({ onNavigate }) => {
  const { getActiveCountByCategory } = usePromoManagementStore();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  let counts: { store: number; member: number; group: number; bundle: number; quantity: number };
  try {
    counts = getActiveCountByCategory();
    if (error) setError(false);
  } catch {
    counts = { store: 0, member: 0, group: 0, bundle: 0, quantity: 0 };
    if (!error) setError(true);
  }

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(false);
    setTimeout(() => {
      try {
        getActiveCountByCategory();
        setError(false);
      } catch {
        setError(true);
      }
      setLoading(false);
    }, 500);
  }, [getActiveCountByCategory]);

  const renderCategory = ({ item }: { item: typeof PROMO_CATEGORIES[number] }) => {
    const activeCount = counts[item.key];
    const iconCfg = ICON_COLORS[item.key];

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onNavigate(item.route)}
        accessibilityRole="button"
        accessibilityLabel={`${item.label} - ${activeCount} Active`}
      >
        <View className={cn('bg-white rounded-2xl p-4 shadow-sm')}>
          <View className={cn('flex-row items-center gap-3')}>
            <View className={cn('w-11 h-11 rounded-full items-center justify-center')} style={{ backgroundColor: iconCfg.bgColor }}>
              <Ionicons name={item.icon as any} size={22} color={iconCfg.color} />
            </View>

            <View className={cn('flex-1 gap-1')}>
              <Text className={cn('text-sm font-extrabold text-slate-950')}>{item.label}</Text>
              <View className={cn('self-start rounded-full px-2 py-0.5')} style={{ backgroundColor: activeCount > 0 ? '#d1fae5' : '#e5e7eb' }}>
                <Text className={cn('text-xs font-bold')} style={{ color: activeCount > 0 ? '#0f766e' : '#6b7280' }}>
                  {activeCount > 0 ? `${activeCount} Active` : '0'}
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (error && !loading) {
    return (
      <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
        <View className={cn('bg-rose-600 px-4 py-4 shadow-sm')}>
          <Text className={cn('text-xl font-extrabold text-white')}>โปรโมชั่น</Text>
          <Text className={cn('text-sm font-medium text-white/70')}>Promotion Categories</Text>
        </View>
        <View className={cn('flex-1 items-center justify-center px-5 gap-3')}>
          <Ionicons name="cloud-offline-outline" size={56} color="#d1d5db" />
          <Text className={cn('text-xl font-extrabold text-gray-400 text-center')}>ไม่สามารถโหลดข้อมูลได้</Text>
          <Text className={cn('text-sm font-medium text-slate-600 text-center')}>กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง</Text>
          <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-600 rounded-xl px-4 py-2 mt-3 shadow-lg shadow-rose-500/40')} onPress={handleRetry} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={18} color="#fafafa" />
            <Text className={cn('text-base font-bold text-white')}>ลองใหม่</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('bg-rose-600 px-4 py-4 shadow-sm')}>
        <Text className={cn('text-xl font-extrabold text-white')}>โปรโมชั่น</Text>
        <Text className={cn('text-sm font-medium text-white/70')}>Promotion Categories</Text>
      </View>

      {loading && (
        <View className={cn('py-3 items-center')}>
          <ActivityIndicator size="small" color="#f87171" />
        </View>
      )}

      <FlatList
        data={PROMO_CATEGORIES}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 20, gap: 10 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};
