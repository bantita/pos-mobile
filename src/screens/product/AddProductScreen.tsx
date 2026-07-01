/**
 * SCR-PROD-002 — Add Product Screen
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProductForm {
  code: string;
  barcode: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  costPrice: string;
  sellingPrice: string;
  vatEnabled: boolean;
  vatRate: 0 | 7;
  initialStock: string;
}

interface FormErrors {
  code?: string;
  name?: string;
  category?: string;
  unit?: string;
  costPrice?: string;
  sellingPrice?: string;
  initialStock?: string;
}

interface AddProductScreenProps {
  onBack?: () => void;
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onSaved?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateCode = () => `P${String(Date.now()).slice(-6)}`;

const CATEGORIES = ['เครื่องดื่ม', 'อาหาร', 'วัตถุดิบ', 'นม', 'ผักผลไม้', 'อื่นๆ'];
const UNITS = ['ชิ้น', 'แก้ว', 'จาน', 'ขวด', 'กล่อง', 'ถุง', 'กิโลกรัม', 'ลิตร'];

// ─── Component ────────────────────────────────────────────────────────────────
export const AddProductScreen: React.FC<AddProductScreenProps> = ({
  onBack,
  onNavigate,
  onSaved,
}) => {
  const [form, setForm] = useState<ProductForm>({
    code: generateCode(),
    barcode: '',
    name: '',
    category: '',
    brand: '',
    unit: '',
    costPrice: '',
    sellingPrice: '',
    vatEnabled: true,
    vatRate: 7,
    initialStock: '0',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const set = (key: keyof ProductForm, value: string | boolean | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.code.trim())         e.code         = 'กรุณากรอกรหัสสินค้า';
    if (!form.name.trim())         e.name         = 'กรุณากรอกชื่อสินค้า';
    if (!form.category)            e.category     = 'กรุณาเลือกหมวดหมู่';
    if (!form.unit)                e.unit         = 'กรุณาเลือกหน่วย';
    if (!form.costPrice || isNaN(Number(form.costPrice)))
                                    e.costPrice    = 'กรุณากรอกราคาทุนที่ถูกต้อง';
    if (!form.sellingPrice || isNaN(Number(form.sellingPrice)))
                                    e.sellingPrice = 'กรุณากรอกราคาขายที่ถูกต้อง';
    if (isNaN(Number(form.initialStock)))
                                    e.initialStock = 'กรุณากรอกจำนวนสต๊อกที่ถูกต้อง';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (andNew = false) => {
    if (!validate()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    Alert.alert('บันทึกสำเร็จ', `เพิ่มสินค้า "${form.name}" แล้ว`, [
      {
        text: 'ตกลง',
        onPress: () => {
          if (andNew) {
            setForm({ code: generateCode(), barcode: '', name: '', category: '', brand: '', unit: '', costPrice: '', sellingPrice: '', vatEnabled: true, vatRate: 7, initialStock: '0' });
            setErrors({});
          } else {
            onSaved?.();
            onBack?.();
          }
        },
      },
    ]);
  };

  const margin = form.costPrice && form.sellingPrice
    ? (Number(form.sellingPrice) - Number(form.costPrice)).toFixed(2)
    : '-';
  const marginPct = form.costPrice && form.sellingPrice && Number(form.costPrice) > 0
    ? (((Number(form.sellingPrice) - Number(form.costPrice)) / Number(form.costPrice)) * 100).toFixed(1)
    : '-';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>เพิ่มสินค้าใหม่</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Image Picker */}
        <Card padding="md" style={styles.imageCard}>
          <TouchableOpacity style={styles.imagePicker}>
            <Ionicons name="camera-outline" size={32} color={Colors.gray400} />
            <Text style={styles.imagePickerText}>แตะเพื่อเลือกรูปภาพ</Text>
            <Text style={styles.imagePickerSub}>JPG, PNG ขนาดไม่เกิน 5MB</Text>
          </TouchableOpacity>
        </Card>

        {/* Basic Info */}
        <Card padding="md" style={styles.section}>
          <Text style={styles.sectionTitle}>ข้อมูลพื้นฐาน</Text>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Input
                label="รหัสสินค้า *"
                value={form.code}
                onChangeText={(v) => set('code', v)}
                error={errors.code}
                rightIcon="refresh-outline"
                onRightIconPress={() => set('code', generateCode())}
                placeholder="P000000"
              />
            </View>
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() => onNavigate?.('BarcodeScanner')}
            >
              <Ionicons name="barcode-outline" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Input
            label="บาร์โค้ด"
            value={form.barcode}
            onChangeText={(v) => set('barcode', v)}
            placeholder="สแกนหรือกรอกบาร์โค้ด"
            rightIcon="scan-outline"
          />
          <Input
            label="ชื่อสินค้า *"
            value={form.name}
            onChangeText={(v) => set('name', v)}
            error={errors.name}
            placeholder="กรอกชื่อสินค้า"
          />
          <Input
            label="Brand"
            value={form.brand}
            onChangeText={(v) => set('brand', v)}
            placeholder="ระบุยี่ห้อ (ถ้ามี)"
          />

          {/* Category Picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>หมวดหมู่ *</Text>
            <TouchableOpacity
              style={[styles.pickerBtn, errors.category ? styles.pickerError : null]}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={form.category ? styles.pickerValue : styles.pickerPlaceholder}>
                {form.category || 'เลือกหมวดหมู่'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={Colors.gray400} />
            </TouchableOpacity>
            {errors.category && <Text style={styles.fieldError}>{errors.category}</Text>}
            {showCategoryPicker && (
              <View style={styles.pickerOptions}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.pickerOption, form.category === c && styles.pickerOptionActive]}
                    onPress={() => { set('category', c); setShowCategoryPicker(false); }}
                  >
                    <Text style={[styles.pickerOptionText, form.category === c && styles.pickerOptionTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Unit Picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>หน่วย *</Text>
            <TouchableOpacity
              style={[styles.pickerBtn, errors.unit ? styles.pickerError : null]}
              onPress={() => setShowUnitPicker(!showUnitPicker)}
            >
              <Text style={form.unit ? styles.pickerValue : styles.pickerPlaceholder}>
                {form.unit || 'เลือกหน่วย'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={Colors.gray400} />
            </TouchableOpacity>
            {errors.unit && <Text style={styles.fieldError}>{errors.unit}</Text>}
            {showUnitPicker && (
              <View style={styles.pickerOptions}>
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.pickerOption, form.unit === u && styles.pickerOptionActive]}
                    onPress={() => { set('unit', u); setShowUnitPicker(false); }}
                  >
                    <Text style={[styles.pickerOptionText, form.unit === u && styles.pickerOptionTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Card>

        {/* Pricing */}
        <Card padding="md" style={styles.section}>
          <Text style={styles.sectionTitle}>ราคา</Text>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Input
                label="ราคาทุน *"
                value={form.costPrice}
                onChangeText={(v) => set('costPrice', v)}
                error={errors.costPrice}
                keyboardType="decimal-pad"
                placeholder="0.00"
                leftIcon="cash-outline"
              />
            </View>
            <View style={styles.flex1}>
              <Input
                label="ราคาขาย *"
                value={form.sellingPrice}
                onChangeText={(v) => set('sellingPrice', v)}
                error={errors.sellingPrice}
                keyboardType="decimal-pad"
                placeholder="0.00"
                leftIcon="pricetag-outline"
              />
            </View>
          </View>

          {/* Margin preview */}
          {form.costPrice && form.sellingPrice && (
            <View style={styles.marginRow}>
              <Text style={styles.marginLabel}>กำไร: </Text>
              <Text style={[styles.marginValue, { color: Number(margin) >= 0 ? Colors.success : Colors.danger }]}>
                ฿{margin} ({marginPct}%)
              </Text>
            </View>
          )}

          {/* VAT */}
          <View style={styles.vatRow}>
            <View style={styles.flex1}>
              <Text style={styles.fieldLabel}>ภาษีมูลค่าเพิ่ม</Text>
              <Text style={styles.vatSub}>เปิดใช้งาน VAT</Text>
            </View>
            <Switch
              value={form.vatEnabled}
              onValueChange={(v) => set('vatEnabled', v)}
              trackColor={{ false: Colors.gray300, true: Colors.primaryLight }}
              thumbColor={form.vatEnabled ? Colors.primary : Colors.white}
            />
          </View>
          {form.vatEnabled && (
            <View style={styles.vatRateRow}>
              {([0, 7] as const).map((rate) => (
                <TouchableOpacity
                  key={rate}
                  style={[styles.vatRateBtn, form.vatRate === rate && styles.vatRateBtnActive]}
                  onPress={() => set('vatRate', rate)}
                >
                  <Text style={[styles.vatRateBtnText, form.vatRate === rate && styles.vatRateBtnTextActive]}>
                    {rate}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        {/* Stock */}
        <Card padding="md" style={styles.section}>
          <Text style={styles.sectionTitle}>สต๊อกเริ่มต้น</Text>
          <Input
            label="จำนวนเริ่มต้น *"
            value={form.initialStock}
            onChangeText={(v) => set('initialStock', v)}
            error={errors.initialStock}
            keyboardType="number-pad"
            placeholder="0"
            leftIcon="archive-outline"
          />
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="บันทึก"
            onPress={() => handleSave(false)}
            variant="primary"
            size="lg"
            loading={saving}
            fullWidth
          />
          <Button
            title="บันทึกและเพิ่มต่อ"
            onPress={() => handleSave(true)}
            variant="outline"
            size="lg"
            disabled={saving}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { ...Typography.h4, color: Colors.white, flex: 1, textAlign: 'center' },
  scroll: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  imageCard: {},
  imagePicker: {
    height: 120,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  imagePickerText: { ...Typography.label, color: Colors.gray500 },
  imagePickerSub: { ...Typography.caption, color: Colors.gray400 },
  section: {},
  sectionTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  flex1: { flex: 1 },
  scanBtn: {
    width: 50,
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  fieldGroup: { marginBottom: Spacing.md },
  fieldLabel: { ...Typography.label, color: Colors.gray700, marginBottom: Spacing.xs },
  fieldError: { ...Typography.caption, color: Colors.danger, marginTop: Spacing.xs },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 50,
    paddingVertical: Spacing.sm,
  },
  pickerError: { borderColor: Colors.danger },
  pickerValue: { ...Typography.body1, color: Colors.text },
  pickerPlaceholder: { ...Typography.body1, color: Colors.gray400 },
  pickerOptions: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  pickerOption: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  pickerOptionActive: { backgroundColor: Colors.primaryLight },
  pickerOptionText: { ...Typography.body2, color: Colors.text },
  pickerOptionTextActive: { color: Colors.primary, fontWeight: '600' },
  marginRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, paddingTop: Spacing.xs },
  marginLabel: { ...Typography.label, color: Colors.textSecondary },
  marginValue: { ...Typography.label, fontWeight: '700' },
  vatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
  },
  vatSub: { ...Typography.caption, color: Colors.textSecondary },
  vatRateRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  vatRateBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  vatRateBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  vatRateBtnText: { ...Typography.label, color: Colors.gray600 },
  vatRateBtnTextActive: { color: Colors.white },
  actions: { gap: Spacing.sm, paddingBottom: Spacing.lg },
});
