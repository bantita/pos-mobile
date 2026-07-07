/**
 * PricingModuleScreen — กำหนดราคา (แยกจากสินค้า)
 * ราคากลาง / ราคาสาขา / ถาวร / ชั่วคราว
 * Import/Export, Copy, Listing เช็คราคา
 */
import React, { useState, useMemo } from 'react';
import { Modal, Platform, useWindowDimensions } from 'react-native';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { Palette } from '@/shared/constants/palette';
import { Colors } from '@/shared/ui/tokens';
import { usePricingStore } from '@/features/product/application/stores/pricingStore';
import { PricingDocument, PricingScope, PricingDuration } from '@/features/product/domain/pricing';
import { DateInput } from '@/features/web/presentation/components/DateInput';
import { useProductStore } from '@/features/product/application/stores/productStore';
import { LookupCheckbox } from '@/shared/components/ui/LookupCheckbox';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';

type TabKey = 'documents' | 'central' | 'branch' | 'check';

export const PricingModuleScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const { documents, createDocument, deleteDocument, cancelDocument, copyDocument, resolvePriceList } = usePricingStore();
  const [tab, setTab] = useState<TabKey>('documents');
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<'all' | 'central' | 'branch'>('all');
  const [selectedDoc, setSelectedDoc] = useState<PricingDocument | null>(null);

  // Create form
  const [newName, setNewName] = useState('');
  const [newScope, setNewScope] = useState<PricingScope>('central');
  const [newDuration, setNewDuration] = useState<PricingDuration>('permanent');
  const [newBranch, setNewBranch] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [newEffective, setNewEffective] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const filtered = useMemo(() => {
    if (filter === 'all') return documents;
    return documents.filter(d => d.scope === filter);
  }, [documents, filter]);

  const handleCreate = () => {
    if (!newName.trim() || !newEffective) return;
    const doc = createDocument({
      name: newName, description: newDesc, scope: newScope, duration: newDuration,
      effectiveDate: newEffective, expiryDate: newDuration === 'temporary' ? newExpiry : undefined,
      branchId: newScope === 'branch' ? newBranch : undefined,
      branchName: newScope === 'branch' ? newBranchName : undefined,
      items: [], createdBy: 'admin',
    });
    setNewName(''); setNewDesc(''); setNewEffective(''); setNewExpiry(''); setShowCreate(false);
    // เปิดหน้าเพิ่มสินค้าทันที
    setSelectedDoc(doc);
  };

  const handleCopy = (doc: PricingDocument) => {
    const name = `สำเนา: ${doc.name}`;
    const copied = copyDocument(doc.id, name);
    // เปิดเอกสารที่ copy มาให้ user แก้ไข/ยืนยัน
    setSelectedDoc(copied);
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>กำหนดราคา</Text>
          <Text style={s.subtitle}>ราคากลาง · ราคาสาขา · ถาวร · ชั่วคราว</Text>
        </View>
        <TouchableOpacity style={s.primaryBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={15} color="#fafafa" />
          <Text style={s.primaryBtnText}>สร้างเอกสารราคา</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {([['documents', 'เอกสารทั้งหมด'], ['check', 'เช็คราคา']] as const).map(([k, label]) => (
          <TouchableOpacity key={k} style={[s.tabBtn, tab === k && s.tabBtnActive]} onPress={() => setTab(k)}>
            <Text style={[s.tabText, tab === k && s.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── เช็คราคา ── */}
      {/* ── เช็คราคา ── */}
      {!selectedDoc && tab === 'check' && (
        <CheckPricePanel />
      )}

      {/* ── รายละเอียดเอกสาร + เพิ่มสินค้า ── */}
      {selectedDoc && (
        <DocumentDetailWrapper docId={selectedDoc.id} onClose={() => setSelectedDoc(null)} />
      )}

      {/* ── เอกสารทั้งหมด ── */}
      {!selectedDoc && tab === 'documents' && (
        <View>
          {/* Filter pills */}
          <View style={s.filterRow}>
            {([['all', 'ทั้งหมด'], ['central', 'ราคากลาง'], ['branch', 'ราคาสาขา']] as const).map(([k, label]) => (
              <TouchableOpacity key={k} style={[s.pill, filter === k && s.pillActive]} onPress={() => setFilter(k)}>
                <Text style={[s.pillText, filter === k && s.pillTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Document list */}
          <View style={{ gap: 10 }}>
            {filtered.map(doc => (
              <View key={doc.id} style={s.docCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>{doc.name}</Text>
                      <Badge label={doc.scope === 'central' ? 'กลาง' : doc.branchName || 'สาขา'} color={doc.scope === 'central' ? Palette.info : Palette.warning} />
                      <Badge label={doc.duration === 'permanent' ? 'ถาวร' : 'ชั่วคราว'} color={doc.duration === 'permanent' ? Palette.success : Palette.purple} />
                      <Badge label={doc.status === 'active' ? 'Active' : doc.status === 'draft' ? 'Draft' : doc.status} color={doc.status === 'active' ? Palette.success : doc.status === 'draft' ? Palette.textSecondary : Palette.danger} />
                    </View>
                    <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>
                      {doc.docNo} · มีผล {doc.effectiveDate}{doc.expiryDate ? ` ถึง ${doc.expiryDate}` : ''} · {doc.items.length} รายการ
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity style={s.iconBtn} onPress={() => setSelectedDoc(doc)}>
                      <Ionicons name="eye-outline" size={14} color="#0ea5e9" />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.iconBtn} onPress={() => handleCopy(doc)}>
                      <Ionicons name="copy-outline" size={14} color="#7c3aed" />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.iconBtn} onPress={() => cancelDocument(doc.id)}>
                      <Ionicons name="close-circle-outline" size={14} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Items preview */}
                {doc.items.length > 0 && (
                  <View style={{ backgroundColor: Colors.background, borderRadius: 8, padding: 8 }}>
                    {doc.items.slice(0, 3).map((item, i) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                        <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{item.productCode}</Text>
                        <Text style={{ fontSize: 11, color: Colors.text, flex: 1, marginLeft: 8 }}>{item.productName}</Text>
                        <Text style={{ fontSize: 11, color: Colors.textSecondary }}>฿{item.originalPrice} → <Text style={{ color: Palette.primary, fontWeight: '600' }}>฿{item.newPrice}</Text></Text>
                      </View>
                    ))}
                    {doc.items.length > 3 && <Text style={{ fontSize: 10, color: Colors.textMuted }}>+{doc.items.length - 3} รายการอื่น</Text>}
                  </View>
                )}
              </View>
            ))}
            {filtered.length === 0 && <Text style={s.empty}>ยังไม่มีเอกสารกำหนดราคา</Text>}
          </View>
        </View>
      )}

      {/* ── Create Modal ── */}
      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <View style={s.overlay}>
          <View style={[s.modal, isMobile && s.modalMobile]}>
            <ScrollView
              style={s.modalScroll}
              contentContainerStyle={[s.modalBody, isMobile && s.modalBodyMobile]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
            <Text style={s.modalTitle}>สร้างเอกสารกำหนดราคา</Text>

            <Text style={s.label}>ชื่อเอกสาร *</Text>
            <TextInput style={s.input} value={newName} onChangeText={setNewName} placeholder="เช่น ปรับราคา ก.ค. 69" placeholderTextColor="#9ca3af" />

            <Text style={s.label}>ขอบเขต</Text>
            <View style={s.filterRow}>
              {([['central', 'ราคากลาง (ทุกสาขา)'], ['branch', 'ราคาสาขา (เฉพาะสาขา)']] as const).map(([k, label]) => (
                <TouchableOpacity key={k} style={[s.pill, newScope === k && s.pillActive]} onPress={() => setNewScope(k)}>
                  <Text style={[s.pillText, newScope === k && s.pillTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {newScope === 'branch' && (
              <>
                <Text style={s.label}>เลือกสาขา *</Text>
                <LookupCheckbox
                  items={[{ id: 'branch-01', label: 'สาขาหลัก' }, { id: 'branch-02', label: 'สาขา เกาะสมุย' }, { id: 'branch-03', label: 'สาขา เชียงใหม่' }]}
                  selectedIds={newBranch ? [newBranch] : []}
                  onChange={(ids) => { const id = ids[ids.length - 1] || ''; setNewBranch(id); setNewBranchName(id === 'branch-01' ? 'สาขาหลัก' : id === 'branch-02' ? 'สาขา เกาะสมุย' : id === 'branch-03' ? 'สาขา เชียงใหม่' : ''); }}
                  placeholder="เลือกสาขา..."
                  title="เลือกสาขา"
                  columns={['ชื่อสาขา']}
                />
              </>
            )}

            <Text style={s.label}>ประเภทราคา</Text>
            <View style={s.filterRow}>
              {([['permanent', 'ถาวร (มีวันเริ่ม ไม่มีวันหมด)'], ['temporary', 'ชั่วคราว (มีวันเริ่ม-สิ้นสุด)']] as const).map(([k, label]) => (
                <TouchableOpacity key={k} style={[s.pill, newDuration === k && s.pillActive]} onPress={() => setNewDuration(k)}>
                  <Text style={[s.pillText, newDuration === k && s.pillTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>วันที่เริ่มมีผล *</Text>
            <DateInput value={newEffective} onChange={setNewEffective} fullWidth={isMobile} />

            {newDuration === 'temporary' && (
              <>
                <Text style={s.label}>วันที่สิ้นสุด *</Text>
                <DateInput value={newExpiry} onChange={setNewExpiry} fullWidth={isMobile} />
              </>
            )}

            <Text style={s.label}>คำอธิบาย</Text>
            <TextInput style={[s.input, { height: 50, textAlignVertical: 'top' }]} value={newDesc} onChangeText={setNewDesc} placeholder="หมายเหตุ..." placeholderTextColor="#9ca3af" multiline />
            </ScrollView>
            <View style={s.modalFooter}>
              <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }} onPress={() => setShowCreate(false)}>
                <Text style={{ fontSize: 12, color: Colors.textSecondary }}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.primaryBtn} onPress={handleCreate}>
                <Ionicons name="checkmark" size={14} color="#fafafa" />
                <Text style={s.primaryBtnText}>สร้าง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// ─── CheckPricePanel ──────────────────────────────────────────────────────────
const CheckPricePanel: React.FC = () => {
  const { documents, resolvePriceList } = usePricingStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [checkTab, setCheckTab] = useState<'central' | 'branch'>('central');
  const [branchFilter, setBranchFilter] = useState<string[]>([]);

  // หาสาขาทั้งหมดจากเอกสาร
  const branches = useMemo(() => {
    const set = new Map<string, string>();
    documents.filter(d => d.scope === 'branch' && d.branchId).forEach(d => set.set(d.branchId!, d.branchName!));
    return Array.from(set.entries()).map(([id, name]) => ({ id, name }));
  }, [documents]);

  // ราคากลาง: เอาจากเอกสาร scope=central ที่ active + effectiveDate ล่าสุด
  const centralPrices = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const activeDocs = documents.filter(d => d.scope === 'central' && d.status === 'active' && d.effectiveDate <= today && (d.duration === 'permanent' || !d.expiryDate || d.expiryDate >= today));
    // เรียงตาม effectiveDate ล่าสุด
    activeDocs.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
    // รวมสินค้า (ใช้ราคาจากเอกสารล่าสุดที่มี)
    const map = new Map<string, { productCode: string; productName: string; originalPrice: number; price: number; docNo: string; duration: string; effectiveDate: string }>();
    for (const doc of activeDocs) {
      for (const item of doc.items) {
        if (!map.has(item.productId)) {
          map.set(item.productId, { productCode: item.productCode, productName: item.productName, originalPrice: item.originalPrice, price: item.newPrice, docNo: doc.docNo, duration: doc.duration, effectiveDate: doc.effectiveDate });
        }
      }
    }
    return Array.from(map.values());
  }, [documents]);

  // ราคาสาขา: filter ตามสาขาที่เลือก
  const branchPrices = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let activeDocs = documents.filter(d => d.scope === 'branch' && d.status === 'active' && d.effectiveDate <= today && (d.duration === 'permanent' || !d.expiryDate || d.expiryDate >= today));
    if (branchFilter.length > 0) activeDocs = activeDocs.filter(d => branchFilter.includes(d.branchId!));
    activeDocs.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
    const map = new Map<string, { productCode: string; productName: string; originalPrice: number; price: number; docNo: string; duration: string; branchName: string; effectiveDate: string }>();
    for (const doc of activeDocs) {
      for (const item of doc.items) {
        const key = `${item.productId}_${doc.branchId}`;
        if (!map.has(key)) {
          map.set(key, { productCode: item.productCode, productName: item.productName, originalPrice: item.originalPrice, price: item.newPrice, docNo: doc.docNo, duration: doc.duration, branchName: doc.branchName || '', effectiveDate: doc.effectiveDate });
        }
      }
    }
    return Array.from(map.values());
  }, [documents, branchFilter]);

  return (
    <View style={{ gap: 12 }}>
      {/* Sub-tabs */}
      <View style={s.filterRow}>
        {([['central', 'ราคากลาง'], ['branch', 'ราคาสาขา']] as const).map(([k, label]) => (
          <TouchableOpacity key={k} style={[s.pill, checkTab === k && s.pillActive]} onPress={() => setCheckTab(k)}>
            <Text style={[s.pillText, checkTab === k && s.pillTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ราคากลาง */}
      {checkTab === 'central' && (
        <View style={s.card}>
          <Text style={s.cardTitle}>ราคากลาง (ใช้ทุกสาขา)</Text>
          <Text style={{ fontSize: 10, color: Colors.textSecondary, marginBottom: 10 }}>แสดงราคาล่าสุดที่มีผลจากเอกสารราคากลาง</Text>
          {isMobile ? (
            <View style={{ gap: 10 }}>
              {centralPrices.map((rp, i) => (
                <View key={i} style={{ backgroundColor: '#fafafa', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e7e5e4' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#27272a' }}>{rp.productName}</Text>
                    <Badge label={rp.duration === 'permanent' ? 'ถาวร' : 'ชั่วคราว'} color={rp.duration === 'permanent' ? '#16a34a' : '#7c3aed'} />
                  </View>
                  <Text style={{ fontSize: 12, color: '#57534e', marginTop: 2 }}>{rp.productCode} · {rp.docNo}</Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: Colors.textSecondary, textDecorationLine: 'line-through' }}>฿{rp.originalPrice}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: Palette.primary }}>฿{rp.price}</Text>
                    <Text style={{ fontSize: 11, color: '#57534e' }}>มีผล {rp.effectiveDate}</Text>
                  </View>
                </View>
              ))}
              {centralPrices.length === 0 && <Text style={s.empty}>ยังไม่มีราคากลางที่กำหนด</Text>}
            </View>
          ) : (
          <View style={s.table}>
            <View style={s.thead}>
              <Text style={[s.th, { flex: 0.6 }]}>รหัส</Text>
              <Text style={[s.th, { flex: 1.3 }]}>สินค้า</Text>
              <Text style={[s.th, { flex: 0.6, textAlign: 'right' }]}>ราคาเก่า</Text>
              <Text style={[s.th, { flex: 0.6, textAlign: 'right' }]}>ราคาปัจจุบัน</Text>
              <Text style={[s.th, { flex: 0.7 }]}>วันที่เริ่มมีผล</Text>
              <Text style={[s.th, { flex: 0.9 }]}>เอกสาร</Text>
              <Text style={[s.th, { flex: 0.5 }]}>ประเภท</Text>
            </View>
            {centralPrices.map((rp, i) => (
              <View key={i} style={[s.tr, i % 2 === 1 && { backgroundColor: '#fafafa' }]}>
                <Text style={[s.td, { flex: 0.6, fontSize: 10, color: Colors.textSecondary }]}>{rp.productCode}</Text>
                <Text style={[s.td, { flex: 1.3 }]}>{rp.productName}</Text>
                <Text style={[s.td, { flex: 0.6, textAlign: 'right', color: Colors.textSecondary }]}>฿{rp.originalPrice}</Text>
                <Text style={[s.td, { flex: 0.6, textAlign: 'right', fontWeight: '700', color: Palette.primary }]}>฿{rp.price}</Text>
                <Text style={[s.td, { flex: 0.7, fontSize: 10 }]}>{rp.effectiveDate}</Text>
                <Text style={[s.td, { flex: 0.9, fontSize: 10, color: Colors.textSecondary }]}>{rp.docNo}</Text>
                <View style={{ flex: 0.5 }}><Badge label={rp.duration === 'permanent' ? 'ถาวร' : 'ชั่วคราว'} color={rp.duration === 'permanent' ? '#16a34a' : '#7c3aed'} /></View>
              </View>
            ))}
            {centralPrices.length === 0 && <Text style={s.empty}>ยังไม่มีราคากลางที่กำหนด</Text>}
          </View>
          )}
        </View>
      )}

      {/* ราคาสาขา */}
      {checkTab === 'branch' && (
        <View style={s.card}>
          <Text style={s.cardTitle}>ราคาสาขา</Text>
          <Text style={{ fontSize: 10, color: Colors.textSecondary, marginBottom: 10 }}>แสดงราคาล่าสุดที่มีผลแยกตามสาขา (override ราคากลาง)</Text>

          {/* Filter สาขา */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Ionicons name="business-outline" size={14} color={Colors.textSecondary} />
            <Text style={{ fontSize: 11, color: Colors.textSecondary }}>สาขา:</Text>
            <View style={{ width: 220 }}>
              <LookupCheckbox
                items={branches.map(b => ({ id: b.id, label: b.name }))}
                selectedIds={branchFilter}
                onChange={setBranchFilter}
                placeholder="ทุกสาขา"
                title="เลือกสาขา"
                columns={['ชื่อสาขา']}
              />
            </View>
          </View>

          {isMobile ? (
            <View style={{ gap: 10 }}>
              {branchPrices.map((rp, i) => (
                <View key={i} style={{ backgroundColor: '#fafafa', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e7e5e4' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#27272a' }}>{rp.productName}</Text>
                    <Badge label={rp.duration === 'permanent' ? 'ถาวร' : 'ชั่วคราว'} color={rp.duration === 'permanent' ? '#16a34a' : '#7c3aed'} />
                  </View>
                  <Text style={{ fontSize: 12, color: '#57534e', marginTop: 2 }}>{rp.productCode} · {rp.branchName}</Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: Colors.textSecondary, textDecorationLine: 'line-through' }}>฿{rp.originalPrice}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#f59e0b' }}>฿{rp.price}</Text>
                    <Text style={{ fontSize: 11, color: '#57534e' }}>มีผล {rp.effectiveDate}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 4 }}>{rp.docNo}</Text>
                </View>
              ))}
              {branchPrices.length === 0 && <Text style={s.empty}>{branchFilter.length === 0 ? 'ยังไม่มีราคาสาขาที่กำหนด' : 'ไม่มีราคาสำหรับสาขานี้'}</Text>}
            </View>
          ) : (
          <View style={s.table}>
            <View style={s.thead}>
              <Text style={[s.th, { flex: 0.7 }]}>สาขา</Text>
              <Text style={[s.th, { flex: 0.5 }]}>รหัส</Text>
              <Text style={[s.th, { flex: 1.2 }]}>สินค้า</Text>
              <Text style={[s.th, { flex: 0.6, textAlign: 'right' }]}>ราคาเก่า</Text>
              <Text style={[s.th, { flex: 0.6, textAlign: 'right' }]}>ราคาปัจจุบัน</Text>
              <Text style={[s.th, { flex: 0.7 }]}>วันที่เริ่มมีผล</Text>
              <Text style={[s.th, { flex: 0.9 }]}>เอกสาร</Text>
              <Text style={[s.th, { flex: 0.5 }]}>ประเภท</Text>
            </View>
            {branchPrices.map((rp, i) => (
              <View key={i} style={[s.tr, i % 2 === 1 && { backgroundColor: '#fafafa' }]}>
                <Text style={[s.td, { flex: 0.7, fontSize: 10 }]}>{rp.branchName}</Text>
                <Text style={[s.td, { flex: 0.5, fontSize: 10, color: Colors.textSecondary }]}>{rp.productCode}</Text>
                <Text style={[s.td, { flex: 1.2 }]}>{rp.productName}</Text>
                <Text style={[s.td, { flex: 0.6, textAlign: 'right', color: Colors.textSecondary }]}>฿{rp.originalPrice}</Text>
                <Text style={[s.td, { flex: 0.6, textAlign: 'right', fontWeight: '700', color: '#f59e0b' }]}>฿{rp.price}</Text>
                <Text style={[s.td, { flex: 0.7, fontSize: 10 }]}>{rp.effectiveDate}</Text>
                <Text style={[s.td, { flex: 0.9, fontSize: 10, color: Colors.textSecondary }]}>{rp.docNo}</Text>
                <View style={{ flex: 0.5 }}><Badge label={rp.duration === 'permanent' ? 'ถาวร' : 'ชั่วคราว'} color={rp.duration === 'permanent' ? '#16a34a' : '#7c3aed'} /></View>
              </View>
            ))}
            {branchPrices.length === 0 && <Text style={s.empty}>{branchFilter.length === 0 ? 'ยังไม่มีราคาสาขาที่กำหนด' : 'ไม่มีราคาสำหรับสาขานี้'}</Text>}
          </View>
          )}
        </View>
      )}
    </View>
  );
};

// ─── DocumentDetailWrapper (อ่าน doc จาก store ใหม่ทุกรอบ) ──────────────────
const DocumentDetailWrapper: React.FC<{ docId: string; onClose: () => void }> = ({ docId, onClose }) => {
  const { documents } = usePricingStore();
  const doc = documents.find(d => d.id === docId);
  if (!doc) return null;
  return <DocumentDetail doc={doc} onClose={onClose} />;
};

// ─── DocumentDetail (placeholder) ─────────────────────────────────────────────
const DocumentDetail: React.FC<{ doc: PricingDocument; onClose: () => void }> = ({ doc, onClose }) => {
  const { updateDocument } = usePricingStore();
  const { products } = useProductStore();
  const [search, setSearch] = useState('');
  const [alertDlg, setAlertDlg] = useState({ visible: false, title: '', message: '' });

  const availableProducts = useMemo(() => {
    const existingIds = new Set(doc.items.map(i => i.productId));
    let list = products.filter(p => !existingIds.has(p.id));
    if (search.trim()) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.code.includes(search));
    return list;
  }, [products, doc.items, search]);

  const addProduct = (p: any) => {
    const newItem = { productId: p.id, productCode: p.code, productName: p.name, unit: p.unit, costPrice: p.costPrice, originalPrice: p.salePrice, newPrice: p.salePrice };
    updateDocument(doc.id, { items: [...doc.items, newItem] });
  };

  const removeItem = (productId: string) => {
    updateDocument(doc.id, { items: doc.items.filter(i => i.productId !== productId) });
  };

  const updatePrice = (productId: string, newPrice: number) => {
    updateDocument(doc.id, { items: doc.items.map(i => i.productId === productId ? { ...i, newPrice } : i) });
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={onClose}>
          <Ionicons name="arrow-back" size={16} color={Palette.primary} />
          <Text style={{ fontSize: 12, color: Palette.primary, fontWeight: '600' }}>กลับรายการเอกสาร</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {doc.status === 'draft' && (
            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: '#f59e0b' }]} onPress={() => { setAlertDlg({ visible: true, title: 'บันทึก', message: 'บันทึกแล้ว (Draft)' }); }}>
              <Ionicons name="save-outline" size={14} color="#fafafa" />
              <Text style={s.primaryBtnText}>บันทึก</Text>
            </TouchableOpacity>
          )}
          {doc.status === 'draft' && (
            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: '#16a34a' }]} onPress={() => { updateDocument(doc.id, { status: 'active' }); onClose(); }}>
              <Ionicons name="checkmark-circle" size={14} color="#fafafa" />
              <Text style={s.primaryBtnText}>ยืนยัน</Text>
            </TouchableOpacity>
          )}
          {doc.status === 'active' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
              <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#16a34a' }}>ยืนยันแล้ว</Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={s.title}>{doc.name}</Text>
        <Badge label={doc.scope === 'central' ? 'กลาง' : doc.branchName || 'สาขา'} color={doc.scope === 'central' ? '#0ea5e9' : '#f59e0b'} />
        <Badge label={doc.duration === 'permanent' ? 'ถาวร' : 'ชั่วคราว'} color={doc.duration === 'permanent' ? '#16a34a' : '#7c3aed'} />
      </View>
      <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{doc.docNo} · มีผล {doc.effectiveDate}{doc.expiryDate ? ` ถึง ${doc.expiryDate}` : ''}</Text>

      {/* รายการสินค้าที่กำหนด */}
      <View style={s.card}>
        <Text style={s.cardTitle}>สินค้าที่กำหนดราคา ({doc.items.length} รายการ)</Text>
        {doc.items.length > 0 && (
          <View style={s.table}>
            <View style={s.thead}>
              <Text style={[s.th, { flex: 0.6 }]}>รหัส</Text>
              <Text style={[s.th, { flex: 1.5 }]}>ชื่อสินค้า</Text>
              <Text style={[s.th, { flex: 0.5 }]}>หน่วย</Text>
              <Text style={[s.th, { flex: 0.6, textAlign: 'right' }]}>ทุน</Text>
              <Text style={[s.th, { flex: 0.6, textAlign: 'right' }]}>ราคาเดิม</Text>
              <Text style={[s.th, { flex: 0.6, textAlign: 'right' }]}>ราคาใหม่</Text>
              <Text style={[s.th, { flex: 0.4 }]}></Text>
            </View>
            {doc.items.map((item, i) => (
              <View key={item.productId} style={[s.tr, i % 2 === 1 && { backgroundColor: '#fafafa' }]}>
                <Text style={[s.td, { flex: 0.6, fontSize: 10 }]}>{item.productCode}</Text>
                <Text style={[s.td, { flex: 1.5 }]}>{item.productName}</Text>
                <Text style={[s.td, { flex: 0.5, fontSize: 10 }]}>{item.unit}</Text>
                <Text style={[s.td, { flex: 0.6, textAlign: 'right', color: Colors.textSecondary }]}>฿{item.costPrice}</Text>
                <Text style={[s.td, { flex: 0.6, textAlign: 'right', color: Colors.textSecondary }]}>฿{item.originalPrice}</Text>
                <View style={{ flex: 0.6 }}>
                  <TextInput
                    style={{ fontSize: 12, fontWeight: '700', color: Palette.primary, textAlign: 'right', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 2, paddingHorizontal: 4 }}
                    value={String(item.newPrice)}
                    onChangeText={(text) => { const num = parseFloat(text) || 0; updatePrice(item.productId, num); }}
                    keyboardType="numeric"
                  />
                </View>
                <TouchableOpacity style={{ flex: 0.4, alignItems: 'center' }} onPress={() => removeItem(item.productId)}>
                  <Ionicons name="trash-outline" size={14} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* เพิ่มสินค้า — LookupCheckbox */}
      <View style={s.card}>
        <Text style={s.cardTitle}>เพิ่มสินค้า</Text>
        <LookupCheckbox
          items={availableProducts.map(p => ({ id: p.id, label: p.name, sub: p.code, extra: `฿${p.salePrice}` }))}
          selectedIds={[]}
          onChange={(ids) => { ids.forEach(id => { const p = availableProducts.find(x => x.id === id); if (p) addProduct(p); }); }}
          placeholder="เลือกสินค้าที่จะเพิ่ม..."
          title="เลือกสินค้า"
          columns={['ชื่อสินค้า', 'รหัส', 'ราคา']}
        />
      </View>

      <AlertDialog visible={alertDlg.visible} onClose={() => setAlertDlg({ visible: false, title: '', message: '' })} title={alertDlg.title} message={alertDlg.message} variant="info" />
    </View>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────
const Badge: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <View style={{ backgroundColor: color + '18', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 }}>
    <Text style={{ fontSize: 9, fontWeight: '600', color }}>{label}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, any> = {
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 17, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Palette.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8 },
  primaryBtnText: { fontSize: 12, fontWeight: '600', color: '#fafafa' },
  tabRow: { flexDirection: 'row', gap: 4, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 4 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: Palette.primary },
  tabText: { fontSize: 12, color: Colors.textSecondary },
  tabTextActive: { color: Palette.primary, fontWeight: '600' },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  pillActive: { backgroundColor: Palette.primary, borderColor: Palette.primary },
  pillText: { fontSize: 11, color: Colors.textSecondary },
  pillTextActive: { color: '#fafafa', fontWeight: '600' },
  card: { backgroundColor: '#fafafa', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  docCard: { backgroundColor: '#fafafa', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  iconBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  table: { borderRadius: 8, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  thead: { flexDirection: 'row', backgroundColor: Colors.background, paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  th: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  td: { fontSize: 11, color: Colors.text },
  empty: { padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { backgroundColor: '#fafafa', borderRadius: 14, width: '100%', maxWidth: 500, maxHeight: '88%', overflow: 'hidden' },
  modalMobile: { maxHeight: '92%', borderRadius: 12 },
  modalScroll: { flexShrink: 1 },
  modalBody: { padding: 24, paddingBottom: 8 },
  modalBodyMobile: { padding: 16, paddingBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: '#fafafa' },
  label: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 12, color: Colors.text },
};
