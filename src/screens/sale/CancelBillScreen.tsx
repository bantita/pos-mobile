/**
 * Cancel Bill Screen — ยกเลิกบิล
 * ตรวจสิทธิ์ตาม Role, กรอกเหตุผล, บันทึก Audit Log
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/cartStore';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency, formatDateTime } from '../../utils/format';

interface CancelBillScreenProps {
  onBack: () => void;
  onCancelled: () => void;
  saleNo?: string;               // ถ้ามี = ยกเลิกบิลที่ขายแล้ว (Void)
  userRole?: 'cashier' | 'manager' | 'owner';
  cashierName?: string;
}

type CancelType = 'current' | 'void';

const CANCEL_REASONS = [
  'ลูกค้าเปลี่ยนใจ',
  'สินค้าไม่ครบ / ไม่มีสต๊อก',
  'ราคาไม่ถูกต้อง',
  'ชำระเงินผิดพลาด',
  'ทดสอบระบบ',
  'อื่นๆ',
];

export const CancelBillScreen: React.FC<CancelBillScreenProps> = ({
  onBack,
  onCancelled,
  saleNo,
  userRole = 'cashier',
  cashierName = 'พนักงาน',
}) => {
  const { items, discount, getGrandTotal, clearCart, getItemCount } = useCartStore();
  const cancelType: CancelType = saleNo ? 'void' : 'current';

  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [approvalCode, setApprovalCode] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const grandTotal = getGrandTotal();
  const itemCount = getItemCount();
  const now = new Date();

  const finalReason = selectedReason === 'อื่นๆ' ? customReason : selectedReason;
  const needsApproval = userRole === 'cashier' && cancelType === 'void';
  const canCancel = finalReason.trim().length > 0;

  const handleCancel = () => {
    if (!canCancel) {
      Alert.alert('กรุณาระบุเหตุผล', 'ต้องระบุเหตุผลในการยกเลิกบิล');
      return;
    }
    if (needsApproval && !approvalCode.trim()) {
      setShowApprovalModal(true);
      return;
    }
    confirmCancel();
  };

  const confirmCancel = () => {
    Alert.alert(
      cancelType === 'void' ? `ยืนยันยกเลิกบิล ${saleNo}` : 'ยืนยันยกเลิกบิลปัจจุบัน',
      `เหตุผล: ${finalReason}\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`,
      [
        { text: 'ไม่ยกเลิก', style: 'cancel' },
        {
          text: 'ยืนยันยกเลิก',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            // Simulate API + Audit Log
            setTimeout(() => {
              // Audit Log Entry
              console.log(`[AUDIT] CANCEL_BILL - Type: ${cancelType}, SaleNo: ${saleNo ?? 'CURRENT'}, Reason: ${finalReason}, By: ${cashierName}, ApprovalCode: ${approvalCode || '-'}, At: ${formatDateTime(now)}`);
              clearCart();
              setLoading(false);
              setCancelled(true);
            }, 1000);
          },
        },
      ]
    );
  };

  // --- Success State ---
  if (cancelled) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successScreen}>
          <View style={styles.successIcon}>
            <Ionicons name="close-circle" size={72} color={Colors.danger} />
          </View>
          <Text style={styles.successTitle}>ยกเลิกบิลสำเร็จ</Text>
          {saleNo && <Text style={styles.successSaleNo}>บิล {saleNo}</Text>}
          <View style={styles.auditBox}>
            <Text style={styles.auditTitle}>
              <Ionicons name="document-text-outline" size={14} /> บันทึก Audit Log แล้ว
            </Text>
            {[
              { label: 'เหตุผล', value: finalReason },
              { label: 'โดย', value: cashierName },
              { label: 'เวลา', value: formatDateTime(now) },
              ...(approvalCode ? [{ label: 'อนุมัติโดย', value: `รหัส ${approvalCode}` }] : []),
            ].map((row, i) => (
              <View key={i} style={styles.auditRow}>
                <Text style={styles.auditLabel}>{row.label}:</Text>
                <Text style={styles.auditValue}>{row.value}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.doneBtn} onPress={onCancelled} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>กลับหน้าขาย</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {cancelType === 'void' ? `ยกเลิกบิล ${saleNo}` : 'ยกเลิกบิลปัจจุบัน'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={24} color={Colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={styles.warningTitle}>
              {cancelType === 'void' ? 'ยกเลิกบิลที่ขายแล้ว (Void)' : 'ยกเลิกบิลปัจจุบัน'}
            </Text>
            <Text style={styles.warningSubtitle}>การดำเนินการนี้ไม่สามารถย้อนกลับได้</Text>
          </View>
        </View>

        {/* Bill Summary */}
        <View style={styles.billSummaryCard}>
          <Text style={styles.cardTitle}>สรุปบิล</Text>
          {saleNo && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>เลขที่บิล</Text>
              <Text style={styles.summaryValueBold}>{saleNo}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>จำนวนรายการ</Text>
            <Text style={styles.summaryValue}>{itemCount} รายการ</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ยอดรวม</Text>
            <Text style={[styles.summaryValueBold, { color: Colors.danger }]}>฿{formatCurrency(grandTotal)}</Text>
          </View>

          {/* Item list preview */}
          {items.length > 0 && (
            <View style={styles.itemPreview}>
              {items.slice(0, 4).map((item, i) => (
                <View key={i} style={styles.previewRow}>
                  <Text style={styles.previewName} numberOfLines={1}>{item.product.name}</Text>
                  <Text style={styles.previewQty}>×{item.qty}</Text>
                  <Text style={styles.previewPrice}>฿{formatCurrency(item.subtotal)}</Text>
                </View>
              ))}
              {items.length > 4 && (
                <Text style={styles.previewMore}>และอีก {items.length - 4} รายการ...</Text>
              )}
            </View>
          )}
        </View>

        {/* Reason Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            เหตุผลการยกเลิก <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.reasonGrid}>
            {CANCEL_REASONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.reasonChip, selectedReason === r && styles.reasonChipActive]}
                onPress={() => setSelectedReason(r)}
                activeOpacity={0.8}
              >
                {selectedReason === r && (
                  <Ionicons name="checkmark-circle" size={14} color={Colors.white} />
                )}
                <Text style={[styles.reasonText, selectedReason === r && styles.reasonTextActive]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedReason === 'อื่นๆ' && (
            <TextInput
              style={styles.customReasonInput}
              placeholder="ระบุเหตุผล..."
              placeholderTextColor={Colors.gray400}
              value={customReason}
              onChangeText={setCustomReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          )}
        </View>

        {/* Approval required notice */}
        {needsApproval && (
          <View style={styles.approvalNotice}>
            <Ionicons name="shield-outline" size={18} color={Colors.warning} />
            <Text style={styles.approvalNoticeText}>
              การยกเลิกบิลที่ขายแล้วต้องได้รับอนุมัติจาก Manager
            </Text>
          </View>
        )}

        {/* Cancel Button */}
        <TouchableOpacity
          style={[styles.cancelBtn, (!canCancel || loading) && styles.cancelBtnDisabled]}
          onPress={handleCancel}
          disabled={!canCancel || loading}
          activeOpacity={0.85}
        >
          <Ionicons
            name={loading ? 'hourglass-outline' : 'close-circle-outline'}
            size={22}
            color={Colors.white}
          />
          <Text style={styles.cancelBtnText}>
            {loading ? 'กำลังยกเลิก...' : cancelType === 'void' ? 'ยกเลิกบิลนี้' : 'ยกเลิกบิลปัจจุบัน'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.goBackBtn} onPress={onBack}>
          <Text style={styles.goBackText}>ย้อนกลับ ไม่ยกเลิก</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Approval Modal */}
      <Modal visible={showApprovalModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Ionicons name="shield-checkmark-outline" size={28} color={Colors.warning} />
              <Text style={styles.modalTitle}>ขออนุมัติจาก Manager</Text>
            </View>
            <Text style={styles.modalSub}>
              กรุณาให้ Manager กรอกรหัสอนุมัติเพื่อยืนยันการยกเลิกบิล
            </Text>

            <Text style={styles.fieldLabel}>รหัสอนุมัติ</Text>
            <TextInput
              style={styles.approvalInput}
              placeholder="กรอกรหัสอนุมัติ"
              placeholderTextColor={Colors.gray400}
              value={approvalCode}
              onChangeText={setApprovalCode}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={8}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowApprovalModal(false)}
              >
                <Text style={styles.modalCancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, !approvalCode && styles.modalConfirmBtnDisabled]}
                onPress={() => {
                  if (!approvalCode.trim()) return;
                  setShowApprovalModal(false);
                  confirmCancel();
                }}
                disabled={!approvalCode}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
                <Text style={styles.modalConfirmText}>ยืนยัน</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.danger, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  scroll: { padding: Spacing.md, gap: Spacing.md },

  warningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderLeftWidth: 4, borderLeftColor: Colors.danger,
  },
  warningTitle: { ...Typography.label, color: Colors.danger },
  warningSubtitle: { ...Typography.caption, color: Colors.danger, opacity: 0.8 },

  billSummaryCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.sm,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  cardTitle: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { ...Typography.body2, color: Colors.textSecondary },
  summaryValue: { ...Typography.body2, color: Colors.text },
  summaryValueBold: { ...Typography.body2, color: Colors.text, fontWeight: '700' },
  itemPreview: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.sm,
    padding: Spacing.sm, marginTop: Spacing.xs, gap: 4,
  },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  previewName: { ...Typography.caption, color: Colors.text, flex: 1 },
  previewQty: { ...Typography.caption, color: Colors.textSecondary, width: 28, textAlign: 'right' },
  previewPrice: { ...Typography.caption, color: Colors.text, fontWeight: '600', width: 70, textAlign: 'right' },
  previewMore: { ...Typography.caption, color: Colors.gray400, fontStyle: 'italic' },

  section: { gap: Spacing.sm },
  sectionTitle: { ...Typography.label, color: Colors.textSecondary },
  required: { color: Colors.danger },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  reasonChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  reasonChipActive: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  reasonText: { ...Typography.body2, color: Colors.text },
  reasonTextActive: { color: Colors.white, fontWeight: '600' },
  customReasonInput: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    ...Typography.body1, color: Colors.text, marginTop: Spacing.xs,
    minHeight: 80,
  },

  approvalNotice: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.warningLight, borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  approvalNoticeText: { ...Typography.body2, color: Colors.warning, flex: 1 },

  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.danger,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md,
  },
  cancelBtnDisabled: { backgroundColor: Colors.gray300 },
  cancelBtnText: { ...Typography.button, color: Colors.white },
  goBackBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  goBackText: { ...Typography.body2, color: Colors.textSecondary },

  // Success
  successScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xl, gap: Spacing.lg,
  },
  successIcon: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.dangerLight, alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { ...Typography.h2, color: Colors.danger },
  successSaleNo: { ...Typography.body1, color: Colors.textSecondary },
  auditBox: {
    width: '100%', backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.xs,
    borderWidth: 1, borderColor: Colors.border,
  },
  auditTitle: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs },
  auditRow: { flexDirection: 'row', gap: Spacing.sm },
  auditLabel: { ...Typography.body2, color: Colors.textSecondary, width: 80 },
  auditValue: { ...Typography.body2, color: Colors.text, fontWeight: '500', flex: 1 },
  doneBtn: {
    width: '100%', backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  doneBtnText: { ...Typography.button, color: Colors.white },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg, gap: Spacing.md,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: Colors.gray200,
    borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xs,
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  modalTitle: { ...Typography.h4, color: Colors.text },
  modalSub: { ...Typography.body2, color: Colors.textSecondary },
  fieldLabel: { ...Typography.label, color: Colors.textSecondary },
  approvalInput: {
    backgroundColor: Colors.gray100, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    ...Typography.body1, color: Colors.text, letterSpacing: 4, textAlign: 'center',
  },
  modalActions: { flexDirection: 'row', gap: Spacing.sm },
  modalCancelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border,
  },
  modalCancelText: { ...Typography.button, color: Colors.textSecondary },
  modalConfirmBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, backgroundColor: Colors.danger,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md,
  },
  modalConfirmBtnDisabled: { backgroundColor: Colors.gray300 },
  modalConfirmText: { ...Typography.button, color: Colors.white },
});
