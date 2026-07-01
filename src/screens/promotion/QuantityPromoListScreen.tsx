/**
 * QuantityPromoListScreen — รายการโปรโมชั่นตามจำนวนสินค้า
 * M07 Promotion Engine
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePromoManagementStore } from '../../store/promoManagementStore';
import { QuantityPromotion, QuantityPromoStatus } from '../../types/quantityPromo';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<QuantityPromoStatus, { label: string; color: string; bgColor: string }> = {
  draft:    { label: 'แบบร่าง', color: Colors.gray600,  bgColor: Colors.gray200 },
  active:   { label: 'Active',  color: Colors.success,  bgColor: Colors.successLight },
  expired:  { label: 'Expired', color: Colors.warning,  bgColor: Colors.warningLight },
  disabled: { label: 'Disabled', color: Colors.danger,  bgColor: Colors.dangerLight },
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onBack: () => void;
  onCreateNew: () => void;
}

// ─── Helper: format date ──────────────────────────────────────────────────────
const formatDate = (isoDate: string): string => {
  try {
    const d = new Date(isoDate);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return isoDate;
  }
};

export const QuantityPromoListScreen: React.FC<Props> = ({ onBack, onCreateNew }) => {
  const { quantityPromos } = usePromoManagementStore();
  const [search, setSearch] = useState('');

  // ─── Filtered list ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return quantityPromos;
    const keyword = search.toLowerCase();
    return quantityPromos.filter(
      (p) => p.name.toLowerCase().includes(keyword)
    );
  }, [quantityPromos, search]);

  // ─── Render item ──────────────────────────────────────────────────────────────
  const renderItem = ({ item, index }: { item: QuantityPromotion; index: number }) => {
    const statusCfg = STATUS_CONFIG[item.status];

    return (
      <View style={styles.tableRow}>
        {/* # column */}
        <Text style={styles.colIndex}>{index + 1}</Text>

        {/* ชื่อโปรโมชั่น */}
        <View style={styles.colName}>
          <Text style={styles.promoName} numberOfLines={1}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bgColor }]}>
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {/* วันที่เริ่ม */}
        <Text style={styles.colDate}>{formatDate(item.startDate)}</Text>

        {/* วันที่สิ้นสุด */}
        <Text style={styles.colDate}>
          {item.noEndDate ? 'ไม่กำหนด' : item.endDate ? formatDate(item.endDate) : '-'}
        </Text>
      </View>
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
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>จำนวนสินค้า</Text>
          <Text style={styles.headerSub}>Quantity Promotions</Text>
        </View>
        <TouchableOpacity
          onPress={onCreateNew}
          style={styles.addButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="เพิ่มโปรโมชั่นจำนวนสินค้า"
        >
          <Ionicons name="add" size={18} color={Colors.white} />
          <Text style={styles.addButtonText}>เพิ่ม</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
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

      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={styles.thIndex}>#</Text>
        <Text style={styles.thName}>ชื่อโปรโมชั่น</Text>
        <Text style={styles.thDate}>วันที่เริ่ม</Text>
        <Text style={styles.thDate}>วันที่สิ้นสุด</Text>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calculator-outline" size={56} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>ยังไม่มีโปรโมชั่นจำนวนสินค้า</Text>
            <Text style={styles.emptySubtitle}>กดปุ่ม "+ เพิ่ม" เพื่อสร้างโปรโมชั่นใหม่</Text>
          </View>
        }
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
  // Header
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.white,
  },
  headerSub: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.7)',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  addButtonText: {
    ...Typography.button,
    color: Colors.white,
    fontSize: FontSize.body,
  },
  // Search
  searchRow: {
    padding: Spacing.md,
    paddingBottom: Spacing.xs,
  },
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
  searchInput: {
    flex: 1,
    ...Typography.body2,
    color: Colors.text,
  },
  // Table header
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray100,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  thIndex: {
    width: 30,
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  thName: {
    flex: 1,
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  thDate: {
    width: 85,
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Table rows
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  colIndex: {
    width: 30,
    ...Typography.body2,
    color: Colors.textSecondary,
  },
  colName: {
    flex: 1,
    gap: 3,
  },
  promoName: {
    ...Typography.body2,
    color: Colors.text,
    fontWeight: '600',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  colDate: {
    width: 85,
    ...Typography.caption,
    color: Colors.text,
    textAlign: 'center',
  },
  // List
  list: {
    paddingBottom: Spacing.xl,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.gray400,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body2,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
