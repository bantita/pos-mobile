import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { Colors, Space, Radius, Shadow, Font } from '../../design-system/tokens';
import { MOCK_SALES_SUMMARY, MOCK_TOP_PRODUCTS, MOCK_STOCK_ITEMS } from '../../data/mockReports';
import { MOCK_SALES_BY_DAY } from '../../data/mockReports';

const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });

// Simple bar chart
const BarChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.value));
  return (
    <View style={bc.wrap}>
      {data.map((d, i) => (
        <View key={i} style={bc.col}>
          <View style={bc.barWrap}>
            <View style={[bc.bar, { height: `${(d.value / max) * 100}%` as any }]} />
          </View>
          <Text style={bc.label}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
};
const bc = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', height: 180, gap: 8, paddingBottom: 20 },
  col: { flex: 1, alignItems: 'center', height: '100%' as any },
  barWrap: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: WebColors.primary, borderRadius: 8 },
  label: { fontSize: 13, color: WebColors.textSecondary, marginTop: 4 },
});

export const WebDashboardScreen: React.FC = () => {
  const s = MOCK_SALES_SUMMARY;
  const kpis = [
    { label: 'ยอดขายวันนี้',  value: `฿${fmt(s.totalSales)}`,    icon: 'cash-outline',        color: WebColors.primary  },
    { label: 'จำนวนบิล',      value: `${s.totalBills}`,          icon: 'receipt-outline',     color: WebColors.success  },
    { label: 'กำไรวันนี้',    value: `฿${fmt(s.totalSales * 0.25)}`, icon: 'trending-up-outline', color: WebColors.warning   },
    { label: 'เฉลี่ยต่อบิล', value: `฿${fmt(s.avgPerBill)}`,    icon: 'analytics-outline',   color: WebColors.purple   },
  ];

  const lowStock = MOCK_STOCK_ITEMS.filter(i => i.status === 'low');
  const outStock  = MOCK_STOCK_ITEMS.filter(i => i.status === 'out');

  return (
    <View style={styles.root}>
      {/* KPI row */}
      <View style={styles.kpiRow}>
        {kpis.map((k, i) => (
          <View key={i} style={styles.kpiCard}>
            <View>
              <Text style={styles.kpiLabel}>{k.label}</Text>
              <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
            </View>
            <View style={[styles.kpiIcon, { backgroundColor: k.color + '18' }]}>
              <Ionicons name={k.icon as any} size={24} color={k.color} />
            </View>
          </View>
        ))}
      </View>

      {/* Main content row */}
      <View style={styles.mainRow}>
        {/* Chart */}
        <View style={[styles.card, { flex: 1.4 }]}>
          <Text style={styles.cardTitle}>ยอดขาย 5 วันล่าสุด</Text>
          <BarChart data={MOCK_SALES_BY_DAY.map(d => ({ label: d.label, value: d.sales }))} />
        </View>

        {/* Top products */}
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardTitle}>สินค้าขายดี</Text>
          {MOCK_TOP_PRODUCTS.slice(0, 5).map((p, i) => (
            <View key={i} style={styles.topRow}>
              <View style={[styles.rank, i < 3 && styles.rankTop]}>
                <Text style={[styles.rankText, i < 3 && { color: WebColors.white }]}>{i + 1}</Text>
              </View>
              <Text style={styles.topName} numberOfLines={1}>{p.productName}</Text>
              <Text style={styles.topAmt}>฿{p.revenue.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom row */}
      <View style={styles.mainRow}>
        {/* Low stock */}
        <View style={[styles.card, { flex: 1 }]}>
          <View style={styles.alertHeader}>
            <Ionicons name="warning-outline" size={16} color={WebColors.warning} />
            <Text style={[styles.cardTitle, { color: WebColors.warning, marginBottom: 0 }]}>
              สินค้าใกล้หมด {lowStock.length > 0 && <Text style={styles.countBadge}>{lowStock.length}</Text>}
            </Text>
          </View>
          {lowStock.length === 0 ? <Text style={styles.emptyText}>ไม่มีสินค้าใกล้หมด</Text> : lowStock.map((item, i) => (
            <View key={i} style={styles.stockRow}>
              <Text style={styles.stockName} numberOfLines={1}>{item.productName}</Text>
              <View style={styles.badgeWarn}><Text style={styles.badgeWarnText}>{item.onHandQty} {item.unit}</Text></View>
            </View>
          ))}
        </View>

        {/* Out of stock */}
        <View style={[styles.card, { flex: 1 }]}>
          <View style={styles.alertHeader}>
            <Ionicons name="close-circle-outline" size={16} color={WebColors.danger} />
            <Text style={[styles.cardTitle, { color: WebColors.danger, marginBottom: 0 }]}>
              สินค้าหมด {outStock.length > 0 && <Text style={[styles.countBadge, { backgroundColor: WebColors.danger }]}>{outStock.length}</Text>}
            </Text>
          </View>
          {outStock.length === 0 ? <Text style={styles.emptyText}>ไม่มีสินค้าหมด</Text> : outStock.map((item, i) => (
            <View key={i} style={styles.stockRow}>
              <Text style={styles.stockName} numberOfLines={1}>{item.productName}</Text>
              <View style={styles.badgeDanger}><Text style={styles.badgeDangerText}>หมด</Text></View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: 20 },
  kpiRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  kpiCard: { flex: 1, minWidth: 200, backgroundColor: WebColors.white, borderRadius: 12, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: WebColors.border },
  kpiLabel: { fontSize: 12, color: WebColors.textSecondary, marginBottom: 6 },
  kpiValue: { fontSize: 16, fontWeight: '800' },
  kpiIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mainRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  card: { backgroundColor: WebColors.white, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: WebColors.border },
  cardTitle: { fontSize: 12, fontWeight: '700', color: WebColors.text, marginBottom: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: WebColors.border, gap: 8 },
  rank: { width: 24, height: 24, borderRadius: 12, backgroundColor: WebColors.gray100, alignItems: 'center', justifyContent: 'center' },
  rankTop: { backgroundColor: WebColors.primary },
  rankText: { fontSize: 13, fontWeight: '700', color: WebColors.textSecondary },
  topName: { flex: 1, fontSize: 12, color: WebColors.text },
  topAmt: { fontSize: 12, fontWeight: '700', color: WebColors.primary },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  countBadge: { fontSize: 13, fontWeight: '800', backgroundColor: WebColors.warning, color: WebColors.white, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1, overflow: 'hidden' },
  stockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: WebColors.border },
  stockName: { flex: 1, fontSize: 12, color: WebColors.text },
  badgeWarn: { backgroundColor: WebColors.warningLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeWarnText: { fontSize: 13, fontWeight: '700', color: WebColors.warning },
  badgeDanger: { backgroundColor: WebColors.dangerLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeDangerText: { fontSize: 13, fontWeight: '700', color: WebColors.danger },
  emptyText: { fontSize: 12, color: WebColors.textDisabled, fontStyle: 'italic' },
});
