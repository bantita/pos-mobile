/**
 * SCR-RPT-001 — Sales Report Listing
 * แสดงรายการขายแบบตาราง + Export Excel/PDF
 */
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { DateRangePicker, getDefaultRange } from '@/features/reports/presentation/components/DateRangePicker';
import { ReportListView, Column } from '@/features/reports/presentation/components/ReportListView';
import { KpiCard } from '@/features/reports/presentation/components/ReportCard';
import { MOCK_SALES_SUMMARY, MOCK_SALES_BY_DAY, MOCK_SALES_BY_CASHIER } from '@/features/reports/data/mocks/mockReports';
import { exportExcel, exportPDF, buildHTMLReport } from '@/shared/lib/exportReport';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

interface Props { onBack: () => void }

type ReportTab = 'daily' | 'cashier';

interface DailyRow {
  date: string; label: string; sales: string;
  bills: string; avg: string; profit: string; margin: string;
}
interface CashierRow {
  cashierName: string; posName: string; sales: string;
  bills: string; avg: string; salesRaw: number;
}

export const SalesReportListScreen: React.FC<Props> = ({ onBack }) => {
  const [dateRange, setDateRange] = useState(getDefaultRange());
  const [tab, setTab] = useState<ReportTab>('daily');
  const s = MOCK_SALES_SUMMARY;

  const dailyRows: DailyRow[] = MOCK_SALES_BY_DAY.map(d => ({
    date:   formatDate(d.date),
    label:  d.label,
    sales:  `฿${formatCurrency(d.sales)}`,
    bills:  `${d.bills}`,
    avg:    `฿${formatCurrency(d.bills > 0 ? d.sales / d.bills : 0)}`,
    profit: `฿${formatCurrency(d.profit)}`,
    margin: `${((d.profit / d.sales) * 100).toFixed(1)}%`,
  }));

  const cashierRows: CashierRow[] = MOCK_SALES_BY_CASHIER.map(c => ({
    cashierName: c.cashierName,
    posName:     c.posName,
    sales:       `฿${formatCurrency(c.sales)}`,
    bills:       `${c.bills}`,
    avg:         `฿${formatCurrency(c.avgPerBill)}`,
    salesRaw:    c.sales,
  }));

  const totalSales  = MOCK_SALES_BY_DAY.reduce((s, d) => s + d.sales, 0);
  const totalBills  = MOCK_SALES_BY_DAY.reduce((s, d) => s + d.bills, 0);
  const totalProfit = MOCK_SALES_BY_DAY.reduce((s, d) => s + d.profit, 0);

  const DAILY_COLS: Column<DailyRow>[] = [
    { key: 'date',   header: 'วันที่',         flex: 1.4, sortable: true },
    { key: 'sales',  header: 'ยอดขาย',        flex: 1.2, align: 'right', sortable: true },
    { key: 'bills',  header: 'บิล',           flex: 0.6, align: 'center', sortable: true },
    { key: 'avg',    header: 'เฉลี่ย/บิล',    flex: 1.2, align: 'right' },
    { key: 'profit', header: 'กำไร',          flex: 1.2, align: 'right', sortable: true },
    { key: 'margin', header: 'Margin',        flex: 0.8, align: 'center',
      render: (v) => {
        const pct = parseFloat(String(v));
        const color = pct >= 30 ? '#0f766e' : pct >= 20 ? '#a16207' : '#ef4444';
        return <Text style={{ color, fontWeight: '700', fontSize: 12 }}>{v}</Text>;
      }
    },
  ];

  const CASHIER_COLS: Column<CashierRow>[] = [
    { key: 'cashierName', header: 'พนักงาน',     flex: 1.5, sortable: true },
    { key: 'posName',     header: 'POS',         flex: 0.8 },
    { key: 'sales',       header: 'ยอดขาย',      flex: 1.2, align: 'right', sortable: true },
    { key: 'bills',       header: 'จำนวนบิล',   flex: 0.8, align: 'center', sortable: true },
    { key: 'avg',         header: 'เฉลี่ย/บิล',  flex: 1.2, align: 'right' },
  ];

  const handleExcel = () => {
    if (tab === 'daily') {
      exportExcel('sales_daily', dailyRows as any, [
        { key: 'date', header: 'วันที่' }, { key: 'sales', header: 'ยอดขาย' },
        { key: 'bills', header: 'บิล' }, { key: 'avg', header: 'เฉลี่ย/บิล' },
        { key: 'profit', header: 'กำไร' }, { key: 'margin', header: 'Margin%' },
      ]);
    } else {
      exportExcel('sales_cashier', cashierRows as any, [
        { key: 'cashierName', header: 'พนักงาน' }, { key: 'posName', header: 'POS' },
        { key: 'sales', header: 'ยอดขาย' }, { key: 'bills', header: 'บิล' }, { key: 'avg', header: 'เฉลี่ย/บิล' },
      ]);
    }
  };

  const handlePDF = () => {
    const cols = tab === 'daily' ? DAILY_COLS : CASHIER_COLS;
    const rows = (tab === 'daily' ? dailyRows : cashierRows) as any[];
    const html = buildHTMLReport(
      'รายงานยอดขาย',
      tab === 'daily' ? 'รายวัน' : 'ตามพนักงาน',
      `${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`,
      cols.map(c => ({ key: String(c.key), header: c.header, align: c.align })),
      rows,
      [
        { label: 'ยอดขายรวม', value: `฿${formatCurrency(totalSales)}` },
        { label: 'จำนวนบิล', value: `${totalBills} บิล` },
        { label: 'กำไรรวม', value: `฿${formatCurrency(totalProfit)}` },
      ]
    );
    exportPDF(html, 'sales_report');
  };

  return (
    <SafeAreaView className={cn('flex-1', 'bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-4 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className={cn('text-lg font-extrabold text-white')}>รายงานยอดขาย</Text>
      </View>

      <ScrollView className={cn('flex-1')} contentContainerClassName={cn('p-3 gap-3')} showsVerticalScrollIndicator={false}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        {/* KPI row */}
        <View className={cn('flex-row gap-2')}>
          <KpiCard label="ยอดขายรวม" value={`฿${formatCurrency(s.totalSales)}`} icon="cash-outline" color="#f87171" bgColor="#fee2e2" trend={12} style={{ flex: 1 }} />
          <KpiCard label="จำนวนบิล" value={`${s.totalBills}`} icon="receipt-outline" color="#0f766e" bgColor="#d1fae5" style={{ flex: 1 }} />
        </View>
        <View className={cn('flex-row gap-2')}>
          <KpiCard label="กำไรรวม" value={`฿${formatCurrency(totalProfit)}`} icon="trending-up-outline" color="#f87171" bgColor="#fee2e2" style={{ flex: 1 }} />
          <KpiCard label="เฉลี่ย/บิล" value={`฿${formatCurrency(s.avgPerBill)}`} icon="analytics-outline" color="#a16207" bgColor="#fed7aa" style={{ flex: 1 }} />
        </View>

        {/* Tab */}
        <View className={cn('flex-row bg-white rounded-xl p-1 gap-1 border border-slate-200')}>
          {([['daily','รายวัน'],['cashier','ตามพนักงาน']] as const).map(([k, lbl]) => (
            <TouchableOpacity key={k} className={cn('flex-1 py-2 rounded-lg items-center', tab === k && 'bg-rose-600')} onPress={() => setTab(k)}>
              <Text className={cn('text-xs font-medium text-slate-500', tab === k && 'text-white font-bold')}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Listing */}
        <View className={cn('bg-white rounded-2xl p-3 min-h-[400px] shadow-sm')}>
          {tab === 'daily' ? (
            <ReportListView
              title="รายการยอดขายรายวัน"
              subtitle={`${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`}
              columns={DAILY_COLS}
              data={dailyRows}
              keyExtractor={r => r.date}
              searchKeys={['date', 'label']}
              searchPlaceholder="ค้นหาวันที่..."
              summaryRows={[
                { label: 'รวมยอดขาย', value: `฿${formatCurrency(totalSales)}` },
                { label: 'รวมบิล', value: `${totalBills} บิล` },
                { label: 'รวมกำไร', value: `฿${formatCurrency(totalProfit)}` },
              ]}
              onExcelExport={handleExcel}
              onPdfExport={handlePDF}
            />
          ) : (
            <ReportListView
              title="ยอดขายตามพนักงาน"
              columns={CASHIER_COLS}
              data={cashierRows}
              keyExtractor={r => r.cashierName}
              searchKeys={['cashierName', 'posName']}
              summaryRows={[
                { label: 'รวมยอดขาย', value: `฿${formatCurrency(totalSales)}` },
              ]}
              onExcelExport={handleExcel}
              onPdfExport={handlePDF}
            />
          )}
        </View>
        <View className={cn('h-5')} />
      </ScrollView>
    </SafeAreaView>
  );
};
