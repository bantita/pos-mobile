/**
 * QuantityPromoCreateScreen — ฟอร์มสร้างโปรโมชั่นจำนวนสินค้า
 * ตามแบบ Zort POS "เพิ่มโปรโมชั่นจำนวนสินค้า"
 *
 * Validates: Requirements 6.2–6.5, 11.4, 11.5, 11.6, 11.7
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePromoManagementStore } from '../../store/promoManagementStore';
import { QuantityProductItem, QuantityTier } from '../../types/quantityPromo';
import {
  validateQuantityForm,
  detectTierOverlaps,
  calculateTierPreview,
} from '../../utils/promoValidation';
import { MOCK_PRODUCTS } from '../../data/mockProducts';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { DatePicker } from '../../components/ui/DatePicker';

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onBack: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const genTierId = () => 't_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const createEmptyTier = (): QuantityTier => ({
  id: genTierId(),
  minQty: 1,
  maxQty: 10,
  discountPerUnit: 5,
});

// ─── Component ────────────────────────────────────────────────────────────────
export const QuantityPromoCreateScreen: React.FC<Props> = ({ onBack }) => {
  const { createQuantityPromo } = usePromoManagementStore();

  // Form state
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [noEndDate, setNoEndDate] = useState(false);
  const [branchScope, setBranchScope] = useState<'all' | 'selected'>('all');
  const [description, setDescription] = useState('');
  const [products, setProducts] = useState<QuantityProductItem[]>([]);
  const [tiers, setTiers] = useState<QuantityTier[]>([createEmptyTier()]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Add mock products ──────────────────────────────────────────────────────
  const handleAddProducts = useCallback(() => {
    // Simulate product selection — add first 3 mock products not already added
    const available = MOCK_PRODUCTS.filter(
      (mp) => mp.status === 'active' && !products.find((p) => p.productId === mp.id)
    );
    const toAdd = available.slice(0, 3).map((mp): QuantityProductItem => ({
      productId: mp.id,
      productCode: mp.code,
      productName: mp.name,
      sellingPrice: mp.salePrice,
    }));
    if (toAdd.length === 0) {
      Alert.alert('ไม่มีสินค้า', 'ไม่มีสินค้าเพิ่มเติมที่จะเลือก');
      return;
    }
    setProducts((prev) => [...prev, ...toAdd]);
  }, [products]);

  const handleRemoveProduct = useCallback((productId: string) => {
    setProducts((prev) => prev.filter((p) => p.productId !== productId));
  }, []);

  // ─── Tier management ────────────────────────────────────────────────────────
  const handleAddTier = useCallback(() => {
    if (tiers.length >= 10) {
      Alert.alert('เกินจำนวน', 'กำหนดช่วงจำนวนได้สูงสุด 10 ช่วง');
      return;
    }
    setTiers((prev) => [...prev, createEmptyTier()]);
  }, [tiers.length]);

  const handleRemoveTier = useCallback((tierId: string) => {
    setTiers((prev) => prev.filter((t) => t.id !== tierId));
  }, []);

  const handleTierChange = useCallback((tierId: string, field: keyof QuantityTier, value: string) => {
    setTiers((prev) =>
      prev.map((t) => {
        if (t.id !== tierId) return t;
        const numVal = parseFloat(value) || 0;
        return { ...t, [field]: numVal };
      })
    );
  }, []);

  // ─── Tier preview ───────────────────────────────────────────────────────────
  const basePrice = useMemo(() => {
    if (products.length === 0) return 0;
    return products[0].sellingPrice;
  }, [products]);

  const tierPreviews = useMemo(() => {
    if (basePrice <= 0 || tiers.length === 0) return [];
    return calculateTierPreview(tiers, basePrice);
  }, [tiers, basePrice]);

  // ─── Save handler ───────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    // Validate form
    const formData = {
      name,
      startDate,
      endDate: noEndDate ? undefined : endDate,
      noEndDate,
      products: products.map((p) => ({ productId: p.productId })),
      tiers,
    };
    const validation = validateQuantityForm(formData);
    if (!validation.valid) {
      const errMap: Record<string, string> = {};
      validation.errors.forEach((e) => { errMap[e.field] = e.message; });
      setErrors(errMap);
      Alert.alert('ข้อมูลไม่ครบ', validation.errors[0].message);
      return;
    }

    // Detect tier overlaps
    const overlaps = detectTierOverlaps(tiers);
    if (overlaps.length > 0) {
      Alert.alert('ช่วงจำนวนซ้อนทับ', 'กรุณาแก้ไขช่วงจำนวนไม่ให้ซ้อนกัน');
      return;
    }

    // Create promotion
    setErrors({});
    createQuantityPromo({
      name: name.trim(),
      startDate,
      endDate: noEndDate ? undefined : endDate,
      noEndDate,
      branchScope,
      branchIds: branchScope === 'all' ? undefined : [],
      description: description.trim() || undefined,
      products,
      tiers,
      createdBy: 'current_user',
      shopId: 'shop_001',
    });
    Alert.alert('สำเร็จ', 'สร้างโปรโมชั่นจำนวนสินค้าเรียบร้อยแล้ว', [
      { text: 'ตกลง', onPress: onBack },
    ]);
  }, [name, startDate, endDate, noEndDate, branchScope, description, products, tiers, createQuantityPromo, onBack]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>เพิ่มโปรโมชั่นจำนวนสินค้า</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* ─── Section 3: Header Info ──────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ข้อมูลโปรโมชั่น</Text>

          {/* ชื่อโปรโมชั่น */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>ชื่อโปรโมชั่น *</Text>
            <TextInput
              style={[styles.input, errors['name'] ? styles.inputError : undefined]}
              placeholder="ระบุชื่อโปรโมชั่น"
              placeholderTextColor={Colors.gray400}
              value={name}
              onChangeText={setName}
            />
            {errors['name'] && <Text style={styles.errorText}>{errors['name']}</Text>}
          </View>

          {/* วันที่เริ่ม */}
          <View style={styles.fieldGroup}>
            <DatePicker
              label="วันที่เริ่มโปรโมชั่น *"
              value={startDate ? new Date(startDate) : null}
              onChange={(d) => setStartDate(d ? d.toISOString().slice(0, 10) : '')}
              error={errors['startDate']}
            />
          </View>

          {/* วันที่สิ้นสุด */}
          <View style={styles.fieldGroup}>
            <DatePicker
              label="วันที่สิ้นสุดโปรโมชั่น *"
              value={endDate ? new Date(endDate) : null}
              onChange={(d) => setEndDate(d ? d.toISOString().slice(0, 10) : '')}
              disabled={noEndDate}
              error={errors['endDate']}
            />
          </View>

          {/* Checkbox: ไม่กำหนดวันสิ้นสุด */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => { setNoEndDate(!noEndDate); if (!noEndDate) setEndDate(''); }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={noEndDate ? 'checkbox' : 'square-outline'}
              size={20}
              color={noEndDate ? Colors.primary : Colors.gray400}
            />
            <Text style={styles.checkboxLabel}>ไม่กำหนดวันสิ้นสุด</Text>
          </TouchableOpacity>

          {/* คลังสินค้า/สาขา */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>คลังสินค้า/สาขา</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioRow}
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
                style={styles.radioRow}
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
              style={[styles.input, styles.inputMultiline]}
              placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
              placeholderTextColor={Colors.gray400}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* ─── Section 4: สินค้า ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>สินค้า</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={handleAddProducts} activeOpacity={0.8}>
              <Text style={styles.selectBtnText}>เลือก</Text>
            </TouchableOpacity>
          </View>
          {errors['products'] && <Text style={styles.errorText}>{errors['products']}</Text>}

          {products.length > 0 && (
            <View style={styles.productTable}>
              {/* Table header */}
              <View style={styles.productTableHeader}>
                <Text style={[styles.ptColCode, styles.ptHeaderText]}>รหัสสินค้า</Text>
                <Text style={[styles.ptColName, styles.ptHeaderText]}>ชื่อสินค้า</Text>
                <Text style={[styles.ptColPrice, styles.ptHeaderText]}>ราคาขาย</Text>
                <View style={styles.ptColAction} />
              </View>

              {/* Table rows */}
              {products.map((p) => (
                <View key={p.productId} style={styles.productTableRow}>
                  <Text style={[styles.ptColCode, styles.ptCellText]}>{p.productCode}</Text>
                  <Text style={[styles.ptColName, styles.ptCellText]} numberOfLines={1}>{p.productName}</Text>
                  <Text style={[styles.ptColPrice, styles.ptCellText]}>฿{p.sellingPrice.toLocaleString()}</Text>
                  <TouchableOpacity
                    style={styles.ptColAction}
                    onPress={() => handleRemoveProduct(p.productId)}
                  >
                    <Ionicons name="close-circle" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {products.length === 0 && (
            <Text style={styles.emptyHint}>กดปุ่ม "เลือก" เพื่อเพิ่มสินค้า</Text>
          )}
        </View>

        {/* ─── Section 5: ช่วงราคา (Tiers) ─────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ช่วงราคา</Text>
          {errors['tiers'] && <Text style={styles.errorText}>{errors['tiers']}</Text>}

          {/* Tier table header */}
          <View style={styles.tierTableHeader}>
            <Text style={[styles.tierColNum, styles.ptHeaderText]}>#</Text>
            <Text style={[styles.tierColQty, styles.ptHeaderText]}>จำนวนขั้นต่ำ/ชิ้น</Text>
            <Text style={[styles.tierColDash, styles.ptHeaderText]}>-</Text>
            <Text style={[styles.tierColQty, styles.ptHeaderText]}>จำนวนสูงสุด/ชิ้น</Text>
            <Text style={[styles.tierColDiscount, styles.ptHeaderText]}>ส่วนลดต่อหน่วย</Text>
            <View style={styles.tierColAction} />
          </View>

          {/* Tier rows */}
          {tiers.map((tier, idx) => (
            <View key={tier.id} style={styles.tierRow}>
              <Text style={styles.tierColNum}>{idx + 1}</Text>
              <TextInput
                style={[styles.tierInput, styles.tierColQty]}
                keyboardType="numeric"
                value={tier.minQty.toString()}
                onChangeText={(v) => handleTierChange(tier.id, 'minQty', v)}
              />
              <Text style={styles.tierColDash}>-</Text>
              <TextInput
                style={[styles.tierInput, styles.tierColQty]}
                keyboardType="numeric"
                value={tier.maxQty.toString()}
                onChangeText={(v) => handleTierChange(tier.id, 'maxQty', v)}
              />
              <TextInput
                style={[styles.tierInput, styles.tierColDiscount]}
                keyboardType="numeric"
                value={tier.discountPerUnit.toString()}
                onChangeText={(v) => handleTierChange(tier.id, 'discountPerUnit', v)}
                placeholder="%"
                placeholderTextColor={Colors.gray400}
              />
              <TouchableOpacity style={styles.tierColAction} onPress={() => handleRemoveTier(tier.id)}>
                <Ionicons name="close-circle" size={18} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))}

          {/* + เพิ่ม */}
          <TouchableOpacity style={styles.addTierBtn} onPress={handleAddTier} activeOpacity={0.7}>
            <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
            <Text style={styles.addTierText}>+ เพิ่ม</Text>
          </TouchableOpacity>

          <Text style={styles.tierHint}>
            ใส่ส่วนลดเป็นเงิน หรือเป็นเปอร์เซ็นต์ก็ได้
          </Text>

          {/* Discount preview */}
          {tierPreviews.length > 0 && (
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>ตัวอย่างส่วนลด (ราคาฐาน ฿{basePrice.toLocaleString()})</Text>
              {tierPreviews.map((pv) => (
                <View key={pv.tierId} style={styles.previewRow}>
                  <Text style={styles.previewText}>
                    ซื้อ {pv.sampleQty} ชิ้น → ฿{pv.discountedPrice.toFixed(2)}/ชิ้น (ลด {pv.discountPercent}%)
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ─── Section 6: Save button ──────────────────────────────────────── */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveButtonText}>บันทึก</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
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
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.white,
    flex: 1,
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 60 },

  // Section
  section: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
  },

  // Fields
  fieldGroup: { gap: 4 },
  fieldLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body2,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.danger,
  },
  inputDisabled: {
    backgroundColor: Colors.gray100,
    color: Colors.textDisabled,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: 2,
  },

  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  checkboxLabel: {
    ...Typography.body2,
    color: Colors.text,
  },

  // Radio
  radioGroup: { flexDirection: 'row', gap: Spacing.lg },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  radioLabel: {
    ...Typography.body2,
    color: Colors.text,
  },

  // Product select button
  selectBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  selectBtnText: {
    ...Typography.button,
    color: Colors.white,
    fontSize: FontSize.body,
  },

  // Product table
  productTable: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  productTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },

  ptColCode: { width: 70 },
  ptColName: { flex: 1, paddingHorizontal: 4 },
  ptColPrice: { width: 70, textAlign: 'right' },
  ptColAction: { width: 28, alignItems: 'center' },
  ptHeaderText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  ptCellText: {
    ...Typography.caption,
    color: Colors.text,
  },

  emptyHint: {
    ...Typography.body2,
    color: Colors.gray400,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },

  // Tier table
  tierTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: 4,
    paddingHorizontal: Spacing.xs,
  },
  tierColNum: { width: 24, textAlign: 'center', ...Typography.caption, color: Colors.textSecondary },
  tierColQty: { flex: 1 },
  tierColDash: { width: 16, textAlign: 'center', ...Typography.caption, color: Colors.textSecondary },
  tierColDiscount: { flex: 1.2 },
  tierColAction: { width: 28, alignItems: 'center' },
  tierInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    ...Typography.caption,
    color: Colors.text,
    textAlign: 'center',
  },

  addTierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  addTierText: {
    ...Typography.label,
    color: Colors.primary,
    fontSize: FontSize.body,
  },
  tierHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },

  // Preview
  previewSection: {
    backgroundColor: Colors.surfaceSky,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: 4,
    marginTop: Spacing.xs,
  },
  previewTitle: {
    ...Typography.caption,
    color: Colors.accentDark,
    fontWeight: '700',
  },
  previewRow: { paddingVertical: 2 },
  previewText: {
    ...Typography.caption,
    color: Colors.text,
  },

  // Save button
  saveButton: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  saveButtonText: {
    ...Typography.button,
    color: Colors.white,
    fontSize: FontSize.subtitleLg,
  },
});
