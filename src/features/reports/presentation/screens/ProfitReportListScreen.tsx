/**
 * SCR-RPT-004 — Profit Report Listing + Export
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { ReportListView, Column } from '@/features/reports/presentation/components/ReportListView';
import { DateRangePicker, getDefaultRange } from '@/features/reports/presentation/components/DateRangePicker';
import { MOCK_PROFIT_BY_DAY, MOCK_PROFIT_BY_MONTH, MOCK_PROFIT_BY_PRODUCT } from '@/features/reports/data/mocks/mockReports';
import { exportExcel, exportPDF, buildHTMLReport } from '@/shared/lib/exportReport';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

interface Props { onBack: () => void }
type Tab = 'day' | 'month' | 'product';

interface PeriodRow { label: string; revenue: string; cost: string; profit: string; margin: string; revenueRaw: number; profitRaw: number }
interface ProductRow { name: string; qty: string; revenue: string; cost: string; profit: string; margin: string; profitRaw: number }

export const ProfitReportListScreen: React.FC<Props> = ({ onBack }) => {
  const [tab, setTab]           = useState<Tab>('day');
  const [dateRange, setDateRange] = useState(getDefaultRange());

  const dayRows: PeriodRow[] = MOCK_PROFIT_BY_DAY.map(d => ({
    label: d.label, revenue: `฿${formatCurrency(d.revenue)}`, cost: `฿${formatCurrency(d.cost)}`,
    profit: `฿${formatCurrency(d.grossProfit)}`, margin: `${d.margin}%`,
    revenueRaw: d.revenue, profitRaw: d.grossProfit,
  }));
  const monthRows: PeriodRow[] = MOCK_PROFIT_BY_MONTH.map(d => ({
    label: d.label, revenue: `฿${formatCurrency(d.revenue)}`, cost: `฿${formatCurrency(d.cost)}`,
    profit: `฿${formatCurrency(d.grossProfit)}`, margin: `${d.margin}%`,
    revenueRaw: d.revenue, profitRaw: d.grossProfit,
  }));
  const productRows: ProductRow[] = MOCK_PROFIT_BY_PRODUCT.map(p => ({
    name: p.productName, qty: `${p.qty}`, revenue: `฿${formatCurrency(p.revenue)}`,
    cost: `฿${formatCurrency(p.cost)}`, profit: `฿${formatCurrency(p.profit)}`,
    margin: `${p.margin.toFixed(1)}%`, profitRaw: p.profit,
  }));

  const PERIOD_COLS: Column<PeriodRow>[] = [
    { key: 'label',   header: 'ช่วง',     flex: 0.7 },
    { key: 'revenue', header: 'รายได้',  flex: 1.2, align: 'right', sortable: true },
    { key: 'cost',    header: 'ต้นทุน',  flex: 1.2, align: 'right' },
    { key: 'profit',  header: 'กำไร',    flex: 1.2, align: 'right', sortable: true,
      render: (v) => <Text className={cn('text-xs font-bold text-emerald-600')}>{v}</Text> },
    { key: 'margin',  header: 'Margin',  flex: 0.8, align: 'center',
      render: (v) => {
        const n = parseFloat(String(v)); const color = n >= 30 ? '#0f766e' : n >= 20 ? '#a16207' : '#ef4444';
        return <Text style={{ color, fontWeight: '700', fontSize: 12 }}>{v}</Text>;
      }
    },
  ];
  const PRODUCT_COLS: Column<ProductRow>[] = [
    { key: 'name',    header: 'สินค้า',   flex: 2, sortable: true },
    { key: 'qty',     header: 'จำนวน',   flex: 0.7, align: 'center' },
    { key: 'revenue', header: 'รายได้',  flex: 1.1, align: 'right' },
    { key: 'cost',    header: 'ต้นทุน',  flex: 1.1, align: 'right' },
    { key: 'profit',  header: 'กำไร',    flex: 1.1, align: 'right', sortable: true,
      render: (v) => <Text className={cn('text-xs font-bold text-emerald-600')}>{v}</Text> },
    { key: 'margin',  header: 'Margin',  flex: 0.8, align: 'center',
      render: (v) => {
        const n = parseFloat(String(v)); const color = n >= 30 ? '#0f766e' : n >= 20 ? '#a16207' : '#ef4444';
        return <Text style={{ color, fontWeight: '700', fontSize: 12 }}>{v}</Text>;
      }
    },
  ];

  const rows = tab === 'day' ? dayRows : tab === 'month' ? monthRows : productRows;
  const totalRevenue = (tab === 'product' ? MOCK_PROFIT_BY_PRODUCT : MOCK_PROFIT_BY_DAY).reduce((s, r) => s + r.revenue, 0);
  const totalProfit  = (tab === 'product' ? MOCK_PROFIT_BY_PRODUCT : MOCK_PROFIT_BY_DAY).reduce((s, r) => s + (tab === 'product' ? (r as any).profit : (r as any).grossProfit), 0);
  const avgMargin    = totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : '0';

  const handleExcel = () => {
    const filename = `profit_${tab}`;
    if (tab !== 'product') {
      exportExcel(filename, rows as any, [
        { key: 'label', header: 'ช่วง' }, { key: 'revenue', header: 'รายได้' },
        { key: 'cost', header: 'ต้นทุน' }, { key: 'profit', header: 'กำไร' }, { key: 'margin', header: 'Margin%' },
      ]);
    } else {
      exportExcel(filename, rows as any, [
        { key: 'name', header: 'สินค้า' }, { key: 'qty', header: 'จำนวน' },
        { key: 'revenue', header: 'รายได้' }, { key: 'cost', header: 'ต้นทุน' },
        { key: 'profit', header: 'กำไร' }, { key: 'margin', header: 'Margin%' },
      ]);
    }
  };
  const handlePDF = () => {
    const cols = tab !== 'product' ? PERIOD_COLS : PRODUCT_COLS;
    const title = tab === 'day' ? 'กำไรรายวัน' : tab === 'month' ? 'กำไรรายเดือน' : 'กำไรตามสินค้า';
    const html = buildHTMLReport(title, '', `${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`,
      cols.map(c => ({ key: String(c.key), header: c.header, align: c.align })), rows as any,
      [{ label: 'กำไรรวม', value: `฿${formatCurrency(totalProfit)}` }, { label: 'Avg Margin', value: `${avgMargin}%` }]
    );
    exportPDF(html, `profit_${tab}`);
  };

  return (
    <SafeAreaView className={cn('flex-1', 'bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-4 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}><Ionicons name="arrow-back" size={24} color="#fafafa" /></TouchableOpacity>
        <Text className={cn('text-lg font-extrabold text-white')}>รายงานกำไร</Text>
      </View>
      <ScrollView className={cn('flex-1')} contentContainerClassName={cn('p-3 gap-3')} showsVerticalScrollIndicator={false}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <View className={cn('flex-row bg-white rounded-xl p-1 gap-1 border border-slate-200')}>
          {([['day','รายวัน'],['month','รายเดือน'],['product','ตามสินค้า']] as const).map(([k, lbl]) => (
            <TouchableOpacity key={k} className={cn('flex-1 py-2 rounded-lg items-center', tab === k && 'bg-rose-600')} onPress={() => setTab(k)}>
              <Text className={cn('text-xs font-medium text-slate-500', tab === k && 'text-white font-bold')}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View className={cn('flex-row gap-2')}>
          {[
            { label: 'รายได้รวม', value: `฿${formatCurrency(totalRevenue)}`, color: '#f87171' },
            { label: 'กำไรรวม', value: `฿${formatCurrency(totalProfit)}`, color: '#0f766e' },
            { label: 'Avg Margin', value: `${avgMargin}%`, color: '#f87171' },
          ].map((k, i) => (
            <View key={i} className={cn('flex-1 bg-white rounded-xl p-3 items-center gap-1 shadow-sm')} style={{ borderTopWidth: 3, borderTopColor: k.color }}>
              <Text className={cn('text-base font-extrabold')} style={{ color: k.color }}>{k.value}</Text>
              <Text className={cn('text-xs text-slate-500 text-center')}>{k.label}</Text>
            </View>
          ))}
        </View>
        <View className={cn('bg-white rounded-2xl p-3 min-h-[400px] shadow-sm')}>
          <ReportListView
            title={tab === 'day' ? 'กำไรรายวัน' : tab === 'month' ? 'กำไรรายเดือน' : 'กำไรตามสินค้า'}
            subtitle={`${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`}
            columns={(tab !== 'product' ? PERIOD_COLS : PRODUCT_COLS) as any}
            data={rows as any}
            keyExtractor={(r: any) => r.label ?? r.name}
            searchKeys={(tab === 'product' ? ['name'] : ['label']) as any}
            summaryRows={[
              { label: 'รายได้รวม', value: `฿${formatCurrency(totalRevenue)}` },
              { label: 'กำไรรวม', value: `฿${formatCurrency(totalProfit)}` },
              { label: 'Avg Margin', value: `${avgMargin}%` },
            ]}
            onExcelExport={handleExcel}
            onPdfExport={handlePDF}
          />
        </View>
        <View className={cn('h-5')} />
      </ScrollView>
    </SafeAreaView>
  );
};
