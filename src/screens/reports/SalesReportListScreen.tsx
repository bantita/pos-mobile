/**
 * SCR-RPT-001 — Sales Report Listing
 * แสดงรายการขายแบบตาราง + Export Excel/PDF
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DateRangePicker, getDefaultRange } from '../../components/reports/DateRangePicker';
import { ReportListView, Column } from '../../components/reports/ReportListView';
import { KpiCard } from '../../components/reports/ReportCard';
import { MOCK_SALES_SUMMARY, MOCK_SALES_BY_DAY, MOCK_SALES_BY_CASHIER } from '../../data/mockReports';
import { exportExcel, exportPDF, buildHTMLReport } from '../../utils/exportReport';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency, formatDate } from '../../utils/format';

interface Props { onBack: () => void }

type ReportTab = 'daily' | 'cashier';

interface DailyRow {
  date: string; label: string; sales: string;
  bills: string; avg: string; profit: string; margin: string;
}
interface CashierRow {
  cashierName: string; posName: string; sales: string;
  bills: string; avg: string; salesRaw: number;
}

export const SalesReportListScreen: React.FC<Props> = ({ onBack }) => {
  const [dateRange, setDateRange] = useState(getDefaultRange());
  const [tab, setTab] = useState<ReportTab>('daily');
  const s = MOCK_SALES_SUMMARY;

  const dailyRows: DailyRow[] = MOCK_SALES_BY_DAY.map(d => ({
    date:   formatDate(d.date),
    label:  d.label,
    sales:  `฿${formatCurrency(d.sales)}`,
    bills:  `${d.bills}`,
    avg:    `฿${formatCurrency(d.bills > 0 ? d.sales / d.bills : 0)}`,
    profit: `฿${formatCurrency(d.profit)}`,
    margin: `${((d.profit / d.sales) * 100).toFixed(1)}%`,
  }));

  const cashierRows: CashierRow[] = MOCK_SALES_BY_CASHIER.map(c => ({
    cashierName: c.cashierName,
    posName:     c.posName,
    sales:       `฿${formatCurrency(c.sales)}`,
    bills:       `${c.bills}`,
    avg:         `฿${formatCurrency(c.avgPerBill)}`,
    salesRaw:    c.sales,
  }));

  const totalSales  = MOCK_SALES_BY_DAY.reduce((s, d) => s + d.sales, 0);
  const totalBills  = MOCK_SALES_BY_DAY.reduce((s, d) => s + d.bills, 0);
  const totalProfit = MOCK_SALES_BY_DAY.reduce((s, d) => s + d.profit, 0);

  const DAILY_COLS: Column<DailyRow>[] = [
    { key: 'date',   header: 'วันที่',         flex: 1.4, sortable: true },
    { key: 'sales',  header: 'ยอดขาย',        flex: 1.2, align: 'right', sortable: true },
    { key: 'bills',  header: 'บิล',           flex: 0.6, align: 'center', sortable: true },
    { key: 'avg',    header: 'เฉลี่ย/บิล',    flex: 1.2, align: 'right' },
    { key: 'profit', header: 'กำไร',          flex: 1.2, align: 'right', sortable: true },
    { key: 'margin', header: 'Margin',        flex: 0.8, align: 'center',
      render: (v) => {
        const pct = parseFloat(String(v));
        const color = pct >= 30 ? Colors.success : pct >= 20 ? Colors.warning : Colors.danger;
        return <Text style={{ color, fontWeight: '700', fontSize: FontSize.caption }}>{v}</Text>;
      }
    },
  ];

  const CASHIER_COLS: Column<CashierRow>[] = [
    { key: 'cashierName', header: 'พนักงาน',     flex: 1.5, sortable: true },
    { key: 'posName',     header: 'POS',         flex: 0.8 },
    { key: 'sales',       header: 'ยอดขาย',      flex: 1.2, align: 'right', sortable: true },
    { key: 'bills',       header: 'จำนวนบิล',   flex: 0.8, align: 'center', sortable: true },
    { key: 'avg',         header: 'เฉลี่ย/บิล',  flex: 1.2, align: 'right' },
  ];

  const handleExcel = () => {
    if (tab === 'daily') {
      exportExcel('sales_daily', dailyRows as any, [
        { key: 'date', header: 'วันที่' }, { key: 'sales', header: 'ยอดขาย' },
        { key: 'bills', header: 'บิล' }, { key: 'avg', header: 'เฉลี่ย/บิล' },
        { key: 'profit', header: 'กำไร' }, { key: 'margin', header: 'Margin%' },
      ]);
    } else {
      exportExcel('sales_cashier', cashierRows as any, [
        { key: 'cashierName', header: 'พนักงาน' }, { key: 'posName', header: 'POS' },
        { key: 'sales', header: 'ยอดขาย' }, { key: 'bills', header: 'บิล' }, { key: 'avg', header: 'เฉลี่ย/บิล' },
      ]);
    }
  };

  const handlePDF = () => {
    const cols = tab === 'daily' ? DAILY_COLS : CASHIER_COLS;
    const rows = (tab === 'daily' ? dailyRows : cashierRows) as any[];
    const html = buildHTMLReport(
      'รายงานยอดขาย',
      tab === 'daily' ? 'รายวัน' : 'ตามพนักงาน',
      `${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`,
      cols.map(c => ({ key: String(c.key), header: c.header, align: c.align })),
      rows,
      [
        { label: 'ยอดขายรวม', value: `฿${formatCurrency(totalSales)}` },
        { label: 'จำนวนบิล', value: `${totalBills} บิล` },
        { label: 'กำไรรวม', value: `฿${formatCurrency(totalProfit)}` },
      ]
    );
    exportPDF(html, 'sales_report');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>รายงานยอดขาย</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        {/* KPI row */}
        <View style={styles.kpiRow}>
          <KpiCard label="ยอดขายรวม" value={`฿${formatCurrency(s.totalSales)}`} icon="cash-outline" color={Colors.primary} bgColor={Colors.primaryLight} trend={12} style={{ flex: 1 }} />
          <KpiCard label="จำนวนบิล" value={`${s.totalBills}`} icon="receipt-outline" color={Colors.success} bgColor={Colors.successLight} style={{ flex: 1 }} />
        </View>
        <View style={styles.kpiRow}>
          <KpiCard label="กำไรรวม" value={`฿${formatCurrency(totalProfit)}`} icon="trending-up-outline" color={Colors.category1} bgColor={Colors.primaryLight} style={{ flex: 1 }} />
          <KpiCard label="เฉลี่ย/บิล" value={`฿${formatCurrency(s.avgPerBill)}`} icon="analytics-outline" color={Colors.warning} bgColor={Colors.warningLight} style={{ flex: 1 }} />
        </View>

        {/* Tab */}
        <View style={styles.tabRow}>
          {([['daily','รายวัน'],['cashier','ตามพนักงาน']] as const).map(([k, lbl]) => (
            <TouchableOpacity key={k} style={[styles.tab, tab === k && styles.tabActive]} onPress={() => setTab(k)}>
              <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Listing */}
        <View style={styles.listCard}>
          {tab === 'daily' ? (
            <ReportListView
              title="รายการยอดขายรายวัน"
              subtitle={`${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`}
              columns={DAILY_COLS}
              data={dailyRows}
              keyExtractor={r => r.date}
              searchKeys={['date', 'label']}
              searchPlaceholder="ค้นหาวันที่..."
              summaryRows={[
                { label: 'รวมยอดขาย', value: `฿${formatCurrency(totalSales)}` },
                { label: 'รวมบิล', value: `${totalBills} บิล` },
                { label: 'รวมกำไร', value: `฿${formatCurrency(totalProfit)}` },
              ]}
              onExcelExport={handleExcel}
              onPdfExport={handlePDF}
            />
          ) : (
            <ReportListView
              title="ยอดขายตามพนักงาน"
              columns={CASHIER_COLS}
              data={cashierRows}
              keyExtractor={r => r.cashierName}
              searchKeys={['cashierName', 'posName']}
              summaryRows={[
                { label: 'รวมยอดขาย', value: `฿${formatCurrency(totalSales)}` },
              ]}
              onExcelExport={handleExcel}
              onPdfExport={handlePDF}
            />
          )}
        </View>
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  kpiRow: { flexDirection: 'row', gap: Spacing.sm },
  tabRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: 4, gap: 4, borderWidth: 1, borderColor: Colors.border },
  tab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { ...Typography.label, color: Colors.textSecondary },
  tabTextActive: { color: Colors.white, fontWeight: '700' },
  listCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2, minHeight: 400 },
});
