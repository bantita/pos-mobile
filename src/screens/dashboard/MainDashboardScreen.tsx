/**
 * SCR-DASH-001 — Main Dashboard Screen (Owner/Manager View)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Card } from '../../components/ui/Card';
import { formatCurrency, formatNumber } from '../../utils/format';
import { useSaleHistoryStore } from '../../store/saleHistoryStore';
import { useMemberStore } from '../../store/memberStore';
import { useProductStore } from '../../store/productStore';

// ─── Types ───────────────────────────────────────────────────────────────────
interface TopProduct {
  id: string;
  name: string;
  qty: number;
  revenue: number;
  rank: number;
}

interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
}

type FilterPeriod = 'today' | 'week' | 'month';

interface MainDashboardScreenProps {
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_STATS: Record<FilterPeriod, { sales: number; bills: number; profit: number; monthly: number }> = {
  today:  { sales: 48750, bills: 23, profit: 12430, monthly: 0 },
  week:   { sales: 312400, bills: 158, profit: 78900, monthly: 0 },
  month:  { sales: 1248600, bills: 643, profit: 315200, monthly: 1248600 },
};

const CHART_DATA: Record<FilterPeriod, number[]> = {
  today:  [8200, 11300, 6500, 9100, 7200, 3800, 2650],
  week:   [42000, 55000, 38000, 61000, 49000, 72000, 58000],
  month:  [120000, 145000, 98000, 162000, 138000, 175000, 143000],
};

const CHART_LABELS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];

const TOP_PRODUCTS: TopProduct[] = [
  { id: '1', name: 'น้ำดื่มตราช้าง 600ml', qty: 142, revenue: 5963, rank: 1 },
  { id: '2', name: 'กาแฟโอเลี้ยง', qty: 98,  revenue: 4900, rank: 2 },
  { id: '3', name: 'ข้าวมันไก่', qty: 76,   revenue: 9120, rank: 3 },
  { id: '4', name: 'น้ำส้มคั้นสด', qty: 64,  revenue: 6400, rank: 4 },
  { id: '5', name: 'โคโค่นมสด', qty: 55,    revenue: 4125, rank: 5 },
];

// ─── Component ────────────────────────────────────────────────────────────────
export const MainDashboardScreen: React.FC<MainDashboardScreenProps> = ({
  onNavigate,
}) => {
  const [period, setPeriod] = useState<FilterPeriod>('today');
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync] = useState(0);

  // ── ข้อมูลจริงจาก store ──
  const getSalesToday = useSaleHistoryStore((st) => st.getSalesToday);
  const salesAll = useSaleHistoryStore((st) => st.sales);
  const members = useMemberStore((st) => st.members);
  const products = useProductStore((st) => st.products);

  // today = ข้อมูลจริง, week/month = mock (ยังไม่มี historical aggregation จริง)
  const stats = React.useMemo(() => {
    if (period !== 'today') return MOCK_STATS[period];
    const todayCompleted = getSalesToday().filter((s) => s.status === 'completed');
    const sales = todayCompleted.reduce((sum, s) => sum + s.grandTotal, 0);
    const profit = todayCompleted.reduce(
      (sum, s) =>
        sum + s.items.reduce((p, it) => p + (it.unitPrice - (it.product.cost ?? 0)) * it.qty, 0),
      0
    );
    return { sales, bills: todayCompleted.length, profit, monthly: 0 };
  }, [period, getSalesToday, salesAll]);

  // สินค้าขายดี Top 5 — รวมจากบิล completed ทั้งหมด
  const topProducts: TopProduct[] = React.useMemo(() => {
    const agg = new Map<string, { name: string; qty: number; revenue: number }>();
    salesAll
      .filter((s) => s.status === 'completed')
      .forEach((sale) =>
        sale.items.forEach((it) => {
          const name = it.product.name;
          const prev = agg.get(name) ?? { name, qty: 0, revenue: 0 };
          prev.qty += it.qty;
          prev.revenue += it.subtotal;
          agg.set(name, prev);
        })
      );
    return [...agg.values()]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
      .map((p, i) => ({ id: String(i + 1), name: p.name, qty: p.qty, revenue: p.revenue, rank: i + 1 }));
  }, [salesAll]);

  // สินค้าใกล้หมด — stockQty <= minStock
  const lowStock: LowStockItem[] = React.useMemo(
    () =>
      products
        .filter((p) => p.stockQty <= p.minStock)
        .map((p) => ({ id: p.id, name: p.name, stock: p.stockQty, minStock: p.minStock, unit: p.unit })),
    [products]
  );

  const memberCount = members.length;

  const chartData = CHART_DATA[period];
  const maxVal = Math.max(...chartData);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const periodLabels: Record<FilterPeriod, string> = {
    today: 'วันนี้',
    week: 'สัปดาห์นี้',
    month: 'เดือนนี้',
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSub}>ภาพรวมธุรกิจ</Text>
        </View>
        <TouchableOpacity
          style={[styles.syncBadge, { backgroundColor: isOnline ? Colors.successLight : Colors.dangerLight }]}
          onPress={() => onNavigate?.('SyncStatus')}
        >
          <Ionicons
            name={isOnline ? 'cloud-done-outline' : 'cloud-offline-outline'}
            size={16}
            color={isOnline ? Colors.success : Colors.danger}
          />
          <Text style={[styles.syncText, { color: isOnline ? Colors.success : Colors.danger }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
          {pendingSync > 0 && (
            <View style={styles.syncBadgeCount}>
              <Text style={styles.syncBadgeCountText}>{pendingSync}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Period Filter */}
        <View style={styles.filterRow}>
          {(['today', 'week', 'month'] as FilterPeriod[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.filterChip, period === p && styles.filterChipActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.filterChipText, period === p && styles.filterChipTextActive]}>
                {periodLabels[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="cash-outline"
            label="ยอดขาย"
            value={`฿${formatCurrency(stats.sales)}`}
            color={Colors.primary}
            bgColor={Colors.primaryLight}
          />
          <StatCard
            icon="receipt-outline"
            label="จำนวนบิล"
            value={formatNumber(stats.bills)}
            subValue="บิล"
            color={Colors.success}
            bgColor={Colors.successLight}
          />
          <StatCard
            icon="trending-up-outline"
            label="กำไรเบื้องต้น"
            value={`฿${formatCurrency(stats.profit)}`}
            color={Colors.warning}
            bgColor={Colors.warningLight}
          />
          <StatCard
            icon="people-outline"
            label="สมาชิกทั้งหมด"
            value={formatNumber(memberCount)}
            subValue="คน"
            color={Colors.info}
            bgColor={Colors.infoLight}
          />
          {period === 'month' && (
            <StatCard
              icon="calendar-outline"
              label="ยอดขายเดือนนี้"
              value={`฿${formatCurrency(stats.monthly)}`}
              color={Colors.secondary}
              bgColor={Colors.gray100}
            />
          )}
        </View>

        {/* Bar Chart */}
        <Card style={styles.chartCard} padding="md">
          <Text style={styles.sectionTitle}>ยอดขาย 7 วันย้อนหลัง</Text>
          <View style={styles.chart}>
            {chartData.map((val, i) => {
              const barHeight = maxVal > 0 ? (val / maxVal) * 100 : 0;
              return (
                <View key={i} style={styles.barWrapper}>
                  <Text style={styles.barValue}>
                    {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                  </Text>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, { height: barHeight, backgroundColor: Colors.primary }]} />
                  </View>
                  <Text style={styles.barLabel}>{CHART_LABELS[i]}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Top Products */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>สินค้าขายดี Top 5</Text>
        </View>
        {topProducts.length === 0 ? (
          <Card style={styles.emptyCard} padding="md">
            <Ionicons name="cube-outline" size={28} color={Colors.gray400} />
            <Text style={styles.emptyText}>ยังไม่มีข้อมูลการขาย</Text>
          </Card>
        ) : (
        <FlatList
          data={topProducts}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.topProductList}
          renderItem={({ item }) => (
            <Card style={styles.topProductCard} padding="sm">
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{item.rank}</Text>
              </View>
              <View style={styles.productIconPlaceholder}>
                <Ionicons name="cube-outline" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.topProductName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.topProductQty}>{formatNumber(item.qty)} ชิ้น</Text>
              <Text style={styles.topProductRevenue}>฿{formatCurrency(item.revenue)}</Text>
            </Card>
          )}
        />
        )}

        {/* Low Stock */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>สินค้าใกล้หมด</Text>
          <TouchableOpacity onPress={() => onNavigate?.('StockInquiry')}>
            <Text style={styles.seeAll}>ดูทั้งหมด</Text>
          </TouchableOpacity>
        </View>
        <Card padding="none" style={styles.lowStockCard}>
          {lowStock.length === 0 ? (
            <View style={styles.emptyRow}>
              <Ionicons name="checkmark-circle-outline" size={22} color={Colors.success} />
              <Text style={styles.emptyText}>ไม่มีสินค้าใกล้หมด</Text>
            </View>
          ) : (
            lowStock.map((item, idx) => (
              <View key={item.id}>
                <View style={styles.lowStockRow}>
                  <View style={styles.lowStockIcon}>
                    <Ionicons name="warning-outline" size={18} color={Colors.warning} />
                  </View>
                  <View style={styles.lowStockInfo}>
                    <Text style={styles.lowStockName}>{item.name}</Text>
                    <Text style={styles.lowStockSub}>
                      คงเหลือ {item.stock} {item.unit} (ต่ำกว่า {item.minStock})
                    </Text>
                  </View>
                  <View style={[styles.stockLevel, { backgroundColor: Colors.warningLight }]}>
                    <Text style={[styles.stockLevelText, { color: Colors.warning }]}>
                      {item.stock} {item.unit}
                    </Text>
                  </View>
                </View>
                {idx < lowStock.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Sub-component: StatCard ──────────────────────────────────────────────────
interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  subValue?: string;
  color: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subValue, color, bgColor }) => (
  <Card style={styles.statCard} padding="md">
    <View style={[styles.statIconWrap, { backgroundColor: bgColor }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    {subValue && <Text style={styles.statSub}>{subValue}</Text>}
  </Card>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerTitle: { ...Typography.h3, color: Colors.white },
  headerSub: { ...Typography.caption, color: Colors.textSecondary },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  syncText: { ...Typography.caption, fontWeight: '600' },
  syncBadgeCount: {
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  syncBadgeCountText: { ...Typography.caption, color: Colors.white, fontSize: 10, fontWeight: '700' },
  scroll: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: Spacing.xxl },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { ...Typography.caption, color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.white, fontWeight: '600' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: { flex: 1, minWidth: '45%' },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 2 },
  statValue: { ...Typography.h4, fontWeight: '700' },
  statSub: { ...Typography.caption, color: Colors.textSecondary },
  chartCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 130, gap: 4 },
  barWrapper: { flex: 1, alignItems: 'center' },
  barValue: { ...Typography.caption, fontSize: 9, color: Colors.textSecondary, marginBottom: 2 },
  barContainer: { width: '100%', height: 100, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: BorderRadius.sm, minHeight: 4 },
  barLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  seeAll: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  topProductList: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, gap: Spacing.sm },
  topProductCard: { width: 140, marginBottom: Spacing.md },
  rankBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rankText: { ...Typography.caption, color: Colors.white, fontWeight: '700', fontSize: 10 },
  productIconPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  topProductName: { ...Typography.caption, color: Colors.text, marginBottom: 4, fontWeight: '500' },
  topProductQty: { ...Typography.caption, color: Colors.textSecondary },
  topProductRevenue: { ...Typography.label, color: Colors.primary, fontWeight: '700', marginTop: 2 },
  lowStockCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.md, overflow: 'hidden' },
  lowStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  lowStockIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  lowStockInfo: { flex: 1 },
  lowStockName: { ...Typography.label, color: Colors.text },
  lowStockSub: { ...Typography.caption, color: Colors.textSecondary },
  stockLevel: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  stockLevelText: { ...Typography.caption, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  emptyCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.md, alignItems: 'center', gap: Spacing.xs },
  emptyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  emptyText: { ...Typography.caption, color: Colors.textSecondary },
});
