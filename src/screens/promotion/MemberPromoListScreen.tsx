/**
 * MemberPromoListScreen — รายการโปรโมชั่นสมาชิก 12 ประเภท
 * M07 Promotion Engine — Member Promotions
 */
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_MEMBER_PROMOTIONS } from '../../data/mockMemberPromotions';
import { MemberPromotion, MemberPromoType, MemberPromoStatus } from '../../types/memberPromotion';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

// ─── Type-to-Icon Mapping ─────────────────────────────────────────────────────
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

// ─── Type Label (Thai) ────────────────────────────────────────────────────────
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

// ─── Status Badge Config ──────────────────────────────────────────────────────
const STATUS_CONFIG: Record<MemberPromoStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Active', color: Colors.success, bgColor: Colors.successLight },
  paused: { label: 'Paused', color: Colors.warning, bgColor: Colors.warningLight },
  expired: { label: 'Expired', color: Colors.gray500, bgColor: Colors.gray200 },
  draft: { label: 'Draft', color: Colors.gray400, bgColor: Colors.gray100 },
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onBack: () => void;
  onSelectPromo: (promoId: string) => void;
}

export const MemberPromoListScreen: React.FC<Props> = ({ onBack, onSelectPromo }) => {
  // Load and sort data by priority ascending
  const promotions = [...MOCK_MEMBER_PROMOTIONS].sort((a, b) => a.priority - b.priority);

  // Show error toast if no data found
  if (!promotions || promotions.length === 0) {
    if (Platform.OS === 'web') {
      alert('ไม่พบข้อมูลโปรโมชั่นสมาชิก');
    } else {
      Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลโปรโมชั่นสมาชิก');
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
        <Card style={styles.promoCard}>
          <View style={styles.cardContent}>
            {/* Icon */}
            <View style={styles.iconCircle}>
              <Ionicons name={iconName as any} size={22} color={Colors.accentDark} />
            </View>

            {/* Info */}
            <View style={styles.infoSection}>
              <Text style={styles.promoName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.typeLabel}>{typeLabel}</Text>
              <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
            </View>

            {/* Status Badge + Chevron */}
            <View style={styles.rightSection}>
              <View style={[styles.statusBadge, { backgroundColor: statusCfg.bgColor }]}>
                <Text style={[styles.statusText, { color: statusCfg.color }]}>
                  {statusCfg.label}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.gray400} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="กลับ"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerTextSection}>
          <Text style={styles.headerTitle}>โปรโมชั่นสมาชิก</Text>
          <Text style={styles.headerSub}>Member Promotions</Text>
        </View>
      </View>

      {/* Promotion List */}
      <FlatList
        data={promotions}
        keyExtractor={(item) => item.id}
        renderItem={renderPromoItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextSection: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.white,
  },
  headerSub: {
    ...Typography.body2,
    color: 'rgba(255,255,255,0.7)',
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  promoCard: {
    marginBottom: 0,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    flex: 1,
    gap: 2,
  },
  promoName: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '700',
  },
  typeLabel: {
    ...Typography.caption,
    color: Colors.accentDark,
    fontWeight: '500',
  },
  description: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  statusBadge: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
