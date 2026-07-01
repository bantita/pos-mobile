/**
 * WebDailySummaryScreen — หน้าสรุปประจำวัน
 * 7 ส่วน: KPI, ยอดขายแยกช่องทาง, สต๊อก, CRM, กะ, เงินเข้า/ออก, Top สินค้า
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';

const TODAY = new Date().toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });

// Mock Data
const MOCK = {
  kpi: { sales: 48320, bills: 156, avg: 310, profit: 12080, voids: 2 },
  payments: [
    { method: 'เงินสด', bills: 98, amount: 32100, pct: 66 },
    { method: 'QR Code', bills: 35, amount: 10500, pct: 22 },
    { method: 'บัตรเครดิต', bills: 15, amount: 4500, pct: 9 },
    { method: 'โอนเงิน', bills: 8, amount: 1220, pct: 3 },
  ],
  stock: { itemsSold: 45, qtySold: 312, lowStock: 3, outOfStock: 1, syncStatus: 'synced' as const, lastSync: '22:30' },
  crm: { earned: 1250, redeemed: 320, newMembers: 3, upgrades: 1, coupons: 8, couponDiscount: 450 },
  shifts: [
    { name: 'สมศักดิ์ ขยัน', open: '08:00', close: '15:00', sales: 28500, diff: 50 },
    { name: 'สมหญิง จริงใจ', open: '15:00', close: '22:00', sales: 19820, diff: -20 },
  ],
  cashMov: [
    { time: '09:30', type: 'in', amount: 5000, reason: 'เพิ่มเงินทอน', by: 'สมชาย' },
    { time: '14:15', type: 'out', amount: 3000, reason: 'นำฝากธนาคาร', by: 'สมหญิง' },
    { time: '18:00', type: 'out', amount: 2000, reason: 'จ่ายค่าของ', by: 'สมชาย' },
  ],
  topProducts: [
    { code: 'P001', name: 'น้ำดื่มสิงห์ 600ml', qty: 85, revenue: 850, profit: 340 },
    { code: 'P004', name: 'มาม่า หมูสับ', qty: 60, revenue: 420, profit: 180 },
    { code: 'P005', name: 'เลย์ รสออริจินัล', qty: 45, revenue: 900, profit: 270 },
    { code: 'P002', name: 'น้ำอัดลม Pepsi', qty: 38, revenue: 570, profit: 228 },
    { code: 'P003', name: 'ขนมปังกรอบ', qty: 25, revenue: 625, profit: 175 },
  ],
  voids: [
    { time: '11:30', bill: '#1198', product: 'แชมพู H&S', amount: 89, reason: 'ลูกค้าเปลี่ยนใจ', by: 'MGR' },
    { time: '16:45', bill: '#1210', product: 'สบู่ Dove', amount: 45, reason: 'สินค้าชำรุด', by: 'MGR' },
  ],
};

const fmt = (n: number) => n.toLocaleString();
const KPI: React.FC<{ label: string; value: string; color?: string; icon: string }> = ({ label, value, color, icon }) => (
  <View style={s.kpiCard}>
    <Ionicons name={icon as any} size={20} color={color || WebColors.textSecondary} />
    <Text style={[s.kpiVal, color ? { color } : undefined]}>{value}</Text>
    <Text style={s.kpiLabel}>{label}</Text>
  </View>
);

export const WebDailySummaryScreen: React.FC = () => {
  const [date] = useState(TODAY);
  const d = MOCK;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.headerRow}>
        <View>
          <Text style={s.title}>สรุปประจำวัน</Text>
          <Text style={s.subtitle}>📅 {date}</Text>
        </View>
        <View style={s.exportRow}>
          <TouchableOpacity style={s.exportBtn} onPress={() => alert('Export PDF')}><Ionicons name="document-text-outline" size={14} color={WebColors.primary} /><Text style={s.exportBtnText}>PDF</Text></TouchableOpacity>
          <TouchableOpacity style={s.exportBtn} onPress={() => alert('Export Excel')}><Ionicons name="grid-outline" size={14} color={WebColors.primary} /><Text style={s.exportBtnText}>Excel</Text></TouchableOpacity>
          <TouchableOpacity style={s.exportBtn} onPress={() => alert('Print')}><Ionicons name="print-outline" size={14} color={WebColors.primary} /><Text style={s.exportBtnText}>พิมพ์</Text></TouchableOpacity>
        </View>
      </View>

      {/* 1. KPI */}
      <View style={s.kpiRow}>
        <KPI label="ยอดขายรวม" value={`฿${fmt(d.kpi.sales)}`} color={WebColors.primary} icon="cash-outline" />
        <KPI label="จำนวนบิล" value={`${d.kpi.bills} บิล`} color="#0EA5E9" icon="receipt-outline" />
        <KPI label="เฉลี่ย/บิล" value={`฿${fmt(d.kpi.avg)}`} color="#7C3AED" icon="trending-up-outline" />
        <KPI label="กำไรเบื้องต้น" value={`฿${fmt(d.kpi.profit)}`} color="#16A34A" icon="arrow-up-circle-outline" />
        <KPI label="คืน/ยกเลิก" value={`${d.kpi.voids} บิล`} color="#EF4444" icon="close-circle-outline" />
      </View>

      {/* 2. ยอดขายแยกช่องทาง */}
      <View style={s.card}>
        <Text style={s.cardTitle}>สรุปยอดขายแยกช่องทางชำระ</Text>
        <View style={s.table}>
          <View style={s.thead}>
            {['ช่องทาง', 'จำนวนบิล', 'ยอดเงิน', 'สัดส่วน'].map((h, i) => <Text key={i} style={s.th}>{h}</Text>)}
          </View>
          {d.payments.map((p, i) => (
            <View key={i} style={[s.tr, i % 2 === 1 && s.trAlt]}>
              <Text style={[s.td, { fontWeight: '600' }]}>{p.method}</Text>
              <Text style={s.td}>{p.bills}</Text>
              <Text style={s.td}>฿{fmt(p.amount)}</Text>
              <View style={[s.td, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                <View style={s.barBg}><View style={[s.barFill, { width: `${p.pct}%` }]} /></View>
                <Text style={{ fontSize: 15, color: WebColors.textSecondary }}>{p.pct}%</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 3. สต๊อก */}
      <View style={s.card}>
        <View style={s.cardHeaderRow}>
          <Text style={s.cardTitle}>สรุปสต๊อก</Text>
          <View style={[s.syncBadge, { backgroundColor: d.stock.syncStatus === 'synced' ? WebColors.successLight : WebColors.warningLight }]}>
            <Ionicons name={d.stock.syncStatus === 'synced' ? 'checkmark-circle' : 'time'} size={12} color={d.stock.syncStatus === 'synced' ? WebColors.success : WebColors.warning} />
            <Text style={{ fontSize: 14, color: d.stock.syncStatus === 'synced' ? WebColors.success : WebColors.warning, fontWeight: '600' }}>
              {d.stock.syncStatus === 'synced' ? `Synced ${d.stock.lastSync}` : 'Pending'}
            </Text>
          </View>
        </View>
        <View style={s.statRow}>
          <View style={s.statItem}><Text style={s.statVal}>{d.stock.itemsSold}</Text><Text style={s.statLabel}>SKU ที่ขาย</Text></View>
          <View style={s.statItem}><Text style={s.statVal}>{d.stock.qtySold}</Text><Text style={s.statLabel}>ชิ้นรวม</Text></View>
          <View style={s.statItem}><Text style={[s.statVal, { color: WebColors.warning }]}>{d.stock.lowStock} ⚠️</Text><Text style={s.statLabel}>ใกล้หมด</Text></View>
          <View style={s.statItem}><Text style={[s.statVal, { color: WebColors.danger }]}>{d.stock.outOfStock} ❌</Text><Text style={s.statLabel}>หมดสต๊อก</Text></View>
        </View>
      </View>

      {/* 4. CRM */}
      <View style={s.card}>
        <Text style={s.cardTitle}>สรุปคะแนน CRM</Text>
        <View style={s.statRow}>
          <View style={s.statItem}><Text style={[s.statVal, { color: WebColors.warning }]}>+{fmt(d.crm.earned)}</Text><Text style={s.statLabel}>แต้มแจก</Text></View>
          <View style={s.statItem}><Text style={[s.statVal, { color: WebColors.danger }]}>-{fmt(d.crm.redeemed)}</Text><Text style={s.statLabel}>แต้มใช้</Text></View>
          <View style={s.statItem}><Text style={[s.statVal, { color: WebColors.info }]}>{d.crm.newMembers}</Text><Text style={s.statLabel}>สมาชิกใหม่</Text></View>
          <View style={s.statItem}><Text style={[s.statVal, { color: WebColors.purple }]}>{d.crm.upgrades}</Text><Text style={s.statLabel}>อัปเกรด</Text></View>
          <View style={s.statItem}><Text style={[s.statVal, { color: WebColors.success }]}>{d.crm.coupons}</Text><Text style={s.statLabel}>คูปองใช้</Text></View>
          <View style={s.statItem}><Text style={s.statVal}>฿{fmt(d.crm.couponDiscount)}</Text><Text style={s.statLabel}>ส่วนลดคูปอง</Text></View>
        </View>
      </View>

      {/* 5. กะ */}
      <View style={s.card}>
        <Text style={s.cardTitle}>สรุปกะ</Text>
        <View style={s.table}>
          <View style={s.thead}>{['กะ', 'พนักงาน', 'เปิด', 'ปิด', 'ยอดขาย', 'ผลต่าง'].map((h, i) => <Text key={i} style={s.th}>{h}</Text>)}</View>
          {d.shifts.map((sh, i) => (
            <View key={i} style={[s.tr, i % 2 === 1 && s.trAlt]}>
              <Text style={s.td}>กะ {i + 1}</Text>
              <Text style={[s.td, { fontWeight: '600' }]}>{sh.name}</Text>
              <Text style={s.td}>{sh.open}</Text>
              <Text style={s.td}>{sh.close}</Text>
              <Text style={[s.td, { fontWeight: '700', color: WebColors.primary }]}>฿{fmt(sh.sales)}</Text>
              <Text style={[s.td, { fontWeight: '700', color: sh.diff >= 0 ? WebColors.success : WebColors.danger }]}>{sh.diff >= 0 ? '+' : ''}฿{fmt(sh.diff)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 6. เงินเข้า-ออก */}
      <View style={s.card}>
        <Text style={s.cardTitle}>เงินเข้า-ออกระหว่างวัน</Text>
        <View style={s.table}>
          <View style={s.thead}>{['เวลา', 'ประเภท', 'จำนวน', 'เหตุผล', 'โดย'].map((h, i) => <Text key={i} style={s.th}>{h}</Text>)}</View>
          {d.cashMov.map((m, i) => (
            <View key={i} style={[s.tr, i % 2 === 1 && s.trAlt]}>
              <Text style={s.td}>{m.time}</Text>
              <View style={s.td}><View style={[s.typeBadge, { backgroundColor: m.type === 'in' ? WebColors.successLight : WebColors.dangerLight }]}><Text style={{ fontSize: 14, fontWeight: '700', color: m.type === 'in' ? WebColors.success : WebColors.danger }}>{m.type === 'in' ? 'เงินเข้า' : 'เงินออก'}</Text></View></View>
              <Text style={[s.td, { fontWeight: '700', color: m.type === 'in' ? WebColors.success : WebColors.danger }]}>{m.type === 'in' ? '+' : '-'}฿{fmt(m.amount)}</Text>
              <Text style={s.td}>{m.reason}</Text>
              <Text style={s.td}>{m.by}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 7. Top สินค้า + ยกเลิก */}
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View style={[s.card, { flex: 2 }]}>
          <Text style={s.cardTitle}>สินค้าขายดี Top 5</Text>
          <View style={s.table}>
            <View style={s.thead}>{['#', 'สินค้า', 'จำนวน', 'ยอดเงิน', 'กำไร'].map((h, i) => <Text key={i} style={s.th}>{h}</Text>)}</View>
            {d.topProducts.map((p, i) => (
              <View key={i} style={[s.tr, i % 2 === 1 && s.trAlt]}>
                <Text style={[s.td, { fontWeight: '700' }]}>{i + 1}</Text>
                <Text style={[s.td, { flex: 2 }]}>{p.name}</Text>
                <Text style={s.td}>{p.qty}</Text>
                <Text style={s.td}>฿{fmt(p.revenue)}</Text>
                <Text style={[s.td, { color: WebColors.success, fontWeight: '600' }]}>฿{fmt(p.profit)}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={[s.card, { flex: 1 }]}>
          <Text style={s.cardTitle}>ยกเลิก/คืนสินค้า</Text>
          {d.voids.map((v, i) => (
            <View key={i} style={s.voidRow}>
              <Text style={s.voidTime}>{v.time} · {v.bill}</Text>
              <Text style={s.voidProduct}>{v.product} — ฿{v.amount}</Text>
              <Text style={s.voidReason}>{v.reason} (อนุมัติ: {v.by})</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: WebColors.gray50 },
  content: { padding: 24, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 13, color: '#64748B' },
  exportRow: { flexDirection: 'row', gap: 8 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  exportBtnText: { fontSize: 15, color: WebColors.primary, fontWeight: '600' },
  // KPI
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpiCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  kpiVal: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  kpiLabel: { fontSize: 14, color: '#64748B' },
  // Card
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  // Table
  table: { borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  thead: { flexDirection: 'row', backgroundColor: '#F8FAFC', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  th: { flex: 1, fontSize: 15, fontWeight: '700', color: '#64748B' },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  trAlt: { backgroundColor: '#FAFBFC' },
  td: { flex: 1, fontSize: 15, color: '#334155' },
  // Bar
  barBg: { flex: 1, height: 6, backgroundColor: '#E2E8F0', borderRadius: 3 },
  barFill: { height: 6, backgroundColor: WebColors.primary, borderRadius: 3 },
  // Stats
  statRow: { flexDirection: 'row', gap: 8 },
  statItem: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  statVal: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  statLabel: { fontSize: 14, color: '#64748B', marginTop: 2 },
  // Type badge
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  // Void
  voidRow: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 8, gap: 2 },
  voidTime: { fontSize: 14, color: '#94A3B8' },
  voidProduct: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  voidReason: { fontSize: 15, color: '#64748B' },
});
