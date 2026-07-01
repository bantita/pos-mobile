/**
 * ProductSearchDropdown
 * Dropdown ค้นหาสินค้า พร้อมเลือกหน่วย (UOM) และแสดงยอดคงเหลือในบรรทัดเดียว
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_PRODUCTS } from '../../data/mockProducts';
import { MOCK_STOCK } from '../../data/mockInventory';
import { ProductUOM } from '../../types/product';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency } from '../../utils/format';

export interface SelectedProductUOM {
  productId: string;
  productCode: string;
  productName: string;
  uomId: string;
  unit: string;
  ratio: number;
  costPrice: number;
  salePrice: number;
  onHandQty: number;      // คงเหลือ (หน่วยฐาน)
  onHandQtyDisplay: number; // คงเหลือแปลงเป็นหน่วยที่เลือก
}

interface Props {
  warehouseId: string;
  value: SelectedProductUOM | null;
  onChange: (item: SelectedProductUOM) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export const ProductSearchDropdown: React.FC<Props> = ({
  warehouseId, value, onChange, placeholder = 'ค้นหาหรือเลือกสินค้า', label, required,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [pendingProduct, setPendingProduct] = useState<typeof MOCK_PRODUCTS[0] | null>(null);

  // รวมยอดคงเหลือจาก MOCK_STOCK
  const stockMap = useMemo(() => {
    const map: Record<string, number> = {};
    MOCK_STOCK.forEach((s) => {
      if (s.warehouseId === warehouseId) {
        map[s.productId] = (map[s.productId] ?? 0) + s.onHandQty;
      }
    });
    return map;
  }, [warehouseId]);

  const filtered = useMemo(() =>
    MOCK_PRODUCTS.filter((p) =>
      p.status === 'active' && (
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search)
      )
    ), [search]);

  const selectUOM = (product: typeof MOCK_PRODUCTS[0], uom: ProductUOM) => {
    const onHand = stockMap[product.id] ?? 0;
    const onHandDisplay = uom.ratio > 1 ? Math.floor(onHand / uom.ratio) : onHand;
    onChange({
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      uomId: uom.id,
      unit: uom.unit,
      ratio: uom.ratio,
      costPrice: uom.costPrice,
      salePrice: uom.salePrice,
      onHandQty: onHand,
      onHandQtyDisplay: onHandDisplay,
    });
    setPendingProduct(null);
    setShowModal(false);
    setSearch('');
  };

  return (
    <>
      {label && (
        <Text style={styles.label}>{label}{required && <Text style={styles.req}> *</Text>}</Text>
      )}
      <TouchableOpacity style={styles.field} onPress={() => setShowModal(true)} activeOpacity={0.8}>
        {value ? (
          <View style={styles.valueRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.valueName} numberOfLines={1}>{value.productName}</Text>
              <Text style={styles.valueMeta}>{value.productCode}</Text>
            </View>
            <View style={styles.valueRight}>
              <View style={styles.unitBadge}>
                <Text style={styles.unitText}>{value.unit}</Text>
              </View>
              <View style={[styles.stockBadge,
                value.onHandQtyDisplay <= 0 ? styles.stockBadgeDanger
                : value.onHandQtyDisplay < 5 ? styles.stockBadgeWarn
                : styles.stockBadgeOk]}>
                <Text style={[styles.stockText,
                  value.onHandQtyDisplay <= 0 ? { color: Colors.danger }
                  : value.onHandQtyDisplay < 5 ? { color: Colors.warning }
                  : { color: Colors.success }]}>
                  คงเหลือ {value.onHandQtyDisplay}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="search-outline" size={16} color={Colors.gray400} />
            <Text style={styles.placeholderText}>{placeholder}</Text>
          </View>
        )}
        <Ionicons name="chevron-down" size={16} color={Colors.gray400} />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {pendingProduct ? `เลือกหน่วย — ${pendingProduct.name}` : 'เลือกสินค้า'}
              </Text>
              <TouchableOpacity onPress={() => { setPendingProduct(null); setShowModal(false); setSearch(''); }}>
                <Ionicons name="close" size={22} color={Colors.gray500} />
              </TouchableOpacity>
            </View>

            {!pendingProduct ? (
              <>
                {/* Search */}
                <View style={styles.searchBar}>
                  <Ionicons name="search-outline" size={16} color={Colors.gray400} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="ชื่อ รหัส บาร์โค้ด..."
                    placeholderTextColor={Colors.gray400}
                    value={search}
                    onChangeText={setSearch}
                    autoFocus
                  />
                  {search !== '' && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                      <Ionicons name="close-circle" size={16} color={Colors.gray400} />
                    </TouchableOpacity>
                  )}
                </View>
                {/* Product List */}
                <FlatList
                  data={filtered}
                  keyExtractor={(p) => p.id}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item: p }) => {
                    const onHand = stockMap[p.id] ?? 0;
                    return (
                      <TouchableOpacity
                        style={styles.productRow}
                        onPress={() => p.uoms.length === 1 ? selectUOM(p, p.uoms[0]) : setPendingProduct(p)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.productIconBox}>
                          <Ionicons name="cube-outline" size={20} color={Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                          <Text style={styles.productCode}>{p.code} · {p.barcode}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 2 }}>
                          <Text style={styles.productStock}>คงเหลือ {onHand} {p.unit}</Text>
                          {p.uoms.length > 1 && (
                            <View style={styles.multiUomBadge}>
                              <Text style={styles.multiUomText}>{p.uoms.length} หน่วย</Text>
                            </View>
                          )}
                        </View>
                        <Ionicons name="chevron-forward" size={14} color={Colors.gray300} />
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.empty}>
                      <Ionicons name="search-outline" size={36} color={Colors.gray300} />
                      <Text style={styles.emptyText}>ไม่พบสินค้า</Text>
                    </View>
                  }
                />
              </>
            ) : (
              /* UOM Selector */
              <FlatList
                data={pendingProduct.uoms}
                keyExtractor={(u) => u.id}
                renderItem={({ item: uom }) => {
                  const onHand = stockMap[pendingProduct.id] ?? 0;
                  const display = uom.ratio > 1 ? Math.floor(onHand / uom.ratio) : onHand;
                  return (
                    <TouchableOpacity
                      style={[styles.uomRow, uom.isDefault && styles.uomRowDefault]}
                      onPress={() => selectUOM(pendingProduct, uom)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.uomUnit, uom.ratio === 1 && { backgroundColor: Colors.primary }]}>
                        <Text style={[styles.uomUnitText, uom.ratio === 1 && { color: Colors.white }]}>{uom.unit}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.uomRatio}>
                          {uom.ratio === 1 ? 'หน่วยฐาน' : `1 ${uom.unit} = ${uom.ratio} ${pendingProduct.unit}`}
                        </Text>
                        <Text style={styles.uomBarcode}>
                          {uom.barcodes.join(', ') || '—'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <Text style={styles.uomPrice}>฿{formatCurrency(uom.salePrice)}</Text>
                        <Text style={[styles.uomStock, display <= 0 && { color: Colors.danger }]}>
                          เหลือ {display} {uom.unit}
                        </Text>
                      </View>
                      {uom.isDefault && (
                        <View style={styles.defaultStar}>
                          <Ionicons name="star" size={11} color={Colors.white} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListHeaderComponent={
                  <TouchableOpacity style={styles.backToProduct} onPress={() => setPendingProduct(null)}>
                    <Ionicons name="arrow-back" size={16} color={Colors.primary} />
                    <Text style={styles.backText}>กลับเลือกสินค้า</Text>
                  </TouchableOpacity>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  label: { ...Typography.label, color: Colors.gray700, marginBottom: Spacing.xs },
  req: { color: Colors.danger },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, minHeight: 50,
  },
  placeholder: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  placeholderText: { ...Typography.body2, color: Colors.gray400 },
  valueRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.sm },
  valueName: { ...Typography.label, color: Colors.text },
  valueMeta: { ...Typography.caption, color: Colors.textSecondary },
  valueRight: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
  unitBadge: { backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, paddingHorizontal: 7, paddingVertical: 3 },
  unitText: { fontSize: 11, color: Colors.white, fontWeight: '700' },
  stockBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: 6, paddingVertical: 3 },
  stockBadgeOk: { backgroundColor: Colors.successLight },
  stockBadgeWarn: { backgroundColor: Colors.warningLight },
  stockBadgeDanger: { backgroundColor: Colors.dangerLight },
  stockText: { fontSize: 10, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.gray200, borderRadius: 2, alignSelf: 'center', marginTop: Spacing.sm },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sheetTitle: { ...Typography.h4, color: Colors.text },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, margin: Spacing.md, backgroundColor: Colors.gray50, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, height: 44 },
  searchInput: { flex: 1, ...Typography.body2, color: Colors.text },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  productIconBox: { width: 40, height: 40, borderRadius: BorderRadius.sm, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  productName: { ...Typography.label, color: Colors.text },
  productCode: { ...Typography.caption, color: Colors.textSecondary },
  productStock: { ...Typography.caption, color: Colors.success, fontWeight: '600' },
  multiUomBadge: { backgroundColor: Colors.warningLight, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  multiUomText: { fontSize: 9, color: Colors.warning, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: Spacing.sm },
  emptyText: { ...Typography.body2, color: Colors.gray400 },
  uomRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, position: 'relative' },
  uomRowDefault: { backgroundColor: '#FFFBEB' },
  uomUnit: { minWidth: 56, paddingHorizontal: Spacing.sm, paddingVertical: 6, backgroundColor: Colors.gray100, borderRadius: BorderRadius.sm, alignItems: 'center' },
  uomUnitText: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  uomRatio: { ...Typography.caption, color: Colors.textSecondary },
  uomBarcode: { ...Typography.caption, color: Colors.gray400, fontSize: 10 },
  uomPrice: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
  uomStock: { ...Typography.caption, color: Colors.success, fontWeight: '600' },
  defaultStar: { position: 'absolute', top: 8, right: Spacing.lg, backgroundColor: Colors.warning, borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  backToProduct: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backText: { ...Typography.body2, color: Colors.primary, fontWeight: '600' },
});
