/**
 * UOMManager — จัดการหน่วยนับหลายหน่วย + เรโช + บาร์โค้ดหลายบาร์
 * ใช้ใน AddEditProductScreen
 *
 * ตัวอย่าง:
 *   หน่วยฐาน: ขวด  ราคา 10 บาท  barcodes: [8850001]
 *   หน่วยที่ 2: แพ็ค  ratio 6  ราคา 55  barcodes: [8850010, 8850011]
 *   หน่วยที่ 3: ลัง   ratio 24  ราคา 200 barcodes: [8850100]
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, Modal, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductUOM } from '../../types/product';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency } from '../../utils/format';

interface UOMManagerProps {
  uoms: ProductUOM[];
  baseUnit: string;
  baseCostPrice: number;
  baseSalePrice: number;
  onChange: (uoms: ProductUOM[]) => void;
}

const genId = () => `uom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

// ─── Barcode chip row ──────────────────────────────────────────────────────────
const BarcodeChips: React.FC<{
  barcodes: string[];
  onAdd: (barcode: string) => void;
  onRemove: (barcode: string) => void;
}> = ({ barcodes, onAdd, onRemove }) => {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (barcodes.includes(trimmed)) { Alert.alert('บาร์โค้ดซ้ำ'); return; }
    onAdd(trimmed);
    setInput('');
  };

  return (
    <View style={bcStyles.container}>
      <View style={bcStyles.addRow}>
        <TextInput
          style={bcStyles.input}
          value={input}
          onChangeText={setInput}
          placeholder="กรอกหรือสแกนบาร์โค้ด"
          placeholderTextColor={Colors.gray400}
          keyboardType="default"
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={bcStyles.scanBtn} onPress={() => {/* TODO: camera scan */}}>
          <Ionicons name="barcode-outline" size={18} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={bcStyles.addBtn} onPress={handleAdd}>
          <Ionicons name="add" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
      {barcodes.length > 0 && (
        <View style={bcStyles.chips}>
          {barcodes.map((bc) => (
            <View key={bc} style={bcStyles.chip}>
              <Ionicons name="barcode" size={12} color={Colors.primary} />
              <Text style={bcStyles.chipText}>{bc}</Text>
              <TouchableOpacity onPress={() => onRemove(bc)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="close-circle" size={14} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const bcStyles = StyleSheet.create({
  container: { gap: Spacing.xs },
  addRow: { flexDirection: 'row', gap: Spacing.xs },
  input: {
    flex: 1, height: 40, backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.sm, ...Typography.body2, color: Colors.text,
  },
  scanBtn: {
    width: 40, height: 40, backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.primary,
  },
  addBtn: {
    width: 40, height: 40, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.primary,
  },
  chipText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
});

// ─── UOM Row Card ──────────────────────────────────────────────────────────────
const UOMCard: React.FC<{
  uom: ProductUOM;
  isBase: boolean;
  baseUnit: string;
  baseSalePrice: number;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onBarcodesChange: (barcodes: string[]) => void;
}> = ({ uom, isBase, baseUnit, baseSalePrice, onEdit, onDelete, onSetDefault, onBarcodesChange }) => {
  const [expanded, setExpanded] = useState(false);
  const autoPrice = (baseSalePrice * uom.ratio).toFixed(2);

  return (
    <View style={[uomCardStyles.card, uom.isDefault && uomCardStyles.cardDefault]}>
      {/* Header row */}
      <TouchableOpacity style={uomCardStyles.header} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={[uomCardStyles.unitBadge, isBase && uomCardStyles.unitBadgeBase]}>
          <Text style={[uomCardStyles.unitBadgeText, isBase && { color: Colors.white }]}>{uom.unit}</Text>
        </View>

        <View style={uomCardStyles.headerInfo}>
          <Text style={uomCardStyles.ratioText}>
            {isBase ? '(หน่วยฐาน)' : `1 ${uom.unit} = ${uom.ratio} ${baseUnit}`}
          </Text>
          <Text style={uomCardStyles.priceText}>฿{formatCurrency(uom.salePrice)}</Text>
        </View>

        <View style={uomCardStyles.headerRight}>
          {uom.isDefault && (
            <View style={uomCardStyles.defaultBadge}>
              <Ionicons name="star" size={10} color={Colors.white} />
              <Text style={uomCardStyles.defaultBadgeText}>Default</Text>
            </View>
          )}
          <View style={uomCardStyles.barcodeCount}>
            <Ionicons name="barcode-outline" size={12} color={Colors.gray500} />
            <Text style={uomCardStyles.barcodeCountText}>{uom.barcodes.length}</Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.gray400} />
        </View>
      </TouchableOpacity>

      {/* Expanded detail */}
      {expanded && (
        <View style={uomCardStyles.detail}>
          <View style={uomCardStyles.detailRow}>
            <Text style={uomCardStyles.detailLabel}>ราคาขาย</Text>
            <Text style={uomCardStyles.detailValue}>฿{formatCurrency(uom.salePrice)}</Text>
            {!isBase && (
              <Text style={uomCardStyles.autoPrice}>(auto: ฿{autoPrice})</Text>
            )}
          </View>
          <View style={uomCardStyles.detailRow}>
            <Text style={uomCardStyles.detailLabel}>ราคาทุน</Text>
            <Text style={uomCardStyles.detailValue}>฿{formatCurrency(uom.costPrice)}</Text>
          </View>
          {!isBase && (
            <View style={uomCardStyles.detailRow}>
              <Text style={uomCardStyles.detailLabel}>เรโช</Text>
              <Text style={uomCardStyles.detailValue}>1 {uom.unit} = {uom.ratio} {baseUnit}</Text>
            </View>
          )}

          {/* Barcodes */}
          <Text style={uomCardStyles.barcodeLabel}>บาร์โค้ด ({uom.barcodes.length})</Text>
          <BarcodeChips
            barcodes={uom.barcodes}
            onAdd={(bc) => onBarcodesChange([...uom.barcodes, bc])}
            onRemove={(bc) => onBarcodesChange(uom.barcodes.filter((b) => b !== bc))}
          />

          {/* Action buttons */}
          <View style={uomCardStyles.actionRow}>
            {!uom.isDefault && (
              <TouchableOpacity style={uomCardStyles.actionBtn} onPress={onSetDefault}>
                <Ionicons name="star-outline" size={14} color={Colors.warning} />
                <Text style={[uomCardStyles.actionBtnText, { color: Colors.warning }]}>ตั้งเป็น Default</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={uomCardStyles.actionBtn} onPress={onEdit}>
              <Ionicons name="pencil-outline" size={14} color={Colors.primary} />
              <Text style={[uomCardStyles.actionBtnText, { color: Colors.primary }]}>แก้ไข</Text>
            </TouchableOpacity>
            {!isBase && (
              <TouchableOpacity style={[uomCardStyles.actionBtn, uomCardStyles.deleteBtn]} onPress={onDelete}>
                <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                <Text style={[uomCardStyles.actionBtnText, { color: Colors.danger }]}>ลบ</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const uomCardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border, overflow: 'hidden',
  },
  cardDefault: { borderColor: Colors.warning },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md,
  },
  unitBadge: {
    backgroundColor: Colors.gray100, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    minWidth: 52, alignItems: 'center',
  },
  unitBadgeBase: { backgroundColor: Colors.primary },
  unitBadgeText: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  headerInfo: { flex: 1 },
  ratioText: { ...Typography.caption, color: Colors.textSecondary },
  priceText: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  defaultBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: Colors.warning, borderRadius: BorderRadius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  defaultBadgeText: { fontSize: 9, color: Colors.white, fontWeight: '800' },
  barcodeCount: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.gray100, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2 },
  barcodeCountText: { fontSize: 10, color: Colors.gray500, fontWeight: '600' },
  detail: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    padding: Spacing.md, gap: Spacing.sm, backgroundColor: Colors.gray50,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  detailLabel: { ...Typography.caption, color: Colors.textSecondary, width: 60 },
  detailValue: { ...Typography.body2, color: Colors.text, fontWeight: '500' },
  autoPrice: { ...Typography.caption, color: Colors.gray400 },
  barcodeLabel: { ...Typography.label, color: Colors.gray700, marginTop: Spacing.xs },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs, flexWrap: 'wrap' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.white, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: Colors.border,
  },
  deleteBtn: { borderColor: Colors.dangerLight, backgroundColor: Colors.dangerLight },
  actionBtnText: { ...Typography.caption, fontWeight: '600' },
});

// ─── Add/Edit UOM Modal ───────────────────────────────────────────────────────
interface UOMFormModal {
  visible: boolean;
  uom: Partial<ProductUOM> | null;
  baseUnit: string;
  baseSalePrice: number;
  baseCostPrice: number;
  onSave: (uom: ProductUOM) => void;
  onClose: () => void;
}

const UOMFormModal: React.FC<UOMFormModal> = ({
  visible, uom, baseUnit, baseSalePrice, baseCostPrice, onSave, onClose,
}) => {
  const isBase = uom?.ratio === 1;
  const [unit, setUnit] = useState(uom?.unit ?? '');
  const [ratio, setRatio] = useState(uom?.ratio ? String(uom.ratio) : '');
  const [salePrice, setSalePrice] = useState(uom?.salePrice ? String(uom.salePrice) : '');
  const [costPrice, setCostPrice] = useState(uom?.costPrice ? String(uom.costPrice) : '');
  const [autoCalc, setAutoCalc] = useState(true);

  const ratioNum = parseFloat(ratio) || 1;
  const autoSale = (baseSalePrice * ratioNum).toFixed(2);
  const autoCost = (baseCostPrice * ratioNum).toFixed(2);

  const handleSave = () => {
    if (!unit.trim()) { Alert.alert('กรุณากรอกชื่อหน่วย'); return; }
    if (!isBase && ratioNum <= 1) { Alert.alert('เรโชต้องมากกว่า 1'); return; }
    const saved: ProductUOM = {
      id: uom?.id ?? genId(),
      unit: unit.trim(),
      ratio: isBase ? 1 : ratioNum,
      salePrice: parseFloat(autoCalc ? autoSale : salePrice) || parseFloat(autoSale),
      costPrice: parseFloat(autoCalc ? autoCost : costPrice) || parseFloat(autoCost),
      barcodes: uom?.barcodes ?? [],
      isDefault: uom?.isDefault ?? false,
    };
    onSave(saved);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <ScrollView>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.handle} />
            <Text style={modalStyles.title}>{uom?.id ? 'แก้ไขหน่วยนับ' : 'เพิ่มหน่วยนับ'}</Text>

            {!isBase && (
              <View style={modalStyles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
                <Text style={modalStyles.infoText}>หน่วยฐาน: <Text style={{ fontWeight: '700' }}>{baseUnit}</Text> (ราคา ฿{baseSalePrice})</Text>
              </View>
            )}

            {/* Unit name */}
            <Text style={modalStyles.label}>ชื่อหน่วย *</Text>
            <TextInput
              style={modalStyles.input}
              value={unit}
              onChangeText={setUnit}
              placeholder="เช่น แพ็ค, ลัง, โหล, กล่อง"
              placeholderTextColor={Colors.gray400}
              editable={!isBase}
            />

            {/* Ratio (non-base only) */}
            {!isBase && (
              <>
                <Text style={modalStyles.label}>เรโช (Ratio) *</Text>
                <View style={modalStyles.ratioRow}>
                  <Text style={modalStyles.ratioLabel}>1 {unit || '?'} =</Text>
                  <TextInput
                    style={[modalStyles.input, { flex: 1 }]}
                    value={ratio}
                    onChangeText={setRatio}
                    placeholder="เช่น 6, 12, 24"
                    placeholderTextColor={Colors.gray400}
                    keyboardType="decimal-pad"
                  />
                  <Text style={modalStyles.ratioUnit}>{baseUnit}</Text>
                </View>
                {ratioNum > 1 && (
                  <View style={modalStyles.ratioPreview}>
                    <Ionicons name="swap-horizontal-outline" size={14} color={Colors.primary} />
                    <Text style={modalStyles.ratioPreviewText}>
                      ซื้อ 1 {unit || '?'} = ได้ {ratioNum} {baseUnit} · Stock เพิ่ม {ratioNum} ชิ้น
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Price */}
            {!isBase && (
              <>
                <View style={modalStyles.autoRow}>
                  <Text style={modalStyles.label}>ราคา</Text>
                  <TouchableOpacity
                    style={[modalStyles.autoToggle, autoCalc && modalStyles.autoToggleOn]}
                    onPress={() => setAutoCalc(!autoCalc)}
                  >
                    <Ionicons name={autoCalc ? 'flash' : 'flash-off-outline'} size={12} color={autoCalc ? Colors.white : Colors.gray500} />
                    <Text style={[modalStyles.autoToggleText, autoCalc && { color: Colors.white }]}>
                      คำนวณ auto
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={modalStyles.priceRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={modalStyles.subLabel}>ราคาทุน (฿)</Text>
                    <TextInput
                      style={modalStyles.input}
                      value={autoCalc ? autoCost : costPrice}
                      onChangeText={setCostPrice}
                      placeholder={autoCost}
                      placeholderTextColor={Colors.gray400}
                      keyboardType="decimal-pad"
                      editable={!autoCalc}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={modalStyles.subLabel}>ราคาขาย (฿)</Text>
                    <TextInput
                      style={modalStyles.input}
                      value={autoCalc ? autoSale : salePrice}
                      onChangeText={setSalePrice}
                      placeholder={autoSale}
                      placeholderTextColor={Colors.gray400}
                      keyboardType="decimal-pad"
                      editable={!autoCalc}
                    />
                  </View>
                </View>

                {autoCalc && ratioNum > 1 && (
                  <View style={modalStyles.calcPreview}>
                    <Text style={modalStyles.calcText}>
                      ราคาทุน: ฿{baseCostPrice} × {ratioNum} = <Text style={{ fontWeight: '700', color: Colors.primary }}>฿{autoCost}</Text>
                    </Text>
                    <Text style={modalStyles.calcText}>
                      ราคาขาย: ฿{baseSalePrice} × {ratioNum} = <Text style={{ fontWeight: '700', color: Colors.primary }}>฿{autoSale}</Text>
                    </Text>
                  </View>
                )}
              </>
            )}

            <View style={modalStyles.actions}>
              <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
                <Text style={modalStyles.cancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.saveBtn} onPress={handleSave}>
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
                <Text style={modalStyles.saveText}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, gap: Spacing.md },
  handle: { width: 40, height: 4, backgroundColor: Colors.gray200, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xs },
  title: { ...Typography.h4, color: Colors.text },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm, padding: Spacing.sm },
  infoText: { ...Typography.body2, color: Colors.primary },
  label: { ...Typography.label, color: Colors.gray700 },
  subLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 },
  input: {
    backgroundColor: Colors.gray50, borderRadius: BorderRadius.sm,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    ...Typography.body1, color: Colors.text,
  },
  ratioRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  ratioLabel: { ...Typography.body2, color: Colors.text, minWidth: 50 },
  ratioUnit: { ...Typography.body2, color: Colors.text, minWidth: 40 },
  ratioPreview: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm, padding: Spacing.sm },
  ratioPreviewText: { ...Typography.caption, color: Colors.primary },
  autoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  autoToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.gray100, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  autoToggleOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  autoToggleText: { fontSize: 11, color: Colors.gray500, fontWeight: '600' },
  priceRow: { flexDirection: 'row', gap: Spacing.sm },
  calcPreview: { backgroundColor: Colors.gray50, borderRadius: BorderRadius.sm, padding: Spacing.sm, gap: 2 },
  calcText: { ...Typography.caption, color: Colors.text },
  actions: { flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.xs },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border },
  cancelText: { ...Typography.button, color: Colors.textSecondary },
  saveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md },
  saveText: { ...Typography.button, color: Colors.white },
});

// ─── Main UOMManager ──────────────────────────────────────────────────────────
export const UOMManager: React.FC<UOMManagerProps> = ({
  uoms, baseUnit, baseCostPrice, baseSalePrice, onChange,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editUOM, setEditUOM] = useState<Partial<ProductUOM> | null>(null);

  const handleSaveUOM = (uom: ProductUOM) => {
    const exists = uoms.find((u) => u.id === uom.id);
    if (exists) {
      onChange(uoms.map((u) => u.id === uom.id ? uom : u));
    } else {
      onChange([...uoms, uom]);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('ลบหน่วยนับ', 'ต้องการลบหน่วยนับนี้?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => onChange(uoms.filter((u) => u.id !== id)) },
    ]);
  };

  const handleSetDefault = (id: string) => {
    onChange(uoms.map((u) => ({ ...u, isDefault: u.id === id })));
  };

  const handleBarcodesChange = (id: string, barcodes: string[]) => {
    onChange(uoms.map((u) => u.id === id ? { ...u, barcodes } : u));
  };

  const openAdd = () => {
    setEditUOM({ barcodes: [], isDefault: false });
    setShowModal(true);
  };

  const openEdit = (uom: ProductUOM) => {
    setEditUOM(uom);
    setShowModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="layers-outline" size={18} color={Colors.primary} />
          <Text style={styles.headerTitle}>หน่วยนับและบาร์โค้ด</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{uoms.length}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addUomBtn} onPress={openAdd}>
          <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
          <Text style={styles.addUomText}>เพิ่มหน่วย</Text>
        </TouchableOpacity>
      </View>

      {/* Summary table */}
      {uoms.length > 1 && (
        <View style={styles.summaryTable}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryCell, styles.summaryCellWide]}>หน่วย</Text>
            <Text style={styles.summaryCell}>เรโช</Text>
            <Text style={styles.summaryCell}>ราคา</Text>
            <Text style={styles.summaryCell}>บาร์โค้ด</Text>
          </View>
          {uoms.map((uom) => (
            <View key={uom.id} style={[styles.summaryRow, uom.isDefault && styles.summaryRowDefault]}>
              <View style={[styles.summaryCellWide, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                <Text style={styles.summaryText}>{uom.unit}</Text>
                {uom.isDefault && <Ionicons name="star" size={10} color={Colors.warning} />}
              </View>
              <Text style={styles.summaryCell}>{uom.ratio === 1 ? '—' : `×${uom.ratio}`}</Text>
              <Text style={[styles.summaryCell, { color: Colors.primary, fontWeight: '600' }]}>฿{uom.salePrice}</Text>
              <Text style={styles.summaryCell}>{uom.barcodes.length} บาร์</Text>
            </View>
          ))}
        </View>
      )}

      {/* UOM Cards */}
      <View style={styles.cards}>
        {uoms.map((uom, index) => (
          <UOMCard
            key={uom.id}
            uom={uom}
            isBase={index === 0}
            baseUnit={baseUnit}
            baseSalePrice={baseSalePrice}
            onEdit={() => openEdit(uom)}
            onDelete={() => handleDelete(uom.id)}
            onSetDefault={() => handleSetDefault(uom.id)}
            onBarcodesChange={(barcodes) => handleBarcodesChange(uom.id, barcodes)}
          />
        ))}
      </View>

      {uoms.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="layers-outline" size={32} color={Colors.gray300} />
          <Text style={styles.emptyText}>ยังไม่มีหน่วยนับ กดเพิ่มหน่วย</Text>
        </View>
      )}

      <UOMFormModal
        visible={showModal}
        uom={editUOM}
        baseUnit={baseUnit}
        baseSalePrice={baseSalePrice}
        baseCostPrice={baseCostPrice}
        onSave={handleSaveUOM}
        onClose={() => setShowModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  headerTitle: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
  countBadge: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  countBadgeText: { fontSize: 10, color: Colors.white, fontWeight: '800' },
  addUomBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: Colors.primary,
  },
  addUomText: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },
  summaryTable: {
    borderRadius: BorderRadius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  summaryHeader: {
    flexDirection: 'row', backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  summaryRowDefault: { backgroundColor: '#FFFBEB' },
  summaryCell: { flex: 1, ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  summaryCellWide: { flex: 1.5 },
  summaryText: { ...Typography.caption, color: Colors.text, fontWeight: '500' },
  cards: { gap: Spacing.sm },
  emptyState: { alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.md },
  emptyText: { ...Typography.body2, color: Colors.gray400 },
});
