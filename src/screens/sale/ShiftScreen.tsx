/**
 * ShiftScreen — เปิดกะ / ปิดกะ / เงินเข้า-ออกระหว่างวัน
 * ปิดกะ → พิมพ์ใบปิดกะ → ออกจากระบบ กลับหน้า login เพื่อเปิดกะใหม่
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, Modal, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { useShiftStore, Shift } from '../../store/shiftStore';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, formatDateTime } from '../../utils/format';

interface ShiftScreenProps {
  onBack: () => void;
  cashierName?: string;
  posName?: string;
}

// ─── ชนิดเงิน (นับเงินในลิ้นชัก) ────────────────────────────────────────────
const DENOMINATIONS: { label: string; value: number; kind: 'note' | 'coin' }[] = [
  { label: '฿1,000 แบงค์', value: 1000, kind: 'note' },
  { label: '฿500 แบงค์',   value: 500,  kind: 'note' },
  { label: '฿100 แบงค์',   value: 100,  kind: 'note' },
  { label: '฿50 แบงค์',    value: 50,   kind: 'note' },
  { label: '฿20 แบงค์',    value: 20,   kind: 'note' },
  { label: '฿10 เหรียญ',   value: 10,   kind: 'coin' },
  { label: '฿5 เหรียญ',    value: 5,    kind: 'coin' },
  { label: '฿2 เหรียญ',    value: 2,    kind: 'coin' },
  { label: '฿1 เหรียญ',    value: 1,    kind: 'coin' },
  { label: '฿0.50 เหรียญ', value: 0.5,  kind: 'coin' },
  { label: '฿0.25 เหรียญ', value: 0.25, kind: 'coin' },
];

/** ยืนยันแบบ cross-platform — Alert.alert ไม่ทำงานบน web จึง fallback ไป window.confirm */
const confirmAction = (title: string, message: string, onConfirm: () => void, confirmLabel = 'ตกลง') => {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'ยกเลิก', style: 'cancel' },
    { text: confirmLabel, onPress: onConfirm },
  ]);
};

const notify = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (typeof window !== 'undefined') window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
};

