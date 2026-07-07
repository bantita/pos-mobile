/**
 * SCR-RPT-005 — Enterprise Report Listing + Export
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { ReportListView, Column } from '@/features/reports/presentation/components/ReportListView';
import { DateRangePicker, getDefaultRange } from '@/features/reports/presentation/components/DateRangePicker';
import { MOCK_BRANCH_KPI, MOCK_POS_PERFORMANCE } from '@/features/reports/data/mocks/mockReports';
import { exportExcel, exportPDF, buildHTMLReport } from '@/shared/lib/exportReport';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

interface Props { onBack: () => void }
type Tab = 'branch' | 'pos';

interface BranchRow { branch: string; sales: string; bills: string; profit: string; margin: string; avgBill: string; turnover: string; gmroi: string }
interface POSRow { pos: string; branch: string; cashier: string; sales: string; bills: string; avgBill: string }

export const EnterpriseReportListScreen: React.FC<Props> = ({ onBack }) => {
  const [tab, setTab] = useState<Tab>('branch');
  const [dateRange, setDateRange] = useState(getDefaultRange());

  const branchRows: BranchRow[] = MOCK_BRANCH_KPI.map(b => ({
    branch: b.branchName, sales: `฿${formatCurrency(b.sales)}`, bills: `${b.bills}`,
    profit: `฿${formatCurrency(b.profit)}`, margin: `${b.margin}%`,
    avgBill: `฿${formatCurrency(b.avgPerBill)}`,
    turnover: `${b.inventoryTurnover}x`, gmroi: `${b.gmroi}x`,
  }));
  const posRows: POSRow[] = MOCK_POS_PERFORMANCE.map(p => ({
    pos: p.posName, branch: p.branchName, cashier: p.cashierName,
    sales: `฿${formatCurrency(p.sales)}`, bills: `${p.bills}`,
    avgBill: `฿${formatCurrency(p.avgPerBill)}`,
  }));

  const BRANCH_COLS: Column<BranchRow>[] = [
    { key: 'branch',   header: 'สาขา',      flex: 1.3, sortable: true },
    { key: 'sales',    header: 'ยอดขาย',   flex: 1.2, align: 'right', sortable: true },
    { key: 'bills',    header: 'บิล',       flex: 0.6, align: 'center' },
    { key: 'profit',   header: 'กำไร',     flex: 1.2, align: 'right', sortable: true },
    { key: 'margin',   header: 'Margin',   flex: 0.7, align: 'center',
      render: (v) => { const n = parseFloat(String(v)); return <Text style={{ color: n >= 25 ? '#0f766e' : '#a16207', fontWeight: '700', fontSize: 12 }}>{v}</Text>; } },
    { key: 'turnover', header: 'Turnover', flex: 0.8, align: 'center',
      render: (v) => { const n = parseFloat(String(v)); return <Text style={{ color: n >= 8 ? '#0f766e' : '#a16207', fontWeight: '700', fontSize: 12 }}>{v}</Text>; } },
    { key: 'gmroi',    header: 'GMROI',    flex: 0.7, align: 'center',
      render: (v) => { const n = parseFloat(String(v)); return <Text style={{ color: n >= 18 ? '#0f766e' : '#f87171', fontWeight: '700', fontSize: 12 }}>{v}</Text>; } },
  ];
  const POS_COLS: Column<POSRow>[] = [
    { key: 'pos',     header: 'จุดขาย',   flex: 1, sortable: true },
    { key: 'branch',  header: 'สาขา',     flex: 1 },
    { key: 'cashier', header: 'พนักงาน',  flex: 1.3, sortable: true },
    { key: 'sales',   header: 'ยอดขาย',  flex: 1.2, align: 'right', sortable: true },
    { key: 'bills',   header: 'บิล',      flex: 0.6, align: 'center' },
    { key: 'avgBill', header: 'เฉลี่ย/บิล', flex: 1, align: 'right' },
  ];

  const totalSales = MOCK_BRANCH_KPI.reduce((s, b) => s + b.sales, 0);
  const totalProfit = MOCK_BRANCH_KPI.reduce((s, b) => s + b.profit, 0);

  const handleExcel = () => {
    if (tab === 'branch') {
      exportExcel('enterprise_branch', branchRows as any, [
        { key: 'branch', header: 'สาขา' }, { key: 'sales', header: 'ยอดขาย' },
        { key: 'bills', header: 'บิล' }, { key: 'profit', header: 'กำไร' },
        { key: 'margin', header: 'Margin%' }, { key: 'turnover', header: 'Turnover' }, { key: 'gmroi', header: 'GMROI' },
      ]);
    } else {
      exportExcel('enterprise_pos', posRows as any, [
        { key: 'pos', header: 'จุดขาย' }, { key: 'branch', header: 'สาขา' },
        { key: 'cashier', header: 'พนักงาน' }, { key: 'sales', header: 'ยอดขาย' },
        { key: 'bills', header: 'บิล' }, { key: 'avgBill', header: 'เฉลี่ย/บิล' },
      ]);
    }
  };
  const handlePDF = () => {
    const cols = tab === 'branch' ? BRANCH_COLS : POS_COLS;
    const rows = tab === 'branch' ? branchRows : posRows;
    const html = buildHTMLReport(
      tab === 'branch' ? 'Enterprise — เปรียบเทียบสาขา' : 'Enterprise — ประสิทธิภาพ POS',
      '', `${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`,
      cols.map(c => ({ key: String(c.key), header: c.header, align: c.align })), rows as any,
      tab === 'branch' ? [
        { label: 'รายได้รวม', value: `฿${formatCurrency(totalSales)}` },
        { label: 'กำไรรวม', value: `฿${formatCurrency(totalProfit)}` },
      ] : []
    );
    exportPDF(html, `enterprise_${tab}`);
  };

  return (
    <SafeAreaView className={cn('flex-1', 'bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-4 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}><Ionicons name="arrow-back" size={24} color="#fafafa" /></TouchableOpacity>
        <View>
          <Text className={cn('text-lg font-extrabold text-white')}>Enterprise Report</Text>
          <Text className={cn('text-xs text-white/60')}>Phase 2 · Multi-Branch KPI</Text>
        </View>
      </View>
      <ScrollView className={cn('flex-1')} contentContainerClassName={cn('p-3 gap-3')} showsVerticalScrollIndicator={false}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <View className={cn('flex-row bg-white rounded-xl p-1 gap-1 border border-slate-200')}>
          {([['branch','เปรียบเทียบสาขา'],['pos','ประสิทธิภาพ POS']] as const).map(([k, lbl]) => (
            <TouchableOpacity key={k} className={cn('flex-1 py-2 rounded-lg items-center', tab === k && 'bg-rose-600')} onPress={() => setTab(k)}>
              <Text className={cn('text-xs font-medium text-slate-500', tab === k && 'text-white font-bold')}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View className={cn('bg-white rounded-2xl p-3 min-h-[400px] shadow-sm')}>
          {tab === 'branch' ? (
            <ReportListView
              title="เปรียบเทียบ KPI สาขา"
              subtitle={`${MOCK_BRANCH_KPI.length} สาขา`}
              columns={BRANCH_COLS}
              data={branchRows}
              keyExtractor={r => r.branch}
              searchKeys={['branch']}
              summaryRows={[
                { label: 'รายได้รวม', value: `฿${formatCurrency(totalSales)}` },
                { label: 'กำไรรวม', value: `฿${formatCurrency(totalProfit)}` },
              ]}
              onExcelExport={handleExcel}
              onPdfExport={handlePDF}
            />
          ) : (
            <ReportListView
              title="ประสิทธิภาพ POS"
              subtitle={`${posRows.length} จุดขาย`}
              columns={POS_COLS}
              data={posRows}
              keyExtractor={r => r.pos}
              searchKeys={['pos', 'branch', 'cashier']}
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
