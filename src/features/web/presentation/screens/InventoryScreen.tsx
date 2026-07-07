/**
 * InventoryScreen — M05 คลังสินค้า
 * - คงเหลือ / รับสินค้า / เบิกสินค้า / เอกสาร
 */
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, TouchableOpacity, FlatList, ScrollView, Modal, Platform } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { MOCK_STOCK_ITEMS } from '@/features/reports/data/mocks/mockReports';
import { useStockDocStore } from '@/features/inventory/application/stores/stockDocStore';
import { DocStatus, DocType, StockDocument } from '@/features/inventory/domain/stockDocument';
import { MOCK_PRODUCTS } from '@/features/product/data/mocks/mockProducts';
import { Text, TextInput } from '@/shared/tw/index';

// ─── Constants ───────────────────────────────────────────────────────────────
type Tab = 'stock' | 'receive' | 'issue' | 'docs';

const fmt    = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });
const fmtQty = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 0 });

const STATUS_CFG: Record<DocStatus, { label: string; color: string; bg: string }> = {
  draft:     { label: 'แบบร่าง',    color: '#a16207', bg: '#fed7aa' },
  confirmed: { label: 'ยืนยันแล้ว', color: '#0f766e', bg: '#d1fae5' },
  cancelled: { label: 'ยกเลิก',     color: '#ef4444', bg: '#ffe4e6' },
  revised:   { label: 'Revised',    color: '#f87171', bg: '#fee2e2' },
};