/** สร้าง HTML ใบปิดกะ แล้วสั่งพิมพ์ (web) */
const printShiftReport = (shift: Shift, expected: number, counted: number) => {
  const diff = counted - expected;
  const rows = shift.movements
    .map((m) => `<tr><td>${m.type === 'in' ? 'เงินเข้า' : 'เงินออก'} — ${m.reason}</td><td style="text-align:right">${m.type === 'in' ? '+' : '-'}฿${formatCurrency(m.amount)}</td></tr>`)
    .join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>ใบปิดกะ</title>
<style>
  * { font-family: 'Sarabun', -apple-system, sans-serif; }
  body { width: 300px; margin: 0 auto; padding: 12px; color: #111; }
  h2 { text-align: center; margin: 4px 0; font-size: 18px; }
  .sub { text-align: center; font-size: 12px; color: #555; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  td { padding: 3px 0; }
  .line { border-top: 1px dashed #999; margin: 8px 0; }
  .total { font-weight: 800; font-size: 15px; }
  .diff { font-weight: 800; }
</style></head><body>
  <h2>ใบปิดกะ</h2>
  <div class="sub">${shift.posName} · ${shift.cashierName}</div>
  <table>
    <tr><td>เปิดกะ</td><td style="text-align:right">${formatDateTime(new Date(shift.openedAt))}</td></tr>
    <tr><td>ปิดกะ</td><td style="text-align:right">${formatDateTime(new Date())}</td></tr>
  </table>
  <div class="line"></div>
  <table>
    <tr><td>เงินเปิดกะ</td><td style="text-align:right">฿${formatCurrency(shift.openingAmount)}</td></tr>
    <tr><td>ยอดขายเงินสด</td><td style="text-align:right">฿${formatCurrency(shift.cashSalesTotal)}</td></tr>
    <tr><td>จำนวนบิล</td><td style="text-align:right">${shift.billCount}</td></tr>
    ${rows}
  </table>
  <div class="line"></div>
  <table>
    <tr><td>เงินที่ควรมี</td><td style="text-align:right">฿${formatCurrency(expected)}</td></tr>
    <tr class="total"><td>เงินนับได้จริง</td><td style="text-align:right">฿${formatCurrency(counted)}</td></tr>
    <tr class="diff"><td>ผลต่าง</td><td style="text-align:right;color:${diff >= 0 ? '#16A34A' : '#DC2626'}">${diff >= 0 ? '+' : ''}฿${formatCurrency(diff)}</td></tr>
  </table>
  <div class="line"></div>
  <div class="sub">ลงชื่อ ..............................</div>
</body></html>`;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const win = window.open('', '_blank', 'width=380,height=640');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 300);
    }
  }
};

export const ShiftScreen: React.FC<ShiftScreenProps> = ({
  onBack, cashierName = 'พนักงาน', posName = 'POS 1',
}) => {
  const {
    currentShift, shiftHistory,
    openShift, closeShift, addCashMovement,
    isShiftOpen, getExpectedCash,
  } = useShiftStore();
  const logout = useAuthStore((s) => s.logout);

  const [openAmount, setOpenAmount] = useState('');
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashType, setCashType] = useState<'in' | 'out'>('in');
  const [cashAmount, setCashAmount] = useState('');
  const [cashReason, setCashReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const countedTotal = DENOMINATIONS.reduce(
    (sum, d) => sum + d.value * (parseFloat(counts[d.value] || '0') || 0), 0,
  );

  const handleOpenShift = () => {
    const amt = parseFloat(openAmount) || 0;
    openShift({ posId: 'pos1', posName, cashierName, openingAmount: amt });
    setOpenAmount('');
    notify('เปิดกะสำเร็จ', `เงินเปิดกะ: ฿${formatCurrency(amt)}`);
  };

  const handleCloseShift = () => {
    if (!currentShift) return;
    const amt = countedTotal;
    const expected = getExpectedCash();
    const diff = amt - expected;
    const shiftSnapshot = currentShift;

    confirmAction(
      'ยืนยันปิดกะ',
      `เงินนับได้: ฿${formatCurrency(amt)}\nยอดที่ควรเป็น: ฿${formatCurrency(expected)}\nผลต่าง: ${diff >= 0 ? '+' : ''}฿${formatCurrency(diff)}\n\nระบบจะพิมพ์ใบปิดกะและออกจากระบบ`,
      () => {
        // 1) ปิดกะ (เก็บลงประวัติ)
        closeShift(amt);
        setCounts({});
        // 2) พิมพ์ใบปิดกะ
        printShiftReport(shiftSnapshot, expected, amt);
        // 3) ออกจากระบบ → เด้งกลับหน้า login เพื่อเปิดกะใหม่
        //    หน่วงเล็กน้อยให้หน้าต่างพิมพ์เปิดก่อน
        setTimeout(() => {
          logout();
          onBack();
        }, 400);
      },
      'ปิดกะ',
    );
  };

  const handleCashMovement = () => {
    const amt = parseFloat(cashAmount) || 0;
    if (amt <= 0) { notify('ข้อผิดพลาด', 'กรุณากรอกจำนวนเงิน'); return; }
    if (!cashReason.trim()) { notify('ข้อผิดพลาด', 'กรุณากรอกเหตุผล'); return; }
    addCashMovement(cashType, amt, cashReason);
    notify('สำเร็จ', `${cashType === 'in' ? 'เงินเข้า' : 'เงินออก'} ฿${formatCurrency(amt)}`);
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
                <View style={styles.kpi}><Text style={[styles.kpiVal, { color: Colors.success }]}>฿{formatCurrency(currentShift.cashSalesTotal)}</Text><Text style={styles.kpiLabel}>ยอดขายรวม</Text></View>
                <View style={styles.kpi}><Text style={[styles.kpiVal, { color: Colors.primary }]}>฿{formatCurrency(getExpectedCash())}</Text><Text style={styles.kpiLabel}>เงินสดที่ควรมี</Text></View>
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

            {/* Close Shift — นับเงินแยกตามชนิด */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>ปิดกะ</Text>
              <Text style={styles.cardSub}>นับเงินในลิ้นชักแยกตามชนิด แล้วกดปิดกะ</Text>

              <View style={styles.countHead}>
                <Text style={[styles.countCol, { flex: 1 }]}>ชนิดเงิน</Text>
                <Text style={[styles.countCol, { width: 80, textAlign: 'center' }]}>จำนวน</Text>
                <Text style={[styles.countCol, { width: 90, textAlign: 'right' }]}>รวม</Text>
              </View>

              {DENOMINATIONS.map((d) => {
                const qty = parseFloat(counts[d.value] || '0') || 0;
                const sub = d.value * qty;
                return (
                  <View key={d.value} style={styles.countRow}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                      <Ionicons name={d.kind === 'note' ? 'card-outline' : 'ellipse-outline'} size={15} color={Colors.textSecondary} />
                      <Text style={styles.countLabel}>{d.label}</Text>
                    </View>
                    <TextInput
                      style={styles.countInput}
                      value={counts[d.value] || ''}
                      onChangeText={(v) => setCounts((prev) => ({ ...prev, [d.value]: v.replace(/[^0-9]/g, '') }))}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={Colors.gray400}
                    />
                    <Text style={styles.countSub}>{sub > 0 ? `฿${formatCurrency(sub)}` : '—'}</Text>
                  </View>
                );
              })}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>ยอดรวมทั้งหมด</Text>
                <Text style={styles.totalVal}>฿{formatCurrency(countedTotal)}</Text>
              </View>

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

      {/* History Modal */}
      <Modal visible={showHistory} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>ประวัติกะทั้งหมด</Text>
            <ScrollView>
              {shiftHistory.length === 0 && <Text style={styles.cardSub}>ยังไม่มีประวัติกะ</Text>}
              {shiftHistory.map((s) => (
                <View key={s.id} style={styles.histRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.histName}>{s.cashierName} · {s.posName}</Text>
                    <Text style={styles.histTime}>{new Date(s.openedAt).toLocaleDateString('th-TH')} {new Date(s.openedAt).toLocaleTimeString('th-TH')}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.histSales}>฿{formatCurrency(s.cashSalesTotal)}</Text>
                    <Text style={[styles.histDiff, { color: (s.difference ?? 0) >= 0 ? Colors.success : Colors.danger }]}>
                      ผลต่าง: {(s.difference ?? 0) >= 0 ? '+' : ''}฿{formatCurrency(s.difference ?? 0)}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.cancelBtn, { alignSelf: 'flex-end' }]} onPress={() => setShowHistory(false)}>
              <Text style={styles.cancelText}>ปิด</Text>
            </TouchableOpacity>
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
  // Cash count
  countHead: { flexDirection: 'row', alignItems: 'center', paddingBottom: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  countCol: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700' },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 4 },
  countLabel: { ...Typography.body2, color: Colors.text },
  countInput: { width: 80, backgroundColor: Colors.gray100, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.sm, paddingVertical: 6, ...Typography.body2, color: Colors.text, textAlign: 'center' },
  countSub: { width: 90, textAlign: 'right', ...Typography.body2, color: Colors.text, fontWeight: '600' },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginTop: Spacing.xs },
  totalLabel: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  totalVal: { ...Typography.h4, color: Colors.primary, fontWeight: '800' },
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
