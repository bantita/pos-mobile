import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { useMemberStore } from '@/features/member/application/stores/memberStore';
import { Member, PointTransaction, PointTransactionType } from '@/features/member/domain/member';
import { MemberPromotion } from '@/features/promotion/domain/memberPromotion';
import { MOCK_MEMBER_PROMOTIONS } from '@/features/promotion/data/mocks/mockMemberPromotions';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';

interface Props {
  member: Member;
  onBack: () => void;
  onRedeem: () => void;
  onGoToMemberPromo?: () => void;
}

const LEVEL_CONFIG = {
  member: { label: 'Member', color: '#e11d48', bgColor: '#ffe4e6' },
  silver: { label: 'Silver', color: '#6b7280', bgColor: '#f3f4f6' },
  gold: { label: 'Gold', color: '#a16207', bgColor: '#fed7aa' },
  platinum: { label: 'Platinum', color: '#6b21a8', bgColor: '#e9d5ff' },
  vip: { label: 'VIP', color: '#ef4444', bgColor: '#ffe4e6' },
};

const TYPE_CONFIG: Record<PointTransactionType, { icon: string; color: string; bgColor: string; prefix: string }> = {
  earn: { icon: 'arrow-up-circle', color: '#0f766e', bgColor: '#d1fae5', prefix: '+' },
  redeem: { icon: 'arrow-down-circle', color: '#ef4444', bgColor: '#ffe4e6', prefix: '' },
  expire: { icon: 'time', color: '#9ca3af', bgColor: '#fee2e2', prefix: '' },
  adjust: { icon: 'swap-horizontal-circle', color: '#a16207', bgColor: '#fed7aa', prefix: '' },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
};

const PROMO_TYPE_LABELS: Record<string, string> = {
  member_price: 'ราคาสมาชิก',
  level_discount: 'ส่วนลดตามระดับ',
  birthday: 'วันเกิด',
  welcome: 'สมัครใหม่',
  level_upgrade: 'เลื่อนระดับ',
  bonus_points: 'แต้มพิเศษ',
  points_to_discount: 'แต้มแลกส่วนลด',
  points_to_product: 'แต้มแลกสินค้า',
  spend_milestone: 'ยอดซื้อสะสม',
  visit_milestone: 'จำนวนครั้งซื้อ',
  segment: 'เฉพาะกลุ่ม',
  win_back: 'ลูกค้ากลับมา',
  favorite_product: 'สินค้าโปรด',
  avg_spend: 'ยอดซื้อเฉลี่ย',
  vip_exclusive: 'VIP เท่านั้น',
  stamp: 'Stamp Card',
  referral: 'แนะนำเพื่อน',
  anniversary: 'ครบรอบสมาชิก',
};

const summarizeRewards = (promo: MemberPromotion): string => {
  return promo.rewards.map((r) => {
    switch (r.type) {
      case 'discount_percent': return `ลด ${r.value}%`;
      case 'discount_amount': return `ลด ${r.value}฿`;
      case 'coupon': return `คูปอง ${r.value}฿`;
      case 'points': return `${r.value} แต้ม`;
      case 'free_product': return 'แถมสินค้า';
      case 'point_multiplier': return `แต้ม x${r.value}`;
      default: return '';
    }
  }).filter(Boolean).join(', ');
};

const getEligiblePromos = (memberLevel: string): MemberPromotion[] => {
  return MOCK_MEMBER_PROMOTIONS.filter((promo) => {
    if (promo.status !== 'active') return false;
    if (promo.applicableLevels && promo.applicableLevels.length > 0) {
      return promo.applicableLevels.includes(memberLevel);
    }
    return true;
  });
};

