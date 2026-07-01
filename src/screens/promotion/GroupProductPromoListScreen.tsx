/**
 * GroupProductPromoListScreen — รายการโปรโมชั่นกลุ่มสินค้า
 * แสดงรายการโปรโมชั่นกลุ่มสินค้า พร้อมสถานะ, search, empty state
 * Table-like layout ตามแบบ Zort POS
 *
 * Validates: Requirements 4.1
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePromoManagementStore } from '../../store/promoManagementStore';
import { ProductGroupPromotion, ProductGroupPromoStatus } from '../../types/productGroupPromo';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface Props {
  onBack: () => void;
  onCreateNew: () => void;
}

const STATUS_CONFIG: Record<ProductGroupPromoStatus, { label: string; color: string; bgColor: string }> = {
  draft:    { label: 'แบบร่าง', color: Colors.gray600,  bgColor: Colors.gray200 },
  active:   { label: 'Active',  color: Colors.success,  bgColor: Colors.successLight },
  expired:  { label: 'Expired', color: Colors.warning,  bgColor: Colors.warningLight },
  disabled: { label: 'Disabled', color: Colors.danger,  bgColor: Colors.dangerLight },
};

const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  set_price: 'ตั้งราคา',
  fixed_amount: 'ลดเงิน',
  percent: 'ลด %',
  free_product: 'แถมสินค้า',
};

/** Format date from ISO to dd/MM/yyyy */
function formatDate(isoDate?: string): string {
  if (!isoDate) return '-';
  const d = new Date(isoDate);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Format discount value display */
function formatDiscount(type: string, value: number): string {
  switch (type) {
    case 'percent': return `${value}%`;
    case 'fixed_amount': return `฿${value.toLocaleString()}`;
    case 'set_price': return `฿${value.toLocaleString()}`;
    case 'free_product': return 'แถมสินค้า';
    default: return `${value}`;
  }
}

export const GroupProductPromoListScreen: React.FC<Props> = ({ onBack, onCreateNew }) => {
  const { productGroupPromos } = usePromoManagementStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return productGroupPromos;
    const keyword = search.toLowerCase();
    return productGroupPromos.filter(
      (p) => p.name.toLowerCase().includes(keyword)
    );
  }, [productGroupPromos, search]);

  const renderHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.colNum, styles.headerText]}>#</Text>
      <Text style={[styles.colName, styles.headerText]}>ชื่อโปรโมชั่น</Text>
      <Text style={[styles.colDiscount, styles.headerText]}>ส่วนลด</Text>
      <Text style={[styles.colMinBill, styles.headerText]}>ขั้นต่ำ</Text>
      <Text style={[styles.colDate, styles.headerText]}>เริ่ม</Text>
      <Text style={[styles.colDate, styles.headerText]}>สิ้นสุด</Text>
    </View>
  );

  const renderItem = ({ item, index }: { item: ProductGroupPromotion; index: number }) => {
    const statusCfg = STATUS_CONFIG[item.status];
    return (
      <View style={styles.tableRow}>
        <Text style={[styles.colNum, styles.cellText]}>{index + 1}</Text>
        <View style={[styles.colName, { gap: 4 }]}>
          <Text style={styles.cellName} numberOfLines={1}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bgColor }]}>
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>
        <Text style={[styles.colDiscount, styles.cellText]}>
          {formatDiscount(item.discountType, item.discountValue)}
        </Text>
        <Text style={[styles.colMinBill, styles.cellText]}>
          {item.minBillTotal > 0 ? `฿${item.minBillTotal.toLocaleString()}` : '-'}
        </Text>
        <Text style={[styles.colDate, styles.cellText]}>{formatDate(item.startDate)}</Text>
        <Text style={[styles.colDate, styles.cellText]}>
          {item.noEndDate ? 'ไม่กำหนด' : formatDate(item.endDate)}
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="albums-outline" size={56} color={Colors.gray300} />
      <Text style={styles.emptyTitle}>ยังไม่มีโปรโมชั่นกลุ่มสินค้า</Text>
      <Text style={styles.emptySubtitle}>กดปุ่ม "+ เพิ่ม" เพื่อสร้างโปรโมชั่นใหม่</Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onCreateNew} activeOpacity={0.8}>
        <Ionicons name="add" size={18} color={Colors.white} />
        <Text style={styles.emptyButtonText}>สร้างโปรโมชั่น</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>กลุ่มสินค้า</Text>
        <TouchableOpacity onPress={onCreateNew} style={styles.addButton} activeOpacity={0.8}>
          <Ionicons name="add" size={16} color={Colors.white} />
          <Text style={styles.addButtonText}>เพิ่ม</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
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

      {/* Table Header */}
      {filtered.length > 0 && renderHeader()}

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
      />
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.white,
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  addButtonText: {
    ...Typography.label,
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

  // Table Header
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray100,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // Table Row
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    minHeight: 52,
  },
  cellText: {
    ...Typography.caption,
    color: Colors.text,
  },
  cellName: {
    ...Typography.label,
    color: Colors.text,
    fontSize: FontSize.body,
  },

  // Columns (flex-based widths matching Zort POS table)
  colNum: { width: 28, textAlign: 'center' },
  colName: { flex: 2, paddingRight: Spacing.xs },
  colDiscount: { flex: 1, textAlign: 'center' },
  colMinBill: { flex: 1, textAlign: 'center' },
  colDate: { flex: 1, textAlign: 'center' },

  // Status Badge
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

  // List
  list: { paddingBottom: 40 },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.gray400,
  },
  emptySubtitle: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
  },
  emptyButtonText: {
    ...Typography.button,
    color: Colors.white,
    fontSize: FontSize.bodyLg,
  },
});
