import { DashboardSummary } from '@/features/dashboard/domain/dashboard';
import { APP_LOGO } from '@/shared/constants/logo';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { Text } from '@/shared/tw/index';
import React, { useCallback, useState } from 'react';
import { Image, RefreshControl, ScrollView, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MOCK: DashboardSummary = {
  todaySales: 15420,
  todayBillCount: 47,
  todayProfit: 4230,
  monthSales: 328000,
  topProducts: [
    { name: 'น้ำดื่มสิงห์ 600ml', qty: 85, amount: 850 },
    { name: 'เลย์ รสออริจินัล', qty: 60, amount: 1200 },
    { name: 'มาม่า หมูสับ', qty: 55, amount: 385 },
    { name: 'น้ำอัดลม Pepsi', qty: 48, amount: 720 },
    { name: 'กาแฟ Nescafe', qty: 42, amount: 504 },
  ],
  lowStockProducts: [
    { name: 'สบู่ Dove', stockQty: 3, minStock: 10 },
    { name: 'แชมพู Head & Shoulders', stockQty: 2, minStock: 5 },
    { name: 'ยาสีฟัน Colgate', stockQty: 4, minStock: 8 },
  ],
  syncStatus: 'pending',
  pendingCount: 3,
};

interface Props {
  onOpenSync?: () => void;
  onStartSale?: () => void;
  shopName?: string;
  branchName?: string;
  userName?: string;
}

export const DashboardScreen: React.FC<Props> = ({
  onOpenSync, onStartSale,
  shopName = 'Xcellence POS',
  branchName = 'สาขาหลัก',
  userName = 'เจ้าของร้าน',
}) => {
  const [data] = useState<DashboardSummary>(MOCK);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const today = new Date();

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#f6f7fb]" edges={['top']}>
      {/* ── Header ── */}
      <View className="border-b border-slate-100 bg-white px-5 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-rose-100 bg-rose-50">
              <Image source={APP_LOGO} className="h-7 w-7" resizeMode="contain" />
            </View>
            <View>
              <Text className="text-base font-bold text-slate-950">{shopName}</Text>
              <Text className="text-xs font-semibold text-slate-500">
                {branchName} · {formatDate(today)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            {onOpenSync && data.pendingCount > 0 && (
              <TouchableOpacity
                className="flex-row items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5"
                onPress={onOpenSync}
                activeOpacity={0.8}
              >
                <Ionicons name="cloud-upload-outline" size={14} color="#d97706" />
                <Text className="text-xs font-bold text-amber-700">Sync {data.pendingCount}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="h-9 w-9 items-center justify-center rounded-xl bg-rose-50"
              onPress={() => setShowNotifications(true)}
            >
              <Ionicons name="notifications-outline" size={18} color="#e11d48" />
            </TouchableOpacity>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-rose-500">
              <Text className="text-xs font-bold text-white">{userName.charAt(0)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Main Content ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#e11d48" />}
        contentContainerClassName="p-5 pb-10"
      >
        <View className="gap-5">
          {/* Greeting */}
          <View>
            <Text className="text-2xl font-bold text-slate-950">สวัสดี, {userName}</Text>
            <Text className="mt-1 text-sm font-semibold text-slate-500">นี่คือภาพรวมร้านวันนี้</Text>
          </View>

          {/* Quick Action — เริ่มขาย */}
          {!isWide && (
            <View className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm">
              <View className="flex-row items-center gap-4 p-5">
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-2">
                    <View className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <Text className="text-xs font-bold text-emerald-700">กะเปิดอยู่</Text>
                  </View>
                  <Text className="text-sm font-semibold text-slate-500">
                    เปิดเมื่อ 08:30 · {userName}
                  </Text>
                </View>
                <TouchableOpacity
                  className="flex-row items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 shadow-sm active:bg-rose-600"
                  onPress={onStartSale}
                  activeOpacity={0.85}
                >
                  <Ionicons name="cart-outline" size={18} color="#fff" />
                  <Text className="text-sm font-bold text-white">เริ่มขาย</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── KPI Cards ── */}
          <View className={cn('gap-3', isWide ? 'flex-row' : 'flex-row flex-wrap')}>
            <KpiCard label="ยอดขายวันนี้" value={`฿${formatCurrency(data.todaySales)}`} icon="wallet-outline" iconBg="bg-rose-50" iconColor="#e11d48" trend={12} />
            <KpiCard label="จำนวนบิล" value={`${data.todayBillCount}`} icon="receipt-outline" iconBg="bg-emerald-50" iconColor="#059669" trend={5} />
            <KpiCard label="กำไรวันนี้" value={`฿${formatCurrency(data.todayProfit)}`} icon="trending-up-outline" iconBg="bg-violet-50" iconColor="#7c3aed" trend={8} />
            <KpiCard label="สต๊อกต่ำ" value={`${data.lowStockProducts.length} รายการ`} icon="alert-circle-outline" iconBg="bg-amber-50" iconColor="#d97706" />
          </View>

          {/* ── Month Stats ── */}
          <View className="flex-row items-center justify-between rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4">
            <View className="gap-0.5">
              <Text className="text-xs font-bold text-rose-600">ยอดขายเดือนนี้</Text>
              <Text className="text-xl font-extrabold text-rose-700">฿{formatCurrency(data.monthSales)}</Text>
            </View>
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
              <Ionicons name="bar-chart-outline" size={20} color="#e11d48" />
            </View>
          </View>

          {/* Desktop: Quick Action */}
          {isWide && (
            <View className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm">
              <View className="flex-row items-center gap-4 p-5">
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-2">
                    <View className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <Text className="text-xs font-bold text-emerald-700">กะเปิดอยู่</Text>
                  </View>
                  <Text className="text-sm font-semibold text-slate-500">เปิดเมื่อ 08:30 · {userName}</Text>
                </View>
                <TouchableOpacity
                  className="flex-row items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 shadow-sm active:bg-rose-600"
                  onPress={onStartSale}
                  activeOpacity={0.85}
                >
                  <Ionicons name="cart-outline" size={18} color="#fff" />
                  <Text className="text-sm font-bold text-white">เริ่มขาย</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Content Grid ── */}
          <View className={cn('gap-4', isWide && 'flex-row')}>
            {/* Top Products */}
            <View className="flex-1 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <View className="mb-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                    <Ionicons name="trophy-outline" size={14} color="#d97706" />
                  </View>
                  <Text className="text-base font-bold text-slate-950">สินค้าขายดี</Text>
                </View>
                <Text className="text-xs font-semibold text-slate-400">วันนี้</Text>
              </View>
              <View className="gap-1">
                {data.topProducts.map((p, i) => (
                  <View key={i} className="flex-row items-center gap-3 rounded-xl px-2 py-2.5">
                    <View className={cn('h-7 w-7 items-center justify-center rounded-lg', i < 3 ? 'bg-amber-50' : 'bg-[#f6f7fb]')}>
                      <Text className={cn('text-xs font-bold', i < 3 ? 'text-amber-700' : 'text-slate-500')}>{i + 1}</Text>
                    </View>
                    <Text className="flex-1 text-sm font-semibold text-slate-800" numberOfLines={1}>{p.name}</Text>
                    <Text className="w-20 text-right text-sm font-bold text-rose-600">฿{formatCurrency(p.amount)}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Low Stock */}
            <View className="flex-1 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <View className="mb-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                    <Ionicons name="alert-circle-outline" size={14} color="#d97706" />
                  </View>
                  <Text className="text-base font-bold text-slate-950">สต๊อกต่ำ</Text>
                </View>
                <View className="rounded-full bg-amber-100 px-2.5 py-0.5">
                  <Text className="text-xs font-bold text-amber-700">{data.lowStockProducts.length}</Text>
                </View>
              </View>
              <View className="gap-1">
                {data.lowStockProducts.map((p, i) => (
                  <View key={i} className="flex-row items-center gap-3 rounded-xl px-2 py-2.5">
                    <View className="h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                      <Ionicons name="cube-outline" size={14} color="#d97706" />
                    </View>
                    <Text className="flex-1 text-sm font-semibold text-slate-800" numberOfLines={1}>{p.name}</Text>
                    <View className="rounded-full bg-rose-50 px-2.5 py-0.5">
                      <Text className="text-xs font-bold text-rose-600">เหลือ {p.stockQty}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ── KPI Card ──
interface KpiCardProps {
  label: string;
  value: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  trend?: number;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, iconBg, iconColor, trend }) => (
  <View className="min-w-[44%] flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
    <View className="flex-row items-center justify-between">
      <View className={cn('h-10 w-10 items-center justify-center rounded-xl', iconBg)}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      {trend !== undefined && (
        <View className={cn('flex-row items-center gap-0.5 rounded-full px-2 py-0.5', trend >= 0 ? 'bg-emerald-50' : 'bg-rose-50')}>
          <Ionicons name={trend >= 0 ? 'trending-up-outline' : 'trending-down-outline'} size={12} color={trend >= 0 ? '#059669' : '#e11d48'} />
          <Text className={cn('text-xs font-bold', trend >= 0 ? 'text-emerald-700' : 'text-rose-700')}>{trend >= 0 ? '+' : ''}{trend}%</Text>
        </View>
      )}
    </View>
    <View className="mt-3 gap-0.5">
      <Text className="text-2xl font-extrabold text-slate-950">{value}</Text>
      <Text className="text-sm font-semibold text-slate-500">{label}</Text>
    </View>
  </View>
);
