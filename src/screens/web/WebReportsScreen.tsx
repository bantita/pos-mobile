/**
 * WebReportsScreen — M09 รายงาน
 * Hub → SalesReport | ProductReport | InventoryReport | ProfitReport | Enterprise
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { Colors, Space, Radius, Shadow, Font } from '../../design-system/tokens';
import {
  MOCK_SALES_SUMMARY, MOCK_SALES_BY_DAY, MOCK_SALES_BY_MONTH,
  MOCK_SALES_BY_CATEGORY, MOCK_SALES_BY_CASHIER,
  MOCK_TOP_PRODUCTS, MOCK_STOCK_ITEMS,
  MOCK_PROFIT_BY_DAY, MOCK_PROFIT_BY_MONTH, MOCK_PROFIT_BY_PRODUCT,
  MOCK_BRANCH_KPI, MOCK_POS_PERFORMANCE,
} from '../../data/mockReports';
import { LookupCheckbox } from '../../components/ui/LookupCheckbox';

const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });

// ─── Mini Bar Chart (ไม่ใช้ library) ──────────────────────────────────────────
const BarChart: React.FC<{ data: { label: string; value: number; value2?: number }[]; color?: string; color2?: string; height?: number }> = ({
  data, color = WebColors.primary, color2 = WebColors.success, height = 120,
}) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
      {data.map((d, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
          {d.value2 !== undefined && (
            <View style={{ width: '100%', height: `${(d.value2 / max) * 80}%` as any, backgroundColor: color2 + '50', borderRadius: 3, position: 'absolute', bottom: 16 }} />
          )}
          <View style={{ width: '75%', height: `${(d.value / max) * 80}%` as any, backgroundColor: color, borderRadius: 3, minHeight: 3 }} />
          <Text style={{ fontSize: 12, color: WebColors.textSecondary, marginTop: 3 }}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
};

// ─── Date Range Presets ───────────────────────────────────────────────────────
const DATE_PRESETS = ['วันนี้', '7 วัน', 'เดือนนี้', 'เดือนที่แล้ว'];
const DateRangeBar: React.FC<{ selected: string; onChange: (v: string) => void }> = ({ selected, onChange }) => (
  <View style={{ flexDirection: 'row', gap: 6 }}>
    {DATE_PRESETS.map(p => (
      <TouchableOpacity key={p} style={[dr.btn, selected === p && dr.btnActive]} onPress={() => onChange(p)}>
        <Text style={[dr.btnText, selected === p && dr.btnTextActive]}>{p}</Text>
      </TouchableOpacity>
    ))}
  </View>
);
const dr = StyleSheet.create({
  btn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: WebColors.border, backgroundColor: '#fff' },
  btnActive: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  btnText: { fontSize: 13, color: WebColors.textSecondary },
  btnTextActive: { color: '#fff', fontWeight: '700' },
});

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{ label: string; value: string; sub?: string; icon: string; color: string; trend?: number }> = ({ label, value, sub, icon, color, trend }) => (
  <View style={[kpi.card, { borderLeftColor: color }]}>
    <View style={[kpi.icon, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={kpi.label}>{label}</Text>
      <Text style={[kpi.value, { color }]}>{value}</Text>
      {sub && <Text style={kpi.sub}>{sub}</Text>}
      {trend !== undefined && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
          <Ionicons name={trend >= 0 ? 'trending-up-outline' : 'trending-down-outline'} size={11} color={trend >= 0 ? WebColors.success : WebColors.danger} />
          <Text style={{ fontSize: 12, color: trend >= 0 ? WebColors.success : WebColors.danger, fontWeight: '600' }}>
            {trend >= 0 ? '+' : ''}{trend}%
          </Text>
        </View>
      )}
    </View>
  </View>
);
const kpi = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderLeftWidth: 4, borderWidth: 1, borderColor: WebColors.border },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, color: WebColors.textSecondary },
  value: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  sub: { fontSize: 13, color: WebColors.textSecondary },
});

// ─── Table Shell ──────────────────────────────────────────────────────────────
const TableShell: React.FC<{ cols: [string, number][]; rows: React.ReactNode[] }> = ({ cols, rows }) => (
  <View style={tbl.wrap}>
    <View style={tbl.head}>
      {cols.map(([h, f]) => <Text key={h} style={[tbl.th, { flex: f }]}>{h}</Text>)}
    </View>
    {rows}
  </View>
);
const tbl = StyleSheet.create({
  wrap: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: WebColors.border },
  head: { flexDirection: 'row', backgroundColor: WebColors.gray50, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: WebColors.border },
  th: { fontSize: 13, fontWeight: '700', color: WebColors.textSecondary, textTransform: 'uppercase' },
  tr: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: WebColors.border, alignItems: 'center' },
  trAlt: { backgroundColor: WebColors.gray50 },
  td: { fontSize: 12, color: WebColors.text },
});

// ─── Individual Report Screens ────────────────────────────────────────────────

const SalesReport: React.FC = () => {
  const [dateRange, setDateRange] = useState('7 วัน');
  const [viewMode, setViewMode]   = useState<'day'|'month'>('day');
  const s = MOCK_SALES_SUMMARY;
  const chartData = (viewMode === 'day' ? MOCK_SALES_BY_DAY : MOCK_SALES_BY_MONTH).map(d => ({ label: d.label, value: d.sales, value2: d.profit }));

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <DateRangeBar selected={dateRange} onChange={setDateRange} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={rpt.exportBtn}><Ionicons name="document-text-outline" size={14} color={WebColors.success} /><Text style={[rpt.exportText, { color: WebColors.success }]}>Excel</Text></TouchableOpacity>
          <TouchableOpacity style={[rpt.exportBtn, { borderColor: WebColors.danger }]}><Ionicons name="document-outline" size={14} color={WebColors.danger} /><Text style={[rpt.exportText, { color: WebColors.danger }]}>PDF</Text></TouchableOpacity>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <KpiCard label="ยอดขายรวม" value={`฿${fmt(s.totalSales)}`} icon="cash-outline" color={WebColors.primary} trend={12} />
        <KpiCard label="จำนวนบิล" value={`${s.totalBills}`} sub={`ยกเลิก ${s.cancelledBills} บิล`} icon="receipt-outline" color={WebColors.success} trend={5} />
        <KpiCard label="เฉลี่ย/บิล" value={`฿${fmt(s.avgPerBill)}`} icon="analytics-outline" color="#7C3AED" />
        <KpiCard label="ส่วนลดรวม" value={`฿${fmt(s.totalDiscount)}`} icon="pricetag-outline" color="#F59E0B" />
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        {/* Chart */}
        <View style={[rpt.card, { flex: 1.5 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={rpt.cardTitle}>ยอดขายราย{viewMode === 'day' ? 'วัน' : 'เดือน'}</Text>
            <TouchableOpacity style={rpt.toggleBtn} onPress={() => setViewMode(v => v === 'day' ? 'month' : 'day')}>
              <Text style={rpt.toggleText}>{viewMode === 'day' ? 'ดูรายเดือน' : 'ดูรายวัน'}</Text>
            </TouchableOpacity>
          </View>
          <BarChart data={chartData} height={130} />
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, justifyContent: 'center' }}>
            {[{color: WebColors.primary, label:'ยอดขาย'},{color:WebColors.success+'50',label:'กำไร'}].map(l => (
              <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 10, height: 10, borderRadius: 8, backgroundColor: l.color }} />
                <Text style={{ fontSize: 13, color: WebColors.textSecondary }}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* By Category */}
        <View style={[rpt.card, { flex: 1 }]}>
          <Text style={rpt.cardTitle}>ยอดขายตามหมวด</Text>
          {MOCK_SALES_BY_CATEGORY.map((c, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <View style={[rpt.rankBadge, i < 3 && { backgroundColor: WebColors.primary }]}>
                <Text style={[{ fontSize: 12, fontWeight: '700', color: i < 3 ? '#fff' : WebColors.textSecondary }]}>{i + 1}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 12, color: WebColors.text }}>{c.categoryName}</Text>
              <View style={{ width: 80, height: 6, backgroundColor: WebColors.gray100, borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ width: `${c.percent}%` as any, height: '100%', backgroundColor: WebColors.primary, borderRadius: 3 }} />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: WebColors.primary, width: 60, textAlign: 'right' }}>฿{c.sales.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Payment breakdown */}
      <View style={rpt.card}>
        <Text style={rpt.cardTitle}>ช่องทางชำระเงิน</Text>
        <View style={{ flexDirection: 'row', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'เงินสด', amt: s.cashAmount, icon: 'cash-outline', color: WebColors.success },
            { label: 'QR Code', amt: s.qrAmount, icon: 'qr-code-outline', color: WebColors.primary },
            { label: 'โอนเงิน', amt: s.transferAmount, icon: 'phone-portrait-outline', color: '#7C3AED' },
            { label: 'บัตรเครดิต', amt: s.creditAmount, icon: 'card-outline', color: '#F59E0B' },
          ].map((p, i) => (
            <View key={i} style={{ alignItems: 'center', gap: 4, flex: 1 }}>
              <View style={[{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, { backgroundColor: p.color + '18' }]}>
                <Ionicons name={p.icon as any} size={22} color={p.color} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: '800', color: p.color }}>฿{p.amt.toLocaleString()}</Text>
              <Text style={{ fontSize: 13, color: WebColors.textSecondary }}>{p.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Cashier table */}
      <View style={rpt.card}>
        <Text style={rpt.cardTitle}>ยอดขายตามพนักงาน</Text>
        <TableShell
          cols={[['พนักงาน',1.5],['POS',0.8],['ยอดขาย',1],['จำนวนบิล',0.8],['เฉลี่ย/บิล',0.9]]}
          rows={MOCK_SALES_BY_CASHIER.map((c, i) => (
            <View key={i} style={[tbl.tr, i % 2 === 1 && tbl.trAlt]}>
              <Text style={[tbl.td, { flex: 1.5, fontWeight: '600' }]}>{c.cashierName}</Text>
              <Text style={[tbl.td, { flex: 0.8 }]}>{c.posName}</Text>
              <Text style={[tbl.td, { flex: 1, color: WebColors.primary, fontWeight: '700' }]}>฿{fmt(c.sales)}</Text>
              <Text style={[tbl.td, { flex: 0.8 }]}>{c.bills} บิล</Text>
              <Text style={[tbl.td, { flex: 0.9 }]}>฿{fmt(c.avgPerBill)}</Text>
            </View>
          ))}
        />
      </View>
    </ScrollView>
  );
};

// ─── Sales Sub-Reports (stub screens) ────────────────────────────────────────
const SalesSummaryReport: React.FC = () => {
  const s = MOCK_SALES_SUMMARY;

  const excelRows = MOCK_SALES_BY_DAY.map(d => [d.label, `฿${fmt(d.sales)}`, `฿${fmt(d.profit)}`, String(d.bills ?? '-')]);
  const pdfHeaders = ['วันที่', 'ยอดขาย', 'กำไร', 'จำนวนบิล'];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
        <TouchableOpacity style={rpt.exportBtn} onPress={() => exportGenericExcel('รายงานสรุปการขาย', pdfHeaders, excelRows, 'SalesSummaryReport')}>
          <Ionicons name="document-text-outline" size={14} color={WebColors.success} />
          <Text style={[rpt.exportText, { color: WebColors.success }]}>Excel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[rpt.exportBtn, { borderColor: WebColors.danger }]} onPress={() => printGenericPDF('รายงานสรุปการขาย', pdfHeaders, excelRows)}>
          <Ionicons name="document-outline" size={14} color={WebColors.danger} />
          <Text style={[rpt.exportText, { color: WebColors.danger }]}>PDF</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <KpiCard label="ยอดขายรวม"   value={`฿${fmt(s.totalSales)}`}    icon="cash-outline"      color={WebColors.primary} trend={12} />
        <KpiCard label="จำนวนบิล"    value={`${s.totalBills} บิล`}       icon="receipt-outline"   color={WebColors.success} />
        <KpiCard label="ยกเลิก"       value={`${s.cancelledBills} บิล`}  icon="close-circle-outline" color={WebColors.danger} />
        <KpiCard label="ส่วนลดรวม"   value={`฿${fmt(s.totalDiscount)}`} icon="pricetag-outline"  color="#F59E0B" />
      </View>
      <View style={rpt.card}>
        <Text style={rpt.cardTitle}>สรุปยอดขายรายวัน</Text>
        <TableShell
          cols={[['วันที่',1],['ยอดขาย',1],['กำไร',1],['จำนวนบิล',0.8]]}
          rows={MOCK_SALES_BY_DAY.map((d,i) => (
            <View key={i} style={[tbl.tr, i%2===1&&tbl.trAlt]}>
              <Text style={[tbl.td,{flex:1}]}>{d.label}</Text>
              <Text style={[tbl.td,{flex:1,color:WebColors.primary,fontWeight:'700'}]}>฿{fmt(d.sales)}</Text>
              <Text style={[tbl.td,{flex:1,color:WebColors.success}]}>฿{fmt(d.profit)}</Text>
              <Text style={[tbl.td,{flex:0.8}]}>{d.bills ?? '-'} บิล</Text>
            </View>
          ))}
        />
      </View>
    </ScrollView>
  );
};

