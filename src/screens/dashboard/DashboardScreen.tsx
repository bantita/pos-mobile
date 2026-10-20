/**
 * DashboardScreen — Xcellence ERP
 * Responsive: Web = KPI row + 2 columns, Mobile = shift card + KPI 2x2 + lists
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, useWindowDimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DashboardSummary } from '../../types/dashboard';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { formatCurrency, formatDate } from '../../utils/format';
import { useSaleHistoryStore } from '../../store/saleHistoryStore';
import { useMemberStore } from '../../store/memberStore';
import { useProductStore } from '../../store/productStore';

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
  trend?: number;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, color, bgColor, trend }) => (
  <View style={[s.kpiCard, { borderTopColor: color }]}>
    <View style={[s.kpiIconBox, { backgroundColor: bgColor }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text style={s.kpiLabel}>{label}</Text>
    <Text style={[s.kpiValue, { color }]}>{value}</Text>
    {trend !== undefined && (
      <View style={s.kpiTrend}>
        <Ionicons
          name={trend >= 0 ? 'trending-up-outline' : 'trending-down-outline'}
          size={12}
          color={trend >= 0 ? Colors.success : Colors.danger}
        />
        <Text style={[s.kpiTrendText, { color: trend >= 0 ? Colors.success : Colors.danger }]}>
          {trend >= 0 ? '+' : ''}{trend}%
        </Text>
      </View>
    )}
  </View>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
interface DashboardScreenProps {
  onOpenSync?: () => void;
  onStartSale?: () => void;
  shopName?: string;
  branchName?: string;
  userName?: string;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onOpenSync, onStartSale,
  shopName = 'Xcellence ERP',
  branchName = 'สาขาหลัก',
  userName = 'เจ้าของร้าน',
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const today = new Date();

  // ── ข้อมูลจริงจาก store ──
  const getSalesToday = useSaleHistoryStore((st) => st.getSalesToday);
  const salesAll = useSaleHistoryStore((st) => st.sales);
  const members = useMemberStore((st) => st.members);
  const products = useProductStore((st) => st.products);

  const data: DashboardSummary = React.useMemo(() => {
    // ยอดขาย/จำนวนบิลวันนี้ — เฉพาะบิลที่ completed
    const todayCompleted = getSalesToday().filter((s) => s.status === 'completed');
    const todaySales = todayCompleted.reduce((sum, s) => sum + s.grandTotal, 0);
    const todayBillCount = todayCompleted.length;

    // สินค้าขายดี — รวมจำนวน/ยอดจากรายการในบิลที่ completed วันนี้
    const productAgg = new Map<string, { name: string; qty: number; amount: number }>();
    todayCompleted.forEach((sale) => {
      sale.items.forEach((item) => {
        const name = item.product.name;
        const prev = productAgg.get(name) ?? { name, qty: 0, amount: 0 };
        prev.qty += item.qty;
        prev.amount += item.subtotal;
        productAgg.set(name, prev);
      });
    });
    const topProducts = [...productAgg.values()]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // สินค้าสต๊อกต่ำ — stockQty <= minStock
    const lowStockProducts = products
      .filter((p) => p.stockQty <= p.minStock)
      .map((p) => ({ name: p.name, stockQty: p.stockQty, minStock: p.minStock }));

    return {
      todaySales,
      todayBillCount,
      todayProfit: 0,
      monthSales: 0,
      topProducts,
      lowStockProducts,
      syncStatus: 'pending',
      pendingCount: 0,
    };
  // salesAll อยู่ใน dep เพื่อให้ re-compute เมื่อมีบิลใหม่
  }, [getSalesToday, salesAll, products]);

  const memberCount = members.length;

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  // ── Header ─────────────────────────────────────────────────────────────────
  const Header = () => (
    <View style={s.header}>
      <View style={s.headerLeft}>
        <Image source={require('@/assets/logo.png')} style={s.headerLogo} resizeMode="contain" />
        <View>
          <Text style={s.headerShop}>{shopName}</Text>
          <Text style={s.headerBranch}>{branchName} · {formatDate(today)}</Text>
        </View>
      </View>
      <View style={s.headerRight}>
        {onOpenSync && (
          <TouchableOpacity style={s.syncChip} onPress={onOpenSync}>
            <Ionicons name="cloud-upload-outline" size={14} color={Colors.warning} />
            <Text style={s.syncChipText}>Sync {data.pendingCount}</Text>
          </TouchableOpacity>
        )}
        <View style={s.avatarCircle}>
          <Ionicons name="person-outline" size={18} color={Colors.primary} />
        </View>
      </View>
    </View>
  );

  // ── Mobile: Shift Card + Start Sale Button ─────────────────────────────────
  const MobileShiftCard = () => (
    <View style={s.shiftCard}>
      <View style={s.shiftInfo}>
        <Ionicons name="time-outline" size={18} color={Colors.success} />
        <View>
          <Text style={s.shiftStatus}>กะเปิดอยู่</Text>
          <Text style={s.shiftTime}>เปิดเมื่อ 08:30 · {userName}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={s.startSaleBtn}
        onPress={onStartSale}
        activeOpacity={0.85}
      >
        <Ionicons name="cart-outline" size={20} color={Colors.white} />
        <Text style={s.startSaleText}>เริ่มขายสินค้า</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Top Products Section ───────────────────────────────────────────────────
  const TopProductsSection = () => (
    <View style={s.sectionCard}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>สินค้าขายดี</Text>
        <Ionicons name="trophy-outline" size={16} color={Colors.warning} />
      </View>
      {data.topProducts.length === 0 && (
        <View style={s.emptyBox}>
          <Ionicons name="cube-outline" size={28} color={Colors.gray400} />
          <Text style={s.emptyText}>ยังไม่มีข้อมูลการขายวันนี้</Text>
        </View>
      )}
      {data.topProducts.map((p, i) => (
        <View key={i} style={s.topRow}>
          <View style={[s.rankBadge, i < 3 ? s.rankTop : null]}>
            <Text style={[s.rankText, i < 3 ? s.rankTopText : null]}>{i + 1}</Text>
          </View>
          <Text style={s.topName} numberOfLines={1}>{p.name}</Text>
          <Text style={s.topQty}>{p.qty}</Text>
          <Text style={s.topAmt}>฿{formatCurrency(p.amount)}</Text>
        </View>
      ))}
    </View>
  );

  // ── Low Stock Section ──────────────────────────────────────────────────────
  const LowStockSection = () => (
    <View style={s.sectionCard}>
      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, { color: Colors.warning }]}>แจ้งเตือนสต๊อกต่ำ</Text>
        <View style={s.alertBadge}>
          <Text style={s.alertBadgeText}>{data.lowStockProducts.length}</Text>
        </View>
      </View>
      {data.lowStockProducts.length === 0 && (
        <View style={s.emptyBox}>
          <Ionicons name="checkmark-circle-outline" size={28} color={Colors.success} />
          <Text style={s.emptyText}>ไม่มีสินค้าสต๊อกต่ำ</Text>
        </View>
      )}
      {data.lowStockProducts.map((p, i) => (
        <View key={i} style={s.stockRow}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.warning} />
          <Text style={s.stockName} numberOfLines={1}>{p.name}</Text>
          <View style={s.stockBadge}>
            <Text style={s.stockBadgeText}>เหลือ {p.stockQty}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={s.container} edges={isWide ? [] : ['top']}>
      <Header />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={s.scroll}
      >
        {/* Greeting */}
        <Text style={s.greeting}>สวัสดี, {userName} 👋</Text>

        {/* Mobile only: shift card */}
        {!isWide && <MobileShiftCard />}

        {/* KPI Row */}
        <View style={[s.kpiGrid, isWide && s.kpiGridWide]}>
          <KpiCard label="ยอดขายวันนี้" value={`฿${formatCurrency(data.todaySales)}`} icon="cash-outline" color={Colors.primary} bgColor={Colors.primaryLight} trend={12} />
          <KpiCard label="จำนวนบิล" value={`${data.todayBillCount} บิล`} icon="receipt-outline" color={Colors.success} bgColor={Colors.successLight} trend={5} />
          <KpiCard label="สมาชิกทั้งหมด" value={`${memberCount} คน`} icon="people-outline" color={Colors.info} bgColor={Colors.infoLight} />
          <KpiCard label="สต๊อกต่ำ" value={`${data.lowStockProducts.length} รายการ`} icon="alert-circle-outline" color={Colors.warning} bgColor={Colors.warningLight} />
        </View>

        {/* Content: 2 columns on wide, stacked on mobile */}
        <View style={[s.contentGrid, isWide && s.contentGridWide]}>
          <TopProductsSection />
          <LowStockSection />
        </View>

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerLogo: { width: 36, height: 36 },
  headerShop: { ...Typography.subtitle2, color: Colors.text },
  headerBranch: { ...Typography.caption, color: Colors.textSecondary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  syncChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.warningLight, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  syncChipText: { ...Typography.caption, color: Colors.warning, fontWeight: '600' },
  avatarCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },

  // Scroll
  scroll: { padding: Spacing.lg, gap: Spacing.lg },
  greeting: { ...Typography.h3, color: Colors.text },

  // Shift card (mobile)
  shiftCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.lg, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  shiftInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  shiftStatus: { ...Typography.label, color: Colors.success },
  shiftTime: { ...Typography.caption, color: Colors.textSecondary },
  startSaleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
  },
  startSaleText: { ...Typography.button, color: Colors.white },

  // KPI Grid
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  kpiGridWide: { flexWrap: 'nowrap' },
  kpiCard: {
    flex: 1, minWidth: 150, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, padding: Spacing.md,
    borderTopWidth: 3, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', gap: Spacing.xs, ...Shadow.sm,
  },
  kpiIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  kpiLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  kpiValue: { ...Typography.subtitle1, fontWeight: '800', textAlign: 'center' },
  kpiTrend: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  kpiTrendText: { ...Typography.caption, fontWeight: '600' },

  // Content grid
  contentGrid: { gap: Spacing.lg },
  contentGridWide: { flexDirection: 'row' },

  // Section card
  sectionCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.lg, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  sectionTitle: { ...Typography.subtitle2, color: Colors.text },
  emptyBox: { alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.lg },
  emptyText: { ...Typography.caption, color: Colors.textSecondary },

  // Top products
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  rankBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center',
  },
  rankTop: { backgroundColor: Colors.warningLight },
  rankText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700' },
  rankTopText: { color: Colors.warning },
  topName: { ...Typography.body2, color: Colors.text, flex: 1 },
  topQty: { ...Typography.caption, color: Colors.textSecondary, width: 40, textAlign: 'right' },
  topAmt: { ...Typography.label, color: Colors.primary, width: 60, textAlign: 'right' },

  // Low stock
  alertBadge: { backgroundColor: Colors.warningLight, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  alertBadgeText: { ...Typography.caption, color: Colors.warning, fontWeight: '700' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  stockName: { ...Typography.body2, color: Colors.text, flex: 1 },
  stockBadge: { backgroundColor: Colors.warningLight, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  stockBadgeText: { ...Typography.caption, color: Colors.warning, fontWeight: '700' },
});
