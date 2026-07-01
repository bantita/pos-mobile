/**
 * SCR-SALE-004 — Discount Screen (ส่วนลด)
 * FR-SALE-004: ส่วนลดท้ายบิลหรือรายสินค้า ตรวจสิทธิ์ตาม Role
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/cartStore';
import { Discount } from '../../types/sale';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency } from '../../utils/format';

// Role config — ในระบบจริงดึงจาก auth store
const MAX_DISCOUNT_PERCENT = 20; // Cashier ลดได้สูงสุด 20%
const MAX_DISCOUNT_AMOUNT = 500; // Cashier ลดได้สูงสุด 500 บาท
const REQUIRE_APPROVAL_ABOVE = 15; // เกิน 15% ต้องขออนุมัติ

interface DiscountScreenProps {
  onBack: () => void;
  onApplied: () => void;
  userRole?: 'cashier' | 'manager' | 'owner';
}

type DiscountType = 'percent' | 'amount';

const QUICK_PERCENT = [5, 10, 15, 20];
const QUICK_AMOUNT = [50, 100, 200, 500];
const REASONS = ['ลูกค้าประจำ', 'โปรโมชั่น', 'สินค้าเสียหาย', 'อื่นๆ'];

export const DiscountScreen: React.FC<DiscountScreenProps> = ({
  onBack,
  onApplied,
  userRole = 'cashier',
}) => {
  const { getSubtotal, setDiscount, discount } = useCartStore();
  const subtotal = getSubtotal();

  const [type, setType] = useState<DiscountType>(discount?.type ?? 'percent');
  const [value, setValue] = useState(discount ? String(discount.value) : '');
  const [reason, setReason] = useState(discount?.reason ?? '');
  const [requireApproval, setRequireApproval] = useState(false);
  const [approvalCode, setApprovalCode] = useState('');

  const numValue = parseFloat(value) || 0;
  const discountAmount = type === 'percent' ? subtotal * (numValue / 100) : numValue;
  const discountPercent = type === 'amount' ? (numValue / subtotal) * 100 : numValue;
  const afterDiscount = Math.max(0, subtotal - discountAmount);

  const needsApproval = userRole === 'cashier' && discountPercent > REQUIRE_APPROVAL_ABOVE;
  const exceedsLimit =
    (type === 'percent' && numValue > MAX_DISCOUNT_PERCENT) ||
    (type === 'amount' && numValue > MAX_DISCOUNT_AMOUNT);

  const handleApply = () => {
    if (numValue <= 0) { Alert.alert('ข้อผิดพลาด', 'กรุณากรอกจำนวนส่วนลด'); return; }
    if (exceedsLimit && userRole === 'cashier') {
      Alert.alert('เกินสิทธิ์', `Cashier ลดได้สูงสุด ${type === 'percent' ? MAX_DISCOUNT_PERCENT + '%' : '฿' + MAX_DISCOUNT_AMOUNT}`);
      return;
    }
    if (needsApproval && !approvalCode) {
      setRequireApproval(true);
      return;
    }
    if (!reason) { Alert.alert('กรุณาระบุเหตุผล'); return; }
    const d: Discount = { type, value: numValue, reason, approvedBy: approvalCode || undefined };
    setDiscount(d);
    onApplied();
  };

  const handleRemove = () => {
    setDiscount(null);
    onApplied();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ส่วนลดท้ายบิล</Text>
        {discount && (
          <TouchableOpacity onPress={handleRemove} style={styles.removeBtn}>
            <Text style={styles.removeBtnText}>ลบส่วนลด</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {/* Type Toggle */}
        <View style={styles.typeToggle}>
          {[
            { key: 'percent', label: 'ลด %' },
            { key: 'amount', label: 'ลดจำนวนเงิน' },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.typeBtn, type === t.key && styles.typeBtnActive]}
              onPress={() => { setType(t.key as DiscountType); setValue(''); }}
            >
              <Text style={[styles.typeBtnText, type === t.key && styles.typeBtnTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Value Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>
            {type === 'percent' ? 'จำนวนส่วนลด (%)' : 'จำนวนเงินส่วนลด (฿)'}
          </Text>
          <View style={styles.inputRow}>
            <Text style={styles.inputPrefix}>{type === 'percent' ? '%' : '฿'}</Text>
            <TextInput
              style={styles.valueInput}
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={Colors.gray300}
              maxLength={type === 'percent' ? 3 : 6}
            />
          </View>
          {exceedsLimit && userRole === 'cashier' && (
            <Text style={styles.limitWarn}>
              <Ionicons name="warning-outline" size={12} /> เกินสิทธิ์ที่กำหนด (สูงสุด {type === 'percent' ? MAX_DISCOUNT_PERCENT + '%' : '฿' + MAX_DISCOUNT_AMOUNT})
            </Text>
          )}
        </View>

        {/* Quick Select */}
        <Text style={styles.quickLabel}>เลือกด่วน</Text>
        <View style={styles.quickRow}>
          {(type === 'percent' ? QUICK_PERCENT : QUICK_AMOUNT).map((q) => (
            <TouchableOpacity
              key={q}
              style={[styles.quickBtn, numValue === q && styles.quickBtnActive]}
              onPress={() => setValue(String(q))}
            >
              <Text style={[styles.quickBtnText, numValue === q && styles.quickBtnTextActive]}>
                {type === 'percent' ? `${q}%` : `฿${q}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reason */}
        <Text style={styles.sectionLabel}>เหตุผล *</Text>
        <View style={styles.reasonRow}>
          {REASONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.reasonChip, reason === r && styles.reasonChipActive]}
              onPress={() => setReason(r)}
            >
              <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Approval Code */}
        {requireApproval && (
          <View style={styles.approvalBox}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.approvalTitle}>ต้องการอนุมัติจาก Manager</Text>
              <Text style={styles.approvalSub}>ส่วนลดเกิน {REQUIRE_APPROVAL_ABOVE}% ต้องขออนุมัติ</Text>
            </View>
            <TextInput
              style={styles.approvalInput}
              placeholder="รหัสอนุมัติ"
              placeholderTextColor={Colors.gray400}
              value={approvalCode}
              onChangeText={setApprovalCode}
              secureTextEntry
            />
          </View>
        )}

        {/* Preview */}
        {numValue > 0 && (
          <View style={styles.previewBox}>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>ยอดก่อนลด</Text>
              <Text style={styles.previewValue}>฿{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>ส่วนลด</Text>
              <Text style={styles.previewDiscount}>-฿{formatCurrency(discountAmount)}</Text>
            </View>
            <View style={[styles.previewRow, styles.previewTotal]}>
              <Text style={styles.previewTotalLabel}>ยอดหลังลด</Text>
              <Text style={styles.previewTotalValue}>฿{formatCurrency(afterDiscount)}</Text>
            </View>
          </View>
        )}

        {/* Apply Button */}
        <TouchableOpacity
          style={[styles.applyBtn, (numValue <= 0 || !reason) && styles.applyBtnDisabled]}
          onPress={handleApply}
          disabled={numValue <= 0 || !reason}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
          <Text style={styles.applyBtnText}>ใช้ส่วนลด</Text>
        </TouchableOpacity>
      </View>
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
  removeBtn: {
    backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
  },
  removeBtnText: { ...Typography.caption, color: Colors.danger, fontWeight: '600' },
  content: { flex: 1, padding: Spacing.lg, gap: Spacing.md },
  typeToggle: {
    flexDirection: 'row', backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md, padding: 4,
  },
  typeBtn: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.sm - 2 },
  typeBtnActive: { backgroundColor: Colors.surface, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  typeBtnText: { ...Typography.label, color: Colors.textSecondary },
  typeBtnTextActive: { color: Colors.primary, fontWeight: '700' },
  inputSection: { gap: Spacing.xs },
  inputLabel: { ...Typography.label, color: Colors.textSecondary },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 2, borderColor: Colors.primary, paddingHorizontal: Spacing.md,
  },
  inputPrefix: { ...Typography.h3, color: Colors.primary, marginRight: Spacing.sm },
  valueInput: { flex: 1, ...Typography.h2, color: Colors.text, paddingVertical: Spacing.md },
  limitWarn: { ...Typography.caption, color: Colors.danger },
  quickLabel: { ...Typography.label, color: Colors.textSecondary },
  quickRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  quickBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  quickBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  quickBtnText: { ...Typography.label, color: Colors.text },
  quickBtnTextActive: { color: Colors.primary },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary },
  reasonRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  reasonChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full, backgroundColor: Colors.gray100,
    borderWidth: 1, borderColor: Colors.border,
  },
  reasonChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  reasonText: { ...Typography.body2, color: Colors.textSecondary },
  reasonTextActive: { color: Colors.white },
  approvalBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.warningLight, borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  approvalTitle: { ...Typography.label, color: Colors.warning },
  approvalSub: { ...Typography.caption, color: Colors.warning },
  approvalInput: {
    width: 100, height: 40, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm,
    borderWidth: 1, borderColor: Colors.warning, textAlign: 'center',
  },
  previewBox: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.md,
    padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  previewLabel: { ...Typography.body2, color: Colors.textSecondary },
  previewValue: { ...Typography.body2, color: Colors.text },
  previewDiscount: { ...Typography.body2, color: Colors.danger, fontWeight: '600' },
  previewTotal: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingTop: Spacing.sm, marginTop: Spacing.xs,
  },
  previewTotalLabel: { ...Typography.label, color: Colors.text },
  previewTotalValue: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md,
  },
  applyBtnDisabled: { backgroundColor: Colors.gray300 },
  applyBtnText: { ...Typography.button, color: Colors.white },
});
