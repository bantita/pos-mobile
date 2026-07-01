/**
 * SCR-RPT-001 — รายงานยอดขาย
 * FR-RPT-001: ยอดขายรายวัน/เดือน/ปี กรองสาขา POS พนักงาน Export
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  MOCK_SALES_SUMMARY, MOCK_SALES_BY_DAY, MOCK_SALES_BY_MONTH,
  MOCK_SALES_BY_CATEGORY, MOCK_SALES_BY_CASHIER,
} from '../../data/mockReports';
import { DateRangePicker, getDefaultRange } from '../../components/reports/DateRangePicker';
import { KpiCard, SectionCard, ExportButton } from '../../components/reports/ReportCard';
import { MiniBarChart } from '../../components/reports/MiniBarChart';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency } from '../../utils/format';

interface Props { onBack: () => void }

type ViewMode = 'day' | 'month';

export const SalesReportScreen: React.FC<Props> = ({ onBack }) => {
  const [dateRange, setDateRange] = useState(getDefaultRange());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const s = MOCK_SALES_SUMMARY;
  const chartData = viewMode === 'day'
    ? MOCK_SALES_BY_DAY.map(d => ({ label: d.label, value: d.sales, value2: d.profit, highlight: d === MOCK_SALES_BY_DAY[MOCK_SALES_BY_DAY.length - 1] }))
    : MOCK_SALES_BY_MONTH.map(d => ({ label: d.label, value: d.sales, value2: d.profit }));
  const maxDay = [...MOCK_SALES_BY_DAY].sort((a, b) => b.sales - a.sales)[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={Colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>รายงานยอดขาย</Text>
        <ExportButton onExcel={() => Alert.alert('Export Excel')} onPdf={() => Alert.alert('Export PDF')} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Date Range */}
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        {/* KPI Summary */}
        <View style={styles.kpiGrid}>
          <KpiCard label="ยอดขายรวม" value={`฿${formatCurrency(s.totalSales)}`} icon="cash-outline" color={Colors.primary} bgColor={Colors.primaryLight} trend={12} style={styles.kpiFull} />
          <KpiCard label="จำนวนบิล" value={`${s.totalBills}`} sub={`ยกเลิก ${s.cancelledBills} บิล`} icon="receipt-outline" color={Colors.success} bgColor={Colors.successLight} trend={5} style={styles.kpiHalf} />
          <KpiCard label="เฉลี่ย/บิล" value={`฿${formatCurrency(s.avgPerBill)}`} icon="analytics-outline" color={Colors.category1} bgColor={Colors.primaryLight} style={styles.kpiHalf} />
          <KpiCard label="ส่วนลดรวม" value={`฿${formatCurrency(s.totalDiscount)}`} icon="pricetag-outline" color={Colors.warning} bgColor={Colors.warningLight} style={styles.kpiHalf} />
          <KpiCard label="VAT รวม" value={`฿${formatCurrency(s.totalVat)}`} icon="calculator-outline" color={Colors.gray500} bgColor={Colors.gray100} style={styles.kpiHalf} />
        </View>

        {/* Bar Chart */}
        <SectionCard
          title={`ยอดขายราย${viewMode === 'day' ? 'วัน' : 'เดือน'}`}
          icon="bar-chart-outline"
          action={{ label: viewMode === 'day' ? 'ดูรายเดือน' : 'ดูรายวัน', onPress: () => setViewMode(v => v === 'day' ? 'month' : 'day') }}
        >
          <MiniBarChart data={chartData} color={Colors.primary} color2={Colors.success} showValues height={140} formatValue={(v) => `${(v / 1000).toFixed(0)}K`} />
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.primary + 'BB' }]} /><Text style={styles.legendText}>ยอดขาย</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.success + '60' }]} /><Text style={styles.legendText}>กำไร</Text></View>
          </View>
          <View style={styles.chartHighlight}>
            <Ionicons name="trophy-outline" size={13} color={Colors.warning} />
            <Text style={styles.chartHighlightText}>วันขายดีสุด: {maxDay.label} ฿{formatCurrency(maxDay.sales)} ({maxDay.bills} บิล)</Text>
          </View>
        </SectionCard>

        {/* Payment Methods */}
        <SectionCard title="ช่องทางชำระเงิน" icon="card-outline">
          {[
            { label: 'เงินสด',    amount: s.cashAmount,     color: Colors.success, icon: 'cash-outline' },
            { label: 'โอนเงิน',  amount: s.transferAmount, color: Colors.primary, icon: 'phone-portrait-outline' },
            { label: 'QR Code',  amount: s.qrAmount,        color: Colors.primary, icon: 'qr-code-outline' },
            { label: 'บัตรเครดิต', amount: s.creditAmount, color: Colors.category1,      icon: 'card-outline' },
            { label: 'E-Wallet', amount: s.ewalletAmount,   color: Colors.primary, icon: 'wallet-outline' },
          ].map((pm) => {
            const pct = ((pm.amount / s.totalSales) * 100).toFixed(1);
            return (
              <View key={pm.label} style={styles.payRow}>
                <View style={[styles.payIcon, { backgroundColor: pm.color + '18' }]}><Ionicons name={pm.icon as any} size={16} color={pm.color} /></View>
                <Text style={styles.payLabel}>{pm.label}</Text>
                <View style={styles.payBar}>
                  <View style={[styles.payBarFill, { width: `${pct}%` as any, backgroundColor: pm.color }]} />
                </View>
                <Text style={styles.payPct}>{pct}%</Text>
                <Text style={styles.payAmt}>฿{formatCurrency(pm.amount)}</Text>
              </View>
            );
          })}
        </SectionCard>

        {/* By Category */}
        <SectionCard title="ยอดขายตามหมวดหมู่" icon="list-outline">
          {MOCK_SALES_BY_CATEGORY.map((cat, i) => (
            <View key={cat.categoryName} style={styles.catRow}>
              <View style={styles.catRank}><Text style={styles.catRankText}>{i + 1}</Text></View>
              <Text style={styles.catName}>{cat.categoryName}</Text>
              <View style={styles.catBarWrap}>
                <View style={[styles.catBar, { width: `${cat.percent}%` as any }]} />
              </View>
              <Text style={styles.catPct}>{cat.percent}%</Text>
              <Text style={styles.catAmt}>฿{formatCurrency(cat.sales)}</Text>
            </View>
          ))}
        </SectionCard>

        {/* By Cashier */}
        <SectionCard title="ยอดขายตามพนักงาน" icon="people-outline">
          {MOCK_SALES_BY_CASHIER.map((c) => (
            <View key={c.cashierName} style={styles.cashierRow}>
              <View style={styles.cashierAvatar}><Ionicons name="person-outline" size={18} color={Colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cashierName}>{c.cashierName}</Text>
                <Text style={styles.cashierPos}>{c.posName} · {c.bills} บิล · เฉลี่ย ฿{formatCurrency(c.avgPerBill)}</Text>
              </View>
              <Text style={styles.cashierAmt}>฿{formatCurrency(c.sales)}</Text>
            </View>
          ))}
        </SectionCard>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white, flex: 1 },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  kpiFull: { width: '100%' },
  kpiHalf: { width: '47.5%', flexGrow: 1 },
  chartLegend: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...Typography.caption, color: Colors.textSecondary },
  chartHighlight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.warningLight, borderRadius: BorderRadius.sm, padding: Spacing.sm },
  chartHighlightText: { ...Typography.caption, color: Colors.warning, fontWeight: '600', flex: 1 },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  payIcon: { width: 30, height: 30, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  payLabel: { ...Typography.body2, color: Colors.text, width: 70 },
  payBar: { flex: 1, height: 8, backgroundColor: Colors.gray100, borderRadius: 4, overflow: 'hidden' },
  payBarFill: { height: '100%', borderRadius: 4 },
  payPct: { ...Typography.caption, color: Colors.textSecondary, width: 36, textAlign: 'right' },
  payAmt: { ...Typography.label, color: Colors.text, fontWeight: '600', width: 72, textAlign: 'right' },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  catRank: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  catRankText: { fontSize: FontSize.xs, color: Colors.white, fontWeight: '700' },
  catName: { ...Typography.body2, color: Colors.text, width: 80 },
  catBarWrap: { flex: 1, height: 8, backgroundColor: Colors.gray100, borderRadius: 4, overflow: 'hidden' },
  catBar: { height: '100%', backgroundColor: Colors.primary + '99', borderRadius: 4 },
  catPct: { ...Typography.caption, color: Colors.textSecondary, width: 36, textAlign: 'right' },
  catAmt: { ...Typography.label, color: Colors.primary, fontWeight: '700', width: 72, textAlign: 'right' },
  cashierRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cashierAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  cashierName: { ...Typography.label, color: Colors.text },
  cashierPos: { ...Typography.caption, color: Colors.textSecondary },
  cashierAmt: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
});
