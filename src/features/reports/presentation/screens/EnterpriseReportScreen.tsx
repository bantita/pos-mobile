/**
 * SCR-RPT-005 — รายงาน Enterprise
 * FR-RPT-005: เปรียบเทียบสาขา POS KPI Inventory Turnover GMROI
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { MOCK_BRANCH_KPI, MOCK_POS_PERFORMANCE } from '@/features/reports/data/mocks/mockReports';
import { DateRangePicker, getDefaultRange } from '@/features/reports/presentation/components/DateRangePicker';
import { SectionCard, ExportButton } from '@/features/reports/presentation/components/ReportCard';
import { MiniBarChart } from '@/features/reports/presentation/components/MiniBarChart';
import { formatCurrency } from '@/shared/lib/format';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { cn } from '@/shared/lib/cn';

interface Props { onBack: () => void }

type Metric = 'sales' | 'profit' | 'margin' | 'turnover' | 'gmroi';

const METRICS: { key: Metric; label: string; unit: string; color: string }[] = [
  { key: 'sales',    label: 'ยอดขาย',        unit: '฿',  color: '#f87171' },
  { key: 'profit',   label: 'กำไร',           unit: '฿',  color: '#0f766e' },
  { key: 'margin',   label: 'Margin%',        unit: '%',  color: '#f87171' },
  { key: 'turnover', label: 'Inv. Turnover',  unit: 'x',  color: '#a16207' },
  { key: 'gmroi',    label: 'GMROI',          unit: 'x',  color: '#f87171' },
];

export const EnterpriseReportScreen: React.FC<Props> = ({ onBack }) => {
  const [dateRange, setDateRange] = useState(getDefaultRange());
  const [activeMetric, setActiveMetric] = useState<Metric>('sales');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const metricCfg = METRICS.find(m => m.key === activeMetric)!;
  const totalSales  = MOCK_BRANCH_KPI.reduce((s, b) => s + b.sales, 0);
  const totalProfit = MOCK_BRANCH_KPI.reduce((s, b) => s + b.profit, 0);
  const avgMargin   = (totalProfit / totalSales * 100).toFixed(1);

  const chartData = MOCK_BRANCH_KPI.map(b => ({
    label: b.branchName.substring(0, 5),
    value: (b as any)[activeMetric],
    highlight: (b as any)[activeMetric] === Math.max(...MOCK_BRANCH_KPI.map(x => (x as any)[activeMetric])),
  }));

  const topBranch = [...MOCK_BRANCH_KPI].sort((a, b) => b.sales - a.sales)[0];

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  return (
    <SafeAreaView className={cn('flex-1', 'bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-4 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}><Ionicons name="arrow-back" size={24} color="#fafafa" /></TouchableOpacity>
        <View className={cn('flex-1')}>
          <Text className={cn('text-lg font-extrabold text-white')}>Enterprise Report</Text>
          <Text className={cn('text-xs text-white/60 font-medium')}>เปรียบเทียบสาขา · Phase 2</Text>
        </View>
        <ExportButton onExcel={() => showAlert('Export Excel', 'Excel export feature coming soon')} onPdf={() => showAlert('Export PDF', 'PDF export feature coming soon')} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName={cn('p-3 gap-3')}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        {/* Overall KPIs */}
        <View className={cn('flex-row flex-wrap gap-2')}>
          {[
            { label: 'รายได้รวมทุกสาขา', value: `฿${formatCurrency(totalSales)}`,  color: '#f87171', icon: 'business-outline' },
            { label: 'กำไรรวม',           value: `฿${formatCurrency(totalProfit)}`, color: '#0f766e', icon: 'trending-up-outline' },
            { label: 'Avg Margin',         value: `${avgMargin}%`,                  color: '#f87171',      icon: 'pie-chart-outline' },
            { label: 'จำนวนสาขา',          value: String(MOCK_BRANCH_KPI.length),  color: '#a16207', icon: 'map-outline' },
          ].map((k, i) => (
            <View key={i} className={cn('w-[47.5%] flex-grow bg-white rounded-xl p-3 items-center gap-[3px] shadow-sm')} style={{ borderTopWidth: 3, borderTopColor: k.color }}>
              <Ionicons name={k.icon as any} size={16} color={k.color} />
              <Text className={cn('text-base font-extrabold')} style={{ color: k.color }}>{k.value}</Text>
              <Text className={cn('text-xs text-slate-500 text-center font-medium')}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* Metric Selector */}
        <SectionCard title="เลือก KPI ที่ต้องการเปรียบเทียบ" icon="options-outline">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName={cn('gap-2 pb-2')}>
            {METRICS.map((m) => (
              <TouchableOpacity
                key={m.key}
                className={cn('px-3 py-[6px] rounded-full bg-neutral-100 border border-slate-200')}
                style={activeMetric === m.key ? { backgroundColor: m.color, borderColor: m.color } : {}}
                onPress={() => setActiveMetric(m.key)}
              >
                <Text className={cn('text-base text-slate-500 font-medium')} style={activeMetric === m.key ? { color: '#fafafa' } : {}}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <MiniBarChart
            data={chartData}
            color={metricCfg.color}
            height={140}
            showValues
            formatValue={(v) => metricCfg.unit === '฿' ? `${(v / 1000).toFixed(0)}K` : `${v.toFixed(1)}${metricCfg.unit}`}
          />
        </SectionCard>

        {/* Branch Comparison Table */}
        <SectionCard title="เปรียบเทียบสาขา" icon="git-compare-outline">
          <View className={cn('flex-row bg-neutral-100 rounded-lg px-1 py-1')}>
            <Text className={cn('text-xs text-slate-500 font-bold flex-[1.5]')}>สาขา</Text>
            <Text className={cn('text-xs text-slate-500 font-bold flex-[1.2] text-right')}>ยอดขาย</Text>
            <Text className={cn('text-xs text-slate-500 font-bold flex-[0.7] text-right')}>Margin</Text>
            <Text className={cn('text-xs text-slate-500 font-bold flex-[0.8] text-right')}>Turnover</Text>
            <Text className={cn('text-xs text-slate-500 font-bold flex-[0.7] text-right')}>GMROI</Text>
          </View>
          {MOCK_BRANCH_KPI.map((b, idx) => {
            const isTop = b.branchId === topBranch.branchId || b.branchName === topBranch.branchName;
            const salesPct = (b.sales / totalSales * 100).toFixed(0);
            return (
              <View key={b.branchId} className={cn('flex-row items-center py-2 border-b border-slate-200', idx % 2 === 1 && 'bg-rose-50')}>
                <View className={cn('flex-[1.5]')}>
                  <View className={cn('flex-row items-center gap-1')}>
                    {isTop && <Ionicons name="trophy" size={11} color="#a16207" />}
                    <Text className={cn('text-xs font-semibold text-slate-950')}>{b.branchName}</Text>
                  </View>
                  <View className={cn('h-1 bg-gray-200 rounded-[2px] overflow-hidden mt-[2px]')}>
                    <View className={cn('h-full rounded-[2px]')} style={{ width: `${salesPct}%` as any, backgroundColor: '#f8717180' }} />
                  </View>
                  <Text className={cn('text-xs text-slate-500 mt-[2px] font-medium')}>{salesPct}% ของยอดรวม</Text>
                </View>
                <Text className={cn('text-base text-rose-600 flex-[1.2] text-right')}>฿{formatCurrency(b.sales)}</Text>
                <View className={cn('flex-[0.7] items-end')}>
                  <Text className={cn('text-base', b.margin >= 25 ? 'text-emerald-600' : 'text-amber-600')}>{b.margin}%</Text>
                </View>
                <View className={cn('flex-[0.8] items-end')}>
                  <View className={cn('rounded-lg px-[5px] py-[2px]', b.inventoryTurnover >= 8 ? 'bg-emerald-100' : 'bg-amber-100')}>
                    <Text className={cn('text-xs font-bold', b.inventoryTurnover >= 8 ? 'text-emerald-600' : 'text-amber-600')}>
                      {b.inventoryTurnover}x
                    </Text>
                  </View>
                </View>
                <View className={cn('flex-[0.7] items-end')}>
                  <View className={cn('rounded-lg px-[5px] py-[2px]', b.gmroi >= 18 ? 'bg-emerald-100' : 'bg-rose-50')}>
                    <Text className={cn('text-xs font-bold', b.gmroi >= 18 ? 'text-emerald-600' : 'text-rose-600')}>
                      {b.gmroi}x
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </SectionCard>

        {/* POS Performance */}
        <SectionCard title="ประสิทธิภาพ POS" icon="tablet-portrait-outline">
          {MOCK_POS_PERFORMANCE.map((pos, idx) => {
            const maxSales = Math.max(...MOCK_POS_PERFORMANCE.map(p => p.sales));
            const pct = (pos.sales / maxSales * 100).toFixed(0);
            return (
              <View key={idx} className={cn('flex-row items-center gap-2')}>
                <View className={cn('w-9 h-9 rounded-lg items-center justify-center', idx === 0 ? 'bg-rose-50' : 'bg-neutral-100')}>
                  <Ionicons name="tablet-portrait-outline" size={16} color={idx === 0 ? '#f87171' : '#6b7280'} />
                </View>
                <View className={cn('flex-1')}>
                  <Text className={cn('text-xs font-semibold text-slate-950')}>{pos.posName}</Text>
                  <Text className={cn('text-xs text-slate-500 font-medium')}>{pos.branchName} · {pos.cashierName}</Text>
                  <View className={cn('h-1 bg-neutral-100 rounded-[2px] overflow-hidden mt-[3px]')}>
                    <View className={cn('h-full rounded-[2px]')} style={{ width: `${pct}%` as any, backgroundColor: '#f8717180' }} />
                  </View>
                </View>
                <View className={cn('items-end')}>
                  <Text className={cn('text-xs font-bold text-rose-600')}>฿{formatCurrency(pos.sales)}</Text>
                  <Text className={cn('text-xs text-slate-500 font-medium')}>{pos.bills} บิล · ฿{formatCurrency(pos.avgPerBill)}/บิล</Text>
                </View>
              </View>
            );
          })}
        </SectionCard>

        {/* GMROI Explainer */}
        <View className={cn('flex-row items-start gap-2 bg-rose-50 rounded-2xl p-3')}>
          <Ionicons name="information-circle-outline" size={16} color="#f87171" />
          <View className={cn('flex-1')}>
            <Text className={cn('text-xs font-bold text-rose-600 mb-[3px]')}>คำอธิบาย KPI</Text>
            <Text className={cn('text-xs text-rose-600 font-medium')} style={{ lineHeight: 18 }}>
              <Text style={{ fontWeight: '700' }}>Inventory Turnover</Text> = รอบหมุนเวียนสินค้า (ครั้ง/ปี){'\n'}
              <Text style={{ fontWeight: '700' }}>GMROI</Text> = Gross Margin Return on Inventory Investment{'\n'}
              GMROI ≥ 15 = ดีมาก · 10-15 = ดี · &lt;10 = ควรปรับปรุง
            </Text>
          </View>
        </View>

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
