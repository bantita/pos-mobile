/**
 * SCR-PROD-002 + SCR-PROD-003 — เพิ่ม / แก้ไขสินค้า
 * FR-PROD-002: สร้าง Product Master
 * FR-PROD-003: ปรับปรุงข้อมูลสินค้า + Audit Log ราคา
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Switch, Alert, Modal, FlatList, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProductMaster } from '../../types/product';
import { UNITS } from '../../data/mockProducts';
import * as brandStore from '../../store/brandStore';
import { getCategories } from '../../store/categoryStore';
import { getSuppliers } from '../../store/supplierStore';
import { UOMManager } from '../../components/product/UOMManager';
import type { ProductUOM, ProductOption, ProductVariant } from '../../types/product';
import { logAction } from '../../store/auditLogStore';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency } from '../../utils/format';

const IS_WEB = Platform.OS === 'web';
const WEB_ONLY_MSG = 'รองรับเฉพาะเว็บในเวอร์ชันนี้';

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
  /** แสดงข้อความ "ไม่มีข้อมูล" เมื่อ true (เช่น store ว่าง) */
  showEmpty?: boolean;
}
const PickerModal: React.FC<PickerModalProps> = ({ visible, title, items, selectedId, onSelect, onClose, showEmpty }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={pickerStyles.overlay}>
      <View style={pickerStyles.sheet}>
        <View style={pickerStyles.handle} />
        <Text style={pickerStyles.title}>{title}</Text>
        {showEmpty && (
          <View style={pickerStyles.emptyBox}>
            <Ionicons name="file-tray-outline" size={40} color={Colors.gray300} />
            <Text style={pickerStyles.emptyText}>ไม่มีข้อมูล</Text>
          </View>
        )}
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
  emptyBox: { alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.xs },
  emptyText: { ...Typography.body1, color: Colors.gray400 },
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
  const [supplierId, setSupplierId] = useState(product?.supplierId ?? '');
  const [supplierName, setSupplierName] = useState(product?.supplierName ?? '');
  const [options, setOptions] = useState<ProductOption[]>(
    product?.options ? product.options.map((o) => ({ name: o.name, values: [...o.values] })) : []
  );
  const [variants, setVariants] = useState<ProductVariant[]>(
    product?.variants ? product.variants.map((v) => ({ ...v, optionValues: { ...v.optionValues } })) : []
  );
  const [variantError, setVariantError] = useState('');
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
  const [image, setImage] = useState<string | undefined>(product?.image);
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Picker modals
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);
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

  // ─── Options / Variants ───
  const regenerateVariants = (nextOptions: ProductOption[]) => {
    const valid = nextOptions.filter((o) => o.name.trim() && o.values.some((v) => v.trim()));
    if (valid.length === 0) { setVariants([]); return; }
    let combos: Record<string, string>[] = [{}];
    valid.forEach((opt) => {
      const vals = opt.values.filter((v) => v.trim());
      const next: Record<string, string>[] = [];
      combos.forEach((combo) => {
        vals.forEach((val) => { next.push({ ...combo, [opt.name]: val }); });
      });
      combos = next;
    });
    setVariants((prev) => combos.map((optionValues, i) => {
      const existing = prev.find((v) => JSON.stringify(v.optionValues) === JSON.stringify(optionValues));
      return existing ?? {
        id: `v_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 5)}`,
        stockQty: 0,
        optionValues,
      };
    }));
  };

  const updateOption = (index: number, patch: Partial<ProductOption>) => {
    setOptions((prev) => {
      const next = prev.map((o, i) => i === index ? { ...o, ...patch } : o);
      regenerateVariants(next);
      return next;
    });
  };
  const addOption = () => setOptions((prev) => [...prev, { name: '', values: [] }]);
  const removeOption = (index: number) => {
    setOptions((prev) => {
      const next = prev.filter((_, i) => i !== index);
      regenerateVariants(next);
      return next;
    });
  };
  const setOptionValues = (index: number, raw: string) => {
    const values = raw.split(',').map((v) => v.trim()).filter(Boolean);
    updateOption(index, { values });
  };
  const updateVariant = (id: string, patch: Partial<ProductVariant>) => {
    setVariants((prev) => prev.map((v) => v.id === id ? { ...v, ...patch } : v));
  };

  const optionNameError = (() => {
    const names = options.map((o) => o.name.trim());
    for (let i = 0; i < options.length; i++) {
      if (!names[i]) return 'ชื่อตัวเลือกห้ามว่าง';
      if (names.indexOf(names[i]) !== i) return `ชื่อตัวเลือก "${names[i]}" ซ้ำกัน`;
      if (options[i].values.filter((v) => v.trim()).length === 0) return `ตัวเลือก "${names[i]}" ต้องมีค่าอย่างน้อย 1 ค่า`;
    }
    return '';
  })();

  const validateVariants = (): string | null => {
    if (optionNameError) return optionNameError;
    const seenBarcodes = new Set<string>();
    for (const v of variants) {
      if (!Number.isInteger(v.stockQty) || v.stockQty < 0) return 'จำนวนสต๊อกของตัวเลือกต้องเป็นจำนวนเต็มไม่ติดลบ';
      if (v.price != null && v.price < 0) return 'ราคาของตัวเลือกต้องไม่ติดลบ';
      const bc = v.barcode?.trim();
      if (bc) {
        if (seenBarcodes.has(bc)) return `บาร์โค้ด "${bc}" ของตัวเลือกซ้ำกันภายในสินค้า`;
        seenBarcodes.add(bc);
      }
    }
    return null;
  };

  const validate = (): string | null => {
    if (!code.trim()) return 'กรุณากรอกรหัสสินค้า';
    if (!name.trim()) return 'กรุณากรอกชื่อสินค้า';
    if (!categoryId) return 'กรุณาเลือกหมวดหมู่';
    if (sale <= 0) return 'กรุณากรอกราคาขาย';
    return null;
  };

  const handlePickImage = () => {
    if (!IS_WEB) { Alert.alert('ไม่รองรับ', WEB_ONLY_MSG); return; }
    let input = imageInputRef.current;
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      imageInputRef.current = input;
    }
    input.value = '';
    input.onchange = () => {
      const file = input!.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setImage(String(reader.result ?? ''));
      reader.onerror = () => Alert.alert('ผิดพลาด', 'อ่านไฟล์รูปภาพไม่สำเร็จ');
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { Alert.alert('ข้อมูลไม่ครบ', err); return; }
    const vErr = validateVariants();
    if (vErr) { setVariantError(vErr); return; }
    setVariantError('');
    setSaving(true);
    setTimeout(() => {
      const saved: ProductMaster = {
        id: product?.id ?? `p_${Date.now()}`,
        code, barcode, name, categoryId, categoryName,
        brandId: brandId || undefined, brandName: brandName || undefined,
        unit, costPrice: cost, salePrice: sale,
        vatIncluded: vatEnabled, vatRate: vatEnabled ? vatRate : 0,
        image,
        productType,
        status, stockQty: product?.stockQty ?? 0,
        minStock: parseInt(minStock) || 5,
        uoms: uoms.length > 0 ? uoms : [{
          id: 'uom_base', unit, ratio: 1,
          costPrice: cost, salePrice: sale,
          barcodes: barcode ? [barcode] : [],
          isDefault: true,
        }],
        // always write (clearable on edit)
        options: options.length > 0 ? options : [],
        variants: variants.length > 0 ? variants : [],
        supplierId: supplierId || undefined,
        supplierName: supplierId ? (supplierName || undefined) : undefined,
        createdAt: product?.createdAt ?? new Date(),
        updatedAt: new Date(),
      };
      setSaving(false);
      if (isEdit && product && product.salePrice !== sale) {
        // Audit Log: price change
        logAction(
          'สินค้า',
          'เปลี่ยนราคา',
          `เปลี่ยนราคา ${name}: ${product.salePrice} -> ${sale}`,
          { productId: product.id, oldPrice: product.salePrice, newPrice: sale }
        );
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
            <PickerField label="ผู้จำหน่าย" value={supplierName} placeholder="เลือกผู้จำหน่าย (ถ้ามี)" onPress={() => setShowSupplierPicker(true)} />
            <PickerField label="หน่วยนับ" value={unit} placeholder="เลือกหน่วย" required onPress={() => setShowUnitPicker(true)} />          </View>

          {/* Section: ตัวเลือกและ Variant */}
          <View style={styles.section}>
            <View style={styles.optionsHeaderRow}>
              <SectionHeader title="ตัวเลือกสินค้า (Variant)" icon="color-palette-outline" />
              <TouchableOpacity style={styles.addOptionBtn} onPress={addOption}>
                <Ionicons name="add" size={16} color={Colors.primary} />
                <Text style={styles.addOptionText}>เพิ่มตัวเลือก</Text>
              </TouchableOpacity>
            </View>

            {options.length === 0 && (
              <Text style={styles.optionsHint}>ไม่มีข้อมูล — เพิ่มตัวเลือก เช่น สี/ไซส์ เพื่อสร้าง variant</Text>
            )}

            {options.map((opt, idx) => (
              <View key={idx} style={styles.optionRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>ชื่อตัวเลือก *</Text>
                  <TextInput
                    style={styles.input}
                    value={opt.name}
                    onChangeText={(v) => updateOption(idx, { name: v })}
                    placeholder="เช่น สี"
                    placeholderTextColor={Colors.gray400}
                  />
                </View>
                <View style={{ flex: 1.4 }}>
                  <Text style={styles.fieldLabel}>ค่า (คั่นด้วย ,) *</Text>
                  <TextInput
                    style={styles.input}
                    value={opt.values.join(', ')}
                    onChangeText={(v) => setOptionValues(idx, v)}
                    placeholder="เช่น แดง, น้ำเงิน"
                    placeholderTextColor={Colors.gray400}
                  />
                </View>
                <TouchableOpacity style={styles.optionDeleteBtn} onPress={() => removeOption(idx)}>
                  <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))}

            {!!optionNameError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{optionNameError}</Text>
              </View>
            )}

            {variants.length > 0 && !optionNameError && (
              <View style={styles.variantList}>
                <Text style={styles.variantListTitle}>Variant ({variants.length})</Text>
                {variants.map((v) => (
                  <View key={v.id} style={styles.variantCard}>
                    <Text style={styles.variantName}>{Object.values(v.optionValues).join(' / ')}</Text>
                    <View style={styles.variantFields}>
                      <View style={styles.variantField}>
                        <Text style={styles.variantFieldLabel}>SKU</Text>
                        <TextInput
                          style={styles.variantInput}
                          value={v.sku ?? ''}
                          onChangeText={(t) => updateVariant(v.id, { sku: t || undefined })}
                          placeholder="SKU"
                          placeholderTextColor={Colors.gray400}
                        />
                      </View>
                      <View style={styles.variantField}>
                        <Text style={styles.variantFieldLabel}>บาร์โค้ด</Text>
                        <TextInput
                          style={styles.variantInput}
                          value={v.barcode ?? ''}
                          onChangeText={(t) => updateVariant(v.id, { barcode: t || undefined })}
                          placeholder="บาร์โค้ด"
                          placeholderTextColor={Colors.gray400}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                    <View style={styles.variantFields}>
                      <View style={styles.variantField}>
                        <Text style={styles.variantFieldLabel}>ราคา (ถ้ามี)</Text>
                        <TextInput
                          style={styles.variantInput}
                          value={v.price != null ? String(v.price) : ''}
                          onChangeText={(t) => updateVariant(v.id, { price: t.trim() === '' ? undefined : (parseFloat(t) || 0) })}
                          placeholder="ราคา"
                          placeholderTextColor={Colors.gray400}
                          keyboardType="decimal-pad"
                        />
                      </View>
                      <View style={styles.variantField}>
                        <Text style={styles.variantFieldLabel}>สต๊อก</Text>
                        <TextInput
                          style={styles.variantInput}
                          value={String(v.stockQty)}
                          onChangeText={(t) => updateVariant(v.id, { stockQty: Math.max(0, Math.floor(parseFloat(t) || 0)) })}
                          placeholder="0"
                          placeholderTextColor={Colors.gray400}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {!!variantError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{variantError}</Text>
              </View>
            )}
          </View>

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
            {image ? (
              <View style={styles.imagePreviewBox}>
                <Image source={{ uri: image }} style={styles.imagePreview} resizeMode="cover" />
                <View style={styles.imagePreviewActions}>
                  <TouchableOpacity style={styles.imageActionBtn} onPress={handlePickImage}>
                    <Ionicons name="swap-horizontal-outline" size={16} color={Colors.primary} />
                    <Text style={styles.imageActionText}>เปลี่ยนรูป</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageActionBtn} onPress={() => setImage(undefined)}>
                    <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                    <Text style={[styles.imageActionText, { color: Colors.danger }]}>ลบรูป</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePlaceholder} onPress={handlePickImage} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={32} color={Colors.gray400} />
                <Text style={styles.imagePlaceholderText}>กดเพื่อเพิ่มรูปภาพ</Text>
                <Text style={styles.imagePlaceholderSub}>รองรับ JPG, PNG ขนาดไม่เกิน 5MB</Text>
              </TouchableOpacity>
            )}
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
        items={getCategories().filter((c) => c.status === 'active')}
        selectedId={categoryId}
        onSelect={(id, nm) => { setCategoryId(id); setCategoryName(nm); }}
        onClose={() => setShowCatPicker(false)}
      />
      <PickerModal
        visible={showBrandPicker} title="เลือก Brand"
        items={[{ id: '', name: '— ไม่ระบุ —' }, ...brandStore.getBrands().filter((b) => b.status === 'active')]}
        selectedId={brandId}
        onSelect={(id, nm) => { setBrandId(id); setBrandName(id ? nm : ''); }}
        onClose={() => setShowBrandPicker(false)}
      />
      <PickerModal
        visible={showSupplierPicker} title="เลือกผู้จำหน่าย"
        items={[{ id: '', name: '— ไม่ระบุ —' }, ...getSuppliers()]}
        selectedId={supplierId}
        showEmpty={getSuppliers().length === 0}
        onSelect={(id, nm) => { setSupplierId(id); setSupplierName(id ? nm : ''); }}
        onClose={() => setShowSupplierPicker(false)}
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
  imagePreviewBox: { gap: Spacing.sm },
  imagePreview: {
    width: '100%', height: 180, borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
  },
  imagePreviewActions: { flexDirection: 'row', gap: Spacing.sm },
  imageActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
  },
  imageActionText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  auditNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  auditNoteText: { ...Typography.body2, color: Colors.primary, flex: 1 },
  optionsHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addOptionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: Colors.primary, marginBottom: Spacing.sm,
  },
  addOptionText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  optionsHint: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.sm },
  optionRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end', marginBottom: Spacing.sm },
  optionDeleteBtn: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: Colors.dangerLight, alignItems: 'center', justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginTop: Spacing.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.danger,
  },
  errorText: { ...Typography.body2, color: Colors.danger, flex: 1 },
  variantList: { marginTop: Spacing.sm, gap: Spacing.sm },
  variantListTitle: { ...Typography.label, color: Colors.gray700 },
  variantCard: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.sm, gap: Spacing.sm,
  },
  variantName: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
  variantFields: { flexDirection: 'row', gap: Spacing.sm },
  variantField: { flex: 1 },
  variantFieldLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 2 },
  variantInput: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    ...Typography.body2, color: Colors.text,
  },
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
