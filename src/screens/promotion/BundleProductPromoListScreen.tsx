/**
 * BundleProductPromoListScreen — รายการโปรโมชั่นสินค้าร่วม
 * แสดงรายการจาก usePromoManagementStore().bundlePromos
 * พร้อมสถานะ, search, empty state, ปุ่มสร้างใหม่
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BundlePromotion, BundlePromoStatus } from '../../types/bundlePromo';
import { usePromoManagementStore } from '../../store/promoManagementStore';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface Props {
  onBack: () => void;
  onCreateNew: () => void;
}

const STATUS_CONFIG: Record<BundlePromoStatus, { label: string; color: string; bgColor: string }> = {
  draft:    { label: 'แบบร่าง', color: Colors.gray600,  bgColor: Colors.gray200 },
  active:   { label: 'Active',  color: Colors.success,  bgColor: Colors.successLight },
  expired:  { label: 'Expired', color: Colors.warning,  bgColor: Colors.warningLight },
  disabled: { label: 'Disabled', color: Colors.danger,  bgColor: Colors.dangerLight },
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
      <View style={styles.promoCard}>
        {/* Top row: name + status */}
        <View style={styles.promoTop}>
          <View style={styles.promoIcon}>
            <Ionicons name="layers-outline" size={20} color={Colors.accentDark} />
          </View>
          <View style={styles.promoInfo}>
            <Text style={styles.promoName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.promoSub}>{DISCOUNT_TYPE_LABELS[item.discountType] || item.discountType}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bgColor }]}>
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.promoDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="pricetag-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{formatDiscount(item)}</Text>
          </View>
          {item.minBillTotal > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="cart-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.detailText}>ขั้นต่ำ ฿{item.minBillTotal.toLocaleString()}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              {formatDate(item.startDate)} ~ {item.endDate ? formatDate(item.endDate) : 'ไม่กำหนด'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>สินค้าร่วม</Text>
        <TouchableOpacity style={styles.addBtn} onPress={onCreateNew} activeOpacity={0.7}>
          <Ionicons name="add" size={18} color={Colors.white} />
          <Text style={styles.addBtnText}>เพิ่ม</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาชื่อโปรโมชั่น..."
            placeholderTextColor={Colors.gray400}
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        renderItem={renderPromo}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="layers-outline" size={56} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>ยังไม่มีโปรโมชั่นสินค้าร่วม</Text>
            <Text style={styles.emptySubtitle}>กดปุ่มด้านล่างเพื่อสร้างโปรโมชั่นใหม่</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={onCreateNew} activeOpacity={0.85}>
              <Ionicons name="add" size={18} color={Colors.white} />
              <Text style={styles.emptyBtnText}>สร้างโปรโมชั่น</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* FAB - only show when list has items */}
      {bundlePromos.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={onCreateNew} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color={Colors.white} />
          <Text style={styles.fabText}>สร้างโปรโมชั่น</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.white,
    flex: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  addBtnText: {
    ...Typography.button,
    color: Colors.white,
    fontSize: FontSize.body,
  },

  // Search
  searchRow: { padding: Spacing.md, paddingBottom: Spacing.xs },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, ...Typography.body2, color: Colors.text },

  // List
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100, gap: Spacing.md },

  // Card
  promoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  promoTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  promoIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoInfo: { flex: 1 },
  promoName: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  promoSub: { ...Typography.caption, color: Colors.textSecondary },
  statusBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },

  // Details
  promoDetails: { gap: 3 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { ...Typography.caption, color: Colors.text },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: Spacing.md },
  emptyTitle: { ...Typography.h3, color: Colors.gray400 },
  emptySubtitle: { ...Typography.body2, color: Colors.textSecondary },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
  },
  emptyBtnText: { ...Typography.button, color: Colors.white, fontSize: FontSize.bodyLg },

  // FAB
  fab: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { ...Typography.button, color: Colors.white, fontSize: FontSize.bodyLg },
});