const MOCK_WAREHOUSES = [
  { id: 'wh1', name: 'คลังหลัก' },
  { id: 'wh2', name: 'คลังสาขา 1' },
  { id: 'wh3', name: 'คลังสาขา 2' },
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface DraftItem {
  rowId:       string;
  productId:   string;
  productCode: string;
  productName: string;
  uomId:       string;
  unit:        string;
  ratio:       number;
  onHandQty:   number;
  qty:         number;  // ใช้ number ไม่ใช่ string
}

// ─── StockDocCreateModal ──────────────────────────────────────────────────────
const StockDocCreateModal: React.FC<{
  visible:      boolean;
  docType:      DocType;
  editDocId?:   string | null;   // ถ้ามี = โหมดแก้ไข
  onClose:      () => void;
}> = ({ visible, docType, editDocId, onClose }) => {
  const { addDocument, updateDocument, documents } = useStockDocStore();

  // โหมดแก้ไข: โหลด doc เดิม
  const editDoc = editDocId ? documents.find(d => d.id === editDocId) : null;

  const initWarehouse = editDoc?.warehouseId ?? MOCK_WAREHOUSES[0].id;
  const initRemark    = editDoc?.remark ?? '';
  const initItems     = (): DraftItem[] => {
    if (!editDoc) return [];
    return editDoc.items.map(i => ({
      rowId:       i.id,
      productId:   i.productId,
      productCode: i.productCode,
      productName: i.productName,
      uomId:       i.uomId,
      unit:        i.unit,
      ratio:       i.ratio,
      onHandQty:   i.onHandQty,
      qty:         i.qty,
    }));
  };

  const [warehouse, setWarehouse]   = useState(initWarehouse);
  const [remark,    setRemark]      = useState(initRemark);
  const [items,     setItems]       = useState<DraftItem[]>(initItems);
  const [showWhPicker, setShowWhPicker] = useState(false);
  const [prodSearch, setProdSearch]     = useState('');
  // dropdown state พร้อม ref สำหรับ position
  const [openProdRow,  setOpenProdRow]  = useState<string | null>(null);
  const [openUomRow,   setOpenUomRow]   = useState<string | null>(null);

  // Barcode scan
  const barcodeRef = useRef<any>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanFlash, setScanFlash]       = useState<{ message: string; success: boolean } | null>(null);

  // reset on open
  React.useEffect(() => {
    if (visible) {
      setWarehouse(initWarehouse);
      setRemark(initRemark);
      setItems(initItems());
      setBarcodeInput('');
      setScanFlash(null);
      setOpenProdRow(null);
      setOpenUomRow(null);
    }
  }, [visible, editDocId]);

  // ─── Barcode handler ───────────────────────────────────────────────────────
  const handleBarcode = useCallback((text: string) => {
    const bc = text.trim();
    if (!bc) return;
    setBarcodeInput('');

    // หาสินค้า+หน่วยจาก barcode
    let foundProd: typeof MOCK_PRODUCTS[0] | null = null;
    let foundUom:  typeof MOCK_PRODUCTS[0]['uoms'][0] | null = null;

    for (const p of MOCK_PRODUCTS) {
      for (const u of p.uoms) {
        if (u.barcodes.includes(bc)) {
          foundProd = p; foundUom = u; break;
        }
      }
      if (foundProd) break;
    }

    if (!foundProd || !foundUom) {
      setScanFlash({ message: `ไม่พบบาร์โค้ด ${bc}`, success: false });
      setTimeout(() => setScanFlash(null), 2000);
      setTimeout(() => barcodeRef.current?.focus(), 100);
      return;
    }

    const uom = foundUom;
    const prod = foundProd;

    setItems(prev => {
      // ถ้ามีสินค้า+หน่วยนี้อยู่แล้ว → เพิ่มจำนวน
      const idx = prev.findIndex(i => i.productId === prod.id && i.uomId === uom.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        setScanFlash({ message: `${prod.name} (${uom.unit}) × ${next[idx].qty}`, success: true });
        setTimeout(() => setScanFlash(null), 1400);
        return next;
      }
      // เพิ่มแถวใหม่
      const newItem: DraftItem = {
        rowId:       `row_${Date.now()}`,
        productId:   prod.id,
        productCode: prod.code,
        productName: prod.name,
        uomId:       uom.id,
        unit:        uom.unit,
        ratio:       uom.ratio,
        onHandQty:   Math.floor(prod.stockQty / uom.ratio),
        qty:         1,
      };
      setScanFlash({ message: `${prod.name} (${uom.unit}) เพิ่มใหม่`, success: true });
      setTimeout(() => setScanFlash(null), 1400);
      return [...prev, newItem];
    });
    setTimeout(() => barcodeRef.current?.focus(), 80);
  }, []);

  // ─── Item helpers ──────────────────────────────────────────────────────────
  const addEmptyRow = () => {
    setItems(prev => [...prev, {
      rowId: `row_${Date.now()}`, productId: '', productCode: '',
      productName: '', uomId: '', unit: '', ratio: 1, onHandQty: 0, qty: 1,
    }]);
  };

  const removeRow = (rowId: string) => setItems(prev => prev.filter(r => r.rowId !== rowId));

  const setProduct = (rowId: string, prod: typeof MOCK_PRODUCTS[0], uom: typeof MOCK_PRODUCTS[0]['uoms'][0]) => {
    setItems(prev => prev.map(r => r.rowId !== rowId ? r : {
      ...r, productId: prod.id, productCode: prod.code, productName: prod.name,
      uomId: uom.id, unit: uom.unit, ratio: uom.ratio,
      onHandQty: Math.floor(prod.stockQty / uom.ratio),
    }));
    setOpenProdRow(null);
    setProdSearch('');
  };

  const setUom = (rowId: string, prod: typeof MOCK_PRODUCTS[0], uom: typeof MOCK_PRODUCTS[0]['uoms'][0]) => {
    setItems(prev => prev.map(r => r.rowId !== rowId ? r : {
      ...r, uomId: uom.id, unit: uom.unit, ratio: uom.ratio,
      onHandQty: Math.floor(prod.stockQty / uom.ratio),
    }));
    setOpenUomRow(null);
  };

  const setQty = (rowId: string, val: string) => {
    const n = parseInt(val.replace(/\D/g, ''), 10);
    setItems(prev => prev.map(r => r.rowId !== rowId ? r : { ...r, qty: isNaN(n) ? 0 : n }));
  };

  // ─── Save ──────────────────────────────────────────────────────────────────
  const handleSave = (status: 'draft' | 'confirmed') => {
    const valid = items.filter(i => i.productId && i.qty > 0);
    if (valid.length === 0) return;

    const wh = MOCK_WAREHOUSES.find(w => w.id === warehouse)!;
    const payload = {
      docType,
      revNo:          0,
      status,
      warehouseId:    wh.id,
      warehouseName:  wh.name,
      remark:         remark.trim() || undefined,
      items: valid.map((r, idx) => ({
        id:          `item_${Date.now()}_${idx}`,
        productId:   r.productId,
        productCode: r.productCode,
        productName: r.productName,
        uomId:       r.uomId,
        unit:        r.unit,
        ratio:       r.ratio,
        onHandQty:   r.onHandQty,
        qty:         r.qty,
        qtyBase:     r.qty * r.ratio,
        costPrice:   0,          // ไม่มียอดเงิน
      })),
      totalItems:   valid.length,
      totalQtyBase: valid.reduce((s, r) => s + r.qty * r.ratio, 0),
      totalCost:    0,           // ไม่มียอดเงิน
      createdBy:    'ผู้ใช้งาน',
      revisionHistory: [],
    };

    if (editDocId) {
      updateDocument(editDocId, { ...payload, status });
    } else {
      addDocument(payload);
    }
    onClose();
  };

  const whName = MOCK_WAREHOUSES.find(w => w.id === warehouse)?.name ?? '';
  const totalQty = items.reduce((s, r) => s + r.qty * r.ratio, 0);

  const filteredProds = useMemo(() =>
    MOCK_PRODUCTS.filter(p =>
      p.status === 'active' &&
      (!prodSearch || p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.code.toLowerCase().includes(prodSearch.toLowerCase()))
    ),
  [prodSearch]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className={cn('flex-1 bg-[rgba(0,0,0,0.45)] items-center justify-center')}>
        <View className={cn('bg-white flex-col')}
          style={{ width: '95%', maxWidth: 900, height: '90%', borderRadius: 16, overflow: 'hidden' }}>
          <View className={cn('flex-row items-center justify-between px-5 py-4 border-b border-slate-200')}>
            <View className={cn('flex-row items-center gap-2.5')}>
              <View className={cn('w-[38px] h-[38px] items-center justify-center')}
                style={[{ borderRadius: 10, backgroundColor: docType === 'receive' ? '#d1fae5' : '#e9d5ff' }]}>
                <Ionicons
                  name={docType === 'receive' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                  size={20} color={docType === 'receive' ? '#0f766e' : '#6b21a8'}
                />
              </View>
              <Text className={cn('text-[15px] font-bold')} style={[{ color: '#292524' }]}>
                {editDocId ? 'แก้ไข' : 'สร้าง'}{docType === 'receive' ? 'ใบรับสินค้า' : 'ใบเบิกสินค้า'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className={cn('w-8 h-8 items-center justify-center bg-neutral-100')} style={[{ borderRadius: 8 }]}>
              <Ionicons name="close" size={20} color="#57534e" />
            </TouchableOpacity>
          </View>

          <View className={cn('flex-row flex-1 overflow-hidden')}>

            {/* ── Left: scan + items ── */}
            <View className={cn('flex-1')} style={{ borderRightWidth: 1, borderRightColor: '#e7e5e4' }}>

              {/* Barcode scan row */}
              <View className={cn('flex-row items-center gap-2 px-3 py-2 border-b border-slate-200 bg-neutral-50')}>
                <Ionicons name="barcode-outline" size={18}
                  color={scanFlash?.success ? '#0f766e' : scanFlash ? '#ef4444' : '#57534e'} />
                <TextInput
                  ref={barcodeRef}
                  className={cn('flex-1 text-[13px] h-9')}
                  style={[{ color: '#292524' }]}
                  placeholder="สแกนบาร์โค้ด หรือพิมพ์ค้นหา..."
                  placeholderTextColor="#57534e"
                  value={barcodeInput}
                  onChangeText={setBarcodeInput}
                  onSubmitEditing={e => handleBarcode(e.nativeEvent.text)}
                  returnKeyType="done"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {barcodeInput.length > 0 && (
                  <TouchableOpacity onPress={() => setBarcodeInput('')}>
                    <Ionicons name="close-circle" size={16} color="#57534e" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Scan flash */}
              {scanFlash && (
                <View className={cn('flex-row items-center gap-1.5 px-3 py-1.5 border-b border-slate-200')}
                  style={{ backgroundColor: scanFlash.success ? '#d1fae5' : '#ffe4e6' }}>
                  <Ionicons name={scanFlash.success ? 'checkmark-circle-outline' : 'close-circle-outline'} size={15} color={scanFlash.success ? '#0f766e' : '#ef4444'} />
                  <Text className={cn('text-[15px] font-bold')}
                    style={{ color: scanFlash.success ? '#0f766e' : '#ef4444' }}>
                    {scanFlash.message}
                  </Text>
                </View>
              )}

              {/* Items table header */}
              <View className={cn('flex-row items-center px-2.5 py-1.5 bg-neutral-50 border-b border-slate-200')}>
                <Text className={cn('text-[14px] font-bold uppercase')} style={[{ flex: 2, color: '#57534e' }]}>สินค้า</Text>
                <Text className={cn('text-[14px] font-bold uppercase')} style={[{ width: 80, color: '#57534e' }]}>หน่วย</Text>
                <Text className={cn('text-[14px] font-bold uppercase')} style={[{ width: 60, textAlign: 'center', color: '#57534e' }]}>คงเหลือ</Text>
                <Text className={cn('text-[14px] font-bold uppercase')} style={[{ width: 72, textAlign: 'center', color: '#57534e' }]}>จำนวน</Text>
                <Text className={cn('text-[14px] font-bold uppercase')} style={[{ width: 30, color: '#57534e' }]}></Text>
              </View>

              {/* Items list */}
              <ScrollView className={cn('flex-1')} showsVerticalScrollIndicator={false}>
                {items.length === 0 ? (
                  <View className={cn('items-center py-6 gap-2 border border-dashed border-slate-200 rounded-lg')}>
                    <Ionicons name="scan-outline" size={32} color="#e7e5e4" />
                    <Text className={cn('text-[13px]')} style={[{ color: '#57534e' }]}>สแกนบาร์โค้ด หรือกด "+ เพิ่มสินค้า"</Text>
                  </View>
                ) : (
                  items.map((row, idx) => {
                    const masterProd = MOCK_PRODUCTS.find(p => p.id === row.productId);
                    const uomOpts = masterProd?.uoms ?? [];
                    return (
                      <View key={row.rowId} className={cn('border border-slate-200 rounded-lg mb-2 p-2.5 bg-neutral-50')}
                        style={idx % 2 === 1 ? { backgroundColor: '#fafafa' } : {}}>

                        {/* Product picker */}
                        <View style={{ flex: 2 }}>
                          <TouchableOpacity
                            className={cn('flex-row items-center justify-between px-1.5 py-1 rounded-md border border-slate-200 bg-white mr-1')}
                            onPress={() => {
                              if (openProdRow === row.rowId) {
                                setOpenProdRow(null);
                              } else {
                                setOpenProdRow(row.rowId);
                                setOpenUomRow(null);
                                setProdSearch('');
                              }
                            }}
                          >
                            {row.productId ? (
                              <View className={cn('flex-1')}>
                                <Text className={cn('text-[15px] font-semibold')} style={[{ color: '#292524' }]} numberOfLines={1}>{row.productName}</Text>
                                <Text className={cn('text-[14px]')} style={[{ color: '#57534e' }]}>{row.productCode}</Text>
                              </View>
                            ) : (
                              <Text className={cn('flex-1 text-[15px]')} style={[{ color: '#57534e' }]}>เลือกสินค้า...</Text>
                            )}
                            <Ionicons name="chevron-down" size={12} color="#57534e" />
                          </TouchableOpacity>
                        </View>

                        {/* UOM picker */}
                        <View style={{ width: 80 }}>
                          <TouchableOpacity
                            className={cn('flex-row items-center gap-[3px] px-1.5 py-1 rounded-md border border-slate-200 bg-rose-50 mr-1')}
                            onPress={() => masterProd && setOpenUomRow(openUomRow === row.rowId ? null : row.rowId)}
                            disabled={!masterProd}
                          >
                            <Text className={cn('text-[15px] font-semibold')} style={[{ color: '#f87171' }]} numberOfLines={1}>{row.unit || '—'}</Text>
                            {uomOpts.length > 1 && <Ionicons name="chevron-down" size={11} color="#57534e" />}
                          </TouchableOpacity>
                        </View>

                        {/* คงเหลือ */}
                        <Text className={cn('text-[13px]')} style={[{ width: 60, textAlign: 'center',
                          color: row.onHandQty <= 5 ? '#ef4444' : '#0f766e' }]}>
                          {row.productId ? fmtQty(row.onHandQty) : '—'}
                        </Text>

                        {/* จำนวน — inline input */}
                        <View className={cn('flex-row items-center border border-slate-200 rounded-md overflow-hidden mr-1')} style={[{ width: 72 }]}>
                          <TouchableOpacity className={cn('w-[22px] h-7 items-center justify-center bg-rose-50')} onPress={() => setQty(row.rowId, String(Math.max(0, row.qty - 1)))}>
                            <Ionicons name="remove" size={12} color="#f87171" />
                          </TouchableOpacity>
                          <TextInput
                            className={cn('w-7 h-7 text-[13px] font-bold text-center bg-white')}
                            style={[{ color: '#292524' }]}
                            value={row.qty > 0 ? String(row.qty) : ''}
                            onChangeText={v => setQty(row.rowId, v)}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor="#57534e"
                            textAlign="center"
                          />
                          <TouchableOpacity className={cn('w-[22px] h-7 items-center justify-center bg-rose-50')} onPress={() => setQty(row.rowId, String(row.qty + 1))}>
                            <Ionicons name="add" size={12} color="#f87171" />
                          </TouchableOpacity>
                        </View>

                        {/* ลบ */}
                        <TouchableOpacity className={cn('w-[26px] h-[26px] items-center justify-center bg-red-100')} style={[{ borderRadius: 6 }]} onPress={() => removeRow(row.rowId)}>
                          <Ionicons name="trash-outline" size={13} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}

                {/* Add row button */}
                <TouchableOpacity className={cn('flex-row items-center gap-1.5 px-3 py-2.5 border-t border-slate-200')} onPress={addEmptyRow}>
                  <Ionicons name="add-circle-outline" size={15} color="#f87171" />
                  <Text className={cn('text-[13px] font-semibold text-rose-500')}>+ เพิ่มสินค้า</Text>
                </TouchableOpacity>

                {/* ── Product dropdown panel ── */}
                {openProdRow && (
                  <View className={cn('mx-2 mb-2 bg-white border-[1.5] border-rose-500 overflow-hidden')} style={[{ borderRadius: 10 }]}>
                    <View className={cn('flex-row items-center justify-between px-3 py-2 border-b bg-rose-50')} style={{ borderBottomColor: '#f871714d' }}>
                      <Text className={cn('text-[15px] font-bold text-rose-500')}>
                        เลือกสินค้า — แถวที่ {items.findIndex(r => r.rowId === openProdRow) + 1}
                      </Text>
                      <TouchableOpacity onPress={() => setOpenProdRow(null)}>
                        <Ionicons name="close" size={16} color="#57534e" />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      className={cn('border-b border-slate-200 px-2.5 py-1.5 text-[13px]')}
                      style={[{ color: '#292524' }]}
                      placeholder="ค้นหาชื่อหรือรหัสสินค้า..."
                      placeholderTextColor="#57534e"
                      value={prodSearch}
                      onChangeText={setProdSearch}
                      autoFocus
                    />
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                      {filteredProds.map(p => (
                        <TouchableOpacity
                          key={p.id}
                          className={cn('flex-row items-center gap-2 px-3 py-2 border-b border-neutral-100')}
                          style={items.find(r => r.rowId === openProdRow)?.productId === p.id ? { backgroundColor: '#fee2e2' } : {}}
                          onPress={() => {
                            setProduct(openProdRow, p, p.uoms[0]);
                            setOpenProdRow(null);
                          }}
                        >
                          <Text className={cn('text-[15px]')} style={[{ width: 44, color: '#57534e' }]}>{p.code}</Text>
                          <Text className={cn('flex-1 text-[13px]')} style={[{ color: '#292524' }]} numberOfLines={1}>{p.name}</Text>
                          <Text className={cn('text-[15px] text-emerald-700')}>{p.stockQty} {p.unit}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* ── UOM dropdown panel ── */}
                {openUomRow && (() => {
                  const row = items.find(r => r.rowId === openUomRow);
                  const masterProd = row ? MOCK_PRODUCTS.find(p => p.id === row.productId) : null;
                  if (!masterProd) return null;
                  return (
                    <View className={cn('mx-2 mb-2 bg-white border-[1.5] border-rose-500 overflow-hidden')} style={[{ borderRadius: 10 }]}>
                      <View className={cn('flex-row items-center justify-between px-3 py-2 border-b bg-rose-50')} style={{ borderBottomColor: '#f871714d' }}>
                        <Text className={cn('text-[15px] font-bold text-rose-500')}>เลือกหน่วย — {masterProd.name}</Text>
                        <TouchableOpacity onPress={() => setOpenUomRow(null)}>
                          <Ionicons name="close" size={16} color="#57534e" />
                        </TouchableOpacity>
                      </View>
                      {masterProd.uoms.map(u => (
                        <TouchableOpacity
                          key={u.id}
                          className={cn('flex-row items-center gap-2 px-3 py-2 border-b border-neutral-100')}
                          style={u.id === row?.uomId ? { backgroundColor: '#fee2e2' } : {}}
                          onPress={() => {
                            setUom(openUomRow, masterProd, u);
                            setOpenUomRow(null);
                          }}
                        >
                          <Text className={cn('flex-1 text-[13px] font-semibold')}
                            style={[{ color: u.id === row?.uomId ? '#f87171' : '#292524' }]}>
                            {u.unit}
                          </Text>
                          <Text className={cn('text-[15px]')} style={[{ color: '#57534e' }]}>
                            {u.ratio > 1 ? `1 ${u.unit} = ${u.ratio} ${masterProd.unit}` : 'หน่วยหลัก'}
                          </Text>
                          {u.id === row?.uomId && (
                            <Ionicons name="checkmark" size={14} color="#f87171" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                })()}
              </ScrollView>
            </View>

            {/* ── Right: meta ── */}
            <View className={cn('w-[220px] p-3.5 bg-neutral-50 gap-1')}>
              <Text className={cn('text-[13px] font-bold mb-2')} style={[{ color: '#292524' }]}>ข้อมูลเอกสาร</Text>

              <Text className={cn('text-[15px] font-bold mt-2')} style={[{ color: '#57534e' }]}>คลังสินค้า <Text style={{ color: '#ef4444' }}>*</Text></Text>
              <TouchableOpacity className={cn('flex-row items-center justify-between border border-slate-200 rounded-lg px-3 py-2 bg-white')} onPress={() => setShowWhPicker(v => !v)}>
                <Text className={cn('text-[13px]')} style={[{ color: '#292524' }]}>{whName}</Text>
                <Ionicons name={showWhPicker ? 'chevron-up' : 'chevron-down'} size={13} color="#57534e" />
              </TouchableOpacity>
              {showWhPicker && (
                <View className={cn('border border-slate-200 rounded-lg mt-0.5 bg-white shadow-sm')}>
                  {MOCK_WAREHOUSES.map(w => (
                    <TouchableOpacity key={w.id}
                      className={cn('flex-row items-center justify-between px-3 py-2.5 border-b border-neutral-100', warehouse === w.id && 'bg-rose-50')}
                      onPress={() => { setWarehouse(w.id); setShowWhPicker(false); }}>
                      <Text className={cn('text-[13px]', warehouse === w.id && 'font-semibold')}
                        style={{ color: warehouse === w.id ? '#f87171' : '#292524' }}>{w.name}</Text>
                      {warehouse === w.id && <Ionicons name="checkmark" size={13} color="#f87171" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text className={cn('text-[15px] font-bold mt-3')} style={[{ color: '#57534e' }]}>หมายเหตุ</Text>
              <TextInput
                className={cn('border border-slate-200 rounded-lg px-3 py-2 text-[13px] bg-white')}
                style={[{ color: '#292524', height: 64, textAlignVertical: 'top', paddingTop: 8 }]}
                placeholder="หมายเหตุ..."
                placeholderTextColor="#57534e"
                multiline
                value={remark}
                onChangeText={setRemark}
              />

              {/* Summary */}
              <View className={cn('bg-white border border-slate-200 rounded-lg p-2.5 gap-1.5 mt-3')}>
                <View className={cn('flex-row justify-between')}>
                  <Text className={cn('text-[15px]')} style={[{ color: '#57534e' }]}>รายการ</Text>
                  <Text className={cn('text-[13px]')} style={[{ color: '#292524' }]}>{items.filter(r => r.productId).length} รายการ</Text>
                </View>
                <View className={cn('flex-row justify-between')}>
                  <Text className={cn('text-[15px]')} style={[{ color: '#57534e' }]}>จำนวนรวม (ฐาน)</Text>
                  <Text className={cn('text-[13px] font-bold')} style={[{ color: '#f87171' }]}>
                    {fmtQty(totalQty)} หน่วย
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Footer ── */}
          <View className={cn('flex-row gap-2 px-5 py-3.5 border-t border-slate-200 justify-end')}>
            <TouchableOpacity className={cn('rounded-lg border border-slate-200 px-4 py-2')} onPress={onClose}>
              <Text className={cn('text-[13px] font-semibold')} style={[{ color: '#57534e' }]}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={cn('flex-row items-center gap-1.5 rounded-lg border border-amber-500 px-3.5 py-2 bg-amber-50')}
              style={[{ opacity: items.filter(r => r.productId && r.qty > 0).length === 0 ? 0.4 : 1 }]}
              disabled={items.filter(r => r.productId && r.qty > 0).length === 0}
              onPress={() => handleSave('draft')}
            >
              <Ionicons name="save-outline" size={14} color="#92400e" />
              <Text className={cn('text-[13px] font-semibold text-amber-800')}>บันทึกแบบร่าง</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={cn('flex-row items-center gap-1.5 rounded-lg px-4 py-2 bg-rose-500')}
              style={[{ opacity: items.filter(r => r.productId && r.qty > 0).length === 0 ? 0.4 : 1 }]}
              disabled={items.filter(r => r.productId && r.qty > 0).length === 0}
              onPress={() => handleSave('confirmed')}
            >
              <Ionicons name="checkmark-circle-outline" size={14} color="#fafafa" />
              <Text className={cn('text-[13px] font-bold text-white')}>ยืนยัน{docType === 'receive' ? 'รับสินค้า' : 'เบิกสินค้า'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── DocDetailModal ──────────────────────────────────────────────────────────
const DocDetailModal: React.FC<{
  docId: string | null;
  onClose: () => void;
}> = ({ docId, onClose }) => {
  const { documents, confirmDocument, cancelDocument } = useStockDocStore();
  const doc = docId ? documents.find(d => d.id === docId) : null;

  if (!doc) return null;

  const st = STATUS_CFG[doc.status];

  return (
    <Modal visible={!!docId} transparent animationType="fade" onRequestClose={onClose}>
      <View className={cn('flex-1 bg-[rgba(0,0,0,0.45)] items-center justify-center')}>
        <View className={cn('bg-white overflow-hidden')} style={{ width: '90%', maxWidth: 680, maxHeight: '88%', borderRadius: 16 }}>
          {/* Header */}
          <View className={cn('flex-row items-center justify-between px-5 py-4 border-b border-slate-200')}>
            <View className={cn('flex-row items-center gap-2.5')}>
              <View className={cn('w-[38px] h-[38px] items-center justify-center')}
                style={[{ borderRadius: 10, backgroundColor: doc.docType === 'receive' ? '#d1fae5' : '#e9d5ff' }]}>
                <Ionicons
                  name={doc.docType === 'receive' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                  size={20}
                  color={doc.docType === 'receive' ? '#0f766e' : '#6b21a8'}
                />
              </View>
              <View>
                <Text className={cn('text-[15px] font-bold')} style={[{ color: '#292524' }]}>{doc.docNo}{doc.revNo > 0 ? ` (Rev.${doc.revNo})` : ''}</Text>
                <View className={cn('self-start px-1.5 py-0.5 mt-0.5')} style={[{ borderRadius: 5, backgroundColor: st.bg }]}>
                  <Text className={cn('text-[14px] font-bold')} style={[{ color: st.color }]}>{st.label}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className={cn('w-8 h-8 items-center justify-center bg-neutral-100')} style={[{ borderRadius: 8 }]}>
              <Ionicons name="close" size={20} color="#57534e" />
            </TouchableOpacity>
          </View>

          <ScrollView className={cn('px-5 pt-4')} showsVerticalScrollIndicator={false}>
            {/* Meta grid */}
            <View className={cn('flex-row flex-wrap gap-3 mb-4')}>
              <View className={cn('basis-[47%]')}>
                <Text className={cn('text-[15px] mb-0.5')} style={[{ color: '#57534e' }]}>ประเภทเอกสาร</Text>
                <Text className={cn('text-[13px] font-semibold')} style={[{ color: '#292524' }]}>{doc.docType === 'receive' ? 'ใบรับสินค้า' : 'ใบเบิกสินค้า'}</Text>
              </View>
              <View className={cn('basis-[47%]')}>
                <Text className={cn('text-[15px] mb-0.5')} style={[{ color: '#57534e' }]}>วันที่สร้าง</Text>
                <Text className={cn('text-[13px] font-semibold')} style={[{ color: '#292524' }]}>{doc.createdAt.toLocaleDateString('th-TH')}</Text>
              </View>
              <View className={cn('basis-[47%]')}>
                <Text className={cn('text-[15px] mb-0.5')} style={[{ color: '#57534e' }]}>คลังสินค้า</Text>
                <Text className={cn('text-[13px] font-semibold')} style={[{ color: '#292524' }]}>{doc.warehouseName}</Text>
              </View>
              {doc.supplierName && (
                <View className={cn('basis-[47%]')}>
                  <Text className={cn('text-[15px] mb-0.5')} style={[{ color: '#57534e' }]}>Supplier</Text>
                  <Text className={cn('text-[13px] font-semibold')} style={[{ color: '#292524' }]}>{doc.supplierName}</Text>
                </View>
              )}
              {doc.toWarehouseName && (
                <View className={cn('basis-[47%]')}>
                  <Text className={cn('text-[15px] mb-0.5')} style={[{ color: '#57534e' }]}>ปลายทาง</Text>
                  <Text className={cn('text-[13px] font-semibold')} style={[{ color: '#292524' }]}>{doc.toWarehouseName}</Text>
                </View>
              )}
              {doc.remark && (
                <View style={{ flexBasis: '100%' }}>
                  <Text className={cn('text-[15px] mb-0.5')} style={[{ color: '#57534e' }]}>หมายเหตุ</Text>
                  <Text className={cn('text-[13px] font-semibold')} style={[{ color: '#292524' }]}>{doc.remark}</Text>
                </View>
              )}
              {doc.confirmedBy && (
                <View className={cn('basis-[47%]')}>
                  <Text className={cn('text-[15px] mb-0.5')} style={[{ color: '#57534e' }]}>ยืนยันโดย</Text>
                  <Text className={cn('text-[13px] font-semibold')} style={[{ color: '#292524' }]}>{doc.confirmedBy}</Text>
                </View>
              )}
            </View>

            {/* Items table */}
            <Text className={cn('text-[13px] font-bold mb-2')} style={[{ color: '#292524' }]}>รายการสินค้า</Text>
            <View className={cn('border border-slate-200 rounded-lg overflow-hidden mb-3')}>
              <View className={cn('flex-row bg-neutral-50 px-2.5 py-2 border-b border-slate-200')}>
                {[['รหัส', 0.8], ['ชื่อสินค้า', 2], ['จำนวน', 0.8], ['หน่วย', 0.8], ['ราคา/หน่วย', 1], ['รวม', 1]].map(([h, f]) => (
                  <Text key={String(h)} className={cn('text-[15px] font-bold uppercase')} style={[{ flex: Number(f), color: '#57534e' }]}>{h}</Text>
                ))}
              </View>
              {doc.items.map((item, idx) => (
                <View key={item.id} className={cn('flex-row px-2.5 py-2 border-b border-slate-200 items-center', idx % 2 === 1 && 'bg-neutral-50')}>
                  <Text className={cn('text-[13px] font-semibold')} style={[{ flex: 0.8, color: '#292524' }]}>{item.productCode}</Text>
                  <Text className={cn('text-[13px]')} style={[{ flex: 2, color: '#292524' }]} numberOfLines={1}>{item.productName}</Text>
                  <Text className={cn('text-[13px]')} style={[{ flex: 0.8, color: '#292524' }]}>{item.qty}</Text>
                  <Text className={cn('text-[13px]')} style={[{ flex: 0.8, color: '#292524' }]}>{item.unit}</Text>
                  <Text className={cn('text-[13px]')} style={[{ flex: 1, color: '#292524' }]}>฿{fmt(item.costPrice)}</Text>
                  <Text className={cn('text-[13px] font-bold')} style={[{ flex: 1, color: '#f87171' }]}>
                    ฿{fmt(item.qty * item.costPrice)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Total */}
            <View className={cn('flex-row justify-between items-center bg-rose-50 rounded-lg px-3.5 py-2.5')}>
              <Text className={cn('text-[15px]')} style={[{ color: '#57534e' }]}>รายการทั้งหมด {doc.totalItems} รายการ</Text>
              <Text className={cn('text-[15px] font-extrabold text-rose-500')}>ยอดรวม ฿{fmt(doc.totalCost)}</Text>
            </View>

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Footer */}
          <View className={cn('flex-row gap-2 px-5 py-3.5 border-t border-slate-200 justify-end')}>
            <TouchableOpacity className={cn('rounded-lg border border-slate-200 px-4 py-2')} onPress={onClose}>
              <Text className={cn('text-[13px] font-semibold')} style={[{ color: '#57534e' }]}>ปิด</Text>
            </TouchableOpacity>
            <TouchableOpacity className={cn('flex-row items-center gap-1 rounded-lg border border-amber-500 px-3.5 py-2 bg-amber-50')} onPress={() => { /* print stub */ }}>
              <Ionicons name="print-outline" size={14} color="#57534e" />
              <Text className={cn('text-[13px] font-semibold')} style={[{ color: '#57534e' }]}>พิมพ์</Text>
            </TouchableOpacity>
            {doc.status === 'draft' && (
              <>
                <TouchableOpacity
                  className={cn('flex-row items-center gap-1.5 rounded-lg border px-3.5 py-2 bg-amber-50')}
                  style={{ borderColor: '#ef4444' }}
                  onPress={() => { cancelDocument(doc.id); onClose(); }}
                >
                  <Ionicons name="close-circle-outline" size={14} color="#ef4444" />
                  <Text className={cn('text-[13px] font-semibold text-rose-600')}>ยกเลิก</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={cn('flex-row items-center gap-1.5 rounded-lg px-4 py-2 bg-rose-500')}
                  onPress={() => { confirmDocument(doc.id, 'ผู้ใช้งาน'); onClose(); }}
                >
                  <Ionicons name="checkmark-circle-outline" size={14} color="#fafafa" />
                  <Text className={cn('text-[13px] font-bold text-white')}>ยืนยัน</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── DocTable ─────────────────────────────────────────────────────────────────
const DocTable: React.FC<{
  docs:   StockDocument[];
  search: string;
  onView: (id: string) => void;
  onEdit: (id: string, type: DocType) => void;
}> = ({ docs, search, onView, onEdit }) => {
  const { cancelDocument } = useStockDocStore();
  const filtered = docs.filter(d =>
    !search ||
    d.docNo.toLowerCase().includes(search.toLowerCase()) ||
    (d.supplierName ?? '').includes(search) ||
    d.warehouseName.includes(search)
  ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // เรียงล่าสุดก่อน

  return (
    <View className={cn('flex-1 bg-white border border-slate-200')} style={[{ borderRadius: 12 }]}>
      <View className={cn('flex-row bg-neutral-50 px-3.5 py-2.5 border-b border-slate-200')}>
        {[
          ['เลขที่',  1.4],
          ['ประเภท',  0.7],
          ['คลัง',    1  ],
          ['รายการ',  0.6],
          ['สถานะ',   0.8],
          ['วันที่',  1.1],
          ['จัดการ',  0.9],
        ].map(([h, f]) => (
          <Text key={String(h)} className={cn('text-[15px] font-bold uppercase')} style={[{ flex: Number(f), color: '#57534e' }]}>{h}</Text>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={d => d.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: d, index }) => {
          const st      = STATUS_CFG[d.status];
          const isDraft = d.status === 'draft';
          return (
            <View className={cn('flex-row px-3.5 py-2.5 border-b border-slate-200 items-center', index % 2 === 1 && 'bg-neutral-50')}>
              {/* เลขที่ */}
              <View style={{ flex: 1.4 }}>
                <Text className={cn('text-[13px] font-semibold')} style={[{ color: '#292524' }]}>{d.docNo}</Text>
                {d.revNo > 0 && (
                  <Text className={cn('text-[14px] mt-0.5')} style={[{ color: '#f87171' }]}>Rev.{d.revNo}</Text>
                )}
              </View>
              {/* ประเภท */}
              <View style={{ flex: 0.7, justifyContent: 'center' }}>
                <View className={cn('px-1.5 py-0.5 self-start')}
                  style={[{ borderRadius: 6, backgroundColor: d.docType === 'receive' ? '#d1fae5' : '#e9d5ff' }]}>
                  <Text className={cn('text-[15px] font-bold')}
                    style={[{ color: d.docType === 'receive' ? '#0f766e' : '#6b21a8' }]}>
                    {d.docType === 'receive' ? '↓ รับ' : '↑ เบิก'}
                  </Text>
                </View>
              </View>
              {/* คลัง */}
              <Text className={cn('text-[13px]')} style={[{ flex: 1, color: '#292524' }]} numberOfLines={1}>{d.warehouseName}</Text>
              {/* รายการ / จำนวน */}
              <View style={{ flex: 0.6, justifyContent: 'center' }}>
                <Text className={cn('text-[13px] font-semibold text-center')} style={[{ color: '#292524' }]}>{d.totalItems}</Text>
                <Text className={cn('text-[14px] text-center')} style={[{ color: '#57534e' }]}>{d.totalQtyBase} ชิ้น</Text>
              </View>
              {/* สถานะ */}
              <View style={{ flex: 0.8, justifyContent: 'center' }}>
                <View className={cn('px-1.5 py-0.5 self-start')} style={[{ borderRadius: 6, backgroundColor: st.bg }]}>
                  <Text className={cn('text-[15px] font-bold')} style={[{ color: st.color }]}>{st.label}</Text>
                </View>
              </View>
              {/* วันที่ */}
              <Text className={cn('text-[13px] text-[15px]')} style={[{ flex: 1.1, color: '#292524' }]}>
                {d.createdAt.toLocaleDateString('th-TH')}
                {'\n'}{d.createdAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {/* จัดการ */}
              <View className={cn('flex-row gap-1.5 justify-end')} style={[{ flex: 0.9 }]}>
                {/* ดู */}
                <TouchableOpacity className={cn('w-[26px] h-[26px] items-center justify-center bg-rose-50')} style={[{ borderRadius: 6 }]} onPress={() => onView(d.id)}>
                  <Ionicons name="eye-outline" size={13} color="#f87171" />
                </TouchableOpacity>
                {/* แก้ไข — draft เท่านั้น */}
                {isDraft && (
                  <TouchableOpacity
                    className={cn('w-[26px] h-[26px] items-center justify-center bg-amber-100')}
                    style={[{ borderRadius: 6 }]}
                    onPress={() => onEdit(d.id, d.docType)}
                  >
                    <Ionicons name="pencil-outline" size={13} color="#92400e" />
                  </TouchableOpacity>
                )}
                {/* ลบ / ยกเลิก — draft เท่านั้น */}
                {isDraft && (
                  <TouchableOpacity
                    className={cn('w-[26px] h-[26px] items-center justify-center bg-red-100')}
                    style={[{ borderRadius: 6 }]}
                    onPress={() => cancelDocument(d.id)}
                  >
                    <Ionicons name="trash-outline" size={13} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className={cn('items-center py-12 gap-2.5')}>
            <Ionicons name="document-outline" size={40} color="#e7e5e4" />
            <Text className={cn('text-[13px]')} style={[{ color: '#57534e' }]}>ไม่มีเอกสาร</Text>
          </View>
        }
      />
    </View>
  );
};

// ─── InventoryScreen ──────────────────────────────────────────────────────
export const InventoryScreen: React.FC = () => {
  const [tab, setTab]     = useState<Tab>('stock');
  const [search, setSearch] = useState('');
  const { documents }       = useStockDocStore();

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType,      setCreateType]      = useState<'receive' | 'issue'>('receive');
  const [selectedDocId,   setSelectedDocId]   = useState<string | null>(null);
  const [editDocId,       setEditDocId]        = useState<string | null>(null); // แก้ไขเอกสาร

  const totalValue = MOCK_STOCK_ITEMS.reduce((s, i) => s + i.inventoryValue, 0);
  const lowCount   = MOCK_STOCK_ITEMS.filter(i => i.status === 'low').length;
  const outCount   = MOCK_STOCK_ITEMS.filter(i => i.status === 'out').length;

  const filteredStock = useMemo(() =>
    MOCK_STOCK_ITEMS.filter(i =>
      !search ||
      i.productName.toLowerCase().includes(search.toLowerCase()) ||
      i.productCode.toLowerCase().includes(search.toLowerCase())
    )
  , [search]);

  const receiveDocs = documents.filter(d => d.docType === 'receive');
  const issueDocs   = documents.filter(d => d.docType === 'issue');

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'stock',   label: 'คงเหลือสินค้า',  icon: 'cube-outline' },
    { key: 'receive', label: 'รับสินค้า',       icon: 'arrow-down-circle-outline' },
    { key: 'issue',   label: 'เบิกสินค้า',      icon: 'arrow-up-circle-outline' },
    { key: 'docs',    label: 'เอกสารทั้งหมด',   icon: 'document-text-outline' },
  ];

  return (
    <View className={cn('flex-1 gap-3')}>
      {/* KPI */}
      <View className={cn('flex-row gap-2.5')}>
        {[
          { label: 'มูลค่าสต๊อกรวม',   value: `฿${fmt(totalValue)}`, icon: 'archive-outline',       color: '#f87171' },
          { label: 'จำนวน SKU',         value: `${MOCK_STOCK_ITEMS.length}`, icon: 'cube-outline',   color: '#0f766e' },
          { label: 'ใกล้หมด',           value: String(lowCount),       icon: 'warning-outline',      color: '#f59e0b' },
          { label: 'หมดสต๊อก',          value: String(outCount),       icon: 'close-circle-outline', color: '#ef4444' },
          { label: 'เอกสารวันนี้',      value: String(documents.length), icon: 'document-text-outline', color: '#7c3aed' },
        ].map((k, i) => (
          <View key={i} className={cn('flex-1 bg-white p-3.5 flex-row items-center gap-3 border border-slate-200')} style={[{ borderTopWidth: 3, borderTopColor: k.color, borderRadius: 10 }]}>
            <View className={cn('w-10 h-10 items-center justify-center')} style={[{ borderRadius: 10, backgroundColor: k.color + '15' }]}>
              <Ionicons name={k.icon as any} size={20} color={k.color} />
            </View>
            <View>
              <Text className={cn('text-[15px]')} style={[{ color: '#57534e' }]}>{k.label}</Text>
              <Text className={cn('text-[19px] font-extrabold')} style={[{ color: k.color }]}>{k.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View className={cn('flex-row bg-white border border-slate-200 overflow-hidden')} style={[{ borderRadius: 10 }]}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            className={cn('flex-1 flex-row items-center justify-center gap-1.5 py-2.5', tab === t.key && 'bg-rose-50')}
            onPress={() => setTab(t.key)}
          >
            <Ionicons name={t.icon as any} size={15} color={tab === t.key ? '#f87171' : '#57534e'} />
            <Text className={cn('text-[15px] font-medium', tab === t.key && 'font-bold text-rose-500')} style={[{ color: tab === t.key ? '#f87171' : '#57534e' }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View className={cn('flex-row gap-2.5 items-center')}>
        <View className={cn('flex-1 flex-row items-center gap-2 bg-white border border-slate-200 px-3 h-10')} style={[{ borderRadius: 8 }]}>
          <Ionicons name="search-outline" size={15} color="#57534e" />
          <TextInput
            className={cn('flex-1 text-[13px]')}
            style={[{ color: '#292524' }]}
            placeholder="ค้นหาสินค้า รหัส..."
            placeholderTextColor="#57534e"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {(tab === 'receive' || tab === 'issue') && (
          <TouchableOpacity
            className={cn('flex-row items-center gap-1.5 bg-rose-500 h-10 px-4')}
            style={[{ borderRadius: 8 }]}
            onPress={() => {
              setCreateType(tab === 'receive' ? 'receive' : 'issue');
              setShowCreateModal(true);
            }}
          >
            <Ionicons name="add" size={15} color="#fafafa" />
            <Text className={cn('text-[13px] font-bold text-white')}>{tab === 'receive' ? 'สร้างใบรับ' : 'สร้างใบเบิก'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Stock table ── */}
      {tab === 'stock' && (
        <View className={cn('flex-1 bg-white border border-slate-200')} style={[{ borderRadius: 12 }]}>
          <View className={cn('flex-row bg-neutral-50 px-3.5 py-2.5 border-b border-slate-200')}>
            {[['รหัส',0.8],['ชื่อสินค้า',2],['หมวด',0.9],['คลัง',0.9],['คงเหลือ',0.9],['ขั้นต่ำ',0.7],['มูลค่า',1],['สถานะ',0.8]].map(([h,f]) => (
              <Text key={String(h)} className={cn('text-[15px] font-bold uppercase')} style={[{ flex: Number(f), color: '#57534e' }]}>{h}</Text>
            ))}
          </View>
          <FlatList
            data={filteredStock} keyExtractor={(i,idx) => `${i.productCode}-${idx}`}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: i, index }) => {
              const stColor = i.status === 'ok' ? '#0f766e' : i.status === 'low' ? '#f59e0b' : '#ef4444';
              const stLabel = i.status === 'ok' ? 'ปกติ' : i.status === 'low' ? 'ใกล้หมด' : i.status === 'out' ? 'หมด' : 'Dead';
              const pct     = i.minStock > 0 ? Math.min(100, (i.onHandQty / i.minStock) * 100) : 100;
              return (
                <View className={cn('flex-row px-3.5 py-2.5 border-b border-slate-200 items-center', index % 2 === 1 && 'bg-neutral-50')}>
                  <Text className={cn('text-[13px] font-semibold')} style={[{ flex: 0.8, color: '#292524' }]}>{i.productCode}</Text>
                  <View style={[{ flex: 2 }]}>
                    <Text className={cn('text-[13px] font-semibold')} style={[{ color: '#292524' }]} numberOfLines={1}>{i.productName}</Text>
                    <View className={cn('h-[3px] bg-neutral-100 rounded-sm mt-[3px] overflow-hidden')}>
                      <View className={cn('h-full rounded-sm')} style={[{ width: `${pct}%` as any, backgroundColor: stColor }]} />
                    </View>
                  </View>
                  <Text className={cn('text-[13px]')} style={[{ flex: 0.9, color: '#292524' }]}>{i.categoryName}</Text>
                  <Text className={cn('text-[13px]')} style={[{ flex: 0.9, color: '#292524' }]} numberOfLines={1}>{i.warehouseName}</Text>
                  <Text className={cn('text-[13px] font-bold')} style={[{ flex: 0.9, color: i.onHandQty <= i.minStock ? '#ef4444' : '#292524' }]}>
                    {i.onHandQty} {i.unit}
                  </Text>
                  <Text className={cn('text-[13px]')} style={[{ flex: 0.7, color: '#292524' }]}>{i.minStock}</Text>
                  <Text className={cn('text-[13px]')} style={[{ flex: 1, color: '#f87171' }]}>฿{i.inventoryValue.toLocaleString()}</Text>
                  <View className={cn('flex-[0.8] justify-center')}>
                    <View className={cn('px-1.5 py-0.5 self-start')} style={[{ borderRadius: 6, backgroundColor: stColor + '18' }]}>
                      <Text className={cn('text-[15px] font-bold')} style={[{ color: stColor }]}>{stLabel}</Text>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      {/* ── Receive / Issue docs ── */}
      {(tab === 'receive' || tab === 'issue' || tab === 'docs') && (
        <DocTable
          docs={tab === 'receive' ? receiveDocs : tab === 'issue' ? issueDocs : documents}
          search={search}
          onView={(id) => setSelectedDocId(id)}
          onEdit={(id, type) => {
            setEditDocId(id);
            setCreateType(type);
            setShowCreateModal(true);
          }}
        />
      )}

      {/* Modals */}
      <StockDocCreateModal
        visible={showCreateModal}
        docType={createType}
        editDocId={editDocId}
        onClose={() => {
          setShowCreateModal(false);
          setEditDocId(null);
        }}
      />
      <DocDetailModal
        docId={selectedDocId}
        onClose={() => setSelectedDocId(null)}
      />
    </View>
  );
};