const TaxAllShopsReport: React.FC = () => <TaxReport />;

const TaxByShopReport: React.FC = () => {
  const shops = ['ร้านสะดวกซื้อ ABC – สาขาหลัก', 'ร้านสะดวกซื้อ ABC – สาขา 2'];
  const allRows = MOCK_TAX_INVOICES.map(r => [r.billNo, r.date, r.cashier, `฿${fmt(r.subtotal)}`, `฿${fmt(r.vat)}`, `฿${fmt(r.grand)}`, r.taxType === 'tax_full' ? 'เต็มรูป' : 'อย่างย่อ']);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
        <TouchableOpacity style={rpt.exportBtn} onPress={() => exportGenericExcel('ภาษีขายแยกตามร้านค้า', ['เลขที่บิล','วันที่','แคชเชียร์','ก่อน VAT','VAT 7%','รวม VAT','ประเภท'], allRows, 'TaxByShopReport')}>
          <Ionicons name="document-text-outline" size={14} color={WebColors.success} /><Text style={[rpt.exportText,{color:WebColors.success}]}>Excel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[rpt.exportBtn,{borderColor:WebColors.danger}]} onPress={() => printGenericPDF('ภาษีขายแยกตามร้านค้า', ['เลขที่บิล','วันที่','แคชเชียร์','ก่อน VAT','VAT 7%','รวม VAT','ประเภท'], allRows)}>
          <Ionicons name="document-outline" size={14} color={WebColors.danger} /><Text style={[rpt.exportText,{color:WebColors.danger}]}>PDF</Text>
        </TouchableOpacity>
      </View>
      {shops.map((shop, si) => {
        const rows = MOCK_TAX_INVOICES.slice(si * 4, si * 4 + 4);
        const totG = rows.reduce((s,r)=>s+r.grand,0);
        const totV = rows.reduce((s,r)=>s+r.vat,0);
        const totN = rows.reduce((s,r)=>s+r.subtotal,0);
        return (
          <View key={si} style={rpt.card}>
            <Text style={rpt.cardTitle}>{shop}</Text>
            <TableShell
              cols={[['เลขที่บิล',1.4],['วันที่',0.8],['ก่อน VAT',1],['VAT 7%',0.8],['รวม VAT',1],['ประเภท',0.9]]}
              rows={rows.map((inv,i) => (
                <View key={i} style={[tbl.tr,i%2===1&&tbl.trAlt]}>
                  <Text style={[tbl.td,{flex:1.4,color:WebColors.primary,fontWeight:'600'}]}>{inv.billNo}</Text>
                  <Text style={[tbl.td,{flex:0.8,fontSize: 13}]}>{inv.date}</Text>
                  <Text style={[tbl.td,{flex:1,textAlign:'right'}]}>฿{fmt(inv.subtotal)}</Text>
                  <Text style={[tbl.td,{flex:0.8,textAlign:'right',color:'#7C3AED',fontWeight:'700'}]}>฿{fmt(inv.vat)}</Text>
                  <Text style={[tbl.td,{flex:1,textAlign:'right',fontWeight:'700',color:WebColors.primary}]}>฿{fmt(inv.grand)}</Text>
                  <View style={{flex:0.9,justifyContent:'center'}}>
                    <View style={[rpt.marginBadge,{backgroundColor:inv.taxType==='tax_full'?'#EDE9FE':WebColors.primaryLight}]}>
                      <Text style={{fontSize: 12,fontWeight:'700',color:inv.taxType==='tax_full'?'#7C3AED':WebColors.primary}}>{inv.taxType==='tax_full'?'เต็ม':'ย่อ'}</Text>
                    </View>
                  </View>
                </View>
              ))}
            />
            <View style={{flexDirection:'row',justifyContent:'flex-end',gap:16,paddingTop:8,borderTopWidth:1,borderTopColor:WebColors.border}}>
              <Text style={{fontSize: 13,color:WebColors.textSecondary}}>รวม {rows.length} รายการ</Text>
              <Text style={{fontSize: 12,fontWeight:'800',color:'#7C3AED'}}>VAT ฿{fmt(totV)}</Text>
              <Text style={{fontSize: 12,fontWeight:'800',color:WebColors.primary}}>รวม ฿{fmt(totG)}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const PaySummaryByShopReport: React.FC = () => {
  const data = [
    { shop: 'สาขาหลัก',   cash: 12500, qr: 8200,  transfer: 3100, total: 23800 },
    { shop: 'สาขา 2',     cash:  7800, qr: 5400,  transfer: 1900, total: 15100 },
  ];
  const excelRows = data.map(d => [d.shop, `฿${d.cash.toLocaleString()}`, `฿${d.qr.toLocaleString()}`, `฿${d.transfer.toLocaleString()}`, `฿${d.total.toLocaleString()}`]);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
        <TouchableOpacity style={rpt.exportBtn} onPress={() => exportGenericExcel('สรุปยอดรับจ่ายแยกร้านค้า', ['ร้านค้า','เงินสด','QR','โอน','รวม'], excelRows, 'PaySummaryReport')}>
          <Ionicons name="document-text-outline" size={14} color={WebColors.success} /><Text style={[rpt.exportText,{color:WebColors.success}]}>Excel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[rpt.exportBtn,{borderColor:WebColors.danger}]} onPress={() => printGenericPDF('สรุปยอดรับจ่ายแยกร้านค้า', ['ร้านค้า','เงินสด','QR','โอน','รวม'], excelRows)}>
          <Ionicons name="document-outline" size={14} color={WebColors.danger} /><Text style={[rpt.exportText,{color:WebColors.danger}]}>PDF</Text>
        </TouchableOpacity>
      </View>
      <View style={rpt.card}>
        <Text style={rpt.cardTitle}>สรุปยอดรับ-จ่าย แยกตามร้านค้า</Text>
        <TableShell
          cols={[['ร้านค้า',1.5],['เงินสด',1],['QR',1],['โอน',1],['รวม',1]]}
          rows={data.map((d,i) => (
            <View key={i} style={[tbl.tr,i%2===1&&tbl.trAlt]}>
              <Text style={[tbl.td,{flex:1.5,fontWeight:'700'}]}>{d.shop}</Text>
              <Text style={[tbl.td,{flex:1,color:WebColors.success}]}>฿{d.cash.toLocaleString()}</Text>
              <Text style={[tbl.td,{flex:1,color:WebColors.primary}]}>฿{d.qr.toLocaleString()}</Text>
              <Text style={[tbl.td,{flex:1,color:'#7C3AED'}]}>฿{d.transfer.toLocaleString()}</Text>
              <Text style={[tbl.td,{flex:1,fontWeight:'800',color:WebColors.text}]}>฿{d.total.toLocaleString()}</Text>
            </View>
          ))}
        />
      </View>
    </ScrollView>
  );
};

const SalesByPOSReport: React.FC = () => {
  const excelRows = MOCK_POS_PERFORMANCE.map(p => [p.posName, p.branchName, `฿${p.sales.toLocaleString()}`, String(p.bills), `฿${fmt(p.avgPerBill)}`]);
  return (
  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
      <TouchableOpacity style={rpt.exportBtn} onPress={() => exportGenericExcel('สรุปการขายแยกตามเครื่อง POS', ['รหัสเครื่อง','สาขา','ยอดขาย','จำนวนบิล','เฉลี่ย/บิล'], excelRows, 'SalesByPOSReport')}>
        <Ionicons name="document-text-outline" size={14} color={WebColors.success} /><Text style={[rpt.exportText,{color:WebColors.success}]}>Excel</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[rpt.exportBtn,{borderColor:WebColors.danger}]} onPress={() => printGenericPDF('สรุปการขายแยกตามเครื่อง POS', ['รหัสเครื่อง','สาขา','ยอดขาย','จำนวนบิล','เฉลี่ย/บิล'], excelRows)}>
        <Ionicons name="document-outline" size={14} color={WebColors.danger} /><Text style={[rpt.exportText,{color:WebColors.danger}]}>PDF</Text>
      </TouchableOpacity>
    </View>
    <View style={rpt.card}>
      <Text style={rpt.cardTitle}>สรุปการขายแยกตามเครื่อง POS</Text>
      <TableShell
        cols={[['รหัสเครื่อง',1],['สาขา',1.2],['ยอดขาย',1],['จำนวนบิล',0.8],['เฉลี่ย/บิล',0.9]]}
        rows={MOCK_POS_PERFORMANCE.map((p,i) => (
          <View key={i} style={[tbl.tr,i%2===1&&tbl.trAlt]}>
            <Text style={[tbl.td,{flex:1,fontWeight:'600'}]}>{p.posName}</Text>
            <Text style={[tbl.td,{flex:1.2}]}>{p.branchName}</Text>
            <Text style={[tbl.td,{flex:1,color:WebColors.primary,fontWeight:'700'}]}>฿{p.sales.toLocaleString()}</Text>
            <Text style={[tbl.td,{flex:0.8}]}>{p.bills}</Text>
            <Text style={[tbl.td,{flex:0.9}]}>฿{fmt(p.avgPerBill)}</Text>
          </View>
        ))}
      />
    </View>
  </ScrollView>
  );
};

const SalesByCashierReport: React.FC = () => {
  const excelRows = MOCK_SALES_BY_CASHIER.map(c => [c.cashierName, c.posName, `฿${fmt(c.sales)}`, `${c.bills} บิล`, `฿${fmt(c.avgPerBill)}`]);
  return (
  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
      <TouchableOpacity style={rpt.exportBtn} onPress={() => exportGenericExcel('สรุปการขายแยกตามผู้ขาย', ['พนักงาน','POS','ยอดขาย','จำนวนบิล','เฉลี่ย/บิล'], excelRows, 'SalesByCashierReport')}>
        <Ionicons name="document-text-outline" size={14} color={WebColors.success} /><Text style={[rpt.exportText,{color:WebColors.success}]}>Excel</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[rpt.exportBtn,{borderColor:WebColors.danger}]} onPress={() => printGenericPDF('สรุปการขายแยกตามผู้ขาย', ['พนักงาน','POS','ยอดขาย','จำนวนบิล','เฉลี่ย/บิล'], excelRows)}>
        <Ionicons name="document-outline" size={14} color={WebColors.danger} /><Text style={[rpt.exportText,{color:WebColors.danger}]}>PDF</Text>
      </TouchableOpacity>
    </View>
    <View style={rpt.card}>
      <Text style={rpt.cardTitle}>สรุปการขายแยกตามผู้ขาย</Text>
      <TableShell
        cols={[['พนักงาน',1.5],['POS',0.8],['ยอดขาย',1],['จำนวนบิล',0.8],['เฉลี่ย/บิล',0.9]]}
        rows={MOCK_SALES_BY_CASHIER.map((c,i) => (
          <View key={i} style={[tbl.tr,i%2===1&&tbl.trAlt]}>
            <Text style={[tbl.td,{flex:1.5,fontWeight:'600'}]}>{c.cashierName}</Text>
            <Text style={[tbl.td,{flex:0.8}]}>{c.posName}</Text>
            <Text style={[tbl.td,{flex:1,color:WebColors.primary,fontWeight:'700'}]}>฿{fmt(c.sales)}</Text>
            <Text style={[tbl.td,{flex:0.8}]}>{c.bills} บิล</Text>
            <Text style={[tbl.td,{flex:0.9}]}>฿{fmt(c.avgPerBill)}</Text>
          </View>
        ))}
      />
    </View>
  </ScrollView>
  );
};