export const PointHistoryScreen: React.FC<Props> = ({ member, onBack, onRedeem, onGoToMemberPromo }) => {
  const { getPointHistory } = useMemberStore();
  const [showAlert, setShowAlert] = useState(false);

  const history = useMemo(() => {
    return getPointHistory(member.id).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [member.id]);

  const eligiblePromos = useMemo(() => getEligiblePromos(member.level), [member.level]);
  const levelCfg = LEVEL_CONFIG[member.level];

  const renderTransaction = ({ item }: { item: PointTransaction }) => {
    const cfg = TYPE_CONFIG[item.type];
    return (
      <View className="flex-row items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
        <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: cfg.bgColor }}>
          <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-xs font-bold text-slate-900" numberOfLines={1}>{item.description}</Text>
          <Text className="text-xs font-medium text-slate-500">{formatDate(item.createdAt)} · {item.refNo}</Text>
        </View>
        <Text className="text-base font-extrabold" style={{ color: cfg.color }}>
          {cfg.prefix}{item.points.toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f6f7fb]" edges={['top']}>
      <View className="flex-row items-center gap-3 bg-rose-600 px-4 pb-4 pt-4">
        <TouchableOpacity onPress={onBack} className="rounded-full bg-white/20 p-1.5">
          <Ionicons name="arrow-back" size={22} color="#fafafa" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-extrabold text-white">ประวัติคะแนน</Text>
          <Text className="text-xs font-medium text-white/70">{member.name}</Text>
        </View>
        <TouchableOpacity
          className="flex-row items-center gap-1.5 rounded-xl border border-white/40 bg-white/20 px-3 py-2"
          onPress={onRedeem}
        >
          <Ionicons name="gift-outline" size={16} color="#fafafa" />
          <Text className="text-xs font-bold text-white">ใช้คะแนน</Text>
        </TouchableOpacity>
      </View>

      <View className="mx-4 my-3 rounded-2xl bg-white p-4 shadow-sm">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: levelCfg.bgColor }}>
            <Text className="text-lg font-bold" style={{ color: levelCfg.color }}>
              {member.name.charAt(0)}
            </Text>
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-sm font-bold text-slate-900">{member.name}</Text>
            <View className="self-start rounded-lg px-2 py-0.5" style={{ backgroundColor: levelCfg.bgColor }}>
              <Text className="text-xs font-bold" style={{ color: levelCfg.color }}>{levelCfg.label}</Text>
            </View>
          </View>
          <View className="items-center gap-0.5">
            <Ionicons name="star" size={20} color="#e11d48" />
            <Text className="text-2xl font-extrabold text-slate-900">{member.pointBalance.toLocaleString()}</Text>
            <Text className="text-xs font-semibold text-slate-500">คะแนน</Text>
          </View>
        </View>
      </View>

      {onGoToMemberPromo && (
        <View className="mb-2 px-4">
          <TouchableOpacity
            className="flex-row items-center gap-2 rounded-2xl border-2 border-dashed border-rose-300 bg-white p-3"
            onPress={onGoToMemberPromo}
          >
            <Ionicons name="pricetag-outline" size={18} color="#f43f5e" />
            <Text className="flex-1 text-xs font-bold text-rose-600">สร้างโปรโมชั่นสมาชิก</Text>
            <Ionicons name="chevron-forward" size={16} color="#a1a1aa" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={history}
        keyExtractor={(t) => t.id}
        renderItem={renderTransaction}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 8 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text className="mb-1 text-xs font-bold text-slate-600">รายการทั้งหมด ({history.length})</Text>
        }
        ListEmptyComponent={
          <View className="items-center gap-2 py-[60px]">
            <Ionicons name="receipt-outline" size={56} color="#fda4af" />
            <Text className="text-sm font-bold text-slate-400">ยังไม่มีรายการคะแนน</Text>
          </View>
        }
        ListFooterComponent={
          <View className="mt-4 border-t border-slate-200 pt-4">
            <Text className="mb-3 text-xs font-bold text-slate-600">โปรโมชั่นที่ใช้ได้</Text>
            {eligiblePromos.length > 0 ? (
              eligiblePromos.map((promo) => (
                <TouchableOpacity
                  key={promo.id}
                  className="mb-2 flex-row items-center rounded-2xl bg-white p-3 shadow-sm"
                  onPress={() => setShowAlert(true)}
                  activeOpacity={0.7}
                >
                  <View className="flex-1 gap-0.5">
                    <Text className="text-xs font-bold text-slate-900" numberOfLines={1}>{promo.name}</Text>
                    <Text className="text-xs font-semibold text-rose-600">{PROMO_TYPE_LABELS[promo.type] || promo.type}</Text>
                    <Text className="text-xs font-medium text-slate-500" numberOfLines={1}>{summarizeRewards(promo)}</Text>
                  </View>
                  <Text className="text-xs font-semibold text-slate-400">หมดอายุ {formatDate(promo.endDate)}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View className="items-center gap-2 py-6">
                <Ionicons name="pricetag-outline" size={48} color="#fda4af" />
                <Text className="text-sm font-bold text-slate-400">ไม่มีโปรโมชั่นที่ใช้ได้ในขณะนี้</Text>
                {onGoToMemberPromo && (
                  <TouchableOpacity
                    className="mt-1 flex-row items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2.5 shadow-sm"
                    onPress={onGoToMemberPromo}
                  >
                    <Ionicons name="add-circle-outline" size={16} color="#fafafa" />
                    <Text className="text-xs font-bold text-white">สร้างโปรโมชั่นสมาชิก</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        }
      />

      <AlertDialog
        visible={showAlert}
        onClose={() => setShowAlert(false)}
        title="แจ้งเตือน"
        message="การแก้ไขโปรโมชั่นสมาชิกทำได้ที่เมนูโปรโมชั่น > สมาชิก"
        variant="info"
        onConfirm={() => setShowAlert(false)}
      />
    </SafeAreaView>
  );
};
