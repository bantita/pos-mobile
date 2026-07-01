/**
 * SCR-RPT-003 — รายงานคลังสินค้า
 * FR-RPT-003: Stock On Hand, Low Stock, Dead Stock, Inventory Value
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_STOCK_ITEMS, MOCK_INV_SUMMARY } from '../../data/mockReports';
import { StockOnHandItem } from '../../types/reports';
import { SectionCard, ExportButton } from '../../components/reports/ReportCard';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency, formatDate } from '../../utils/format';

interface Props { onBack: () => void }

type StockFilter = 'all' | 'ok' | 'low' | 'out' | 'dead';

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  ok:   { label: 'ปกติ',        color: Colors.success, bg: Colors.successLight, icon: 'checkmark-circle-outline' },
  low:  { label: 'ใกล้หมด',     color: Colors.warning, bg: Colors.warningLight, icon: 'warning-outline' },
  out:  { label: 'หมดสต๊อก',   color: Colors.danger,  bg: Colors.dangerLight,  icon: 'close-circle-outline' },
  dead: { label: 'Dead Stock',  color: Colors.gray500, bg: Colors.gray100,      icon: 'time-outline' },
};

export const InventoryReportScreen: React.FC<Props> = ({ onBack }) => {
  const [filter, setFilter] = useState<StockFilter>('all');
  const [sortBy, setSortBy] = useState<'name' | 'qty' | 'value' | 'turnover'>('qty');
  const s = MOCK_INV_SUMMARY;

  const filtered = useMemo(() => {
    let items = filter === 'all' ? [...MOCK_STOCK_ITEMS] : MOCK_STOCK_ITEMS.filter(i => i.status === filter);
    if (sortBy === 'name')     items.sort((a, b) => a.productName.localeCompare(b.productName));
    if (sortBy === 'qty')      items.sort((a, b) => a.onHandQty - b.onHandQty);
    if (sortBy === 'value')    items.sort((a, b) => b.inventoryValue - a.inventoryValue);
    if (sortBy === 'turnover') items.sort((a, b) => (b.turnover ?? 0) - (a.turnover ?? 0));
    return items;
  }, [filter, sortBy]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={Colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>รายงานคลังสินค้า</Text>
        <ExportButton onExcel={() => Alert.alert('Export')} onPdf={() => Alert.alert('PDF')} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* KPI Summary Cards */}
        <View style={styles.kpiGrid}>
          {[
            { label: 'SKU ทั้งหมด',    value: String(s.totalSKU),     color: Colors.primary, bg: Colors.primaryLight, icon: 'cube-outline',         filter: 'all' },
            { label: 'ใกล้หมด',         value: String(s.lowStockSKU),  color: Colors.warning, bg: Colors.warningLight, icon: 'warning-outline',      filter: 'low' },
            { label: 'หมดสต๊อก',       value: String(s.outOfStockSKU),color: Colors.danger,  bg: Colors.dangerLight,  icon: 'close-circle-outline', filter: 'out' },
            { label: 'Dead Stock',      value: String(s.deadStockSKU), color: Colors.gray500, bg: Colors.gray100,      icon: 'time-outline',         filter: 'dead' },
          ].map((k) => (
            <TouchableOpacity
              key={k.filter}
              style={[styles.kpiCard, { borderTopColor: k.color }, filter === k.filter && styles.kpiCardActive]}
              onPress={() => setFilter(k.filter as StockFilter)}
            >
              <View style={[styles.kpiIcon, { backgroundColor: k.bg }]}>
                <Ionicons name={k.icon as any} size={18} color={k.color} />
              </View>
              <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inventory Value */}
        <SectionCard title="มูลค่าคลังสินค้า" icon="archive-outline">
          <View style={styles.invValueRow}>
            <View style={styles.invValueMain}>
              <Text style={styles.invValueLabel}>มูลค่ารวม (At Cost)</Text>
              <Text style={styles.invValueAmount}>฿{formatCurrency(s.totalInventoryValue)}</Text>
            </View>
            <View style={styles.invValueBreakdown}>
              {['ok', 'low', 'out', 'dead'].map((st) => {
                const total = MOCK_STOCK_ITEMS.filter(i => i.status === st).reduce((s, i) => s + i.inventoryValue, 0);
                const cfg = STATUS_CFG[st];
                return (
                  <View key={st} style={styles.invBreakRow}>
                    <View style={[styles.invBreakDot, { backgroundColor: cfg.color }]} />
                    <Text style={styles.invBreakLabel}>{cfg.label}</Text>
                    <Text style={styles.invBreakValue}>฿{formatCurrency(total)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </SectionCard>

        {/* Sort + Filter */}
        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>เรียงโดย:</Text>
          {[
            { key: 'qty',      label: 'คงเหลือ' },
            { key: 'value',    label: 'มูลค่า' },
            { key: 'turnover', label: 'Turnover' },
            { key: 'name',     label: 'ชื่อ' },
          ].map((o) => (
            <TouchableOpacity key={o.key} style={[styles.sortBtn, sortBy === o.key && styles.sortBtnActive]} onPress={() => setSortBy(o.key as any)}>
              <Text style={[styles.sortBtnText, sortBy === o.key && styles.sortBtnTextActive]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stock Table */}
        <SectionCard title={`รายการสินค้า (${filtered.length})`} icon="list-outline">
          <View style={styles.tableHead}>
            <Text style={[styles.th, { flex: 2.5 }]}>สินค้า</Text>
            <Text style={[styles.th, { flex: 0.9, textAlign: 'center' }]}>คงเหลือ</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>มูลค่า</Text>
            <Text style={[styles.th, { flex: 0.9, textAlign: 'center' }]}>สถานะ</Text>
          </View>
          {filtered.map((item, idx) => {
            const cfg = STATUS_CFG[item.status];
            const pctOfMin = item.minStock > 0 ? Math.min(100, (item.onHandQty / item.minStock) * 100) : 100;
            return (
              <View key={`${item.productCode}-${item.warehouseName}`} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                <View style={{ flex: 2.5 }}>
                  <Text style={styles.tdName} numberOfLines={1}>{item.productName}</Text>
                  <Text style={styles.tdMeta}>{item.categoryName} · {item.warehouseName}</Text>
                  {/* Mini stock bar */}
                  <View style={styles.miniStockBar}>
                    <View style={[styles.miniStockFill, { width: `${pctOfMin}%`, backgroundColor: cfg.color }]} />
                  </View>
                  {item.lastMovement && (
                    <Text style={styles.lastMove}>ล่าสุด: {formatDate(item.lastMovement)}</Text>
                  )}
                </View>
                <View style={{ flex: 0.9, alignItems: 'center' }}>
                  <Text style={[styles.tdQty, { color: cfg.color }]}>{item.onHandQty}</Text>
                  <Text style={styles.tdUnit}>{item.unit}</Text>
                  {item.turnover !== undefined && (
                    <Text style={styles.turnoverText}>×{item.turnover}/ปี</Text>
                  )}
                </View>
                <Text style={[styles.tdCell, { flex: 1, textAlign: 'right', color: item.inventoryValue === 0 ? Colors.gray400 : Colors.primary }]}>
                  ฿{formatCurrency(item.inventoryValue)}
                </Text>
                <View style={{ flex: 0.9, alignItems: 'center' }}>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  <Text style={styles.minStockText}>ขั้นต่ำ {item.minStock}</Text>
                </View>
              </View>
            );
          })}
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
  kpiGrid: { flexDirection: 'row', gap: Spacing.sm },
  kpiCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center', gap: 3, borderTopWidth: 3, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  kpiCardActive: { borderWidth: 2 },
  kpiIcon: { width: 36, height: 36, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: FontSize.titleLg, fontWeight: '800' },
  kpiLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', fontSize: FontSize.xxs },
  invValueRow: { flexDirection: 'row', gap: Spacing.md },
  invValueMain: { flex: 1 },
  invValueLabel: { ...Typography.caption, color: Colors.textSecondary },
  invValueAmount: { ...Typography.h3, color: Colors.primary, fontWeight: '800', marginTop: 2 },
  invValueBreakdown: { flex: 1, gap: Spacing.xs },
  invBreakRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  invBreakDot: { width: 8, height: 8, borderRadius: 4 },
  invBreakLabel: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  invBreakValue: { ...Typography.caption, color: Colors.text, fontWeight: '600' },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  controlLabel: { ...Typography.caption, color: Colors.textSecondary },
  sortBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full, backgroundColor: Colors.gray100, borderWidth: 1, borderColor: Colors.border },
  sortBtnActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  sortBtnText: { ...Typography.caption, color: Colors.textSecondary },
  sortBtnTextActive: { color: Colors.white, fontWeight: '700' },
  tableHead: { flexDirection: 'row', backgroundColor: Colors.gray100, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.xs, paddingVertical: Spacing.xs },
  th: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700' },
  tableRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableRowAlt: { backgroundColor: Colors.backgroundSecondary },
  tdName: { ...Typography.body2, color: Colors.text, fontWeight: '500' },
  tdMeta: { ...Typography.caption, color: Colors.textSecondary },
  miniStockBar: { height: 3, backgroundColor: Colors.gray200, borderRadius: 2, marginTop: 3, overflow: 'hidden' },
  miniStockFill: { height: '100%', borderRadius: 2 },
  lastMove: { fontSize: FontSize.micro, color: Colors.gray400, marginTop: 2 },
  tdQty: { ...Typography.label, fontWeight: '800' },
  tdUnit: { ...Typography.caption, color: Colors.textSecondary },
  turnoverText: { fontSize: FontSize.xxs, color: Colors.textSecondary },
  tdCell: { ...Typography.body2, color: Colors.text },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: BorderRadius.sm, paddingHorizontal: 4, paddingVertical: 2 },
  statusText: { fontSize: FontSize.xxs, fontWeight: '700' },
  minStockText: { fontSize: FontSize.micro, color: Colors.gray400, marginTop: 2 },
});
