import { Ionicons } from '@/shared/icons/lucideAdapter';
import { AppCard } from '@/shared/ui/index';
import { cn } from '@/shared/lib/cn';
import { formatCurrency, formatNumber } from '@/shared/lib/format';
import React, { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/shared/tw/index';

type FilterPeriod = 'today' | 'week' | 'month';

interface MainDashboardScreenProps {
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
}

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

const TOP_PRODUCTS = [
  { id: '1', name: 'น้ำดื่มตราช้าง 600ml', qty: 142, revenue: 5963, rank: 1 },
  { id: '2', name: 'กาแฟโอเลี้ยง', qty: 98,  revenue: 4900, rank: 2 },
  { id: '3', name: 'ข้าวมันไก่', qty: 76,   revenue: 9120, rank: 3 },
  { id: '4', name: 'น้ำส้มคั้นสด', qty: 64,  revenue: 6400, rank: 4 },
  { id: '5', name: 'โคโค่นมสด', qty: 55,    revenue: 4125, rank: 5 },
];

const LOW_STOCK = [
  { id: '1', name: 'กาแฟสด 250g', stock: 3, minStock: 10, unit: 'ถุง' },
  { id: '2', name: 'นมสด 1L', stock: 5, minStock: 20, unit: 'กล่อง' },
  { id: '3', name: 'น้ำตาลทราย 1kg', stock: 2, minStock: 5, unit: 'ถุง' },
];

export const MainDashboardScreen: React.FC<MainDashboardScreenProps> = ({ onNavigate }) => {
  const [period, setPeriod] = useState<FilterPeriod>('today');
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline] = useState(true);
  const [pendingSync] = useState(3);

  const stats = MOCK_STATS[period];
  const chartData = CHART_DATA[period];
  const maxVal = Math.max(...chartData);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const periodLabels: Record<FilterPeriod, string> = { today: 'วันนี้', week: 'สัปดาห์นี้', month: 'เดือนนี้' };

  return (
    <SafeAreaView className="flex-1 bg-[#f6f7fb]" edges={['top']}>
      {/* Header */}
      <View className="bg-rose-500 px-4 pb-4 pt-2">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-white">Dashboard</Text>
            <Text className="text-sm font-semibold text-rose-200">ภาพรวมธุรกิจ</Text>
          </View>
          <TouchableOpacity
            className={cn('flex-row items-center gap-1 rounded-full px-3 py-1.5', isOnline ? 'bg-emerald-500/20' : 'bg-rose-500/20')}
            onPress={() => onNavigate?.('SyncStatus')}
          >
            <Ionicons name={isOnline ? 'cloud-done-outline' : 'cloud-offline-outline'} size={14} color="#fff" />
            <Text className="text-xs font-bold text-white">{isOnline ? 'Online' : 'Offline'}</Text>
            {pendingSync > 0 && (
              <View className="min-w-[18px] items-center justify-center rounded-full bg-white px-1 py-0.5">
                <Text className="text-[10px] font-extrabold text-rose-600">{pendingSync}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-8"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e11d48" />}
      >
        {/* Period Filter */}
        <View className="mb-4 flex-row gap-2">
          {(['today', 'week', 'month'] as FilterPeriod[]).map((p) => (
            <TouchableOpacity
              key={p}
              className={cn('rounded-full border px-4 py-1.5', period === p ? 'border-rose-500 bg-rose-500' : 'border-slate-200 bg-white')}
              onPress={() => setPeriod(p)}
            >
              <Text className={cn('text-xs font-bold', period === p ? 'text-white' : 'text-slate-600')}>{periodLabels[p]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* KPI Cards */}
        <View className="mb-4 flex-row flex-wrap gap-3">
          <KpiBox icon="cash-outline" label="ยอดขาย" value={`฿${formatCurrency(stats.sales)}`} color="#e11d48" bg="bg-rose-50" />
          <KpiBox icon="receipt-outline" label="จำนวนบิล" value={formatNumber(stats.bills)} sub="บิล" color="#059669" bg="bg-emerald-50" />
          <KpiBox icon="trending-up-outline" label="กำไรเบื้องต้น" value={`฿${formatCurrency(stats.profit)}`} color="#d97706" bg="bg-amber-50" />
          {period === 'month' && (
            <KpiBox icon="calendar-outline" label="ยอดขายเดือนนี้" value={`฿${formatCurrency(stats.monthly)}`} color="#7c3aed" bg="bg-violet-50" />
          )}
        </View>

        {/* Chart Card */}
        <AppCard title="ยอดขาย 7 วันย้อนหลัง" className="mb-4">
          <View className="h-[130px] flex-row items-end gap-1">
            {chartData.map((val, i) => {
              const barHeight = maxVal > 0 ? (val / maxVal) * 100 : 0;
              return (
                <View key={i} className="flex-1 items-center">
                  <Text className="mb-0.5 text-[9px] font-bold text-slate-500">
                    {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                  </Text>
                  <View className="h-[100px] w-full justify-end">
                    <View className="w-full rounded-lg" style={{ height: `${barHeight}%`, backgroundColor: '#e11d48', minHeight: 4 }} />
                  </View>
                  <Text className="mt-1 text-[10px] font-bold text-slate-500">{CHART_LABELS[i]}</Text>
                </View>
              );
            })}
          </View>
        </AppCard>

        {/* Top Products */}
        <View className="mb-2 flex-row items-center justify-between px-1">
          <Text className="text-base font-bold text-slate-950">สินค้าขายดี Top 5</Text>
        </View>
        <FlatList
          data={TOP_PRODUCTS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-3 pb-4"
          renderItem={({ item }) => (
            <View className="w-[150px] rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <View className="absolute right-2 top-2 rounded-full bg-rose-500 px-2 py-0.5">
                <Text className="text-[10px] font-extrabold text-white">#{item.rank}</Text>
              </View>
              <View className="mb-3 h-14 w-14 items-center justify-center rounded-xl bg-rose-50">
                <Ionicons name="cube-outline" size={28} color="#e11d48" />
              </View>
              <Text className="mb-1 text-sm font-bold text-slate-950" numberOfLines={2}>{item.name}</Text>
              <Text className="text-xs font-semibold text-slate-500">{formatNumber(item.qty)} ชิ้น</Text>
              <Text className="mt-1 text-sm font-extrabold text-rose-600">฿{formatCurrency(item.revenue)}</Text>
            </View>
          )}
        />

        {/* Low Stock */}
        <View className="mb-2 flex-row items-center justify-between px-1">
          <Text className="text-base font-bold text-slate-950">สินค้าใกล้หมด</Text>
          <TouchableOpacity onPress={() => onNavigate?.('StockInquiry')}>
            <Text className="text-xs font-bold text-rose-600">ดูทั้งหมด</Text>
          </TouchableOpacity>
        </View>
        <AppCard noPadding className="overflow-hidden">
          {LOW_STOCK.map((item, idx) => (
            <View key={item.id}>
              <View className="flex-row items-center gap-3 px-4 py-3">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-amber-50">
                  <Ionicons name="warning-outline" size={18} color="#d97706" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-950">{item.name}</Text>
                  <Text className="text-xs font-semibold text-slate-500">คงเหลือ {item.stock} {item.unit}</Text>
                </View>
                <View className="rounded-lg bg-amber-50 px-2.5 py-1">
                  <Text className="text-xs font-bold text-amber-700">{item.stock} {item.unit}</Text>
                </View>
              </View>
              {idx < LOW_STOCK.length - 1 && <View className="ml-4 h-px bg-slate-100" />}
            </View>
          ))}
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
};

interface KpiBoxProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  color: string;
  bg: string;
}

const KpiBox: React.FC<KpiBoxProps> = ({ icon, label, value, sub, color, bg }) => (
  <View className="min-w-[45%] flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
    <View className={cn('mb-2 h-9 w-9 items-center justify-center rounded-xl', bg)}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text className="mb-0.5 text-xs font-bold text-slate-500">{label}</Text>
    <Text className="text-lg font-extrabold" style={{ color }}>{value}</Text>
    {sub && <Text className="text-xs font-semibold text-slate-500">{sub}</Text>}
  </View>
);
