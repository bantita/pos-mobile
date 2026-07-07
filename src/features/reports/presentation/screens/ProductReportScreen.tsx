/**
 * SCR-RPT-002 — รายงานสินค้า
 * FR-RPT-002: วิเคราะห์สินค้าขายดี Category Brand Margin
 */
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { MOCK_TOP_PRODUCTS } from '@/features/reports/data/mocks/mockReports';
import { ProductSalesItem } from '@/features/reports/domain/reports';
import { DateRangePicker, getDefaultRange } from '@/features/reports/presentation/components/DateRangePicker';
import { SectionCard, ExportButton } from '@/features/reports/presentation/components/ReportCard';
import { MiniBarChart } from '@/features/reports/presentation/components/MiniBarChart';
import { formatCurrency } from '@/shared/lib/format';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { cn } from '@/shared/lib/cn';

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
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

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

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  return (
    <SafeAreaView className={cn('flex-1', 'bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-4 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}><Ionicons name="arrow-back" size={24} color="#fafafa" /></TouchableOpacity>
        <Text className={cn('text-lg font-extrabold text-white flex-1')}>รายงานสินค้า</Text>
        <ExportButton onExcel={() => showAlert('Export Excel', 'Excel export feature coming soon')} onPdf={() => showAlert('Export PDF', 'PDF export feature coming soon')} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName={cn('p-3 gap-3')}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        {/* Summary */}
        <View className={cn('flex-row gap-2')}>
          {[
            { label: 'รายได้รวม',    value: `฿${formatCurrency(totalRevenue)}`, color: '#f87171', icon: 'cash-outline' },
            { label: 'กำไรรวม',     value: `฿${formatCurrency(totalProfit)}`,  color: '#0f766e', icon: 'trending-up-outline' },
            { label: 'Avg Margin',  value: `${avgMargin}%`,                    color: '#f87171',      icon: 'pie-chart-outline' },
          ].map((s, i) => (
            <View key={i} className={cn('flex-1 bg-white rounded-xl p-3 items-center gap-1 shadow-sm')} style={{ borderTopWidth: 3, borderTopColor: s.color }}>
              <Ionicons name={s.icon as any} size={18} color={s.color} />
              <Text className={cn('text-base font-extrabold')} style={{ color: s.color }}>{s.value}</Text>
              <Text className={cn('text-xs text-slate-500 text-center font-medium')}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName={cn('gap-2 py-[2px]')}>
          {categories.map((c) => (
            <TouchableOpacity key={c} className={cn('px-3 py-2 min-h-10 rounded-full bg-white border border-slate-200', selectedCategory === c && 'bg-rose-500 border-rose-500')} onPress={() => setSelectedCategory(c)}>
              <Text className={cn('text-xs font-medium text-slate-500', selectedCategory === c && 'text-white font-bold')}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sort By */}
        <View className={cn('flex-row items-center gap-2 flex-wrap')}>
          <Text className={cn('text-xs text-slate-500 font-medium')}>เรียงโดย:</Text>
          {SORT_OPTS.map((s) => (
            <TouchableOpacity key={s.key} className={cn('px-3 py-2 min-h-10 rounded-full bg-neutral-100 border border-slate-200', sortBy === s.key && 'bg-rose-500 border-rose-500')} onPress={() => setSortBy(s.key)}>
              <Text className={cn('text-xs font-medium text-slate-500', sortBy === s.key && 'text-white font-bold')}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bar Chart */}
        <SectionCard title={`Top 6 สินค้า (${sortBy === 'revenue' ? 'ยอดขาย' : sortBy === 'qty' ? 'จำนวน' : sortBy === 'profit' ? 'กำไร' : 'Margin'})`} icon="bar-chart-outline">
          <MiniBarChart data={chartData} color="#f87171" color2="#0f766e" height={130} showValues />
        </SectionCard>

        {/* Product Table */}
        <SectionCard
          title={`รายการสินค้า (${sorted.length})`}
          icon="cube-outline"
          action={showTop < MOCK_TOP_PRODUCTS.length ? { label: `ดูทั้งหมด (${MOCK_TOP_PRODUCTS.length})`, onPress: () => setShowTop(MOCK_TOP_PRODUCTS.length) } : undefined}
        >
          {/* Table header */}
          <View className={cn('flex-row bg-neutral-100 rounded-lg px-1 py-1')}>
            <Text className={cn('text-xs text-slate-500 font-bold flex-[0.4] text-center')}>#</Text>
            <Text className={cn('text-xs text-slate-500 font-bold flex-[2.5]')}>สินค้า</Text>
            <Text className={cn('text-xs text-slate-500 font-bold flex-[0.9] text-right')}>ขาย</Text>
            <Text className={cn('text-xs text-slate-500 font-bold flex-[1] text-right')}>รายได้</Text>
            <Text className={cn('text-xs text-slate-500 font-bold flex-[0.8] text-right')}>Margin</Text>
          </View>
          {sorted.map((p, idx) => (
            <View key={p.productCode} className={cn('flex-row items-center gap-1 py-2 border-b border-slate-200', idx % 2 === 1 && 'bg-rose-50')}>
              <View className={cn('w-[22px] h-[22px] rounded-full bg-gray-200 items-center justify-center flex-[0.4]', idx < 3 && 'bg-rose-500')}>
                <Text className={cn('text-xs font-bold text-slate-500', idx < 3 && 'text-white')}>{idx + 1}</Text>
              </View>
              <View className={cn('flex-[2.5]')}>
                <Text className={cn('text-base text-slate-950 font-medium')} numberOfLines={1}>{p.productName}</Text>
                <Text className={cn('text-xs text-slate-500')}>{p.categoryName}{p.brandName ? ` · ${p.brandName}` : ''}</Text>
              </View>
              <Text className={cn('text-base text-slate-950 flex-[0.9] text-right')}>{p.unitsSold} {p.unit}</Text>
              <Text className={cn('text-base text-rose-600 font-bold flex-[1] text-right')}>฿{formatCurrency(p.revenue)}</Text>
              <View className={cn('flex-[0.8] items-end')}>
                <View className={cn('rounded-lg px-[5px] py-[2px]', p.margin >= 30 ? 'bg-emerald-100' : p.margin >= 20 ? 'bg-amber-100' : 'bg-rose-50')}>
                  <Text className={cn('text-xs font-bold', p.margin >= 30 ? 'text-emerald-600' : p.margin >= 20 ? 'text-amber-600' : 'text-rose-600')}>
                    {p.margin.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </SectionCard>

        <View className={cn('h-5')} />
      </ScrollView>

      <AlertDialog
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertTitle}
        message={alertMessage}
      />
    </SafeAreaView>
  );
};
