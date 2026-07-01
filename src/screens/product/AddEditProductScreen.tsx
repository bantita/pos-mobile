/**
 * SCR-PROD-002 + SCR-PROD-003 — เพิ่ม / แก้ไขสินค้า
 * FR-PROD-002: สร้าง Product Master
 * FR-PROD-003: ปรับปรุงข้อมูลสินค้า + Audit Log ราคา
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Switch, Alert, Modal, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProductMaster } from '../../types/product';
import { MOCK_CATEGORIES, MOCK_BRANDS, UNITS } from '../../data/mockProducts';
import { UOMManager } from '../../components/product/UOMManager';
import type { ProductUOM } from '../../types/product';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency } from '../../utils/format';

interface AddEditProductScreenProps {
  product?: ProductMaster;
  onBack: () => void;
  onSaved: (product: ProductMaster) => void;
}

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ title: string; icon: string }> = ({ title, icon }) => (
  <View style={sectionStyles.row}>
    <View style={sectionStyles.iconBox}>
      <Ionicons name={icon as any} size={16} color={Colors.primary} />
    </View>
    <Text style={sectionStyles.title}>{title}</Text>
  </View>
);
const sectionStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  iconBox: { width: 26, height: 26, borderRadius: 6, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  title: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
});
// ─── Picker Modal ─────────────────────────────────────────────────────────────
interface PickerModalProps {
  visible: boolean;
  title: string;
  items: { id: string; name: string }[];
  selectedId: string;
  onSelect: (id: string, name: string) => void;
  onClose: () => void;
}
const PickerModal: React.FC<PickerModalProps> = ({ visible, title, items, selectedId, onSelect, onClose }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={pickerStyles.overlay}>
      <View style={pickerStyles.sheet}>
        <View style={pickerStyles.handle} />
        <Text style={pickerStyles.title}>{title}</Text>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[pickerStyles.option, selectedId === item.id && pickerStyles.optionActive]}
              onPress={() => { onSelect(item.id, item.name); onClose(); }}
            >
              <Text style={[pickerStyles.optionText, selectedId === item.id && { color: Colors.primary, fontWeight: '700' }]}>
                {item.name}
              </Text>
              {selectedId === item.id && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity style={pickerStyles.cancelBtn} onPress={onClose}>
          <Text style={pickerStyles.cancelText}>ยกเลิก</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);
const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, maxHeight: '70%' },
  handle: { width: 40, height: 4, backgroundColor: Colors.gray200, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  title: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  optionActive: { backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm },
  optionText: { ...Typography.body1, color: Colors.text },
  cancelBtn: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.xs },
  cancelText: { ...Typography.button, color: Colors.danger },
});

// ─── Main Component ───────────────────────────────────────────────────────────
export const AddEditProductScreen: React.FC<AddEditProductScreenProps> = ({
  product, onBack, onSaved,
}) => {
  const isEdit = !!product;

  const [code, setCode] = useState(product?.code ?? '');
  const [barcode, setBarcode] = useState(product?.barcode ?? '');
  const [name, setName] = useState(product?.name ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? '');
  const [categoryName, setCategoryName] = useState(product?.categoryName ?? '');
  const [brandId, setBrandId] = useState(product?.brandId ?? '');
  const [brandName, setBrandName] = useState(product?.brandName ?? '');
  const [unit, setUnit] = useState(product?.unit ?? 'ชิ้น');
  const [costPrice, setCostPrice] = useState(product ? String(product.costPrice) : '');
  const [salePrice, setSalePrice] = useState(product ? String(product.salePrice) : '');
  const [vatEnabled, setVatEnabled] = useState(product?.vatIncluded ?? true);
  const [vatRate, setVatRate] = useState(product?.vatRate ?? 7);
  const [productType, setProductType] = useState<'general' | 'service'>(product?.productType ?? 'general');
  const [minStock, setMinStock] = useState(product ? String(product.minStock) : '5');
  const [status, setStatus] = useState<'active' | 'inactive'>(product?.status ?? 'active');
  const [uoms, setUoms] = useState<ProductUOM[]>(
    product?.uoms ?? []
  );
  const [saving, setSaving] = useState(false);

  // Picker modals
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  // Sync base UOM เมื่อ unit / costPrice / salePrice เปลี่ยน
  const syncBaseUOM = (newUnit: string, newCost: number, newSale: number) => {
    setUoms((prev) => {
      if (prev.length === 0) {
        // สร้าง base UOM อัตโนมัติ
        return [{
          id: 'uom_base',
          unit: newUnit,
          ratio: 1,
          costPrice: newCost,
          salePrice: newSale,
          barcodes: barcode ? [barcode] : [],
          isDefault: true,
        }];
      }
      return prev.map((u, i) => i === 0 ? { ...u, unit: newUnit, costPrice: newCost, salePrice: newSale } : u);
    });
  };

  const handleUnitChange = (v: string) => {
    setUnit(v);
    syncBaseUOM(v, parseFloat(costPrice) || 0, parseFloat(salePrice) || 0);
  };
  const handleCostChange = (v: string) => {
    setCostPrice(v);
    syncBaseUOM(unit, parseFloat(v) || 0, parseFloat(salePrice) || 0);
  };
  const handleSaleChange = (v: string) => {
    setSalePrice(v);
    syncBaseUOM(unit, parseFloat(costPrice) || 0, parseFloat(v) || 0);
  };

  // Computed
  const cost = parseFloat(costPrice) || 0;
  const sale = parseFloat(salePrice) || 0;
  const margin = sale > 0 ? (((sale - cost) / sale) * 100).toFixed(1) : '0';
  const profit = sale - cost;

  const autoGenCode = () => {
    const ts = Date.now().toString().slice(-6);
    setCode(`P${ts}`);
  };

  const validate = (): string | null => {
    if (!code.trim()) return 'กรุณากรอกรหัสสินค้า';
    if (!name.trim()) return 'กรุณากรอกชื่อสินค้า';
    if (!categoryId) return 'กรุณาเลือกหมวดหมู่';
    if (sale <= 0) return 'กรุณากรอกราคาขาย';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { Alert.alert('ข้อมูลไม่ครบ', err); return; }
    setSaving(true);
    setTimeout(() => {
      const saved: ProductMaster = {
        id: product?.id ?? `p_${Date.now()}`,
        code, barcode, name, categoryId, categoryName,
        brandId: brandId || undefined, brandName: brandName || undefined,
        unit, costPrice: cost, salePrice: sale,
        vatIncluded: vatEnabled, vatRate: vatEnabled ? vatRate : 0,
        productType,
        status, stockQty: product?.stockQty ?? 0,
        minStock: parseInt(minStock) || 5,
        uoms: uoms.length > 0 ? uoms : [{
          id: 'uom_base', unit, ratio: 1,
          costPrice: cost, salePrice: sale,
          barcodes: barcode ? [barcode] : [],
          isDefault: true,
        }],
        createdAt: product?.createdAt ?? new Date(),
        updatedAt: new Date(),
      };
      setSaving(false);
      if (isEdit) {
        // Audit Log: price change
        if (product && product.salePrice !== sale) {
          console.log(`[AUDIT] PRICE_CHANGE - Product: ${name}, Old: ${product.salePrice}, New: ${sale}, At: ${new Date().toISOString()}`);
        }
      }
      onSaved(saved);
    }, 800);
  };

  const FieldRow: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}{required && <Text style={styles.required}> *</Text>}</Text>
      {children}
    </View>
  );

  const PickerField: React.FC<{ label: string; value: string; placeholder: string; required?: boolean; onPress: () => void }> = ({ label, value, placeholder, required, onPress }) => (
    <FieldRow label={label} required={required}>
      <TouchableOpacity style={styles.pickerField} onPress={onPress} activeOpacity={0.8}>
        <Text style={[styles.pickerFieldText, !value && styles.pickerFieldPlaceholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={Colors.gray400} />
      </TouchableOpacity>
    </FieldRow>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Section: ข้อมูลพื้นฐาน */}
          <View style={styles.section}>
            <SectionHeader title="ข้อมูลพื้นฐาน" icon="information-circle-outline" />

            <FieldRow label="รหัสสินค้า" required>
              <View style={styles.inputWithBtn}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={code}
                  onChangeText={setCode}
                  placeholder="เช่น P001"
                  placeholderTextColor={Colors.gray400}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.autoGenBtn} onPress={autoGenCode}>
                  <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
                  <Text style={styles.autoGenText}>Auto</Text>
                </TouchableOpacity>
              </View>
            </FieldRow>

            <FieldRow label="บาร์โค้ด">
              <View style={styles.inputWithBtn}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={barcode}
                  onChangeText={setBarcode}
                  placeholder="สแกนหรือกรอกบาร์โค้ด"
                  placeholderTextColor={Colors.gray400}
                  keyboardType="number-pad"
                />
                <TouchableOpacity style={styles.autoGenBtn}>
                  <Ionicons name="barcode-outline" size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </FieldRow>

            <FieldRow label="ชื่อสินค้า" required>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="กรอกชื่อสินค้า"
                placeholderTextColor={Colors.gray400}
              />
            </FieldRow>
          </View>

          {/* Section: หมวดหมู่ */}
          <View style={styles.section}>
            <SectionHeader title="หมวดหมู่และหน่วย" icon="list-outline" />
            <PickerField label="หมวดหมู่" value={categoryName} placeholder="เลือกหมวดหมู่" required onPress={() => setShowCatPicker(true)} />
            <PickerField label="Brand" value={brandName} placeholder="เลือก Brand (ถ้ามี)" onPress={() => setShowBrandPicker(true)} />
            <PickerField label="หน่วยนับ" value={unit} placeholder="เลือกหน่วย" required onPress={() => setShowUnitPicker(true)} />          </View>

          {/* Section: ราคา */}
          <View style={styles.section}>
            <SectionHeader title="ราคาและต้นทุน" icon="cash-outline" />
            <View style={styles.priceRow}>
              <FieldRow label="ราคาทุน (฿)">
                <TextInput
                  style={styles.input}
                  value={costPrice}
                  onChangeText={handleCostChange}
                  placeholder="0.00"
                  placeholderTextColor={Colors.gray400}
                  keyboardType="decimal-pad"
                />
              </FieldRow>
              <FieldRow label="ราคาขาย (฿)" required>
                <TextInput
                  style={styles.input}
                  value={salePrice}
                  onChangeText={handleSaleChange}
                  placeholder="0.00"
                  placeholderTextColor={Colors.gray400}
                  keyboardType="decimal-pad"
                />
              </FieldRow>
            </View>

            {/* Margin Preview */}
            {cost > 0 && sale > 0 && (
              <View style={styles.marginPreview}>
                <View style={styles.marginItem}>
                  <Text style={styles.marginLabel}>กำไร/ชิ้น</Text>
                  <Text style={[styles.marginValue, { color: profit >= 0 ? Colors.success : Colors.danger }]}>
                    ฿{formatCurrency(profit)}
                  </Text>
                </View>
                <View style={styles.marginDivider} />
                <View style={styles.marginItem}>
                  <Text style={styles.marginLabel}>Margin</Text>
                  <Text style={[styles.marginValue, { color: parseFloat(margin) >= 20 ? Colors.success : Colors.warning }]}>
                    {margin}%
                  </Text>
                </View>
                <View style={styles.marginDivider} />
                <View style={styles.marginItem}>
                  <Text style={styles.marginLabel}>VAT 7%</Text>
                  <Text style={styles.marginValue}>{vatEnabled ? '฿' + formatCurrency(sale * 0.07) : '-'}</Text>
                </View>
              </View>
            )}

            {/* VAT Toggle + Rate */}
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>ราคารวม VAT</Text>
                <Text style={styles.switchSub}>ราคาขายรวมภาษีมูลค่าเพิ่มแล้ว</Text>
              </View>
              <Switch
                value={vatEnabled}
                onValueChange={setVatEnabled}
                trackColor={{ true: Colors.primary, false: Colors.gray200 }}
                thumbColor={Colors.white}
              />
            </View>
            {vatEnabled && (
              <View style={styles.vatRateRow}>
                <Text style={styles.vatRateLabel}>อัตรา VAT:</Text>
                {[7, 0].map((rate) => (
                  <TouchableOpacity
                    key={rate}
                    style={[styles.vatRateChip, vatRate === rate && styles.vatRateChipActive]}
                    onPress={() => setVatRate(rate)}
                  >
                    <Text style={[styles.vatRateChipText, vatRate === rate && styles.vatRateChipTextActive]}>
                      {rate}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Section: ประเภทสินค้า */}
          <View style={styles.section}>
            <SectionHeader title="ประเภทสินค้า" icon="pricetag-outline" />
            <View style={styles.productTypeRow}>
              <TouchableOpacity
                style={[styles.productTypeBtn, productType === 'general' && styles.productTypeBtnActive]}
                onPress={() => setProductType('general')}
              >
                <Ionicons name="cube-outline" size={20} color={productType === 'general' ? Colors.white : Colors.gray600} />
                <Text style={[styles.productTypeBtnText, productType === 'general' && styles.productTypeBtnTextActive]}>สินค้าทั่วไป</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.productTypeBtn, productType === 'service' && styles.productTypeBtnActiveService]}
                onPress={() => setProductType('service')}
              >
                <Ionicons name="cut-outline" size={20} color={productType === 'service' ? Colors.white : Colors.gray600} />
                <Text style={[styles.productTypeBtnText, productType === 'service' && styles.productTypeBtnTextActive]}>สินค้าบริการ</Text>
              </TouchableOpacity>
            </View>
            {productType === 'service' && (
              <Text style={styles.productTypeHint}>
                สินค้าบริการจะแสดง popup เลือกช่าง/พนักงานทุกครั้งที่เพิ่มในบิล
              </Text>
            )}
          </View>

          {/* Section: หน่วยนับหลายหน่วย + บาร์โค้ด */}
          <View style={styles.section}>
            <UOMManager
              uoms={uoms}
              baseUnit={unit || 'ชิ้น'}
              baseCostPrice={cost}
              baseSalePrice={sale}
              onChange={setUoms}
            />
          </View>

          {/* Section: สต๊อก */}
          <View style={styles.section}>
            <SectionHeader title="สต๊อก" icon="archive-outline" />            <SectionHeader title="สต๊อก" icon="archive-outline" />
            <FieldRow label="จำนวนขั้นต่ำ (Min Stock)">
              <TextInput
                style={styles.input}
                value={minStock}
                onChangeText={setMinStock}
                placeholder="5"
                placeholderTextColor={Colors.gray400}
                keyboardType="number-pad"
              />
            </FieldRow>
            <Text style={styles.minStockHint}>
              ระบบจะแจ้งเตือนเมื่อสต๊อกเหลือน้อยกว่าค่านี้
            </Text>
          </View>

          {/* Section: รูปภาพ */}
          <View style={styles.section}>
            <SectionHeader title="รูปภาพสินค้า" icon="image-outline" />
            <TouchableOpacity style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={32} color={Colors.gray400} />
              <Text style={styles.imagePlaceholderText}>กดเพื่อเพิ่มรูปภาพ</Text>
              <Text style={styles.imagePlaceholderSub}>รองรับ JPG, PNG ขนาดไม่เกิน 5MB</Text>
            </TouchableOpacity>
          </View>

          {/* Section: สถานะ */}
          <View style={styles.section}>
            <SectionHeader title="สถานะ" icon="toggle-outline" />
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>เปิดใช้งานสินค้า</Text>
                <Text style={styles.switchSub}>สินค้าจะแสดงในหน้าขายและรายงาน</Text>
              </View>
              <Switch
                value={status === 'active'}
                onValueChange={(v) => setStatus(v ? 'active' : 'inactive')}
                trackColor={{ true: Colors.success, false: Colors.gray200 }}
                thumbColor={Colors.white}
              />
            </View>
          </View>

          {/* Audit Note (edit mode) */}
          {isEdit && product && parseFloat(salePrice) !== product.salePrice && (
            <View style={styles.auditNote}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
              <Text style={styles.auditNoteText}>
                การเปลี่ยนราคาจาก ฿{formatCurrency(product.salePrice)} → ฿{formatCurrency(sale)} จะถูกบันทึกใน Audit Log
              </Text>
            </View>
          )}

          <View style={{ height: Spacing.xl }} />
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Ionicons name={saving ? 'hourglass-outline' : 'checkmark-circle-outline'} size={22} color={Colors.white} />
            <Text style={styles.saveBtnText}>{saving ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Pickers */}
      <PickerModal
        visible={showCatPicker} title="เลือกหมวดหมู่"
        items={MOCK_CATEGORIES.filter((c) => c.status === 'active')}
        selectedId={categoryId}
        onSelect={(id, nm) => { setCategoryId(id); setCategoryName(nm); }}
        onClose={() => setShowCatPicker(false)}
      />
      <PickerModal
        visible={showBrandPicker} title="เลือก Brand"
        items={[{ id: '', name: '— ไม่ระบุ —' }, ...MOCK_BRANDS.filter((b) => b.status === 'active')]}
        selectedId={brandId}
        onSelect={(id, nm) => { setBrandId(id); setBrandName(id ? nm : ''); }}
        onClose={() => setShowBrandPicker(false)}
      />
      <PickerModal
        visible={showUnitPicker} title="เลือกหน่วยนับ"
        items={UNITS.map((u) => ({ id: u, name: u }))}
        selectedId={unit}
        onSelect={(id) => setUnit(id)}
        onClose={() => setShowUnitPicker(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 100 },
  section: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
  },
  fieldRow: { marginBottom: Spacing.md },
  fieldLabel: { ...Typography.label, color: Colors.gray700, marginBottom: Spacing.xs },
  required: { color: Colors.danger },
  input: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    ...Typography.body1, color: Colors.text,
  },
  inputWithBtn: { flexDirection: 'row', gap: Spacing.sm },
  autoGenBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm, borderWidth: 1, borderColor: Colors.primary,
  },
  autoGenText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  pickerField: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
  },
  pickerFieldText: { ...Typography.body1, color: Colors.text },
  pickerFieldPlaceholder: { color: Colors.gray400 },
  priceRow: { flexDirection: 'row', gap: Spacing.md },
  marginPreview: {
    flexDirection: 'row', backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  marginItem: { flex: 1, alignItems: 'center' },
  marginLabel: { ...Typography.caption, color: Colors.textSecondary },
  marginValue: { ...Typography.label, fontWeight: '700' },
  marginDivider: { width: 1, backgroundColor: Colors.border },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  switchLabel: { ...Typography.label, color: Colors.text },
  switchSub: { ...Typography.caption, color: Colors.textSecondary },
  vatRateRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginTop: Spacing.xs, paddingLeft: Spacing.xs,
  },
  vatRateLabel: { ...Typography.caption, color: Colors.gray600, marginRight: Spacing.xs },
  vatRateChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.full, backgroundColor: Colors.gray100,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  vatRateChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  vatRateChipText: { ...Typography.label, color: Colors.gray600, fontSize: 13 },
  vatRateChipTextActive: { color: Colors.white },
  productTypeRow: { flexDirection: 'row', gap: Spacing.sm },
  productTypeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md, backgroundColor: Colors.gray100,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  productTypeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  productTypeBtnActiveService: { backgroundColor: Colors.category1, borderColor: Colors.category1 },
  productTypeBtnText: { ...Typography.label, color: Colors.gray600 },
  productTypeBtnTextActive: { color: Colors.white },
  productTypeHint: { ...Typography.caption, color: Colors.category1, marginTop: Spacing.sm },
  minStockHint: { ...Typography.caption, color: Colors.textSecondary, marginTop: -Spacing.sm + 2 },
  imagePlaceholder: {
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: BorderRadius.md, padding: Spacing.xl,
    alignItems: 'center', gap: Spacing.xs,
  },
  imagePlaceholderText: { ...Typography.label, color: Colors.gray400 },
  imagePlaceholderSub: { ...Typography.caption, color: Colors.gray300 },
  auditNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  auditNoteText: { ...Typography.body2, color: Colors.primary, flex: 1 },
  footer: {
    padding: Spacing.md, backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md,
  },
  saveBtnDisabled: { backgroundColor: Colors.gray300 },
  saveBtnText: { ...Typography.button, color: Colors.white },
});
