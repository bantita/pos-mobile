/**
 * GroupProductPromoCreateScreen — ฟอร์มสร้างโปรโมชั่นกลุ่มสินค้า
 * ตามแบบ Zort POS "เพิ่มโปรโมชั่นกลุ่มสินค้า"
 *
 * Validates: Requirements 4.2–4.6, 11.2, 11.5, 11.6, 11.7
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePromoManagementStore } from '../../store/promoManagementStore';
import { validateProductGroupForm, ValidationError } from '../../utils/promoValidation';
import { ProductGroupItem, FreeProductItem, ProductGroupDiscountType } from '../../types/productGroupPromo';
import { MOCK_PRODUCTS } from '../../data/mockProducts';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface Props {
  onBack: () => void;
}

// ─── Mock products for selection (placeholder until product picker is built) ──
const MOCK_GROUP_PRODUCTS: ProductGroupItem[] = MOCK_PRODUCTS.slice(0, 4).map((p) => ({
  productId: p.id,
  productCode: p.code,
  productName: p.name,
  quantity: 1,
  unitPrice: p.salePrice,
}));

const MOCK_FREE_PRODUCTS: FreeProductItem[] = MOCK_PRODUCTS.slice(4, 6).map((p) => ({
  productId: p.id,
  productCode: p.code,
  productName: p.name,
  quantity: 1,
  unitPrice: p.salePrice,
}));

const DISCOUNT_TYPE_OPTIONS: { value: ProductGroupDiscountType; label: string }[] = [
  { value: 'set_price', label: 'ตั้งราคาขาย' },
  { value: 'fixed_amount', label: 'ส่วนลด' },
  { value: 'percent', label: 'ส่วนลด %' },
  { value: 'free_product', label: 'แถมสินค้า' },
];

/** Get today as YYYY-MM-DD */
function getTodayISO(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export const GroupProductPromoCreateScreen: React.FC<Props> = ({ onBack }) => {
  const { createProductGroupPromo } = usePromoManagementStore();

  // ─── Form State ─────────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(getTodayISO());
  const [endDate, setEndDate] = useState('');
  const [noEndDate, setNoEndDate] = useState(false);
  const [description, setDescription] = useState('');
  const [products, setProducts] = useState<ProductGroupItem[]>([]);
  const [minBillTotal, setMinBillTotal] = useState('0.00');
  const [discountType, setDiscountType] = useState<ProductGroupDiscountType | ''>('');
  const [discountValue, setDiscountValue] = useState('0');
  const [freeProducts, setFreeProducts] = useState<FreeProductItem[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [saving, setSaving] = useState(false);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const getError = useCallback(
    (field: string) => errors.find((e) => e.field === field)?.message,
    [errors]
  );

  const discountSuffix = useMemo(() => {
    if (discountType === 'percent') return '%';
    if (discountType === 'fixed_amount' || discountType === 'set_price') return 'บาท';
    return '';
  }, [discountType]);

  // ─── Product Quantity Handlers ──────────────────────────────────────────────
  const updateProductQty = (idx: number, delta: number) => {
    setProducts((prev) =>
      prev.map((p, i) =>
        i === idx ? { ...p, quantity: Math.max(1, Math.min(999, p.quantity + delta)) } : p
      )
    );
  };

  const updateFreeProductQty = (idx: number, delta: number) => {
    setFreeProducts((prev) =>
      prev.map((p, i) =>
        i === idx ? { ...p, quantity: Math.max(1, Math.min(999, p.quantity + delta)) } : p
      )
    );
  };

  // ─── Add mock products (simulates product picker) ──────────────────────────
  const handleSelectProducts = () => {
    if (products.length === 0) {
      setProducts(MOCK_GROUP_PRODUCTS);
    }
  };

  const handleSelectFreeProducts = () => {
    if (freeProducts.length === 0) {
      setFreeProducts(MOCK_FREE_PRODUCTS);
    }
  };

  // ─── Save Handler ───────────────────────────────────────────────────────────
  const handleSave = () => {
    const formData = {
      name: name.trim(),
      startDate,
      endDate: noEndDate ? undefined : endDate,
      noEndDate,
      products: products.map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
      })),
      discountType: discountType as string,
      discountValue: parseFloat(discountValue) || 0,
      minBillTotal: parseFloat(minBillTotal) || 0,
      freeProducts: freeProducts.map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
      })),
    };

    const result = validateProductGroupForm(formData);
    setErrors(result.errors);

    if (!result.valid) return;

    setSaving(true);
    try {
      createProductGroupPromo({
        name: name.trim(),
        startDate,
        endDate: noEndDate ? undefined : endDate,
        noEndDate,
        branchId: 'main',
        description: description.trim() || undefined,
        products,
        minBillTotal: parseFloat(minBillTotal) || 0,
        discountType: discountType as ProductGroupDiscountType,
        discountValue: parseFloat(discountValue) || 0,
        freeProducts: discountType === 'free_product' ? freeProducts : [],
        createdBy: 'current_user',
        shopId: 'shop_001',
      });
      Alert.alert('สำเร็จ', 'บันทึกโปรโมชั่นกลุ่มสินค้าเรียบร้อย', [
        { text: 'ตกลง', onPress: onBack },
      ]);
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>เพิ่มโปรโมชั่นกลุ่มสินค้า</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Section 1: Header Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ข้อมูลโปรโมชั่น</Text>

          {/* ชื่อโปรโมชั่น */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>ชื่อโปรโมชั่น *</Text>
            <TextInput
              style={[styles.input, getError('name') ? styles.inputError : undefined]}
              value={name}
              onChangeText={setName}
              placeholder="ระบุชื่อโปรโมชั่น"
              placeholderTextColor={Colors.gray400}
            />
            {getError('name') && <Text style={styles.errorText}>{getError('name')}</Text>}
          </View>

          {/* วันเริ่ม */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>วันเริ่ม *</Text>
            <TextInput
              style={[styles.input, getError('startDate') ? styles.inputError : undefined]}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.gray400}
            />
            {getError('startDate') && <Text style={styles.errorText}>{getError('startDate')}</Text>}
          </View>

          {/* วันสิ้นสุด */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>วันสิ้นสุด *</Text>
            <TextInput
              style={[styles.input, !noEndDate && getError('endDate') ? styles.inputError : undefined]}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.gray400}
              editable={!noEndDate}
            />
            {!noEndDate && getError('endDate') && (
              <Text style={styles.errorText}>{getError('endDate')}</Text>
            )}
          </View>

          {/* ไม่กำหนดวันสิ้นสุด */}
          <View style={styles.checkboxRow}>
            <Switch
              value={noEndDate}
              onValueChange={setNoEndDate}
              trackColor={{ false: Colors.gray300, true: Colors.primaryMid }}
              thumbColor={noEndDate ? Colors.primary : Colors.gray100}
            />
            <Text style={styles.checkboxLabel}>ไม่กำหนดวันสิ้นสุด</Text>
          </View>

          {/* คลังสินค้า/สาขา */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>คลังสินค้า/สาขา</Text>
            <View style={styles.readonlyField}>
              <Text style={styles.readonlyText}>คลังสินค้าหลัก</Text>
            </View>
          </View>

          {/* รายละเอียด */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>รายละเอียด</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="รายละเอียดโปรโมชั่น (ถ้ามี)"
              placeholderTextColor={Colors.gray400}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Section 2: เงื่อนไขโปรโมชั่น (Products) */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>เงื่อนไขโปรโมชั่น</Text>
          </View>

          <View style={styles.tabRow}>
            <View style={styles.tabActive}>
              <Text style={styles.tabActiveText}>สินค้า</Text>
            </View>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={handleSelectProducts}
              activeOpacity={0.8}
            >
              <Text style={styles.selectButtonText}>เลือก</Text>
            </TouchableOpacity>
          </View>

          {getError('products') && (
            <Text style={styles.errorText}>{getError('products')}</Text>
          )}

          {/* Product Table */}
          {products.length > 0 && (
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thText, styles.colIdx]}>#</Text>
                <Text style={[styles.thText, styles.colCode]}>รหัสสินค้า</Text>
                <Text style={[styles.thText, styles.colNameTbl]}>ชื่อ</Text>
                <Text style={[styles.thText, styles.colQty]}>จำนวน</Text>
                <Text style={[styles.thText, styles.colPrice]}>มูลค่าต่อหน่วย</Text>
              </View>
              {products.map((p, idx) => (
                <View key={p.productId} style={styles.tableBodyRow}>
                  <Text style={[styles.tdText, styles.colIdx]}>{idx + 1}</Text>
                  <Text style={[styles.tdText, styles.colCode]}>{p.productCode}</Text>
                  <Text style={[styles.tdText, styles.colNameTbl]} numberOfLines={1}>
                    {p.productName}
                  </Text>
                  <View style={[styles.colQty, styles.qtySpinner]}>
                    <TouchableOpacity onPress={() => updateProductQty(idx, -1)}>
                      <Ionicons name="remove-circle-outline" size={20} color={Colors.danger} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{p.quantity}</Text>
                    <TouchableOpacity onPress={() => updateProductQty(idx, 1)}>
                      <Ionicons name="add-circle-outline" size={20} color={Colors.success} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.tdText, styles.colPrice]}>฿{p.unitPrice}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Section 3: Discount Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ตั้งค่าส่วนลด</Text>

          {/* ราคารวมขั้นต่ำทั้งบิล */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>A: ราคารวมขั้นต่ำทั้งบิล</Text>
            <TextInput
              style={[styles.input, getError('minBillTotal') ? styles.inputError : undefined]}
              value={minBillTotal}
              onChangeText={setMinBillTotal}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={Colors.gray400}
            />
            {getError('minBillTotal') && (
              <Text style={styles.errorText}>{getError('minBillTotal')}</Text>
            )}
          </View>

          {/* ประเภทส่วนลด */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>B: ประเภท *</Text>
            <View style={styles.pickerRow}>
              {DISCOUNT_TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.pickerOption,
                    discountType === opt.value && styles.pickerOptionActive,
                  ]}
                  onPress={() => setDiscountType(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      discountType === opt.value && styles.pickerOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {getError('discountType') && (
              <Text style={styles.errorText}>{getError('discountType')}</Text>
            )}
          </View>

          {/* ส่วนลด value (shown when type is not free_product) */}
          {discountType !== '' && discountType !== 'free_product' && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>ส่วนลด</Text>
              <View style={styles.inputWithSuffix}>
                <TextInput
                  style={[styles.input, { flex: 1 }, getError('discountValue') ? styles.inputError : undefined]}
                  value={discountValue}
                  onChangeText={setDiscountValue}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.gray400}
                />
                <Text style={styles.suffixText}>{discountSuffix}</Text>
              </View>
              {getError('discountValue') && (
                <Text style={styles.errorText}>{getError('discountValue')}</Text>
              )}
            </View>
          )}
        </View>

        {/* Section 4: โปรโมชั่นของแถม (only when discountType = 'free_product') */}
        {discountType === 'free_product' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>โปรโมชั่นของแถม</Text>
            </View>

            <View style={styles.tabRow}>
              <View style={styles.tabActive}>
                <Text style={styles.tabActiveText}>สินค้า</Text>
              </View>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={handleSelectFreeProducts}
                activeOpacity={0.8}
              >
                <Text style={styles.selectButtonText}>เลือก</Text>
              </TouchableOpacity>
            </View>

            {getError('freeProducts') && (
              <Text style={styles.errorText}>{getError('freeProducts')}</Text>
            )}

            {freeProducts.length > 0 && (
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thText, styles.colIdx]}>#</Text>
                  <Text style={[styles.thText, styles.colCode]}>รหัสสินค้า</Text>
                  <Text style={[styles.thText, styles.colNameTbl]}>ชื่อ</Text>
                  <Text style={[styles.thText, styles.colQty]}>จำนวน</Text>
                  <Text style={[styles.thText, styles.colPrice]}>มูลค่าต่อหน่วย</Text>
                </View>
                {freeProducts.map((p, idx) => (
                  <View key={p.productId} style={styles.tableBodyRow}>
                    <Text style={[styles.tdText, styles.colIdx]}>{idx + 1}</Text>
                    <Text style={[styles.tdText, styles.colCode]}>{p.productCode}</Text>
                    <Text style={[styles.tdText, styles.colNameTbl]} numberOfLines={1}>
                      {p.productName}
                    </Text>
                    <View style={[styles.colQty, styles.qtySpinner]}>
                      <TouchableOpacity onPress={() => updateFreeProductQty(idx, -1)}>
                        <Ionicons name="remove-circle-outline" size={20} color={Colors.danger} />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{p.quantity}</Text>
                      <TouchableOpacity onPress={() => updateFreeProductQty(idx, 1)}>
                        <Ionicons name="add-circle-outline" size={20} color={Colors.success} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.tdText, styles.colPrice]}>฿{p.unitPrice}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────────
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

  // ScrollView
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: 60 },

  // Sections
  section: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    ...Typography.label,
    fontSize: 15,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Fields
  field: { marginBottom: Spacing.md },
  fieldLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    ...Typography.body2,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: 2,
  },

  // Checkbox row
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  checkboxLabel: {
    ...Typography.body2,
    color: Colors.text,
  },

  // Readonly field
  readonlyField: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray100,
  },
  readonlyText: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },

  // Tab / Select row
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tabActive: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  tabActiveText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.primary,
  },
  selectButton: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  selectButtonText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.white,
  },

  // Table
  table: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  thText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tdText: {
    ...Typography.caption,
    color: Colors.text,
  },
  colIdx: { width: 24, textAlign: 'center' },
  colCode: { width: 70 },
  colNameTbl: { flex: 1, paddingHorizontal: 4 },
  colQty: { width: 80, alignItems: 'center' as const },
  colPrice: { width: 80, textAlign: 'right' as const },

  // Quantity spinner
  qtySpinner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qtyText: {
    ...Typography.label,
    color: Colors.text,
    minWidth: 20,
    textAlign: 'center',
  },

  // Discount picker
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  pickerOption: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: Colors.white,
  },
  pickerOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  pickerOptionText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  pickerOptionTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // Input with suffix
  inputWithSuffix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  suffixText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },

  // Save button
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.gray300,
  },
  saveButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
});
