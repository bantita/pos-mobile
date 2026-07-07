import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { useProductStore } from '@/features/product/application/stores/productStore';
import { useStoreConfigStore } from '@/features/settings/application/stores/storeConfigStore';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';

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

export const PricingScreen: React.FC = () => {
  const { products } = useProductStore();
  const { storeType } = useStoreConfigStore();
  const [view, setView] = useState<'list' | 'new'>('list');
  const [listTab, setListTab] = useState<'current' | 'docs'>('current');
  const [filterBranch, setFilterBranch] = useState('all');
  const [docs, setDocs] = useState<PricingDoc[]>(MOCK_DOCS);
  const [step, setStep] = useState<'mode' | 'products' | 'review'>('mode');
  const [mode, setMode] = useState<'all' | 'branch'>('all');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [lines, setLines] = useState<PricingLine[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const isEnterprise = storeType === 'ENTERPRISE';

  const handleNew = () => { setView('new'); setStep('mode'); setMode('all'); setSelectedBranch(''); setLines([]); setSelectedProducts(new Set()); };
  const handleBack = () => { setView('list'); };

  const handleSelectProducts = () => {
    const newLines: PricingLine[] = products.filter(p => selectedProducts.has(p.id)).map(p => ({
      productId: p.id, code: p.code, name: p.name, centralPrice: p.salePrice, oldPrice: p.salePrice, newPrice: '',
    }));
    setLines(newLines);
    setStep('review');
  };

  const handleConfirm = () => {
    const newDoc: PricingDoc = {
      id: `d${Date.now()}`, docNo: `PRC-2567-${String(docs.length + 1).padStart(4, '0')}`,
      date: new Date().toLocaleDateString('th-TH'), mode,
      branchName: mode === 'branch' ? BRANCHES.find(b => b.id === selectedBranch)?.name : undefined,
      itemCount: lines.length, status: 'confirmed', createdBy: 'admin',
    };
    setDocs(prev => [newDoc, ...prev]);
    setAlertMsg(`บันทึกราคา ${newDoc.docNo} เรียบร้อย (${lines.length} รายการ)`);
    setView('list');
  };

  const handleExport = () => {
    const header = '\ufeffรหัสสินค้า,ชื่อสินค้า,ราคาปัจจุบัน,ราคากลาง\n';
    const rows = products.map(p => `${p.code},${p.name},${p.salePrice},${p.salePrice}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pricing_export.csv'; a.click();
  };

  const handleDownloadTemplate = () => {
    const content = '\ufeffรหัสสินค้า,ชื่อสินค้า,สาขา (ปล่อยว่าง=ทั้งหมด),ราคาใหม่,หมายเหตุ\nP001,น้ำดื่มสิงห์ 600ml,,12,ปรับตามต้นทุน\nP002,น้ำอัดลม Pepsi 325ml,,18,\nP003,ขนมปังกรอบ 7-11,สาขา 2 (ลาดพร้าว),28,โปรโมชั่น\nP005,เลย์ รสออริจินัล,สาขาหลัก,22,\n';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pricing_import_template.csv'; a.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.csv,.xlsx,.xls';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) setAlertMsg(`นำเข้าไฟล์ "${file.name}" สำเร็จ! (Demo: จะอ่านข้อมูลจากไฟล์และแสดงตัวอย่าง)`);
    };
    input.click();
  };

  const toggleProduct = (id: string) => setSelectedProducts(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const updateNewPrice = (productId: string, val: string) => setLines(prev => prev.map(l =>
    l.productId === productId ? { ...l, newPrice: val } : l
  ));

  const TableH: React.FC<{ cols: { label: string; flex?: number }[] }> = ({ cols }) => (
    <View className={cn('flex-row bg-rose-50 py-2.5 px-3 border-b border-slate-200')}>
      {cols.map((c, i) => <Text key={i} className={cn('text-sm font-bold text-slate-500')} style={{ flex: c.flex ?? 1 }}>{c.label}</Text>)}
    </View>
  );

  if (view === 'new') {
    return (
      <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerStyle={{ padding: 24, gap: 16 }}>
        <TouchableOpacity className={cn('flex-row items-center gap-1.5 mb-1')} onPress={handleBack}>
          <Ionicons name="arrow-back" size={16} color="#e11d48" />
          <Text className={cn('text-sm font-bold text-rose-600')}>กลับหน้าราคาปัจจุบัน</Text>
        </TouchableOpacity>
        <Text className={cn('text-lg font-extrabold text-slate-800')}>สร้างเอกสารราคาใหม่</Text>

        <View className={cn('flex-row gap-5 mb-2')}>
          {['เลือกรูปแบบ/สาขา', 'เลือกสินค้า', 'ยืนยันราคา'].map((label, i) => {
            const stepIdx = ['mode', 'products', 'review'].indexOf(step);
            const isActive = i <= stepIdx;
            return (
              <View key={i} className={cn('items-center gap-1')}>
                <View className={cn('w-7 h-7 rounded-full items-center justify-center shadow-sm')}
                  style={{ backgroundColor: isActive ? '#e11d48' : '#e2e8f0' }}>
                  <Text className={cn('text-sm font-bold')} style={{ color: isActive ? '#fafafa' : '#64748b' }}>{i + 1}</Text>
                </View>
                <Text className={cn('text-sm font-semibold')} style={{ color: isActive ? '#e11d48' : '#94a3b8' }}>{label}</Text>
              </View>
            );
          })}
        </View>

        {step === 'mode' && (
          <View className={cn('bg-white rounded-2xl p-5 border border-slate-200 shadow-sm gap-3')}>
            <Text className={cn('text-sm font-bold text-slate-800')}>เลือกรูปแบบการปรับราคา</Text>
            <View className={cn('flex-row gap-3')}>
              <TouchableOpacity
                className={cn('flex-1 items-center gap-2 p-5 rounded-2xl border-[1.5] shadow-sm')}
                style={{ backgroundColor: mode === 'all' ? '#e11d48' : '#f1f5f9', borderColor: mode === 'all' ? '#e11d48' : '#e2e8f0' }}
                onPress={() => setMode('all')}>
                <Ionicons name="globe-outline" size={24} color={mode === 'all' ? '#fafafa' : '#64748b'} />
                <Text className={cn('text-sm font-bold')} style={{ color: mode === 'all' ? '#fafafa' : '#334155' }}>ราคากลางทุกสาขา</Text>
                <Text className={cn('text-sm font-medium text-center')}
                  style={{ color: mode === 'all' ? 'rgba(255,255,255,0.8)' : '#94a3b8' }}>ใช้ราคาเดียวกันทุกสาขา</Text>
              </TouchableOpacity>
              {isEnterprise && (
                <TouchableOpacity
                  className={cn('flex-1 items-center gap-2 p-5 rounded-2xl border-[1.5] shadow-sm')}
                  style={{ backgroundColor: mode === 'branch' ? '#e11d48' : '#f1f5f9', borderColor: mode === 'branch' ? '#e11d48' : '#e2e8f0' }}
                  onPress={() => setMode('branch')}>
                  <Ionicons name="git-branch-outline" size={24} color={mode === 'branch' ? '#fafafa' : '#64748b'} />
                  <Text className={cn('text-sm font-bold')} style={{ color: mode === 'branch' ? '#fafafa' : '#334155' }}>ราคาสาขา</Text>
                  <Text className={cn('text-sm font-medium text-center')}
                    style={{ color: mode === 'branch' ? 'rgba(255,255,255,0.8)' : '#94a3b8' }}>ปรับราคาเฉพาะบางสาขา</Text>
                </TouchableOpacity>
              )}
            </View>
            {mode === 'branch' && (
              <View className={cn('mt-4')}>
                <Text className={cn('text-sm font-bold text-slate-600 mb-1.5')}>เลือกสาขา <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <View className={cn('flex-row gap-2 flex-wrap')}>
                  {BRANCHES.map(br => (
                    <TouchableOpacity
                      key={br.id}
                      className={cn('flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-xl shadow-sm')}
                      style={{
                        backgroundColor: selectedBranch === br.id ? '#e11d48' : '#f1f5f9',
                        borderWidth: 1,
                        borderColor: selectedBranch === br.id ? '#e11d48' : '#e2e8f0',
                      }}
                      onPress={() => setSelectedBranch(br.id)}>
                      <Ionicons name="business" size={14} color={selectedBranch === br.id ? '#fafafa' : '#64748b'} />
                      <Text className={cn('text-sm font-bold')}
                        style={{ color: selectedBranch === br.id ? '#fafafa' : '#64748b' }}>{br.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <TouchableOpacity
              className={cn('flex-row items-center gap-1.5 bg-rose-500 rounded-xl px-4 py-2.5 self-start shadow-sm')}
              style={{ opacity: mode === 'branch' && !selectedBranch ? 0.4 : 1 }}
              disabled={mode === 'branch' && !selectedBranch}
              onPress={() => setStep('products')}>
              <Text className={cn('text-sm font-bold text-white')}>ถัดไป - เลือกสินค้า</Text>
              <Ionicons name="arrow-forward" size={16} color="#fafafa" />
            </TouchableOpacity>
          </View>
        )}

        {step === 'products' && (
          <View className={cn('bg-white rounded-2xl p-5 border border-slate-200 shadow-sm gap-3')}>
            <Text className={cn('text-sm font-bold text-slate-800')}>เลือกสินค้าที่ต้องการปรับราคา</Text>
            {mode === 'branch' && <Text className={cn('text-sm font-bold text-violet-600 mb-1')}>สาขา: {BRANCHES.find(b => b.id === selectedBranch)?.name}</Text>}

            <View className={cn('flex-row items-center gap-2 bg-rose-50 rounded-xl px-3 h-[38px] border border-slate-200')}>
              <Ionicons name="search" size={15} color="#94a3b8" />
              <TextInput className={cn('flex-1 text-sm font-medium text-slate-700')}
                placeholder="ค้นหาสินค้า..." value={productSearch} onChangeText={setProductSearch} placeholderTextColor="#94a3b8" />
              <Text className={cn('text-sm font-bold text-rose-600')}>{selectedProducts.size} รายการ</Text>
            </View>

            <View className={cn('max-h-[300px] border border-slate-200 rounded-xl overflow-hidden')}>
              {products.filter(p => !productSearch || `${p.name} ${p.code}`.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                <TouchableOpacity
                  key={p.id}
                  className={cn('flex-row items-center gap-2.5 py-2 px-3 border-b border-slate-100')}
                  style={selectedProducts.has(p.id) ? { backgroundColor: '#fdf2f8' } : {}}
                  onPress={() => toggleProduct(p.id)}>
                  <View className={cn('w-[18px] h-[18px] rounded border-[1.5] border-slate-300 items-center justify-center')}
                    style={selectedProducts.has(p.id) ? { backgroundColor: '#e11d48', borderColor: '#e11d48' } : {}}>
                    {selectedProducts.has(p.id) && <Ionicons name="checkmark" size={12} color="#fafafa" />}
                  </View>
                  <Text className={cn('text-sm font-medium text-slate-500 w-[50px]')}>{p.code}</Text>
                  <Text className={cn('text-sm font-medium text-slate-800 flex-1')}>{p.name}</Text>
                  <Text className={cn('text-sm font-bold text-slate-600')}>฿{p.salePrice.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className={cn('flex-row items-center justify-between mt-2')}>
              <TouchableOpacity onPress={() => setStep('mode')}><Text className={cn('text-sm font-bold text-rose-600')}>← ย้อนกลับ</Text></TouchableOpacity>
              <TouchableOpacity
                className={cn('flex-row items-center gap-1.5 bg-rose-500 rounded-xl px-4 py-2.5 shadow-sm')}
                style={{ opacity: selectedProducts.size === 0 ? 0.4 : 1 }}
                disabled={selectedProducts.size === 0}
                onPress={handleSelectProducts}>
                <Text className={cn('text-sm font-bold text-white')}>ถัดไป - ยืนยัน ({selectedProducts.size})</Text>
                <Ionicons name="arrow-forward" size={16} color="#fafafa" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'review' && (
          <View className={cn('bg-white rounded-2xl p-5 border border-slate-200 shadow-sm gap-3')}>
            <Text className={cn('text-sm font-bold text-slate-800')}>ยืนยันราคา</Text>
            {mode === 'branch' && <Text className={cn('text-sm font-bold text-violet-600 mb-1')}>สาขา: {BRANCHES.find(b => b.id === selectedBranch)?.name}</Text>}

            <View className={cn('bg-white rounded-2xl border border-slate-200 overflow-hidden')}>
              <View className={cn('flex-row bg-rose-50 py-2.5 px-3 border-b border-slate-200')}>
                {['รหัส', 'ชื่อสินค้า', 'ราคากลาง', 'ราคาเดิม', 'ราคาใหม่', 'ต่าง'].map((h, i) => (
                  <Text key={h} className={cn('text-sm font-bold text-slate-500 flex-[1]')}
                    style={i === 1 ? { flex: 2 } : i === 4 ? { flex: 1.2 } : {}}>{h}</Text>
                ))}
              </View>
              {lines.map((l, i) => {
                const diff = l.newPrice ? parseFloat(l.newPrice) - l.oldPrice : 0;
                return (
                  <View key={l.productId} className={cn('flex-row px-3 py-2 border-b border-slate-100 items-center')}
                    style={i % 2 === 1 ? { backgroundColor: '#fdf2f8' } : {}}>
                    <Text className={cn('text-sm font-semibold text-slate-700 flex-[1]')}>{l.code}</Text>
                    <Text className={cn('text-sm font-medium text-slate-700 flex-[2]')}>{l.name}</Text>
                    <Text className={cn('text-sm font-medium flex-[1]')} style={{ color: '#64748b' }}>฿{l.centralPrice.toLocaleString()}</Text>
                    <Text className={cn('text-sm font-medium text-slate-700 flex-[1]')}>฿{l.oldPrice.toLocaleString()}</Text>
                    <View className={cn('flex-[1.2]')}>
                      <TextInput
                        className={cn('h-9 border-[1.5] border-rose-500 rounded-xl px-3 text-sm font-bold bg-[#f6f7fb]')}
                        style={{ color: '#e11d48' }}
                        value={l.newPrice}
                        onChangeText={v => updateNewPrice(l.productId, v)}
                        placeholder={String(l.oldPrice)}
                        placeholderTextColor="#cbd5e1"
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <Text className={cn('text-sm font-bold flex-[0.8]')}
                      style={{ color: diff > 0 ? '#16a34a' : diff < 0 ? '#ef4444' : '#94a3b8' }}>
                      {l.newPrice ? (diff > 0 ? '+' : '') + diff.toFixed(0) : '-'}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View className={cn('flex-row items-center justify-between mt-2')}>
              <TouchableOpacity onPress={() => setStep('products')}><Text className={cn('text-sm font-bold text-rose-600')}>← ย้อนกลับ</Text></TouchableOpacity>
              <TouchableOpacity className={cn('flex-row items-center gap-1.5 bg-rose-500 rounded-xl px-4 py-2.5 shadow-sm')} onPress={handleConfirm}>
                <Ionicons name="checkmark-circle" size={16} color="#fafafa" />
                <Text className={cn('text-sm font-bold text-white')}>บันทึกราคา</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <AlertDialog visible={!!alertMsg} onClose={() => setAlertMsg(null)}
          title="สำเร็จ" message={alertMsg || ''} variant="success" />
      </ScrollView>
    );
  }

  return (
    <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerStyle={{ padding: 24, gap: 16 }}>
      <View className={cn('flex-row items-center justify-between bg-rose-600 rounded-2xl px-5 py-4 shadow-lg shadow-rose-500/40')}>
        <View>
          <Text className={cn('text-lg font-extrabold text-white')}>จัดการราคาสินค้า</Text>
          <Text className={cn('text-sm font-medium text-white/80')}>กำหนดราขาย - ราคากลาง/ราคาสาขา - Import/Export</Text>
        </View>
      </View>

      <View className={cn('flex-row gap-1')}>
        <TouchableOpacity
          className={cn('flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl shadow-sm')}
          style={{ backgroundColor: listTab === 'current' ? '#e11d48' : '#f1f5f9' }}
          onPress={() => setListTab('current')}>
          <Ionicons name="pricetags-outline" size={14} color={listTab === 'current' ? '#fafafa' : '#64748b'} />
          <Text className={cn('text-sm font-bold')} style={{ color: listTab === 'current' ? '#fafafa' : '#64748b' }}>ราคาปัจจุบัน</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={cn('flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl shadow-sm')}
          style={{ backgroundColor: listTab === 'docs' ? '#e11d48' : '#f1f5f9' }}
          onPress={() => setListTab('docs')}>
          <Ionicons name="document-text-outline" size={14} color={listTab === 'docs' ? '#fafafa' : '#64748b'} />
          <Text className={cn('text-sm font-bold')} style={{ color: listTab === 'docs' ? '#fafafa' : '#64748b' }}>เอกสารราคา ({docs.length})</Text>
        </TouchableOpacity>
      </View>

      {listTab === 'current' && (
        <>
          {isEnterprise && (
            <View className={cn('flex-row items-center gap-1.5 flex-wrap')}>
              <Ionicons name="business-outline" size={14} color="#64748b" />
              <Text className={cn('text-sm font-medium text-slate-500 mr-2')}>สาขา:</Text>
              {[{ id: 'all', name: 'ทุกสาขา' }, ...BRANCHES].map(br => (
                <TouchableOpacity
                  key={br.id}
                  className={cn('px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm')}
                  style={{ backgroundColor: filterBranch === br.id ? '#e11d48' : '#f1f5f9', borderColor: filterBranch === br.id ? '#e11d48' : '#e2e8f0' }}
                  onPress={() => setFilterBranch(br.id)}>
                  <Text className={cn('text-sm font-bold')} style={{ color: filterBranch === br.id ? '#fafafa' : '#64748b' }}>{br.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View className={cn('flex-row items-center gap-2 bg-white rounded-xl px-3 h-[38px] border border-slate-200 shadow-sm')}>
            <Ionicons name="search" size={15} color="#94a3b8" />
            <TextInput className={cn('flex-1 text-sm font-medium text-slate-700')}
              placeholder="ค้นหาสินค้า..." value={productSearch} onChangeText={setProductSearch} placeholderTextColor="#94a3b8" />
            <Text className={cn('text-sm font-medium text-slate-500')}>{products.length} รายการ</Text>
          </View>

          <View className={cn('bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm')}>
            <View className={cn('flex-row bg-rose-50 py-2.5 px-3 border-b border-slate-200')}>
              {['#', 'รหัส', 'ชื่อสินค้า', 'หมวด', 'หน่วย', 'ทุน', 'ราคา', 'VAT', 'ประเภท'].map((h, i) => (
                <Text key={i} className={cn('text-sm font-bold text-slate-500 flex-1')} style={i === 2 ? { flex: 2 } : {}}>{h}</Text>
              ))}
            </View>
            {products.filter(p => !productSearch || `${p.name} ${p.code}`.toLowerCase().includes(productSearch.toLowerCase())).map((p, i) => (
              <View key={p.id} className={cn('flex-row px-3 py-2 border-b border-slate-100 items-center')}
                style={i % 2 === 1 ? { backgroundColor: '#fdf2f8' } : {}}>
                <Text className={cn('text-sm font-medium text-slate-700 flex-1')}>{i + 1}</Text>
                <Text className={cn('text-sm font-bold text-slate-700 flex-1')}>{p.code}</Text>
                <Text className={cn('text-sm font-medium text-slate-700 flex-[2]')}>{p.name}</Text>
                <Text className={cn('text-sm font-medium text-slate-700 flex-1')}>{p.categoryName || '-'}</Text>
                <Text className={cn('text-sm font-medium text-slate-700 flex-1')}>{p.unit}</Text>
                <Text className={cn('text-sm font-medium flex-1')} style={{ color: '#64748b' }}>฿{p.costPrice.toLocaleString()}</Text>
                <Text className={cn('text-sm font-bold flex-1')} style={{ color: '#e11d48' }}>฿{p.salePrice.toLocaleString()}</Text>
                <Text className={cn('text-sm font-medium text-slate-700 flex-1')}>{p.vatRate}%</Text>
                <View className={cn('flex-1')}>
                  <View className={cn('self-start px-2.5 py-1 rounded-xl')}
                    style={{ backgroundColor: p.productType === 'service' ? '#ede9fe' : '#fdf2f8' }}>
                    <Text className={cn('text-sm font-bold')}
                      style={{ color: p.productType === 'service' ? '#7c3aed' : '#e11d48' }}>
                      {p.productType === 'service' ? 'บริการ' : 'สินค้า'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {listTab === 'docs' && (
        <>
          <View className={cn('flex-row gap-2 flex-wrap')}>
            <TouchableOpacity className={cn('flex-row items-center gap-1.5 bg-rose-500 rounded-xl px-3.5 py-2 shadow-sm')} onPress={handleNew}>
              <Ionicons name="add-circle" size={16} color="#fafafa" />
              <Text className={cn('text-sm font-bold text-white')}>สร้างเอกสารราคา</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={cn('flex-row items-center gap-1.5 rounded-xl px-3.5 py-2 border-[1.5] border-rose-500 bg-white shadow-sm')}
              onPress={handleImport}>
              <Ionicons name="cloud-upload-outline" size={16} color="#e11d48" />
              <Text className={cn('text-sm font-bold text-rose-600')}>Import Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={cn('flex-row items-center gap-1.5 rounded-xl px-3.5 py-2 border-[1.5] border-rose-500 bg-white shadow-sm')}
              onPress={handleExport}>
              <Ionicons name="cloud-download-outline" size={16} color="#e11d48" />
              <Text className={cn('text-sm font-bold text-rose-600')}>Export Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity className={cn('flex-row items-center gap-1 px-2.5 py-2')} onPress={handleDownloadTemplate}>
              <Ionicons name="document-outline" size={14} color="#64748b" />
              <Text className={cn('text-sm underline font-medium text-slate-500')}>Download Template</Text>
            </TouchableOpacity>
          </View>

          <View className={cn('bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm')}>
            <View className={cn('flex-row bg-rose-50 py-2.5 px-3 border-b border-slate-200')}>
              {['เลขที่เอกสาร', 'วันที่', 'รูปแบบ', 'สาขา', 'รายการ', 'สถานะ', 'สร้างโดย'].map((h, i) => (
                <Text key={i} className={cn('text-sm font-bold text-slate-500 flex-1')} style={i === 0 ? { flex: 1.3 } : {}}>{h}</Text>
              ))}
            </View>
            {docs.map((d, i) => (
              <View key={d.id} className={cn('flex-row px-3 py-2 border-b border-slate-100 items-center')}
                style={i % 2 === 1 ? { backgroundColor: '#fdf2f8' } : {}}>
                <Text className={cn('text-sm font-bold flex-[1.3]')} style={{ color: '#e11d48' }}>{d.docNo}</Text>
                <Text className={cn('text-sm font-medium text-slate-700 flex-1')}>{d.date}</Text>
                <View className={cn('flex-1')}>
                  <View className={cn('self-start px-2.5 py-1 rounded-xl')}
                    style={{ backgroundColor: d.mode === 'all' ? '#fdf2f8' : '#fef3c7' }}>
                    <Text className={cn('text-sm font-bold')} style={{ color: d.mode === 'all' ? '#e11d48' : '#92400e' }}>
                      {d.mode === 'all' ? 'ราคากลาง' : 'ราคาสาขา'}
                    </Text>
                  </View>
                </View>
                <Text className={cn('text-sm font-medium text-slate-700 flex-1')}>{d.branchName || 'ทุกสาขา'}</Text>
                <Text className={cn('text-sm font-medium text-slate-700 flex-1')}>{d.itemCount} รายการ</Text>
                <View className={cn('flex-1')}>
                  <View className={cn('self-start px-2.5 py-1 rounded-xl')}
                    style={{ backgroundColor: d.status === 'confirmed' ? '#dcfce7' : '#f1f5f9' }}>
                    <Text className={cn('text-sm font-bold')} style={{ color: d.status === 'confirmed' ? '#16a34a' : '#64748b' }}>
                      {d.status === 'confirmed' ? 'ยืนยัน' : 'ร่าง'}
                    </Text>
                  </View>
                </View>
                <Text className={cn('text-sm font-medium text-slate-700 flex-1')}>{d.createdBy}</Text>
              </View>
            ))}
            {docs.length === 0 && <Text className={cn('text-sm font-medium text-slate-400 text-center p-6')}>ไม่มีเอกสาร</Text>}
          </View>
        </>
      )}

      <AlertDialog visible={!!alertMsg} onClose={() => setAlertMsg(null)}
        title="สำเร็จ" message={alertMsg || ''} variant="success" />
    </ScrollView>
  );
};
