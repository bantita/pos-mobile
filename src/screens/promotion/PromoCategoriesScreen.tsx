/**
 * PromoCategoriesScreen — หน้าเลือกหมวดหมู่โปรโมชั่น 5 หมวด
 * M07 Promotion Engine
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePromoManagementStore } from '../../store/promoManagementStore';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

// ─── Category Config ──────────────────────────────────────────────────────────
const PROMO_CATEGORIES = [
  { id: '1', key: 'store' as const,    label: 'ร้านค้า',      icon: 'storefront-outline',   route: 'PromoList' },
  { id: '2', key: 'member' as const,   label: 'สมาชิก',       icon: 'people-outline',       route: 'MemberPromoList' },
  { id: '3', key: 'group' as const,    label: 'กลุ่มสินค้า',   icon: 'albums-outline',       route: 'GroupProductPromoList' },
  { id: '4', key: 'bundle' as const,   label: 'สินค้าร่วม',   icon: 'layers-outline',       route: 'BundleProductPromoList' },
  { id: '5', key: 'quantity' as const, label: 'จำนวนสินค้า',  icon: 'calculator-outline',   route: 'QuantityPromoList' },
];

// ─── Icon color mapping ───────────────────────────────────────────────────────
const ICON_COLORS: Record<string, { color: string; bgColor: string }> = {
  store:    { color: Colors.primary,    bgColor: Colors.primaryLight },
  member:   { color: Colors.accentDark, bgColor: Colors.accentLight },
  group:    { color: Colors.category1,  bgColor: Colors.primaryLight },
  bundle:   { color: Colors.warning,    bgColor: Colors.warningLight },
  quantity: { color: Colors.success,    bgColor: Colors.successLight },
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onNavigate: (screen: string) => void;
}

export const PromoCategoriesScreen: React.FC<Props> = ({ onNavigate }) => {
  const { getActiveCountByCategory } = usePromoManagementStore();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load counts — wrapping in try/catch for error state
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
    // Simulate retry delay
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
        <Card style={styles.categoryCard}>
          <View style={styles.cardContent}>
            {/* Icon circle */}
            <View style={[styles.iconCircle, { backgroundColor: iconCfg.bgColor }]}>
              <Ionicons name={item.icon as any} size={22} color={iconCfg.color} />
            </View>

            {/* Label + count */}
            <View style={styles.labelSection}>
              <Text style={styles.categoryLabel}>{item.label}</Text>
              <View style={[styles.countBadge, activeCount > 0 && styles.countBadgeActive]}>
                <Text style={[styles.countText, activeCount > 0 && styles.countTextActive]}>
                  {activeCount > 0 ? `${activeCount} Active` : '0'}
                </Text>
              </View>
            </View>

            {/* Chevron */}
            <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // Error state
  if (error && !loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>โปรโมชั่น</Text>
          <Text style={styles.headerSub}>Promotion Categories</Text>
        </View>
        <View style={styles.errorState}>
          <Ionicons name="cloud-offline-outline" size={56} color={Colors.gray300} />
          <Text style={styles.errorTitle}>ไม่สามารถโหลดข้อมูลได้</Text>
          <Text style={styles.errorSubtitle}>กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={18} color={Colors.white} />
            <Text style={styles.retryText}>ลองใหม่</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>โปรโมชั่น</Text>
        <Text style={styles.headerSub}>Promotion Categories</Text>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}

      {/* Category List */}
      <FlatList
        data={PROMO_CATEGORIES}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
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
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.white,
  },
  headerSub: {
    ...Typography.body2,
    color: 'rgba(255,255,255,0.7)',
  },
  loadingRow: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  categoryCard: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelSection: {
    flex: 1,
    gap: Spacing.xs,
  },
  categoryLabel: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '700',
  },
  countBadge: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: Colors.gray200,
  },
  countBadgeActive: {
    backgroundColor: Colors.successLight,
  },
  countText: {
    fontSize: FontSize.caption,
    fontWeight: '600',
    color: Colors.gray500,
  },
  countTextActive: {
    color: Colors.success,
  },
  // Error state
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  errorTitle: {
    ...Typography.h3,
    color: Colors.gray400,
    textAlign: 'center',
  },
  errorSubtitle: {
    ...Typography.body2,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
  },
  retryText: {
    ...Typography.button,
    color: Colors.white,
    fontSize: FontSize.bodyLg,
  },
});
