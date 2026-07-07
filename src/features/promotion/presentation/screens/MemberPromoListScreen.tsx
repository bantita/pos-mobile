import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { MOCK_MEMBER_PROMOTIONS } from '@/features/promotion/data/mocks/mockMemberPromotions';
import { MemberPromotion, MemberPromoType, MemberPromoStatus } from '@/features/promotion/domain/memberPromotion';
import { cn } from '@/shared/lib/cn';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';

const TYPE_ICON_MAP: Record<MemberPromoType, string> = {
  member_price: 'pricetag-outline',
  level_discount: 'trending-up-outline',
  birthday: 'gift-outline',
  welcome: 'hand-left-outline',
  level_upgrade: 'arrow-up-circle-outline',
  bonus_points: 'star-outline',
  points_to_discount: 'swap-horizontal-outline',
  points_to_product: 'bag-check-outline',
  spend_milestone: 'trophy-outline',
  visit_milestone: 'footsteps-outline',
  segment: 'people-circle-outline',
  win_back: 'heart-outline',
  favorite_product: 'bookmark-outline',
  avg_spend: 'analytics-outline',
  vip_exclusive: 'diamond-outline',
  stamp: 'grid-outline',
  referral: 'share-social-outline',
  anniversary: 'calendar-outline',
};

const TYPE_LABEL_MAP: Record<MemberPromoType, string> = {
  member_price: 'ราคาสมาชิก',
  level_discount: 'ส่วนลดตามระดับ',
  birthday: 'วันเกิด',
  welcome: 'สมัครใหม่',
  level_upgrade: 'เลื่อนระดับ',
  bonus_points: 'แต้มสะสมพิเศษ',
  points_to_discount: 'แต้มแลกส่วนลด',
  points_to_product: 'แต้มแลกสินค้า',
  spend_milestone: 'ยอดซื้อสะสม',
  visit_milestone: 'จำนวนครั้งซื้อ',
  segment: 'เฉพาะกลุ่ม',
  win_back: 'ลูกค้ากลับมา',
  favorite_product: 'ตามสินค้าโปรด',
  avg_spend: 'ตามยอดซื้อเฉลี่ย',
  vip_exclusive: 'VIP เท่านั้น',
  stamp: 'Stamp Campaign',
  referral: 'แนะนำเพื่อน',
  anniversary: 'ครบรอบสมาชิก',
};

const STATUS_CONFIG: Record<MemberPromoStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Active', color: '#0f766e', bgColor: '#d1fae5' },
  paused: { label: 'Paused', color: '#a16207', bgColor: '#fed7aa' },
  expired: { label: 'Expired', color: '#6b7280', bgColor: '#e5e7eb' },
  draft: { label: 'Draft', color: '#9ca3af', bgColor: '#f5f5f5' },
};

interface Props {
  onBack: () => void;
  onSelectPromo: (promoId: string) => void;
}

export const MemberPromoListScreen: React.FC<Props> = ({ onBack, onSelectPromo }) => {
  const promotions = [...MOCK_MEMBER_PROMOTIONS].sort((a, b) => a.priority - b.priority);
  const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; variant: 'info' | 'success' | 'warning' | 'danger' }>({ visible: false, title: '', message: '', variant: 'info' });

  if (!promotions || promotions.length === 0) {
    if (!alert.visible) {
      setAlert({ visible: true, title: 'ข้อผิดพลาด', message: 'ไม่พบข้อมูลโปรโมชั่นสมาชิก', variant: 'info' });
    }
  }

  const renderPromoItem = ({ item }: { item: MemberPromotion }) => {
    const iconName = TYPE_ICON_MAP[item.type] || 'ellipse-outline';
    const typeLabel = TYPE_LABEL_MAP[item.type] || item.type;
    const statusCfg = STATUS_CONFIG[item.status];

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelectPromo(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name} - ${statusCfg.label}`}
      >
        <View className={cn('bg-white rounded-2xl p-4 shadow-sm')}>
          <View className={cn('flex-row items-center gap-3')}>
            <View className={cn('w-11 h-11 rounded-full items-center justify-center')} style={{ backgroundColor: '#e0f2fe' }}>
              <Ionicons name={iconName as any} size={22} color="#0284c7" />
            </View>

            <View className={cn('flex-1 gap-1')}>
              <Text className={cn('text-sm font-extrabold text-slate-950')} numberOfLines={1}>{item.name}</Text>
              <Text className={cn('text-xs font-bold text-sky-600')}>{typeLabel}</Text>
              <Text className={cn('text-xs font-medium text-slate-600')} numberOfLines={1}>{item.description}</Text>
            </View>

            <View className={cn('items-end gap-2')}>
              <View className={cn('rounded-full px-2 py-0.5')} style={{ backgroundColor: statusCfg.bgColor }}>
                <Text className={cn('text-xs font-bold')} style={{ color: statusCfg.color }}>
                  {statusCfg.label}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('bg-rose-600 px-4 py-4 flex-row items-center gap-3 shadow-sm')}>
        <TouchableOpacity
          onPress={onBack}
          className={cn('w-9 h-9 rounded-full items-center justify-center bg-white/20')}
          accessibilityRole="button"
          accessibilityLabel="กลับ"
        >
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View className={cn('flex-1')}>
          <Text className={cn('text-xl font-extrabold text-white')}>โปรโมชั่นสมาชิก</Text>
          <Text className={cn('text-sm font-medium text-white/70')}>Member Promotions</Text>
        </View>
      </View>

      <FlatList
        data={promotions}
        keyExtractor={(item) => item.id}
        renderItem={renderPromoItem}
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 20, gap: 10 }}
        showsVerticalScrollIndicator={false}
      />

      <AlertDialog
        visible={alert.visible}
        onClose={() => setAlert({ ...alert, visible: false })}
        title={alert.title}
        message={alert.message}
        variant={alert.variant}
        confirmLabel="ตกลง"
      />
    </SafeAreaView>
  );
};
