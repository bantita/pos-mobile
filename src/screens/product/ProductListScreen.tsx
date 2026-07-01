/**
 * ProductListScreen — Xcellence ERP
 * Responsive: Web = table view, Mobile = card list
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProductMaster } from '../../types/product';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '../../data/mockProducts';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { formatCurrency } from '../../utils/format';
import { useStoreConfigStore } from '../../store/storeConfigStore';

interface ProductListScreenProps {
  onAddProduct: () => void;
  onEditProduct: (product: ProductMaster) => void;
  onImportExport?: () => void;
  onManageCategories?: () => void;
}

export const ProductListScreen: React.FC<ProductListScreenProps> = ({
  onAddProduct, onEditProduct, onImportExport, onManageCategories,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products] = useState<ProductMaster[]>(MOCK_PRODUCTS);
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const { variantColor, variantLot, variantSize, variantYear } = useStoreConfigStore();

  const filtered = useMemo(() => products.filter((p) => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search);
    const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchSearch && matchCat;
  }), [search, selectedCategory, products]);

  // ── Stock Badge ────────────────────────────────────────────────────────────
  const StockBadge: React.FC<{ qty: number; min: number }> = ({ qty, min }) => {
    const isOut = qty === 0;
    const isLow = qty > 0 && qty <= min;
    const bgColor = isOut ? Colors.stockOut : isLow ? Colors.stockLow : Colors.stockOk;
    const textColor = isOut ? Colors.stockOutText : isLow ? Colors.stockLowText : Colors.stockOkText;
    const label = isOut ? 'หมด' : isLow ? `เหลือ ${qty}` : `${qty}`;
    return (
      <View style={[s.stockBadge, { backgroundColor: bgColor }]}>
        <Text style={[s.stockBadgeText, { color: textColor }]}>{label}</Text>
      </View>
    );
  };

  // ── Web Table Row ──────────────────────────────────────────────────────────
  const TableRow: React.FC<{ item: ProductMaster }> = ({ item }) => (
    <TouchableOpacity style={s.tableRow} onPress={() => onEditProduct(item)} activeOpacity={0.7}>
      <View style={s.tableCell1}>
        <View style={s.productIcon}>
          <Ionicons name="cube-outline" size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={s.productCode}>{item.code}</Text>
        </View>
      </View>
      <Text style={[s.tableCell, { flex: 0.8 }]}>{item.categoryName}</Text>
      <Text style={[s.tableCell, s.cellRight, { flex: 0.7 }]}>฿{formatCurrency(item.salePrice)}</Text>
      <View style={[s.tableCellCenter, { flex: 0.6 }]}>
        <StockBadge qty={item.stockQty} min={item.minStock} />
      </View>
      <View style={[s.tableCellCenter, { flex: 0.5 }]}>
        <TouchableOpacity style={s.editBtn} onPress={() => onEditProduct(item)}>
          <Ionicons name="create-outline" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // ── Mobile Card ────────────────────────────────────────────────────────────
  const MobileCard: React.FC<{ item: ProductMaster }> = ({ item }) => (
    <TouchableOpacity style={s.card} onPress={() => onEditProduct(item)} activeOpacity={0.8}>
      <View style={s.cardIcon}>
        <Ionicons name="cube-outline" size={24} color={Colors.primary} />
      </View>
      <View style={s.cardInfo}>
        <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
        <Text style={s.cardMeta}>{item.code} · {item.categoryName}</Text>
        {((variantColor && item.color) || (variantSize && item.size) || (variantLot && item.lotNumber) || (variantYear && item.modelYear)) && (
          <Text style={s.cardVariant}>
            {[variantColor && item.color && `สี: ${item.color}`, variantSize && item.size && `ไซส์: ${item.size}`, variantLot && item.lotNumber && `Lot: ${item.lotNumber}`, variantYear && item.modelYear && `ปี: ${item.modelYear}`].filter(Boolean).join(' · ')}
          </Text>
        )}
        <View style={s.cardBottom}>
          <Text style={s.cardPrice}>฿{formatCurrency(item.salePrice)}</Text>
          <StockBadge qty={item.stockQty} min={item.minStock} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.gray300} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container} edges={isWide ? [] : ['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>จัดการสินค้า</Text>
        <View style={s.headerActions}>
          {onImportExport && (
            <TouchableOpacity style={s.headerBtn} onPress={onImportExport}>
              <Ionicons name="swap-vertical-outline" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.addProductBtn} onPress={onAddProduct}>
            <Ionicons name="add-outline" size={18} color={Colors.white} />
            <Text style={s.addProductText}>เพิ่มสินค้า</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search + Category */}
      <View style={s.filterRow}>
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
          <TextInput
            style={s.searchInput}
            placeholder="ค้นหาชื่อ รหัส บาร์โค้ด..."
            placeholderTextColor={Colors.textDisabled}
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textDisabled} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Chips */}
      <FlatList
        data={[{ id: 'all', name: 'ทั้งหมด', productCount: products.length, status: 'active' as const }, ...MOCK_CATEGORIES]}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.chipList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.chip, selectedCategory === item.id && s.chipActive]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Text style={[s.chipText, selectedCategory === item.id && s.chipTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Result count */}
      <View style={s.resultRow}>
        <Text style={s.resultText}>{filtered.length} รายการ</Text>
      </View>

      {/* Web: Table */}
      {isWide ? (
        <View style={s.tableContainer}>
          {/* Table Header */}
          <View style={s.tableHead}>
            <Text style={[s.th, { flex: 2 }]}>สินค้า</Text>
            <Text style={[s.th, { flex: 0.8 }]}>หมวดหมู่</Text>
            <Text style={[s.th, s.thRight, { flex: 0.7 }]}>ราคา</Text>
            <Text style={[s.th, s.thCenter, { flex: 0.6 }]}>คงเหลือ</Text>
            <Text style={[s.th, s.thCenter, { flex: 0.5 }]}>จัดการ</Text>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TableRow item={item} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState />}
          />
        </View>
      ) : (
        /* Mobile: Cards */
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MobileCard item={item} />}
          contentContainerStyle={s.cardList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState />}
        />
      )}

      {/* Mobile FAB */}
      {!isWide && (
        <TouchableOpacity style={s.fab} onPress={onAddProduct} activeOpacity={0.85}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

// ── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = () => (
  <View style={s.empty}>
    <Ionicons name="cube-outline" size={48} color={Colors.gray300} />
    <Text style={s.emptyTitle}>ไม่พบสินค้า</Text>
    <Text style={s.emptySub}>ลองเปลี่ยนคำค้นหาหรือหมวดหมู่</Text>
  </View>
);

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h4, color: Colors.text },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerBtn: {
    padding: Spacing.sm, borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  addProductBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  addProductText: { ...Typography.label, color: Colors.white },

  // Filter
  filterRow: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, height: 40,
  },
  searchInput: { flex: 1, ...Typography.body2, color: Colors.text },

  // Chips
  chipList: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { ...Typography.label, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },

  // Result
  resultRow: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xs },
  resultText: { ...Typography.caption, color: Colors.textSecondary },

  // ── Table (Web) ────────────────────────────────────────────────────────────
  tableContainer: { flex: 1, paddingHorizontal: Spacing.lg },
  tableHead: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.gray100, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  th: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  thRight: { textAlign: 'right' },
  thCenter: { textAlign: 'center' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tableCell1: { flex: 2, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tableCell: { ...Typography.body2, color: Colors.text },
  tableCellCenter: { alignItems: 'center' },
  cellRight: { textAlign: 'right' },
  productIcon: {
    width: 36, height: 36, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  productName: { ...Typography.body2, color: Colors.text, fontWeight: '500' },
  productCode: { ...Typography.caption, color: Colors.textSecondary },
  editBtn: {
    padding: Spacing.xs, borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.border,
  },

  // ── Cards (Mobile) ─────────────────────────────────────────────────────────
  cardList: { paddingHorizontal: Spacing.lg, paddingBottom: 100, gap: Spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { ...Typography.body2, color: Colors.text, fontWeight: '600' },
  cardMeta: { ...Typography.caption, color: Colors.textSecondary },
  cardVariant: { ...Typography.caption, color: Colors.info, fontWeight: '500', marginTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  cardPrice: { ...Typography.label, color: Colors.primary },

  // Stock Badge
  stockBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  stockBadgeText: { ...Typography.caption, fontWeight: '600' },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.sm },
  emptyTitle: { ...Typography.subtitle2, color: Colors.textSecondary },
  emptySub: { ...Typography.body2, color: Colors.textDisabled },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    ...Shadow.lg,
  },
});