const SalesByProductReport: React.FC = () => {
  const excelRows = MOCK_TOP_PRODUCTS.map(p => [p.productCode, p.productName, p.categoryName, String(p.unitsSold), `฿${fmt(p.revenue)}`, `${p.margin.toFixed(1)}%`]);
  return (
  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
      <TouchableOpacity style={rpt.exportBtn} onPress={() => exportGenericExcel('สรุปการขายแยกตามสินค้า', ['รหัส','ชื่อสินค้า','หมวด','จำนวนขาย','รายได้','Margin'], excelRows, 'SalesByProductReport')}>
        <Ionicons name="document-text-outline" size={14} color={WebColors.success} /><Text style={[rpt.exportText,{color:WebColors.success}]}>Excel</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[rpt.exportBtn,{borderColor:WebColors.danger}]} onPress={() => printGenericPDF('สรุปการขายแยกตามสินค้า', ['รหัส','ชื่อสินค้า','หมวด','จำนวนขาย','รายได้','Margin'], excelRows)}>
        <Ionicons name="document-outline" size={14} color={WebColors.danger} /><Text style={[rpt.exportText,{color:WebColors.danger}]}>PDF</Text>
      </TouchableOpacity>
    </View>
    <View style={rpt.card}>
      <Text style={rpt.cardTitle}>สรุปการขายแยกตามสินค้า</Text>
      <TableShell
        cols={[['รหัส',0.8],['ชื่อสินค้า',2],['หมวด',0.9],['จำนวนขาย',0.8],['รายได้',1],['Margin',0.7]]}
        rows={MOCK_TOP_PRODUCTS.map((p,i) => (
          <View key={i} style={[tbl.tr,i%2===1&&tbl.trAlt]}>
            <Text style={[tbl.td,{flex:0.8}]}>{p.productCode}</Text>
            <Text style={[tbl.td,{flex:2,fontWeight:'600'}]} numberOfLines={1}>{p.productName}</Text>
            <Text style={[tbl.td,{flex:0.9}]}>{p.categoryName}</Text>
            <Text style={[tbl.td,{flex:0.8}]}>{p.unitsSold}</Text>
            <Text style={[tbl.td,{flex:1,color:WebColors.primary,fontWeight:'700'}]}>฿{fmt(p.revenue)}</Text>
            <View style={{flex:0.7,justifyContent:'center'}}>
              <View style={[rpt.marginBadge,{backgroundColor:p.margin>=30?'#D1FAE5':'#FEF3C7'}]}>
                <Text style={{fontSize: 13,fontWeight:'700',color:p.margin>=30?WebColors.success:'#F59E0B'}}>{p.margin.toFixed(1)}%</Text>
              </View>
            </View>
          </View>
        ))}
      />
    </View>
  </ScrollView>
  );
};

const TransferReport: React.FC = () => {
  const transfers = MOCK_TAX_INVOICES.filter(i => i.payMethod === 'โอน');
  const excelRows = transfers.map(r => [r.billNo, r.date, r.cashier, `฿${fmt(r.grand)}`]);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 10, flex: 1 }}>
          <KpiCard label="จำนวนรายการโอน" value={`${transfers.length} รายการ`} icon="phone-portrait-outline" color="#7C3AED" />
          <KpiCard label="ยอดรวมโอน" value={`฿${fmt(transfers.reduce((s,r)=>s+r.grand,0))}`} icon="cash-outline" color={WebColors.primary} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, paddingTop: 4, flexShrink: 0 }}>
          <TouchableOpacity style={rpt.exportBtn} onPress={() => exportGenericExcel('รายการโอนเงิน (Transfer)', ['เลขที่บิล','วันที่','แคชเชียร์','ยอด'], excelRows, 'TransferReport')}>
            <Ionicons name="document-text-outline" size={14} color={WebColors.success} /><Text style={[rpt.exportText,{color:WebColors.success}]}>Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[rpt.exportBtn,{borderColor:WebColors.danger}]} onPress={() => printGenericPDF('รายการโอนเงิน (Transfer)', ['เลขที่บิล','วันที่','แคชเชียร์','ยอด'], excelRows)}>
            <Ionicons name="document-outline" size={14} color={WebColors.danger} /><Text style={[rpt.exportText,{color:WebColors.danger}]}>PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={rpt.card}>
        <Text style={rpt.cardTitle}>รายการโอนเงิน (Transfer)</Text>
        <TableShell
          cols={[['เลขที่บิล',1.4],['วันที่',0.8],['แคชเชียร์',1.2],['ยอด',1]]}
          rows={transfers.map((r,i) => (
            <View key={i} style={[tbl.tr,i%2===1&&tbl.trAlt]}>
              <Text style={[tbl.td,{flex:1.4,color:WebColors.primary,fontWeight:'600'}]}>{r.billNo}</Text>
              <Text style={[tbl.td,{flex:0.8,fontSize: 13}]}>{r.date}</Text>
              <Text style={[tbl.td,{flex:1.2}]}>{r.cashier}</Text>
              <Text style={[tbl.td,{flex:1,fontWeight:'700',color:WebColors.primary,textAlign:'right'}]}>฿{fmt(r.grand)}</Text>
            </View>
          ))}
        />
      </View>
    </ScrollView>
  );
};

const BillPaymentReport: React.FC = () => {
  const bills = MOCK_TAX_INVOICES.filter(i => i.payMethod === 'QR Code');
  const excelRows = bills.map(r => [r.billNo, r.date, r.cashier, `฿${fmt(r.grand)}`]);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 10, flex: 1 }}>
          <KpiCard label="จำนวนรายการ Bill" value={`${bills.length} รายการ`} icon="qr-code-outline" color={WebColors.primary} />
          <KpiCard label="ยอดรวม" value={`฿${fmt(bills.reduce((s,r)=>s+r.grand,0))}`} icon="cash-outline" color={WebColors.success} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, paddingTop: 4, flexShrink: 0 }}>
          <TouchableOpacity style={rpt.exportBtn} onPress={() => exportGenericExcel('รายการชำระบิล (Bill Payment)', ['เลขที่บิล','วันที่','แคชเชียร์','ยอด'], excelRows, 'BillPaymentReport')}>
            <Ionicons name="document-text-outline" size={14} color={WebColors.success} /><Text style={[rpt.exportText,{color:WebColors.success}]}>Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[rpt.exportBtn,{borderColor:WebColors.danger}]} onPress={() => printGenericPDF('รายการชำระบิล (Bill Payment)', ['เลขที่บิล','วันที่','แคชเชียร์','ยอด'], excelRows)}>
            <Ionicons name="document-outline" size={14} color={WebColors.danger} /><Text style={[rpt.exportText,{color:WebColors.danger}]}>PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={rpt.card}>
        <Text style={rpt.cardTitle}>รายการชำระบิล (Bill Payment)</Text>
        <TableShell
          cols={[['เลขที่บิล',1.4],['วันที่',0.8],['แคชเชียร์',1.2],['ยอด',1]]}
          rows={bills.map((r,i) => (
            <View key={i} style={[tbl.tr,i%2===1&&tbl.trAlt]}>
              <Text style={[tbl.td,{flex:1.4,color:WebColors.primary,fontWeight:'600'}]}>{r.billNo}</Text>
              <Text style={[tbl.td,{flex:0.8,fontSize: 13}]}>{r.date}</Text>
              <Text style={[tbl.td,{flex:1.2}]}>{r.cashier}</Text>
              <Text style={[tbl.td,{flex:1,fontWeight:'700',color:WebColors.primary,textAlign:'right'}]}>฿{fmt(r.grand)}</Text>
            </View>
          ))}
        />
      </View>
    </ScrollView>
  );
};

const VoidSalesReport: React.FC = () => {
  const voids = [
    { billNo: 'INV-2569-0003', date: '02/06/2569', cashier: 'สมหญิง จริงใจ', reason: 'ลูกค้าเปลี่ยนใจ', grand: -300.00 },
    { billNo: 'INV-2569-0007', date: '04/06/2569', cashier: 'สมชาย ใจดี',    reason: 'สินค้าหมด',      grand:  -70.00 },
  ];
  const excelRows = voids.map(r => [r.billNo, r.date, r.cashier, r.reason, `฿${fmt(Math.abs(r.grand))}`]);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 10, flex: 1 }}>
          <KpiCard label="จำนวนยกเลิก" value={`${voids.length} รายการ`} icon="close-circle-outline" color={WebColors.danger} />
          <KpiCard label="ยอดยกเลิก" value={`฿${fmt(Math.abs(voids.reduce((s,r)=>s+r.grand,0)))}`} icon="cash-outline" color="#F59E0B" />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, paddingTop: 4, flexShrink: 0 }}>
          <TouchableOpacity style={rpt.exportBtn} onPress={() => exportGenericExcel('รายงานการยกเลิกการขาย', ['เลขที่บิล','วันที่','แคชเชียร์','เหตุผล','ยอด'], excelRows, 'VoidSalesReport')}>
            <Ionicons name="document-text-outline" size={14} color={WebColors.success} /><Text style={[rpt.exportText,{color:WebColors.success}]}>Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[rpt.exportBtn,{borderColor:WebColors.danger}]} onPress={() => printGenericPDF('รายงานการยกเลิกการขาย', ['เลขที่บิล','วันที่','แคชเชียร์','เหตุผล','ยอด'], excelRows)}>
            <Ionicons name="document-outline" size={14} color={WebColors.danger} /><Text style={[rpt.exportText,{color:WebColors.danger}]}>PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={rpt.card}>
        <Text style={rpt.cardTitle}>รายงานการยกเลิกการขาย</Text>
        <TableShell
          cols={[['เลขที่บิล',1.4],['วันที่',0.8],['แคชเชียร์',1.2],['เหตุผล',1.5],['ยอด',0.9]]}
          rows={voids.map((r,i) => (
            <View key={i} style={[tbl.tr,i%2===1&&tbl.trAlt]}>
              <Text style={[tbl.td,{flex:1.4,color:WebColors.danger,fontWeight:'600'}]}>{r.billNo}</Text>
              <Text style={[tbl.td,{flex:0.8,fontSize: 13}]}>{r.date}</Text>
              <Text style={[tbl.td,{flex:1.2}]}>{r.cashier}</Text>
              <Text style={[tbl.td,{flex:1.5,color:WebColors.textSecondary}]}>{r.reason}</Text>
              <Text style={[tbl.td,{flex:0.9,fontWeight:'700',color:WebColors.danger,textAlign:'right'}]}>฿{fmt(Math.abs(r.grand))}</Text>
            </View>
          ))}
        />
      </View>
    </ScrollView>
  );
};

// ─── Generic Export Helpers ───────────────────────────────────────────────────
function exportGenericExcel(title: string, headers: string[], rows: string[][], filename: string) {
  // Export เป็น HTML table — Excel เปิดเป็นตารางแยก column ได้ถูกต้อง
  const ths = headers.map(h => `<th style="background:#f0f0f0;font-weight:bold;border:1px solid #ccc;padding:6px 10px">${h}</th>`).join('');
  const trs = rows.map((r, i) =>
    `<tr>${r.map(c => `<td style="border:1px solid #ddd;padding:5px 10px;${i % 2 === 1 ? 'background:#fafafa' : ''}">${c}</td>`).join('')}</tr>`
  ).join('');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"/><style>td,th{mso-number-format:'\\@';}</style></head>
<body><h2>${title}</h2><table cellpadding="0" cellspacing="0"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></body></html>`;
  const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = (document as any).createElement('a');
  a.href = url; a.download = `${filename}.xls`; a.click();
  URL.revokeObjectURL(url);
}

function printGenericPDF(title: string, headers: string[], rows: string[][], subtitle?: string) {
  const ths = headers.map(h => `<th>${h}</th>`).join('');
  const trs = rows.map((r, i) =>
    `<tr style="${i%2===1?'background:#f9f9f9':''}">${r.map(c=>`<td>${c}</td>`).join('')}</tr>`
  ).join('');
  const html = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"/>
<title>${title}</title>
<style>body{font-family:'Sarabun',Arial,sans-serif;font-size:13px;margin:24px}
h2{font-size:16px;margin:0 0 4px}.sub{font-size:12px;color:#444;margin:0 0 2px}
table{width:100%;border-collapse:collapse;margin-top:16px}
th{background:#e8e8e8;border:1px solid #bbb;padding:7px 8px;font-size:12px;text-align:center}
td{border:1px solid #ccc;padding:6px 8px;font-size:12px}
@media print{body{margin:12px}}</style></head>
<body><h2>${title}</h2>${subtitle?`<p class="sub">${subtitle}</p>`:''}
<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>
</body></html>`;
  const w = (window as any).open('','_blank','width=960,height=680');
  if (!w) return;
  w.document.write(html); w.document.close(); w.focus();
  setTimeout(() => w.print(), 400);
}
type SalesSubView =
  | 'sales_main' | 'sales_summary'
  | 'tax_all' | 'tax_by_shop'
  | 'pay_summary' | 'sales_by_pos' | 'sales_by_cashier' | 'sales_by_product'
  | 'transfer' | 'bill_payment' | 'void_sales';

type ReportView = 'hub' | SalesSubView | 'products' | 'inventory' | 'profit' | 'tax' | 'enterprise' | 'daily_summary' | 'staff_service' | 'shift_report';

const SALES_SUB_MENU: { key: SalesSubView; label: string }[] = [
  { key: 'sales_main',        label: 'รายงานการขาย'                 },
  { key: 'sales_summary',     label: 'รายงานสรุปการขาย'             },
  { key: 'tax_all',           label: 'ภาษีขายโดยรวมทุกร้านค้า'      },
  { key: 'tax_by_shop',       label: 'ภาษีขายแยกตามร้านค้า'         },
  { key: 'pay_summary',       label: 'สรุปยอดรับจ่ายแยกร้านค้า'     },
  { key: 'sales_by_pos',      label: 'สรุปการขายแยกตามเครื่อง'      },
  { key: 'sales_by_cashier',  label: 'สรุปการขายแยกตามผู้ขาย'       },
  { key: 'sales_by_product',  label: 'สรุปการขายแยกตามสินค้า'       },
  { key: 'transfer',          label: 'รายการโอนเงิน (Transfer)'     },
  { key: 'bill_payment',      label: 'รายการชำระบิล (Bill payment)' },
  { key: 'void_sales',        label: 'รายงานการยกเลิกการขาย'        },
];

