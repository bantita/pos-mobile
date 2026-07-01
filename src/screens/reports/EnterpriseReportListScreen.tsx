/**
 * SCR-RPT-005 — Enterprise Report Listing + Export
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ReportListView, Column } from '../../components/reports/ReportListView';
import { DateRangePicker, getDefaultRange } from '../../components/reports/DateRangePicker';
import { MOCK_BRANCH_KPI, MOCK_POS_PERFORMANCE } from '../../data/mockReports';
import { exportExcel, exportPDF, buildHTMLReport } from '../../utils/exportReport';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency, formatDate } from '../../utils/format';

interface Props { onBack: () => void }
type Tab = 'branch' | 'pos';

interface BranchRow { branch: string; sales: string; bills: string; profit: string; margin: string; avgBill: string; turnover: string; gmroi: string }
interface POSRow { pos: string; branch: string; cashier: string; sales: string; bills: string; avgBill: string }

export const EnterpriseReportListScreen: React.FC<Props> = ({ onBack }) => {
  const [tab, setTab] = useState<Tab>('branch');
  const [dateRange, setDateRange] = useState(getDefaultRange());

  const branchRows: BranchRow[] = MOCK_BRANCH_KPI.map(b => ({
    branch: b.branchName, sales: `฿${formatCurrency(b.sales)}`, bills: `${b.bills}`,
    profit: `฿${formatCurrency(b.profit)}`, margin: `${b.margin}%`,
    avgBill: `฿${formatCurrency(b.avgPerBill)}`,
    turnover: `${b.inventoryTurnover}x`, gmroi: `${b.gmroi}x`,
  }));
  const posRows: POSRow[] = MOCK_POS_PERFORMANCE.map(p => ({
    pos: p.posName, branch: p.branchName, cashier: p.cashierName,
    sales: `฿${formatCurrency(p.sales)}`, bills: `${p.bills}`,
    avgBill: `฿${formatCurrency(p.avgPerBill)}`,
  }));

  const BRANCH_COLS: Column<BranchRow>[] = [
    { key: 'branch',   header: 'สาขา',      flex: 1.3, sortable: true },
    { key: 'sales',    header: 'ยอดขาย',   flex: 1.2, align: 'right', sortable: true },
    { key: 'bills',    header: 'บิล',       flex: 0.6, align: 'center' },
    { key: 'profit',   header: 'กำไร',     flex: 1.2, align: 'right', sortable: true },
    { key: 'margin',   header: 'Margin',   flex: 0.7, align: 'center',
      render: (v) => { const n = parseFloat(String(v)); return <Text style={{ color: n >= 25 ? Colors.success : Colors.warning, fontWeight: '700', fontSize: FontSize.caption }}>{v}</Text>; } },
    { key: 'turnover', header: 'Turnover', flex: 0.8, align: 'center',
      render: (v) => { const n = parseFloat(String(v)); return <Text style={{ color: n >= 8 ? Colors.success : Colors.warning, fontWeight: '700', fontSize: FontSize.caption }}>{v}</Text>; } },
    { key: 'gmroi',    header: 'GMROI',    flex: 0.7, align: 'center',
      render: (v) => { const n = parseFloat(String(v)); return <Text style={{ color: n >= 18 ? Colors.success : Colors.primary, fontWeight: '700', fontSize: FontSize.caption }}>{v}</Text>; } },
  ];
  const POS_COLS: Column<POSRow>[] = [
    { key: 'pos',     header: 'จุดขาย',   flex: 1, sortable: true },
    { key: 'branch',  header: 'สาขา',     flex: 1 },
    { key: 'cashier', header: 'พนักงาน',  flex: 1.3, sortable: true },
    { key: 'sales',   header: 'ยอดขาย',  flex: 1.2, align: 'right', sortable: true },
    { key: 'bills',   header: 'บิล',      flex: 0.6, align: 'center' },
    { key: 'avgBill', header: 'เฉลี่ย/บิล', flex: 1, align: 'right' },
  ];

  const totalSales = MOCK_BRANCH_KPI.reduce((s, b) => s + b.sales, 0);
  const totalProfit = MOCK_BRANCH_KPI.reduce((s, b) => s + b.profit, 0);

  const handleExcel = () => {
    if (tab === 'branch') {
      exportExcel('enterprise_branch', branchRows as any, [
        { key: 'branch', header: 'สาขา' }, { key: 'sales', header: 'ยอดขาย' },
        { key: 'bills', header: 'บิล' }, { key: 'profit', header: 'กำไร' },
        { key: 'margin', header: 'Margin%' }, { key: 'turnover', header: 'Turnover' }, { key: 'gmroi', header: 'GMROI' },
      ]);
    } else {
      exportExcel('enterprise_pos', posRows as any, [
        { key: 'pos', header: 'จุดขาย' }, { key: 'branch', header: 'สาขา' },
        { key: 'cashier', header: 'พนักงาน' }, { key: 'sales', header: 'ยอดขาย' },
        { key: 'bills', header: 'บิล' }, { key: 'avgBill', header: 'เฉลี่ย/บิล' },
      ]);
    }
  };
  const handlePDF = () => {
    const cols = tab === 'branch' ? BRANCH_COLS : POS_COLS;
    const rows = tab === 'branch' ? branchRows : posRows;
    const html = buildHTMLReport(
      tab === 'branch' ? 'Enterprise — เปรียบเทียบสาขา' : 'Enterprise — ประสิทธิภาพ POS',
      '', `${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`,
      cols.map(c => ({ key: String(c.key), header: c.header, align: c.align })), rows as any,
      tab === 'branch' ? [
        { label: 'รายได้รวม', value: `฿${formatCurrency(totalSales)}` },
        { label: 'กำไรรวม', value: `฿${formatCurrency(totalProfit)}` },
      ] : []
    );
    exportPDF(html, `enterprise_${tab}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={Colors.white} /></TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Enterprise Report</Text>
          <Text style={styles.headerSub}>Phase 2 · Multi-Branch KPI</Text>
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <View style={styles.tabRow}>
          {([['branch','เปรียบเทียบสาขา'],['pos','ประสิทธิภาพ POS']] as const).map(([k, lbl]) => (
            <TouchableOpacity key={k} style={[styles.tab, tab === k && styles.tabActive]} onPress={() => setTab(k)}>
              <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.listCard}>
          {tab === 'branch' ? (
            <ReportListView
              title="เปรียบเทียบ KPI สาขา"
              subtitle={`${MOCK_BRANCH_KPI.length} สาขา`}
              columns={BRANCH_COLS}
              data={branchRows}
              keyExtractor={r => r.branch}
              searchKeys={['branch']}
              summaryRows={[
                { label: 'รายได้รวม', value: `฿${formatCurrency(totalSales)}` },
                { label: 'กำไรรวม', value: `฿${formatCurrency(totalProfit)}` },
              ]}
              onExcelExport={handleExcel}
              onPdfExport={handlePDF}
            />
          ) : (
            <ReportListView
              title="ประสิทธิภาพ POS"
              subtitle={`${posRows.length} จุดขาย`}
              columns={POS_COLS}
              data={posRows}
              keyExtractor={r => r.pos}
              searchKeys={['pos', 'branch', 'cashier']}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.6)' },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  tabRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: 4, gap: 4, borderWidth: 1, borderColor: Colors.border },
  tab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { ...Typography.label, color: Colors.textSecondary, fontSize: FontSize.sm },
  tabTextActive: { color: Colors.white, fontWeight: '700' },
  listCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2, minHeight: 400 },
});
