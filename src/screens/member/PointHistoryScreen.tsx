/**
 * PointHistoryScreen — ประวัติคะแนน
 * M06 CRM & Loyalty
 */
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMemberStore } from '../../store/memberStore';
import { Member, PointTransaction, PointTransactionType } from '../../types/member';
import { MemberPromotion } from '../../types/memberPromotion';
import { MOCK_MEMBER_PROMOTIONS } from '../../data/mockMemberPromotions';
import { Colors } from '../../constants/colors';
import { MemberLevelColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface Props {
  member: Member;
  onBack: () => void;
  onRedeem: () => void;
  onGoToMemberPromo?: () => void;
}

const LEVEL_CONFIG = {
  member: { label: 'Member', ...MemberLevelColors.member },
  silver: { label: 'Silver', ...MemberLevelColors.silver },
  gold: { label: 'Gold', ...MemberLevelColors.gold },
  platinum: { label: 'Platinum', ...MemberLevelColors.platinum },
  vip: { label: 'VIP', ...MemberLevelColors.vip },
};

const TYPE_CONFIG: Record<PointTransactionType, { icon: string; color: string; bgColor: string; prefix: string }> = {
  earn: { icon: 'arrow-up-circle', color: Colors.success, bgColor: Colors.successLight, prefix: '+' },
  redeem: { icon: 'arrow-down-circle', color: Colors.danger, bgColor: Colors.dangerLight, prefix: '' },
  expire: { icon: 'time', color: Colors.gray400, bgColor: Colors.backgroundSecondary, prefix: '' },
  adjust: { icon: 'swap-horizontal-circle', color: Colors.warning, bgColor: Colors.warningLight, prefix: '' },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
};

/** Map promo type to Thai label */
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

/** Summarize rewards for display */
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

/** Filter active member promotions eligible for the member */
const getEligiblePromos = (memberLevel: string): MemberPromotion[] => {
  return MOCK_MEMBER_PROMOTIONS.filter((promo) => {
    if (promo.status !== 'active') return false;
    // If promo specifies applicable levels, check member's level
    if (promo.applicableLevels && promo.applicableLevels.length > 0) {
      return promo.applicableLevels.includes(memberLevel);
    }
    // No level restriction → eligible for all
    return true;
  });
};

export const PointHistoryScreen: React.FC<Props> = ({ member, onBack, onRedeem, onGoToMemberPromo }) => {
  const { getPointHistory } = useMemberStore();

  const history = useMemo(() => {
    return getPointHistory(member.id).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [member.id]);

  const eligiblePromos = useMemo(() => getEligiblePromos(member.level), [member.level]);

  const levelCfg = LEVEL_CONFIG[member.level];

  const handlePromoTap = () => {
    Alert.alert(
      'แจ้งเตือน',
      'การแก้ไขโปรโมชั่นสมาชิกทำได้ที่เมนูโปรโมชั่น > สมาชิก'
    );
  };

  const renderTransaction = ({ item }: { item: PointTransaction }) => {
    const cfg = TYPE_CONFIG[item.type];
    return (
      <View style={styles.txCard}>
        <View style={[styles.txIcon, { backgroundColor: cfg.bgColor }]}>
          <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.txDate}>{formatDate(item.createdAt)} · {item.refNo}</Text>
        </View>
        <Text style={[styles.txPoints, { color: cfg.color }]}>
          {cfg.prefix}{item.points.toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>ประวัติคะแนน</Text>
          <Text style={styles.headerSub}>{member.name}</Text>
        </View>
        <TouchableOpacity style={styles.redeemBtn} onPress={onRedeem}>
          <Ionicons name="gift-outline" size={16} color={Colors.white} />
          <Text style={styles.redeemBtnText}>ใช้คะแนน</Text>
        </TouchableOpacity>
      </View>

      {/* Member Info Card */}
      <View style={styles.memberCard}>
        <View style={styles.memberRow}>
          <View style={[styles.avatar, { backgroundColor: levelCfg.bgColor }]}>
            <Text style={[styles.avatarText, { color: levelCfg.color }]}>
              {member.name.charAt(0)}
            </Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{member.name}</Text>
            <View style={[styles.levelBadge, { backgroundColor: levelCfg.bgColor }]}>
              <Text style={[styles.levelText, { color: levelCfg.color }]}>{levelCfg.label}</Text>
            </View>
          </View>
          <View style={styles.balanceBox}>
            <Ionicons name="star" size={18} color={Colors.warning} />
            <Text style={styles.balanceValue}>{member.pointBalance.toLocaleString()}</Text>
            <Text style={styles.balanceLabel}>คะแนน</Text>
          </View>
        </View>
      </View>

      {/* Member Promo Shortcut */}
      {onGoToMemberPromo && (
        <View style={styles.promoShortcut}>
          <TouchableOpacity style={styles.promoShortcutBtn} onPress={onGoToMemberPromo}>
            <Ionicons name="pricetag-outline" size={18} color={Colors.primary} />
            <Text style={styles.promoShortcutText}>สร้างโปรโมชั่นสมาชิก</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
          </TouchableOpacity>
        </View>
      )}

      {/* Transaction List */}
      <FlatList
        data={history}
        keyExtractor={(t) => t.id}
        renderItem={renderTransaction}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.listHeader}>รายการทั้งหมด ({history.length})</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={Colors.gray300} />
            <Text style={styles.emptyText}>ยังไม่มีรายการคะแนน</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.promoSection}>
            <Text style={styles.promoSectionHeader}>โปรโมชั่นที่ใช้ได้</Text>
            {eligiblePromos.length > 0 ? (
              eligiblePromos.map((promo) => (
                <TouchableOpacity
                  key={promo.id}
                  style={styles.promoCard}
                  onPress={handlePromoTap}
                  activeOpacity={0.7}
                >
                  <View style={styles.promoCardContent}>
                    <Text style={styles.promoName} numberOfLines={1}>{promo.name}</Text>
                    <Text style={styles.promoType}>
                      {PROMO_TYPE_LABELS[promo.type] || promo.type}
                    </Text>
                    <Text style={styles.promoReward} numberOfLines={1}>
                      {summarizeRewards(promo)}
                    </Text>
                  </View>
                  <Text style={styles.promoExpiry}>
                    หมดอายุ {formatDate(promo.endDate)}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.promoEmptyState}>
                <Ionicons name="pricetag-outline" size={40} color={Colors.gray300} />
                <Text style={styles.promoEmptyText}>ไม่มีโปรโมชั่นที่ใช้ได้ในขณะนี้</Text>
                {onGoToMemberPromo && (
                  <TouchableOpacity style={styles.promoCreateBtn} onPress={onGoToMemberPromo}>
                    <Ionicons name="add-circle-outline" size={16} color={Colors.white} />
                    <Text style={styles.promoCreateBtnText}>สร้างโปรโมชั่นสมาชิก</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.75)' },
  redeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  redeemBtnText: { ...Typography.label, color: Colors.white, fontSize: 12 },
  memberCard: {
    margin: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  memberInfo: { flex: 1, gap: 4 },
  memberName: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  levelBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  levelText: { fontSize: 10, fontWeight: '700' },
  balanceBox: { alignItems: 'center', gap: 2 },
  balanceValue: { fontSize: 22, fontWeight: '800', color: Colors.text },
  balanceLabel: { ...Typography.caption, color: Colors.textSecondary },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.sm },
  listHeader: { ...Typography.label, color: Colors.gray600, marginBottom: Spacing.xs },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, gap: 2 },
  txDesc: { ...Typography.label, color: Colors.text },
  txDate: { ...Typography.caption, color: Colors.textSecondary },
  txPoints: { fontSize: 16, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.sm },
  emptyText: { ...Typography.body2, color: Colors.gray400 },
  promoShortcut: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  promoShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  promoShortcutText: {
    ...Typography.label,
    color: Colors.primary,
    flex: 1,
  },
  // Promo section (footer) styles
  promoSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  promoSectionHeader: {
    ...Typography.label,
    color: Colors.gray600,
    marginBottom: Spacing.sm,
    fontWeight: '700',
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  promoCardContent: { flex: 1, gap: 2 },
  promoName: { ...Typography.label, color: Colors.text, fontWeight: '600' },
  promoType: { ...Typography.caption, color: Colors.primary },
  promoReward: { ...Typography.caption, color: Colors.textSecondary },
  promoExpiry: { ...Typography.caption, color: Colors.gray500, fontSize: 10 },
  promoEmptyState: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  promoEmptyText: { ...Typography.body2, color: Colors.gray400 },
  promoCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  promoCreateBtnText: { ...Typography.label, color: Colors.white, fontSize: 12 },
});
