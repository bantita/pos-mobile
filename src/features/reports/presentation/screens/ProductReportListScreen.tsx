/**
 * SCR-RPT-002 + M04 Listing — Product Report + Product List Export
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { ReportListView, Column } from '@/features/reports/presentation/components/ReportListView';
import { DateRangePicker, getDefaultRange } from '@/features/reports/presentation/components/DateRangePicker';
import { MOCK_TOP_PRODUCTS } from '@/features/reports/data/mocks/mockReports';
import { MOCK_PRODUCTS } from '@/features/product/data/mocks/mockProducts';
import { exportExcel, exportPDF, buildHTMLReport } from '@/shared/lib/exportReport';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

interface Props { onBack: () => void }

type Tab = 'sales' | 'master';

interface SalesRow { rank: string; code: string; name: string; category: string; qty: string; revenue: string; cost: string; profit: string; margin: string }
interface MasterRow { code: string; barcode: string; name: string; category: string; unit: string; costPrice: string; salePrice: string; stockQty: string; status: string }

export const ProductReportListScreen: React.FC<Props> = ({ onBack }) => {
  const [tab, setTab] = useState<Tab>('sales');
  const [dateRange, setDateRange] = useState(getDefaultRange());

  const salesRows: SalesRow[] = MOCK_TOP_PRODUCTS.map(p => ({
    rank:     `${p.rank}`,
    code:     p.productCode,
    name:     p.productName,
    category: p.categoryName,
    qty:      `${p.unitsSold} ${p.unit}`,
    revenue:  `฿${formatCurrency(p.revenue)}`,
    cost:     `฿${formatCurrency(p.cost)}`,
    profit:   `฿${formatCurrency(p.profit)}`,
    margin:   `${p.margin.toFixed(1)}%`,
  }));

  const masterRows: MasterRow[] = MOCK_PRODUCTS.map(p => ({
    code:      p.code,
    barcode:   p.barcode,
    name:      p.name,
    category:  p.categoryName,
    unit:      p.unit,
    costPrice: `฿${formatCurrency(p.costPrice)}`,
    salePrice: `฿${formatCurrency(p.salePrice)}`,
    stockQty:  `${p.stockQty}`,
    status:    p.status === 'active' ? 'ใช้งาน' : 'ปิดใช้',
  }));

  const SALES_COLS: Column<SalesRow>[] = [
    { key: 'rank',     header: '#',       flex: 0.4, align: 'center' },
    { key: 'code',     header: 'รหัส',    flex: 0.7, sortable: true },
    { key: 'name',     header: 'ชื่อสินค้า', flex: 2, sortable: true },
    { key: 'category', header: 'หมวด',   flex: 0.9, sortable: true },
    { key: 'qty',      header: 'ขาย',    flex: 0.8, align: 'right', sortable: true },
    { key: 'revenue',  header: 'รายได้', flex: 1.1, align: 'right', sortable: true },
    { key: 'profit',   header: 'กำไร',   flex: 1.1, align: 'right', sortable: true },
    { key: 'margin',   header: 'Margin', flex: 0.8, align: 'center',
      render: (v) => {
        const pct = parseFloat(String(v));
        const color = pct >= 30 ? '#0f766e' : pct >= 20 ? '#a16207' : '#ef4444';
        return <Text style={{ color, fontWeight: '700', fontSize: 12 }}>{v}</Text>;
      }
    },
  ];

  const MASTER_COLS: Column<MasterRow>[] = [
    { key: 'code',      header: 'รหัส',      flex: 0.7, sortable: true },
    { key: 'barcode',   header: 'บาร์โค้ด',  flex: 1.2 },
    { key: 'name',      header: 'ชื่อสินค้า', flex: 2, sortable: true },
    { key: 'category',  header: 'หมวด',      flex: 0.9, sortable: true },
    { key: 'unit',      header: 'หน่วย',     flex: 0.6 },
    { key: 'salePrice', header: 'ราคาขาย',  flex: 0.9, align: 'right', sortable: true },
    { key: 'stockQty',  header: 'คงเหลือ',  flex: 0.7, align: 'center', sortable: true,
      render: (v) => {
        const n = parseInt(String(v));
        const color = n === 0 ? '#ef4444' : n <= 5 ? '#a16207' : '#0f766e';
        return <Text style={{ color, fontWeight: '700', fontSize: 12 }}>{v}</Text>;
      }
    },
    { key: 'status',    header: 'สถานะ',    flex: 0.7, align: 'center',
      render: (v) => {
        const ok = v === 'ใช้งาน';
        return <Text style={{ color: ok ? '#0f766e' : '#57534e', fontWeight: '700', fontSize: 12 }}>{v}</Text>;
      }
    },
  ];

  const totalRevenue = MOCK_TOP_PRODUCTS.reduce((s, p) => s + p.revenue, 0);
  const totalProfit  = MOCK_TOP_PRODUCTS.reduce((s, p) => s + p.profit, 0);

  const handleExcel = () => {
    if (tab === 'sales') {
      exportExcel('product_sales', salesRows as any, [
        { key: 'rank', header: '#' }, { key: 'code', header: 'รหัส' }, { key: 'name', header: 'ชื่อ' },
        { key: 'category', header: 'หมวด' }, { key: 'qty', header: 'ขาย' },
        { key: 'revenue', header: 'รายได้' }, { key: 'profit', header: 'กำไร' }, { key: 'margin', header: 'Margin' },
      ]);
    } else {
      exportExcel('product_master', masterRows as any, [
        { key: 'code', header: 'รหัส' }, { key: 'barcode', header: 'บาร์โค้ด' }, { key: 'name', header: 'ชื่อ' },
        { key: 'category', header: 'หมวด' }, { key: 'unit', header: 'หน่วย' },
        { key: 'salePrice', header: 'ราคาขาย' }, { key: 'stockQty', header: 'คงเหลือ' }, { key: 'status', header: 'สถานะ' },
      ]);
    }
  };

  const handlePDF = () => {
    const cols = tab === 'sales' ? SALES_COLS : MASTER_COLS;
    const rows = (tab === 'sales' ? salesRows : masterRows) as any[];
    const html = buildHTMLReport(
      tab === 'sales' ? 'รายงานสินค้าขายดี' : 'รายการสินค้า Master',
      tab === 'sales' ? 'เรียงตามรายได้' : 'ข้อมูลทั้งหมด',
      tab === 'sales' ? `${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}` : 'ณ วันที่ปัจจุบัน',
      cols.map(c => ({ key: String(c.key), header: c.header, align: c.align })),
      rows,
      tab === 'sales' ? [
        { label: 'รายได้รวม', value: `฿${formatCurrency(totalRevenue)}` },
        { label: 'กำไรรวม', value: `฿${formatCurrency(totalProfit)}` },
      ] : [
        { label: 'จำนวน SKU', value: `${masterRows.length} รายการ` },
      ]
    );
    exportPDF(html, tab === 'sales' ? 'product_sales' : 'product_master');
  };

  return (
    <SafeAreaView className={cn('flex-1', 'bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-4 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className={cn('text-lg font-extrabold text-white')}>รายงานสินค้า</Text>
      </View>

      <ScrollView className={cn('flex-1')} contentContainerClassName={cn('p-3 gap-3')} showsVerticalScrollIndicator={false}>
        {tab === 'sales' && <DateRangePicker value={dateRange} onChange={setDateRange} />}

        <View className={cn('flex-row bg-white rounded-xl p-1 gap-1 border border-slate-200')}>
          {([['sales','สินค้าขายดี'],['master','Master สินค้า']] as const).map(([k, lbl]) => (
            <TouchableOpacity key={k} className={cn('flex-1 py-2 rounded-lg items-center', tab === k && 'bg-rose-600')} onPress={() => setTab(k)}>
              <Text className={cn('text-xs font-medium text-slate-500', tab === k && 'text-white font-bold')}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className={cn('bg-white rounded-2xl p-3 min-h-[400px] shadow-sm')}>
          {tab === 'sales' ? (
            <ReportListView
              title="สินค้าขายดี"
              subtitle={`${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`}
              columns={SALES_COLS}
              data={salesRows}
              keyExtractor={r => r.code}
              searchKeys={['name', 'code', 'category']}
              searchPlaceholder="ค้นหาสินค้า..."
              summaryRows={[
                { label: 'รายได้รวม', value: `฿${formatCurrency(totalRevenue)}` },
                { label: 'กำไรรวม', value: `฿${formatCurrency(totalProfit)}` },
              ]}
              onExcelExport={handleExcel}
              onPdfExport={handlePDF}
            />
          ) : (
            <ReportListView
              title="รายการสินค้า Master"
              subtitle={`ทั้งหมด ${masterRows.length} รายการ`}
              columns={MASTER_COLS}
              data={masterRows}
              keyExtractor={r => r.code}
              searchKeys={['name', 'code', 'barcode', 'category']}
              searchPlaceholder="ค้นหาชื่อ รหัส บาร์โค้ด..."
              summaryRows={[
                { label: 'SKU ทั้งหมด', value: `${masterRows.length} รายการ` },
                { label: 'Active', value: `${masterRows.filter(r => r.status === 'ใช้งาน').length}` },
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
