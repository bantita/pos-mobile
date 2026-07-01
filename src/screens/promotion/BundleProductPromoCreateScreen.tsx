/**
 * BundleProductPromoCreateScreen — ฟอร์มสร้างโปรโมชั่นสินค้าร่วม
 * ตามแบบ Zort POS "เพิ่มโปรโมชั่นสินค้าร่วม"
 *
 * Sections:
 * 1. Header: ชื่อ, วันเริ่ม, วันสิ้นสุด, checkbox noEndDate, คลังสินค้า/สาขา (radio), รายละเอียด
 * 2. เงื่อนไขโปรโมชั่น: สินค้าร่วม table (รหัสสินค้า, ชื่อ, จำนวน, มูลค่าต่อหน่วย)
 * 3. Discount: A (ราคารวมขั้นต่ำทั้งบิล), B (ประเภท dropdown + value)
 * 4. โปรโมชั่นของแถม (when discountType = 'free_product')
 * 5. Button: บันทึก
 *
 * Validates: Requirements 5.2–5.6, 11.3, 11.5, 11.6, 11.7
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePromoManagementStore } from '../../store/promoManagementStore';
import { validateBundleForm, BundleFormData } from '../../utils/promoValidation';
import { BundleProductItem, BundleDiscountType, BundleBranchScope } from '../../types/bundlePromo';
import { FreeProductItem } from '../../types/productGroupPromo';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface Props {
  onBack: () => void;
}

const DISCOUNT_TYPE_OPTIONS: { value: BundleDiscountType; label: string }[] = [
  { value: 'set_price', label: 'ตั้งราคาขาย' },
  { value: 'fixed_amount', label: 'ส่วนลดเงิน (บาท)' },
  { value: 'percent', label: 'ส่วนลด (%)' },
  { value: 'free_product', label: 'แถมสินค้า' },
];

/** Get today as YYYY-MM-DD */
const getToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const BundleProductPromoCreateScreen: React.FC<Props> = ({ onBack }) => {
  // ─── Form State ─────────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState('');
  const [noEndDate, setNoEndDate] = useState(false);
  const [branchScope, setBranchScope] = useState<BundleBranchScope>('all');
  const [description, setDescription] = useState('');
  const [products, setProducts] = useState<BundleProductItem[]>([]);
  const [minBillTotal, setMinBillTotal] = useState(0);
  const [discountType, setDiscountType] = useState<BundleDiscountType | ''>('');
  const [discountValue, setDiscountValue] = useState(0);
  const [freeProducts, setFreeProducts] = useState<FreeProductItem[]>([]);
  const [showDiscountDropdown, setShowDiscountDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createBundlePromo } = usePromoManagementStore();

  // ─── Add Product ────────────────────────────────────────────────────────────
  const handleAddProduct = () => {
    if (products.length >= 50) {
      Alert.alert('แจ้งเตือน', 'เลือกสินค้าได้สูงสุด 50 รายการ');
      return;
    }
    // Placeholder: in real app, open product search modal
    const newProduct: BundleProductItem = {
      productId: `prod_${Date.now()}`,
      productCode: `SKU${String(products.length + 1).padStart(4, '0')}`,
      productName: `สินค้า ${products.length + 1}`,
      quantity: 1,
      unitPrice: 0,
    };
    setProducts([...products, newProduct]);
  };

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleProductQtyChange = (index: number, qty: string) => {
    const num = parseInt(qty, 10) || 0;
    const updated = [...products];
    updated[index] = { ...updated[index], quantity: Math.max(1, Math.min(999, num)) };
    setProducts(updated);
  };

  const handleProductPriceChange = (index: number, price: string) => {
    const num = parseFloat(price) || 0;
    const updated = [...products];
    updated[index] = { ...updated[index], unitPrice: Math.max(0, num) };
    setProducts(updated);
  };

  // ─── Add Free Product ───────────────────────────────────────────────────────
  const handleAddFreeProduct = () => {
    if (freeProducts.length >= 10) {
      Alert.alert('แจ้งเตือน', 'เลือกสินค้าแถมได้สูงสุด 10 รายการ');
      return;
    }
    const newFree: FreeProductItem = {
      productId: `free_${Date.now()}`,
      productCode: `FREE${String(freeProducts.length + 1).padStart(4, '0')}`,
      productName: `สินค้าแถม ${freeProducts.length + 1}`,
      quantity: 1,
      unitPrice: 0,
    };
    setFreeProducts([...freeProducts, newFree]);
  };

  const handleRemoveFreeProduct = (index: number) => {
    setFreeProducts(freeProducts.filter((_, i) => i !== index));
  };

  const handleFreeProductQtyChange = (index: number, qty: string) => {
    const num = parseInt(qty, 10) || 0;
    const updated = [...freeProducts];
    updated[index] = { ...updated[index], quantity: Math.max(1, Math.min(999, num)) };
    setFreeProducts(updated);
  };

  // ─── Save ───────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const formData: BundleFormData = {
      name: name.trim(),
      startDate,
      endDate: noEndDate ? undefined : endDate,
      noEndDate,
      products: products.map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
      })),
      discountType: discountType || '',
      discountValue,
      minBillTotal,
      freeProducts: freeProducts.map((fp) => ({
        productId: fp.productId,
        quantity: fp.quantity,
      })),
    };

    const result = validateBundleForm(formData);
    if (!result.valid) {
      const errMap: Record<string, string> = {};
      result.errors.forEach((e) => { errMap[e.field] = e.message; });
      setErrors(errMap);
      Alert.alert('ข้อมูลไม่ครบถ้วน', result.errors[0].message);
      return;
    }

    setErrors({});
    createBundlePromo({
      name: name.trim(),
      startDate,
      endDate: noEndDate ? undefined : endDate,
      noEndDate,
      branchScope,
      branchIds: branchScope === 'all' ? undefined : [],
      description: description.trim() || undefined,
      products,
      minBillTotal,
      discountType: discountType as BundleDiscountType,
      discountValue,
      freeProducts: discountType === 'free_product' ? freeProducts : [],
      createdBy: 'current_user',
      shopId: 'current_shop',
    });

    Alert.alert('สำเร็จ', 'บันทึกโปรโมชั่นสินค้าร่วมเรียบร้อย', [
      { text: 'ตกลง', onPress: onBack },
    ]);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>เพิ่มโปรโมชั่นสินค้าร่วม</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ Section 1: ข้อมูลทั่วไป ═══ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ข้อมูลทั่วไป</Text>

          {/* ชื่อโปรโมชั่น */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>ชื่อโปรโมชั่น <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.name ? styles.inputError : null]}
              placeholder="กรอกชื่อโปรโมชั่น"
              placeholderTextColor={Colors.gray400}
              value={name}
              onChangeText={setName}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* วันเริ่ม */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>วันเริ่ม <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.startDate ? styles.inputError : null]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.gray400}
              value={startDate}
              onChangeText={setStartDate}
            />
            {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
          </View>

          {/* วันสิ้นสุด + checkbox */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>วันสิ้นสุด <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, noEndDate ? styles.inputDisabled : null, errors.endDate ? styles.inputError : null]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.gray400}
              value={endDate}
              onChangeText={setEndDate}
              editable={!noEndDate}
            />
            {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setNoEndDate(!noEndDate)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={noEndDate ? 'checkbox' : 'square-outline'}
                size={20}
                color={noEndDate ? Colors.primary : Colors.gray400}
              />
              <Text style={styles.checkboxLabel}>ไม่กำหนดวันสิ้นสุด</Text>
            </TouchableOpacity>
          </View>

          {/* คลังสินค้า/สาขา (radio) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>คลังสินค้า/สาขา</Text>
            <View style={styles.radioRow}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setBranchScope('all')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={branchScope === 'all' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={branchScope === 'all' ? Colors.primary : Colors.gray400}
                />
                <Text style={styles.radioLabel}>ทั้งหมด</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setBranchScope('selected')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={branchScope === 'selected' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={branchScope === 'selected' ? Colors.primary : Colors.gray400}
                />
                <Text style={styles.radioLabel}>บางส่วน</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* รายละเอียด */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>รายละเอียด</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
              placeholderTextColor={Colors.gray400}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* ═══ Section 2: เงื่อนไขโปรโมชั่น — สินค้าร่วม ═══ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>เงื่อนไขโปรโมชั่น — สินค้าร่วม</Text>
            <TouchableOpacity style={styles.addProductBtn} onPress={handleAddProduct} activeOpacity={0.7}>
              <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.addProductText}>เพิ่มสินค้า</Text>
            </TouchableOpacity>
          </View>
          {errors.products && <Text style={styles.errorText}>{errors.products}</Text>}

          {/* Products Table Header */}
          {products.length > 0 && (
            <View style={styles.tableHeader}>
              <Text style={[styles.thCode, styles.thText]}>รหัสสินค้า</Text>
              <Text style={[styles.thName, styles.thText]}>ชื่อ</Text>
              <Text style={[styles.thQty, styles.thText]}>จำนวน</Text>
              <Text style={[styles.thPrice, styles.thText]}>มูลค่า/หน่วย</Text>
              <View style={styles.thAction} />
            </View>
          )}

          {/* Product Rows */}
          {products.map((product, index) => (
            <View key={product.productId} style={styles.tableRow}>
              <Text style={[styles.thCode, styles.cellText]} numberOfLines={1}>
                {product.productCode}
              </Text>
              <Text style={[styles.thName, styles.cellText]} numberOfLines={1}>
                {product.productName}
              </Text>
              <TextInput
                style={[styles.thQty, styles.cellInput]}
                value={String(product.quantity)}
                onChangeText={(v) => handleProductQtyChange(index, v)}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.thPrice, styles.cellInput]}
                value={String(product.unitPrice)}
                onChangeText={(v) => handleProductPriceChange(index, v)}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.thAction}
                onPress={() => handleRemoveProduct(index)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))}

          {products.length === 0 && (
            <View style={styles.emptyProducts}>
              <Text style={styles.emptyProductsText}>
                ยังไม่ได้เลือกสินค้า (ขั้นต่ำ 2 รายการ, สูงสุด 50)
              </Text>
            </View>
          )}
        </View>

        {/* ═══ Section 3: ส่วนลด ═══ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ส่วนลด</Text>

          {/* A: ราคารวมขั้นต่ำทั้งบิล */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>ราคารวมขั้นต่ำทั้งบิล (บาท)</Text>
            <TextInput
              style={[styles.input, errors.minBillTotal ? styles.inputError : null]}
              placeholder="0"
              placeholderTextColor={Colors.gray400}
              value={minBillTotal > 0 ? String(minBillTotal) : ''}
              onChangeText={(v) => setMinBillTotal(parseFloat(v) || 0)}
              keyboardType="numeric"
            />
            {errors.minBillTotal && <Text style={styles.errorText}>{errors.minBillTotal}</Text>}
          </View>

          {/* B: ประเภทส่วนลด (dropdown) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>ประเภทส่วนลด <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={[styles.dropdown, errors.discountType ? styles.inputError : null]}
              onPress={() => setShowDiscountDropdown(!showDiscountDropdown)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dropdownText, !discountType && styles.dropdownPlaceholder]}>
                {discountType
                  ? DISCOUNT_TYPE_OPTIONS.find((o) => o.value === discountType)?.label
                  : 'เลือกประเภทส่วนลด'}
              </Text>
              <Ionicons
                name={showDiscountDropdown ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.gray400}
              />
            </TouchableOpacity>
            {errors.discountType && <Text style={styles.errorText}>{errors.discountType}</Text>}

            {/* Dropdown Options */}
            {showDiscountDropdown && (
              <View style={styles.dropdownMenu}>
                {DISCOUNT_TYPE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.dropdownItem,
                      discountType === opt.value && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setDiscountType(opt.value);
                      setShowDiscountDropdown(false);
                      if (opt.value === 'free_product') {
                        setDiscountValue(0);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        discountType === opt.value && styles.dropdownItemTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Discount Value (when not free_product) */}
          {discountType !== '' && discountType !== 'free_product' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {discountType === 'percent' ? 'เปอร์เซ็นต์ส่วนลด (1-99)' :
                 discountType === 'set_price' ? 'ราคาขาย (บาท)' :
                 'จำนวนเงินที่ลด (บาท)'}
              </Text>
              <TextInput
                style={[styles.input, errors.discountValue ? styles.inputError : null]}
                placeholder="0"
                placeholderTextColor={Colors.gray400}
                value={discountValue > 0 ? String(discountValue) : ''}
                onChangeText={(v) => setDiscountValue(parseFloat(v) || 0)}
                keyboardType="numeric"
              />
              {errors.discountValue && <Text style={styles.errorText}>{errors.discountValue}</Text>}
            </View>
          )}
        </View>

        {/* ═══ Section 4: โปรโมชั่นของแถม (when discountType = 'free_product') ═══ */}
        {discountType === 'free_product' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>โปรโมชั่นของแถม</Text>
              <TouchableOpacity style={styles.addProductBtn} onPress={handleAddFreeProduct} activeOpacity={0.7}>
                <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                <Text style={styles.addProductText}>เพิ่มสินค้าแถม</Text>
              </TouchableOpacity>
            </View>
            {errors.freeProducts && <Text style={styles.errorText}>{errors.freeProducts}</Text>}

            {freeProducts.map((fp, index) => (
              <View key={fp.productId} style={styles.freeProductRow}>
                <View style={styles.freeProductInfo}>
                  <Text style={styles.freeProductName} numberOfLines={1}>
                    {fp.productName}
                  </Text>
                  <Text style={styles.freeProductCode}>{fp.productCode}</Text>
                </View>
                <TextInput
                  style={styles.freeProductQty}
                  value={String(fp.quantity)}
                  onChangeText={(v) => handleFreeProductQtyChange(index, v)}
                  keyboardType="numeric"
                  placeholder="จำนวน"
                />
                <TouchableOpacity
                  onPress={() => handleRemoveFreeProduct(index)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))}

            {freeProducts.length === 0 && (
              <View style={styles.emptyProducts}>
                <Text style={styles.emptyProductsText}>
                  ยังไม่ได้เลือกสินค้าแถม (1-10 รายการ)
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ═══ Section 5: บันทึก ═══ */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
          <Text style={styles.saveButtonText}>บันทึก</Text>
        </TouchableOpacity>
      </ScrollView>
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

  // ScrollView
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: 60, gap: Spacing.md },

  // Section
  section: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...Typography.label,
    fontWeight: '700',
    color: Colors.text,
    fontSize: FontSize.subtitle,
  },

  // Fields
  fieldGroup: { gap: Spacing.xs },
  fieldLabel: { ...Typography.label, color: Colors.textSecondary },
  required: { color: Colors.danger },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body2,
    color: Colors.text,
    backgroundColor: Colors.white,
    height: 44,
  },
  inputError: { borderColor: Colors.danger },
  inputDisabled: { backgroundColor: Colors.gray100, color: Colors.textDisabled },
  textArea: { height: 80, textAlignVertical: 'top' },
  errorText: { ...Typography.caption, color: Colors.danger, marginTop: 2 },

  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  checkboxLabel: { ...Typography.body2, color: Colors.text },

  // Radio
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  radioOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  radioLabel: { ...Typography.body2, color: Colors.text },

  // Dropdown
  dropdown: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
  },
  dropdownText: { ...Typography.body2, color: Colors.text },
  dropdownPlaceholder: { color: Colors.gray400 },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  dropdownItemActive: { backgroundColor: Colors.primaryLight },
  dropdownItemText: { ...Typography.body2, color: Colors.text },
  dropdownItemTextActive: { color: Colors.primaryDark, fontWeight: '600' },

  // Product Table
  addProductBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addProductText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  thText: { ...Typography.caption, fontWeight: '600', color: Colors.textSecondary },
  thCode: { flex: 1.2 },
  thName: { flex: 1.5 },
  thQty: { width: 56, textAlign: 'center' },
  thPrice: { width: 72, textAlign: 'center' },
  thAction: { width: 28, alignItems: 'center' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  cellText: { ...Typography.caption, color: Colors.text },
  cellInput: {
    ...Typography.caption,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    textAlign: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    height: 30,
  },
  emptyProducts: { alignItems: 'center', paddingVertical: Spacing.lg },
  emptyProductsText: { ...Typography.caption, color: Colors.gray400 },

  // Free Products
  freeProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  freeProductInfo: { flex: 1 },
  freeProductName: { ...Typography.label, color: Colors.text, fontSize: FontSize.body },
  freeProductCode: { ...Typography.caption, color: Colors.textSecondary },
  freeProductQty: {
    width: 60,
    ...Typography.caption,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    textAlign: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    height: 30,
  },

  // Save Button
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  saveButtonText: { ...Typography.button, color: Colors.white },
});
