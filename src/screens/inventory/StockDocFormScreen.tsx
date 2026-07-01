/**
 * StockDocFormScreen — หน้ารับ/เบิกสินค้า (ใช้ร่วมกัน)
 * SCR-INV-001 (receive) + SCR-INV-002 (issue)
 * รองรับ: สร้างใหม่ | แก้ไข draft
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, FlatList, KeyboardAvoidingView, Platform,
  Vibration, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DocType, StockDocItem, StockDocument } from '../../types/stockDocument';
import { useStockDocStore } from '../../store/stockDocStore';
import { ProductSearchDropdown, SelectedProductUOM } from '../../components/inventory/ProductSearchDropdown';
import { MOCK_WAREHOUSES, MOCK_SUPPLIERS } from '../../data/mockInventory';
import { MOCK_PRODUCTS } from '../../data/mockProducts';
import { findProductByBarcode } from '../../data/mockProducts';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency, formatDateTime } from '../../utils/format';

interface Props {
  docType: DocType;
  editDocId?: string;   // ถ้ามี = edit mode
  onBack: () => void;
  onSaved: (doc: StockDocument) => void;
}

const genItemId = () => `item_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;

// ─── Item Row ──────────────────────────────────────────────────────────────────
interface ItemRowProps {
  item: StockDocItem;
  docType: DocType;
  onQtyChange: (id: string, qty: number) => void;
  onCostChange: (id: string, cost: number) => void;
  onRemove: (id: string) => void;
  isNew?: boolean;
}

const ItemRow: React.FC<ItemRowProps> = ({ item, docType, onQtyChange, onCostChange, onRemove, isNew }) => {
  const [qtyText, setQtyText] = useState(String(item.qty || ''));
  const [costText, setCostText] = useState(String(item.costPrice || ''));
  const isOverStock = docType === 'issue' && item.qty * item.ratio > item.onHandQty;

  return (
    <View style={[rowStyles.row, isNew && rowStyles.rowNew, isOverStock && rowStyles.rowError]}>
      {/* Product info */}
      <View style={rowStyles.productSection}>
        <View style={rowStyles.productLeft}>
          <View style={[rowStyles.unitPill, item.ratio > 1 && { backgroundColor: Colors.warningLight }]}>
            <Text style={[rowStyles.unitText, item.ratio > 1 && { color: Colors.warning }]}>{item.unit}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={rowStyles.productName} numberOfLines={1}>{item.productName}</Text>
            <Text style={rowStyles.productMeta}>{item.productCode}</Text>
          </View>
        </View>
        <TouchableOpacity style={rowStyles.removeBtn} onPress={() => onRemove(item.id)}>
          <Ionicons name="close-circle" size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      {/* Controls row */}
      <View style={rowStyles.controlRow}>
        {/* Stock info */}
        <View style={rowStyles.stockInfo}>
          <Text style={rowStyles.stockLabel}>คงเหลือ</Text>
          <Text style={[rowStyles.stockValue, item.onHandQty <= 0 && { color: Colors.danger }]}>
            {item.ratio > 1
              ? `${Math.floor(item.onHandQty / item.ratio)} ${item.unit}`
              : `${item.onHandQty} ${item.unit}`}
          </Text>
        </View>

        {/* Qty */}
        <View style={rowStyles.qtyBox}>
          <TouchableOpacity
            style={rowStyles.qtyBtn}
            onPress={() => {
              const n = Math.max(0, item.qty - 1);
              setQtyText(String(n));
              onQtyChange(item.id, n);
            }}
          >
            <Ionicons name="remove" size={14} color={Colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={[rowStyles.qtyInput, isOverStock && { borderColor: Colors.danger }]}
            value={qtyText}
            onChangeText={(v) => {
              setQtyText(v);
              const n = parseFloat(v) || 0;
              onQtyChange(item.id, n);
            }}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
          <TouchableOpacity
            style={rowStyles.qtyBtn}
            onPress={() => {
              const n = item.qty + 1;
              setQtyText(String(n));
              onQtyChange(item.id, n);
            }}
          >
            <Ionicons name="add" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Cost (receive only) */}
        {docType === 'receive' && (
          <View style={rowStyles.costBox}>
            <Text style={rowStyles.costLabel}>ราคา/หน่วย</Text>
            <TextInput
              style={rowStyles.costInput}
              value={costText}
              onChangeText={(v) => {
                setCostText(v);
                onCostChange(item.id, parseFloat(v) || 0);
              }}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
          </View>
        )}

        {/* Subtotal */}
        <View style={rowStyles.subtotalBox}>
          <Text style={rowStyles.subtotalLabel}>{docType === 'receive' ? 'มูลค่า' : 'ฐาน'}</Text>
          <Text style={rowStyles.subtotalValue}>
            {docType === 'receive'
              ? `฿${formatCurrency(item.qty * item.costPrice)}`
              : `${item.qty * item.ratio} ${MOCK_PRODUCTS.find(p => p.id === item.productId)?.unit ?? ''}`}
          </Text>
        </View>
      </View>

      {/* Over-stock warning */}
      {isOverStock && (
        <View style={rowStyles.overStockWarn}>
          <Ionicons name="warning-outline" size={12} color={Colors.danger} />
          <Text style={rowStyles.overStockText}>
            สต๊อกไม่พอ (ต้องการ {item.qty * item.ratio} มีแค่ {item.onHandQty})
          </Text>
        </View>
      )}

      {/* Ratio info */}
      {item.ratio > 1 && (
        <Text style={rowStyles.ratioInfo}>
          {item.qty} {item.unit} = {item.qty * item.ratio} {MOCK_PRODUCTS.find(p => p.id === item.productId)?.unit ?? ''}
        </Text>
      )}
    </View>
  );
};

