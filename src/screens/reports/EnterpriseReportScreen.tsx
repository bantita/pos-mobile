/**
 * SCR-RPT-005 — รายงาน Enterprise
 * FR-RPT-005: เปรียบเทียบสาขา POS KPI Inventory Turnover GMROI
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_BRANCH_KPI, MOCK_POS_PERFORMANCE } from '../../data/mockReports';
import { DateRangePicker, getDefaultRange } from '../../components/reports/DateRangePicker';
import { SectionCard, ExportButton } from '../../components/reports/ReportCard';
import { MiniBarChart } from '../../components/reports/MiniBarChart';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency } from '../../utils/format';

interface Props { onBack: () => void }

type Metric = 'sales' | 'profit' | 'margin' | 'turnover' | 'gmroi';

const METRICS: { key: Metric; label: string; unit: string; color: string }[] = [
  { key: 'sales',    label: 'ยอดขาย',        unit: '฿',  color: Colors.primary },
  { key: 'profit',   label: 'กำไร',           unit: '฿',  color: Colors.success },
  { key: 'margin',   label: 'Margin%',        unit: '%',  color: Colors.category1 },
  { key: 'turnover', label: 'Inv. Turnover',  unit: 'x',  color: Colors.warning },
  { key: 'gmroi',    label: 'GMROI',          unit: 'x',  color: Colors.primary },
];

export const EnterpriseReportScreen: React.FC<Props> = ({ onBack }) => {
  const [dateRange, setDateRange] = useState(getDefaultRange());
  const [activeMetric, setActiveMetric] = useState<Metric>('sales');

  const metricCfg = METRICS.find(m => m.key === activeMetric)!;
  const totalSales  = MOCK_BRANCH_KPI.reduce((s, b) => s + b.sales, 0);
  const totalProfit = MOCK_BRANCH_KPI.reduce((s, b) => s + b.profit, 0);
  const avgMargin   = (totalProfit / totalSales * 100).toFixed(1);

  const chartData = MOCK_BRANCH_KPI.map(b => ({
    label: b.branchName.substring(0, 5),
    value: (b as any)[activeMetric],
    highlight: (b as any)[activeMetric] === Math.max(...MOCK_BRANCH_KPI.map(x => (x as any)[activeMetric])),
  }));

  const topBranch = [...MOCK_BRANCH_KPI].sort((a, b) => b.sales - a.sales)[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={Colors.white} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Enterprise Report</Text>
          <Text style={styles.headerSub}>เปรียบเทียบสาขา · Phase 2</Text>
        </View>
        <ExportButton onExcel={() => Alert.alert('Export Excel')} onPdf={() => Alert.alert('Export PDF')} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        {/* Overall KPIs */}
        <View style={styles.overallRow}>
          {[
            { label: 'รายได้รวมทุกสาขา', value: `฿${formatCurrency(totalSales)}`,  color: Colors.primary, icon: 'business-outline' },
            { label: 'กำไรรวม',           value: `฿${formatCurrency(totalProfit)}`, color: Colors.success, icon: 'trending-up-outline' },
            { label: 'Avg Margin',         value: `${avgMargin}%`,                  color: Colors.category1,      icon: 'pie-chart-outline' },
            { label: 'จำนวนสาขา',          value: String(MOCK_BRANCH_KPI.length),  color: Colors.warning, icon: 'map-outline' },
          ].map((k, i) => (
            <View key={i} style={[styles.overallCard, { borderTopColor: k.color }]}>
              <Ionicons name={k.icon as any} size={16} color={k.color} />
              <Text style={[styles.overallValue, { color: k.color }]}>{k.value}</Text>
              <Text style={styles.overallLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* Metric Selector */}
        <SectionCard title="เลือก KPI ที่ต้องการเปรียบเทียบ" icon="options-outline">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricList}>
            {METRICS.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[styles.metricBtn, activeMetric === m.key && { backgroundColor: m.color, borderColor: m.color }]}
                onPress={() => setActiveMetric(m.key)}
              >
                <Text style={[styles.metricBtnText, activeMetric === m.key && { color: Colors.white }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <MiniBarChart
            data={chartData}
            color={metricCfg.color}
            height={140}
            showValues
            formatValue={(v) => metricCfg.unit === '฿' ? `${(v / 1000).toFixed(0)}K` : `${v.toFixed(1)}${metricCfg.unit}`}
          />
        </SectionCard>

        {/* Branch Comparison Table */}
        <SectionCard title="เปรียบเทียบสาขา" icon="git-compare-outline">
          <View style={styles.tableHead}>
            <Text style={[styles.th, { flex: 1.5 }]}>สาขา</Text>
            <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>ยอดขาย</Text>
            <Text style={[styles.th, { flex: 0.7, textAlign: 'right' }]}>Margin</Text>
            <Text style={[styles.th, { flex: 0.8, textAlign: 'right' }]}>Turnover</Text>
            <Text style={[styles.th, { flex: 0.7, textAlign: 'right' }]}>GMROI</Text>
          </View>
          {MOCK_BRANCH_KPI.map((b, idx) => {
            const isTop = b.branchId === topBranch.branchId || b.branchName === topBranch.branchName;
            const salesPct = (b.sales / totalSales * 100).toFixed(0);
            return (
              <View key={b.branchId} style={[styles.branchRow, idx % 2 === 1 && styles.branchRowAlt]}>
                <View style={{ flex: 1.5 }}>
                  <View style={styles.branchNameRow}>
                    {isTop && <Ionicons name="trophy" size={11} color={Colors.warning} />}
                    <Text style={styles.branchName}>{b.branchName}</Text>
                  </View>
                  <View style={styles.branchBar}>
                    <View style={[styles.branchBarFill, { width: `${salesPct}%` as any }]} />
                  </View>
                  <Text style={styles.branchPct}>{salesPct}% ของยอดรวม</Text>
                </View>
                <Text style={[styles.branchCell, { flex: 1.2, textAlign: 'right', color: Colors.primary }]}>฿{formatCurrency(b.sales)}</Text>
                <View style={{ flex: 0.7, alignItems: 'flex-end' }}>
                  <Text style={[styles.branchCell, { color: b.margin >= 25 ? Colors.success : Colors.warning }]}>{b.margin}%</Text>
                </View>
                <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
                  <View style={[styles.kpiBadge, { backgroundColor: b.inventoryTurnover >= 8 ? Colors.successLight : Colors.warningLight }]}>
                    <Text style={[styles.kpiBadgeText, { color: b.inventoryTurnover >= 8 ? Colors.success : Colors.warning }]}>
                      {b.inventoryTurnover}x
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 0.7, alignItems: 'flex-end' }}>
                  <View style={[styles.kpiBadge, { backgroundColor: b.gmroi >= 18 ? Colors.successLight : Colors.primaryLight }]}>
                    <Text style={[styles.kpiBadgeText, { color: b.gmroi >= 18 ? Colors.success : Colors.primary }]}>
                      {b.gmroi}x
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </SectionCard>

        {/* POS Performance */}
        <SectionCard title="ประสิทธิภาพ POS" icon="tablet-portrait-outline">
          {MOCK_POS_PERFORMANCE.map((pos, idx) => {
            const maxSales = Math.max(...MOCK_POS_PERFORMANCE.map(p => p.sales));
            const pct = (pos.sales / maxSales * 100).toFixed(0);
            return (
              <View key={idx} style={styles.posRow}>
                <View style={[styles.posIcon, { backgroundColor: idx === 0 ? Colors.primaryLight : Colors.gray100 }]}>
                  <Ionicons name="tablet-portrait-outline" size={16} color={idx === 0 ? Colors.primary : Colors.gray500} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.posName}>{pos.posName}</Text>
                  <Text style={styles.posMeta}>{pos.branchName} · {pos.cashierName}</Text>
                  <View style={styles.posBar}>
                    <View style={[styles.posBarFill, { width: `${pct}%` as any }]} />
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.posSales}>฿{formatCurrency(pos.sales)}</Text>
                  <Text style={styles.posDetail}>{pos.bills} บิล · ฿{formatCurrency(pos.avgPerBill)}/บิล</Text>
                </View>
              </View>
            );
          })}
        </SectionCard>

        {/* GMROI Explainer */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>คำอธิบาย KPI</Text>
            <Text style={styles.infoText}>
              <Text style={{ fontWeight: '700' }}>Inventory Turnover</Text> = รอบหมุนเวียนสินค้า (ครั้ง/ปี){'\n'}
              <Text style={{ fontWeight: '700' }}>GMROI</Text> = Gross Margin Return on Inventory Investment{'\n'}
              GMROI ≥ 15 = ดีมาก · 10-15 = ดี · &lt;10 = ควรปรับปรุง
            </Text>
          </View>
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
  overallRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  overallCard: { width: '47.5%', flexGrow: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center', gap: 3, borderTopWidth: 3, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  overallValue: { ...Typography.label, fontWeight: '800' },
  overallLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', fontSize: FontSize.xxs },
  metricList: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  metricBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.gray100, borderWidth: 1.5, borderColor: Colors.border },
  metricBtnText: { ...Typography.body2, color: Colors.textSecondary, fontWeight: '500' },
  tableHead: { flexDirection: 'row', backgroundColor: Colors.gray100, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.xs, paddingVertical: Spacing.xs },
  th: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700' },
  branchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  branchRowAlt: { backgroundColor: Colors.backgroundSecondary },
  branchNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  branchName: { ...Typography.label, color: Colors.text },
  branchBar: { height: 4, backgroundColor: Colors.gray200, borderRadius: 2, overflow: 'hidden', marginTop: 2 },
  branchBarFill: { height: '100%', backgroundColor: Colors.primary + '80', borderRadius: 2 },
  branchPct: { fontSize: FontSize.xxs, color: Colors.textSecondary, marginTop: 2 },
  branchCell: { ...Typography.body2, color: Colors.text },
  kpiBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: 5, paddingVertical: 2 },
  kpiBadgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  posRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  posIcon: { width: 36, height: 36, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  posName: { ...Typography.label, color: Colors.text },
  posMeta: { ...Typography.caption, color: Colors.textSecondary },
  posBar: { height: 4, backgroundColor: Colors.gray100, borderRadius: 2, overflow: 'hidden', marginTop: 3 },
  posBarFill: { height: '100%', backgroundColor: Colors.primary + '80', borderRadius: 2 },
  posSales: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
  posDetail: { ...Typography.caption, color: Colors.textSecondary },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.md, padding: Spacing.md },
  infoTitle: { ...Typography.label, color: Colors.primary, marginBottom: 3 },
  infoText: { ...Typography.caption, color: Colors.primary, lineHeight: 18 },
});
