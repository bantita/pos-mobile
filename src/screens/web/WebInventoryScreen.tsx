/**
 * WebInventoryScreen — M05 คลังสินค้า
 * - คงเหลือ / รับสินค้า / เบิกสินค้า / เอกสาร
 */
import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput,
  ScrollView, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { MOCK_STOCK_ITEMS } from '../../data/mockReports';
import { useStockDocStore } from '../../store/stockDocStore';
import { DocStatus, DocType, StockDocument } from '../../types/stockDocument';
import { MOCK_PRODUCTS } from '../../data/mockProducts';

// ─── Constants ───────────────────────────────────────────────────────────────
type Tab = 'stock' | 'receive' | 'issue' | 'docs';

const fmt    = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });
const fmtQty = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 0 });

const STATUS_CFG: Record<DocStatus, { label: string; color: string; bg: string }> = {
  draft:     { label: 'แบบร่าง',    color: WebColors.warning,  bg: WebColors.warningLight },
  confirmed: { label: 'ยืนยันแล้ว', color: WebColors.success, bg: WebColors.successLight },
  cancelled: { label: 'ยกเลิก',     color: WebColors.danger,  bg: WebColors.dangerLight },
  revised:   { label: 'Revised',    color: WebColors.primary, bg: WebColors.primaryLight },
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
  const [scanFlash, setScanFlash]       = useState<string | null>(null);

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
      setScanFlash(`❌ ไม่พบบาร์โค้ด ${bc}`);
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
        setScanFlash(`✅ ${prod.name} (${uom.unit}) × ${next[idx].qty}`);
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
      setScanFlash(`✅ ${prod.name} (${uom.unit}) เพิ่มใหม่`);
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
      <View style={ms.overlay}>
        <View style={ms.sheetLarge}>
          <View style={ms.header}>
            <View style={ms.headerLeft}>
              <View style={[ms.headerIcon, { backgroundColor: docType === 'receive' ? WebColors.successLight : WebColors.purpleLight }]}>
                <Ionicons
                  name={docType === 'receive' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                  size={20} color={docType === 'receive' ? WebColors.success : WebColors.purple}
                />
              </View>
              <Text style={ms.headerTitle}>
                {editDocId ? 'แก้ไข' : 'สร้าง'}{docType === 'receive' ? 'ใบรับสินค้า' : 'ใบเบิกสินค้า'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
              <Ionicons name="close" size={20} color={WebColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', flex: 1, overflow: 'hidden' as any }}>

            {/* ── Left: scan + items ── */}
            <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: WebColors.border }}>

              {/* Barcode scan row */}
              <View style={ms.scanRow}>
                <Ionicons name="barcode-outline" size={18} color={scanFlash?.startsWith('✅') ? WebColors.success : scanFlash ? WebColors.danger : WebColors.textSecondary} />
                <TextInput
                  ref={barcodeRef}
                  style={ms.scanInput}
                  placeholder="สแกนบาร์โค้ด หรือพิมพ์ค้นหา..."
                  placeholderTextColor={WebColors.textDisabled}
                  value={barcodeInput}
                  onChangeText={setBarcodeInput}
                  onSubmitEditing={e => handleBarcode(e.nativeEvent.text)}
                  returnKeyType="done"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {barcodeInput.length > 0 && (
                  <TouchableOpacity onPress={() => setBarcodeInput('')}>
                    <Ionicons name="close-circle" size={16} color={WebColors.textDisabled} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Scan flash */}
              {scanFlash && (
                <View style={[ms.scanFlash, { backgroundColor: scanFlash.startsWith('✅') ? WebColors.successLight : WebColors.dangerLight }]}>
                  <Text style={[ms.scanFlashText, { color: scanFlash.startsWith('✅') ? WebColors.success : WebColors.danger }]}>
                    {scanFlash}
                  </Text>
                </View>
              )}

              {/* Items table header */}
              <View style={ms.itemHead}>
                <Text style={[ms.itemH, { flex: 2 }]}>สินค้า</Text>
                <Text style={[ms.itemH, { width: 80 }]}>หน่วย</Text>
                <Text style={[ms.itemH, { width: 60, textAlign: 'center' }]}>คงเหลือ</Text>
                <Text style={[ms.itemH, { width: 72, textAlign: 'center' }]}>จำนวน</Text>
                <Text style={[ms.itemH, { width: 30 }]}></Text>
              </View>

              {/* Items list */}
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {items.length === 0 ? (
                  <View style={ms.emptyItems}>
                    <Ionicons name="scan-outline" size={32} color={WebColors.border} />
                    <Text style={ms.emptyItemsText}>สแกนบาร์โค้ด หรือกด "+ เพิ่มสินค้า"</Text>
                  </View>
                ) : (
                  items.map((row, idx) => {
                    const masterProd = MOCK_PRODUCTS.find(p => p.id === row.productId);
                    const uomOpts = masterProd?.uoms ?? [];
                    return (
                      <View key={row.rowId} style={[ms.itemRow, idx % 2 === 1 && { backgroundColor: WebColors.gray50 }]}>

                        {/* Product picker */}
                        <View style={{ flex: 2 }}>
                          <TouchableOpacity
                            style={ms.itemProdBtn}
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
                              <View style={{ flex: 1 }}>
                                <Text style={ms.itemProdName} numberOfLines={1}>{row.productName}</Text>
                                <Text style={ms.itemProdCode}>{row.productCode}</Text>
                              </View>
                            ) : (
                              <Text style={[ms.itemProdPlaceholder, { flex: 1 }]}>เลือกสินค้า...</Text>
                            )}
                            <Ionicons name="chevron-down" size={12} color={WebColors.textSecondary} />
                          </TouchableOpacity>
                        </View>

                        {/* UOM picker */}
                        <View style={{ width: 80 }}>
                          <TouchableOpacity
                            style={ms.uomBtn}
                            onPress={() => masterProd && setOpenUomRow(openUomRow === row.rowId ? null : row.rowId)}
                            disabled={!masterProd}
                          >
                            <Text style={ms.uomBtnText} numberOfLines={1}>{row.unit || '—'}</Text>
                            {uomOpts.length > 1 && <Ionicons name="chevron-down" size={11} color={WebColors.textSecondary} />}
                          </TouchableOpacity>
                        </View>

                        {/* คงเหลือ */}
                        <Text style={[ms.itemCell, { width: 60, textAlign: 'center',
                          color: row.onHandQty <= 5 ? WebColors.danger : WebColors.success }]}>
                          {row.productId ? fmtQty(row.onHandQty) : '—'}
                        </Text>

                        {/* จำนวน — inline input */}
                        <View style={[ms.qtyWrap, { width: 72 }]}>
                          <TouchableOpacity style={ms.qBtn} onPress={() => setQty(row.rowId, String(Math.max(0, row.qty - 1)))}>
                            <Ionicons name="remove" size={12} color={WebColors.primary} />
                          </TouchableOpacity>
                          <TextInput
                            style={ms.qInput}
                            value={row.qty > 0 ? String(row.qty) : ''}
                            onChangeText={v => setQty(row.rowId, v)}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor={WebColors.textDisabled}
                            textAlign="center"
                          />
                          <TouchableOpacity style={ms.qBtn} onPress={() => setQty(row.rowId, String(row.qty + 1))}>
                            <Ionicons name="add" size={12} color={WebColors.primary} />
                          </TouchableOpacity>
                        </View>

                        {/* ลบ */}
                        <TouchableOpacity style={ms.delBtn} onPress={() => removeRow(row.rowId)}>
                          <Ionicons name="trash-outline" size={13} color={WebColors.danger} />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}

                {/* Add row button */}
                <TouchableOpacity style={ms.addRowBtn} onPress={addEmptyRow}>
                  <Ionicons name="add-circle-outline" size={15} color={WebColors.primary} />
                  <Text style={ms.addRowText}>+ เพิ่มสินค้า</Text>
                </TouchableOpacity>

                {/* ── Product dropdown panel (แสดงใต้รายการ ไม่ทับซ้อน) ── */}
                {openProdRow && (
                  <View style={ms.inlineDrop}>
                    <View style={ms.inlineDropHeader}>
                      <Text style={ms.inlineDropTitle}>
                        เลือกสินค้า — แถวที่ {items.findIndex(r => r.rowId === openProdRow) + 1}
                      </Text>
                      <TouchableOpacity onPress={() => setOpenProdRow(null)}>
                        <Ionicons name="close" size={16} color={WebColors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={ms.prodSearch}
                      placeholder="ค้นหาชื่อหรือรหัสสินค้า..."
                      placeholderTextColor={WebColors.textDisabled}
                      value={prodSearch}
                      onChangeText={setProdSearch}
                      autoFocus
                    />
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                      {filteredProds.map(p => (
                        <TouchableOpacity
                          key={p.id}
                          style={[ms.prodDropItem,
                            items.find(r => r.rowId === openProdRow)?.productId === p.id && { backgroundColor: WebColors.primaryLight }
                          ]}
                          onPress={() => {
                            setProduct(openProdRow, p, p.uoms[0]);
                            setOpenProdRow(null);
                          }}
                        >
                          <Text style={ms.prodDropCode}>{p.code}</Text>
                          <Text style={ms.prodDropName} numberOfLines={1}>{p.name}</Text>
                          <Text style={ms.prodDropStock}>{p.stockQty} {p.unit}</Text>
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
                    <View style={ms.inlineDrop}>
                      <View style={ms.inlineDropHeader}>
                        <Text style={ms.inlineDropTitle}>เลือกหน่วย — {masterProd.name}</Text>
                        <TouchableOpacity onPress={() => setOpenUomRow(null)}>
                          <Ionicons name="close" size={16} color={WebColors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                      {masterProd.uoms.map(u => (
                        <TouchableOpacity
                          key={u.id}
                          style={[ms.prodDropItem, u.id === row?.uomId && { backgroundColor: WebColors.primaryLight }]}
                          onPress={() => {
                            setUom(openUomRow, masterProd, u);
                            setOpenUomRow(null);
                          }}
                        >
                          <Text style={[ms.prodDropName, { flex: 1, fontWeight: '600' }, u.id === row?.uomId && { color: WebColors.primary }]}>
                            {u.unit}
                          </Text>
                          <Text style={[ms.prodDropCode, { width: 'auto' as any }]}>
                            {u.ratio > 1 ? `1 ${u.unit} = ${u.ratio} ${masterProd.unit}` : 'หน่วยหลัก'}
                          </Text>
                          {u.id === row?.uomId && (
                            <Ionicons name="checkmark" size={14} color={WebColors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                })()}
              </ScrollView>
            </View>

            {/* ── Right: meta ── */}
            <View style={ms.metaPanel}>
              <Text style={ms.metaTitle}>ข้อมูลเอกสาร</Text>

              <Text style={ms.metaLabel}>คลังสินค้า <Text style={{ color: WebColors.danger }}>*</Text></Text>
              <TouchableOpacity style={ms.picker} onPress={() => setShowWhPicker(v => !v)}>
                <Text style={ms.pickerText}>{whName}</Text>
                <Ionicons name={showWhPicker ? 'chevron-up' : 'chevron-down'} size={13} color={WebColors.textSecondary} />
              </TouchableOpacity>
              {showWhPicker && (
                <View style={ms.dropList}>
                  {MOCK_WAREHOUSES.map(w => (
                    <TouchableOpacity key={w.id}
                      style={[ms.dropItem, warehouse === w.id && ms.dropItemActive]}
                      onPress={() => { setWarehouse(w.id); setShowWhPicker(false); }}>
                      <Text style={[ms.dropItemText, warehouse === w.id && ms.dropItemTextActive]}>{w.name}</Text>
                      {warehouse === w.id && <Ionicons name="checkmark" size={13} color={WebColors.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={[ms.metaLabel, { marginTop: 12 }]}>หมายเหตุ</Text>
              <TextInput
                style={[ms.input, { height: 64, textAlignVertical: 'top', paddingTop: 8 }]}
                placeholder="หมายเหตุ..."
                placeholderTextColor={WebColors.textDisabled}
                multiline
                value={remark}
                onChangeText={setRemark}
              />

              {/* Summary */}
              <View style={ms.summaryBox}>
                <View style={ms.summaryRow}>
                  <Text style={ms.summaryLabel}>รายการ</Text>
                  <Text style={ms.summaryVal}>{items.filter(r => r.productId).length} รายการ</Text>
                </View>
                <View style={ms.summaryRow}>
                  <Text style={ms.summaryLabel}>จำนวนรวม (ฐาน)</Text>
                  <Text style={[ms.summaryVal, { color: WebColors.primary, fontWeight: '700' }]}>
                    {fmtQty(totalQty)} หน่วย
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Footer ── */}
          <View style={ms.footer}>
            <TouchableOpacity style={ms.btnCancel} onPress={onClose}>
              <Text style={ms.btnCancelText}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ms.btnDraft, items.filter(r => r.productId && r.qty > 0).length === 0 && { opacity: 0.4 }]}
              disabled={items.filter(r => r.productId && r.qty > 0).length === 0}
              onPress={() => handleSave('draft')}
            >
              <Ionicons name="save-outline" size={14} color="#92400E" />
              <Text style={ms.btnDraftText}>บันทึกแบบร่าง</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ms.btnConfirm, items.filter(r => r.productId && r.qty > 0).length === 0 && { opacity: 0.4 }]}
              disabled={items.filter(r => r.productId && r.qty > 0).length === 0}
              onPress={() => handleSave('confirmed')}
            >
              <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
              <Text style={ms.btnConfirmText}>ยืนยัน{docType === 'receive' ? 'รับสินค้า' : 'เบิกสินค้า'}</Text>
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
      <View style={ms.overlay}>
        <View style={ms.sheet}>
          {/* Header */}
          <View style={ms.header}>
            <View style={ms.headerLeft}>
              <View style={[ms.headerIcon, { backgroundColor: doc.docType === 'receive' ? WebColors.successLight : WebColors.purpleLight }]}>
                <Ionicons
                  name={doc.docType === 'receive' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                  size={20}
                  color={doc.docType === 'receive' ? WebColors.success : WebColors.purple}
                />
              </View>
              <View>
                <Text style={ms.headerTitle}>{doc.docNo}{doc.revNo > 0 ? ` (Rev.${doc.revNo})` : ''}</Text>
                <View style={[dd.badge, { backgroundColor: st.bg }]}>
                  <Text style={[dd.badgeText, { color: st.color }]}>{st.label}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
              <Ionicons name="close" size={20} color={WebColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={ms.body} showsVerticalScrollIndicator={false}>
            {/* Meta grid */}
            <View style={dd.metaGrid}>
              <View style={dd.metaItem}>
                <Text style={dd.metaLabel}>ประเภทเอกสาร</Text>
                <Text style={dd.metaValue}>{doc.docType === 'receive' ? 'ใบรับสินค้า' : 'ใบเบิกสินค้า'}</Text>
              </View>
              <View style={dd.metaItem}>
                <Text style={dd.metaLabel}>วันที่สร้าง</Text>
                <Text style={dd.metaValue}>{doc.createdAt.toLocaleDateString('th-TH')}</Text>
              </View>
              <View style={dd.metaItem}>
                <Text style={dd.metaLabel}>คลังสินค้า</Text>
                <Text style={dd.metaValue}>{doc.warehouseName}</Text>
              </View>
              {doc.supplierName && (
                <View style={dd.metaItem}>
                  <Text style={dd.metaLabel}>Supplier</Text>
                  <Text style={dd.metaValue}>{doc.supplierName}</Text>
                </View>
              )}
              {doc.toWarehouseName && (
                <View style={dd.metaItem}>
                  <Text style={dd.metaLabel}>ปลายทาง</Text>
                  <Text style={dd.metaValue}>{doc.toWarehouseName}</Text>
                </View>
              )}
              {doc.remark && (
                <View style={[dd.metaItem, { flexBasis: '100%' }]}>
                  <Text style={dd.metaLabel}>หมายเหตุ</Text>
                  <Text style={dd.metaValue}>{doc.remark}</Text>
                </View>
              )}
              {doc.confirmedBy && (
                <View style={dd.metaItem}>
                  <Text style={dd.metaLabel}>ยืนยันโดย</Text>
                  <Text style={dd.metaValue}>{doc.confirmedBy}</Text>
                </View>
              )}
            </View>

            {/* Items table */}
            <Text style={dd.sectionTitle}>รายการสินค้า</Text>
            <View style={dd.table}>
              <View style={dd.thead}>
                {[['รหัส', 0.8], ['ชื่อสินค้า', 2], ['จำนวน', 0.8], ['หน่วย', 0.8], ['ราคา/หน่วย', 1], ['รวม', 1]].map(([h, f]) => (
                  <Text key={String(h)} style={[dd.th, { flex: Number(f) }]}>{h}</Text>
                ))}
              </View>
              {doc.items.map((item, idx) => (
                <View key={item.id} style={[dd.tr, idx % 2 === 1 && dd.trAlt]}>
                  <Text style={[dd.td, { flex: 0.8, fontWeight: '600' }]}>{item.productCode}</Text>
                  <Text style={[dd.td, { flex: 2 }]} numberOfLines={1}>{item.productName}</Text>
                  <Text style={[dd.td, { flex: 0.8 }]}>{item.qty}</Text>
                  <Text style={[dd.td, { flex: 0.8 }]}>{item.unit}</Text>
                  <Text style={[dd.td, { flex: 1 }]}>฿{fmt(item.costPrice)}</Text>
                  <Text style={[dd.td, { flex: 1, color: WebColors.primary, fontWeight: '700' }]}>
                    ฿{fmt(item.qty * item.costPrice)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Total */}
            <View style={dd.totalRow}>
              <Text style={dd.totalLabel}>รายการทั้งหมด {doc.totalItems} รายการ</Text>
              <Text style={dd.totalValue}>ยอดรวม ฿{fmt(doc.totalCost)}</Text>
            </View>

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Footer */}
          <View style={ms.footer}>
            <TouchableOpacity style={ms.btnCancel} onPress={onClose}>
              <Text style={ms.btnCancelText}>ปิด</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ms.btnDraft, { flexDirection: 'row', gap: 4 }]} onPress={() => { /* print stub */ }}>
              <Ionicons name="print-outline" size={14} color={WebColors.textSecondary} />
              <Text style={[ms.btnCancelText, { color: WebColors.textSecondary }]}>พิมพ์</Text>
            </TouchableOpacity>
            {doc.status === 'draft' && (
              <>
                <TouchableOpacity
                  style={[ms.btnDraft, { borderColor: WebColors.danger }]}
                  onPress={() => { cancelDocument(doc.id); onClose(); }}
                >
                  <Ionicons name="close-circle-outline" size={14} color={WebColors.danger} />
                  <Text style={[ms.btnDraftText, { color: WebColors.danger }]}>ยกเลิก</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={ms.btnConfirm}
                  onPress={() => { confirmDocument(doc.id, 'ผู้ใช้งาน'); onClose(); }}
                >
                  <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
                  <Text style={ms.btnConfirmText}>ยืนยัน</Text>
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
    <View style={s.table}>
      <View style={s.thead}>
        {[
          ['เลขที่',  1.4],
          ['ประเภท',  0.7],
          ['คลัง',    1  ],
          ['รายการ',  0.6],
          ['สถานะ',   0.8],
          ['วันที่',  1.1],
          ['จัดการ',  0.9],
        ].map(([h, f]) => (
          <Text key={String(h)} style={[s.th, { flex: Number(f) }]}>{h}</Text>
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
            <View style={[s.tr, index % 2 === 1 && s.trAlt]}>
              {/* เลขที่ */}
              <View style={{ flex: 1.4 }}>
                <Text style={s.tdBold}>{d.docNo}</Text>
                {d.revNo > 0 && (
                  <Text style={[s.tdSub, { color: WebColors.primary }]}>Rev.{d.revNo}</Text>
                )}
              </View>
              {/* ประเภท */}
              <View style={{ flex: 0.7, justifyContent: 'center' }}>
                <View style={[s.badge, { backgroundColor: d.docType === 'receive' ? WebColors.successLight : WebColors.purpleLight }]}>
                  <Text style={[s.badgeText, { color: d.docType === 'receive' ? WebColors.success : WebColors.purple }]}>
                    {d.docType === 'receive' ? '↓ รับ' : '↑ เบิก'}
                  </Text>
                </View>
              </View>
              {/* คลัง */}
              <Text style={[s.td, { flex: 1 }]} numberOfLines={1}>{d.warehouseName}</Text>
              {/* รายการ / จำนวน */}
              <View style={{ flex: 0.6, justifyContent: 'center' }}>
                <Text style={[s.tdBold, { textAlign: 'center' }]}>{d.totalItems}</Text>
                <Text style={[s.tdSub, { textAlign: 'center' }]}>{d.totalQtyBase} ชิ้น</Text>
              </View>
              {/* สถานะ */}
              <View style={{ flex: 0.8, justifyContent: 'center' }}>
                <View style={[s.badge, { backgroundColor: st.bg }]}>
                  <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
                </View>
              </View>
              {/* วันที่ */}
              <Text style={[s.td, { flex: 1.1, fontSize: 15 }]}>
                {d.createdAt.toLocaleDateString('th-TH')}
                {'\n'}{d.createdAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {/* จัดการ */}
              <View style={[s.tdActions, { flex: 0.9 }]}>
                {/* ดู */}
                <TouchableOpacity style={s.actionBtn} onPress={() => onView(d.id)}>
                  <Ionicons name="eye-outline" size={13} color={WebColors.primary} />
                </TouchableOpacity>
                {/* แก้ไข — draft เท่านั้น */}
                {isDraft && (
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: '#FEF3C7' }]}
                    onPress={() => onEdit(d.id, d.docType)}
                  >
                    <Ionicons name="pencil-outline" size={13} color="#92400E" />
                  </TouchableOpacity>
                )}
                {/* ลบ / ยกเลิก — draft เท่านั้น */}
                {isDraft && (
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: '#FEE2E2' }]}
                    onPress={() => cancelDocument(d.id)}
                  >
                    <Ionicons name="trash-outline" size={13} color={WebColors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="document-outline" size={40} color={WebColors.border} />
            <Text style={s.emptyText}>ไม่มีเอกสาร</Text>
          </View>
        }
      />
    </View>
  );
};

// ─── WebInventoryScreen ──────────────────────────────────────────────────────
export const WebInventoryScreen: React.FC = () => {
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
    <View style={s.root}>
      {/* KPI */}
      <View style={s.kpiRow}>
        {[
          { label: 'มูลค่าสต๊อกรวม',   value: `฿${fmt(totalValue)}`, icon: 'archive-outline',       color: WebColors.primary },
          { label: 'จำนวน SKU',         value: `${MOCK_STOCK_ITEMS.length}`, icon: 'cube-outline',   color: WebColors.success },
          { label: 'ใกล้หมด',           value: String(lowCount),       icon: 'warning-outline',      color: '#F59E0B' },
          { label: 'หมดสต๊อก',          value: String(outCount),       icon: 'close-circle-outline', color: WebColors.danger },
          { label: 'เอกสารวันนี้',      value: String(documents.length), icon: 'document-text-outline', color: '#7C3AED' },
        ].map((k, i) => (
          <View key={i} style={[s.kpiCard, { borderTopColor: k.color }]}>
            <View style={[s.kpiIcon, { backgroundColor: k.color + '15' }]}>
              <Ionicons name={k.icon as any} size={20} color={k.color} />
            </View>
            <View>
              <Text style={s.kpiLabel}>{k.label}</Text>
              <Text style={[s.kpiValue, { color: k.color }]}>{k.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[s.tab, tab === t.key && s.tabActive]} onPress={() => setTab(t.key)}>
            <Ionicons name={t.icon as any} size={15} color={tab === t.key ? WebColors.primary : WebColors.textSecondary} />
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={15} color={WebColors.textSecondary} />
          <TextInput
            style={s.searchInput}
            placeholder="ค้นหาสินค้า รหัส..."
            placeholderTextColor={WebColors.textDisabled}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {(tab === 'receive' || tab === 'issue') && (
          <TouchableOpacity
            style={s.createBtn}
            onPress={() => {
              setCreateType(tab === 'receive' ? 'receive' : 'issue');
              setShowCreateModal(true);
            }}
          >
            <Ionicons name="add" size={15} color="#fff" />
            <Text style={s.createBtnText}>{tab === 'receive' ? 'สร้างใบรับ' : 'สร้างใบเบิก'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Stock table ── */}
      {tab === 'stock' && (
        <View style={s.table}>
          <View style={s.thead}>
            {[['รหัส',0.8],['ชื่อสินค้า',2],['หมวด',0.9],['คลัง',0.9],['คงเหลือ',0.9],['ขั้นต่ำ',0.7],['มูลค่า',1],['สถานะ',0.8]].map(([h,f]) => (
              <Text key={String(h)} style={[s.th, { flex: Number(f) }]}>{h}</Text>
            ))}
          </View>
          <FlatList
            data={filteredStock} keyExtractor={(i,idx) => `${i.productCode}-${idx}`}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: i, index }) => {
              const stColor = i.status === 'ok' ? WebColors.success : i.status === 'low' ? '#F59E0B' : WebColors.danger;
              const stLabel = i.status === 'ok' ? 'ปกติ' : i.status === 'low' ? 'ใกล้หมด' : i.status === 'out' ? 'หมด' : 'Dead';
              const pct     = i.minStock > 0 ? Math.min(100, (i.onHandQty / i.minStock) * 100) : 100;
              return (
                <View style={[s.tr, index % 2 === 1 && s.trAlt]}>
                  <Text style={[s.td, { flex: 0.8, fontWeight: '600' }]}>{i.productCode}</Text>
                  <View style={[{ flex: 2 }]}>
                    <Text style={s.tdBold} numberOfLines={1}>{i.productName}</Text>
                    <View style={s.miniBar}>
                      <View style={[s.miniBarFill, { width: `${pct}%` as any, backgroundColor: stColor }]} />
                    </View>
                  </View>
                  <Text style={[s.td, { flex: 0.9 }]}>{i.categoryName}</Text>
                  <Text style={[s.td, { flex: 0.9 }]} numberOfLines={1}>{i.warehouseName}</Text>
                  <Text style={[s.td, { flex: 0.9, fontWeight: '700', color: i.onHandQty <= i.minStock ? WebColors.danger : WebColors.text }]}>
                    {i.onHandQty} {i.unit}
                  </Text>
                  <Text style={[s.td, { flex: 0.7 }]}>{i.minStock}</Text>
                  <Text style={[s.td, { flex: 1, color: WebColors.primary }]}>฿{i.inventoryValue.toLocaleString()}</Text>
                  <View style={{ flex: 0.8, justifyContent: 'center' }}>
                    <View style={[s.badge, { backgroundColor: stColor + '18' }]}>
                      <Text style={[s.badgeText, { color: stColor }]}>{stLabel}</Text>
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

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, gap: 12 },
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpiCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 3, borderWidth: 1, borderColor: WebColors.border },
  kpiIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  kpiLabel: { fontSize: 15, color: WebColors.textSecondary },
  kpiValue: { fontSize: 19, fontWeight: '800' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: WebColors.border, overflow: 'hidden' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  tabActive: { backgroundColor: WebColors.primaryLight },
  tabText: { fontSize: 15, color: WebColors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: WebColors.primary, fontWeight: '700' },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: WebColors.border, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, fontSize: 13, color: WebColors.text },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: WebColors.primary, borderRadius: 8, paddingHorizontal: 16, height: 40 },
  createBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  table: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: WebColors.border },
  thead: { flexDirection: 'row', backgroundColor: WebColors.gray50, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: WebColors.border },
  th: { fontSize: 15, fontWeight: '700', color: WebColors.textSecondary, textTransform: 'uppercase' },
  tr: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: WebColors.border, alignItems: 'center' },
  trAlt: { backgroundColor: WebColors.gray50 },
  td: { flex: 1, fontSize: 13, color: WebColors.text },
  tdBold: { fontSize: 13, fontWeight: '600', color: WebColors.text },
  tdSub: { fontSize: 14, color: WebColors.textSecondary, marginTop: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 15, fontWeight: '700' },
  tdActions: { flexDirection: 'row', gap: 5, justifyContent: 'flex-end' },
  actionBtn: { width: 26, height: 26, borderRadius: 6, backgroundColor: WebColors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  miniBar: { height: 3, backgroundColor: WebColors.gray100, borderRadius: 2, marginTop: 3, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 2 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 13, color: WebColors.textSecondary },
});

// Modal shared styles
const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    width: '90%',
    maxWidth: 680,
    maxHeight: '88%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: WebColors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: WebColors.text },
  closeBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: WebColors.gray100,
    alignItems: 'center', justifyContent: 'center',
  },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  label: { fontSize: 15, fontWeight: '600', color: WebColors.textSecondary, marginBottom: 4, marginTop: 12 },
  required: { color: WebColors.danger },
  input: {
    borderWidth: 1, borderColor: WebColors.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 9,
    fontSize: 13, color: WebColors.text, backgroundColor: '#fff',
  },
  picker: {
    borderWidth: 1, borderColor: WebColors.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 9,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  pickerText: { fontSize: 13, color: WebColors.text },
  dropList: {
    borderWidth: 1, borderColor: WebColors.border, borderRadius: 8,
    marginTop: 2, backgroundColor: '#fff',
    ...Platform.select({ web: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } as any }),
  },
  dropItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: WebColors.gray100,
  },
  dropItemActive: { backgroundColor: WebColors.primaryLight },
  dropItemText: { fontSize: 13, color: WebColors.text },
  dropItemTextActive: { color: WebColors.primary, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 20, marginBottom: 8,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: WebColors.text },
  addItemBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 6, borderWidth: 1, borderColor: WebColors.primary,
  },
  addItemText: { fontSize: 15, color: WebColors.primary, fontWeight: '600' },
  emptyItems: {
    alignItems: 'center', paddingVertical: 24, gap: 8,
    borderWidth: 1, borderColor: WebColors.border, borderRadius: 8,
    borderStyle: 'dashed',
  },
  emptyItemsText: { fontSize: 13, color: WebColors.textSecondary },
  itemRow: {
    borderWidth: 1, borderColor: WebColors.border, borderRadius: 8,
    marginBottom: 8, padding: 10, backgroundColor: WebColors.gray50,
  },
  itemProductBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemProductText: { fontSize: 13, color: WebColors.text, fontWeight: '600' },
  itemProductPlaceholder: { fontSize: 13, color: WebColors.textDisabled },
  prodDropList: {
    borderWidth: 1, borderColor: WebColors.border, borderRadius: 8,
    backgroundColor: '#fff', marginBottom: 8,
  },
  prodDropItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: WebColors.gray100,
  },
  prodDropCode: { fontSize: 15, color: WebColors.textSecondary, width: 44 },
  prodDropName: { flex: 1, fontSize: 13, color: WebColors.text },
  prodDropUnit: { fontSize: 15, color: WebColors.textSecondary },
  itemFields: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemFieldGroup: { flex: 1 },
  itemFieldLabel: { fontSize: 14, color: WebColors.textSecondary, marginBottom: 3, fontWeight: '600' },
  itemInput: {
    borderWidth: 1, borderColor: WebColors.border, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 6,
    fontSize: 13, color: WebColors.text, backgroundColor: '#fff',
  },
  unitDisplay: {
    justifyContent: 'center',
    backgroundColor: WebColors.gray100,
  },
  unitDisplayText: { fontSize: 13, color: WebColors.textSecondary },
  removeBtn: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center',
  },
  summary: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: WebColors.primaryLight, borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 10, marginTop: 8,
  },
  summaryLabel: { fontSize: 13, color: WebColors.primary, fontWeight: '600' },
  summaryValue: { fontSize: 17, fontWeight: '800', color: WebColors.primary },
  footer: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: WebColors.border,
    justifyContent: 'flex-end',
  },
  btnCancel: {
    borderRadius: 8, borderWidth: 1, borderColor: WebColors.border,
    paddingHorizontal: 16, paddingVertical: 9,
  },
  btnCancelText: { fontSize: 13, color: WebColors.textSecondary, fontWeight: '600' },
  btnDraft: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 8, borderWidth: 1, borderColor: '#F59E0B',
    paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#FFFBEB',
  },
  btnDraftText: { fontSize: 13, color: '#92400E', fontWeight: '600' },
  btnConfirm: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 8, backgroundColor: WebColors.primary,
    paddingHorizontal: 16, paddingVertical: 9,
  },
  btnConfirmText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  // ── New styles for redesigned modal ──────────────────────────────────────
  // Sheet ใหญ่ขึ้น สำหรับ layout split
  sheetLarge: {
    width: '95%', maxWidth: 900,
    height: '90%' as any,
    backgroundColor: '#fff', borderRadius: 16,
    overflow: 'hidden' as any,
    flexDirection: 'column',
  },
  // Barcode scan
  scanRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: WebColors.border,
    backgroundColor: '#FAFAFA',
  },
  scanInput: {
    flex: 1, fontSize: 13, color: WebColors.text, height: 36,
  },
  scanFlash: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderBottomWidth: 1, borderBottomColor: WebColors.border,
  },
  scanFlashText: { fontSize: 15, fontWeight: '700' },
  // Items table
  itemHead: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 7,
    backgroundColor: WebColors.gray50,
    borderBottomWidth: 1, borderBottomColor: WebColors.border,
  },
  itemH: { fontSize: 14, fontWeight: '700', color: WebColors.textSecondary, textTransform: 'uppercase' },
  itemRowAlt: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: WebColors.border,
  },
  itemCell: { fontSize: 13, color: WebColors.text },
  // Product picker in row
  itemProdBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 6, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1, borderColor: WebColors.border,
    backgroundColor: '#fff', marginRight: 4,
  },
  itemProdName: { fontSize: 15, fontWeight: '600', color: WebColors.text },
  itemProdCode: { fontSize: 14, color: WebColors.textSecondary },
  itemProdPlaceholder: { fontSize: 15, color: WebColors.textDisabled },
  // Product dropdown
  prodDrop: {
    position: 'absolute' as any, top: 32, left: 0, right: 0, zIndex: 999,
    backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: WebColors.border,
    ...Platform.select({ web: { boxShadow: '0 4px 16px rgba(0,0,0,0.15)' } as any }),
  },
  prodSearch: {
    borderBottomWidth: 1, borderBottomColor: WebColors.border,
    paddingHorizontal: 10, paddingVertical: 7,
    fontSize: 13, color: WebColors.text,
  },
  prodDropItemAlt: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: WebColors.gray100,
  },
  prodDropCodeAlt: { fontSize: 14, color: WebColors.textSecondary, width: 40 },
  prodDropNameAlt: { flex: 1, fontSize: 13, color: WebColors.text },
  prodDropStock: { fontSize: 15, color: WebColors.success },
  // UOM picker
  uomBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1, borderColor: WebColors.border,
    backgroundColor: WebColors.primaryLight, marginRight: 4,
  },
  uomBtnText: { fontSize: 15, color: WebColors.primary, fontWeight: '600' },
  // Qty control
  qtyWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: WebColors.border, borderRadius: 6,
    overflow: 'hidden' as any, marginRight: 4,
  },
  qBtn: {
    width: 22, height: 28,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: WebColors.primaryLight,
  },
  qInput: {
    width: 28, height: 28, fontSize: 13, fontWeight: '700',
    color: WebColors.text, textAlign: 'center',
    backgroundColor: '#fff',
  },
  delBtn: {
    width: 26, height: 26, borderRadius: 6,
    backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center',
  },
  addRowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: WebColors.border,
  },
  addRowText: { fontSize: 13, color: WebColors.primary, fontWeight: '600' },
  // Inline dropdown panel (แสดงใต้ items ไม่ทับซ้อน)
  inlineDrop: {
    marginHorizontal: 8, marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 10, borderWidth: 1.5, borderColor: WebColors.primary,
    overflow: 'hidden' as any,
  },
  inlineDropHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: WebColors.primaryLight,
    borderBottomWidth: 1, borderBottomColor: WebColors.primary + '30',
  },
  inlineDropTitle: { fontSize: 15, fontWeight: '700', color: WebColors.primary },
  // Right meta panel
  metaPanel: {
    width: 220, padding: 14,
    backgroundColor: WebColors.gray50,
    gap: 4,
  },
  metaTitle: { fontSize: 13, fontWeight: '700', color: WebColors.text, marginBottom: 8 },
  metaLabel: { fontSize: 15, fontWeight: '700', color: WebColors.textSecondary, marginTop: 8 },
  // Summary box
  summaryBox: {
    backgroundColor: '#fff', borderRadius: 8,
    borderWidth: 1, borderColor: WebColors.border,
    padding: 10, gap: 6, marginTop: 12,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLbl: { fontSize: 15, color: WebColors.textSecondary },
  summaryVal: { fontSize: 13, color: WebColors.text },
});

// DocDetailModal styles
const dd = StyleSheet.create({
  badge: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 2 },
  badgeText: { fontSize: 14, fontWeight: '700' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  metaItem: { flexBasis: '47%' },
  metaLabel: { fontSize: 15, color: WebColors.textSecondary, marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: '600', color: WebColors.text },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: WebColors.text, marginBottom: 8 },
  table: { borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, overflow: 'hidden', marginBottom: 12 },
  thead: { flexDirection: 'row', backgroundColor: WebColors.gray50, paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: WebColors.border },
  th: { fontSize: 15, fontWeight: '700', color: WebColors.textSecondary, textTransform: 'uppercase' },
  tr: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: WebColors.border, alignItems: 'center' },
  trAlt: { backgroundColor: WebColors.gray50 },
  td: { flex: 1, fontSize: 13, color: WebColors.text },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: WebColors.primaryLight, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  totalLabel: { fontSize: 15, color: WebColors.textSecondary },
  totalValue: { fontSize: 15, fontWeight: '800', color: WebColors.primary },
});
