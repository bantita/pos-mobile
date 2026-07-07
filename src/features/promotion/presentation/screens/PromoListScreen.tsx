import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Pressable } from '@/shared/tw/index';
import { Modal } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { Promotion, PromoStatus, PromoType } from '@/features/promotion/domain/promotion';
import { usePromoStore } from '@/features/promotion/application/stores/promoStore';
import { cn } from '@/shared/lib/cn';

interface Props {
  onNavigate: (screen: string) => void;
  onBack?: () => void;
}

type FilterTab = 'all' | 'active' | 'expired' | 'disabled';

const PROMO_TYPE_CONFIG: Record<PromoType, { icon: string; color: string; bgColor: string; label: string }> = {
  percent:      { icon: 'pricetag-outline',       color: '#f87171',    bgColor: '#fee2e2',  label: 'ส่วนลด %' },
  fixed:        { icon: 'cash-outline',           color: '#0f766e',    bgColor: '#d1fae5',  label: 'ส่วนลดเงิน' },
  coupon:       { icon: 'ticket-outline',         color: '#f87171',  bgColor: '#fee2e2',  label: 'คูปอง' },
  member_price: { icon: 'people-outline',         color: '#0284c7', bgColor: '#e0f2fe',   label: 'ราคาสมาชิก' },
  buy_x_get_y:  { icon: 'gift-outline',           color: '#a16207',    bgColor: '#fed7aa',  label: 'ซื้อ X แถม Y' },
  mix_match:    { icon: 'layers-outline',         color: '#4b5563',    bgColor: '#f5f5f5',       label: 'Mix & Match' },
  happy_hour:   { icon: 'time-outline',           color: '#ef4444',     bgColor: '#ffe4e6',   label: 'Happy Hour' },
};

const STORE_PROMO_TYPES: { key: string; type: PromoType; route: string }[] = [
  { key: '1', type: 'percent',     route: 'PercentDiscount' },
  { key: '2', type: 'fixed',       route: 'FixedDiscount' },
  { key: '3', type: 'coupon',      route: 'Coupon' },
  { key: '4', type: 'buy_x_get_y', route: 'BuyXGetY' },
  { key: '5', type: 'mix_match',   route: 'MixMatch' },
  { key: '6', type: 'happy_hour',  route: 'HappyHour' },
];

const STATUS_CONFIG: Record<PromoStatus, { label: string; color: string; bgColor: string }> = {
  draft:    { label: 'แบบร่าง', color: '#4b5563',  bgColor: '#e5e7eb' },
  active:   { label: 'Active',  color: '#0f766e',  bgColor: '#d1fae5' },
  expired:  { label: 'Expired', color: '#a16207',  bgColor: '#fed7aa' },
  disabled: { label: 'Disabled', color: '#ef4444',  bgColor: '#ffe4e6' },
};

