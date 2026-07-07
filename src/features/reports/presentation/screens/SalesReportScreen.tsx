/**
 * SCR-RPT-001 — รายงานยอดขาย
 * FR-RPT-001: ยอดขายรายวัน/เดือน/ปี กรองสาขา POS พนักงาน Export
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import {
  MOCK_SALES_SUMMARY, MOCK_SALES_BY_DAY, MOCK_SALES_BY_MONTH,
  MOCK_SALES_BY_CATEGORY, MOCK_SALES_BY_CASHIER,
} from '@/features/reports/data/mocks/mockReports';
import { DateRangePicker, getDefaultRange } from '@/features/reports/presentation/components/DateRangePicker';
import { KpiCard, SectionCard, ExportButton } from '@/features/reports/presentation/components/ReportCard';
import { MiniBarChart } from '@/features/reports/presentation/components/MiniBarChart';
import { formatCurrency } from '@/shared/lib/format';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { cn } from '@/shared/lib/cn';

interface Props { onBack: () => void }

type ViewMode = 'day' | 'month';

export const SalesReportScreen: React.FC<Props> = ({ onBack }) => {
  const [dateRange, setDateRange] = useState(getDefaultRange());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const s = MOCK_SALES_SUMMARY;
  const chartData = viewMode === 'day'
    ? MOCK_SALES_BY_DAY.map(d => ({ label: d.label, value: d.sales, value2: d.profit, highlight: d === MOCK_SALES_BY_DAY[MOCK_SALES_BY_DAY.length - 1] }))
    : MOCK_SALES_BY_MONTH.map(d => ({ label: d.label, value: d.sales, value2: d.profit }));
  const maxDay = [...MOCK_SALES_BY_DAY].sort((a, b) => b.sales - a.sales)[0];

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  return (
    <SafeAreaView className={cn('flex-1', 'bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-4 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}><Ionicons name="arrow-back" size={24} color="#fafafa" /></TouchableOpacity>
        <Text className={cn('text-lg font-extrabold text-white flex-1')}>รายงานยอดขาย</Text>
        <ExportButton onExcel={() => showAlert('Export Excel', 'Excel export feature coming soon')} onPdf={() => showAlert('Export PDF', 'PDF export feature coming soon')} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName={cn('p-3 gap-3')}>
        {/* Date Range */}
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        {/* KPI Summary */}
        <View className={cn('flex-row flex-wrap gap-2')}>
          <KpiCard label="ยอดขายรวม" value={`฿${formatCurrency(s.totalSales)}`} icon="cash-outline" color="#f87171" bgColor="#fee2e2" trend={12} style={{ width: '100%' }} />
          <KpiCard label="จำนวนบิล" value={`${s.totalBills}`} sub={`ยกเลิก ${s.cancelledBills} บิล`} icon="receipt-outline" color="#0f766e" bgColor="#d1fae5" trend={5} style={{ width: '47.5%', flexGrow: 1 }} />
          <KpiCard label="เฉลี่ย/บิล" value={`฿${formatCurrency(s.avgPerBill)}`} icon="analytics-outline" color="#f87171" bgColor="#fee2e2" style={{ width: '47.5%', flexGrow: 1 }} />
          <KpiCard label="ส่วนลดรวม" value={`฿${formatCurrency(s.totalDiscount)}`} icon="pricetag-outline" color="#a16207" bgColor="#fed7aa" style={{ width: '47.5%', flexGrow: 1 }} />
          <KpiCard label="VAT รวม" value={`฿${formatCurrency(s.totalVat)}`} icon="calculator-outline" color="#6b7280" bgColor="#f5f5f5" style={{ width: '47.5%', flexGrow: 1 }} />
        </View>

        {/* Bar Chart */}
        <SectionCard
          title={`ยอดขายราย${viewMode === 'day' ? 'วัน' : 'เดือน'}`}
          icon="bar-chart-outline"
          action={{ label: viewMode === 'day' ? 'ดูรายเดือน' : 'ดูรายวัน', onPress: () => setViewMode(v => v === 'day' ? 'month' : 'day') }}
        >
          <MiniBarChart data={chartData} color="#f87171" color2="#0f766e" showValues height={140} formatValue={(v) => `${(v / 1000).toFixed(0)}K`} />
          <View className={cn('flex-row gap-3 justify-center')}>
            <View className={cn('flex-row items-center gap-[5px]')}><View className={cn('w-[10px] h-[10px] rounded-full')} style={{ backgroundColor: '#f87171bb' }} /><Text className={cn('text-xs text-slate-500')}>ยอดขาย</Text></View>
            <View className={cn('flex-row items-center gap-[5px]')}><View className={cn('w-[10px] h-[10px] rounded-full')} style={{ backgroundColor: '#0f766e60' }} /><Text className={cn('text-xs text-slate-500')}>กำไร</Text></View>
          </View>
          <View className={cn('flex-row items-center gap-1 bg-amber-100 rounded-lg p-2')}>
            <Ionicons name="trophy-outline" size={13} color="#a16207" />
            <Text className={cn('text-xs text-amber-600 font-semibold flex-1')}>วันขายดีสุด: {maxDay.label} ฿{formatCurrency(maxDay.sales)} ({maxDay.bills} บิล)</Text>
          </View>
        </SectionCard>

        {/* Payment Methods */}
        <SectionCard title="ช่องทางชำระเงิน" icon="card-outline">
          {[
            { label: 'เงินสด',    amount: s.cashAmount,     color: '#0f766e', icon: 'cash-outline' },
            { label: 'โอนเงิน',  amount: s.transferAmount, color: '#f87171', icon: 'phone-portrait-outline' },
            { label: 'QR Code',  amount: s.qrAmount,        color: '#f87171', icon: 'qr-code-outline' },
            { label: 'บัตรเครดิต', amount: s.creditAmount, color: '#f87171',      icon: 'card-outline' },
            { label: 'E-Wallet', amount: s.ewalletAmount,   color: '#f87171', icon: 'wallet-outline' },
          ].map((pm) => {
            const pct = ((pm.amount / s.totalSales) * 100).toFixed(1);
            return (
              <View key={pm.label} className={cn('flex-row items-center gap-2')}>
                <View className={cn('w-[30px] h-[30px] rounded-lg items-center justify-center')} style={{ backgroundColor: pm.color + '18' }}><Ionicons name={pm.icon as any} size={16} color={pm.color} /></View>
                <Text className={cn('text-base text-slate-950 w-[70px]')}>{pm.label}</Text>
                <View className={cn('flex-1 h-2 bg-neutral-100 rounded-[4px] overflow-hidden')}>
                  <View className={cn('h-full rounded-[4px]')} style={{ width: `${pct}%` as any, backgroundColor: pm.color }} />
                </View>
                <Text className={cn('text-xs text-slate-500 w-[36px] text-right')}>{pct}%</Text>
                <Text className={cn('text-xs font-semibold text-slate-950 w-[72px] text-right')}>฿{formatCurrency(pm.amount)}</Text>
              </View>
            );
          })}
        </SectionCard>

        {/* By Category */}
        <SectionCard title="ยอดขายตามหมวดหมู่" icon="list-outline">
          {MOCK_SALES_BY_CATEGORY.map((cat, i) => (
            <View key={cat.categoryName} className={cn('flex-row items-center gap-2')}>
              <View className={cn('w-[22px] h-[22px] rounded-full bg-rose-500 items-center justify-center')}><Text className={cn('text-xs text-white font-bold')}>{i + 1}</Text></View>
              <Text className={cn('text-base text-slate-950 w-[80px]')}>{cat.categoryName}</Text>
              <View className={cn('flex-1 h-2 bg-neutral-100 rounded-[4px] overflow-hidden')}>
                <View className={cn('h-full rounded-[4px]')} style={{ width: `${cat.percent}%` as any, backgroundColor: '#f8717199' }} />
              </View>
              <Text className={cn('text-xs text-slate-500 w-[36px] text-right')}>{cat.percent}%</Text>
              <Text className={cn('text-xs font-bold text-rose-600 w-[72px] text-right')}>฿{formatCurrency(cat.sales)}</Text>
            </View>
          ))}
        </SectionCard>

        {/* By Cashier */}
        <SectionCard title="ยอดขายตามพนักงาน" icon="people-outline">
          {MOCK_SALES_BY_CASHIER.map((c) => (
            <View key={c.cashierName} className={cn('flex-row items-center gap-3')}>
              <View className={cn('w-10 h-10 rounded-full bg-rose-50 items-center justify-center')}><Ionicons name="person-outline" size={18} color="#f87171" /></View>
              <View className={cn('flex-1')}>
                <Text className={cn('text-xs font-semibold text-slate-950')}>{c.cashierName}</Text>
                <Text className={cn('text-xs text-slate-500')}>{c.posName} · {c.bills} บิล · เฉลี่ย ฿{formatCurrency(c.avgPerBill)}</Text>
              </View>
              <Text className={cn('text-xs font-bold text-rose-600')}>฿{formatCurrency(c.sales)}</Text>
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