const CASHIER_SUB: { key: ReportView; label: string }[] = [
  { key: 'sales_by_cashier', label: 'รายงานแคชเชียร์'       },
  { key: 'sales_by_pos',     label: 'สรุปการขายตามเครื่อง' },
];

const OTHER_MENU: { key: ReportView; label: string }[] = [
  { key: 'daily_summary',  label: 'สรุปประจำวัน' },
  { key: 'staff_service',  label: 'รายงานพนักงานบริการ' },
  { key: 'shift_report',   label: 'รายงานกะการขาย' },
  { key: 'inventory',  label: 'รายงานคลังสินค้า' },
  { key: 'profit',     label: 'รายงานกำไร'       },
  { key: 'products',   label: 'รายงานสินค้า'     },
  { key: 'enterprise', label: 'จัดการข้อมูล'     },
];

interface Props { onNavigate: (r: string) => void; initialView?: ReportView }

export const WebReportsScreen: React.FC<Props> = ({ onNavigate, initialView }) => {
  const [view,             setView]             = useState<ReportView>(initialView ?? 'sales_main');
  const [salesExpanded,    setSalesExpanded]    = useState(true);
  const [cashierExpanded,  setCashierExpanded]  = useState(false);
  const [otherExpanded,    setOtherExpanded]    = useState(false);
  const [sidebarOpen,      setSidebarOpen]      = useState(true);

  // sync เมื่อ parent เปลี่ยน initialView (คลิก sidebar นอก)
  React.useEffect(() => {
    if (initialView && initialView !== view) {
      setView(initialView);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialView]);

  // Filter
  const [filterDate,   setFilterDate]   = useState('10/06/2569');
  const [filterDateTo, setFilterDateTo] = useState('10/06/2569');
  const [filterBranch, setFilterBranch] = useState<string[]>([]);
  const [filterPOS,    setFilterPOS]    = useState<string[]>([]);
  // legacy — kept for compat but not displayed
  const [filterShop,   setFilterShop]   = useState('');

  const allMenuItems = [
    ...SALES_SUB_MENU,
    ...CASHIER_SUB,
    ...OTHER_MENU,
  ];
  const currentLabel = allMenuItems.find(m => m.key === view)?.label ?? '';

  const renderContent = () => {
    switch (view) {
      case 'sales_main':       return <SalesReport />;
      case 'sales_summary':    return <SalesSummaryReport />;
      case 'tax_all':          return <TaxAllShopsReport />;
      case 'tax_by_shop':      return <TaxByShopReport />;
      case 'pay_summary':      return <PaySummaryByShopReport />;
      case 'sales_by_pos':     return <SalesByPOSReport />;
      case 'sales_by_cashier': return <SalesByCashierReport />;
      case 'sales_by_product': return <SalesByProductReport />;
      case 'transfer':         return <TransferReport />;
      case 'bill_payment':     return <BillPaymentReport />;
      case 'void_sales':       return <VoidSalesReport />;
      case 'products':         return <ProductsReport />;
      case 'inventory':        return <InventoryReport />;
      case 'profit':           return <ProfitReport />;
      case 'enterprise':       return <EnterpriseReport />;
      case 'daily_summary':    return <DailySummaryReport />;
      case 'staff_service':    return <StaffServiceReport />;
      case 'shift_report':     return <ShiftReport />;
      default:                 return <SalesReport />;
    }
  };

  // ── Sidebar NavGroup ────────────────────────────────────────────────────────
  const renderNavGroup = (
    icon: string, label: string, color: string, bg: string,
    expanded: boolean, onToggle: () => void,
    items: { key: ReportView; label: string }[],
  ) => (
    <>
      <TouchableOpacity style={rpt.navGroupHeader} onPress={onToggle} activeOpacity={0.8}>
        <View style={[rpt.navGroupIcon, { backgroundColor: bg }]}>
          <Ionicons name={icon as any} size={14} color={color} />
        </View>
        <Text style={rpt.navGroupLabel}>{label}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color={WebColors.textSecondary} />
      </TouchableOpacity>
      {expanded && items.map(item => (
        <TouchableOpacity
          key={item.key as string}
          style={[rpt.navItem, view === item.key && rpt.navItemActive]}
          onPress={() => setView(item.key)}
          activeOpacity={0.75}
        >
          <Text style={[rpt.navItemLabel, view === item.key && rpt.navItemLabelActive]} numberOfLines={2}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </>
  );

  return (
    <View style={rpt.screenRoot}>

      {/* ── LEFT SIDEBAR ── */}
      <View style={[rpt.navPanel, !sidebarOpen && { width: 36 }]}>
        {/* Toggle button */}
        <TouchableOpacity
          style={rpt.navToggleBtn}
          onPress={() => setSidebarOpen(o => !o)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={sidebarOpen ? 'chevron-back' : 'chevron-forward'}
            size={14} color={WebColors.primary}
          />
        </TouchableOpacity>

        {sidebarOpen && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            {renderNavGroup('bar-chart-outline', 'รายงานการขาย', WebColors.primary, WebColors.primaryLight,
              salesExpanded,   () => setSalesExpanded(e => !e),   SALES_SUB_MENU)}
            {renderNavGroup('person-outline',   'รายงานแคชเชียร์', '#7C3AED', '#EDE9FE',
              cashierExpanded, () => setCashierExpanded(e => !e), CASHIER_SUB)}
            {renderNavGroup('layers-outline',   'รายงานอื่นๆ',    '#16A34A', '#D1FAE5',
              otherExpanded,   () => setOtherExpanded(e => !e),   OTHER_MENU)}
          </ScrollView>
        )}
      </View>

      {/* ── RIGHT CONTENT ── */}
      <View style={rpt.contentPanel}>

        {/* ── Filter bar ── */}
        <View style={rpt.filterBar}>
          <View style={rpt.filterRow}>
            {/* วันที่ — ใช้ native date picker */}
            <View style={rpt.filterField}>
              <Text style={rpt.filterLabel}>วันที่</Text>
              <View style={rpt.filterInputWrap}>
                <Ionicons name="calendar-outline" size={13} color={WebColors.textSecondary} />
                <TextInput
                  style={rpt.filterInputText}
                  value={filterDate} onChangeText={setFilterDate}
                  placeholder="วว/ดด/ปปปป" placeholderTextColor={WebColors.textDisabled}
                  {...(Platform.OS === 'web' ? { type: 'date' } as any : {})}
                 {...(Platform.OS === "web" ? { type: "date" } as any : {})} />
              </View>
            </View>
            {/* ถึง */}
            <View style={rpt.filterField}>
              <Text style={rpt.filterLabel}>ถึง</Text>
              <View style={rpt.filterInputWrap}>
                <Ionicons name="calendar-outline" size={13} color={WebColors.textSecondary} />
                <TextInput
                  style={rpt.filterInputText}
                  value={filterDateTo} onChangeText={setFilterDateTo}
                  placeholder="วว/ดด/ปปปป" placeholderTextColor={WebColors.textDisabled}
                  {...(Platform.OS === 'web' ? { type: 'date' } as any : {})}
                 {...(Platform.OS === "web" ? { type: "date" } as any : {})} />
              </View>
            </View>
            {/* สาขา — LookupCheckbox */}
            <View style={rpt.filterField}>
              <Text style={rpt.filterLabel}>สาขา</Text>
              <LookupCheckbox
                items={[{ id: 'b1', label: 'สาขาหลัก' }, { id: 'b2', label: 'สาขา 1' }, { id: 'b3', label: 'สาขา 2' }]}
                selectedIds={filterBranch}
                onChange={setFilterBranch}
                placeholder="ทุกสาขา"
                title="เลือกสาขา"
                columns={['ชื่อสาขา']}
              />
            </View>
            {/* เครื่อง POS ที่ — LookupCheckbox */}
            <View style={rpt.filterField}>
              <Text style={rpt.filterLabel}>เครื่อง POS ที่</Text>
              <LookupCheckbox
                items={[{ id: 'pos1', label: 'POS 1' }, { id: 'pos2', label: 'POS 2' }, { id: 'pos3', label: 'POS 3' }]}
                selectedIds={filterPOS}
                onChange={setFilterPOS}
                placeholder="ทุกเครื่อง"
                title="เลือกเครื่อง POS"
                columns={['เครื่อง POS']}
              />
            </View>
            {/* ปุ่มค้นหา */}
            <TouchableOpacity style={[rpt.searchBtn, { alignSelf: 'flex-end' }]}>
              <Ionicons name="search-outline" size={13} color="#fff" />
              <Text style={rpt.searchBtnText}>ค้นหา</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── KPI row ── */}
        <View style={rpt.kpiRow}>
          {[
            { label: 'ยอดขายประจำวัน',    value: '฿48,320' },
            { label: 'ยอดขายประจำสัปดาห์', value: '฿285,600' },
            { label: 'ยอดขายประจำเดือน',   value: '฿1,245,000' },
            { label: 'ยอดขายประจำปี',      value: '฿8,920,000' },
          ].map((k, i) => (
            <View key={i} style={rpt.kpiCard}>
              <Text style={rpt.kpiCardLabel}>{k.label}</Text>
              <Text style={rpt.kpiCardValue}>{k.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Section title ── */}
        <View style={rpt.contentHeader}>
          <Text style={rpt.contentTitle}>{currentLabel || 'รายงานสรุปยอดขายประจำวัน'}</Text>
        </View>

        {/* ── Report content ── */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
          {renderContent()}
        </ScrollView>

      </View>
    </View>
  );
};

// ─── Products Report ──────────────────────────────────────────────────────────
const ProductsReport: React.FC = () => {
  const [dateRange, setDateRange] = useState('เดือนนี้');
  const totalRev  = MOCK_TOP_PRODUCTS.reduce((s, p) => s + p.revenue, 0);
  const totalProf = MOCK_TOP_PRODUCTS.reduce((s, p) => s + p.profit, 0);
  const excelRows = MOCK_TOP_PRODUCTS.map(p => [p.productCode, p.productName, p.categoryName, String(p.unitsSold), `฿${fmt(p.revenue)}`, `฿${fmt(p.profit)}`, `${p.margin.toFixed(1)}%`]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <DateRangeBar selected={dateRange} onChange={setDateRange} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={rpt.exportBtn} onPress={() => exportGenericExcel('รายงานสินค้า', ['รหัส','ชื่อสินค้า','หมวด','จำนวนขาย','รายได้','กำไร','Margin'], excelRows, 'ProductsReport')}>
            <Ionicons name="document-text-outline" size={14} color={WebColors.success} /><Text style={[rpt.exportText,{color:WebColors.success}]}>Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[rpt.exportBtn,{borderColor:WebColors.danger}]} onPress={() => printGenericPDF('รายงานสินค้า', ['รหัส','ชื่อสินค้า','หมวด','จำนวนขาย','รายได้','กำไร','Margin'], excelRows)}>
            <Ionicons name="document-outline" size={14} color={WebColors.danger} /><Text style={[rpt.exportText,{color:WebColors.danger}]}>PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <KpiCard label="รายได้รวม" value={`฿${fmt(totalRev)}`} icon="cash-outline" color={WebColors.primary} />
        <KpiCard label="กำไรรวม" value={`฿${fmt(totalProf)}`} icon="trending-up-outline" color={WebColors.success} />
        <KpiCard label="Avg Margin" value={`${(totalProf/totalRev*100).toFixed(1)}%`} icon="pie-chart-outline" color="#7C3AED" />
      </View>
      <View style={rpt.card}>
        <Text style={rpt.cardTitle}>สินค้าขายดี Top 7</Text>
        <TableShell
          cols={[['#',0.4],['รหัส',0.8],['ชื่อสินค้า',2],['หมวด',0.9],['ขาย',0.7],['รายได้',1],['กำไร',0.9],['Margin',0.7]]}
          rows={MOCK_TOP_PRODUCTS.map((p, i) => (
            <View key={i} style={[tbl.tr, i % 2 === 1 && tbl.trAlt]}>
              <View style={[{ flex: 0.4, alignItems: 'center' }]}>
                <View style={[kpi.icon, { width: 22, height: 22, borderRadius: 11, backgroundColor: i < 3 ? WebColors.primary : WebColors.gray100 }]}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: i < 3 ? '#fff' : WebColors.textSecondary }}>{i+1}</Text>
                </View>
              </View>
              <Text style={[tbl.td, { flex: 0.8 }]}>{p.productCode}</Text>
              <Text style={[tbl.td, { flex: 2, fontWeight: '600' }]} numberOfLines={1}>{p.productName}</Text>
              <Text style={[tbl.td, { flex: 0.9 }]}>{p.categoryName}</Text>
              <Text style={[tbl.td, { flex: 0.7 }]}>{p.unitsSold}</Text>
              <Text style={[tbl.td, { flex: 1, color: WebColors.primary, fontWeight: '700' }]}>฿{fmt(p.revenue)}</Text>
              <Text style={[tbl.td, { flex: 0.9, color: WebColors.success }]}>฿{fmt(p.profit)}</Text>
              <View style={{ flex: 0.7, justifyContent: 'center' }}>
                <View style={[rpt.marginBadge, { backgroundColor: p.margin >= 30 ? '#D1FAE5' : '#FEF3C7' }]}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: p.margin >= 30 ? WebColors.success : '#F59E0B' }}>{p.margin.toFixed(1)}%</Text>
                </View>
              </View>
            </View>
          ))}
        />
      </View>
    </ScrollView>
  );
};

// ─── Inventory Report ─────────────────────────────────────────────────────────
const InventoryReport: React.FC = () => {
  const totalVal = MOCK_STOCK_ITEMS.reduce((s, i) => s + i.inventoryValue, 0);
  const excelRows = MOCK_STOCK_ITEMS.map(i => [i.productCode, i.productName, i.warehouseName, `${i.onHandQty} ${i.unit}`, `฿${i.inventoryValue.toLocaleString()}`, i.status === 'ok' ? 'ปกติ' : i.status === 'low' ? 'ใกล้หมด' : 'หมด']);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
        <TouchableOpacity style={rpt.exportBtn} onPress={() => exportGenericExcel('รายงานคลังสินค้า', ['รหัส','ชื่อสินค้า','คลัง','คงเหลือ','มูลค่า','สถานะ'], excelRows, 'InventoryReport')}>
          <Ionicons name="document-text-outline" size={14} color={WebColors.success} /><Text style={[rpt.exportText,{color:WebColors.success}]}>Excel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[rpt.exportBtn,{borderColor:WebColors.danger}]} onPress={() => printGenericPDF('รายงานคลังสินค้า', ['รหัส','ชื่อสินค้า','คลัง','คงเหลือ','มูลค่า','สถานะ'], excelRows)}>
          <Ionicons name="document-outline" size={14} color={WebColors.danger} /><Text style={[rpt.exportText,{color:WebColors.danger}]}>PDF</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[
          { label: 'SKU ทั้งหมด',  value: String(MOCK_STOCK_ITEMS.length),                                color: WebColors.primary },
          { label: 'ใกล้หมด',      value: String(MOCK_STOCK_ITEMS.filter(i=>i.status==='low').length),  color: '#F59E0B' },
          { label: 'หมดสต๊อก',    value: String(MOCK_STOCK_ITEMS.filter(i=>i.status==='out').length),  color: WebColors.danger },
          { label: 'มูลค่ารวม',    value: `฿${fmt(totalVal)}`,                                           color: WebColors.success },
        ].map((k, i) => <KpiCard key={i} label={k.label} value={k.value} icon="archive-outline" color={k.color} />)}
      </View>
      <View style={rpt.card}>
        <Text style={rpt.cardTitle}>คงเหลือสินค้าทั้งหมด</Text>
        <TableShell
          cols={[['รหัส',0.8],['ชื่อสินค้า',2],['คลัง',0.9],['คงเหลือ',0.9],['มูลค่า',0.9],['สถานะ',0.8]]}
          rows={MOCK_STOCK_ITEMS.map((item, i) => {
            const stColor = item.status==='ok' ? WebColors.success : item.status==='low' ? '#F59E0B' : WebColors.danger;
            const stLabel = item.status==='ok' ? 'ปกติ' : item.status==='low' ? 'ใกล้หมด' : 'หมด';
            return (
              <View key={i} style={[tbl.tr, i%2===1 && tbl.trAlt]}>
                <Text style={[tbl.td, { flex: 0.8, fontWeight: '600' }]}>{item.productCode}</Text>
                <Text style={[tbl.td, { flex: 2 }]} numberOfLines={1}>{item.productName}</Text>
                <Text style={[tbl.td, { flex: 0.9 }]}>{item.warehouseName}</Text>
                <Text style={[tbl.td, { flex: 0.9, fontWeight: '700', color: item.onHandQty <= item.minStock ? WebColors.danger : WebColors.text }]}>{item.onHandQty} {item.unit}</Text>
                <Text style={[tbl.td, { flex: 0.9 }]}>฿{item.inventoryValue.toLocaleString()}</Text>
                <View style={{ flex: 0.8, justifyContent: 'center' }}>
                  <View style={[rpt.marginBadge, { backgroundColor: stColor + '18' }]}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: stColor }}>{stLabel}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        />
      </View>
    </ScrollView>
  );
};

// ─── Profit Report ────────────────────────────────────────────────────────────
const ProfitReport: React.FC = () => {
  const [viewMode, setViewMode] = useState<'day'|'month'|'product'>('day');
  const data = viewMode === 'day' ? MOCK_PROFIT_BY_DAY : viewMode === 'month' ? MOCK_PROFIT_BY_MONTH : null;
  const totalRev  = (data ?? MOCK_PROFIT_BY_DAY).reduce((s, d) => s + d.revenue, 0);
  const totalProf = (data ?? MOCK_PROFIT_BY_DAY).reduce((s, d) => s + d.grossProfit, 0);
  const margin    = totalRev > 0 ? (totalProf / totalRev * 100).toFixed(1) : '0';

  const getExcelRows = () => {
    if (viewMode === 'product') {
      return MOCK_PROFIT_BY_PRODUCT.map(p => [p.productName, String(p.qty), `฿${fmt(p.revenue)}`, `฿${fmt(p.cost)}`, `฿${fmt(p.profit)}`, `${p.margin.toFixed(1)}%`]);
    }
    return (data ?? MOCK_PROFIT_BY_DAY).map(d => [d.label, `฿${fmt(d.revenue)}`, `฿${fmt(d.cost)}`, `฿${fmt(d.grossProfit)}`, `${d.margin}%`]);
  };
  const getHeaders = () => viewMode === 'product'
    ? ['สินค้า','จำนวน','รายได้','ต้นทุน','กำไร','Margin']
    : ['ช่วง','รายได้','ต้นทุน','กำไร','Margin'];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 10, flex: 1 }}>
          <KpiCard label="รายได้รวม" value={`฿${fmt(totalRev)}`} icon="cash-outline" color={WebColors.primary} />
          <KpiCard label="กำไรขั้นต้น" value={`฿${fmt(totalProf)}`} icon="trending-up-outline" color={WebColors.success} />
          <KpiCard label="Gross Margin" value={`${margin}%`} icon="pie-chart-outline" color="#7C3AED" />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, paddingLeft: 12, flexShrink: 0 }}>
          <TouchableOpacity style={rpt.exportBtn} onPress={() => exportGenericExcel('รายงานกำไร', getHeaders(), getExcelRows(), 'ProfitReport')}>
            <Ionicons name="document-text-outline" size={14} color={WebColors.success} /><Text style={[rpt.exportText,{color:WebColors.success}]}>Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[rpt.exportBtn,{borderColor:WebColors.danger}]} onPress={() => printGenericPDF('รายงานกำไร', getHeaders(), getExcelRows())}>
            <Ionicons name="document-outline" size={14} color={WebColors.danger} /><Text style={[rpt.exportText,{color:WebColors.danger}]}>PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* View mode toggle */}
      <View style={{ flexDirection: 'row', backgroundColor: WebColors.gray100, borderRadius: 8, padding: 3, alignSelf: 'flex-start', gap: 3 }}>
        {([['day','รายวัน'],['month','รายเดือน'],['product','ตามสินค้า']] as const).map(([k, l]) => (
          <TouchableOpacity key={k} style={[{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 }, viewMode === k && { backgroundColor: '#fff' }]} onPress={() => setViewMode(k)}>
            <Text style={{ fontSize: 13, fontWeight: viewMode === k ? '700' : '500', color: viewMode === k ? WebColors.text : WebColors.textSecondary }}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {data && (
        <View style={rpt.card}>
          <BarChart data={data.map(d => ({ label: d.label, value: d.revenue, value2: d.grossProfit }))} height={130} />
        </View>
      )}

      <View style={rpt.card}>
        <Text style={rpt.cardTitle}>{viewMode === 'product' ? 'กำไรตามสินค้า' : `กำไรราย${viewMode === 'day' ? 'วัน' : 'เดือน'}`}</Text>
        <TableShell
          cols={viewMode === 'product' ? [['สินค้า',2],['จำนวน',0.7],['รายได้',1],['ต้นทุน',1],['กำไร',1],['Margin',0.7]] : [['ช่วง',0.7],['รายได้',1.2],['ต้นทุน',1.2],['กำไร',1.2],['Margin',0.7]]}
          rows={viewMode === 'product'
            ? MOCK_PROFIT_BY_PRODUCT.map((p, i) => (
              <View key={i} style={[tbl.tr, i%2===1&&tbl.trAlt]}>
                <Text style={[tbl.td,{flex:2,fontWeight:'600'}]} numberOfLines={1}>{p.productName}</Text>
                <Text style={[tbl.td,{flex:0.7}]}>{p.qty}</Text>
                <Text style={[tbl.td,{flex:1}]}>฿{fmt(p.revenue)}</Text>
                <Text style={[tbl.td,{flex:1,color:WebColors.danger}]}>฿{fmt(p.cost)}</Text>
                <Text style={[tbl.td,{flex:1,color:WebColors.success,fontWeight:'700'}]}>฿{fmt(p.profit)}</Text>
                <View style={{flex:0.7,justifyContent:'center'}}>
                  <View style={[rpt.marginBadge,{backgroundColor:p.margin>=30?'#D1FAE5':'#FEF3C7'}]}>
                    <Text style={{fontSize: 13,fontWeight:'700',color:p.margin>=30?WebColors.success:'#F59E0B'}}>{p.margin.toFixed(1)}%</Text>
                  </View>
                </View>
              </View>
            ))
            : (data ?? []).map((d, i) => (
              <View key={i} style={[tbl.tr, i%2===1&&tbl.trAlt]}>
                <Text style={[tbl.td,{flex:0.7,fontWeight:'600'}]}>{d.label}</Text>
                <Text style={[tbl.td,{flex:1.2}]}>฿{fmt(d.revenue)}</Text>
                <Text style={[tbl.td,{flex:1.2,color:WebColors.danger}]}>฿{fmt(d.cost)}</Text>
                <Text style={[tbl.td,{flex:1.2,color:WebColors.success,fontWeight:'700'}]}>฿{fmt(d.grossProfit)}</Text>
                <View style={{flex:0.7,justifyContent:'center'}}>
                  <View style={[rpt.marginBadge,{backgroundColor:d.margin>=25?'#D1FAE5':'#FEF3C7'}]}>
                    <Text style={{fontSize: 13,fontWeight:'700',color:d.margin>=25?WebColors.success:'#F59E0B'}}>{d.margin}%</Text>
                  </View>
                </View>
              </View>
            ))
          }
        />
      </View>
    </ScrollView>
  );
};

// ─── Tax Report ───────────────────────────────────────────────────────────────
const SHOP_INFO = {
  name:    'ร้านสะดวกซื้อ ABC',
  addr:    '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
  taxId:   '0105560123456',
  branch:  'สำนักงานใหญ่',
  posNo:   'POS-001',
};

const MOCK_TAX_INVOICES = [
  { billNo: 'INV-2569-0001', date: '01/06/2569', cashier: 'สมชาย ใจดี',    payMethod: 'เงินสด',  subtotal: 107.48, vat:  7.52, grand: 115.00, taxType: 'tax_short', buyerTaxId: '' },
  { billNo: 'INV-2569-0002', date: '01/06/2569', cashier: 'สมชาย ใจดี',    payMethod: 'QR Code', subtotal: 186.92, vat: 13.08, grand: 200.00, taxType: 'tax_short', buyerTaxId: '' },
  { billNo: 'INV-2569-0003', date: '02/06/2569', cashier: 'สมหญิง จริงใจ', payMethod: 'โอน',     subtotal: 280.37, vat: 19.63, grand: 300.00, taxType: 'tax_full',  buyerTaxId: '0105560987654' },
  { billNo: 'INV-2569-0004', date: '02/06/2569', cashier: 'สมชาย ใจดี',    payMethod: 'เงินสด',  subtotal:  93.46, vat:  6.54, grand: 100.00, taxType: 'tax_short', buyerTaxId: '' },
  { billNo: 'INV-2569-0005', date: '03/06/2569', cashier: 'สมหญิง จริงใจ', payMethod: 'เงินสด',  subtotal: 467.29, vat: 32.71, grand: 500.00, taxType: 'tax_full',  buyerTaxId: '1234500012345' },
  { billNo: 'INV-2569-0006', date: '03/06/2569', cashier: 'สมชาย ใจดี',    payMethod: 'โอน',     subtotal: 140.19, vat:  9.81, grand: 150.00, taxType: 'tax_short', buyerTaxId: '' },
  { billNo: 'INV-2569-0007', date: '04/06/2569', cashier: 'สมชาย ใจดี',    payMethod: 'QR Code', subtotal:  65.42, vat:  4.58, grand:  70.00, taxType: 'tax_short', buyerTaxId: '' },
  { billNo: 'INV-2569-0008', date: '05/06/2569', cashier: 'สมหญิง จริงใจ', payMethod: 'เงินสด',  subtotal: 233.64, vat: 16.36, grand: 250.00, taxType: 'tax_full',  buyerTaxId: '9876543210123' },
];

// ── สรุปตามรหัสเครื่อง (POS No) — 1 row ต่อ 1 invoice ──────────────────────
type TaxRow = typeof MOCK_TAX_INVOICES[0];

// ── Print PDF (window.print) ──────────────────────────────────────────────────
function printTaxReportPDF(
  rows: TaxRow[],
  dateFrom: string,
  dateTo: string,
) {
  const now     = new Date();
  const printAt = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

  const fmtNum = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });

  const totCount = rows.length;
  const totGrand = rows.reduce((s,r)=>s+r.grand,    0);
  const totVat   = rows.reduce((s,r)=>s+r.vat,      0);
  const totNet   = rows.reduce((s,r)=>s+r.subtotal,  0);

  const rowsHtml = rows.map((r, i) => `
    <tr style="${i % 2 === 1 ? 'background:#f9f9f9' : ''}">
      <td>${SHOP_INFO.posNo}</td>
      <td>${r.billNo}</td>
      <td>${r.date}</td>
      <td>${r.buyerTaxId || '-'}</td>
      <td>${SHOP_INFO.name}</td>
      <td style="text-align:center">${r.cashier}</td>
      <td style="text-align:right">${fmtNum(r.grand)}</td>
      <td style="text-align:right">${fmtNum(r.vat)}</td>
      <td style="text-align:right">${fmtNum(r.subtotal)}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8"/>
<title>รายงานภาษีขาย</title>
<style>
  body { font-family: 'Sarabun', 'TH SarabunPSK', Arial, sans-serif; font-size: 13px; margin: 24px; color: #111; position: relative; }
  h2   { font-size: 16px; margin: 0 0 2px; }
  .sub { font-size: 12px; color: #444; margin: 0 0 2px; }
  .right-header { position: absolute; top: 0; right: 0; text-align: right; font-size: 11px; color: #555; }
  table { width: 100%; border-collapse: collapse; margin-top: 18px; }
  th    { background: #e8e8e8; border: 1px solid #bbb; padding: 7px 8px; font-size: 12px; text-align: center; vertical-align: middle; }
  td    { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; vertical-align: middle; }
  tfoot td { background: #efefef; font-weight: bold; border-top: 2px solid #555; }
  @media print { body { margin: 12px; } }
</style>
</head>
<body>
<div class="right-header">วันที่พิมพ์ ${printAt}<br/>หน้าที่ 1</div>
<h2>รายงาน ภาษีขายโดยรวมทุกร้านค้า</h2>
<p class="sub">${SHOP_INFO.name}</p>
<p class="sub">ตั้งแต่วันที่ ${dateFrom} ถึง ${dateTo}</p>
<p class="sub">สถานประกอบการ ${SHOP_INFO.addr}</p>
<table>
  <thead>
    <tr>
      <th>รหัสหมายเลข<br/>เครื่อง</th>
      <th>เลขที่ใบกำกับภาษี</th>
      <th>วันที่</th>
      <th>เลขประจำตัว<br/>ผู้เสียภาษี</th>
      <th>ชื่อร้าน</th>
      <th>แคชเชียร์</th>
      <th>มูลค่าสินค้า<br/>รวม Vat</th>
      <th>ภาษีมูลค่าเพิ่ม<br/>7%</th>
      <th>มูลค่าสินค้า<br/>ก่อนรวม Vat</th>
    </tr>
  </thead>
  <tbody>${rowsHtml}</tbody>
  <tfoot>
    <tr>
      <td colspan="5" style="text-align:right">ยอดรวม ${totCount} รายการ</td>
      <td></td>
      <td style="text-align:right">${fmtNum(totGrand)}</td>
      <td style="text-align:right">${fmtNum(totVat)}</td>
      <td style="text-align:right">${fmtNum(totNet)}</td>
    </tr>
  </tfoot>
</table>
</body>
</html>`;

  const w = (window as any).open('', '_blank', 'width=1000,height=700');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

// ── Export Excel (TSV/BOM) ────────────────────────────────────────────────────
function exportTaxReportExcel(rows: TaxRow[], dateFrom: string, dateTo: string) {
  const fmtNum = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });

  const totGrand = rows.reduce((s,r)=>s+r.grand,    0);
  const totVat   = rows.reduce((s,r)=>s+r.vat,      0);
  const totNet   = rows.reduce((s,r)=>s+r.subtotal,  0);

  const header = [
    `รายงานภาษีขาย - ${SHOP_INFO.name}`,
    `ตั้งแต่วันที่ ${dateFrom} ถึง ${dateTo}`,
    `สถานประกอบการ: ${SHOP_INFO.addr}`,
    '',
    'รหัสหมายเลขเครื่อง\tเลขที่ใบกำกับภาษี\tวันที่\tเลขประจำตัวผู้เสียภาษี\tชื่อร้าน\tแคชเชียร์\tมูลค่าสินค้ารวม Vat\tภาษีมูลค่าเพิ่ม 7%\tมูลค่าสินค้าก่อนรวม Vat',
  ];

  const dataRows = rows.map(r =>
    `${SHOP_INFO.posNo}\t${r.billNo}\t${r.date}\t${r.buyerTaxId||'-'}\t${SHOP_INFO.name}\t${r.cashier}\t${fmtNum(r.grand)}\t${fmtNum(r.vat)}\t${fmtNum(r.subtotal)}`
  );

  const footer = `ยอดรวม ${rows.length} รายการ\t\t\t\t\t\t${fmtNum(totGrand)}\t${fmtNum(totVat)}\t${fmtNum(totNet)}`;

  const tsv = '\ufeff' + [...header, ...dataRows, footer].join('\n');
  const blob = new Blob([tsv], { type: 'text/tab-separated-values;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = (document as any).createElement('a');
  a.href     = url;
  a.download = `TaxReport_${dateFrom.replace(/\//g,'-')}_${dateTo.replace(/\//g,'-')}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

const TaxReport: React.FC = () => {
  const [dateRange,  setDateRange]  = useState('เดือนนี้');
  const [typeFilter, setTypeFilter] = useState<'all' | 'tax_short' | 'tax_full'>('all');

  // วันที่ช่วงที่เลือก (mock)
  const dateFrom = '01/06/2569';
  const dateTo   = '30/06/2569';

  const filtered = MOCK_TAX_INVOICES.filter(inv =>
    typeFilter === 'all' || inv.taxType === typeFilter
  );

  const totalVat      = filtered.reduce((s, i) => s + i.vat,      0);
  const totalSubtotal = filtered.reduce((s, i) => s + i.subtotal,  0);
  const totalGrand    = filtered.reduce((s, i) => s + i.grand,     0);
  const totalFullTax  = filtered.filter(i => i.taxType === 'tax_full').length;
  const totalShortTax = filtered.filter(i => i.taxType === 'tax_short').length;

  // สรุป VAT รายวัน
  const vatByDate = MOCK_TAX_INVOICES.reduce((acc, inv) => {
    acc[inv.date] = (acc[inv.date] ?? 0) + inv.vat;
    return acc;
  }, {} as Record<string, number>);
  const vatBarData = Object.entries(vatByDate).map(([label, value]) => ({ label: label.slice(0, 5), value }));

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
      {/* Toolbar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <DateRangeBar selected={dateRange} onChange={setDateRange} />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            style={rpt.exportBtn}
            onPress={() => exportTaxReportExcel(filtered, dateFrom, dateTo)}
          >
            <Ionicons name="document-text-outline" size={14} color={WebColors.success} />
            <Text style={[rpt.exportText, { color: WebColors.success }]}>Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[rpt.exportBtn, { borderColor: WebColors.danger }]}
            onPress={() => printTaxReportPDF(filtered, dateFrom, dateTo)}
          >
            <Ionicons name="document-outline" size={14} color={WebColors.danger} />
            <Text style={[rpt.exportText, { color: WebColors.danger }]}>PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPI */}
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <KpiCard label="ยอดขายก่อน VAT"    value={`฿${fmt(totalSubtotal)}`}  icon="receipt-outline"       color={WebColors.primary}  />
        <KpiCard label="VAT 7% รวมทั้งสิ้น" value={`฿${fmt(totalVat)}`}       icon="calculator-outline"    color="#7C3AED"             />
        <KpiCard label="ยอดขายรวม VAT"      value={`฿${fmt(totalGrand)}`}     icon="cash-outline"          color={WebColors.success}  />
        <KpiCard label="ใบกำกับภาษีเต็มรูป" value={`${totalFullTax} ใบ`}      icon="document-text-outline" color="#F59E0B"             />
      </View>

      {/* VAT bar chart */}
      <View style={rpt.card}>
        <Text style={rpt.cardTitle}>VAT รายวัน (฿)</Text>
        <BarChart data={vatBarData} color="#7C3AED" height={110} />
      </View>

      {/* Summary by type */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {/* ใบกำกับภาษีอย่างย่อ */}
        <View style={[rpt.card, { flex: 1, borderTopWidth: 3, borderTopColor: WebColors.primary }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="newspaper-outline" size={18} color={WebColors.primary} />
            <Text style={[rpt.cardTitle, { color: WebColors.primary }]}>ใบกำกับภาษีอย่างย่อ</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '900', color: WebColors.primary }}>{totalShortTax} ใบ</Text>
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: WebColors.textSecondary }}>ยอดก่อน VAT</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: WebColors.text }}>
                ฿{fmt(MOCK_TAX_INVOICES.filter(i=>i.taxType==='tax_short').reduce((s,i)=>s+i.subtotal,0))}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: '#7C3AED' }}>VAT 7%</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#7C3AED' }}>
                ฿{fmt(MOCK_TAX_INVOICES.filter(i=>i.taxType==='tax_short').reduce((s,i)=>s+i.vat,0))}
              </Text>
            </View>
          </View>
        </View>

        {/* ใบกำกับภาษีเต็มรูป */}
        <View style={[rpt.card, { flex: 1, borderTopWidth: 3, borderTopColor: '#7C3AED' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="document-text-outline" size={18} color="#7C3AED" />
            <Text style={[rpt.cardTitle, { color: '#7C3AED' }]}>ใบกำกับภาษีเต็มรูปแบบ</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#7C3AED' }}>{totalFullTax} ใบ</Text>
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: WebColors.textSecondary }}>ยอดก่อน VAT</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: WebColors.text }}>
                ฿{fmt(MOCK_TAX_INVOICES.filter(i=>i.taxType==='tax_full').reduce((s,i)=>s+i.subtotal,0))}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: '#7C3AED' }}>VAT 7%</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#7C3AED' }}>
                ฿{fmt(MOCK_TAX_INVOICES.filter(i=>i.taxType==='tax_full').reduce((s,i)=>s+i.vat,0))}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Filter + Table */}
      <View style={rpt.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Text style={rpt.cardTitle}>รายละเอียดใบกำกับภาษีทั้งหมด</Text>
          {/* Type filter */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {([
              { key: 'all',        label: 'ทั้งหมด'             },
              { key: 'tax_short',  label: 'อย่างย่อ'             },
              { key: 'tax_full',   label: 'เต็มรูปแบบ'           },
            ] as const).map(f => (
              <TouchableOpacity
                key={f.key}
                style={[rpt.toggleBtn, typeFilter === f.key && { backgroundColor: WebColors.primary, borderColor: WebColors.primary }]}
                onPress={() => setTypeFilter(f.key)}
              >
                <Text style={[rpt.toggleText, typeFilter === f.key && { color: '#fff' }]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TableShell
          cols={[['เลขที่บิล',1.4],['วันที่',0.9],['แคชเชียร์',1.2],['ช่องทาง',0.9],['ก่อน VAT',0.9],['VAT 7%',0.8],['รวม VAT',0.9],['ประเภท',1]]}
          rows={filtered.map((inv, i) => (
            <View key={i} style={[tbl.tr, i % 2 === 1 && tbl.trAlt]}>
              <Text style={[tbl.td, { flex: 1.4, fontWeight: '600', color: WebColors.primary }]}>{inv.billNo}</Text>
              <Text style={[tbl.td, { flex: 0.9, fontSize: 13 }]}>{inv.date}</Text>
              <Text style={[tbl.td, { flex: 1.2 }]} numberOfLines={1}>{inv.cashier}</Text>
              <Text style={[tbl.td, { flex: 0.9, fontSize: 13 }]}>{inv.payMethod}</Text>
              <Text style={[tbl.td, { flex: 0.9, textAlign: 'right' }]}>฿{fmt(inv.subtotal)}</Text>
              <Text style={[tbl.td, { flex: 0.8, textAlign: 'right', color: '#7C3AED', fontWeight: '700' }]}>฿{fmt(inv.vat)}</Text>
              <Text style={[tbl.td, { flex: 0.9, textAlign: 'right', fontWeight: '700', color: WebColors.primary }]}>฿{fmt(inv.grand)}</Text>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <View style={[rpt.marginBadge, {
                  backgroundColor: inv.taxType === 'tax_full' ? '#EDE9FE' : WebColors.primaryLight,
                }]}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: inv.taxType === 'tax_full' ? '#7C3AED' : WebColors.primary }}>
                    {inv.taxType === 'tax_full' ? 'เต็มรูปแบบ' : 'อย่างย่อ'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        />

        {/* Footer summary */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: WebColors.primaryLight, borderRadius: 8, gap: 4 }}>
          <Text style={{ flex: 1.4 + 0.9 + 1.2 + 0.9, fontSize: 13, fontWeight: '700', color: WebColors.primary }}>
            รวม {filtered.length} รายการ
          </Text>
          <Text style={{ flex: 0.9, textAlign: 'right', fontSize: 12, fontWeight: '800', color: WebColors.text }}>฿{fmt(totalSubtotal)}</Text>
          <Text style={{ flex: 0.8, textAlign: 'right', fontSize: 12, fontWeight: '800', color: '#7C3AED' }}>฿{fmt(totalVat)}</Text>
          <Text style={{ flex: 0.9, textAlign: 'right', fontSize: 12, fontWeight: '900', color: WebColors.primary }}>฿{fmt(totalGrand)}</Text>
          <View style={{ flex: 1 }} />
        </View>
      </View>

      {/* Info note */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FDE68A' }}>
        <Ionicons name="information-circle-outline" size={16} color="#D97706" />
        <Text style={{ flex: 1, fontSize: 13, color: '#92400E', lineHeight: 18 }}>
          รายงานภาษีขายนี้ใช้สำหรับยื่นแบบ ภ.พ.30 ต่อกรมสรรพากร ข้อมูล VAT คำนวณจากราคารวม VAT หาร 1.07
          {'\n'}กรณีออกใบกำกับภาษีเต็มรูปแบบ ต้องระบุข้อมูลผู้ซื้อและเลขประจำตัวผู้เสียภาษีครบถ้วน
        </Text>
      </View>
    </ScrollView>
  );
};
const EnterpriseReport: React.FC = () => {
  const excelBranch = MOCK_BRANCH_KPI.map(b => [b.branchName, `฿${b.sales.toLocaleString()}`, String(b.bills), `฿${b.profit.toLocaleString()}`, `${b.margin}%`, `${b.inventoryTurnover}x`, `${b.gmroi}x`]);
  const excelPOS    = MOCK_POS_PERFORMANCE.map(p => [p.posName, p.branchName, p.cashierName, `฿${p.sales.toLocaleString()}`, String(p.bills), `฿${fmt(p.avgPerBill)}`]);
  return (
  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 10, flex: 1 }}>
        <KpiCard label="รายได้ทุกสาขา" value={`฿${fmt(MOCK_BRANCH_KPI.reduce((s,b)=>s+b.sales,0))}`} icon="business-outline" color={WebColors.primary} />
        <KpiCard label="กำไรรวม" value={`฿${fmt(MOCK_BRANCH_KPI.reduce((s,b)=>s+b.profit,0))}`} icon="trending-up-outline" color={WebColors.success} />
        <KpiCard label="จำนวนสาขา" value={String(MOCK_BRANCH_KPI.length)} icon="map-outline" color="#F59E0B" />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, paddingTop: 4, flexShrink: 0 }}>
        <TouchableOpacity style={rpt.exportBtn} onPress={() => exportGenericExcel('Enterprise Report - KPI สาขา', ['สาขา','ยอดขาย','บิล','กำไร','Margin','Turnover','GMROI'], excelBranch, 'EnterpriseReport')}>
          <Ionicons name="document-text-outline" size={14} color={WebColors.success} /><Text style={[rpt.exportText,{color:WebColors.success}]}>Excel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[rpt.exportBtn,{borderColor:WebColors.danger}]} onPress={() => printGenericPDF('Enterprise Report - KPI สาขา', ['สาขา','ยอดขาย','บิล','กำไร','Margin','Turnover','GMROI'], excelBranch)}>
          <Ionicons name="document-outline" size={14} color={WebColors.danger} /><Text style={[rpt.exportText,{color:WebColors.danger}]}>PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
    <View style={rpt.card}>
      <Text style={rpt.cardTitle}>เปรียบเทียบ KPI สาขา</Text>
      <TableShell
        cols={[['สาขา',1.3],['ยอดขาย',1.1],['บิล',0.7],['กำไร',1],['Margin',0.7],['Turnover',0.8],['GMROI',0.7]]}
        rows={MOCK_BRANCH_KPI.map((b, i) => (
          <View key={i} style={[tbl.tr, i%2===1&&tbl.trAlt]}>
            <Text style={[tbl.td,{flex:1.3,fontWeight:'700'}]}>{b.branchName}</Text>
            <Text style={[tbl.td,{flex:1.1,color:WebColors.primary,fontWeight:'700'}]}>฿{b.sales.toLocaleString()}</Text>
            <Text style={[tbl.td,{flex:0.7}]}>{b.bills}</Text>
            <Text style={[tbl.td,{flex:1,color:WebColors.success}]}>฿{b.profit.toLocaleString()}</Text>
            <View style={{flex:0.7,justifyContent:'center'}}><View style={[rpt.marginBadge,{backgroundColor:b.margin>=25?'#D1FAE5':'#FEF3C7'}]}><Text style={{fontSize: 13,fontWeight:'700',color:b.margin>=25?WebColors.success:'#F59E0B'}}>{b.margin}%</Text></View></View>
            <View style={{flex:0.8,justifyContent:'center'}}><View style={[rpt.marginBadge,{backgroundColor:b.inventoryTurnover>=8?'#D1FAE5':'#FEF3C7'}]}><Text style={{fontSize: 13,fontWeight:'700',color:b.inventoryTurnover>=8?WebColors.success:'#F59E0B'}}>{b.inventoryTurnover}x</Text></View></View>
            <View style={{flex:0.7,justifyContent:'center'}}><View style={[rpt.marginBadge,{backgroundColor:b.gmroi>=18?'#D1FAE5':WebColors.primaryLight}]}><Text style={{fontSize: 13,fontWeight:'700',color:b.gmroi>=18?WebColors.success:WebColors.primary}}>{b.gmroi}x</Text></View></View>
          </View>
        ))}
      />
    </View>
    <View style={rpt.card}>
      <Text style={rpt.cardTitle}>ประสิทธิภาพ POS</Text>
      <TableShell
        cols={[['จุดขาย',1],['สาขา',1],['พนักงาน',1.3],['ยอดขาย',1],['บิล',0.7],['เฉลี่ย/บิล',0.9]]}
        rows={MOCK_POS_PERFORMANCE.map((p, i) => (
          <View key={i} style={[tbl.tr, i%2===1&&tbl.trAlt]}>
            <Text style={[tbl.td,{flex:1,fontWeight:'600'}]}>{p.posName}</Text>
            <Text style={[tbl.td,{flex:1}]}>{p.branchName}</Text>
            <Text style={[tbl.td,{flex:1.3}]}>{p.cashierName}</Text>
            <Text style={[tbl.td,{flex:1,color:WebColors.primary,fontWeight:'700'}]}>฿{p.sales.toLocaleString()}</Text>
            <Text style={[tbl.td,{flex:0.7}]}>{p.bills}</Text>
            <Text style={[tbl.td,{flex:0.9}]}>฿{fmt(p.avgPerBill)}</Text>
          </View>
        ))}
      />
    </View>
  </ScrollView>
  );
};

// ─── Shift Report (รายงานกะการขาย) ───────────────────────────────────────────
const ShiftReport: React.FC = () => {
  const shiftStore = require('../../store/shiftStore');
  const { shiftHistory, currentShift } = shiftStore.useShiftStore();
  const allShifts = currentShift ? [currentShift, ...shiftHistory] : shiftHistory;

  return (
    <View style={{ gap: 14 }}>
      <View>
        <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.text }}>รายงานกะการขาย</Text>
        <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>ประวัติเปิดกะ/ปิดกะ ยอดขาย เงินในลิ้นชัก</Text>
      </View>

      {allShifts.length === 0 ? (
        <Text style={{ fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingVertical: 24 }}>ยังไม่มีข้อมูลกะ</Text>
      ) : (
        allShifts.map((sh: any, i: number) => (
          <View key={sh.id} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 8 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>{sh.cashierName} — {sh.posName}</Text>
                <Text style={{ fontSize: 10, color: Colors.textSecondary }}>
                  เปิด: {new Date(sh.openedAt).toLocaleString('th-TH')}
                  {sh.closedAt ? ` · ปิด: ${new Date(sh.closedAt).toLocaleString('th-TH')}` : ''}
                </Text>
              </View>
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: sh.status === 'open' ? '#DCFCE7' : '#F3F4F6' }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: sh.status === 'open' ? '#16A34A' : '#6B7280' }}>
                  {sh.status === 'open' ? 'เปิดอยู่' : 'ปิดแล้ว'}
                </Text>
              </View>
            </View>

            {/* KPI */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1, backgroundColor: Colors.background, borderRadius: 8, padding: 8, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: WebColors.primary }}>฿{sh.cashSalesTotal.toLocaleString()}</Text>
                <Text style={{ fontSize: 9, color: Colors.textSecondary }}>ยอดขายเงินสด</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: Colors.background, borderRadius: 8, padding: 8, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.text }}>{sh.billCount}</Text>
                <Text style={{ fontSize: 9, color: Colors.textSecondary }}>จำนวนบิล</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: Colors.background, borderRadius: 8, padding: 8, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#16A34A' }}>฿{sh.openingAmount.toLocaleString()}</Text>
                <Text style={{ fontSize: 9, color: Colors.textSecondary }}>เงินตั้งต้น</Text>
              </View>
              {sh.closingAmount !== undefined && (
                <View style={{ flex: 1, backgroundColor: Colors.background, borderRadius: 8, padding: 8, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: (sh.difference ?? 0) >= 0 ? '#16A34A' : '#DC2626' }}>฿{sh.closingAmount.toLocaleString()}</Text>
                  <Text style={{ fontSize: 9, color: Colors.textSecondary }}>นับจริง ({(sh.difference ?? 0) >= 0 ? '+' : ''}{sh.difference})</Text>
                </View>
              )}
            </View>

            {/* เงินเข้า/ออก */}
            {sh.movements.length > 0 && (
              <View style={{ gap: 3 }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: Colors.textSecondary }}>เงินเข้า/ออก ({sh.movements.length})</Text>
                {sh.movements.map((mv: any) => (
                  <View key={mv.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, color: Colors.text }}>{mv.reason}</Text>
                    <Text style={{ fontSize: 10, color: mv.type === 'in' ? '#16A34A' : '#DC2626', fontWeight: '600' }}>{mv.type === 'in' ? '+' : '-'}฿{mv.amount.toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );
};

// ─── Staff Service Report (พนักงานบริการ) ─────────────────────────────────────
const StaffServiceReport: React.FC = () => {
  const mockStaffData = [
    {
      name: 'ช่างเอ (สมชาย)',
      totalSales: 12_500,
      totalBills: 18,
      services: [
        { bill: 'INV-2569-0015', product: 'ทำผม', price: 350, date: '22/06/2569' },
        { bill: 'INV-2569-0016', product: 'ทำสีผม', price: 1500, date: '22/06/2569' },
        { bill: 'INV-2569-0018', product: 'นวดศีรษะ', price: 300, date: '22/06/2569' },
        { bill: 'INV-2569-0022', product: 'ทำผม', price: 350, date: '21/06/2569' },
        { bill: 'INV-2569-0025', product: 'ตัดผมชาย', price: 200, date: '21/06/2569' },
      ],
    },
    {
      name: 'ช่างบี (สมหญิง)',
      totalSales: 8_700,
      totalBills: 12,
      services: [
        { bill: 'INV-2569-0017', product: 'สระผม + เป่า', price: 150, date: '22/06/2569' },
        { bill: 'INV-2569-0019', product: 'ทำเล็บ', price: 300, date: '22/06/2569' },
        { bill: 'INV-2569-0020', product: 'ทำผม', price: 350, date: '22/06/2569' },
        { bill: 'INV-2569-0026', product: 'นวดตัว', price: 500, date: '21/06/2569' },
      ],
    },
    {
      name: 'ช่างซี (วิทยา)',
      totalSales: 5_400,
      totalBills: 8,
      services: [
        { bill: 'INV-2569-0021', product: 'ตัดผมชาย', price: 200, date: '22/06/2569' },
        { bill: 'INV-2569-0023', product: 'โกนหนวด + แต่งทรง', price: 150, date: '22/06/2569' },
        { bill: 'INV-2569-0027', product: 'ทำผม', price: 350, date: '21/06/2569' },
      ],
    },
  ];

  const totalAll = mockStaffData.reduce((s, st) => s + st.totalSales, 0);
  const totalBills = mockStaffData.reduce((s, st) => s + st.totalBills, 0);

  return (
    <View style={{ gap: 15 }}>
      <View>
        <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.text }}>รายงานพนักงานบริการ</Text>
        <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>ยอดขายและรายการบริการแยกตามช่าง/พนักงาน</Text>
      </View>

      {/* KPI */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: WebColors.primary }}>฿{totalAll.toLocaleString()}</Text>
          <Text style={{ fontSize: 10, color: Colors.textSecondary }}>ยอดรวมทั้งหมด</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.text }}>{totalBills}</Text>
          <Text style={{ fontSize: 10, color: Colors.textSecondary }}>จำนวนบิล</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.text }}>{mockStaffData.length}</Text>
          <Text style={{ fontSize: 10, color: Colors.textSecondary }}>พนักงานบริการ</Text>
        </View>
      </View>

      {/* Export */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
        <TouchableOpacity style={rpt.exportBtn} onPress={() => {
          const headers = ['พนักงาน', 'เลขบิล', 'บริการ', 'ราคา', 'วันที่'];
          const rows: string[][] = [];
          mockStaffData.forEach(st => {
            st.services.forEach(sv => {
              rows.push([st.name, sv.bill, sv.product, `฿${sv.price}`, sv.date]);
            });
          });
          exportGenericExcel('รายงานพนักงานบริการ', headers, rows, 'StaffServiceReport');
        }}>
          <Ionicons name="document-text-outline" size={13} color={WebColors.success} />
          <Text style={[rpt.exportText, { color: WebColors.success }]}>Excel</Text>
        </TouchableOpacity>
      </View>

      {/* Staff cards */}
      {mockStaffData.map((staff, idx) => (
        <View key={idx} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10 }}>
          {/* Staff header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: WebColors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person" size={16} color={WebColors.primary} />
              </View>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>{staff.name}</Text>
                <Text style={{ fontSize: 10, color: Colors.textSecondary }}>{staff.totalBills} บิล</Text>
              </View>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: WebColors.primary }}>฿{staff.totalSales.toLocaleString()}</Text>
          </View>

          {/* Service items table */}
          <View style={{ borderRadius: 8, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', backgroundColor: Colors.background, paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
              <Text style={{ flex: 1.2, fontSize: 10, fontWeight: '600', color: Colors.textSecondary }}>เลขบิล</Text>
              <Text style={{ flex: 1.5, fontSize: 10, fontWeight: '600', color: Colors.textSecondary }}>บริการ</Text>
              <Text style={{ flex: 0.7, fontSize: 10, fontWeight: '600', color: Colors.textSecondary, textAlign: 'right' }}>ราคา</Text>
              <Text style={{ flex: 0.8, fontSize: 10, fontWeight: '600', color: Colors.textSecondary, textAlign: 'right' }}>วันที่</Text>
            </View>
            {staff.services.map((sv, i) => (
              <View key={i} style={{ flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: i < staff.services.length - 1 ? 1 : 0, borderBottomColor: Colors.border, backgroundColor: i % 2 === 1 ? '#FAFAFA' : '#fff' }}>
                <Text style={{ flex: 1.2, fontSize: 11, color: WebColors.primary, fontWeight: '500' }}>{sv.bill}</Text>
                <Text style={{ flex: 1.5, fontSize: 11, color: Colors.text }}>{sv.product}</Text>
                <Text style={{ flex: 0.7, fontSize: 11, color: Colors.text, fontWeight: '600', textAlign: 'right' }}>฿{sv.price}</Text>
                <Text style={{ flex: 0.8, fontSize: 10, color: Colors.textSecondary, textAlign: 'right' }}>{sv.date}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

// ─── Daily Summary Report ─────────────────────────────────────────────────────
const DailySummaryReport: React.FC = () => {
  const today = new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const mockSummary = {
    totalSales: 24_580,
    totalBills: 47,
    avgPerBill: 523,
    cashAmount: 14_200,
    qrAmount: 7_380,
    transferAmount: 3_000,
    totalDiscount: 1_240,
    totalVat: 1_608,
    topProducts: [
      { name: 'น้ำดื่มสิงห์ 600ml', qty: 85, amount: 850 },
      { name: 'ขนมปังกรอบ 7-11', qty: 42, amount: 1_050 },
      { name: 'มาม่า หมูสับ', qty: 38, amount: 266 },
      { name: 'เลย์ รสออริจินัล', qty: 31, amount: 620 },
      { name: 'Pepsi 325ml', qty: 28, amount: 420 },
    ],
    voidCount: 2,
    voidAmount: 350,
    returnCount: 1,
    returnAmount: 89,
    cashierSummary: [
      { name: 'สมชาย ใจดี', bills: 28, amount: 15_200 },
      { name: 'สมหญิง จริงใจ', bills: 19, amount: 9_380 },
    ],
  };

  return (
    <View style={{ gap: 16 }}>
      <View>
        <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text }}>สรุปประจำวัน</Text>
        <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>{today}</Text>
      </View>

      {/* KPI */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: WebColors.primary }}>฿{mockSummary.totalSales.toLocaleString()}</Text>
          <Text style={{ fontSize: 13, color: Colors.textSecondary }}>ยอดขายรวม</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.text }}>{mockSummary.totalBills}</Text>
          <Text style={{ fontSize: 13, color: Colors.textSecondary }}>จำนวนบิล</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0EA5E9' }}>฿{mockSummary.avgPerBill}</Text>
          <Text style={{ fontSize: 13, color: Colors.textSecondary }}>เฉลี่ย/บิล</Text>
        </View>
      </View>

      {/* ช่องทางชำระ */}
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text }}>สรุปตามช่องทางชำระ</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}><Text style={{ fontSize: 13, color: Colors.textSecondary }}>เงินสด</Text><Text style={{ fontSize: 13, fontWeight: '600' }}>฿{mockSummary.cashAmount.toLocaleString()}</Text></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}><Text style={{ fontSize: 13, color: Colors.textSecondary }}>QR Code</Text><Text style={{ fontSize: 13, fontWeight: '600' }}>฿{mockSummary.qrAmount.toLocaleString()}</Text></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}><Text style={{ fontSize: 13, color: Colors.textSecondary }}>โอนเงิน</Text><Text style={{ fontSize: 13, fontWeight: '600' }}>฿{mockSummary.transferAmount.toLocaleString()}</Text></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: Colors.border }}><Text style={{ fontSize: 13, color: '#EF4444' }}>ส่วนลดรวม</Text><Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>-฿{mockSummary.totalDiscount.toLocaleString()}</Text></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}><Text style={{ fontSize: 13, color: Colors.textSecondary }}>VAT</Text><Text style={{ fontSize: 13, fontWeight: '600' }}>฿{mockSummary.totalVat.toLocaleString()}</Text></View>
      </View>

      {/* Top Products */}
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text }}>สินค้าขายดี Top 5</Text>
        {mockSummary.topProducts.map((p, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
            <Text style={{ fontSize: 13, color: Colors.text }}>{i + 1}. {p.name}</Text>
            <Text style={{ fontSize: 13, color: Colors.textSecondary }}>{p.qty} ชิ้น · ฿{p.amount.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Cashier */}
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text }}>สรุปตามพนักงาน</Text>
        {mockSummary.cashierSummary.map((c, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
            <Text style={{ fontSize: 13, color: Colors.text }}>{c.name}</Text>
            <Text style={{ fontSize: 13, color: Colors.textSecondary }}>{c.bills} บิล · ฿{c.amount.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Void/Return */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#DC2626' }}>{mockSummary.voidCount}</Text>
          <Text style={{ fontSize: 12, color: '#DC2626' }}>ยกเลิก (฿{mockSummary.voidAmount})</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#D97706' }}>{mockSummary.returnCount}</Text>
          <Text style={{ fontSize: 12, color: '#D97706' }}>คืนสินค้า (฿{mockSummary.returnAmount})</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const rpt = StyleSheet.create({
  screenRoot: {
    flex: 1,
    flexDirection: 'row',
    ...(Platform.OS === 'web'
      ? { overflow: 'hidden' as any, minHeight: 0 as any }
      : {}),
  },
  pageTitle: { fontSize: 16, fontWeight: '800', color: WebColors.text },
  pageSub: { fontSize: 12, color: WebColors.textSecondary, marginTop: -10 },
  cardGrid: { gap: 10 },
  reportCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 12, padding: 18, borderTopWidth: 4, borderWidth: 1, borderColor: WebColors.border, position: 'relative' },
  reportIcon: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reportLabel: { fontSize: 12, fontWeight: '700', color: WebColors.text },
  reportSub: { fontSize: 13, color: WebColors.textSecondary, marginTop: 2 },
  phase2Badge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#F59E0B', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  phase2Text: { fontSize: 12, color: '#fff', fontWeight: '800' },
  backBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: WebColors.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backText: { fontSize: 12, color: WebColors.primary },
  backTitle: { fontSize: 13, fontWeight: '700', color: WebColors.text },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 12, borderWidth: 1, borderColor: WebColors.border },
  cardTitle: { fontSize: 12, fontWeight: '700', color: WebColors.text },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  exportText: { fontSize: 12, fontWeight: '600' },
  toggleBtn: { borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  toggleText: { fontSize: 13, color: WebColors.primary, fontWeight: '600' },
  rankBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: WebColors.gray100, alignItems: 'center', justifyContent: 'center' },
  marginBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start' },
  subMenuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: WebColors.border,
  },
  subMenuDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: WebColors.primary, opacity: 0.6,
  },
  subMenuLabel: { flex: 1, fontSize: 12, color: WebColors.text, fontWeight: '500' },

  // ── Sidebar nav ────────────────────────────────────────────────────────────
  navPanel: {
    width: 195,
    flexShrink: 0,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: WebColors.border,
    flexDirection: 'column',
    // บน web ต้องกำหนด height ชัดเจน ไม่งั้น ScrollView ข้างใน collapse
    ...(Platform.OS === 'web'
      ? { height: '100%' as any, overflow: 'hidden' as any }
      : { flex: 1 }),
  },
  navToggleBtn: {
    height: 32, alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 1, borderBottomColor: WebColors.border,
    backgroundColor: WebColors.gray50,
  },
  navGroupHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: WebColors.border,
    backgroundColor: WebColors.gray50,
  },
  navGroupIcon: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  navGroupLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: WebColors.text },
  navGroupSub:   { fontSize: 12, color: WebColors.textSecondary },
  navItem: {
    paddingLeft: 14, paddingRight: 12, paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: WebColors.border,
  },
  navItemActive:      { backgroundColor: WebColors.primaryLight },
  navDot:             { width: 5, height: 5, borderRadius: 3, backgroundColor: WebColors.border, flexShrink: 0 },
  navItemLabel:       { fontSize: 13, color: WebColors.textSecondary, lineHeight: 17 },
  navItemLabelActive: { color: WebColors.primary, fontWeight: '700' },
  navDivider:         { height: 4, backgroundColor: WebColors.gray100 },

  // ── Content panel ──────────────────────────────────────────────────────────
  contentPanel: {
    flex: 1, flexDirection: 'column',
    backgroundColor: '#F5F7FA',
    overflow: 'hidden' as any,
  },

  // ── Filter bar ─────────────────────────────────────────────────────────────
  filterBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
    gap: 8,
    borderBottomWidth: 1, borderBottomColor: WebColors.border,
    flexShrink: 0,
  },
  filterRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  filterField: { flex: 1, gap: 4 },
  filterLabel: { fontSize: 13, fontWeight: '600', color: WebColors.textSecondary },
  filterInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: WebColors.border, borderRadius: 8,
    paddingHorizontal: 10, height: 36,
    backgroundColor: WebColors.gray50,
  },
  filterInputText: { flex: 1, fontSize: 12, color: WebColors.text },
  searchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: WebColors.primary, borderRadius: 8,
    paddingHorizontal: 16, height: 36, alignSelf: 'flex-end',
    flexShrink: 0,
  },
  searchBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // ── KPI row ────────────────────────────────────────────────────────────────
  kpiRow: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#F5F7FA',
    flexShrink: 0,
  },
  kpiCard: {
    flex: 1, backgroundColor: '#fff',
    borderRadius: 8, padding: 14,
    borderWidth: 1, borderColor: WebColors.border,
    gap: 6,
  },
  kpiCardLabel: { fontSize: 13, color: WebColors.textSecondary },
  kpiCardValue: { fontSize: 16, fontWeight: '900', color: WebColors.text },

  // ── Content header ─────────────────────────────────────────────────────────
  contentHeader: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: WebColors.border,
    flexShrink: 0,
  },
  contentTitle:     { fontSize: 12, fontWeight: '700', color: WebColors.text },
  contentTitle2Wrap: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: WebColors.border, flexShrink: 0 },
  contentTitle2:     { fontSize: 12, fontWeight: '700', color: WebColors.text },
});