const rowStyles = StyleSheet.create({
  row: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.sm, gap: Spacing.xs,
  },
  rowNew: { borderColor: Colors.primary, borderWidth: 1.5, backgroundColor: Colors.primaryLight + '40' },
  rowError: { borderColor: Colors.danger },
  productSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  unitPill: { backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm, paddingHorizontal: 7, paddingVertical: 3, minWidth: 44, alignItems: 'center' },
  unitText: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  productName: { ...Typography.label, color: Colors.text, flex: 1 },
  productMeta: { ...Typography.caption, color: Colors.textSecondary },
  removeBtn: { padding: 4 },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stockInfo: { flex: 1 },
  stockLabel: { fontSize: 9, color: Colors.textSecondary, fontWeight: '500' },
  stockValue: { ...Typography.caption, color: Colors.success, fontWeight: '700' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  qtyBtn: { width: 28, height: 32, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary },
  qtyInput: { width: 50, height: 32, textAlign: 'center', backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.sm, borderWidth: 1.5, borderColor: Colors.border, ...Typography.label, color: Colors.text },
  costBox: { flex: 1.2 },
  costLabel: { fontSize: 9, color: Colors.textSecondary },
  costInput: { height: 32, backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.sm, ...Typography.caption, color: Colors.text, textAlign: 'right' },
  subtotalBox: { alignItems: 'flex-end' },
  subtotalLabel: { fontSize: 9, color: Colors.textSecondary },
  subtotalValue: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },
  overStockWarn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.sm, padding: 4 },
  overStockText: { fontSize: 10, color: Colors.danger },
  ratioInfo: { fontSize: 10, color: Colors.textSecondary, fontStyle: 'italic' },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
