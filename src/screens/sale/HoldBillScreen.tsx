/**
 * SCR-SALE-005 — Hold Bill / Recall Bill Screen
 * FR-SALE-005: พักรายการขายไว้ก่อน และเรียกบิลกลับมาขายต่อ
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/cartStore';
import { HoldBill } from '../../types/sale';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency, formatDateTime } from '../../utils/format';

interface HoldBillScreenProps {
  onBack: () => void;
  onRecalled: () => void;
}

export const HoldBillScreen: React.FC<HoldBillScreenProps> = ({ onBack, onRecalled }) => {
  const { items, holdBills, holdBill, recallBill, deleteHoldBill, getGrandTotal } = useCartStore();
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [customerRef, setCustomerRef] = useState('');
  const [remark, setRemark] = useState('');

  const handleHold = () => {
    if (items.length === 0) { Alert.alert('ไม่มีสินค้าในบิล'); return; }
    holdBill(customerRef, remark);
    setShowHoldModal(false);
    setCustomerRef('');
    setRemark('');
  };

  const handleRecall = (id: string) => {
    if (items.length > 0) {
      Alert.alert('มีบิลค้างอยู่', 'บิลปัจจุบันจะถูกแทนที่ด้วยบิลที่เรียกคืน', [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'เรียกคืน', onPress: () => { recallBill(id); onRecalled(); } },
      ]);
    } else {
      recallBill(id);
      onRecalled();
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('ลบบิลพัก', 'ต้องการลบบิลพักนี้?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => deleteHoldBill(id) },
    ]);
  };

  const renderHoldBill = ({ item }: { item: HoldBill }) => {
    const total = item.items.reduce((s, i) => s + i.subtotal, 0);
    const itemCount = item.items.reduce((s, i) => s + i.qty, 0);

    return (
      <View style={styles.billCard}>
        <View style={styles.billHeader}>
          <View style={styles.billIcon}>
            <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.billRef}>{item.customerRef || 'ไม่ระบุชื่อ'}</Text>
            <Text style={styles.billTime}>{formatDateTime(item.heldAt)}</Text>
          </View>
          <View style={styles.billAmountBox}>
            <Text style={styles.billAmount}>฿{formatCurrency(total)}</Text>
            <Text style={styles.billItems}>{itemCount} รายการ</Text>
          </View>
        </View>

        {item.remark ? (
          <Text style={styles.billRemark}>หมายเหตุ: {item.remark}</Text>
        ) : null}

        <View style={styles.billItemPreview}>
          {item.items.slice(0, 3).map((ci, idx) => (
            <Text key={idx} style={styles.billItemText} numberOfLines={1}>
              • {ci.product.name} x{ci.qty}
            </Text>
          ))}
          {item.items.length > 3 && (
            <Text style={styles.billItemMore}>และอีก {item.items.length - 3} รายการ...</Text>
          )}
        </View>

        <View style={styles.billActions}>
          <TouchableOpacity
            style={styles.recallBtn}
            onPress={() => handleRecall(item.id)}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh-outline" size={16} color={Colors.white} />
            <Text style={styles.recallBtnText}>เรียกบิลคืน</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={16} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>บิลพัก ({holdBills.length})</Text>
        {items.length > 0 && (
          <TouchableOpacity style={styles.holdBtn} onPress={() => setShowHoldModal(true)}>
            <Ionicons name="pause-circle-outline" size={18} color={Colors.white} />
            <Text style={styles.holdBtnText}>พักบิลนี้</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Current Bill Banner */}
      {items.length > 0 && (
        <View style={styles.currentBill}>
          <Ionicons name="cart-outline" size={18} color={Colors.primary} />
          <Text style={styles.currentBillText}>
            บิลปัจจุบัน: {items.length} รายการ · ฿{formatCurrency(getGrandTotal())}
          </Text>
        </View>
      )}

      {/* Hold Bills List */}
      {holdBills.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="pause-circle-outline" size={72} color={Colors.gray300} />
          <Text style={styles.emptyTitle}>ไม่มีบิลพัก</Text>
          <Text style={styles.emptySubtitle}>กด "พักบิลนี้" เพื่อบันทึกบิลปัจจุบัน</Text>
        </View>
      ) : (
        <FlatList
          data={holdBills}
          keyExtractor={(item) => item.id}
          renderItem={renderHoldBill}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Hold Modal */}
      <Modal visible={showHoldModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>พักบิล</Text>
            <Text style={styles.modalSub}>บันทึกบิลปัจจุบันไว้ก่อน เพื่อเปิดบิลใหม่</Text>

            <Text style={styles.fieldLabel}>ชื่อลูกค้า / อ้างอิง (ไม่บังคับ)</Text>
            <TextInput
              style={styles.textField}
              placeholder="เช่น คุณสมชาย, โต๊ะ 3"
              placeholderTextColor={Colors.gray400}
              value={customerRef}
              onChangeText={setCustomerRef}
            />
            <Text style={styles.fieldLabel}>หมายเหตุ (ไม่บังคับ)</Text>
            <TextInput
              style={[styles.textField, { height: 80, textAlignVertical: 'top' }]}
              placeholder="เช่น รอเครื่องดื่มเพิ่ม"
              placeholderTextColor={Colors.gray400}
              value={remark}
              onChangeText={setRemark}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setShowHoldModal(false)}
              >
                <Text style={styles.cancelModalText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmHoldBtn} onPress={handleHold} activeOpacity={0.85}>
                <Ionicons name="pause-circle" size={18} color={Colors.white} />
                <Text style={styles.confirmHoldText}>พักบิล</Text>
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
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white, flex: 1, marginLeft: Spacing.sm },
  holdBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
  },
  holdBtnText: { ...Typography.caption, color: Colors.white, fontWeight: '600' },
  currentBill: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  currentBillText: { ...Typography.body2, color: Colors.primary, fontWeight: '500' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyTitle: { ...Typography.h3, color: Colors.gray400 },
  emptySubtitle: { ...Typography.body2, color: Colors.gray300 },
  list: { padding: Spacing.md, gap: Spacing.md },
  billCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.sm,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  billHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  billIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  billRef: { ...Typography.label, color: Colors.text },
  billTime: { ...Typography.caption, color: Colors.textSecondary },
  billAmountBox: { alignItems: 'flex-end' },
  billAmount: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
  billItems: { ...Typography.caption, color: Colors.textSecondary },
  billRemark: { ...Typography.caption, color: Colors.textDisabled, fontStyle: 'italic' },
  billItemPreview: { backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.sm, padding: Spacing.sm, gap: 2 },
  billItemText: { ...Typography.caption, color: Colors.textSecondary },
  billItemMore: { ...Typography.caption, color: Colors.gray400, fontStyle: 'italic' },
  billActions: { flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.xs },
  recallBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.sm,
  },
  recallBtnText: { ...Typography.label, color: Colors.white },
  deleteBtn: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: Colors.dangerLight, alignItems: 'center', justifyContent: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg, gap: Spacing.md,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: Colors.gray200,
    borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xs,
  },
  modalTitle: { ...Typography.h3, color: Colors.text },
  modalSub: { ...Typography.body2, color: Colors.textSecondary, marginTop: -Spacing.sm },
  fieldLabel: { ...Typography.label, color: Colors.textSecondary },
  textField: {
    backgroundColor: Colors.gray100, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    ...Typography.body1, color: Colors.text,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  cancelModalBtn: {
    flex: 1, paddingVertical: Spacing.md, alignItems: 'center',
    borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border,
  },
  cancelModalText: { ...Typography.button, color: Colors.textSecondary },
  confirmHoldBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md,
  },
  confirmHoldText: { ...Typography.button, color: Colors.white },
});
