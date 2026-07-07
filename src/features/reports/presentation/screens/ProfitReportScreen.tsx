/**
 * SCR-RPT-004 — รายงานกำไร
 * FR-RPT-004: Gross Profit / Margin แยกตามวัน สินค้า สาขา
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { MOCK_PROFIT_BY_DAY, MOCK_PROFIT_BY_MONTH, MOCK_PROFIT_BY_PRODUCT } from '@/features/reports/data/mocks/mockReports';
import { DateRangePicker, getDefaultRange } from '@/features/reports/presentation/components/DateRangePicker';
import { SectionCard, ExportButton } from '@/features/reports/presentation/components/ReportCard';
import { MiniBarChart } from '@/features/reports/presentation/components/MiniBarChart';
import { formatCurrency } from '@/shared/lib/format';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { cn } from '@/shared/lib/cn';

interface Props { onBack: () => void }

export const ProfitReportScreen: React.FC<Props> = ({ onBack }) => {
  const [dateRange, setDateRange] = useState(getDefaultRange());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const chartData = viewMode === 'day' ? MOCK_PROFIT_BY_DAY : MOCK_PROFIT_BY_MONTH;

  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalCost    = chartData.reduce((s, d) => s + d.cost, 0);
  const totalProfit  = chartData.reduce((s, d) => s + d.grossProfit, 0);
  const avgMargin    = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;
  const bestDay      = [...chartData].sort((a, b) => b.grossProfit - a.grossProfit)[0];

  const barData = chartData.map(d => ({
    label: d.label,
    value: d.revenue,
    value2: d.grossProfit,
    highlight: d === bestDay,
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
        <Text className={cn('text-lg font-extrabold text-white flex-1')}>รายงานกำไร</Text>
        <ExportButton onExcel={() => showAlert('Export Excel', 'Excel export feature coming soon')} onPdf={() => showAlert('Export PDF', 'PDF export feature coming soon')} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName={cn('p-3 gap-3')}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        {/* KPI */}
        <View className={cn('flex-row gap-2')}>
          {[
            { label: 'รายได้รวม',   value: `฿${formatCurrency(totalRevenue)}`, color: '#f87171', bg: '#fee2e2', icon: 'cash-outline' },
            { label: 'ต้นทุนรวม',  value: `฿${formatCurrency(totalCost)}`,    color: '#ef4444',  bg: '#ffe4e6',  icon: 'cart-outline' },
            { label: 'กำไรขั้นต้น', value: `฿${formatCurrency(totalProfit)}`, color: '#0f766e', bg: '#d1fae5', icon: 'trending-up-outline' },
          ].map((k, i) => (
            <View key={i} className={cn('flex-1 bg-white rounded-xl p-3 items-center gap-[3px] shadow-sm')} style={{ borderTopWidth: 3, borderTopColor: k.color }}>
              <Ionicons name={k.icon as any} size={18} color={k.color} />
              <Text className={cn('text-base font-extrabold')} style={{ color: k.color }}>{k.value}</Text>
              <Text className={cn('text-xs text-slate-500 text-center')}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* Margin gauge */}
        <SectionCard title="Gross Margin" icon="pie-chart-outline">
          <View className={cn('flex-row gap-3')}>
            <View className={cn('flex-1 gap-2')}>
              <Text className={cn('text-3xl font-black text-emerald-600')}>{avgMargin.toFixed(1)}%</Text>
              <Text className={cn('text-xs text-slate-500')}>Gross Margin เฉลี่ย</Text>
              <View className={cn('h-4 bg-neutral-100 rounded-lg overflow-hidden')}>
                <View className={cn('flex-row h-full')}>
                  <View className={cn('bg-rose-600/50')} style={{ flex: totalCost / totalRevenue }} />
                  <View className={cn('bg-emerald-700/50')} style={{ flex: totalProfit / totalRevenue }} />
                </View>
              </View>
              <View className={cn('gap-[3px]')}>
                <View className={cn('flex-row items-center gap-[5px]')}><View className={cn('w-2 h-2 rounded-full bg-rose-500')} /><Text className={cn('text-xs text-slate-500')}>ต้นทุน {((totalCost / totalRevenue) * 100).toFixed(1)}%</Text></View>
                <View className={cn('flex-row items-center gap-[5px]')}><View className={cn('w-2 h-2 rounded-full bg-emerald-500')} /><Text className={cn('text-xs text-slate-500')}>กำไร {avgMargin.toFixed(1)}%</Text></View>
              </View>
            </View>

            <View className={cn('flex-1 gap-2 justify-center')}>
              {[
                { label: 'กำไรสูงสุด/วัน', value: `฿${formatCurrency(Math.max(...chartData.map(d => d.grossProfit)))}` },
                { label: 'Margin สูงสุด',  value: `${Math.max(...chartData.map(d => d.margin))}%` },
                { label: `วัน/เดือน${bestDay ? `(${bestDay.label})` : ''}`, value: `฿${formatCurrency(bestDay?.grossProfit ?? 0)}` },
              ].map((s, i) => (
                <View key={i} className={cn('flex-row justify-between')}>
                  <Text className={cn('text-xs text-slate-500 flex-1')}>{s.label}</Text>
                  <Text className={cn('text-xs font-bold text-emerald-600')}>{s.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </SectionCard>

        {/* Chart */}
        <SectionCard
          title={`กำไรราย${viewMode === 'day' ? 'วัน' : 'เดือน'}`}
          icon="bar-chart-outline"
          action={{ label: viewMode === 'day' ? 'รายเดือน' : 'รายวัน', onPress: () => setViewMode(v => v === 'day' ? 'month' : 'day') }}
        >
          <MiniBarChart data={barData} color="#f87171" color2="#0f766e" height={140} showValues />
          <View className={cn('flex-row gap-3 justify-center')}>
            <View className={cn('flex-row items-center gap-[5px]')}><View className={cn('w-2 h-2 rounded-full')} style={{ backgroundColor: '#f87171bb' }} /><Text className={cn('text-xs text-slate-500')}>รายได้</Text></View>
            <View className={cn('flex-row items-center gap-[5px]')}><View className={cn('w-2 h-2 rounded-full')} style={{ backgroundColor: '#0f766e60' }} /><Text className={cn('text-xs text-slate-500')}>กำไร</Text></View>
          </View>
        </SectionCard>

        {/* Profit by Period Table */}
        <SectionCard title={`ตารางกำไรราย${viewMode === 'day' ? 'วัน' : 'เดือน'}`} icon="document-text-outline">
          <View className={cn('flex-row bg-neutral-100 rounded-lg px-1 py-1')}>
            <Text className={cn('text-xs text-slate-500 font-bold flex-[0.7]')}>ช่วง</Text>
            <Text className={cn('text-xs text-slate-500 font-bold flex-[1.2] text-right')}>รายได้</Text>
            <Text className={cn('text-xs text-slate-500 font-bold flex-[1.2] text-right')}>ต้นทุน</Text>
            <Text className={cn('text-xs text-slate-500 font-bold flex-[1.2] text-right')}>กำไร</Text>
            <Text className={cn('text-xs text-slate-500 font-bold flex-[0.7] text-right')}>Margin</Text>
          </View>
          {chartData.map((d, idx) => (
            <View key={idx} className={cn('flex-row items-center py-2 border-b border-slate-200', idx % 2 === 1 && 'bg-rose-50', d === bestDay && 'bg-amber-100')}>
              <View className={cn('flex-[0.7] flex-row items-center gap-1')}>
                {d === bestDay && <Ionicons name="trophy" size={11} color="#a16207" />}
                <Text className={cn('text-base text-slate-950')}>{d.label}</Text>
              </View>
              <Text className={cn('text-base text-slate-950 flex-[1.2] text-right')}>฿{formatCurrency(d.revenue)}</Text>
              <Text className={cn('text-base text-rose-600 flex-[1.2] text-right')}>฿{formatCurrency(d.cost)}</Text>
              <Text className={cn('text-base text-emerald-600 font-bold flex-[1.2] text-right')}>฿{formatCurrency(d.grossProfit)}</Text>
              <View className={cn('flex-[0.7] items-end')}>
                <View className={cn('rounded-lg px-[5px] py-[2px]', d.margin >= 30 ? 'bg-emerald-100' : d.margin >= 20 ? 'bg-amber-100' : 'bg-rose-50')}>
                  <Text className={cn('text-xs font-bold', d.margin >= 30 ? 'text-emerald-600' : d.margin >= 20 ? 'text-amber-600' : 'text-rose-600')}>
                    {d.margin}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
          {/* Total row */}
          <View className={cn('flex-row items-center bg-neutral-100 rounded-lg py-2 px-1 mt-1')}>
            <Text className={cn('text-base text-slate-950 flex-[0.7]')}>รวม</Text>
            <Text className={cn('text-base font-extrabold flex-[1.2] text-right')}>฿{formatCurrency(totalRevenue)}</Text>
            <Text className={cn('text-base font-extrabold text-rose-600 flex-[1.2] text-right')}>฿{formatCurrency(totalCost)}</Text>
            <Text className={cn('text-base font-extrabold text-emerald-600 flex-[1.2] text-right')}>฿{formatCurrency(totalProfit)}</Text>
            <Text className={cn('text-base font-extrabold text-rose-600 flex-[0.7] text-right')}>{avgMargin.toFixed(1)}%</Text>
          </View>
        </SectionCard>

        {/* By Product */}
        <SectionCard title="กำไรตามสินค้า" icon="cube-outline">
          {MOCK_PROFIT_BY_PRODUCT.slice(0, 5).map((p, idx) => (
            <View key={p.productName} className={cn('flex-row items-center gap-2')}>
              <Text className={cn('text-xs font-semibold text-slate-500 w-5 text-center')}>{idx + 1}</Text>
              <View className={cn('flex-1')}>
                <Text className={cn('text-base text-slate-950 font-medium')} numberOfLines={1}>{p.productName}</Text>
                <View className={cn('h-[5px] bg-neutral-100 rounded-[3px] overflow-hidden mt-[3px]')}>
                  <View className={cn('h-full bg-emerald-700/50 rounded-[3px]')} style={{ width: `${(p.profit / MOCK_PROFIT_BY_PRODUCT[0].profit) * 100}%` }} />
                </View>
              </View>
              <View className={cn('items-end gap-[2px]')}>
                <Text className={cn('text-xs font-bold text-emerald-600')}>฿{formatCurrency(p.profit)}</Text>
                <View className={cn('rounded-lg px-[5px] py-[2px]', p.margin >= 30 ? 'bg-emerald-100' : 'bg-amber-100')}>
                  <Text className={cn('text-xs font-bold', p.margin >= 30 ? 'text-emerald-600' : 'text-amber-600')}>{p.margin.toFixed(1)}%</Text>
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
