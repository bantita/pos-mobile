/**
 * SCR-RPT-004 — รายงานกำไร
 * FR-RPT-004: Gross Profit / Margin แยกตามวัน สินค้า สาขา
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_PROFIT_BY_DAY, MOCK_PROFIT_BY_MONTH, MOCK_PROFIT_BY_PRODUCT } from '../../data/mockReports';
import { DateRangePicker, getDefaultRange } from '../../components/reports/DateRangePicker';
import { SectionCard, ExportButton } from '../../components/reports/ReportCard';
import { MiniBarChart } from '../../components/reports/MiniBarChart';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency } from '../../utils/format';

interface Props { onBack: () => void }

export const ProfitReportScreen: React.FC<Props> = ({ onBack }) => {
  const [dateRange, setDateRange] = useState(getDefaultRange());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const chartData = viewMode === 'day' ? MOCK_PROFIT_BY_DAY : MOCK_PROFIT_BY_MONTH;

  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalCost    = chartData.reduce((s, d) => s + d.cost, 0);
  const totalProfit  = chartData.reduce((s, d) => s + d.grossProfit, 0);
  const avgMargin    = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;
  const bestDay      = [...chartData].sort((a, b) => b.grossProfit - a.grossProfit)[0];

  const barData = chartData.map(d => ({
    label: d.label,
    value: d.revenue,
    value2: d.grossProfit,
    highlight: d === bestDay,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={Colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>รายงานกำไร</Text>
        <ExportButton onExcel={() => Alert.alert('Export Excel')} onPdf={() => Alert.alert('Export PDF')} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        {/* KPI */}
        <View style={styles.kpiRow}>
          {[
            { label: 'รายได้รวม',   value: `฿${formatCurrency(totalRevenue)}`, color: Colors.primary, bg: Colors.primaryLight, icon: 'cash-outline' },
            { label: 'ต้นทุนรวม',  value: `฿${formatCurrency(totalCost)}`,    color: Colors.danger,  bg: Colors.dangerLight,  icon: 'cart-outline' },
            { label: 'กำไรขั้นต้น', value: `฿${formatCurrency(totalProfit)}`, color: Colors.success, bg: Colors.successLight, icon: 'trending-up-outline' },
          ].map((k, i) => (
            <View key={i} style={[styles.kpiCard, { borderTopColor: k.color }]}>
              <Ionicons name={k.icon as any} size={18} color={k.color} />
              <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* Margin gauge */}
        <SectionCard title="Gross Margin" icon="pie-chart-outline">
          <View style={styles.gaugeSection}>
            <View style={styles.gaugeLeft}>
              <Text style={styles.gaugeValue}>{avgMargin.toFixed(1)}%</Text>
              <Text style={styles.gaugeLabel}>Gross Margin เฉลี่ย</Text>
              <View style={styles.gaugeBar}>
                <View style={[styles.gaugeRevenueBar, { flex: 1 }]}>
                  <View style={[styles.gaugeCostFill, { flex: totalCost / totalRevenue }]} />
                  <View style={[styles.gaugeProfitFill, { flex: totalProfit / totalRevenue }]} />
                </View>
              </View>
              <View style={styles.gaugeLegend}>
                <View style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: Colors.danger }]} /><Text style={styles.legendText}>ต้นทุน {((totalCost / totalRevenue) * 100).toFixed(1)}%</Text></View>
                <View style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: Colors.success }]} /><Text style={styles.legendText}>กำไร {avgMargin.toFixed(1)}%</Text></View>
              </View>
            </View>

            <View style={styles.gaugeRight}>
              {[
                { label: 'กำไรสูงสุด/วัน', value: `฿${formatCurrency(Math.max(...chartData.map(d => d.grossProfit)))}` },
                { label: 'Margin สูงสุด',  value: `${Math.max(...chartData.map(d => d.margin))}%` },
                { label: `วัน/เดือน${bestDay ? `(${bestDay.label})` : ''}`, value: `฿${formatCurrency(bestDay?.grossProfit ?? 0)}` },
              ].map((s, i) => (
                <View key={i} style={styles.gaugeStatRow}>
                  <Text style={styles.gaugeStatLabel}>{s.label}</Text>
                  <Text style={styles.gaugeStatValue}>{s.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </SectionCard>

        {/* Chart */}
        <SectionCard
          title={`กำไรราย${viewMode === 'day' ? 'วัน' : 'เดือน'}`}
          icon="bar-chart-outline"
          action={{ label: viewMode === 'day' ? 'รายเดือน' : 'รายวัน', onPress: () => setViewMode(v => v === 'day' ? 'month' : 'day') }}
        >
          <MiniBarChart data={barData} color={Colors.primary} color2={Colors.success} height={140} showValues />
          <View style={styles.chartLegend}>
            <View style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: Colors.primary + 'BB' }]} /><Text style={styles.legendText}>รายได้</Text></View>
            <View style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: Colors.success + '60' }]} /><Text style={styles.legendText}>กำไร</Text></View>
          </View>
        </SectionCard>

        {/* Profit by Period Table */}
        <SectionCard title={`ตารางกำไรราย${viewMode === 'day' ? 'วัน' : 'เดือน'}`} icon="document-text-outline">
          <View style={styles.tableHead}>
            <Text style={[styles.th, { flex: 0.7 }]}>ช่วง</Text>
            <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>รายได้</Text>
            <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>ต้นทุน</Text>
            <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>กำไร</Text>
            <Text style={[styles.th, { flex: 0.7, textAlign: 'right' }]}>Margin</Text>
          </View>
          {chartData.map((d, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt, d === bestDay && styles.tableRowBest]}>
              <View style={{ flex: 0.7, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {d === bestDay && <Ionicons name="trophy" size={11} color={Colors.warning} />}
                <Text style={styles.tdLabel}>{d.label}</Text>
              </View>
              <Text style={[styles.tdCell, { flex: 1.2, textAlign: 'right' }]}>฿{formatCurrency(d.revenue)}</Text>
              <Text style={[styles.tdCell, { flex: 1.2, textAlign: 'right', color: Colors.danger }]}>฿{formatCurrency(d.cost)}</Text>
              <Text style={[styles.tdCell, { flex: 1.2, textAlign: 'right', color: Colors.success, fontWeight: '700' }]}>฿{formatCurrency(d.grossProfit)}</Text>
              <View style={{ flex: 0.7, alignItems: 'flex-end' }}>
                <View style={[styles.marginBadge, { backgroundColor: d.margin >= 30 ? Colors.successLight : d.margin >= 20 ? Colors.warningLight : Colors.dangerLight }]}>
                  <Text style={[styles.marginText, { color: d.margin >= 30 ? Colors.success : d.margin >= 20 ? Colors.warning : Colors.danger }]}>
                    {d.margin}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
          {/* Total row */}
          <View style={styles.totalRow}>
            <Text style={[styles.tdLabel, { flex: 0.7 }]}>รวม</Text>
            <Text style={[styles.tdTotal, { flex: 1.2, textAlign: 'right' }]}>฿{formatCurrency(totalRevenue)}</Text>
            <Text style={[styles.tdTotal, { flex: 1.2, textAlign: 'right', color: Colors.danger }]}>฿{formatCurrency(totalCost)}</Text>
            <Text style={[styles.tdTotal, { flex: 1.2, textAlign: 'right', color: Colors.success }]}>฿{formatCurrency(totalProfit)}</Text>
            <Text style={[styles.tdTotal, { flex: 0.7, textAlign: 'right', color: Colors.primary }]}>{avgMargin.toFixed(1)}%</Text>
          </View>
        </SectionCard>

        {/* By Product */}
        <SectionCard title="กำไรตามสินค้า" icon="cube-outline">
          {MOCK_PROFIT_BY_PRODUCT.slice(0, 5).map((p, idx) => (
            <View key={p.productName} style={styles.profitProductRow}>
              <Text style={styles.profitProductRank}>{idx + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.profitProductName} numberOfLines={1}>{p.productName}</Text>
                <View style={styles.profitBarRow}>
                  <View style={[styles.profitBar, { width: `${(p.profit / MOCK_PROFIT_BY_PRODUCT[0].profit) * 100}%` }]} />
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Text style={styles.profitAmt}>฿{formatCurrency(p.profit)}</Text>
                <View style={[styles.marginBadge, { backgroundColor: p.margin >= 30 ? Colors.successLight : Colors.warningLight }]}>
                  <Text style={[styles.marginText, { color: p.margin >= 30 ? Colors.success : Colors.warning }]}>{p.margin.toFixed(1)}%</Text>
                </View>
              </View>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.success, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white, flex: 1 },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  kpiRow: { flexDirection: 'row', gap: Spacing.sm },
  kpiCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center', gap: 3, borderTopWidth: 3, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  kpiValue: { ...Typography.label, fontWeight: '800', fontSize: FontSize.body },
  kpiLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', fontSize: FontSize.xxs },
  gaugeSection: { flexDirection: 'row', gap: Spacing.md },
  gaugeLeft: { flex: 1, gap: Spacing.sm },
  gaugeValue: { fontSize: FontSize.display, fontWeight: '900', color: Colors.success },
  gaugeLabel: { ...Typography.caption, color: Colors.textSecondary },
  gaugeBar: { height: 16, backgroundColor: Colors.gray100, borderRadius: 8, overflow: 'hidden' },
  gaugeRevenueBar: { flexDirection: 'row', height: '100%' },
  gaugeCostFill: { backgroundColor: Colors.danger + '80' },
  gaugeProfitFill: { backgroundColor: Colors.success + '80' },
  gaugeLegend: { gap: 3 },
  gaugeRight: { flex: 1, gap: Spacing.sm, justifyContent: 'center' },
  gaugeStatRow: { flexDirection: 'row', justifyContent: 'space-between' },
  gaugeStatLabel: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  gaugeStatValue: { ...Typography.label, color: Colors.success, fontWeight: '700' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...Typography.caption, color: Colors.textSecondary },
  chartLegend: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'center' },
  tableHead: { flexDirection: 'row', backgroundColor: Colors.gray100, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.xs, paddingVertical: Spacing.xs },
  th: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableRowAlt: { backgroundColor: Colors.backgroundSecondary },
  tableRowBest: { backgroundColor: Colors.warningLight },
  tdLabel: { ...Typography.body2, color: Colors.text },
  tdCell: { ...Typography.body2, color: Colors.text },
  tdTotal: { ...Typography.label, fontWeight: '800' },
  marginBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: 5, paddingVertical: 2 },
  marginText: { fontSize: FontSize.xs, fontWeight: '700' },
  totalRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray100, borderRadius: BorderRadius.sm, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs, marginTop: Spacing.xs },
  profitProductRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  profitProductRank: { ...Typography.label, color: Colors.textSecondary, width: 20, textAlign: 'center' },
  profitProductName: { ...Typography.body2, color: Colors.text, fontWeight: '500' },
  profitBarRow: { height: 5, backgroundColor: Colors.gray100, borderRadius: 3, overflow: 'hidden', marginTop: 3 },
  profitBar: { height: '100%', backgroundColor: Colors.success + '80', borderRadius: 3 },
  profitAmt: { ...Typography.label, color: Colors.success, fontWeight: '700' },
});
