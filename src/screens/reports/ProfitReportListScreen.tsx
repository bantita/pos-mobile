/**
 * SCR-RPT-004 — Profit Report Listing + Export
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ReportListView, Column } from '../../components/reports/ReportListView';
import { DateRangePicker, getDefaultRange } from '../../components/reports/DateRangePicker';
import { MOCK_PROFIT_BY_DAY, MOCK_PROFIT_BY_MONTH, MOCK_PROFIT_BY_PRODUCT } from '../../data/mockReports';
import { exportExcel, exportPDF, buildHTMLReport } from '../../utils/exportReport';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency, formatDate } from '../../utils/format';

interface Props { onBack: () => void }
type Tab = 'day' | 'month' | 'product';

interface PeriodRow { label: string; revenue: string; cost: string; profit: string; margin: string; revenueRaw: number; profitRaw: number }
interface ProductRow { name: string; qty: string; revenue: string; cost: string; profit: string; margin: string; profitRaw: number }

export const ProfitReportListScreen: React.FC<Props> = ({ onBack }) => {
  const [tab, setTab]           = useState<Tab>('day');
  const [dateRange, setDateRange] = useState(getDefaultRange());

  const dayRows: PeriodRow[] = MOCK_PROFIT_BY_DAY.map(d => ({
    label: d.label, revenue: `฿${formatCurrency(d.revenue)}`, cost: `฿${formatCurrency(d.cost)}`,
    profit: `฿${formatCurrency(d.grossProfit)}`, margin: `${d.margin}%`,
    revenueRaw: d.revenue, profitRaw: d.grossProfit,
  }));
  const monthRows: PeriodRow[] = MOCK_PROFIT_BY_MONTH.map(d => ({
    label: d.label, revenue: `฿${formatCurrency(d.revenue)}`, cost: `฿${formatCurrency(d.cost)}`,
    profit: `฿${formatCurrency(d.grossProfit)}`, margin: `${d.margin}%`,
    revenueRaw: d.revenue, profitRaw: d.grossProfit,
  }));
  const productRows: ProductRow[] = MOCK_PROFIT_BY_PRODUCT.map(p => ({
    name: p.productName, qty: `${p.qty}`, revenue: `฿${formatCurrency(p.revenue)}`,
    cost: `฿${formatCurrency(p.cost)}`, profit: `฿${formatCurrency(p.profit)}`,
    margin: `${p.margin.toFixed(1)}%`, profitRaw: p.profit,
  }));

  const PERIOD_COLS: Column<PeriodRow>[] = [
    { key: 'label',   header: 'ช่วง',     flex: 0.7 },
    { key: 'revenue', header: 'รายได้',  flex: 1.2, align: 'right', sortable: true },
    { key: 'cost',    header: 'ต้นทุน',  flex: 1.2, align: 'right' },
    { key: 'profit',  header: 'กำไร',    flex: 1.2, align: 'right', sortable: true,
      render: (v) => <Text style={{ color: Colors.success, fontWeight: '700', fontSize: FontSize.caption }}>{v}</Text> },
    { key: 'margin',  header: 'Margin',  flex: 0.8, align: 'center',
      render: (v) => {
        const n = parseFloat(String(v)); const color = n >= 30 ? Colors.success : n >= 20 ? Colors.warning : Colors.danger;
        return <Text style={{ color, fontWeight: '700', fontSize: FontSize.caption }}>{v}</Text>;
      }
    },
  ];
  const PRODUCT_COLS: Column<ProductRow>[] = [
    { key: 'name',    header: 'สินค้า',   flex: 2, sortable: true },
    { key: 'qty',     header: 'จำนวน',   flex: 0.7, align: 'center' },
    { key: 'revenue', header: 'รายได้',  flex: 1.1, align: 'right' },
    { key: 'cost',    header: 'ต้นทุน',  flex: 1.1, align: 'right' },
    { key: 'profit',  header: 'กำไร',    flex: 1.1, align: 'right', sortable: true,
      render: (v) => <Text style={{ color: Colors.success, fontWeight: '700', fontSize: FontSize.caption }}>{v}</Text> },
    { key: 'margin',  header: 'Margin',  flex: 0.8, align: 'center',
      render: (v) => {
        const n = parseFloat(String(v)); const color = n >= 30 ? Colors.success : n >= 20 ? Colors.warning : Colors.danger;
        return <Text style={{ color, fontWeight: '700', fontSize: FontSize.caption }}>{v}</Text>;
      }
    },
  ];

  const rows = tab === 'day' ? dayRows : tab === 'month' ? monthRows : productRows;
  const totalRevenue = (tab === 'product' ? MOCK_PROFIT_BY_PRODUCT : MOCK_PROFIT_BY_DAY).reduce((s, r) => s + r.revenue, 0);
  const totalProfit  = (tab === 'product' ? MOCK_PROFIT_BY_PRODUCT : MOCK_PROFIT_BY_DAY).reduce((s, r) => s + (tab === 'product' ? (r as any).profit : (r as any).grossProfit), 0);
  const avgMargin    = totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : '0';

  const handleExcel = () => {
    const filename = `profit_${tab}`;
    if (tab !== 'product') {
      exportExcel(filename, rows as any, [
        { key: 'label', header: 'ช่วง' }, { key: 'revenue', header: 'รายได้' },
        { key: 'cost', header: 'ต้นทุน' }, { key: 'profit', header: 'กำไร' }, { key: 'margin', header: 'Margin%' },
      ]);
    } else {
      exportExcel(filename, rows as any, [
        { key: 'name', header: 'สินค้า' }, { key: 'qty', header: 'จำนวน' },
        { key: 'revenue', header: 'รายได้' }, { key: 'cost', header: 'ต้นทุน' },
        { key: 'profit', header: 'กำไร' }, { key: 'margin', header: 'Margin%' },
      ]);
    }
  };
  const handlePDF = () => {
    const cols = tab !== 'product' ? PERIOD_COLS : PRODUCT_COLS;
    const title = tab === 'day' ? 'กำไรรายวัน' : tab === 'month' ? 'กำไรรายเดือน' : 'กำไรตามสินค้า';
    const html = buildHTMLReport(title, '', `${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`,
      cols.map(c => ({ key: String(c.key), header: c.header, align: c.align })), rows as any,
      [{ label: 'กำไรรวม', value: `฿${formatCurrency(totalProfit)}` }, { label: 'Avg Margin', value: `${avgMargin}%` }]
    );
    exportPDF(html, `profit_${tab}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={Colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>รายงานกำไร</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <View style={styles.tabRow}>
          {([['day','รายวัน'],['month','รายเดือน'],['product','ตามสินค้า']] as const).map(([k, lbl]) => (
            <TouchableOpacity key={k} style={[styles.tab, tab === k && styles.tabActive]} onPress={() => setTab(k)}>
              <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.kpiRow}>
          {[
            { label: 'รายได้รวม', value: `฿${formatCurrency(totalRevenue)}`, color: Colors.primary },
            { label: 'กำไรรวม', value: `฿${formatCurrency(totalProfit)}`, color: Colors.success },
            { label: 'Avg Margin', value: `${avgMargin}%`, color: Colors.category1 },
          ].map((k, i) => (
            <View key={i} style={[styles.kpiCard, { borderTopColor: k.color }]}>
              <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.listCard}>
          <ReportListView
            title={tab === 'day' ? 'กำไรรายวัน' : tab === 'month' ? 'กำไรรายเดือน' : 'กำไรตามสินค้า'}
            subtitle={`${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`}
            columns={(tab !== 'product' ? PERIOD_COLS : PRODUCT_COLS) as any}
            data={rows as any}
            keyExtractor={(r: any) => r.label ?? r.name}
            searchKeys={(tab === 'product' ? ['name'] : ['label']) as any}
            summaryRows={[
              { label: 'รายได้รวม', value: `฿${formatCurrency(totalRevenue)}` },
              { label: 'กำไรรวม', value: `฿${formatCurrency(totalProfit)}` },
              { label: 'Avg Margin', value: `${avgMargin}%` },
            ]}
            onExcelExport={handleExcel}
            onPdfExport={handlePDF}
          />
        </View>
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.success, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  tabRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: 4, gap: 4, borderWidth: 1, borderColor: Colors.border },
  tab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.success },
  tabText: { ...Typography.label, color: Colors.textSecondary, fontSize: FontSize.sm },
  tabTextActive: { color: Colors.white, fontWeight: '700' },
  kpiRow: { flexDirection: 'row', gap: Spacing.sm },
  kpiCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', gap: 4, borderTopWidth: 3, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  kpiValue: { ...Typography.label, fontWeight: '800', fontSize: FontSize.body },
  kpiLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', fontSize: FontSize.xxs },
  listCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2, minHeight: 400 },
});
