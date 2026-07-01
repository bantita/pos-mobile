/**
 * SCR-RPT-002 — รายงานสินค้า
 * FR-RPT-002: วิเคราะห์สินค้าขายดี Category Brand Margin
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_TOP_PRODUCTS } from '../../data/mockReports';
import { ProductSalesItem } from '../../types/reports';
import { DateRangePicker, getDefaultRange } from '../../components/reports/DateRangePicker';
import { SectionCard, ExportButton } from '../../components/reports/ReportCard';
import { MiniBarChart } from '../../components/reports/MiniBarChart';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency } from '../../utils/format';

interface Props { onBack: () => void }

type SortBy = 'revenue' | 'qty' | 'profit' | 'margin';

const SORT_OPTS: { key: SortBy; label: string }[] = [
  { key: 'revenue', label: 'ยอดขาย' },
  { key: 'qty',     label: 'จำนวน' },
  { key: 'profit',  label: 'กำไร' },
  { key: 'margin',  label: 'Margin%' },
];

export const ProductReportScreen: React.FC<Props> = ({ onBack }) => {
  const [dateRange, setDateRange] = useState(getDefaultRange());
  const [sortBy, setSortBy] = useState<SortBy>('revenue');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [showTop, setShowTop] = useState(5);

  const categories = ['ทั้งหมด', ...Array.from(new Set(MOCK_TOP_PRODUCTS.map(p => p.categoryName)))];

  const sorted = useMemo(() => {
    let items = selectedCategory === 'ทั้งหมด'
      ? [...MOCK_TOP_PRODUCTS]
      : MOCK_TOP_PRODUCTS.filter(p => p.categoryName === selectedCategory);
    items.sort((a, b) => (b as any)[sortBy] - (a as any)[sortBy]);
    return items.slice(0, showTop);
  }, [sortBy, selectedCategory, showTop]);

  const totalRevenue = MOCK_TOP_PRODUCTS.reduce((s, p) => s + p.revenue, 0);
  const totalProfit  = MOCK_TOP_PRODUCTS.reduce((s, p) => s + p.profit, 0);
  const avgMargin    = (totalProfit / totalRevenue * 100).toFixed(1);

  const chartData = sorted.slice(0, 6).map(p => ({
    label: p.productName.substring(0, 6),
    value: p.revenue,
    value2: p.profit,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={Colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>รายงานสินค้า</Text>
        <ExportButton onExcel={() => Alert.alert('Export Excel')} onPdf={() => Alert.alert('Export PDF')} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        {/* Summary */}
        <View style={styles.summaryRow}>
          {[
            { label: 'รายได้รวม',    value: `฿${formatCurrency(totalRevenue)}`, color: Colors.primary, icon: 'cash-outline' },
            { label: 'กำไรรวม',     value: `฿${formatCurrency(totalProfit)}`,  color: Colors.success, icon: 'trending-up-outline' },
            { label: 'Avg Margin',  value: `${avgMargin}%`,                    color: Colors.category1,      icon: 'pie-chart-outline' },
          ].map((s, i) => (
            <View key={i} style={[styles.summCard, { borderTopColor: s.color }]}>
              <Ionicons name={s.icon as any} size={18} color={s.color} />
              <Text style={[styles.summValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.summLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catList}>
          {categories.map((c) => (
            <TouchableOpacity key={c} style={[styles.catChip, selectedCategory === c && styles.catChipActive]} onPress={() => setSelectedCategory(c)}>
              <Text style={[styles.catChipText, selectedCategory === c && styles.catChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sort By */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>เรียงโดย:</Text>
          {SORT_OPTS.map((s) => (
            <TouchableOpacity key={s.key} style={[styles.sortBtn, sortBy === s.key && styles.sortBtnActive]} onPress={() => setSortBy(s.key)}>
              <Text style={[styles.sortBtnText, sortBy === s.key && styles.sortBtnTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bar Chart */}
        <SectionCard title={`Top 6 สินค้า (${sortBy === 'revenue' ? 'ยอดขาย' : sortBy === 'qty' ? 'จำนวน' : sortBy === 'profit' ? 'กำไร' : 'Margin'})`} icon="bar-chart-outline">
          <MiniBarChart data={chartData} color={Colors.primary} color2={Colors.success} height={130} showValues />
        </SectionCard>

        {/* Product Table */}
        <SectionCard
          title={`รายการสินค้า (${sorted.length})`}
          icon="cube-outline"
          action={showTop < MOCK_TOP_PRODUCTS.length ? { label: `ดูทั้งหมด (${MOCK_TOP_PRODUCTS.length})`, onPress: () => setShowTop(MOCK_TOP_PRODUCTS.length) } : undefined}
        >
          {/* Table header */}
          <View style={styles.tableHead}>
            <Text style={[styles.th, { flex: 0.4, textAlign: 'center' }]}>#</Text>
            <Text style={[styles.th, { flex: 2.5 }]}>สินค้า</Text>
            <Text style={[styles.th, { flex: 0.9, textAlign: 'right' }]}>ขาย</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>รายได้</Text>
            <Text style={[styles.th, { flex: 0.8, textAlign: 'right' }]}>Margin</Text>
          </View>
          {sorted.map((p, idx) => (
            <View key={p.productCode} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
              <View style={[styles.rank, { flex: 0.4, alignItems: 'center' }, idx < 3 && { backgroundColor: Colors.primary }]}>
                <Text style={[styles.rankText, idx < 3 && { color: Colors.white }]}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 2.5 }}>
                <Text style={styles.tdName} numberOfLines={1}>{p.productName}</Text>
                <Text style={styles.tdMeta}>{p.categoryName}{p.brandName ? ` · ${p.brandName}` : ''}</Text>
              </View>
              <Text style={[styles.tdCell, { flex: 0.9, textAlign: 'right' }]}>{p.unitsSold} {p.unit}</Text>
              <Text style={[styles.tdCell, { flex: 1, textAlign: 'right', color: Colors.primary, fontWeight: '700' }]}>฿{formatCurrency(p.revenue)}</Text>
              <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
                <View style={[styles.marginBadge, { backgroundColor: p.margin >= 30 ? Colors.successLight : p.margin >= 20 ? Colors.warningLight : Colors.dangerLight }]}>
                  <Text style={[styles.marginText, { color: p.margin >= 30 ? Colors.success : p.margin >= 20 ? Colors.warning : Colors.danger }]}>
                    {p.margin.toFixed(1)}%
                  </Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.category1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white, flex: 1 },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm },
  summCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', gap: 4, borderTopWidth: 3, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  summValue: { ...Typography.label, fontWeight: '800' },
  summLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  catList: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  catChip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  catChipActive: { backgroundColor: Colors.category1, borderColor: Colors.category1 },
  catChipText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '500' },
  catChipTextActive: { color: Colors.white, fontWeight: '700' },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  sortLabel: { ...Typography.caption, color: Colors.textSecondary },
  sortBtn: { paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: BorderRadius.full, backgroundColor: Colors.gray100, borderWidth: 1, borderColor: Colors.border },
  sortBtnActive: { backgroundColor: Colors.category1, borderColor: Colors.category1 },
  sortBtnText: { ...Typography.caption, color: Colors.textSecondary },
  sortBtnTextActive: { color: Colors.white, fontWeight: '700' },
  tableHead: { flexDirection: 'row', backgroundColor: Colors.gray100, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.xs, paddingVertical: Spacing.xs },
  th: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700' },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableRowAlt: { backgroundColor: Colors.backgroundSecondary },
  rank: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.gray200, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  tdName: { ...Typography.body2, color: Colors.text, fontWeight: '500' },
  tdMeta: { ...Typography.caption, color: Colors.textSecondary },
  tdCell: { ...Typography.body2, color: Colors.text },
  marginBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: 5, paddingVertical: 2 },
  marginText: { fontSize: FontSize.xs, fontWeight: '700' },
});