export const PromoListScreen: React.FC<Props> = ({ onNavigate, onBack }) => {
  const { promotions } = usePromoStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [showTypeModal, setShowTypeModal] = useState(false);

  const storePromotions = useMemo(() => {
    return promotions.filter((p) => p.type !== 'member_price');
  }, [promotions]);

  const filtered = useMemo(() => {
    return storePromotions.filter((p) => {
      const matchSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.promoCode.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || p.status === filter;
      return matchSearch && matchFilter;
    });
  }, [storePromotions, search, filter]);

  const counts = {
    all: storePromotions.length,
    active: storePromotions.filter(p => p.status === 'active').length,
    expired: storePromotions.filter(p => p.status === 'expired').length,
    disabled: storePromotions.filter(p => p.status === 'disabled').length,
  };

  const FILTERS: { key: FilterTab; label: string; count: number; color: string }[] = [
    { key: 'all',      label: 'ทั้งหมด',  count: counts.all,      color: '#292524' },
    { key: 'active',   label: 'Active',   count: counts.active,   color: '#0f766e' },
    { key: 'expired',  label: 'Expired',  count: counts.expired,  color: '#a16207' },
    { key: 'disabled', label: 'Disabled', count: counts.disabled, color: '#ef4444' },
  ];

  const handleCreatePromo = (route: string) => {
    setShowTypeModal(false);
    onNavigate(route);
  };

  const renderPromo = ({ item }: { item: Promotion }) => {
    const typeCfg = PROMO_TYPE_CONFIG[item.type];
    const statusCfg = STATUS_CONFIG[item.status];

    return (
      <View className={cn('bg-white rounded-2xl p-4 shadow-sm gap-2')}>
        <View className={cn('flex-row items-center gap-2')}>
          <View className={cn('w-11 h-11 rounded-2xl items-center justify-center')} style={{ backgroundColor: typeCfg.bgColor }}>
            <Ionicons name={typeCfg.icon as any} size={20} color={typeCfg.color} />
          </View>
          <View className={cn('flex-1')}>
            <Text className={cn('text-sm font-extrabold text-slate-950')} numberOfLines={1}>{item.name}</Text>
            <Text className={cn('text-xs font-medium text-slate-600')}>{item.promoCode}</Text>
          </View>
          <View className={cn('rounded-full px-2 py-0.5')} style={{ backgroundColor: statusCfg.bgColor }}>
            <Text className={cn('text-xs font-bold')} style={{ color: statusCfg.color }}>{statusCfg.label}</Text>
          </View>
        </View>

        <View className={cn('gap-1')}>
          <View className={cn('flex-row items-center gap-1.5')}>
            <Ionicons name="calendar-outline" size={13} color="#57534e" />
            <Text className={cn('text-xs font-medium text-slate-950')}>{item.startDate} ~ {item.endDate}</Text>
          </View>
          <View className={cn('flex-row items-center gap-1.5')}>
            <Ionicons name="stats-chart-outline" size={13} color="#57534e" />
            <Text className={cn('text-xs font-medium text-slate-950')}>ใช้ไป {item.usageCount} ครั้ง</Text>
          </View>
        </View>

        <View className={cn('flex-row items-center pt-2 border-t border-slate-100')}>
          <View className={cn('rounded-full px-2 py-0.5')} style={{ backgroundColor: typeCfg.bgColor }}>
            <Text className={cn('text-xs font-bold')} style={{ color: typeCfg.color }}>{typeCfg.label}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View className={cn('items-center py-20 gap-3')}>
      <Ionicons name="pricetag-outline" size={56} color="#d1d5db" />
      <Text className={cn('text-xl font-extrabold text-gray-400')}>ไม่พบโปรโมชั่น</Text>
      <Text className={cn('text-sm font-medium text-slate-600 text-center px-5')}>
        {search || filter !== 'all'
          ? 'ลองเปลี่ยนตัวกรองหรือคำค้นหา'
          : 'กดปุ่มด้านล่างเพื่อสร้างโปรโมชั่นใหม่'}
      </Text>
      <TouchableOpacity
        className={cn('flex-row items-center gap-1 bg-rose-500 rounded-full px-4 py-2 shadow-lg shadow-rose-500/40')}
        onPress={() => setShowTypeModal(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add-circle-outline" size={18} color="#fafafa" />
        <Text className={cn('text-base font-bold text-white')}>สร้างโปรโมชั่น</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('bg-rose-600 px-4 py-4 shadow-sm')}>
        <View className={cn('flex-row items-center gap-2')}>
          {onBack && (
            <TouchableOpacity onPress={onBack} className={cn('w-9 h-9 rounded-full items-center justify-center bg-white/20')} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color="#fafafa" />
            </TouchableOpacity>
          )}
          <View>
            <Text className={cn('text-xl font-extrabold text-white')}>โปรโมชั่นร้านค้า</Text>
            <Text className={cn('text-sm font-medium text-white/70')}>Store Promotions</Text>
          </View>
        </View>
      </View>

      <View className={cn('flex-row bg-white border-b border-slate-200 shadow-sm')}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            className={cn('flex-1 items-center py-2')}
            style={{ borderBottomWidth: filter === f.key ? 2.5 : 0, borderBottomColor: filter === f.key ? f.color : 'transparent' }}
            onPress={() => setFilter(f.key)}
          >
            <Text className={cn('text-2xl font-extrabold')} style={{ color: f.color }}>{f.count}</Text>
            <Text className={cn('text-xs font-medium text-slate-600')}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className={cn('px-3 pb-1 pt-3')}>
        <View className={cn('flex-row items-center gap-2 bg-white rounded-xl px-3 h-11 border border-slate-200 shadow-sm')}>
          <Ionicons name="search-outline" size={16} color="#9ca3af" />
          <TextInput
            className={cn('flex-1 text-sm font-medium text-slate-950')}
            placeholder="ค้นหาชื่อหรือรหัสโปรโมชั่น..."
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
        ListEmptyComponent={renderEmptyState}
      />

      <TouchableOpacity
        className={cn('absolute bottom-4 right-4 flex-row items-center gap-1 bg-rose-600 rounded-full px-4 py-3 shadow-lg shadow-rose-500/40')}
        onPress={() => setShowTypeModal(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={22} color="#fafafa" />
        <Text className={cn('text-base font-bold text-white')}>สร้างโปรโมชั่น</Text>
      </TouchableOpacity>

      <Modal
        visible={showTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <Pressable className={cn('flex-1 justify-end bg-black/40')} onPress={() => setShowTypeModal(false)}>
          <Pressable className={cn('bg-white rounded-t-3xl px-4 pb-5 pt-3')} onPress={() => {}}>
            <View className={cn('w-10 h-1 rounded-full bg-slate-300 self-center mb-3')} />
            <Text className={cn('text-xl font-extrabold text-slate-950 mb-4 text-center')}>เลือกประเภทโปรโมชั่น</Text>
            <View className={cn('flex-row flex-wrap gap-3 justify-between')}>
              {STORE_PROMO_TYPES.map((item) => {
                const cfg = PROMO_TYPE_CONFIG[item.type];
                return (
                  <TouchableOpacity
                    key={item.key}
                    className={cn('items-center gap-1 py-2')}
                    style={{ width: '30%' }}
                    onPress={() => handleCreatePromo(item.route)}
                    activeOpacity={0.7}
                  >
                    <View className={cn('w-14 h-14 rounded-2xl items-center justify-center')} style={{ backgroundColor: cfg.bgColor }}>
                      <Ionicons name={cfg.icon as any} size={24} color={cfg.color} />
                    </View>
                    <Text className={cn('text-xs font-bold text-slate-950 text-center')}>{cfg.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              className={cn('mt-4 items-center py-3 rounded-xl bg-neutral-100')}
              onPress={() => setShowTypeModal(false)}
              activeOpacity={0.7}
            >
              <Text className={cn('text-base font-bold text-slate-600')}>ยกเลิก</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};
