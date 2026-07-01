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

const LOW_STOCK: LowStockItem[] = [
  { id: '1', name: 'กาแฟสด 250g', stock: 3, minStock: 10, unit: 'ถุง' },
  { id: '2', name: 'นมสด 1L', stock: 5, minStock: 20, unit: 'กล่อง' },
  { id: '3', name: 'น้ำตาลทราย 1kg', stock: 2, minStock: 5, unit: 'ถุง' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export const MainDashboardScreen: React.FC<MainDashboardScreenProps> = ({
  onNavigate,
}) => {
  const [period, setPeriod] = useState<FilterPeriod>('today');
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync] = useState(3);

  const stats = MOCK_STATS[period];
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
        <FlatList
          data={TOP_PRODUCTS}
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

        {/* Low Stock */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>สินค้าใกล้หมด</Text>
          <TouchableOpacity onPress={() => onNavigate?.('StockInquiry')}>
            <Text style={styles.seeAll}>ดูทั้งหมด</Text>
          </TouchableOpacity>
        </View>
        <Card padding="none" style={styles.lowStockCard}>
          {LOW_STOCK.map((item, idx) => (
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
              {idx < LOW_STOCK.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
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
});
