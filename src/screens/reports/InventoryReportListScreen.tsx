/**
 * SCR-RPT-003 + M05 Listing — Inventory Report + Stock Document List
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ReportListView, Column } from '../../components/reports/ReportListView';
import { MOCK_STOCK_ITEMS } from '../../data/mockReports';
import { useStockDocStore } from '../../store/stockDocStore';
import { exportExcel, exportPDF, buildHTMLReport } from '../../utils/exportReport';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency, formatDateTime } from '../../utils/format';

interface Props { onBack: () => void }

type Tab = 'stock' | 'receive' | 'issue';

interface StockRow { code: string; name: string; category: string; warehouse: string; onHand: string; minStock: string; unit: string; value: string; status: string }
interface DocRow { docNo: string; docType: string; warehouse: string; supplier: string; items: string; totalQty: string; totalCost: string; status: string; date: string; createdBy: string }

const STATUS_LABEL: Record<string, string> = { draft: 'แบบร่าง', confirmed: 'ยืนยัน', cancelled: 'ยกเลิก', revised: 'Revised' };
const STATUS_COLOR: Record<string, string> = { draft: Colors.warning, confirmed: Colors.success, cancelled: Colors.danger, revised: Colors.primary };

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
        const color = n === 0 ? Colors.danger : n <= parseInt(row.minStock as string) ? Colors.warning : Colors.success;
        return <Text style={{ color, fontWeight: '700', fontSize: FontSize.caption }}>{v} {row.unit}</Text>;
      }
    },
    { key: 'value',  header: 'มูลค่า', flex: 1, align: 'right', sortable: true },
    { key: 'status', header: 'สถานะ', flex: 0.9, align: 'center',
      render: (v) => {
        const colors: Record<string, string> = { 'ปกติ': Colors.success, 'ใกล้หมด': Colors.warning, 'หมดสต๊อก': Colors.danger, 'Dead Stock': Colors.gray500 };
        return <Text style={{ color: colors[String(v)] ?? Colors.text, fontWeight: '700', fontSize: FontSize.xs }}>{v}</Text>;
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
      render: (v) => <Text style={{ color: STATUS_COLOR[Object.keys(STATUS_LABEL).find(k => STATUS_LABEL[k] === v) ?? ''] ?? Colors.text, fontWeight: '700', fontSize: FontSize.xs }}>{v}</Text>
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>รายงานคลังสินค้า</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.tabRow}>
          {([['stock','คงเหลือ'],['receive','รับสินค้า'],['issue','เบิกสินค้า']] as const).map(([k, lbl]) => (
            <TouchableOpacity key={k} style={[styles.tab, tab === k && styles.tabActive]} onPress={() => setTab(k)}>
              <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.listCard}>
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
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.success, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  tabRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: 4, gap: 4, borderWidth: 1, borderColor: Colors.border },
  tab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.success },
  tabText: { ...Typography.label, color: Colors.textSecondary, fontSize: FontSize.sm },
  tabTextActive: { color: Colors.white, fontWeight: '700' },
  listCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2, minHeight: 400 },
});
