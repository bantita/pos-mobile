/**
 * SCR-DASH-002 — Dashboard Cashier
 * FR-DASH-002: หน้าหลักของพนักงานขาย
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ShiftSummary } from '../../types/dashboard';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency, formatTime, formatDateTime } from '../../utils/format';

interface CashierDashboardScreenProps {
  onStartSale: () => void;
  onOpenSync: () => void;
  cashierName?: string;
  posName?: string;
  isShiftOpen?: boolean;
}

const MOCK_SHIFT: ShiftSummary = {
  shiftStart: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 ชั่วโมงที่แล้ว
  salesAmount: 3240,
  billCount: 12,
  cashierName: 'สมชาย ใจดี',
  posName: 'POS 1',
};

const MOCK_RECENT = [
  { billNo: 'INV00123', amount: 450, time: new Date(Date.now() - 10 * 60000), items: 3 },
  { billNo: 'INV00122', amount: 280, time: new Date(Date.now() - 25 * 60000), items: 2 },
  { billNo: 'INV00121', amount: 120, time: new Date(Date.now() - 40 * 60000), items: 1 },
];

export const CashierDashboardScreen: React.FC<CashierDashboardScreenProps> = ({
  onStartSale,
  onOpenSync,
  cashierName,
  posName,
  isShiftOpen = true,
}) => {
  const [shift] = useState<ShiftSummary>({
    ...MOCK_SHIFT,
    cashierName: cashierName ?? MOCK_SHIFT.cashierName,
    posName: posName ?? MOCK_SHIFT.posName,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isShiftOpen) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isShiftOpen]);

  const avgPerBill = shift.billCount > 0 ? shift.salesAmount / shift.billCount : 0;
  const maxBill = Math.max(...MOCK_RECENT.map((r) => r.amount));

  // elapsed time
  const elapsedMs = currentTime.getTime() - shift.shiftStart.getTime();
  const elapsedH = Math.floor(elapsedMs / 3600000);
  const elapsedM = Math.floor((elapsedMs % 3600000) / 60000);
  const elapsedStr = `${elapsedH}ชม. ${elapsedM}นาที`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>สวัสดี, {shift.cashierName} 👋</Text>
          <Text style={styles.headerPos}>{shift.posName}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerTime}>{formatTime(currentTime)}</Text>
          <TouchableOpacity onPress={onOpenSync} style={styles.syncIconBtn}>
            <Ionicons name="cloud-upload-outline" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Shift Status Card */}
        <View style={[styles.shiftCard, isShiftOpen ? styles.shiftCardOpen : styles.shiftCardClosed]}>
          <View style={styles.shiftCardTop}>
            <View>
              <Text style={styles.shiftStatusLabel}>สถานะกะ</Text>
              <View style={styles.shiftStatusRow}>
                <View style={[styles.shiftDot, { backgroundColor: isShiftOpen ? Colors.success : Colors.danger }]} />
                <Text style={[styles.shiftStatusText, { color: isShiftOpen ? Colors.success : Colors.danger }]}>
                  {isShiftOpen ? 'กะเปิดอยู่' : 'กะปิดแล้ว'}
                </Text>
              </View>
            </View>
            <View style={styles.shiftTime}>
              <Text style={styles.shiftTimeLabel}>เริ่มกะ</Text>
              <Text style={styles.shiftTimeValue}>{formatTime(shift.shiftStart)}</Text>
              <Text style={styles.shiftElapsed}>{elapsedStr}</Text>
            </View>
          </View>

          <View style={styles.shiftDivider} />

          {/* Shift KPIs */}
          <View style={styles.shiftKpis}>
            <View style={styles.shiftKpi}>
              <Text style={styles.shiftKpiValue}>฿{formatCurrency(shift.salesAmount)}</Text>
              <Text style={styles.shiftKpiLabel}>ยอดขายกะนี้</Text>
            </View>
            <View style={styles.shiftKpiDivider} />
            <View style={styles.shiftKpi}>
              <Text style={styles.shiftKpiValue}>{shift.billCount}</Text>
              <Text style={styles.shiftKpiLabel}>จำนวนบิล</Text>
            </View>
            <View style={styles.shiftKpiDivider} />
            <View style={styles.shiftKpi}>
              <Text style={styles.shiftKpiValue}>฿{formatCurrency(avgPerBill)}</Text>
              <Text style={styles.shiftKpiLabel}>เฉลี่ย/บิล</Text>
            </View>
          </View>
        </View>

        {/* Start Sale Button */}
        {isShiftOpen && (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.startSaleBtn}
              onPress={onStartSale}
              activeOpacity={0.85}
            >
              <View style={styles.startSaleBtnInner}>
                <Ionicons name="cart" size={36} color={Colors.white} />
                <Text style={styles.startSaleBtnText}>เริ่มขายสินค้า</Text>
                <Text style={styles.startSaleBtnSub}>กดเพื่อเปิดหน้าขาย</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          {[
            { label: 'บิลล่าสุด', value: `฿${formatCurrency(MOCK_RECENT[0].amount)}`, icon: 'receipt-outline', color: Colors.primary },
            { label: 'เฉลี่ย/บิล', value: `฿${formatCurrency(avgPerBill)}`, icon: 'analytics-outline', color: Colors.success },
            { label: 'บิลสูงสุด', value: `฿${formatCurrency(maxBill)}`, icon: 'trophy-outline', color: Colors.warning },
          ].map((s, i) => (
            <View key={i} style={styles.quickStatCard}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
              <Text style={[styles.quickStatValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.quickStatLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent Bills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>บิลล่าสุด</Text>
          {MOCK_RECENT.map((bill, i) => (
            <View key={i} style={styles.recentBillRow}>
              <View style={styles.recentBillIcon}>
                <Ionicons name="receipt-outline" size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentBillNo}>{bill.billNo}</Text>
                <Text style={styles.recentBillTime}>{formatTime(bill.time)} · {bill.items} รายการ</Text>
              </View>
              <Text style={styles.recentBillAmount}>฿{formatCurrency(bill.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  headerGreeting: { ...Typography.h4, color: Colors.white },
  headerPos: { ...Typography.caption, color: Colors.textSecondary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerTime: { ...Typography.h4, color: Colors.white, fontVariant: ['tabular-nums'] },
  syncIconBtn: { padding: Spacing.xs },
  scroll: { padding: Spacing.md, gap: Spacing.md },

  // Shift Card
  shiftCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.md,
    borderWidth: 2,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  shiftCardOpen: { borderColor: Colors.success },
  shiftCardClosed: { borderColor: Colors.danger },
  shiftCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  shiftStatusLabel: { ...Typography.caption, color: Colors.textSecondary },
  shiftStatusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
  shiftDot: { width: 8, height: 8, borderRadius: 4 },
  shiftStatusText: { ...Typography.label, fontWeight: '700' },
  shiftTime: { alignItems: 'flex-end' },
  shiftTimeLabel: { ...Typography.caption, color: Colors.textSecondary },
  shiftTimeValue: { ...Typography.label, color: Colors.text, fontWeight: '600' },
  shiftElapsed: { ...Typography.caption, color: Colors.textSecondary },
  shiftDivider: { height: 1, backgroundColor: Colors.border },
  shiftKpis: { flexDirection: 'row' },
  shiftKpi: { flex: 1, alignItems: 'center' },
  shiftKpiValue: { ...Typography.h4, color: Colors.text, fontWeight: '700' },
  shiftKpiLabel: { ...Typography.caption, color: Colors.textSecondary },
  shiftKpiDivider: { width: 1, backgroundColor: Colors.border },

  // Start Sale Button
  startSaleBtn: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 12,
  },
  startSaleBtnInner: {
    backgroundColor: Colors.primary, alignItems: 'center',
    paddingVertical: Spacing.xl, gap: Spacing.xs,
    borderRadius: BorderRadius.xl,
  },
  startSaleBtnText: { ...Typography.h3, color: Colors.white, fontWeight: '800' },
  startSaleBtnSub: { ...Typography.body2, color: Colors.textSecondary },

  // Quick Stats
  quickStats: { flexDirection: 'row', gap: Spacing.sm },
  quickStatCard: {
    flex: 1, alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  quickStatValue: { ...Typography.label, fontWeight: '700' },
  quickStatLabel: { ...Typography.caption, color: Colors.textSecondary },

  // Section
  section: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.sm,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 2,
  },
  sectionTitle: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  recentBillRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  recentBillIcon: {
    width: 36, height: 36, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  recentBillNo: { ...Typography.label, color: Colors.text },
  recentBillTime: { ...Typography.caption, color: Colors.textSecondary },
  recentBillAmount: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
});