export const StockDocFormScreen: React.FC<Props> = ({ docType, editDocId, onBack, onSaved }) => {
  const { addDocument, updateDocument, getDocById } = useStockDocStore();
  const editDoc = editDocId ? getDocById(editDocId) : undefined;
  const isEdit = !!editDoc;
  const isReceive = docType === 'receive';

  // Form state
  const [warehouseId, setWarehouseId] = useState(editDoc?.warehouseId ?? 'wh1');
  const [supplierId, setSupplierId]   = useState(editDoc?.supplierId ?? '');
  const [toWarehouseId, setToWarehouseId] = useState(editDoc?.toWarehouseId ?? '');
  const [remark, setRemark]           = useState(editDoc?.remark ?? '');
  const [items, setItems]             = useState<StockDocItem[]>(editDoc?.items ?? []);
  const [saving, setSaving]           = useState(false);
  const [newItemHighlight, setNewItemHighlight] = useState<string | null>(null);

  // Add product dropdown
  const [selectedProduct, setSelectedProduct] = useState<SelectedProductUOM | null>(null);

  // Scanner
  const [scanInput, setScanInput]   = useState('');
  const [scanMode, setScanMode]     = useState(false);
  const scanRef = useRef<TextInput>(null);
  const [lastScan, setLastScan]     = useState<{ name: string; qty: number; status: 'ok' | 'err' } | null>(null);

  const warehouseName = MOCK_WAREHOUSES.find(w => w.id === warehouseId)?.name ?? '';
  const supplierName  = MOCK_SUPPLIERS.find(s => s.id === supplierId)?.name ?? '';
  const toWarehouseName = MOCK_WAREHOUSES.find(w => w.id === toWarehouseId)?.name ?? '';

  const warehouses = MOCK_WAREHOUSES.filter(w => isReceive ? w.type === 'main' : true);
  const toWarehouses = MOCK_WAREHOUSES.filter(w => w.id !== warehouseId);

  // ── Add item from dropdown ──
  const handleAddFromDropdown = () => {
    if (!selectedProduct) return;
    const existing = items.find(i => i.productId === selectedProduct.productId && i.uomId === selectedProduct.uomId);
    if (existing) {
      // เพิ่มจำนวน
      setItems(prev => prev.map(i =>
        i.id === existing.id
          ? { ...i, qty: i.qty + 1, qtyBase: (i.qty + 1) * i.ratio }
          : i
      ));
      setNewItemHighlight(existing.id);
    } else {
      const newItem: StockDocItem = {
        id: genItemId(),
        productId: selectedProduct.productId,
        productCode: selectedProduct.productCode,
        productName: selectedProduct.productName,
        uomId: selectedProduct.uomId,
        unit: selectedProduct.unit,
        ratio: selectedProduct.ratio,
        onHandQty: selectedProduct.onHandQty,
        qty: 1,
        qtyBase: selectedProduct.ratio,
        costPrice: selectedProduct.costPrice,
      };
      setItems(prev => [...prev, newItem]);
      setNewItemHighlight(newItem.id);
    }
    setSelectedProduct(null);
    setTimeout(() => setNewItemHighlight(null), 1500);
  };

  // ── Scan barcode ──
  const handleScan = useCallback((barcode: string) => {
    if (!barcode.trim()) return;
    const result = findProductByBarcode(barcode.trim(), MOCK_PRODUCTS);
    if (!result) {
      setLastScan({ name: 'ไม่พบสินค้า: ' + barcode, qty: 0, status: 'err' });
      Vibration.vibrate([0, 80, 40, 80]);
      setScanInput('');
      return;
    }
    const { product, uom } = result;
    const stockItem = MOCK_SUPPLIERS; // placeholder — ใช้ mock stock แทน
    // หา onHandQty
    const { MOCK_STOCK } = require('../../data/mockInventory');
    const onHand = (MOCK_STOCK as any[]).find((s: any) => s.productId === product.id && s.warehouseId === warehouseId)?.onHandQty ?? 0;

    const existing = items.find(i => i.productId === product.id && i.uomId === uom.id);
    if (existing) {
      const newQty = existing.qty + 1;
      setItems(prev => prev.map(i =>
        i.id === existing.id
          ? { ...i, qty: newQty, qtyBase: newQty * i.ratio }
          : i
      ));
      setLastScan({ name: product.name + ` (${uom.unit})`, qty: newQty, status: 'ok' });
      setNewItemHighlight(existing.id);
    } else {
      const newItem: StockDocItem = {
        id: genItemId(),
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        uomId: uom.id,
        unit: uom.unit,
        ratio: uom.ratio,
        onHandQty: onHand,
        qty: 1,
        qtyBase: uom.ratio,
        costPrice: uom.costPrice,
      };
      setItems(prev => [...prev, newItem]);
      setLastScan({ name: product.name + ` (${uom.unit})`, qty: 1, status: 'ok' });
      setNewItemHighlight(newItem.id);
    }
    Vibration.vibrate(60);
    setScanInput('');
    setTimeout(() => { setNewItemHighlight(null); setLastScan(null); }, 2000);
  }, [items, warehouseId]);

  // ── Update qty/cost ──
  const handleQtyChange = (id: string, qty: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty, qtyBase: qty * i.ratio } : i));
  };
  const handleCostChange = (id: string, cost: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, costPrice: cost } : i));
  };
  const handleRemove = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // ── Validation ──
  const validate = (): string | null => {
    if (!warehouseId) return 'กรุณาเลือกคลังสินค้า';
    if (!isReceive && !toWarehouseId) return 'กรุณาเลือกคลังปลายทาง';
    if (items.length === 0) return 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ';
    if (items.some(i => i.qty <= 0)) return 'จำนวนสินค้าต้องมากกว่า 0';
    const overStock = isReceive ? null : items.find(i => i.qty * i.ratio > i.onHandQty);
    if (overStock) return `สต๊อกไม่พอ: ${overStock.productName}`;
    return null;
  };

  // ── Save ──
  const handleSave = (asDraft = false) => {
    if (!asDraft) {
      const err = validate();
      if (err) { Alert.alert('ข้อมูลไม่ครบ', err); return; }
    }
    setSaving(true);
    setTimeout(() => {
      const docData = {
        docType,
        status: (asDraft ? 'draft' : 'confirmed') as any,
        warehouseId,
        warehouseName,
        supplierId: isReceive ? supplierId : undefined,
        supplierName: isReceive ? supplierName : undefined,
        toWarehouseId: !isReceive ? toWarehouseId : undefined,
        toWarehouseName: !isReceive ? toWarehouseName : undefined,
        remark,
        revNo: 1,
        items,
        totalItems: items.length,
        totalQtyBase: items.reduce((s, i) => s + i.qtyBase, 0),
        totalCost: items.reduce((s, i) => s + i.qty * i.costPrice, 0),
        createdBy: 'พนักงาน',
        confirmedBy: asDraft ? undefined : 'พนักงาน',
        confirmedAt: asDraft ? undefined : new Date(),
      };
      let saved: StockDocument;
      if (isEdit && editDocId) {
        updateDocument(editDocId, docData);
        saved = { ...editDoc!, ...docData };
      } else {
        saved = addDocument(docData);
      }
      setSaving(false);
      onSaved(saved);
    }, 600);
  };

  // Summary
  const totalItems = items.length;
  const totalQtyBase = items.reduce((s, i) => s + i.qtyBase, 0);
  const totalCost = items.reduce((s, i) => s + i.qty * i.costPrice, 0);
  const hasOverStock = !isReceive && items.some(i => i.qty * i.ratio > i.onHandQty);

  // ── Picker Selectors ──
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);
  const [showToWarehousePicker, setShowToWarehousePicker] = useState(false);
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);

  const SelectField: React.FC<{
    label: string; value: string; placeholder: string;
    required?: boolean; onPress: () => void; icon?: string;
  }> = ({ label, value, placeholder, required, onPress, icon }) => (
    <View>
      <Text style={styles.fieldLabel}>{label}{required && <Text style={{ color: Colors.danger }}> *</Text>}</Text>
      <TouchableOpacity style={styles.selectField} onPress={onPress} activeOpacity={0.8}>
        <Ionicons name={(icon ?? 'chevron-down') as any} size={18} color={value ? Colors.primary : Colors.gray400} />
        <Text style={[styles.selectText, !value && styles.selectPlaceholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={14} color={Colors.gray400} />
      </TouchableOpacity>
    </View>
  );

  const SimplePickerModal: React.FC<{
    visible: boolean;
    title: string;
    items: { id: string; name: string; sub?: string }[];
    selectedId: string;
    onSelect: (id: string) => void;
    onClose: () => void;
  }> = ({ visible, title, items: pickerItems, selectedId, onSelect, onClose }) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHandle} />
          <Text style={styles.pickerTitle}>{title}</Text>
          <FlatList
            data={pickerItems}
            keyExtractor={i => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.pickerOption, selectedId === item.id && styles.pickerOptionActive]}
                onPress={() => { onSelect(item.id); onClose(); }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickerOptionText, selectedId === item.id && { color: Colors.primary, fontWeight: '700' }]}>
                    {item.name}
                  </Text>
                  {item.sub && <Text style={styles.pickerOptionSub}>{item.sub}</Text>}
                </View>
                {selectedId === item.id && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.pickerCancel} onPress={onClose}>
            <Text style={styles.pickerCancelText}>ยกเลิก</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={[styles.header, isReceive ? styles.headerReceive : styles.headerIssue]}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>
              {isEdit ? 'แก้ไข' : 'สร้าง'}{isReceive ? 'ใบรับสินค้า' : 'ใบเบิกสินค้า'}
            </Text>
            {isEdit && editDoc && (
              <Text style={styles.headerDocNo}>{editDoc.docNo}</Text>
            )}
          </View>
          {/* Scan toggle */}
          <TouchableOpacity
            style={[styles.scanToggleBtn, scanMode && styles.scanToggleBtnActive]}
            onPress={() => {
              setScanMode(!scanMode);
              if (!scanMode) setTimeout(() => scanRef.current?.focus(), 100);
            }}
          >
            <Ionicons name="barcode-outline" size={18} color={Colors.white} />
            <Text style={styles.scanToggleText}>{scanMode ? 'สแกน ON' : 'สแกน'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          {/* ── Header Form ── */}
          <View style={styles.section}>
            {/* Warehouse */}
            <SelectField
              label={isReceive ? 'คลังรับสินค้า' : 'คลังที่เบิก'}
              value={warehouseName}
              placeholder="เลือกคลัง"
              required
              icon="archive-outline"
              onPress={() => setShowWarehousePicker(true)}
            />

            {/* Supplier (receive only) */}
            {isReceive && (
              <SelectField
                label="Supplier / ผู้จำหน่าย"
                value={supplierName}
                placeholder="เลือก Supplier (ถ้ามี)"
                icon="business-outline"
                onPress={() => setShowSupplierPicker(true)}
              />
            )}

            {/* To Warehouse (issue only) */}
            {!isReceive && (
              <SelectField
                label="คลังปลายทาง / จุดขาย"
                value={toWarehouseName}
                placeholder="เลือกคลังปลายทาง"
                required
                icon="navigate-outline"
                onPress={() => setShowToWarehousePicker(true)}
              />
            )}

            {/* Remark */}
            <View>
              <Text style={styles.fieldLabel}>หมายเหตุ</Text>
              <TextInput
                style={styles.remarkInput}
                value={remark}
                onChangeText={setRemark}
                placeholder="ระบุหมายเหตุ (ไม่บังคับ)"
                placeholderTextColor={Colors.gray400}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* ── Scanner bar ── */}
          {scanMode && (
            <View style={styles.scanBar}>
              <View style={styles.scanBarInner}>
                <Ionicons name="barcode-outline" size={20} color={Colors.success} />
                <TextInput
                  ref={scanRef}
                  style={styles.scanInput}
                  value={scanInput}
                  onChangeText={setScanInput}
                  placeholder="สแกนหรือกรอกบาร์โค้ด แล้วกด Enter"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  returnKeyType="done"
                  onSubmitEditing={() => handleScan(scanInput)}
                  autoFocus
                />
                <TouchableOpacity onPress={() => handleScan(scanInput)}>
                  <Ionicons name="arrow-forward-circle" size={26} color={Colors.success} />
                </TouchableOpacity>
              </View>
              {lastScan && (
                <View style={[styles.scanFeedback, lastScan.status === 'ok' ? styles.scanFeedbackOk : styles.scanFeedbackErr]}>
                  <Ionicons
                    name={lastScan.status === 'ok' ? 'checkmark-circle-outline' : 'close-circle-outline'}
                    size={14}
                    color={lastScan.status === 'ok' ? Colors.success : Colors.danger}
                  />
                  <Text style={[styles.scanFeedbackText, { color: lastScan.status === 'ok' ? Colors.success : Colors.danger }]}>
                    {lastScan.name}{lastScan.status === 'ok' ? ` — รวม ${lastScan.qty} ${lastScan.qty > 1 ? 'ชิ้น' : ''}` : ''}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── Add from Dropdown ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="add-circle-outline" size={14} color={Colors.primary} /> เพิ่มสินค้า
            </Text>
            <View style={styles.addRow}>
              <View style={{ flex: 1 }}>
                <ProductSearchDropdown
                  warehouseId={warehouseId}
                  value={selectedProduct}
                  onChange={setSelectedProduct}
                  placeholder="ค้นหาสินค้า / เลือก UOM"
                />
              </View>
              <TouchableOpacity
                style={[styles.addBtn, !selectedProduct && styles.addBtnDisabled]}
                onPress={handleAddFromDropdown}
                disabled={!selectedProduct}
              >
                <Ionicons name="add" size={22} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Items ── */}
          <View style={styles.section}>
            <View style={styles.itemsHeader}>
              <Text style={styles.sectionTitle}>
                รายการสินค้า
              </Text>
              <View style={styles.itemCountBadge}>
                <Text style={styles.itemCountText}>{totalItems} รายการ</Text>
              </View>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyItems}>
                <Ionicons name="cube-outline" size={40} color={Colors.gray300} />
                <Text style={styles.emptyItemsText}>
                  ยังไม่มีสินค้า{'\n'}เลือกจากดรอปดาวน์หรือสแกนบาร์โค้ด
                </Text>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    docType={docType}
                    onQtyChange={handleQtyChange}
                    onCostChange={handleCostChange}
                    onRemove={handleRemove}
                    isNew={newItemHighlight === item.id}
                  />
                ))}
              </View>
            )}
          </View>

          {/* ── Summary ── */}
          {items.length > 0 && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>จำนวนรายการ</Text>
                <Text style={styles.summaryValue}>{totalItems} รายการ</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>จำนวนรวม (หน่วยฐาน)</Text>
                <Text style={styles.summaryValue}>{totalQtyBase}</Text>
              </View>
              {isReceive && (
                <>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryTotalLabel}>มูลค่ารวม</Text>
                    <Text style={styles.summaryTotalValue}>฿{formatCurrency(totalCost)}</Text>
                  </View>
                </>
              )}
              {hasOverStock && (
                <View style={styles.overStockAlert}>
                  <Ionicons name="warning" size={16} color={Colors.danger} />
                  <Text style={styles.overStockAlertText}>มีสินค้าที่สต๊อกไม่พอ กรุณาตรวจสอบ</Text>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* ── Footer Buttons ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.draftBtn}
            onPress={() => handleSave(true)}
            disabled={saving || items.length === 0}
          >
            <Ionicons name="document-outline" size={18} color={Colors.primary} />
            <Text style={styles.draftBtnText}>บันทึกแบบร่าง</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, (saving || items.length === 0 || hasOverStock) && styles.confirmBtnDisabled,
              isReceive ? styles.confirmBtnReceive : styles.confirmBtnIssue]}
            onPress={() => handleSave(false)}
            disabled={saving || items.length === 0 || hasOverStock}
          >
            <Ionicons name={saving ? 'hourglass-outline' : 'checkmark-circle-outline'} size={20} color={Colors.white} />
            <Text style={styles.confirmBtnText}>
              {saving ? 'กำลังบันทึก...' : isReceive ? 'ยืนยันรับสินค้า' : 'ยืนยันเบิกสินค้า'}
            </Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      {/* Pickers */}
      <SimplePickerModal
        visible={showWarehousePicker} title="เลือกคลังสินค้า"
        items={warehouses.map(w => ({ id: w.id, name: w.name, sub: w.branchName }))}
        selectedId={warehouseId}
        onSelect={setWarehouseId}
        onClose={() => setShowWarehousePicker(false)}
      />
      <SimplePickerModal
        visible={showToWarehousePicker} title="เลือกคลังปลายทาง"
        items={toWarehouses.map(w => ({ id: w.id, name: w.name, sub: w.branchName }))}
        selectedId={toWarehouseId}
        onSelect={setToWarehouseId}
        onClose={() => setShowToWarehousePicker(false)}
      />
      <SimplePickerModal
        visible={showSupplierPicker} title="เลือก Supplier"
        items={[{ id: '', name: '— ไม่ระบุ —' }, ...MOCK_SUPPLIERS.map(s => ({ id: s.id, name: s.name, sub: s.phone }))]}
        selectedId={supplierId}
        onSelect={setSupplierId}
        onClose={() => setShowSupplierPicker(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  headerReceive: { backgroundColor: Colors.success },
  headerIssue:   { backgroundColor: Colors.category1 },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white, flex: 1 },
  headerDocNo: { ...Typography.caption, color: 'rgba(255,255,255,0.75)' },
  scanToggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
  },
  scanToggleBtnActive: { backgroundColor: 'rgba(255,255,255,0.25)', borderColor: Colors.white },
  scanToggleText: { fontSize: 11, color: Colors.white, fontWeight: '700' },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  section: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
  fieldLabel: { ...Typography.label, color: Colors.gray700, marginBottom: Spacing.xs },
  selectField: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, minHeight: 48,
  },
  selectText: { ...Typography.body1, color: Colors.text, flex: 1 },
  selectPlaceholder: { color: Colors.gray400 },
  remarkInput: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    ...Typography.body1, color: Colors.text, minHeight: 60,
  },
  scanBar: { backgroundColor: '#1a1a2e', borderRadius: BorderRadius.lg, overflow: 'hidden' },
  scanBarInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
  scanInput: { flex: 1, height: 40, ...Typography.body1, color: Colors.white },
  scanFeedback: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  scanFeedbackOk: { backgroundColor: 'rgba(16,185,129,0.15)' },
  scanFeedbackErr: { backgroundColor: 'rgba(239,68,68,0.15)' },
  scanFeedbackText: { ...Typography.body2, fontWeight: '500' },
  addRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  addBtn: { width: 50, height: 50, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 1 },
  addBtnDisabled: { backgroundColor: Colors.gray300 },
  itemsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemCountBadge: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  itemCountText: { fontSize: 11, color: Colors.white, fontWeight: '700' },
  emptyItems: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyItemsText: { ...Typography.body2, color: Colors.gray400, textAlign: 'center', lineHeight: 22 },
  itemsList: { gap: Spacing.sm },
  summaryCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.xs,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { ...Typography.body2, color: Colors.textSecondary },
  summaryValue: { ...Typography.body2, color: Colors.text, fontWeight: '500' },
  summaryDivider: { height: 1, backgroundColor: Colors.border },
  summaryTotalLabel: { ...Typography.h4, color: Colors.text },
  summaryTotalValue: { ...Typography.h4, color: Colors.primary, fontWeight: '800' },
  overStockAlert: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.sm, padding: Spacing.sm },
  overStockAlertText: { ...Typography.body2, color: Colors.danger },
  footer: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  draftBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, flex: 1, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.primary, paddingVertical: Spacing.md },
  draftBtnText: { ...Typography.button, color: Colors.primary },
  confirmBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: BorderRadius.md, paddingVertical: Spacing.md },
  confirmBtnReceive: { backgroundColor: Colors.success },
  confirmBtnIssue: { backgroundColor: Colors.category1 },
  confirmBtnDisabled: { backgroundColor: Colors.gray300 },
  confirmBtnText: { ...Typography.button, color: Colors.white },
  pickerOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, maxHeight: '60%', gap: Spacing.sm },
  pickerHandle: { width: 40, height: 4, backgroundColor: Colors.gray200, borderRadius: 2, alignSelf: 'center' },
  pickerTitle: { ...Typography.h4, color: Colors.text },
  pickerOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerOptionActive: { backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm },
  pickerOptionText: { ...Typography.body1, color: Colors.text, flex: 1 },
  pickerOptionSub: { ...Typography.caption, color: Colors.textSecondary },
  pickerCancel: { alignItems: 'center', paddingVertical: Spacing.md },
  pickerCancelText: { ...Typography.button, color: Colors.danger },
});
