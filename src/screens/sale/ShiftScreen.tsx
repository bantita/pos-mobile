/**
 * ShiftScreen — เปิดกะ / ปิดกะ / เงินเข้า-ออกระหว่างวัน
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { useShiftStore } from '../../store/shiftStore';
import { formatCurrency } from '../../utils/format';

interface ShiftScreenProps {
  onBack: () => void;
  cashierName?: string;
  posName?: string;
}

export const ShiftScreen: React.FC<ShiftScreenProps> = ({
  onBack, cashierName = 'พนักงาน', posName = 'POS 1',
}) => {
  const {
    currentShift, shiftHistory,
    openShift, closeShift, addCashMovement,
    isShiftOpen, getExpectedCash,
  } = useShiftStore();

  const [openAmount, setOpenAmount] = useState('');
  const [closeAmount, setCloseAmount] = useState('');
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashType, setCashType] = useState<'in' | 'out'>('in');
  const [cashAmount, setCashAmount] = useState('');
  const [cashReason, setCashReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleOpenShift = () => {
    const amt = parseFloat(openAmount) || 0;
    openShift({ posId: 'pos1', posName, cashierName, openingAmount: amt });
    setOpenAmount('');
    Alert.alert('เปิดกะสำเร็จ', `เงินเปิดกะ: ฿${formatCurrency(amt)}`);
  };

  const handleCloseShift = () => {
    const amt = parseFloat(closeAmount) || 0;
    const expected = getExpectedCash();
    const diff = amt - expected;
    Alert.alert(
      'ยืนยันปิดกะ',
      `เงินนับได้: ฿${formatCurrency(amt)}\nยอดที่ควรเป็น: ฿${formatCurrency(expected)}\nผลต่าง: ${diff >= 0 ? '+' : ''}฿${formatCurrency(diff)}`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ปิดกะ', onPress: () => { closeShift(amt); setCloseAmount(''); } },
      ]
    );
  };

  const handleCashMovement = () => {
    const amt = parseFloat(cashAmount) || 0;
    if (amt <= 0) { Alert.alert('ข้อผิดพลาด', 'กรุณากรอกจำนวนเงิน'); return; }
    if (!cashReason.trim()) { Alert.alert('ข้อผิดพลาด', 'กรุณากรอกเหตุผล'); return; }
    addCashMovement(cashType, amt, cashReason);
    Alert.alert('สำเร็จ', `${cashType === 'in' ? 'เงินเข้า' : 'เงินออก'} ฿${formatCurrency(amt)}`);
    setCashAmount(''); setCashReason(''); setShowCashModal(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>จัดการกะ</Text>
          <Text style={styles.headerSub}>Shift Management</Text>
        </View>
        <TouchableOpacity onPress={() => setShowHistory(true)}>
          <Ionicons name="time-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* ─── ยังไม่เปิดกะ ── */}
        {!isShiftOpen() && !currentShift && (
          <View style={styles.card}>
            <View style={styles.cardIcon}><Ionicons name="time-outline" size={40} color={Colors.primary} /></View>
            <Text style={styles.cardTitle}>เปิดกะการทำงาน</Text>
            <Text style={styles.cardSub}>กรอกจำนวนเงินเปิดกะ (เงินทอนเริ่มต้น)</Text>
            <TextInput
              style={styles.input}
              value={openAmount}
              onChangeText={setOpenAmount}
              placeholder="0.00"
              placeholderTextColor={Colors.gray400}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleOpenShift}>
              <Ionicons name="play-circle" size={18} color={Colors.white} />
              <Text style={styles.primaryBtnText}>เปิดกะ</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── กะเปิดอยู่ ── */}
        {currentShift && currentShift.status === 'open' && (
          <>
            {/* Summary */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>กะปัจจุบัน</Text>
              <Text style={styles.cardSub}>เปิดเมื่อ {new Date(currentShift.openedAt).toLocaleTimeString('th-TH')} · {currentShift.cashierName}</Text>
              <View style={styles.kpiRow}>
                <View style={styles.kpi}><Text style={styles.kpiVal}>฿{formatCurrency(currentShift.openingAmount)}</Text><Text style={styles.kpiLabel}>เงินเปิดกะ</Text></View>
                <View style={styles.kpi}><Text style={styles.kpiVal}>{currentShift.billCount}</Text><Text style={styles.kpiLabel}>บิล</Text></View>
                <View style={styles.kpi}><Text style={[styles.kpiVal, { color: Colors.success }]}>฿{formatCurrency(currentShift.cashSalesTotal)}</Text><Text style={styles.kpiLabel}>ยอดขาย</Text></View>
                <View style={styles.kpi}><Text style={[styles.kpiVal, { color: Colors.primary }]}>฿{formatCurrency(getExpectedCash())}</Text><Text style={styles.kpiLabel}>เงินในลิ้นชัก</Text></View>
              </View>
            </View>

            {/* Cash In/Out Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.success }]} onPress={() => { setCashType('in'); setShowCashModal(true); }}>
                <Ionicons name="add-circle" size={20} color={Colors.white} />
                <Text style={styles.actionBtnText}>เงินเข้า</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.warning }]} onPress={() => { setCashType('out'); setShowCashModal(true); }}>
                <Ionicons name="remove-circle" size={20} color={Colors.white} />
                <Text style={styles.actionBtnText}>เงินออก</Text>
              </TouchableOpacity>
            </View>

            {/* Cash Movements */}
            {currentShift.movements.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>เงินเข้า-ออกวันนี้</Text>
                {currentShift.movements.map((m) => (
                  <View key={m.id} style={styles.movRow}>
                    <Ionicons name={m.type === 'in' ? 'arrow-down-circle' : 'arrow-up-circle'} size={18} color={m.type === 'in' ? Colors.success : Colors.danger} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.movReason}>{m.reason}</Text>
                      <Text style={styles.movTime}>{new Date(m.createdAt).toLocaleTimeString('th-TH')} · {m.createdBy}</Text>
                    </View>
                    <Text style={[styles.movAmount, { color: m.type === 'in' ? Colors.success : Colors.danger }]}>
                      {m.type === 'in' ? '+' : '-'}฿{formatCurrency(m.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Close Shift */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>ปิดกะ</Text>
              <Text style={styles.cardSub}>นับเงินในลิ้นชักแล้วกรอกยอดจริง</Text>
              <TextInput
                style={styles.input}
                value={closeAmount}
                onChangeText={setCloseAmount}
                placeholder="กรอกยอดเงินที่นับได้"
                placeholderTextColor={Colors.gray400}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: Colors.danger }]} onPress={handleCloseShift}>
                <Ionicons name="stop-circle" size={18} color={Colors.white} />
                <Text style={styles.primaryBtnText}>ปิดกะ</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* History (last 3) */}
        {shiftHistory.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ประวัติกะ</Text>
            {shiftHistory.slice(0, 3).map((s) => (
              <View key={s.id} style={styles.histRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.histName}>{s.cashierName} · {s.posName}</Text>
                  <Text style={styles.histTime}>{new Date(s.openedAt).toLocaleDateString('th-TH')} {new Date(s.openedAt).toLocaleTimeString('th-TH')} - {s.closedAt ? new Date(s.closedAt).toLocaleTimeString('th-TH') : ''}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.histSales}>฿{formatCurrency(s.cashSalesTotal)}</Text>
                  <Text style={[styles.histDiff, { color: (s.difference ?? 0) >= 0 ? Colors.success : Colors.danger }]}>
                    ผลต่าง: {(s.difference ?? 0) >= 0 ? '+' : ''}฿{formatCurrency(s.difference ?? 0)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Cash In/Out Modal */}
      <Modal visible={showCashModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{cashType === 'in' ? 'เงินเข้า' : 'เงินออก'}</Text>
            <TextInput style={styles.input} value={cashAmount} onChangeText={setCashAmount} placeholder="จำนวนเงิน" placeholderTextColor={Colors.gray400} keyboardType="decimal-pad" />
            <TextInput style={styles.input} value={cashReason} onChangeText={setCashReason} placeholder="เหตุผล (เช่น เพิ่มเงินทอน, นำฝากธนาคาร)" placeholderTextColor={Colors.gray400} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCashModal(false)}><Text style={styles.cancelText}>ยกเลิก</Text></TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleCashMovement}>
                <Text style={styles.primaryBtnText}>ยืนยัน</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  backBtn: { padding: 4 },
  headerTitle: { ...Typography.h4, color: Colors.white },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  cardIcon: { alignItems: 'center', marginBottom: Spacing.sm },
  cardTitle: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  cardSub: { ...Typography.caption, color: Colors.textSecondary },
  input: { backgroundColor: Colors.gray100, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Typography.body1, color: Colors.text },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md },
  primaryBtnText: { ...Typography.button, color: Colors.white },
  kpiRow: { flexDirection: 'row', gap: Spacing.sm },
  kpi: { flex: 1, backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.sm, padding: Spacing.sm, alignItems: 'center' },
  kpiVal: { ...Typography.label, fontWeight: '800', color: Colors.text },
  kpiLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: BorderRadius.md, paddingVertical: Spacing.md },
  actionBtnText: { ...Typography.button, color: Colors.white },
  movRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  movReason: { ...Typography.body2, color: Colors.text },
  movTime: { ...Typography.caption, color: Colors.textSecondary },
  movAmount: { ...Typography.label, fontWeight: '700' },
  histRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  histName: { ...Typography.label, color: Colors.text },
  histTime: { ...Typography.caption, color: Colors.textSecondary },
  histSales: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
  histDiff: { ...Typography.caption },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalSheet: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, width: '85%', gap: Spacing.md },
  modalTitle: { ...Typography.h4, color: Colors.text },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm },
  cancelBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  cancelText: { ...Typography.button, color: Colors.textSecondary },
});