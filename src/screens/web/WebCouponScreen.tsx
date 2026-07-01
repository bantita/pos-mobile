/**
 * WebCouponScreen — จัดการคูปอง (Web)
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import * as couponStore from '../../store/couponStore';
import { CouponStatus } from '../../types/coupon';
import { generateCouponCodes } from '../../services/coupon/CouponGenerator';

type ViewMode = 'list' | 'create' | 'detail';

export const WebCouponScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [view, setView] = useState<ViewMode>('list');
  const [selectedId, setSelectedId] = useState('');

  // Create form state
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [startDate, setStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const campaigns = couponStore.getCampaigns();

  const handleCreate = () => {
    if (!name.trim() || !prefix.trim() || !expiryDate.trim()) {
      window.alert('กรุณากรอกข้อมูลให้ครบ (ชื่อ, Prefix, วันหมดอายุ)');
      return;
    }
    const qty = parseInt(quantity) || 100;
    const id = `campaign-${Date.now()}`;
    const now = new Date().toISOString();

    const expiry = expiryDate.trim().replace(/[\s\/]/g, '-');
    couponStore.addCampaign({
      id, name: name.trim(), promotionId: id,
      prefix: prefix.trim().toUpperCase(), totalQuantity: qty,
      expiryDate: expiry,
      limits: { limitType: 'per_bill', perBillLimit: 1 },
      sharingPercent: 0, contactPerson: '', remark: '',
      createdAt: now, createdBy: 'admin', updatedAt: now,
    });

    const existing = couponStore.getAllExistingCodeSet();
    const result = generateCouponCodes({ prefix: prefix.trim().toUpperCase(), quantity: qty, existingCodes: existing });
    const codes = result.codes.map(code => ({
      code, campaignId: id, status: CouponStatus.ACTIVE,
      expiryDate: expiry, createdAt: now,
      statusHistory: [{ fromStatus: 'NEW' as const, toStatus: CouponStatus.ACTIVE, timestamp: now, actor: 'admin' }],
    }));
    couponStore.addCodes(codes);

    window.alert(`สร้างแคมเปญ "${name.trim()}" สำเร็จ\nGen คูปอง ${qty} ใบ (Prefix: ${prefix.trim().toUpperCase()})`);
    setName(''); setPrefix(''); setQuantity('100'); setExpiryDate('');
    setRefreshKey(k => k + 1);
    setView('list');
  };

  // Detail view
  if (view === 'detail' && selectedId) {
    const campaign = couponStore.getCampaign(selectedId);
    const stats = couponStore.getCampaignStats(selectedId);
    const codes = couponStore.getCodesByCampaign(selectedId);

    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <TouchableOpacity style={s.backBtn} onPress={() => setView('list')}>
          <Ionicons name="arrow-back" size={18} color={WebColors.text} />
          <Text style={s.backText}>ย้อนกลับ</Text>
        </TouchableOpacity>
        <Text style={s.title}>{campaign?.name || ''}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: WebColors.primary }} onPress={() => { const q = window.prompt('จำนวนที่ต้องการ Gen เพิ่ม', '100'); if (q) { const qty2 = parseInt(q) || 100; const ex = couponStore.getAllExistingCodeSet(); const r = generateCouponCodes({ prefix: campaign?.prefix || '', quantity: qty2, existingCodes: ex }); const now2 = new Date().toISOString(); couponStore.addCodes(r.codes.map(code => ({ code, campaignId: selectedId, status: CouponStatus.ACTIVE, expiryDate: campaign?.expiryDate || '', createdAt: now2, statusHistory: [{ fromStatus: 'NEW' as const, toStatus: CouponStatus.ACTIVE, timestamp: now2, actor: 'admin' }] }))); setRefreshKey(k => k + 1); window.alert(`Gen เพิ่ม ${qty2} ใบ สำเร็จ`); } }}>
            <Ionicons name="color-wand-outline" size={14} color={WebColors.primary} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: WebColors.primary }}>Gen เพิ่ม</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: WebColors.primary }} onPress={() => window.alert('Import CSV:\nวาง data รูปแบบ code,status,expiryDate')}>
            <Ionicons name="cloud-upload-outline" size={14} color={WebColors.primary} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: WebColors.primary }}>Import</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: WebColors.primary }} onPress={() => { const codes2 = couponStore.getCodesByCampaign(selectedId); const csv = ['code,status,expiryDate,usageDate,billNumber,branch'].concat(codes2.map(c => `${c.code},${c.status},${c.expiryDate},${c.usageDate || ''},${c.billNumber || ''},-`)).join('\n'); window.alert(`Export ${codes2.length} รายการ\n\n${csv.slice(0, 600)}`); }}>
            <Ionicons name="download-outline" size={14} color={WebColors.primary} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: WebColors.primary }}>Export</Text>
          </TouchableOpacity>
        </View>
        <View style={s.statsRow}>
          <View style={s.statBox}><Text style={s.statNum}>{stats.total}</Text><Text style={s.statLabel}>ทั้งหมด</Text></View>
          <View style={s.statBox}><Text style={[s.statNum, { color: WebColors.success }]}>{stats.active}</Text><Text style={s.statLabel}>ใช้ได้</Text></View>
          <View style={s.statBox}><Text style={[s.statNum, { color: WebColors.textSecondary }]}>{stats.used}</Text><Text style={s.statLabel}>ใช้แล้ว</Text></View>
          <View style={s.statBox}><Text style={[s.statNum, { color: WebColors.warning }]}>{stats.expired}</Text><Text style={s.statLabel}>หมดอายุ</Text></View>
        </View>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.th, { flex: 2 }]}>รหัสคูปอง</Text>
            <Text style={[s.th, { flex: 1 }]}>สถานะ</Text>
            <Text style={[s.th, { flex: 1 }]}>หมดอายุ</Text>
            <Text style={[s.th, { flex: 1 }]}>วันที่ใช้</Text>
            <Text style={[s.th, { flex: 1 }]}>สาขา</Text>
            <Text style={[s.th, { flex: 1 }]}>เลขที่บิล</Text>
          </View>
          {codes.slice(0, 100).map(c => (
            <View key={c.code} style={s.tableRow}>
              <Text style={[s.td, { flex: 2 }]}>{c.code}</Text>
              <Text style={[s.td, { flex: 1, color: c.status === 'ACTIVE' ? WebColors.success : WebColors.textSecondary }]}>{c.status === 'ACTIVE' ? 'ขาย/แจก' : c.status === 'USED' ? 'ใช้แล้ว' : c.status}</Text>
              <Text style={[s.td, { flex: 1 }]}>{c.expiryDate?.split('T')[0] || '-'}</Text>
              <Text style={[s.td, { flex: 1 }]}>{c.usageDate?.split('T')[0] || '-'}</Text>
              <Text style={[s.td, { flex: 1 }]}>-</Text>
              <Text style={[s.td, { flex: 1 }]}>{c.billNumber || '-'}</Text>
            </View>
          ))}
          {codes.length > 100 && <Text style={s.moreText}>แสดง 100 จาก {codes.length} รายการ</Text>}
        </View>
      </ScrollView>
    );
  }

  // Create view
  if (view === 'create') {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <TouchableOpacity style={s.backBtn} onPress={() => setView('list')}>
          <Ionicons name="arrow-back" size={18} color={WebColors.text} />
          <Text style={s.backText}>ย้อนกลับ</Text>
        </TouchableOpacity>
        <Text style={s.title}>สร้างแคมเปญคูปอง</Text>
        <View style={s.form}>
          <Text style={s.label}>ชื่อแคมเปญ *</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder="เช่น คูปองส่วนลดเงินสด T21" />
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Prefix *</Text>
              <TextInput style={s.input} value={prefix} onChangeText={setPrefix} placeholder="NVSC" autoCapitalize="characters" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>จำนวน *</Text>
              <TextInput style={s.input} value={quantity} onChangeText={setQuantity} placeholder="100" keyboardType="numeric" />
            </View>
          </View>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>วันที่มีผล</Text>
              <TextInput style={s.input} value={startDate} onChangeText={setStartDate} placeholder="เลือกวันที่" onFocus={(e: any) => { if (e.target) e.target.type = 'datetime-local'; }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>วันหมดอายุ *</Text>
              <TextInput style={s.input} value={expiryDate} onChangeText={setExpiryDate} placeholder="2025-12-31" onFocus={(e: any) => { if (e.target) e.target.type = 'datetime-local'; }} />
            </View>
          </View>
          <Text style={s.label}>สาขาที่ใช้ได้</Text>
          <TextInput style={s.input} value={''} placeholder="ทุกสาขา (ว่างไว้ = ใช้ได้ทุกสาขา)" />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: WebColors.success }]} onPress={handleCreate}>
              <Ionicons name="color-wand-outline" size={16} color="#fff" />
              <Text style={s.saveText}>Gen คูปอง</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: WebColors.primary }} onPress={() => window.alert('Import CSV:\nวาง data รูปแบบ code,status,expiryDate')}>
              <Ionicons name="cloud-upload-outline" size={14} color={WebColors.primary} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: WebColors.primary }}>Import</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: WebColors.primary }} onPress={() => window.alert('สร้างแคมเปญก่อนแล้ว Export ที่หน้ารายละเอียด')}>
              <Ionicons name="download-outline" size={14} color={WebColors.primary} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: WebColors.primary }}>Export</Text>
            </TouchableOpacity>
          </View>
          <View style={s.formActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setView('list')}>
              <Text style={s.cancelText}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.saveBtn} onPress={handleCreate}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={s.saveText}>สร้างแคมเปญ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // List view
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <TouchableOpacity style={s.backBtn} onPress={() => { if (onBack) onBack(); else window.history.back(); }}>
        <Ionicons name="arrow-back" size={18} color={WebColors.text} />
        <Text style={s.backText}>ย้อนกลับ</Text>
      </TouchableOpacity>
      <View style={s.headerRow}>
        <Text style={s.title}>จัดการคูปอง</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setView('create')}>
          <Ionicons name="add-outline" size={18} color="#fff" />
          <Text style={s.addText}>สร้างแคมเปญ</Text>
        </TouchableOpacity>
      </View>

      {campaigns.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="ticket-outline" size={48} color={WebColors.border} />
          <Text style={s.emptyText}>ยังไม่มีแคมเปญคูปอง</Text>
        </View>
      ) : (
        <View style={s.grid}>
          {campaigns.map(c => {
            const stats = couponStore.getCampaignStats(c.id);
            return (
              <TouchableOpacity key={c.id} style={s.card} onPress={() => { setSelectedId(c.id); setView('detail'); }}>
                <View style={s.cardHeader}>
                  <Text style={s.cardTitle}>{c.name}</Text>
                  <Text style={s.cardPrefix}>{c.prefix}</Text>
                </View>
                <View style={s.cardStats}>
                  <Text style={s.cardStat}>{stats.total} ทั้งหมด</Text>
                  <Text style={[s.cardStat, { color: '#2E7D32' }]}>{stats.active} ใช้ได้</Text>
                  <Text style={[s.cardStat, { color: '#616161' }]}>{stats.used} ใช้แล้ว</Text>
                </View>
                <Text style={s.cardExpiry}>หมดอายุ: {c.expiryDate.split('T')[0]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: WebColors.contentBg },
  content: { padding: 20, gap: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '800', color: WebColors.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WebColors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  backText: { fontSize: 13, color: WebColors.text, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 13, color: WebColors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  card: { width: 300, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: WebColors.border, padding: 14, gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 13, fontWeight: '700', color: WebColors.text, flex: 1 },
  cardPrefix: { fontSize: 15, fontWeight: '600', color: WebColors.primary, backgroundColor: '#FFE8E8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  cardStats: { flexDirection: 'row', gap: 12 },
  cardStat: { fontSize: 15, color: WebColors.textSecondary },
  cardExpiry: { fontSize: 15, color: WebColors.textSecondary },
  // Form
  form: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: WebColors.border, padding: 20, gap: 12, maxWidth: 600 },
  label: { fontSize: 15, fontWeight: '600', color: WebColors.textSecondary },
  input: { borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: WebColors.text },
  row: { flexDirection: 'row', gap: 12 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: WebColors.border },
  cancelText: { fontSize: 13, fontWeight: '600', color: WebColors.textSecondary },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: WebColors.primary },
  saveText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  // Stats
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  statBox: { alignItems: 'center' },
  statNum: { fontSize: 19, fontWeight: '700', color: WebColors.text },
  statLabel: { fontSize: 15, color: WebColors.textSecondary },
  // Table
  table: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: WebColors.border, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 8 },
  th: { fontSize: 15, fontWeight: '700', color: WebColors.textSecondary },
  tableRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: WebColors.border },
  td: { fontSize: 15, color: WebColors.text },
  moreText: { fontSize: 15, color: WebColors.textSecondary, textAlign: 'center', paddingVertical: 8 },
});
