/**
 * WebPricingScreen — กำหนดราคาแบบเอกสาร (Enterprise)
 * Listing เอกสาร → New → เลือกโหมด/สาขา → เลือกสินค้า → ราคากลาง/เก่า/ใหม่
 * + Import/Export Excel + Template download
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { useProductStore } from '../../store/productStore';
import { useStoreConfigStore } from '../../store/storeConfigStore';
import { ProductMaster } from '../../types/product';

const BRANCHES = [
  { id: 'br1', name: 'สาขาหลัก' },
  { id: 'br2', name: 'สาขา 2 (ลาดพร้าว)' },
  { id: 'br3', name: 'สาขา Online' },
];

interface PricingDoc {
  id: string; docNo: string; date: string; mode: 'all' | 'branch';
  branchName?: string; itemCount: number; status: 'draft' | 'confirmed'; createdBy: string;
}
interface PricingLine {
  productId: string; code: string; name: string;
  centralPrice: number; oldPrice: number; newPrice: string;
}

const MOCK_DOCS: PricingDoc[] = [
  { id: 'd1', docNo: 'PRC-2567-0001', date: '15/06/2567', mode: 'all', itemCount: 5, status: 'confirmed', createdBy: 'สมชาย' },
  { id: 'd2', docNo: 'PRC-2567-0002', date: '20/06/2567', mode: 'branch', branchName: 'สาขา 2', itemCount: 3, status: 'confirmed', createdBy: 'สมหญิง' },
  { id: 'd3', docNo: 'PRC-2567-0003', date: '22/06/2567', mode: 'all', itemCount: 2, status: 'draft', createdBy: 'admin' },
];

export const WebPricingScreen: React.FC = () => {
  const { products } = useProductStore();
  const { storeType } = useStoreConfigStore();
  const [view, setView] = useState<'list' | 'new'>('list');
  const [listTab, setListTab] = useState<'current' | 'docs'>('current');
  const [filterBranch, setFilterBranch] = useState('all');
  const [docs, setDocs] = useState<PricingDoc[]>(MOCK_DOCS);

  // New doc state
  const [step, setStep] = useState<'mode' | 'products' | 'review'>('mode');
  const [mode, setMode] = useState<'all' | 'branch'>('all');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [lines, setLines] = useState<PricingLine[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const isEnterprise = storeType === 'ENTERPRISE';

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleNew = () => { setView('new'); setStep('mode'); setMode('all'); setSelectedBranch(''); setLines([]); setSelectedProducts(new Set()); };
  const handleBack = () => { setView('list'); };

  const handleSelectProducts = () => {
    const newLines: PricingLine[] = products
      .filter(p => selectedProducts.has(p.id))
      .map(p => ({ productId: p.id, code: p.code, name: p.name, centralPrice: p.salePrice, oldPrice: p.salePrice, newPrice: '' }));
    setLines(newLines);
    setStep('review');
  };

  const handleConfirm = () => {
    const newDoc: PricingDoc = {
      id: `d${Date.now()}`, docNo: `PRC-2567-${String(docs.length + 1).padStart(4, '0')}`,
      date: new Date().toLocaleDateString('th-TH'), mode, branchName: mode === 'branch' ? BRANCHES.find(b => b.id === selectedBranch)?.name : undefined,
      itemCount: lines.length, status: 'confirmed', createdBy: 'admin',
    };
    setDocs(prev => [newDoc, ...prev]);
    alert(`บันทึกเอกสาร ${newDoc.docNo} เรียบร้อย (${lines.length} รายการ)`);
    setView('list');
  };

  const handleExport = () => {
    const header = '\ufeffรหัสสินค้า,ชื่อสินค้า,ราคากลาง,ราคาปัจจุบัน\n';
    const rows = products.map(p => `${p.code},${p.name},${p.salePrice},${p.salePrice}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pricing_export.csv'; a.click();
  };

  const handleDownloadTemplate = () => {
    const content = '\ufeffรหัสสินค้า,ชื่อสินค้า,สาขา (ว่าง=ทุกสาขา),ราคาใหม่,หมายเหตุ\nP001,น้ำดื่มสิงห์ 600ml,,12,ปรับราคาใหม่\nP002,น้ำอัดลม Pepsi 325ml,,18,\nP003,ขนมปังกรอบ 7-11,สาขา 2 (ลาดพร้าว),28,ราคาเฉพาะสาขา\nP005,เลย์ รสออริจินัล,สาขาหลัก,22,\n';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pricing_import_template.csv'; a.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.csv,.xlsx,.xls';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        alert(`นำเข้าไฟล์ "${file.name}" สำเร็จ!\n(Demo: ระบบจะอ่านไฟล์และปรับราคาตามข้อมูลในไฟล์)`);
      }
    };
    input.click();
  };

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const updateNewPrice = (productId: string, val: string) => {
    setLines(prev => prev.map(l => l.productId === productId ? { ...l, newPrice: val } : l));
  };

  // ─── NEW DOCUMENT VIEW ────────────────────────────────────────────────────
  if (view === 'new') {
    return (
      <ScrollView style={s.root} contentContainerStyle={{ padding: 24, gap: 16 }}>
        <TouchableOpacity style={s.backBtn} onPress={handleBack}>
          <Ionicons name="arrow-back" size={16} color={WebColors.primary} />
          <Text style={s.backText}>กลับรายการเอกสาร</Text>
        </TouchableOpacity>
        <Text style={s.title}>สร้างเอกสารกำหนดราคาใหม่</Text>

        {/* Step indicator */}
        <View style={s.steps}>
          {['เลือกโหมด/สาขา', 'เลือกสินค้า', 'กำหนดราคา'].map((label, i) => {
            const stepIdx = ['mode', 'products', 'review'].indexOf(step);
            const isActive = i <= stepIdx;
            return (
              <View key={i} style={s.stepItem}>
                <View style={[s.stepCircle, isActive && s.stepCircleActive]}><Text style={[s.stepNum, isActive && { color: '#fff' }]}>{i + 1}</Text></View>
                <Text style={[s.stepLabel, isActive && { color: WebColors.primary }]}>{label}</Text>
              </View>
            );
          })}
        </View>

        {/* Step 1: Mode */}
        {step === 'mode' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>เลือกโหมดกำหนดราคา</Text>
            <View style={s.modeRow}>
              <TouchableOpacity style={[s.modeBtn, mode === 'all' && s.modeBtnActive]} onPress={() => setMode('all')}>
                <Ionicons name="globe-outline" size={24} color={mode === 'all' ? '#fff' : '#64748B'} />
                <Text style={[s.modeBtnTitle, mode === 'all' && { color: '#fff' }]}>ทุกสาขาราคาเดียวกัน</Text>
                <Text style={[s.modeBtnSub, mode === 'all' && { color: 'rgba(255,255,255,0.8)' }]}>ปรับราคากลางใช้ทุกสาขา</Text>
              </TouchableOpacity>
              {isEnterprise && (
              <TouchableOpacity style={[s.modeBtn, mode === 'branch' && s.modeBtnActive]} onPress={() => setMode('branch')}>
                <Ionicons name="git-branch-outline" size={24} color={mode === 'branch' ? '#fff' : '#64748B'} />
                <Text style={[s.modeBtnTitle, mode === 'branch' && { color: '#fff' }]}>เฉพาะสาขา</Text>
                <Text style={[s.modeBtnSub, mode === 'branch' && { color: 'rgba(255,255,255,0.8)' }]}>กำหนดราคาแยกตามสาขา</Text>
              </TouchableOpacity>
              )}
            </View>

            {mode === 'branch' && (
              <View style={{ marginTop: 16 }}>
                <Text style={s.fieldLabel}>เลือกสาขา <Text style={{ color: '#EF4444' }}>*</Text></Text>
                <View style={s.branchGrid}>
                  {BRANCHES.map(br => (
                    <TouchableOpacity key={br.id} style={[s.branchChip, selectedBranch === br.id && s.branchChipActive]} onPress={() => setSelectedBranch(br.id)}>
                      <Ionicons name="business" size={14} color={selectedBranch === br.id ? '#fff' : '#64748B'} />
                      <Text style={[s.branchChipText, selectedBranch === br.id && { color: '#fff' }]}>{br.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity style={[s.nextBtn, (mode === 'branch' && !selectedBranch) && { opacity: 0.4 }]}
              disabled={mode === 'branch' && !selectedBranch}
              onPress={() => setStep('products')}>
              <Text style={s.nextBtnText}>ถัดไป — เลือกสินค้า</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Select Products */}
        {step === 'products' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>เลือกสินค้าที่ต้องการกำหนดราคา</Text>
            {mode === 'branch' && <Text style={s.branchLabel}>สาขา: {BRANCHES.find(b => b.id === selectedBranch)?.name}</Text>}
            <View style={s.searchRow}>
              <Ionicons name="search" size={15} color="#94A3B8" />
              <TextInput style={s.searchInput} placeholder="ค้นหาสินค้า..." value={productSearch} onChangeText={setProductSearch} placeholderTextColor="#94A3B8" />
              <Text style={s.selectedCount}>{selectedProducts.size} รายการ</Text>
            </View>
            <View style={s.productList}>
              {products.filter(p => !productSearch || `${p.name} ${p.code}`.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                <TouchableOpacity key={p.id} style={[s.productRow, selectedProducts.has(p.id) && s.productRowSelected]} onPress={() => toggleProduct(p.id)}>
                  <View style={[s.checkbox, selectedProducts.has(p.id) && s.checkboxChecked]}>
                    {selectedProducts.has(p.id) && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={s.prodCode}>{p.code}</Text>
                  <Text style={s.prodName}>{p.name}</Text>
                  <Text style={s.prodPrice}>฿{p.salePrice.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.stepFooter}>
              <TouchableOpacity onPress={() => setStep('mode')}><Text style={s.linkBtn}>← ย้อนกลับ</Text></TouchableOpacity>
              <TouchableOpacity style={[s.nextBtn, selectedProducts.size === 0 && { opacity: 0.4 }]} disabled={selectedProducts.size === 0} onPress={handleSelectProducts}>
                <Text style={s.nextBtnText}>ถัดไป — กำหนดราคา ({selectedProducts.size})</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Review & Set Prices */}
        {step === 'review' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>กำหนดราคาใหม่</Text>
            {mode === 'branch' && <Text style={s.branchLabel}>สาขา: {BRANCHES.find(b => b.id === selectedBranch)?.name}</Text>}
            <View style={s.table}>
              <View style={s.thead}>
                <Text style={[s.th, { flex: 0.7 }]}>รหัส</Text>
                <Text style={[s.th, { flex: 2 }]}>ชื่อสินค้า</Text>
                <Text style={[s.th, { flex: 1 }]}>ราคากลาง</Text>
                <Text style={[s.th, { flex: 1 }]}>ราคาเก่า</Text>
                <Text style={[s.th, { flex: 1.2 }]}>ราคาใหม่</Text>
                <Text style={[s.th, { flex: 0.8 }]}>ผลต่าง</Text>
              </View>
              {lines.map((l, i) => {
                const diff = l.newPrice ? parseFloat(l.newPrice) - l.oldPrice : 0;
                return (
                  <View key={l.productId} style={[s.tr, i % 2 === 1 && s.trAlt]}>
                    <Text style={[s.td, { flex: 0.7, fontWeight: '600' }]}>{l.code}</Text>
                    <Text style={[s.td, { flex: 2 }]}>{l.name}</Text>
                    <Text style={[s.td, { flex: 1, color: '#64748B' }]}>฿{l.centralPrice.toLocaleString()}</Text>
                    <Text style={[s.td, { flex: 1 }]}>฿{l.oldPrice.toLocaleString()}</Text>
                    <View style={{ flex: 1.2 }}>
                      <TextInput style={s.priceInput} value={l.newPrice} onChangeText={v => updateNewPrice(l.productId, v)} placeholder={String(l.oldPrice)} placeholderTextColor="#CBD5E1" keyboardType="decimal-pad" />
                    </View>
                    <Text style={[s.td, { flex: 0.8, fontWeight: '700', color: diff > 0 ? '#16A34A' : diff < 0 ? '#EF4444' : '#94A3B8' }]}>
                      {l.newPrice ? (diff > 0 ? '+' : '') + diff.toFixed(0) : '—'}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={s.stepFooter}>
              <TouchableOpacity onPress={() => setStep('products')}><Text style={s.linkBtn}>← ย้อนกลับ</Text></TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={s.confirmBtnText}>ยืนยันเอกสาร</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    );
  }

  // ─── LISTING VIEW ─────────────────────────────────────────────────────────
  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text style={s.title}>กำหนดราคาสินค้า</Text>
      <Text style={s.subtitle}>ราคาเริ่มต้นกำหนดตอนสร้างสินค้า — เปลี่ยนราคาทีหลังใช้เอกสารกำหนดราคา</Text>

      {/* Tabs */}
      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tabBtn, listTab === 'current' && s.tabBtnActive]} onPress={() => setListTab('current')}>
          <Ionicons name="pricetags-outline" size={14} color={listTab === 'current' ? '#fff' : '#64748B'} />
          <Text style={[s.tabBtnText, listTab === 'current' && { color: '#fff' }]}>ราคาปัจจุบัน</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, listTab === 'docs' && s.tabBtnActive]} onPress={() => setListTab('docs')}>
          <Ionicons name="document-text-outline" size={14} color={listTab === 'docs' ? '#fff' : '#64748B'} />
          <Text style={[s.tabBtnText, listTab === 'docs' && { color: '#fff' }]}>เอกสารกำหนดราคา ({docs.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Tab: ราคาปัจจุบัน */}
      {listTab === 'current' && (
        <>
          {/* Filter สาขา (Enterprise) */}
          {isEnterprise && (
            <View style={s.branchFilterRow}>
              <Ionicons name="business-outline" size={14} color="#64748B" />
              <Text style={{ fontSize: 15, color: '#64748B', marginRight: 8 }}>สาขา:</Text>
              {[{ id: 'all', name: 'ทุกสาขา' }, ...BRANCHES].map(br => (
                <TouchableOpacity key={br.id} style={[s.branchFilterChip, filterBranch === br.id && s.branchFilterChipActive]} onPress={() => setFilterBranch(br.id)}>
                  <Text style={[s.branchFilterText, filterBranch === br.id && { color: '#fff' }]}>{br.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={s.searchRow}>
            <Ionicons name="search" size={15} color="#94A3B8" />
            <TextInput style={s.searchInput} placeholder="ค้นหาสินค้า..." value={productSearch} onChangeText={setProductSearch} placeholderTextColor="#94A3B8" />
            <Text style={{ fontSize: 15, color: '#64748B' }}>{products.length} รายการ</Text>
          </View>
          <View style={s.table}>
            <View style={s.thead}>
              {['#', 'รหัส', 'ชื่อสินค้า', 'หมวด', 'หน่วย', 'ราคาทุน', 'ราคาขาย', 'VAT', 'ประเภท'].map((h, i) => (
                <Text key={i} style={[s.th, i === 2 && { flex: 2 }]}>{h}</Text>
              ))}
            </View>
            {products
              .filter(p => !productSearch || `${p.name} ${p.code}`.toLowerCase().includes(productSearch.toLowerCase()))
              .map((p, i) => (
              <View key={p.id} style={[s.tr, i % 2 === 1 && s.trAlt]}>
                <Text style={s.td}>{i + 1}</Text>
                <Text style={[s.td, { fontWeight: '600' }]}>{p.code}</Text>
                <Text style={[s.td, { flex: 2 }]}>{p.name}</Text>
                <Text style={s.td}>{p.categoryName || '—'}</Text>
                <Text style={s.td}>{p.unit}</Text>
                <Text style={[s.td, { color: '#64748B' }]}>฿{p.costPrice.toLocaleString()}</Text>
                <Text style={[s.td, { fontWeight: '700', color: WebColors.primary }]}>฿{p.salePrice.toLocaleString()}</Text>
                <Text style={s.td}>{p.vatRate}%</Text>
                <View style={s.td}>
                  <View style={[s.badge, { backgroundColor: p.productType === 'service' ? '#EDE9FE' : '#E0F2FE' }]}>
                    <Text style={[s.badgeText, { color: p.productType === 'service' ? '#7C3AED' : '#0369A1' }]}>{p.productType === 'service' ? 'บริการ' : 'สินค้า'}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
          <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#64748B" />
            <Text style={s.infoText}>ราคาเริ่มต้นกำหนดตอนสร้างสินค้า (สินค้า → เพิ่มสินค้า) · ต้องการเปลี่ยนราคาหลายรายการ → ใช้แท็บ "เอกสารกำหนดราคา"</Text>
          </View>
        </>
      )}

      {/* Tab: เอกสารกำหนดราคา */}
      {listTab === 'docs' && (
        <>
          {/* Action Buttons */}
          <View style={s.actionRow}>
            <TouchableOpacity style={s.primaryBtn} onPress={handleNew}>
              <Ionicons name="add-circle" size={16} color="#fff" />
              <Text style={s.primaryBtnText}>สร้างเอกสารใหม่</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.outlineBtn} onPress={handleImport}>
              <Ionicons name="cloud-upload-outline" size={16} color={WebColors.primary} />
              <Text style={s.outlineBtnText}>Import Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.outlineBtn} onPress={handleExport}>
              <Ionicons name="cloud-download-outline" size={16} color={WebColors.primary} />
              <Text style={s.outlineBtnText}>Export Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn} onPress={handleDownloadTemplate}>
              <Ionicons name="document-outline" size={14} color="#64748B" />
              <Text style={s.ghostBtnText}>Download Template</Text>
            </TouchableOpacity>
          </View>

          {/* Document Table */}
          <View style={s.table}>
            <View style={s.thead}>
              {['เลขที่เอกสาร', 'วันที่', 'โหมด', 'สาขา', 'จำนวนสินค้า', 'สถานะ', 'สร้างโดย'].map((h, i) => (
                <Text key={i} style={[s.th, i === 0 && { flex: 1.3 }]}>{h}</Text>
              ))}
            </View>
            {docs.map((d, i) => (
              <View key={d.id} style={[s.tr, i % 2 === 1 && s.trAlt]}>
                <Text style={[s.td, { flex: 1.3, fontWeight: '700', color: WebColors.primary }]}>{d.docNo}</Text>
                <Text style={s.td}>{d.date}</Text>
                <View style={s.td}>
                  <View style={[s.badge, { backgroundColor: d.mode === 'all' ? '#E0F2FE' : '#FEF3C7' }]}>
                    <Text style={[s.badgeText, { color: d.mode === 'all' ? '#0369A1' : '#92400E' }]}>{d.mode === 'all' ? 'ทุกสาขา' : 'เฉพาะสาขา'}</Text>
                  </View>
                </View>
                <Text style={s.td}>{d.branchName || 'ทั้งหมด'}</Text>
                <Text style={s.td}>{d.itemCount} รายการ</Text>
                <View style={s.td}>
                  <View style={[s.badge, { backgroundColor: d.status === 'confirmed' ? '#DCFCE7' : '#F1F5F9' }]}>
                    <Text style={[s.badgeText, { color: d.status === 'confirmed' ? '#16A34A' : '#64748B' }]}>{d.status === 'confirmed' ? 'ยืนยัน' : 'แบบร่าง'}</Text>
                  </View>
                </View>
                <Text style={s.td}>{d.createdBy}</Text>
              </View>
            ))}
            {docs.length === 0 && <Text style={s.empty}>ยังไม่มีเอกสาร</Text>}
          </View>

          <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#64748B" />
            <Text style={s.infoText}>Import: รองรับไฟล์ .csv / .xlsx — ดาวน์โหลด Template เพื่อดูรูปแบบข้อมูลที่ถูกต้อง (รหัสสินค้า, ชื่อ, สาขา, ราคาใหม่)</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  title: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 13, color: '#64748B' },
  // Notice
  notice: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FEF3C7', borderRadius: 10, padding: 20, margin: 24 },
  noticeTitle: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  noticeSub: { fontSize: 15, color: '#A16207', marginTop: 4 },
  // Back
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  backText: { fontSize: 13, color: WebColors.primary, fontWeight: '600' },
  // Actions
  actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WebColors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1.5, borderColor: WebColors.primary },
  outlineBtnText: { fontSize: 15, fontWeight: '600', color: WebColors.primary },
  ghostBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 9 },
  ghostBtnText: { fontSize: 15, color: '#64748B', textDecorationLine: 'underline' },
  // Table
  table: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  thead: { flexDirection: 'row', backgroundColor: '#F8FAFC', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  th: { flex: 1, fontSize: 15, fontWeight: '700', color: '#64748B' },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  trAlt: { backgroundColor: '#FAFBFC' },
  td: { flex: 1, fontSize: 15, color: '#334155' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 14, fontWeight: '700' },
  empty: { padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 },
  // Steps
  steps: { flexDirection: 'row', gap: 20, marginBottom: 8 },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { backgroundColor: WebColors.primary },
  stepNum: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  stepLabel: { fontSize: 14, color: '#94A3B8' },
  // Card
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  // Mode
  modeRow: { flexDirection: 'row', gap: 12 },
  modeBtn: { flex: 1, alignItems: 'center', gap: 8, padding: 20, borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#E2E8F0' },
  modeBtnActive: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  modeBtnTitle: { fontSize: 13, fontWeight: '700', color: '#334155' },
  modeBtnSub: { fontSize: 15, color: '#94A3B8', textAlign: 'center' },
  // Branch
  fieldLabel: { fontSize: 15, fontWeight: '600', color: '#475569', marginBottom: 6 },
  branchGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  branchChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  branchChipActive: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  branchChipText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  branchLabel: { fontSize: 15, color: '#7C3AED', fontWeight: '600', marginBottom: 4 },
  // Product selection
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', borderRadius: 8, paddingHorizontal: 12, height: 38, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, fontSize: 13, color: '#334155' },
  selectedCount: { fontSize: 15, color: WebColors.primary, fontWeight: '700' },
  // Tabs
  tabRow: { flexDirection: 'row', gap: 4 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F1F5F9' },
  tabBtnActive: { backgroundColor: WebColors.primary },
  tabBtnText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  // Branch filter
  branchFilterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  branchFilterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  branchFilterChipActive: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  branchFilterText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  productList: { maxHeight: 300, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, overflow: 'hidden' },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  productRowSelected: { backgroundColor: '#EFF6FF' },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  prodCode: { fontSize: 15, color: '#64748B', width: 50 },
  prodName: { flex: 1, fontSize: 15, color: '#1E293B' },
  prodPrice: { fontSize: 15, fontWeight: '600', color: '#475569' },
  // Price input
  priceInput: { height: 30, borderWidth: 1.5, borderColor: WebColors.primary, borderRadius: 6, paddingHorizontal: 8, fontSize: 13, color: WebColors.primary, fontWeight: '700', backgroundColor: '#FEF2F2' },
  // Footer
  stepFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  linkBtn: { fontSize: 15, color: WebColors.primary, fontWeight: '600' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WebColors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#16A34A', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  // Info
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#F1F5F9', borderRadius: 8, padding: 12 },
  infoText: { fontSize: 15, color: '#64748B', flex: 1 },
});
