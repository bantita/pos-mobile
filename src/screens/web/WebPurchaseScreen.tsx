/**
 * WebPurchaseScreen — M08 จัดซื้อ
 * Tabs: Supplier | PR | PO | รับสินค้า
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { usePurchaseStore } from '../../store/purchaseStore';

const fmt = (n: number) => n.toLocaleString('th-TH');

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  // Supplier
  active: { bg: WebColors.successLight, text: WebColors.success, label: 'ใช้งาน' },
  inactive: { bg: WebColors.gray100, text: WebColors.grayMedium, label: 'ระงับ' },
  // PR
  draft: { bg: WebColors.gray100, text: WebColors.grayMedium, label: 'ร่าง' },
  submitted: { bg: WebColors.infoLight, text: WebColors.info, label: 'รออนุมัติ' },
  approved: { bg: WebColors.successLight, text: WebColors.success, label: 'อนุมัติ' },
  rejected: { bg: WebColors.dangerLight, text: WebColors.danger, label: 'ไม่อนุมัติ' },
  converted: { bg: WebColors.purpleLight, text: WebColors.purple, label: 'สร้าง PO แล้ว' },
  // PO
  partial_receive: { bg: WebColors.warningLight, text: '#E65100', label: 'รับบางส่วน' },
  completed: { bg: WebColors.successLight, text: WebColors.success, label: 'เสร็จสิ้น' },
  cancelled: { bg: WebColors.dangerLight, text: WebColors.danger, label: 'ยกเลิก' },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return (
    <View style={[badgeS.wrap, { backgroundColor: c.bg }]}>
      <Text style={[badgeS.text, { color: c.text }]}>{c.label}</Text>
    </View>
  );
};
const badgeS = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  text: { fontSize: 14, fontWeight: '700' },
});

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabKey = 'supplier' | 'pr' | 'po' | 'receive';
const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'supplier', label: 'Supplier', icon: 'business-outline' },
  { key: 'pr', label: 'PR', icon: 'document-text-outline' },
  { key: 'po', label: 'PO', icon: 'cart-outline' },
  { key: 'receive', label: 'รับสินค้า', icon: 'cube-outline' },
];

// ─── Table Header ─────────────────────────────────────────────────────────────
const TableHead: React.FC<{ cols: { label: string; flex: number }[] }> = ({ cols }) => (
  <View style={tbl.head}>
    {cols.map(c => <Text key={c.label} style={[tbl.th, { flex: c.flex }]}>{c.label}</Text>)}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const WebPurchaseScreen: React.FC = () => {
  const { suppliers, requisitions, purchaseOrders, receives } = usePurchaseStore();
  const [activeTab, setActiveTab] = useState<TabKey>('supplier');

  // Receivable POs
  const receivablePOs = purchaseOrders.filter(po => po.status === 'approved' || po.status === 'partial_receive');

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.headerRow}>
        <Text style={s.title}>ระบบจัดซื้อ</Text>
        <View style={s.kpiRow}>
          <View style={s.kpiMini}>
            <Text style={s.kpiMiniLabel}>Supplier</Text>
            <Text style={s.kpiMiniValue}>{suppliers.length}</Text>
          </View>
          <View style={s.kpiMini}>
            <Text style={s.kpiMiniLabel}>PR รออนุมัติ</Text>
            <Text style={[s.kpiMiniValue, { color: WebColors.warning }]}>{requisitions.filter(r => r.status === 'submitted').length}</Text>
          </View>
          <View style={s.kpiMini}>
            <Text style={s.kpiMiniLabel}>PO ที่ต้องรับ</Text>
            <Text style={[s.kpiMiniValue, { color: WebColors.info }]}>{receivablePOs.length}</Text>
          </View>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={s.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[s.tab, activeTab === t.key && s.tabActive]} onPress={() => setActiveTab(t.key)}>
            <Ionicons name={t.icon as any} size={16} color={activeTab === t.key ? '#fff' : WebColors.textSecondary} />
            <Text style={[s.tabText, activeTab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={s.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* ─── Supplier Tab ─── */}
          {activeTab === 'supplier' && (
            <View style={s.tableWrap}>
              <TableHead cols={[
                { label: 'ชื่อผู้จัดจำหน่าย', flex: 2 },
                { label: 'รหัส', flex: 1 },
                { label: 'เบอร์โทร', flex: 1 },
                { label: 'เงื่อนไขจ่าย', flex: 1 },
                { label: 'สถานะ', flex: 0.7 },
              ]} />
              {suppliers.map((sup, idx) => (
                <View key={sup.id} style={[tbl.row, idx % 2 === 1 && tbl.rowAlt]}>
                  <Text style={[tbl.td, { flex: 2, fontWeight: '600' }]}>{sup.name}</Text>
                  <Text style={[tbl.td, { flex: 1 }]}>{sup.supplierCode}</Text>
                  <Text style={[tbl.td, { flex: 1 }]}>{sup.phone || '-'}</Text>
                  <Text style={[tbl.td, { flex: 1 }]}>{sup.paymentTerms || '-'}</Text>
                  <View style={{ flex: 0.7 }}>
                    <StatusBadge status={sup.isActive ? 'active' : 'inactive'} />
                  </View>
                </View>
              ))}
              {suppliers.length === 0 && <Text style={s.emptyText}>ยังไม่มีผู้จัดจำหน่าย</Text>}
            </View>
          )}

          {/* ─── PR Tab ─── */}
          {activeTab === 'pr' && (
            <View style={s.tableWrap}>
              <TableHead cols={[
                { label: 'เลขที่ PR', flex: 1.2 },
                { label: 'สถานะ', flex: 0.8 },
                { label: 'เหตุผล', flex: 2 },
                { label: 'รายการ', flex: 0.6 },
                { label: 'ผู้ขอ', flex: 1 },
                { label: 'วันที่', flex: 1 },
              ]} />
              {requisitions.map((pr, idx) => (
                <View key={pr.id} style={[tbl.row, idx % 2 === 1 && tbl.rowAlt]}>
                  <Text style={[tbl.td, { flex: 1.2, fontWeight: '600' }]}>{pr.prNo}</Text>
                  <View style={{ flex: 0.8 }}>
                    <StatusBadge status={pr.status} />
                  </View>
                  <Text style={[tbl.td, { flex: 2 }]} numberOfLines={1}>{pr.reason}</Text>
                  <Text style={[tbl.td, { flex: 0.6, textAlign: 'center' }]}>{pr.items.length}</Text>
                  <Text style={[tbl.td, { flex: 1 }]}>{pr.requestedBy}</Text>
                  <Text style={[tbl.td, { flex: 1 }]}>{new Date(pr.requestedAt).toLocaleDateString('th-TH')}</Text>
                </View>
              ))}
              {requisitions.length === 0 && <Text style={s.emptyText}>ยังไม่มีใบขอซื้อ</Text>}
            </View>
          )}

          {/* ─── PO Tab ─── */}
          {activeTab === 'po' && (
            <View style={s.tableWrap}>
              <TableHead cols={[
                { label: 'เลขที่ PO', flex: 1.2 },
                { label: 'ผู้จัดจำหน่าย', flex: 1.5 },
                { label: 'สถานะ', flex: 0.8 },
                { label: 'ยอดรวม', flex: 1 },
                { label: 'กำหนดส่ง', flex: 1 },
              ]} />
              {purchaseOrders.map((po, idx) => (
                <View key={po.id} style={[tbl.row, idx % 2 === 1 && tbl.rowAlt]}>
                  <Text style={[tbl.td, { flex: 1.2, fontWeight: '600' }]}>{po.poNo}</Text>
                  <Text style={[tbl.td, { flex: 1.5 }]}>{po.supplierName}</Text>
                  <View style={{ flex: 0.8 }}>
                    <StatusBadge status={po.status} />
                  </View>
                  <Text style={[tbl.td, { flex: 1, fontWeight: '600', color: WebColors.primary }]}>฿{fmt(po.grandTotal)}</Text>
                  <Text style={[tbl.td, { flex: 1 }]}>{po.deliveryDate}</Text>
                </View>
              ))}
              {purchaseOrders.length === 0 && <Text style={s.emptyText}>ยังไม่มีใบสั่งซื้อ</Text>}
            </View>
          )}

          {/* ─── Receive Tab ─── */}
          {activeTab === 'receive' && (
            <View style={s.tableWrap}>
              <Text style={s.sectionTitle}>PO ที่รอรับสินค้า</Text>
              <TableHead cols={[
                { label: 'เลขที่ PO', flex: 1.2 },
                { label: 'ผู้จัดจำหน่าย', flex: 1.5 },
                { label: 'สถานะ', flex: 0.8 },
                { label: 'รายการ', flex: 0.6 },
                { label: 'ยอดรวม', flex: 1 },
                { label: 'ดำเนินการ', flex: 0.8 },
              ]} />
              {receivablePOs.map((po, idx) => (
                <View key={po.id} style={[tbl.row, idx % 2 === 1 && tbl.rowAlt]}>
                  <Text style={[tbl.td, { flex: 1.2, fontWeight: '600' }]}>{po.poNo}</Text>
                  <Text style={[tbl.td, { flex: 1.5 }]}>{po.supplierName}</Text>
                  <View style={{ flex: 0.8 }}>
                    <StatusBadge status={po.status} />
                  </View>
                  <Text style={[tbl.td, { flex: 0.6, textAlign: 'center' }]}>{po.items.length}</Text>
                  <Text style={[tbl.td, { flex: 1, fontWeight: '600', color: WebColors.primary }]}>฿{fmt(po.grandTotal)}</Text>
                  <View style={{ flex: 0.8 }}>
                    <TouchableOpacity style={s.receiveBtn}>
                      <Ionicons name="checkmark-done-outline" size={14} color="#fff" />
                      <Text style={s.receiveBtnText}>รับสินค้า</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {receivablePOs.length === 0 && <Text style={s.emptyText}>ไม่มี PO ที่รอรับสินค้า</Text>}

              {/* Receive History */}
              {receives.length > 0 && (
                <View style={{ marginTop: 20 }}>
                  <Text style={s.sectionTitle}>ประวัติรับสินค้า</Text>
                  <TableHead cols={[
                    { label: 'เลขที่รับ', flex: 1.2 },
                    { label: 'อ้างอิง PO', flex: 1 },
                    { label: 'รายการ', flex: 0.6 },
                    { label: 'ผู้รับ', flex: 1 },
                    { label: 'วันที่', flex: 1 },
                  ]} />
                  {receives.map((rcv, idx) => (
                    <View key={rcv.id} style={[tbl.row, idx % 2 === 1 && tbl.rowAlt]}>
                      <Text style={[tbl.td, { flex: 1.2, fontWeight: '600' }]}>{rcv.receiveNo}</Text>
                      <Text style={[tbl.td, { flex: 1 }]}>{rcv.poNo}</Text>
                      <Text style={[tbl.td, { flex: 0.6, textAlign: 'center' }]}>{rcv.items.length}</Text>
                      <Text style={[tbl.td, { flex: 1 }]}>{rcv.receivedBy}</Text>
                      <Text style={[tbl.td, { flex: 1 }]}>{new Date(rcv.receivedAt).toLocaleDateString('th-TH')}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const tbl = StyleSheet.create({
  head: { flexDirection: 'row', backgroundColor: WebColors.gray50, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: WebColors.border, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  th: { fontSize: 15, fontWeight: '700', color: WebColors.textSecondary },
  row: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: WebColors.border, alignItems: 'center' },
  rowAlt: { backgroundColor: WebColors.gray50 },
  td: { fontSize: 13, color: WebColors.text },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: WebColors.contentBg, padding: 20, gap: 16 },

  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '800', color: WebColors.text },
  kpiRow: { flexDirection: 'row', gap: 16 },
  kpiMini: { alignItems: 'center', gap: 2 },
  kpiMiniLabel: { fontSize: 14, color: WebColors.textSecondary },
  kpiMiniValue: { fontSize: 15, fontWeight: '800', color: WebColors.text },

  // Tabs
  tabRow: { flexDirection: 'row', gap: 6 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: WebColors.border, backgroundColor: '#fff' },
  tabActive: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  tabText: { fontSize: 13, color: WebColors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  // Content
  content: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: WebColors.border, padding: 16 },
  tableWrap: { gap: 0 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: WebColors.text, marginBottom: 10 },

  // Receive Button
  receiveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: WebColors.success, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  receiveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Empty
  emptyText: { fontSize: 13, color: WebColors.textSecondary, textAlign: 'center', paddingVertical: 40 },
});
