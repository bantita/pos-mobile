/**
 * WebSaleHistoryScreen — ประวัติขาย (Sale History)
 * แสดง listing บิลทั้งหมด + ค้นหา + กดดูรายละเอียด
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { Colors, Space, Radius, Shadow, Font } from '../../design-system/tokens';
import { useSaleHistoryStore, SaleRecord } from '../../store/saleHistoryStore';
import { useUserBranches } from '../../hooks/useUserBranches';
import { LookupCheckbox } from '../../components/ui/LookupCheckbox';

const fmt = (n: number) => n.toLocaleString();
const fmtDate = (d: Date) => new Date(d).toLocaleDateString('th-TH');
const fmtTime = (d: Date) => new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const color = status === 'completed' ? '#16A34A' : status === 'voided' ? '#EF4444' : '#F59E0B';
  const bg = status === 'completed' ? '#DCFCE7' : status === 'voided' ? '#FEE2E2' : '#FEF3C7';
  const label = status === 'completed' ? 'สำเร็จ' : status === 'voided' ? 'ยกเลิก' : 'คืนสินค้า';
  return <View style={[s.badge, { backgroundColor: bg }]}><Text style={[s.badgeText, { color }]}>{label}</Text></View>;
};

export const WebSaleHistoryScreen: React.FC = () => {
  const { sales, searchSales } = useSaleHistoryStore();
  const { accessibleBranches, canSeeAll } = useUserBranches();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [tab, setTab] = useState<'all' | 'completed' | 'returned'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [branchFilter, setBranchFilter] = useState<string[]>([]);

  const filtered = (() => {
    let base = search.trim() ? searchSales(search) : sales;
    // Branch access filter — ถ้าไม่ใช่ owner/admin ดูได้เฉพาะสาขาตัวเอง
    if (!canSeeAll) {
      const names = accessibleBranches.map(b => b.name);
      base = base.filter(s => names.includes(s.branchName || 'สาขาหลัก'));
    }
    // Branch filter (UI เลือก — multi-select)
    if (branchFilter.length > 0) {
      const names = branchFilter.map(id => accessibleBranches.find(b => b.id === id)?.name).filter(Boolean);
      base = base.filter(s => names.includes(s.branchName || 'สาขาหลัก'));
    }
    if (tab === 'completed') base = base.filter(s => s.status === 'completed');
    if (tab === 'returned') base = base.filter(s => s.status === 'voided' || s.status === 'returned');
    if (dateFrom) base = base.filter(s => new Date(s.createdAt).toISOString().slice(0, 10) >= dateFrom);
    if (dateTo) base = base.filter(s => new Date(s.createdAt).toISOString().slice(0, 10) <= dateTo);
    return base;
  })();

  const totalToday = sales.filter(sl => new Date(sl.createdAt).toDateString() === new Date().toDateString());
  const todayAmount = totalToday.filter(sl => sl.status === 'completed').reduce((sum, sl) => sum + sl.grandTotal, 0);

  // Detail view
  if (selectedSale) {
    return (
      <ScrollView style={s.root} contentContainerStyle={s.content}>
        <TouchableOpacity style={s.backRow} onPress={() => setSelectedSale(null)}>
          <Ionicons name="arrow-back" size={16} color={WebColors.primary} />
          <Text style={s.backText}>กลับรายการบิล</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={s.title}>{selectedSale.saleNo}</Text>
          <StatusBadge status={selectedSale.status} />
        </View>
        <Text style={s.subtitle}>{fmtDate(selectedSale.createdAt)} {fmtTime(selectedSale.createdAt)} · {selectedSale.cashierName} · {selectedSale.posName}</Text>

        <View style={s.kpiRow}>
          <View style={s.kpi}><Text style={[s.kpiVal, { color: WebColors.primary }]}>฿{fmt(selectedSale.grandTotal)}</Text><Text style={s.kpiLabel}>ยอดรวม</Text></View>
          <View style={s.kpi}><Text style={s.kpiVal}>{selectedSale.payments.map(p => p.method === 'cash' ? 'เงินสด' : p.method === 'qr' ? 'QR' : p.method === 'credit' ? 'บัตรเครดิต' : p.method === 'transfer' ? 'โอน' : p.method).join(' + ')}</Text><Text style={s.kpiLabel}>ช่องทางชำระ</Text></View>
          <View style={s.kpi}><Text style={s.kpiVal}>{selectedSale.memberName || '—'}</Text><Text style={s.kpiLabel}>สมาชิก</Text></View>
          <View style={s.kpi}><Text style={[s.kpiVal, { color: '#F59E0B' }]}>{selectedSale.pointsEarned ? `+${selectedSale.pointsEarned}` : '—'}</Text><Text style={s.kpiLabel}>แต้มที่ได้</Text></View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>รายการสินค้า ({selectedSale.items?.length ?? 0} รายการ)</Text>
          <View style={{ flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
            <Text style={{ width: 60, fontSize: 10, fontWeight: '600', color: Colors.textSecondary }}>รหัส</Text>
            <Text style={{ flex: 2, fontSize: 10, fontWeight: '600', color: Colors.textSecondary }}>สินค้า</Text>
            <Text style={{ width: 50, fontSize: 10, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' }}>จำนวน</Text>
            <Text style={{ width: 70, fontSize: 10, fontWeight: '600', color: Colors.textSecondary, textAlign: 'right' }}>ราคา</Text>
            <Text style={{ width: 60, fontSize: 10, fontWeight: '600', color: Colors.textSecondary, textAlign: 'right' }}>ส่วนลด</Text>
            <Text style={{ width: 80, fontSize: 10, fontWeight: '600', color: Colors.textSecondary, textAlign: 'right' }}>รวม</Text>
          </View>
          {(selectedSale.items ?? []).map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.background, alignItems: 'center' }}>
              <Text style={{ width: 60, fontSize: 10, color: Colors.textSecondary }}>{item.product.code}</Text>
              <Text style={{ flex: 2, fontSize: 12, color: Colors.text }} numberOfLines={1}>{item.product.name}</Text>
              <Text style={{ width: 50, fontSize: 13, color: Colors.text, textAlign: 'center' }}>{item.qty}</Text>
              <Text style={{ width: 70, fontSize: 13, color: Colors.text, textAlign: 'right' }}>฿{fmt(item.unitPrice)}</Text>
              <Text style={{ width: 60, fontSize: 13, color: item.discountAmount > 0 ? '#EF4444' : Colors.textMuted, textAlign: 'right' }}>{item.discountAmount > 0 ? `-฿${fmt(item.discountAmount)}` : '—'}</Text>
              <Text style={{ width: 80, fontSize: 13, fontWeight: '600', color: Colors.text, textAlign: 'right' }}>฿{fmt(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>รายละเอียดยอด</Text>
          <View style={s.detailRow}><Text style={s.detailLbl}>ยอดสินค้า</Text><Text style={s.detailVal}>฿{fmt(selectedSale.subtotal)}</Text></View>
          {selectedSale.discountTotal > 0 && <View style={s.detailRow}><Text style={s.detailLbl}>ส่วนลด</Text><Text style={[s.detailVal, { color: '#EF4444' }]}>-฿{fmt(selectedSale.discountTotal)}</Text></View>}
          {selectedSale.serviceCharge > 0 && <View style={s.detailRow}><Text style={s.detailLbl}>Service Charge</Text><Text style={s.detailVal}>+฿{fmt(selectedSale.serviceCharge)}</Text></View>}
          <View style={s.detailRow}><Text style={s.detailLbl}>VAT</Text><Text style={s.detailVal}>฿{fmt(selectedSale.vatAmount)}</Text></View>
          <View style={[s.detailRow, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8, marginTop: 4 }]}><Text style={[s.detailLbl, { fontWeight: '700' }]}>ยอดสุทธิ</Text><Text style={[s.detailVal, { fontWeight: '800', color: WebColors.primary }]}>฿{fmt(selectedSale.grandTotal)}</Text></View>
          <View style={s.detailRow}><Text style={s.detailLbl}>รับเงิน</Text><Text style={s.detailVal}>฿{fmt(selectedSale.receivedAmount)}</Text></View>
          <View style={s.detailRow}><Text style={s.detailLbl}>เงินทอน</Text><Text style={s.detailVal}>฿{fmt(selectedSale.changeAmount)}</Text></View>
        </View>

        {selectedSale.returnedItems && selectedSale.returnedItems.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>สินค้าที่คืน</Text>
            {selectedSale.returnedItems.map((ri, i) => (
              <View key={i} style={s.detailRow}>
                <Text style={s.detailLbl}>สินค้า {ri.productId} x{ri.qty}</Text>
                <Text style={[s.detailVal, { color: '#EF4444' }]}>-฿{fmt(ri.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, backgroundColor: WebColors.primary }} onPress={() => alert('พิมพ์ใบเสร็จซ้ำ')}>
            <Ionicons name="print" size={14} color="#FFF" />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFF' }}>พิมพ์ใบเสร็จ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, backgroundColor: Colors.border, borderWidth: 1, borderColor: Colors.border }} onPress={() => alert('ออกใบกำกับภาษี')}>
            <Ionicons name="document-text" size={14} color="#475569" />
            <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textSecondary }}>ใบกำกับภาษี</Text>
          </TouchableOpacity>
          {selectedSale.status === 'completed' && (
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' }} onPress={() => alert('คืนสินค้าจากบิลนี้')}>
              <Ionicons name="return-down-back" size={14} color="#DC2626" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#DC2626' }}>คืนสินค้า</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  // Listing view
  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <Text style={s.title}>ประวัติการขาย</Text>
      <Text style={s.subtitle}>ดูบิลย้อนหลังทั้งหมด · ค้นหาตามเลขบิล, สมาชิก, พนักงาน</Text>

      <View style={s.kpiRow}>
        <View style={s.kpi}><Text style={[s.kpiVal, { color: WebColors.primary }]}>{sales.length}</Text><Text style={s.kpiLabel}>บิลทั้งหมด</Text></View>
        <View style={s.kpi}><Text style={[s.kpiVal, { color: '#16A34A' }]}>฿{fmt(todayAmount)}</Text><Text style={s.kpiLabel}>ยอดวันนี้</Text></View>
        <View style={s.kpi}><Text style={[s.kpiVal, { color: '#0EA5E9' }]}>{totalToday.length}</Text><Text style={s.kpiLabel}>บิลวันนี้</Text></View>
        <View style={s.kpi}><Text style={[s.kpiVal, { color: '#EF4444' }]}>{sales.filter(sl => sl.status === 'voided').length}</Text><Text style={s.kpiLabel}>ยกเลิก</Text></View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
        {([['all', 'ทั้งหมด'], ['completed', 'ขายสำเร็จ'], ['returned', 'คืน / ยกเลิก']] as const).map(([k, label]) => (
          <TouchableOpacity key={k} style={[s.tabPill, tab === k && s.tabPillActive]} onPress={() => setTab(k)}>
            <Text style={[s.tabPillText, tab === k && s.tabPillTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date filter */}
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', maxWidth: 420 }}>
        <Text style={{ fontSize: 11, color: WebColors.textSecondary }}>ตั้งแต่</Text>
        {Platform.OS === 'web' ? (
          <input type="date" value={dateFrom} onChange={(e: any) => setDateFrom(e.target.value)} style={{ height: 32, border: '1px solid #E5E7EB', borderRadius: 8, paddingLeft: 8, paddingRight: 8, fontSize: 12, color: '#1F2937', width: 140 }} />
        ) : (
          <TextInput style={s.searchInput} value={dateFrom} onChangeText={setDateFrom} placeholder="YYYY-MM-DD" />
        )}
        <Text style={{ fontSize: 11, color: WebColors.textSecondary }}>ถึง</Text>
        {Platform.OS === 'web' ? (
          <input type="date" value={dateTo} onChange={(e: any) => setDateTo(e.target.value)} style={{ height: 32, border: '1px solid #E5E7EB', borderRadius: 8, paddingLeft: 8, paddingRight: 8, fontSize: 12, color: '#1F2937', width: 140 }} />
        ) : (
          <TextInput style={s.searchInput} value={dateTo} onChangeText={setDateTo} placeholder="YYYY-MM-DD" />
        )}
        {(dateFrom || dateTo) && (
          <TouchableOpacity onPress={() => { setDateFrom(''); setDateTo(''); }} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#FEE2E2' }}>
            <Text style={{ fontSize: 10, color: '#DC2626' }}>ล้าง</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Branch filter */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="business-outline" size={14} color={WebColors.textSecondary} />
        <Text style={{ fontSize: 11, color: WebColors.textSecondary }}>สาขา:</Text>
        <View style={{ width: 220 }}>
          <LookupCheckbox
            items={accessibleBranches.map(b => ({ id: b.id, label: b.name }))}
            selectedIds={branchFilter}
            onChange={setBranchFilter}
            placeholder="ทุกสาขา"
            title="เลือกสาขา"
            columns={['ชื่อสาขา']}
          />
        </View>
      </View>

      <View style={s.searchRow}>
        <Ionicons name="search" size={15} color="#94A3B8" />
        <TextInput style={s.searchInput} placeholder="ค้นหาเลขบิล, ชื่อสมาชิก, พนักงาน..." value={search} onChangeText={setSearch} placeholderTextColor="#94A3B8" />
      </View>

      {isMobile ? (
        <View style={{ gap: 10 }}>
          {filtered.map((sale) => (
            <TouchableOpacity key={sale.id} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#F0E2DA' }} onPress={() => setSelectedSale(sale)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: WebColors.primary }}>{sale.saleNo}</Text>
                <StatusBadge status={sale.status} />
              </View>
              <Text style={{ fontSize: 13, color: '#6B5B57', marginTop: 4 }}>{fmtDate(sale.createdAt)} {fmtTime(sale.createdAt)}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#3A2E2B' }}>฿{fmt(sale.grandTotal)}</Text>
                <View style={[s.badge, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[s.badgeText, { color: '#2563EB' }]}>{sale.payments.map(p => p.method === 'cash' ? 'เงินสด' : p.method === 'qr' ? 'QR' : p.method === 'credit' ? 'บัตร' : p.method === 'transfer' ? 'โอน' : p.method).join(' + ')}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
                <Text style={{ fontSize: 12, color: '#6B5B57' }}>{sale.cashierName}</Text>
                <Text style={{ fontSize: 12, color: '#6B5B57' }}>{sale.branchName || 'สาขาหลัก'}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {filtered.length === 0 && <Text style={s.empty}>ไม่พบบิล</Text>}
        </View>
      ) : (
      <View style={s.table}>
        <View style={s.thead}>
          {['เลขบิล', 'วันที่', 'เวลา', 'ยอดรวม', 'ชำระ', 'สาขา', 'สมาชิก', 'พนักงาน', 'สถานะ'].map((h, i) => (
            <Text key={i} style={[s.th, i === 0 && { flex: 1.5 }]}>{h}</Text>
          ))}
        </View>
        {filtered.map((sale, i) => (
          <TouchableOpacity key={sale.id} style={[s.tr, i % 2 === 1 && s.trAlt]} onPress={() => setSelectedSale(sale)}>
            <Text style={[s.td, { flex: 1.5, fontWeight: '700', color: WebColors.primary }]}>{sale.saleNo}</Text>
            <Text style={s.td}>{fmtDate(sale.createdAt)}</Text>
            <Text style={s.td}>{fmtTime(sale.createdAt)}</Text>
            <Text style={[s.td, { fontWeight: '700' }]}>฿{fmt(sale.grandTotal)}</Text>
            <Text style={s.td}>{sale.payments.map(p => p.method === 'cash' ? 'เงินสด' : p.method === 'qr' ? 'QR' : p.method === 'credit' ? 'บัตร' : p.method === 'transfer' ? 'โอน' : p.method).join(' + ')}</Text>
            <Text style={s.td}>{sale.branchName || 'สาขาหลัก'}</Text>
            <Text style={s.td}>{sale.memberName || '—'}</Text>
            <Text style={s.td}>{sale.cashierName}</Text>
            <View style={s.td}><StatusBadge status={sale.status} /></View>
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && <Text style={s.empty}>ไม่พบบิล</Text>}
      </View>
      )}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: WebColors.contentBg },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 16, fontWeight: '800', color: WebColors.text },
  subtitle: { fontSize: 13, color: WebColors.textSecondary },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  backText: { fontSize: 13, color: WebColors.primary, fontWeight: '600' },
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpi: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: WebColors.border },
  kpiVal: { fontSize: 16, fontWeight: '800', color: WebColors.text },
  kpiLabel: { fontSize: 12, color: WebColors.textSecondary },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, height: 42, borderWidth: 1, borderColor: WebColors.border },
  searchInput: { flex: 1, fontSize: 13, color: WebColors.text },
  table: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: WebColors.border, overflow: 'hidden' },
  thead: { flexDirection: 'row', backgroundColor: Colors.background, paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: WebColors.border },
  th: { flex: 1, fontSize: 12, fontWeight: '700', color: WebColors.textSecondary },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  trAlt: { backgroundColor: Colors.background },
  td: { flex: 1, fontSize: 12, color: WebColors.text },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  empty: { padding: 24, textAlign: 'center', color: Colors.textMuted, fontSize: 13 },
  tabPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: Colors.border, borderWidth: 1, borderColor: WebColors.border },
  tabPillActive: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  tabPillText: { fontSize: 12, color: WebColors.textSecondary, fontWeight: '500' },
  tabPillTextActive: { color: '#FFF', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: WebColors.border, gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: WebColors.text, marginBottom: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailLbl: { fontSize: 12, color: WebColors.textSecondary },
  detailVal: { fontSize: 12, fontWeight: '600', color: WebColors.text },
});
