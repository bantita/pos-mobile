/**
 * SCR-RPT-003 + M05 Listing — Inventory Report + Stock Document List
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { ReportListView, Column } from '@/features/reports/presentation/components/ReportListView';
import { MOCK_STOCK_ITEMS } from '@/features/reports/data/mocks/mockReports';
import { useStockDocStore } from '@/features/inventory/application/stores/stockDocStore';
import { exportExcel, exportPDF, buildHTMLReport } from '@/shared/lib/exportReport';
import { formatCurrency, formatDateTime } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

interface Props { onBack: () => void }

type Tab = 'stock' | 'receive' | 'issue';

interface StockRow { code: string; name: string; category: string; warehouse: string; onHand: string; minStock: string; unit: string; value: string; status: string }
interface DocRow { docNo: string; docType: string; warehouse: string; supplier: string; items: string; totalQty: string; totalCost: string; status: string; date: string; createdBy: string }

const STATUS_LABEL: Record<string, string> = { draft: 'แบบร่าง', confirmed: 'ยืนยัน', cancelled: 'ยกเลิก', revised: 'Revised' };
const STATUS_COLOR: Record<string, string> = { draft: '#a16207', confirmed: '#0f766e', cancelled: '#ef4444', revised: '#f87171' };

export const InventoryReportListScreen: React.FC<Props> = ({ onBack }) => {
  const [tab, setTab] = useState<Tab>('stock');
  const { documents } = useStockDocStore();

  const stockRows: StockRow[] = MOCK_STOCK_ITEMS.map(s => ({
    code:      s.productCode,
    name:      s.productName,
    category:  s.categoryName,
    warehouse: s.warehouseName,
    onHand:    `${s.onHandQty}`,
    minStock:  `${s.minStock}`,
    unit:      s.unit,
    value:     `฿${formatCurrency(s.inventoryValue)}`,
    status:    s.status === 'ok' ? 'ปกติ' : s.status === 'low' ? 'ใกล้หมด' : s.status === 'out' ? 'หมดสต๊อก' : 'Dead Stock',
  }));

  const receiveDocs = documents.filter(d => d.docType === 'receive');
  const issueDocs   = documents.filter(d => d.docType === 'issue');

  const toDocRow = (d: typeof documents[0]): DocRow => ({
    docNo:     d.docNo + (d.revNo > 0 ? ` Rev.${d.revNo}` : ''),
    docType:   d.docType === 'receive' ? 'รับสินค้า' : 'เบิกสินค้า',
    warehouse: d.warehouseName,
    supplier:  d.supplierName ?? d.toWarehouseName ?? '—',
    items:     `${d.totalItems}`,
    totalQty:  `${d.totalQtyBase}`,
    totalCost: d.docType === 'receive' ? `฿${formatCurrency(d.totalCost)}` : '—',
    status:    STATUS_LABEL[d.status] ?? d.status,
    date:      formatDateTime(d.createdAt),
    createdBy: d.createdBy,
  });

  const STOCK_COLS: Column<StockRow>[] = [
    { key: 'code',      header: 'รหัส',      flex: 0.7, sortable: true },
    { key: 'name',      header: 'ชื่อสินค้า', flex: 2,   sortable: true },
    { key: 'warehouse', header: 'คลัง',      flex: 0.9 },
    { key: 'onHand',    header: 'คงเหลือ',  flex: 0.7, align: 'center', sortable: true,
      render: (v, row) => {
        const n = parseInt(String(v));
        const color = n === 0 ? '#ef4444' : n <= parseInt(row.minStock as string) ? '#a16207' : '#0f766e';
        return <Text style={{ color, fontWeight: '700', fontSize: 12 }}>{v} {row.unit}</Text>;
      }
    },
    { key: 'value',  header: 'มูลค่า', flex: 1, align: 'right', sortable: true },
    { key: 'status', header: 'สถานะ', flex: 0.9, align: 'center',
      render: (v) => {
        const colors: Record<string, string> = { 'ปกติ': '#0f766e', 'ใกล้หมด': '#a16207', 'หมดสต๊อก': '#ef4444', 'Dead Stock': '#6b7280' };
        return <Text style={{ color: colors[String(v)] ?? '#292524', fontWeight: '700', fontSize: 12 }}>{v}</Text>;
      }
    },
  ];

  const DOC_COLS: Column<DocRow>[] = [
    { key: 'docNo',     header: 'เลขที่',     flex: 1.3, sortable: true },
    { key: 'supplier',  header: tab === 'receive' ? 'Supplier' : 'ปลายทาง', flex: 1.3 },
    { key: 'items',     header: 'รายการ',    flex: 0.6, align: 'center' },
    { key: 'totalQty',  header: 'จำนวน',     flex: 0.7, align: 'center' },
    { key: 'totalCost', header: 'มูลค่า',    flex: 1, align: 'right' },
    { key: 'status',    header: 'สถานะ',     flex: 0.8, align: 'center',
      render: (v) => <Text style={{ color: STATUS_COLOR[Object.keys(STATUS_LABEL).find(k => STATUS_LABEL[k] === v) ?? ''] ?? '#292524', fontWeight: '700', fontSize: 12 }}>{v}</Text>
    },
    { key: 'date',      header: 'วันที่',    flex: 1.3, sortable: true },
  ];

  const totalValue = MOCK_STOCK_ITEMS.reduce((s, i) => s + i.inventoryValue, 0);

  const handleExcel = () => {
    if (tab === 'stock') {
      exportExcel('inventory_stock', stockRows as any, [
        { key: 'code', header: 'รหัส' }, { key: 'name', header: 'ชื่อ' }, { key: 'warehouse', header: 'คลัง' },
        { key: 'onHand', header: 'คงเหลือ' }, { key: 'minStock', header: 'ขั้นต่ำ' },
        { key: 'unit', header: 'หน่วย' }, { key: 'value', header: 'มูลค่า' }, { key: 'status', header: 'สถานะ' },
      ]);
    } else {
      const docs = tab === 'receive' ? receiveDocs : issueDocs;
      exportExcel(`inventory_${tab}`, docs.map(toDocRow) as any, [
        { key: 'docNo', header: 'เลขที่' }, { key: 'supplier', header: 'Supplier/ปลายทาง' },
        { key: 'items', header: 'รายการ' }, { key: 'totalQty', header: 'จำนวน' },
        { key: 'totalCost', header: 'มูลค่า' }, { key: 'status', header: 'สถานะ' }, { key: 'date', header: 'วันที่' },
      ]);
    }
  };

  const handlePDF = () => {
    if (tab === 'stock') {
      const html = buildHTMLReport(
        'รายงานคลังสินค้า', 'Stock On Hand', 'ณ วันปัจจุบัน',
        STOCK_COLS.map(c => ({ key: String(c.key), header: c.header, align: c.align })),
        stockRows as any,
        [{ label: 'มูลค่าคลังรวม', value: `฿${formatCurrency(totalValue)}` }]
      );
      exportPDF(html, 'inventory_stock');
    } else {
      const docs = (tab === 'receive' ? receiveDocs : issueDocs).map(toDocRow);
      const html = buildHTMLReport(
        tab === 'receive' ? 'เอกสารรับสินค้า' : 'เอกสารเบิกสินค้า', 'รายการทั้งหมด', 'ณ วันปัจจุบัน',
        DOC_COLS.map(c => ({ key: String(c.key), header: c.header, align: c.align })),
        docs as any,
        [{ label: 'จำนวนเอกสาร', value: `${docs.length} รายการ` }]
      );
      exportPDF(html, `inventory_${tab}`);
    }
  };

  return (
    <SafeAreaView className={cn('flex-1', 'bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-4 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className={cn('text-lg font-extrabold text-white')}>รายงานคลังสินค้า</Text>
      </View>

      <ScrollView className={cn('flex-1')} contentContainerClassName={cn('p-3 gap-3')} showsVerticalScrollIndicator={false}>
        <View className={cn('flex-row bg-white rounded-xl p-1 gap-1 border border-slate-200')}>
          {([['stock','คงเหลือ'],['receive','รับสินค้า'],['issue','เบิกสินค้า']] as const).map(([k, lbl]) => (
            <TouchableOpacity key={k} className={cn('flex-1 py-2 rounded-lg items-center', tab === k && 'bg-rose-600')} onPress={() => setTab(k)}>
              <Text className={cn('text-xs font-medium text-slate-500', tab === k && 'text-white font-bold')}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className={cn('bg-white rounded-2xl p-3 min-h-[400px] shadow-sm')}>
          {tab === 'stock' ? (
            <ReportListView
              title="ยอดคงเหลือสินค้า"
              subtitle={`${stockRows.length} รายการ | มูลค่า ฿${formatCurrency(totalValue)}`}
              columns={STOCK_COLS}
              data={stockRows}
              keyExtractor={r => `${r.code}-${r.warehouse}`}
              searchKeys={['name', 'code', 'category', 'warehouse']}
              searchPlaceholder="ค้นหาสินค้า คลัง..."
              summaryRows={[
                { label: 'SKU ทั้งหมด', value: `${stockRows.length}` },
                { label: 'มูลค่ารวม', value: `฿${formatCurrency(totalValue)}` },
              ]}
              onExcelExport={handleExcel}
              onPdfExport={handlePDF}
            />
          ) : tab === 'receive' ? (
            <ReportListView
              title="เอกสารรับสินค้า"
              subtitle={`${receiveDocs.length} เอกสาร`}
              columns={DOC_COLS}
              data={receiveDocs.map(toDocRow)}
              keyExtractor={r => r.docNo}
              searchKeys={['docNo', 'supplier', 'status']}
              searchPlaceholder="ค้นหาเลขที่ Supplier..."
              summaryRows={[
                { label: 'เอกสารทั้งหมด', value: `${receiveDocs.length}` },
                { label: 'ยืนยันแล้ว', value: `${receiveDocs.filter(d => d.status === 'confirmed').length}` },
              ]}
              onExcelExport={handleExcel}
              onPdfExport={handlePDF}
            />
          ) : (
            <ReportListView
              title="เอกสารเบิกสินค้า"
              subtitle={`${issueDocs.length} เอกสาร`}
              columns={DOC_COLS}
              data={issueDocs.map(toDocRow)}
              keyExtractor={r => r.docNo}
              searchKeys={['docNo', 'supplier', 'status']}
              summaryRows={[
                { label: 'เอกสารทั้งหมด', value: `${issueDocs.length}` },
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
