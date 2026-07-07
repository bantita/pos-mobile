/**
 * ProductScreen — M04 จัดการสินค้า
 * - รูปสินค้า (URL + เลือกไฟล์บน web)
 * - Multi-UOM พร้อม multi-barcode ต่อหน่วย
 * - ตารางรายการ + thumbnail + UOM badge
 * - Import/Export / Category tab
 */
import React, { useState, useMemo, useRef } from 'react';
import { View, TouchableOpacity, FlatList, Modal, ScrollView, Switch, Image, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { Palette } from '@/shared/constants/palette';
import { Colors, Space, Radius, Shadow, Font } from '@/shared/ui/tokens';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_BRANDS, UNITS } from '@/features/product/data/mocks/mockProducts';
import { ProductMaster, ProductUOM } from '@/features/product/domain/product';
import { useProductStore } from '@/features/product/application/stores/productStore';
import { Text, TextInput } from '@/shared/tw/index';

const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });

type SubView = 'list' | 'import' | 'master' | 'pricing' | 'inventory';

// ─── Master Tab Types ─────────────────────────────────────────────────────────
type MasterSubTab = 'unit' | 'brand' | 'category';

interface UnitItem {
  id: string;
  name: string;
  isBuiltIn: boolean;
  status: 'active' | 'inactive';
}

interface BrandItem {
  id: string;
  name: string;
  productCount: number;
  status: 'active' | 'inactive';
}

interface CategoryItem {
  id: string;
  name: string;
  productCount: number;
  status: 'active' | 'inactive';
}

// ─── UOM ชุดว่างสำหรับ row ใหม่ ───────────────────────────────────────────────
const emptyUOM = (): ProductUOM => ({
  id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  unit: '',
  ratio: 1,
  costPrice: 0,
  salePrice: 0,
  barcodes: [],
  isDefault: false,
});

// ─── UOM Row Component ─────────────────────────────────────────────────────────
// รวม units ที่ใช้บ่อย + custom ที่เคยเพิ่ม
const getUnitSuggestions = (existingUnits: string[]) => {
  const all = [...UNITS, ...existingUnits.filter(u => u && !UNITS.includes(u))];
  return [...new Set(all)];
};

const UOMRow: React.FC<{
  uom: ProductUOM;
  index: number;
  canDelete: boolean;
  baseUnit: string;
  allUnits: string[];  // master units จาก parent
  onChange: (u: ProductUOM) => void;
  onDelete: () => void;
  onAddCustomUnit: (unit: string) => void; // เพิ่ม custom unit เข้า master
}> = ({ uom, index, canDelete, baseUnit, allUnits, onChange, onDelete, onAddCustomUnit }) => {
  const [bcInput,       setBcInput]       = useState('');
  const [showUnitDrop,  setShowUnitDrop]  = useState(false);
  const [unitSearch,    setUnitSearch]    = useState('');

  const addBarcode = () => {
    const v = bcInput.trim();
    if (!v || uom.barcodes.includes(v)) return;
    onChange({ ...uom, barcodes: [...uom.barcodes, v] });
    setBcInput('');
  };

  const removeBarcode = (bc: string) => {
    onChange({ ...uom, barcodes: uom.barcodes.filter(b => b !== bc) });
  };

  const selectUnit = (u: string) => {
    onChange({ ...uom, unit: u });
    setShowUnitDrop(false);
    setUnitSearch('');
  };

  const handleAddCustom = () => {
    const u = unitSearch.trim();
    if (!u) return;
    onAddCustomUnit(u);
    onChange({ ...uom, unit: u });
    setShowUnitDrop(false);
    setUnitSearch('');
  };

  const filteredUnits = allUnits.filter(u =>
    !unitSearch || u.toLowerCase().includes(unitSearch.toLowerCase())
  );

  return (
    <View style={ur.card}>
      {/* ── Header ── */}
      <View style={ur.cardHeader}>
        <View style={[ur.unitBadge, uom.isDefault && ur.unitBadgeDefault]}>
          <Text style={[ur.unitBadgeText, uom.isDefault && { color: Palette.primary }]}>
            {uom.unit || `หน่วย ${index + 1}`}
          </Text>
          {uom.isDefault && (
            <View style={ur.defaultTag}>
              <Text style={ur.defaultTagText}>หลัก</Text>
            </View>
          )}
        </View>
        {canDelete && (
          <TouchableOpacity style={ur.delBtnSm} onPress={onDelete}>
            <Ionicons name="trash-outline" size={14} color={Palette.danger} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Row 1: fields ── */}
      <View style={ur.fieldsRow}>
        {/* ── ชื่อหน่วย + dropdown ── */}
        <View style={[ur.col1, { zIndex: 99 }]}>
          <Text style={ur.label}>ชื่อหน่วย *</Text>
          <TouchableOpacity
            style={[ur.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 36 }]}
            onPress={() => { setShowUnitDrop(!showUnitDrop); setUnitSearch(uom.unit); }}
          >
            <Text style={[{ flex: 1, fontSize: 12 }, !uom.unit && { color: Palette.textDisabled }]}>
              {uom.unit || 'เลือกหรือพิมพ์...'}
            </Text>
            <Ionicons name={showUnitDrop ? 'chevron-up' : 'chevron-down'} size={13} color={Palette.textSecondary} />
          </TouchableOpacity>

          {showUnitDrop && (
            <View style={ur.unitDrop}>
              {/* Search / custom input */}
              <View style={ur.unitSearchRow}>
                <TextInput
                  style={ur.unitSearchInput}
                  value={unitSearch}
                  onChangeText={v => { setUnitSearch(v); onChange({ ...uom, unit: v }); }}
                  placeholder="ค้นหาหรือพิมพ์ชื่อใหม่..."
                  placeholderTextColor={Palette.textDisabled}
                  autoFocus
                  onSubmitEditing={() => {
                    if (filteredUnits.length > 0) selectUnit(filteredUnits[0]);
                    else handleAddCustom();
                  }}
                />
                {unitSearch.trim() && !allUnits.includes(unitSearch.trim()) && (
                  <TouchableOpacity style={ur.unitAddBtn} onPress={handleAddCustom}>
                    <Ionicons name="add" size={14} color="#fafafa" />
                    <Text style={ur.unitAddBtnText}>เพิ่ม</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Unit list */}
              <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {filteredUnits.map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[ur.unitItem, uom.unit === u && ur.unitItemActive]}
                    onPress={() => selectUnit(u)}
                  >
                    <Text style={[ur.unitItemText, uom.unit === u && ur.unitItemTextActive]}>{u}</Text>
                    {uom.unit === u && <Ionicons name="checkmark" size={13} color={Palette.primary} />}
                  </TouchableOpacity>
                ))}
                {filteredUnits.length === 0 && (
                  <Text style={{ padding: 12, fontSize: 13, color: Palette.textDisabled }}>
                    ไม่พบ "{unitSearch}" — กด "เพิ่ม" เพื่อสร้างหน่วยใหม่
                  </Text>
                )}
              </ScrollView>
            </View>
          )}
        </View>
        <View style={ur.col2}>
          <Text style={ur.label}>เรท ({baseUnit})</Text>
          <TextInput
            style={ur.input}
            value={String(uom.ratio)}
            onChangeText={v => onChange({ ...uom, ratio: parseFloat(v) || 1 })}
            keyboardType="decimal-pad"
            placeholder="1"
            placeholderTextColor={Palette.textDisabled}
          />
        </View>
        <View style={ur.col2}>
          <Text style={ur.label}>ทุน (฿)</Text>
          <TextInput
            style={ur.input}
            value={String(uom.costPrice)}
            onChangeText={v => onChange({ ...uom, costPrice: parseFloat(v) || 0 })}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={Palette.textDisabled}
          />
        </View>
        <View style={ur.col2}>
          <Text style={ur.label}>ราคาขาย (฿)</Text>
          <TextInput
            style={ur.input}
            value={String(uom.salePrice)}
            onChangeText={v => onChange({ ...uom, salePrice: parseFloat(v) || 0 })}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={Palette.textDisabled}
          />
        </View>
        <View style={ur.col2}>
          <Text style={ur.label}>Margin</Text>
          <View style={ur.marginBox}>
            <Text style={[
              ur.marginText,
              { color: uom.salePrice > 0 && uom.salePrice > uom.costPrice ? Palette.success : Palette.danger },
            ]}>
              {uom.salePrice > 0
                ? ((uom.salePrice - uom.costPrice) / uom.salePrice * 100).toFixed(1) + '%'
                : '—'}
            </Text>
          </View>
        </View>
        <View style={ur.colDefault}>
          <Text style={ur.label}>หลัก</Text>
          <Switch
            value={uom.isDefault}
            onValueChange={v => onChange({ ...uom, isDefault: v })}
          />
        </View>
      </View>

      {/* ── Row 2: Barcodes ── */}
      <View style={ur.barcodeSection}>
        <View style={ur.barcodeHeader}>
          <Ionicons name="barcode-outline" size={13} color={Palette.textSecondary} />
          <Text style={[ur.label, { marginBottom: 0 }]}>
            บาร์โค้ด ({uom.barcodes.length} รหัส)
          </Text>
        </View>
        <View style={ur.bcContainer}>
          {/* chips บาร์โค้ดที่เพิ่มแล้ว */}
          {uom.barcodes.map(bc => (
            <View key={bc} style={ur.bcChip}>
              <Ionicons name="barcode-outline" size={11} color={Palette.primary} />
              <Text style={ur.bcText}>{bc}</Text>
              <TouchableOpacity onPress={() => removeBarcode(bc)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="close-circle" size={14} color={Palette.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}

          {/* input เพิ่มบาร์โค้ด */}
          <View style={ur.bcInputRow}>
            <TextInput
              style={ur.bcInput}
              value={bcInput}
              onChangeText={setBcInput}
              placeholder="กรอกหรือสแกนบาร์โค้ด แล้วกด Enter"
              placeholderTextColor={Palette.textDisabled}
              onSubmitEditing={addBarcode}
              returnKeyType="done"
              autoCorrect={false}
              autoCapitalize="none"
            />
            <TouchableOpacity style={ur.bcAddBtn} onPress={addBarcode} disabled={!bcInput.trim()}>
              <Ionicons name="add" size={15} color={bcInput.trim() ? Palette.primary : Palette.border} />
            </TouchableOpacity>
          </View>
        </View>
        {uom.barcodes.length === 0 && (
          <Text style={ur.bcEmpty}>ยังไม่มีบาร์โค้ด — กรอกด้านบนแล้วกด Enter หรือกด +</Text>
        )}
      </View>
    </View>
  );
};

const ur: Record<string, any> = {
  // ── Card wrapper ──────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Palette.border,
    marginBottom: 10,
    overflow: 'hidden' as any,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Palette.gray50,
    borderBottomWidth: 1, borderBottomColor: Palette.border,
  },
  unitBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, backgroundColor: Palette.gray100,
    borderWidth: 1, borderColor: Palette.border,
  },
  unitBadgeDefault: { backgroundColor: Palette.primaryLight, borderColor: Palette.primary },
  unitBadgeText: { fontSize: 12, fontWeight: '700', color: Palette.textSecondary },
  defaultTag: {
    backgroundColor: Palette.primary, borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  defaultTagText: { fontSize: 12, fontWeight: '800', color: '#fafafa' },
  delBtnSm: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Palette.dangerLight,
    alignItems: 'center', justifyContent: 'center',
  },
  // ── Fields row ────────────────────────────────────────────────────────────
  fieldsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, padding: 12, alignItems: 'flex-start',
  },
  label: { fontSize: 12, fontWeight: '700', color: Palette.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
  input: {
    borderWidth: 1.5, borderColor: Palette.border, borderRadius: 8,
    paddingHorizontal: 10, height: 36, fontSize: 12,
    color: Palette.text, backgroundColor: Palette.gray50,
  },
  col1: { flex: 1.2, minWidth: 140 },  // wider for unit dropdown
  col2: { flex: 0.9, minWidth: 70 },
  // Unit dropdown
  unitDrop: {
    position: 'absolute' as any,
    top: 58, left: 0, right: 0, zIndex: 999,
    backgroundColor: '#fafafa',
    borderRadius: 12, borderWidth: 1.5, borderColor: Palette.primary,
    ...Platform.select({ web: { boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' } as any }),
  },
  unitSearchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 8, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: Palette.border,
    backgroundColor: Palette.primaryLight,
  },
  unitSearchInput: {
    flex: 1, height: 32, fontSize: 12, color: Palette.text,
    borderWidth: 1, borderColor: Palette.border, borderRadius: 8,
    paddingHorizontal: 8, backgroundColor: '#fafafa',
  },
  unitAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Palette.primary, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 6,
  },
  unitAddBtnText: { fontSize: 13, fontWeight: '700', color: '#fafafa' },
  unitItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: Palette.gray100,
  },
  unitItemActive: { backgroundColor: Palette.primaryLight },
  unitItemText: { fontSize: 12, color: Palette.text },
  unitItemTextActive: { color: Palette.primary, fontWeight: '700' },
  colDefault: { alignItems: 'center', justifyContent: 'flex-start', minWidth: 44 },
  marginBox: {
    height: 36, borderRadius: 8, backgroundColor: Palette.gray50,
    borderWidth: 1.5, borderColor: Palette.border,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  marginText: { fontSize: 12, fontWeight: '700' },
  // ── Barcode section ───────────────────────────────────────────────────────
  barcodeSection: {
    borderTopWidth: 1, borderTopColor: Palette.border,
    padding: 12, backgroundColor: '#f8fafc', gap: 8,
  },
  barcodeHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6,
  },
  bcContainer: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center',
  },
  bcChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Palette.primaryLight, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Palette.primary + '40',
  },
  bcText: { fontSize: 13, color: Palette.primary, fontWeight: '700', letterSpacing: 0.5 },
  bcInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    flex: 1, minWidth: 180,
  },
  bcInput: {
    flex: 1, height: 32, borderWidth: 1.5, borderColor: Palette.border, borderRadius: 8,
    paddingHorizontal: 10, fontSize: 12, color: Palette.text,
    backgroundColor: '#fafafa',
  },
  bcAddBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Palette.primary,
  },
  bcEmpty: { fontSize: 13, color: Palette.textDisabled, marginTop: 2 },
  // Legacy (kept for compat)
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: Palette.gray50, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Palette.border, marginBottom: 8, alignItems: 'flex-start' },
  colDel: { alignItems: 'center', justifyContent: 'flex-start', minWidth: 32 },
  delBtn: { width: 32, height: 36, borderRadius: 8, backgroundColor: Palette.dangerLight, alignItems: 'center', justifyContent: 'center' },
  barcodeSection_old: { width: '100%' },
  bcRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
};

// ─── Add/Edit Product Modal ───────────────────────────────────────────────────
const ProductFormModal: React.FC<{
  visible: boolean;
  product?: ProductMaster | null;
  onSave: (p: Partial<ProductMaster>) => void;
  onClose: () => void;
}> = ({ visible, product, onSave, onClose }) => {
  const fileRef = useRef<any>(null);

  // ─── Image ───
  const [imageUrl, setImageUrl] = useState(product?.image ?? '');

  // ─── Base fields ───
  const [name,     setName]     = useState(product?.name     ?? '');
  const [code,     setCode]     = useState(product?.code     ?? '');
  const [catId,    setCatId]    = useState(product?.categoryId ?? 'c1');
  const [brandId,  setBrandId]  = useState(product?.brandId  ?? '');
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [minStock, setMinStock] = useState(String(product?.minStock ?? '5'));
  const [active,   setActive]   = useState(product?.status !== 'inactive');
  const [vat,      setVat]      = useState(product?.vatIncluded ?? true);
  const [productType, setProductType] = useState<'general' | 'service'>((product as any)?.productType ?? 'general');

  // ─── UOMs ───
  const initUOMs = (): ProductUOM[] => {
    if (product?.uoms && product.uoms.length > 0) return [...product.uoms];
    return [{
      id: 'u_base',
      unit: product?.unit ?? 'ชิ้น',
      ratio: 1,
      costPrice: product?.costPrice ?? 0,
      salePrice: product?.salePrice ?? 0,
      barcodes: product?.barcode ? [product.barcode] : [],
      isDefault: true,
    }];
  };
  const [uoms, setUOMs] = useState<ProductUOM[]>(initUOMs);
  // master units list — UNITS + custom ones added by user
  const [customUnits, setCustomUnits] = useState<string[]>([]);
  const allUnits = useMemo(() => {
    const extra = customUnits.filter(u => !UNITS.includes(u));
    return [...UNITS, ...extra];
  }, [customUnits]);

  const handleAddCustomUnit = (unit: string) => {
    if (!UNITS.includes(unit) && !customUnits.includes(unit)) {
      setCustomUnits(prev => [...prev, unit]);
    }
  };

  const baseUnit = uoms[0]?.unit || 'ชิ้น';

  const updateUOM = (index: number, updated: ProductUOM) => {
    setUOMs(prev => prev.map((u, i) => i === index ? updated : u));
  };

  const deleteUOM = (index: number) => {
    setUOMs(prev => prev.filter((_, i) => i !== index));
  };

  const addUOM = () => {
    const u = emptyUOM();
    const base = uoms[0];
    u.costPrice = base ? base.costPrice : 0;
    u.salePrice = base ? base.salePrice : 0;
    setUOMs(prev => [...prev, u]);
  };

  // ── Ensure at least 1 default ──
  const ensureDefault = (list: ProductUOM[]) => {
    const hasDef = list.some(u => u.isDefault);
    if (!hasDef && list.length > 0) {
      return list.map((u, i) => ({ ...u, isDefault: i === 0 }));
    }
    return list;
  };

  const handleSave = () => {
    const finalUOMs = ensureDefault(uoms);
    const defaultUOM = finalUOMs.find(u => u.isDefault) ?? finalUOMs[0];
    onSave({
      name,
      code,
      barcode: defaultUOM?.barcodes[0] ?? '',
      categoryId: catId,
      categoryName: MOCK_CATEGORIES.find(c => c.id === catId)?.name ?? '',
      brandId: brandId || undefined,
      brandName: MOCK_BRANDS.find(b => b.id === brandId)?.name,
      unit: baseUnit,
      costPrice: defaultUOM?.costPrice ?? 0,
      salePrice: defaultUOM?.salePrice ?? 0,
      minStock: parseInt(minStock) || 5,
      vatIncluded: vat,
      vatRate: vat ? 7 : 0,
      status: active ? 'active' : 'inactive',
      image: imageUrl || undefined,
      uoms: finalUOMs,
    });
    onClose();
  };

  const canSave = name.trim().length > 0 && code.trim().length > 0 && uoms.length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={fm.overlay}>
        <View style={fm.sheet}>
          {/* Header */}
          <View style={fm.header}>
            <Text style={fm.title}>{product ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={Palette.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {/* ── รูปสินค้า ── */}
            <View style={fm.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Ionicons name="image-outline" size={17} color={Palette.primary} />
                <Text style={fm.sectionTitle}>รูปสินค้า</Text>
              </View>
              <View style={fm.imageRow}>
                {/* Preview */}
                <View style={fm.imagePreview}>
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={fm.previewImg} resizeMode="contain" />
                  ) : (
                    <Ionicons name="image-outline" size={40} color={Palette.border} />
                  )}
                </View>
                <View style={{ flex: 1, gap: 8 }}>
                  <TextInput
                    style={fm.inputFull}
                    value={imageUrl}
                    onChangeText={setImageUrl}
                    placeholder="URL รูปภาพ https://..."
                    placeholderTextColor={Palette.textDisabled}
                  />
                  {Platform.OS === 'web' && (
                    <>
                      {/* Hidden file input สำหรับ web */}
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const url = URL.createObjectURL(file);
                          setImageUrl(url);
                        }}
                      />
                      <TouchableOpacity
                        style={fm.fileBtn}
                        onPress={() => (fileRef.current as HTMLInputElement)?.click()}
                      >
                        <Ionicons name="folder-open-outline" size={14} color={Palette.primary} />
                        <Text style={fm.fileBtnText}>เลือกไฟล์รูป</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {imageUrl ? (
                    <TouchableOpacity onPress={() => setImageUrl('')}>
                      <Text style={{ fontSize: 13, color: Palette.danger }}>✕ ลบรูป</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>

            {/* ── ข้อมูลพื้นฐาน ── */}
            <View style={fm.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Ionicons name="document-text-outline" size={17} color={Palette.primary} />
                <Text style={fm.sectionTitle}>ข้อมูลพื้นฐาน</Text>
              </View>
              <View style={fm.grid2}>
                <View style={fm.field}>
                  <Text style={fm.label}>รหัสสินค้า *</Text>
                  <View style={fm.inputRow}>
                    <TextInput
                      style={fm.input}
                      value={code}
                      onChangeText={setCode}
                      placeholder="เช่น P001"
                      placeholderTextColor={Palette.textDisabled}
                    />
                    <TouchableOpacity
                      style={fm.autoBtn}
                      onPress={() => setCode(`P${Date.now().toString().slice(-5)}`)}
                    >
                      <Text style={fm.autoBtnText}>Auto</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={fm.field}>
                  <Text style={fm.label}>สต๊อกขั้นต่ำ</Text>
                  <TextInput
                    style={fm.inputFull}
                    value={minStock}
                    onChangeText={setMinStock}
                    keyboardType="number-pad"
                    placeholder="5"
                    placeholderTextColor={Palette.textDisabled}
                  />
                </View>
              </View>

              <View style={fm.field}>
                <Text style={fm.label}>ชื่อสินค้า *</Text>
                <TextInput
                  style={fm.inputFull}
                  value={name}
                  onChangeText={setName}
                  placeholder="ชื่อสินค้า"
                  placeholderTextColor={Palette.textDisabled}
                />
              </View>

              <View style={[fm.grid2, { zIndex: 9999 }]}>
                <View style={fm.field}>
                  <Text style={fm.label}>หมวดหมู่</Text>
                  <View style={{ position: 'relative', zIndex: 9999 }}>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 }}
                      onPress={() => setShowCatDropdown(!showCatDropdown)}
                    >
                      <Text style={{ fontSize: 12, color: catId ? Colors.text : '#9ca3af' }}>
                        {MOCK_CATEGORIES.find(c => c.id === catId)?.name || 'เลือกหมวดหมู่...'}
                      </Text>
                      <Ionicons name="chevron-down" size={14} color="#9ca3af" />
                    </TouchableOpacity>
                    {showCatDropdown && (
                      <View style={{ position: 'absolute', top: 40, left: 0, right: 0, backgroundColor: '#fafafa', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', zIndex: 9999, maxHeight: 180, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                        <ScrollView style={{ maxHeight: 180 }}>
                          {MOCK_CATEGORIES.filter(c => c.status === 'active').map(c => (
                            <TouchableOpacity key={c.id} style={{ paddingVertical: 9, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', backgroundColor: catId === c.id ? Palette.primaryLight : '#fafafa' }} onPress={() => { setCatId(c.id); setShowCatDropdown(false); }}>
                              <Text style={{ fontSize: 12, color: catId === c.id ? Palette.primary : Colors.text }}>{c.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>
                <View style={fm.field}>
                  <Text style={fm.label}>แบรนด์</Text>
                  <View style={{ position: 'relative', zIndex: 9999 }}>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 }}
                      onPress={() => setShowBrandDropdown(!showBrandDropdown)}
                    >
                      <Text style={{ fontSize: 12, color: brandId ? Colors.text : '#9ca3af' }}>
                        {brandId ? MOCK_BRANDS.find(b => b.id === brandId)?.name : 'ไม่ระบุ'}
                      </Text>
                      <Ionicons name="chevron-down" size={14} color="#9ca3af" />
                    </TouchableOpacity>
                    {showBrandDropdown && (
                      <View style={{ position: 'absolute', top: 40, left: 0, right: 0, backgroundColor: '#fafafa', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', zIndex: 9999, maxHeight: 180, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                        <ScrollView style={{ maxHeight: 180 }}>
                          <TouchableOpacity style={{ paddingVertical: 9, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', backgroundColor: !brandId ? Palette.primaryLight : '#fafafa' }} onPress={() => { setBrandId(''); setShowBrandDropdown(false); }}>
                            <Text style={{ fontSize: 12, color: !brandId ? Palette.primary : Colors.text }}>ไม่ระบุ</Text>
                          </TouchableOpacity>
                          {MOCK_BRANDS.filter(b => b.status === 'active').map(b => (
                            <TouchableOpacity key={b.id} style={{ paddingVertical: 9, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', backgroundColor: brandId === b.id ? Palette.primaryLight : '#fafafa' }} onPress={() => { setBrandId(b.id); setShowBrandDropdown(false); }}>
                              <Text style={{ fontSize: 12, color: brandId === b.id ? Palette.primary : Colors.text }}>{b.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View style={fm.switchRow}>
                <Text style={fm.label}>ประเภทสินค้า</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: productType !== 'service' ? Palette.primary : Palette.gray100, borderWidth: 1, borderColor: productType !== 'service' ? Palette.primary : Palette.border }}
                    onPress={() => setProductType('general')}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: productType !== 'service' ? '#fafafa' : Palette.textSecondary }}>สินค้า</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: productType === 'service' ? '#7c3aed' : Palette.gray100, borderWidth: 1, borderColor: productType === 'service' ? '#7c3aed' : Palette.border }}
                    onPress={() => setProductType('service')}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: productType === 'service' ? '#fafafa' : Palette.textSecondary }}>บริการ</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={fm.switchRow}>
                <Text style={fm.label}>ราคารวม VAT 7%</Text>
                <Switch
                  value={vat}
                  onValueChange={setVat}
                />
              </View>
              <View style={fm.switchRow}>
                <Text style={fm.label}>เปิดใช้งาน</Text>
                <Switch
                  value={active}
                  onValueChange={setActive}
                />
              </View>
            </View>

            {/* ── Multi-UOM ── */}
            <View style={fm.section}>
              <View style={fm.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Ionicons name="cube-outline" size={17} color={Palette.primary} />
                  <Text style={fm.sectionTitle}>หน่วยและราคา ({uoms.length} หน่วย)</Text>
                </View>
                <TouchableOpacity style={fm.addUOMBtn} onPress={addUOM}>
                  <Ionicons name="add" size={14} color={Palette.primary} />
                  <Text style={fm.addUOMText}>เพิ่มหน่วย</Text>
                </TouchableOpacity>
              </View>

              {/* Header hint */}
              <View style={fm.uomHintRow}>
                {['ชื่อหน่วย', `เรท (${baseUnit})`, 'ทุน', 'ราคาขาย', 'Margin', 'หลัก', ' '].map(h => (
                  <Text key={h} style={fm.uomHint}>{h}</Text>
                ))}
              </View>

              {uoms.map((uom, idx) => (
                <UOMRow
                  key={uom.id}
                  uom={uom}
                  index={idx}
                  canDelete={uoms.length > 1}
                  baseUnit={baseUnit}
                  allUnits={allUnits}
                  onChange={updated => updateUOM(idx, updated)}
                  onDelete={() => deleteUOM(idx)}
                  onAddCustomUnit={handleAddCustomUnit}
                />
              ))}
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={fm.actions}>
            <TouchableOpacity style={fm.cancelBtn} onPress={onClose}>
              <Text style={fm.cancelText}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[fm.saveBtn, !canSave && fm.saveBtnDisabled]}
              disabled={!canSave}
              onPress={handleSave}
            >
              <Text style={fm.saveText}>{product ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const fm: Record<string, any> = {
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  sheet: { backgroundColor: '#fafafa', borderRadius: 14, padding: 24, width: 720, maxHeight: '92%' as any, gap: 0, overflow: 'visible' as any },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 14, fontWeight: '700', color: Palette.text },
  // Sections
  section: { marginBottom: 20, gap: 10, overflow: 'visible' as any, zIndex: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Palette.text },
  // Image
  imageRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  imagePreview: {
    width: 120, height: 120, borderRadius: 12,
    borderWidth: 2, borderColor: Palette.border, borderStyle: 'dashed',
    backgroundColor: Palette.gray50,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden' as any,
  },
  previewImg: { width: 116, height: 116, borderRadius: 12 },
  fileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Palette.primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start',
    backgroundColor: Palette.primaryLight,
  },
  fileBtnText: { fontSize: 12, fontWeight: '600', color: Palette.primary },
  // Fields
  grid2: { flexDirection: 'row', gap: 12, zIndex: 1, overflow: 'visible' as any },
  field: { flex: 1, gap: 5, marginBottom: 4, overflow: 'visible' as any },
  label: { fontSize: 13, fontWeight: '700', color: Palette.textSecondary, textTransform: 'uppercase' },
  inputFull: {
    borderWidth: 1.5, borderColor: Palette.border, borderRadius: 8,
    paddingHorizontal: 12, height: 40, fontSize: 12,
    color: Palette.text, backgroundColor: Palette.gray50,
  },
  inputRow: { flexDirection: 'row', gap: 6 },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: Palette.border, borderRadius: 8,
    paddingHorizontal: 12, height: 40, fontSize: 12,
    color: Palette.text, backgroundColor: Palette.gray50,
  },
  autoBtn: {
    backgroundColor: Palette.primaryLight, borderRadius: 8,
    paddingHorizontal: 10, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Palette.primary,
  },
  autoBtnText: { fontSize: 13, fontWeight: '700', color: Palette.primary },
  catChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14,
    backgroundColor: '#fafafa', borderWidth: 1, borderColor: Palette.border,
  },
  catChipActive: { backgroundColor: Palette.primary, borderColor: Palette.primary },
  catChipText: { fontSize: 13, color: Palette.textSecondary, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6, borderTopWidth: 1, borderTopColor: Palette.border,
  },
  // UOM
  addUOMBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: Palette.primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: Palette.primaryLight,
  },
  addUOMText: { fontSize: 13, fontWeight: '700', color: Palette.primary },
  uomHintRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 4 },
  uomHint: { flex: 1, fontSize: 12, fontWeight: '700', color: Palette.textDisabled, textTransform: 'uppercase' },
  // Actions
  actions: {
    flexDirection: 'row', gap: 10,
    paddingTop: 12, marginTop: 12,
    borderTopWidth: 1, borderTopColor: Palette.border,
  },
  cancelBtn: {
    flex: 1, height: 44, borderRadius: 12,
    borderWidth: 1.5, borderColor: Palette.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelText: { fontSize: 12, fontWeight: '600', color: Palette.textSecondary },
  saveBtn: { flex: 2, height: 44, borderRadius: 12, backgroundColor: Palette.primary, alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled: { backgroundColor: '#a5b4fc' },
  saveText: { fontSize: 12, fontWeight: '700', color: '#fafafa' },
};

// ─── Master Screen ────────────────────────────────────────────────────────────
const MasterScreen: React.FC<{ allProducts: typeof MOCK_PRODUCTS }> = ({ allProducts }) => {
  const [masterTab, setMasterTab] = useState<MasterSubTab>('unit');

  // ── Unit state ──
  const [units, setUnits] = useState<UnitItem[]>([
    ...UNITS.map((n, i) => ({ id: `unit_builtin_${i}`, name: n, isBuiltIn: true, status: 'active' as const })),
  ]);
  const [showAddUnit,    setShowAddUnit]    = useState(false);
  const [newUnitText,    setNewUnitText]    = useState('');
  const [editingUnit,    setEditingUnit]    = useState<string | null>(null);
  const [editingUnitText,setEditingUnitText]= useState('');

  const usedUnitsInProducts = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach(p => {
      set.add(p.unit);
      p.uoms.forEach(u => set.add(u.unit));
    });
    return set;
  }, [allProducts]);

  const isUnitUsed = (name: string) => usedUnitsInProducts.has(name);

  const handleAddUnit = () => {
    const name = newUnitText.trim();
    if (!name) return;
    if (units.some(u => u.name === name)) return;
    setUnits(prev => [...prev, { id: `unit_${Date.now()}`, name, isBuiltIn: false, status: 'active' }]);
    setNewUnitText('');
    setShowAddUnit(false);
  };

  const handleDeleteUnit = (id: string) => {
    const u = units.find(u => u.id === id);
    if (!u || isUnitUsed(u.name)) return;
    setUnits(prev => prev.filter(u => u.id !== id));
  };

  const handleToggleUnitStatus = (id: string) => {
    const u = units.find(u => u.id === id);
    if (!u || isUnitUsed(u.name)) return; // ถ้ามีสินค้าใช้อยู่ ห้าม toggle
    setUnits(prev => prev.map(u =>
      u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
    ));
  };

  const handleSaveEditUnit = (id: string) => {
    const newName = editingUnitText.trim();
    if (!newName) { setEditingUnit(null); return; }
    if (units.some(u => u.name === newName && u.id !== id)) { setEditingUnit(null); return; }
    setUnits(prev => prev.map(u => u.id === id ? { ...u, name: newName } : u));
    setEditingUnit(null);
  };

  // ── Brand state ──
  const [brands, setBrands] = useState<BrandItem[]>([...MOCK_BRANDS]);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandStatus, setNewBrandStatus] = useState<'active' | 'inactive'>('active');
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [editingBrandName, setEditingBrandName] = useState('');

  const handleAddBrand = () => {
    const name = newBrandName.trim();
    if (!name) return;
    const newB: BrandItem = {
      id: `b_${Date.now()}`,
      name,
      productCount: 0,
      status: newBrandStatus,
    };
    setBrands(prev => [...prev, newB]);
    setNewBrandName('');
    setNewBrandStatus('active');
    setShowAddBrand(false);
  };

  const handleSaveEditBrand = (id: string) => {
    const name = editingBrandName.trim();
    if (!name) { setEditingBrand(null); return; }
    setBrands(prev => prev.map(b => b.id === id ? { ...b, name } : b));
    setEditingBrand(null);
  };

  const handleDeleteBrand = (id: string) => {
    setBrands(prev => prev.filter(b => b.id !== id));
  };

  const handleToggleBrandStatus = (id: string) => {
    setBrands(prev => prev.map(b =>
      b.id === id ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b
    ));
  };

  // ── Category state ──
  const [categories, setCategories] = useState<CategoryItem[]>([...MOCK_CATEGORIES]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryStatus, setNewCategoryStatus] = useState<'active' | 'inactive'>('active');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const newC: CategoryItem = {
      id: `c_${Date.now()}`,
      name,
      productCount: 0,
      status: newCategoryStatus,
    };
    setCategories(prev => [...prev, newC]);
    setNewCategoryName('');
    setNewCategoryStatus('active');
    setShowAddCategory(false);
  };

  const handleSaveEditCategory = (id: string) => {
    const name = editingCategoryName.trim();
    if (!name) { setEditingCategory(null); return; }
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleToggleCategoryStatus = (id: string) => {
    setCategories(prev => prev.map(c =>
      c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c
    ));
  };

  return (
    <View style={ms.root}>
      {/* Sub-tabs */}
      <View style={ms.tabBar}>
        {([
          { key: 'unit' as MasterSubTab,     label: 'หน่วยสินค้า', icon: 'resize-outline' },
          { key: 'brand' as MasterSubTab,    label: 'ยี่ห้อ',       icon: 'ribbon-outline' },
          { key: 'category' as MasterSubTab, label: 'หมวดหมู่',    icon: 'grid-outline' },
        ] as { key: MasterSubTab; label: string; icon: string }[]).map(t => (
          <TouchableOpacity
            key={t.key}
            style={[ms.tab, masterTab === t.key && ms.tabActive]}
            onPress={() => setMasterTab(t.key)}
          >
            <Ionicons name={t.icon as any} size={14} color={masterTab === t.key ? Palette.primary : Palette.textSecondary} />
            <Text style={[ms.tabText, masterTab === t.key && ms.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Unit Master ── */}
      {masterTab === 'unit' && (
        <View style={ms.panel}>
          <View style={ms.panelHeader}>
            <View>
              <Text style={ms.panelTitle}>หน่วยสินค้า</Text>
              <Text style={ms.panelSub}>{units.length} หน่วย · ใช้งานอยู่ {usedUnitsInProducts.size} หน่วย</Text>
            </View>
            <TouchableOpacity style={ms.addBtn} onPress={() => { setShowAddUnit(true); setNewUnitText(''); }}>
              <Ionicons name="add" size={15} color="#fafafa" />
              <Text style={ms.addBtnText}>+ เพิ่มหน่วย</Text>
            </TouchableOpacity>
          </View>

          {/* Add unit inline form */}
          {showAddUnit && (
            <View style={ms.inlineForm}>
              <Text style={ms.inlineFormTitle}>เพิ่มหน่วยใหม่</Text>
              <View style={ms.inlineFormRow}>
                <TextInput
                  style={ms.inlineInput}
                  value={newUnitText}
                  onChangeText={setNewUnitText}
                  placeholder="ชื่อหน่วย เช่น ท่อน, มัด"
                  placeholderTextColor={Palette.textDisabled}
                  autoFocus
                  onSubmitEditing={handleAddUnit}
                  returnKeyType="done"
                />
                <TouchableOpacity style={ms.addBtn} onPress={handleAddUnit}>
                  <Text style={ms.addBtnText}>บันทึก</Text>
                </TouchableOpacity>
                <TouchableOpacity style={ms.cancelBtnSm} onPress={() => setShowAddUnit(false)}>
                  <Text style={ms.cancelBtnSmText}>ยกเลิก</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Table */}
          <View style={ms.table}>
            <View style={ms.thead}>
              <Text style={[ms.th, { flex: 2 }]}>ชื่อหน่วย</Text>
              <Text style={[ms.th, { flex: 1 }]}>ใช้ในสินค้า</Text>
              <Text style={[ms.th, { flex: 1 }]}>สถานะ</Text>
              <Text style={[ms.th, { flex: 1.2, textAlign: 'right' }]}>จัดการ</Text>
            </View>
            {units.map((u, idx) => {
              const inUse  = isUnitUsed(u.name);
              const locked = inUse; // ถ้ามีสินค้าใช้อยู่ = ล็อค
              return (
                <View key={u.id} style={[ms.tr, idx % 2 === 1 && ms.trAlt]}>
                  {/* ชื่อ */}
                  <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {editingUnit === u.id ? (
                      <TextInput
                        style={ms.trInput}
                        value={editingUnitText}
                        onChangeText={setEditingUnitText}
                        autoFocus
                        onSubmitEditing={() => handleSaveEditUnit(u.id)}
                        onBlur={() => handleSaveEditUnit(u.id)}
                      />
                    ) : (
                      <Text style={ms.tdText}>{u.name}</Text>
                    )}
                    {u.isBuiltIn && (
                      <View style={{ backgroundColor: Palette.gray100, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 12, color: Palette.textSecondary, fontWeight: '700' }}>มาตรฐาน</Text>
                      </View>
                    )}
                  </View>
                  {/* ใช้ในสินค้า */}
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {inUse ? (
                      <>
                        <Ionicons name="cube-outline" size={13} color={Palette.primary} />
                        <Text style={[ms.td, { color: Palette.primary }]}>ใช้งานอยู่</Text>
                      </>
                    ) : (
                      <Text style={[ms.td, { color: Palette.textDisabled }]}>—</Text>
                    )}
                  </View>
                  {/* สถานะ */}
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Switch
                      value={u.status === 'active'}
                      onValueChange={() => handleToggleUnitStatus(u.id)}
                      disabled={locked}
                    />
                    <Text style={[ms.td, {
                      color: locked ? Palette.textDisabled
                        : u.status === 'active' ? Palette.success : Palette.textSecondary,
                    }]}>
                      {locked ? 'ล็อค' : u.status === 'active' ? 'ใช้งาน' : 'ปิดใช้'}
                    </Text>
                  </View>
                  {/* จัดการ */}
                  <View style={[ms.tdActions, { flex: 1.2 }]}>
                    {editingUnit === u.id ? (
                      <TouchableOpacity style={ms.actionBtnSuccess} onPress={() => handleSaveEditUnit(u.id)}>
                        <Ionicons name="checkmark" size={14} color={Palette.success} />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[ms.actionBtn, locked && { opacity: 0.35 }]}
                        disabled={locked}
                        onPress={() => { setEditingUnit(u.id); setEditingUnitText(u.name); }}
                      >
                        <Ionicons name="pencil-outline" size={14} color={Palette.primary} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[ms.actionBtnDanger, (locked || u.isBuiltIn) && { opacity: 0.35 }]}
                      disabled={locked || u.isBuiltIn}
                      onPress={() => handleDeleteUnit(u.id)}
                    >
                      <Ionicons name="trash-outline" size={14} color={Palette.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            {units.length === 0 && (
              <View style={ms.empty}>
                <Ionicons name="resize-outline" size={40} color={Palette.border} />
                <Text style={ms.emptyText}>ยังไม่มีหน่วย</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
            <Ionicons name="lock-closed-outline" size={14} color={Palette.textSecondary} />
            <Text style={[ms.legend, { flex: 1 }]}>หน่วยที่มีสินค้าใช้งานอยู่ — แก้ไข/ปิดการใช้งาน/ลบไม่ได้ · หน่วยมาตรฐาน (badge) ลบไม่ได้</Text>
          </View>
        </View>
      )}

      {/* ── Brand Master ── */}
      {masterTab === 'brand' && (
        <View style={ms.panel}>
          <View style={ms.panelHeader}>
            <View>
              <Text style={ms.panelTitle}>ยี่ห้อสินค้า</Text>
              <Text style={ms.panelSub}>{brands.length} ยี่ห้อ</Text>
            </View>
            <TouchableOpacity style={ms.addBtn} onPress={() => { setShowAddBrand(true); setNewBrandName(''); setNewBrandStatus('active'); }}>
              <Ionicons name="add" size={15} color="#fafafa" />
              <Text style={ms.addBtnText}>+ เพิ่มยี่ห้อ</Text>
            </TouchableOpacity>
          </View>

          {/* Add brand inline form */}
          {showAddBrand && (
            <View style={ms.inlineForm}>
              <Text style={ms.inlineFormTitle}>เพิ่มยี่ห้อใหม่</Text>
              <View style={ms.inlineFormRow}>
                <TextInput
                  style={ms.inlineInput}
                  value={newBrandName}
                  onChangeText={setNewBrandName}
                  placeholder="ชื่อยี่ห้อ"
                  placeholderTextColor={Palette.textDisabled}
                  autoFocus
                  onSubmitEditing={handleAddBrand}
                />
                <View style={ms.inlineStatusRow}>
                  <Text style={ms.inlineLabel}>สถานะ</Text>
                  <Switch
                    value={newBrandStatus === 'active'}
                    onValueChange={v => setNewBrandStatus(v ? 'active' : 'inactive')}
                  />
                  <Text style={[ms.inlineStatusText, { color: newBrandStatus === 'active' ? Palette.success : Palette.textSecondary }]}>
                    {newBrandStatus === 'active' ? 'ใช้งาน' : 'ปิดใช้'}
                  </Text>
                </View>
                <TouchableOpacity style={ms.addBtn} onPress={handleAddBrand}>
                  <Text style={ms.addBtnText}>บันทึก</Text>
                </TouchableOpacity>
                <TouchableOpacity style={ms.cancelBtnSm} onPress={() => setShowAddBrand(false)}>
                  <Text style={ms.cancelBtnSmText}>ยกเลิก</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Table */}
          <View style={ms.table}>
            <View style={ms.thead}>
              <Text style={[ms.th, { flex: 2 }]}>ชื่อยี่ห้อ</Text>
              <Text style={[ms.th, { flex: 1 }]}>จำนวนสินค้า</Text>
              <Text style={[ms.th, { flex: 1 }]}>สถานะ</Text>
              <Text style={[ms.th, { flex: 1.2, textAlign: 'right' }]}>จัดการ</Text>
            </View>
            {brands.map((b, idx) => (
              <View key={b.id} style={[ms.tr, idx % 2 === 1 && ms.trAlt]}>
                {/* ชื่อ */}
                <View style={{ flex: 2 }}>
                  {editingBrand === b.id ? (
                    <TextInput
                      style={ms.trInput}
                      value={editingBrandName}
                      onChangeText={setEditingBrandName}
                      autoFocus
                      onSubmitEditing={() => handleSaveEditBrand(b.id)}
                      onBlur={() => handleSaveEditBrand(b.id)}
                    />
                  ) : (
                    <Text style={ms.tdText}>{b.name}</Text>
                  )}
                </View>
                {/* จำนวน */}
                <Text style={[ms.td, { flex: 1 }]}>{b.productCount} รายการ</Text>
                {/* สถานะ */}
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Switch
                    value={b.status === 'active'}
                    onValueChange={() => handleToggleBrandStatus(b.id)}
                  />
                  <Text style={[ms.td, { color: b.status === 'active' ? Palette.success : Palette.textSecondary }]}>
                    {b.status === 'active' ? 'ใช้งาน' : 'ปิดใช้'}
                  </Text>
                </View>
                {/* จัดการ */}
                <View style={[ms.tdActions, { flex: 1.2 }]}>
                  {editingBrand === b.id ? (
                    <TouchableOpacity style={ms.actionBtnSuccess} onPress={() => handleSaveEditBrand(b.id)}>
                      <Ionicons name="checkmark" size={14} color={Palette.success} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={ms.actionBtn}
                      onPress={() => { setEditingBrand(b.id); setEditingBrandName(b.name); }}
                    >
                      <Ionicons name="pencil-outline" size={14} color={Palette.primary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={ms.actionBtnDanger} onPress={() => handleDeleteBrand(b.id)}>
                    <Ionicons name="trash-outline" size={14} color={Palette.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {brands.length === 0 && (
              <View style={ms.empty}>
                <Ionicons name="ribbon-outline" size={40} color={Palette.border} />
                <Text style={ms.emptyText}>ยังไม่มียี่ห้อ</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* ── Category Master ── */}
      {masterTab === 'category' && (
        <View style={ms.panel}>
          <View style={ms.panelHeader}>
            <View>
              <Text style={ms.panelTitle}>หมวดหมู่สินค้า</Text>
              <Text style={ms.panelSub}>{categories.length} หมวด</Text>
            </View>
            <TouchableOpacity style={ms.addBtn} onPress={() => { setShowAddCategory(true); setNewCategoryName(''); setNewCategoryStatus('active'); }}>
              <Ionicons name="add" size={15} color="#fafafa" />
              <Text style={ms.addBtnText}>+ เพิ่มหมวด</Text>
            </TouchableOpacity>
          </View>

          {/* Add category inline form */}
          {showAddCategory && (
            <View style={ms.inlineForm}>
              <Text style={ms.inlineFormTitle}>เพิ่มหมวดหมู่ใหม่</Text>
              <View style={ms.inlineFormRow}>
                <TextInput
                  style={ms.inlineInput}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="ชื่อหมวดหมู่"
                  placeholderTextColor={Palette.textDisabled}
                  autoFocus
                  onSubmitEditing={handleAddCategory}
                />
                <View style={ms.inlineStatusRow}>
                  <Text style={ms.inlineLabel}>สถานะ</Text>
                  <Switch
                    value={newCategoryStatus === 'active'}
                    onValueChange={v => setNewCategoryStatus(v ? 'active' : 'inactive')}
                  />
                  <Text style={[ms.inlineStatusText, { color: newCategoryStatus === 'active' ? Palette.success : Palette.textSecondary }]}>
                    {newCategoryStatus === 'active' ? 'ใช้งาน' : 'ปิดใช้'}
                  </Text>
                </View>
                <TouchableOpacity style={ms.addBtn} onPress={handleAddCategory}>
                  <Text style={ms.addBtnText}>บันทึก</Text>
                </TouchableOpacity>
                <TouchableOpacity style={ms.cancelBtnSm} onPress={() => setShowAddCategory(false)}>
                  <Text style={ms.cancelBtnSmText}>ยกเลิก</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Table */}
          <View style={ms.table}>
            <View style={ms.thead}>
              <Text style={[ms.th, { flex: 2 }]}>ชื่อหมวด</Text>
              <Text style={[ms.th, { flex: 1 }]}>จำนวนสินค้า</Text>
              <Text style={[ms.th, { flex: 1 }]}>สถานะ</Text>
              <Text style={[ms.th, { flex: 1.2, textAlign: 'right' }]}>จัดการ</Text>
            </View>
            {categories.map((c, idx) => (
              <View key={c.id} style={[ms.tr, idx % 2 === 1 && ms.trAlt]}>
                {/* ชื่อ */}
                <View style={{ flex: 2 }}>
                  {editingCategory === c.id ? (
                    <TextInput
                      style={ms.trInput}
                      value={editingCategoryName}
                      onChangeText={setEditingCategoryName}
                      autoFocus
                      onSubmitEditing={() => handleSaveEditCategory(c.id)}
                      onBlur={() => handleSaveEditCategory(c.id)}
                    />
                  ) : (
                    <Text style={ms.tdText}>{c.name}</Text>
                  )}
                </View>
                {/* จำนวน */}
                <Text style={[ms.td, { flex: 1 }]}>{c.productCount} รายการ</Text>
                {/* สถานะ toggle */}
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Switch
                    value={c.status === 'active'}
                    onValueChange={() => handleToggleCategoryStatus(c.id)}
                  />
                  <Text style={[ms.td, { color: c.status === 'active' ? Palette.success : Palette.textSecondary }]}>
                    {c.status === 'active' ? 'ใช้งาน' : 'ปิดใช้'}
                  </Text>
                </View>
                {/* จัดการ */}
                <View style={[ms.tdActions, { flex: 1.2 }]}>
                  {editingCategory === c.id ? (
                    <TouchableOpacity style={ms.actionBtnSuccess} onPress={() => handleSaveEditCategory(c.id)}>
                      <Ionicons name="checkmark" size={14} color={Palette.success} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={ms.actionBtn}
                      onPress={() => { setEditingCategory(c.id); setEditingCategoryName(c.name); }}
                    >
                      <Ionicons name="pencil-outline" size={14} color={Palette.primary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={ms.actionBtnDanger} onPress={() => handleDeleteCategory(c.id)}>
                    <Ionicons name="trash-outline" size={14} color={Palette.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {categories.length === 0 && (
              <View style={ms.empty}>
                <Ionicons name="grid-outline" size={40} color={Palette.border} />
                <Text style={ms.emptyText}>ยังไม่มีหมวดหมู่</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const ms: Record<string, any> = {
  root: { flex: 1 },
  // Sub-tabs
  tabBar: {
    flexDirection: 'row', backgroundColor: '#fafafa',
    borderBottomWidth: 1, borderBottomColor: Palette.border,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 18, paddingVertical: 10,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Palette.primary },
  tabText: { fontSize: 12, color: Palette.textSecondary },
  tabTextActive: { color: Palette.primary, fontWeight: '700' },
  // Panel
  panel: { flex: 1, gap: 14 },
  panelHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  panelTitle: { fontSize: 13, fontWeight: '700', color: Palette.text },
  panelSub: { fontSize: 13, color: Palette.textSecondary, marginTop: 2 },
  // Buttons
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Palette.primary, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText: { fontSize: 12, fontWeight: '700', color: '#fafafa' },
  cancelBtnSm: {
    borderWidth: 1.5, borderColor: Palette.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnSmText: { fontSize: 12, color: Palette.textSecondary },
  // Add unit row
  addUnitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Palette.primaryLight,
    borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: Palette.primary + '40',
  },
  addUnitInput: {
    flex: 1, height: 36, borderWidth: 1.5, borderColor: Palette.border,
    borderRadius: 8, paddingHorizontal: 10, fontSize: 12,
    color: Palette.text, backgroundColor: '#fafafa',
  },
  addUnitConfirm: {
    backgroundColor: Palette.primary, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addUnitConfirmText: { fontSize: 12, fontWeight: '700', color: '#fafafa' },
  addUnitCancel: {
    borderWidth: 1.5, borderColor: Palette.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  addUnitCancelText: { fontSize: 12, color: Palette.textSecondary },
  // Chips
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fafafa',
    borderRadius: 20, borderWidth: 1.5, borderColor: Palette.border,
    paddingHorizontal: 12, paddingVertical: 7,
    position: 'relative' as any,
  },
  chipUsed: { borderColor: Palette.primary, backgroundColor: Palette.primaryLight },
  chipLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  chipText: { fontSize: 12, color: Palette.text, fontWeight: '500' },
  chipUsedDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Palette.primary,
  },
  chipEditRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  chipEditInput: {
    width: 90, height: 28, borderWidth: 1.5, borderColor: Palette.primary,
    borderRadius: 8, paddingHorizontal: 6, fontSize: 13, color: Palette.text,
  },
  tooltip: {
    position: 'absolute' as any,
    bottom: '120%' as any,
    left: 0,
    backgroundColor: Palette.text,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    zIndex: 100,
  },
  tooltipText: { fontSize: 13, color: '#fafafa' },
  legend: { fontSize: 13, color: Palette.textSecondary, marginTop: 4 },
  // Inline form
  inlineForm: {
    backgroundColor: Palette.gray50,
    borderRadius: 12, borderWidth: 1, borderColor: Palette.border,
    padding: 14, gap: 10,
  },
  inlineFormTitle: { fontSize: 12, fontWeight: '700', color: Palette.text },
  inlineFormRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  inlineInput: {
    flex: 1, minWidth: 160, height: 38,
    borderWidth: 1.5, borderColor: Palette.border, borderRadius: 8,
    paddingHorizontal: 10, fontSize: 12,
    color: Palette.text, backgroundColor: '#fafafa',
  },
  inlineStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inlineLabel: { fontSize: 13, color: Palette.textSecondary, fontWeight: '600' },
  inlineStatusText: { fontSize: 13, fontWeight: '600' },
  // Table
  table: {
    backgroundColor: '#fafafa', borderRadius: 12,
    borderWidth: 1, borderColor: Palette.border, overflow: 'hidden' as any,
  },
  thead: {
    flexDirection: 'row', backgroundColor: Palette.gray50,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Palette.border,
  },
  th: { fontSize: 13, fontWeight: '700', color: Palette.textSecondary, textTransform: 'uppercase' as any },
  tr: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Palette.border, alignItems: 'center',
  },
  trAlt: { backgroundColor: Palette.gray50 },
  td: { fontSize: 12, color: Palette.textSecondary },
  tdText: { fontSize: 12, fontWeight: '500', color: Palette.text },
  trInput: {
    height: 34, borderWidth: 1.5, borderColor: Palette.primary,
    borderRadius: 8, paddingHorizontal: 8, fontSize: 12,
    color: Palette.text, backgroundColor: Palette.primaryLight,
  },
  tdActions: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end', alignItems: 'center' },
  actionBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnSuccess: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Palette.successLight,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnDanger: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Palette.dangerLight,
    alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 12, color: Palette.textSecondary },
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const ProductScreen: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useProductStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal]   = useState(false);
  const [editProduct, setEditProduct] = useState<ProductMaster | null>(null);
  const [subView, setSubView]       = useState<SubView>('list');

  const filtered = useMemo(() => products.filter(p => {
    const matchS   = !search
      || p.name.toLowerCase().includes(search.toLowerCase())
      || p.code.toLowerCase().includes(search.toLowerCase())
      || p.barcode.includes(search)
      || p.uoms.some(u => u.barcodes.some(bc => bc.includes(search)));
    const matchCat = catFilter === 'all' || p.categoryId === catFilter;
    const matchSt  = statusFilter === 'all' || p.status === statusFilter;
    return matchS && matchCat && matchSt;
  }), [products, search, catFilter, statusFilter]);

  const getStatusBadge = (p: ProductMaster) => {
    if (p.status === 'inactive') return { label: 'ปิดใช้',    color: Palette.textSecondary, bg: Palette.gray100 };
    if (p.stockQty === 0)        return { label: 'หมดสต๊อก',  color: Palette.danger,        bg: Palette.dangerLight };
    if (p.stockQty <= p.minStock) return { label: 'ใกล้หมด',  color: Palette.warning,       bg: Palette.warningLight };
    return                              { label: 'ใช้งาน',    color: Palette.success,       bg: Palette.successLight };
  };

  return (
    <View style={s.root}>
      {/* Sub-nav */}
      <View style={[s.subNav, isMobile && s.subNavMobile]}>
        {[
          { key: 'list',      label: 'รายการสินค้า',   icon: 'list-outline' },
          { key: 'pricing',   label: 'กำหนดราคา',     icon: 'cash-outline' },
          { key: 'inventory', label: 'คลังสินค้า',     icon: 'archive-outline' },
          { key: 'import',    label: 'Import/Export',  icon: 'swap-vertical-outline' },
          { key: 'master',    label: 'มาสเตอร์',        icon: 'layers-outline' },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.subTab, subView === t.key && s.subTabActive]}
            onPress={() => setSubView(t.key as SubView)}
          >
            <Ionicons name={t.icon as any} size={15} color={subView === t.key ? Palette.primary : Palette.textSecondary} />
            <Text style={[s.subTabText, subView === t.key && s.subTabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── List view ── */}
      {subView === 'list' && (
        <>
          {/* Toolbar */}
          <View style={[s.toolbar, isMobile && s.toolbarMobile]}>
            <View style={s.searchBar}>
              <Ionicons name="search-outline" size={15} color={Palette.textSecondary} />
              <TextInput
                style={s.searchInput}
                placeholder="ค้นหา ชื่อ รหัส บาร์โค้ด..."
                placeholderTextColor={Palette.textDisabled}
                value={search}
                onChangeText={setSearch}
              />
              {search !== '' && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={15} color={Palette.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            {/* Category filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
              <TouchableOpacity
                style={[s.chip, catFilter === 'all' && s.chipActive]}
                onPress={() => setCatFilter('all')}
              >
                <Text style={[s.chipText, catFilter === 'all' && s.chipTextActive]}>ทั้งหมด</Text>
              </TouchableOpacity>
              {MOCK_CATEGORIES.filter(c => c.status === 'active').map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[s.chip, catFilter === c.id && s.chipActive]}
                  onPress={() => setCatFilter(c.id)}
                >
                  <Text style={[s.chipText, catFilter === c.id && s.chipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Status toggle */}
            <View style={s.statusToggle}>
              {(['all', 'active', 'inactive'] as const).map(st => (
                <TouchableOpacity
                  key={st}
                  style={[s.statusBtn, statusFilter === st && s.statusBtnActive]}
                  onPress={() => setStatusFilter(st)}
                >
                  <Text style={[s.statusBtnText, statusFilter === st && s.statusBtnTextActive]}>
                    {st === 'all' ? 'ทั้งหมด' : st === 'active' ? 'ใช้งาน' : 'ปิดใช้'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.exportBtn}>
              <Ionicons name="cloud-download-outline" size={14} color={Palette.textSecondary} />
              <Text style={s.exportBtnText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => { setEditProduct(null); setShowModal(true); }}
            >
              <Ionicons name="add" size={16} color="#fafafa" />
              <Text style={s.addBtnText}>เพิ่มสินค้า</Text>
            </TouchableOpacity>
          </View>

          {/* Table */}
          {isMobile ? (
            <View style={{ gap: 10 }}>
              {filtered.map((p) => {
                const st = getStatusBadge(p);
                return (
                  <TouchableOpacity key={p.id} style={{ backgroundColor: '#fafafa', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e7e5e4' }} onPress={() => { setEditProduct(p); setShowModal(true); }}>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                      {p.image ? (
                        <Image source={{ uri: p.image }} style={{ width: 40, height: 40, borderRadius: 8 }} resizeMode="cover" />
                      ) : (
                        <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="cube-outline" size={18} color={Palette.border} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#27272a' }} numberOfLines={1}>{p.name}</Text>
                        <Text style={{ fontSize: 12, color: '#57534e' }}>{p.code} · {p.categoryName}</Text>
                      </View>
                      <View style={[s.badge, { backgroundColor: st.bg }]}>
                        <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: Palette.primary }}>฿{p.salePrice}</Text>
                      <Text style={{ fontSize: 12, color: p.stockQty <= p.minStock ? Palette.danger : '#57534e', fontWeight: p.stockQty <= p.minStock ? '700' : '400' }}>คงเหลือ {p.stockQty} {p.unit}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {filtered.length === 0 && (
                <View style={s.empty}>
                  <Ionicons name="cube-outline" size={48} color={Palette.border} />
                  <Text style={s.emptyText}>ไม่พบสินค้า</Text>
                </View>
              )}
              <Text style={s.count}>{filtered.length} รายการ</Text>
            </View>
          ) : (
          <View style={s.table}>
            <View style={s.thead}>
              {[
                ['รูป',        0.5],
                ['รหัส/บาร์โค้ด', 1.2],
                ['ชื่อสินค้า', 2],
                ['หมวด',       0.9],
                ['หน่วย',      0.7],
                ['ราคา',       0.9],
                ['คงเหลือ',    0.8],
                ['สถานะ',      0.8],
                ['จัดการ',     0.9],
              ].map(([h, f]) => (
                <Text key={String(h)} style={[s.th, { flex: Number(f) }]}>{h}</Text>
              ))}
            </View>
            <FlatList
              data={filtered}
              keyExtractor={p => p.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: p, index }) => {
                const st = getStatusBadge(p);
                return (
                  <View style={[s.tr, index % 2 === 1 && s.trAlt]}>
                    {/* Thumbnail */}
                    <View style={[s.tdThumb, { flex: 0.5 }]}>
                      {p.image ? (
                        <Image source={{ uri: p.image }} style={s.thumb} resizeMode="cover" />
                      ) : (
                        <View style={s.thumbPlaceholder}>
                          <Ionicons name="cube-outline" size={16} color={Palette.border} />
                        </View>
                      )}
                    </View>
                    {/* รหัส / บาร์โค้ด */}
                    <View style={[s.tdCol, { flex: 1.2 }]}>
                      <Text style={s.tdBold}>{p.code}</Text>
                      <Text style={s.tdSub} numberOfLines={1}>{p.barcode}</Text>
                    </View>
                    {/* ชื่อ */}
                    <View style={[s.tdCol, { flex: 2 }]}>
                      <Text style={s.tdBold} numberOfLines={1}>{p.name}</Text>
                      <Text style={s.tdSub}>{p.brandName ?? ''}</Text>
                    </View>
                    {/* หมวด */}
                    <Text style={[s.td, { flex: 0.9 }]} numberOfLines={1}>{p.categoryName}</Text>
                    {/* หน่วย — badge count */}
                    <View style={{ flex: 0.7, alignItems: 'flex-start', justifyContent: 'center' }}>
                      <View style={s.uomBadge}>
                        <Ionicons name="layers-outline" size={10} color={Palette.primary} />
                        <Text style={s.uomBadgeText}>{p.uoms.length} หน่วย</Text>
                      </View>
                      <Text style={s.tdSub}>{p.unit}</Text>
                    </View>
                    {/* ราคา */}
                    <Text style={[s.td, { flex: 0.9, color: Palette.primary, fontWeight: '700' }]}>
                      ฿{p.salePrice}
                    </Text>
                    {/* คงเหลือ */}
                    <View style={{ flex: 0.8, justifyContent: 'center' }}>
                      <Text style={[
                        s.td,
                        p.stockQty <= p.minStock && { color: Palette.danger, fontWeight: '700' },
                      ]}>
                        {p.stockQty} {p.unit}
                      </Text>
                    </View>
                    {/* สถานะ */}
                    <View style={{ flex: 0.8, justifyContent: 'center' }}>
                      <View style={[s.badge, { backgroundColor: st.bg }]}>
                        <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
                      </View>
                    </View>
                    {/* จัดการ */}
                    <View style={[s.tdActions, { flex: 0.9 }]}>
                      <TouchableOpacity
                        style={s.actionBtn}
                        onPress={() => { setEditProduct(p); setShowModal(true); }}
                      >
                        <Ionicons name="pencil-outline" size={13} color={Palette.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: Palette.dangerLight }]}
                        onPress={() => deleteProduct(p.id)}
                      >
                        <Ionicons name="trash-outline" size={13} color={Palette.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={s.empty}>
                  <Ionicons name="cube-outline" size={48} color={Palette.border} />
                  <Text style={s.emptyText}>ไม่พบสินค้า</Text>
                </View>
              }
            />
            <Text style={s.count}>{filtered.length} รายการ</Text>
          </View>
          )}
        </>
      )}

      {/* ── Pricing ── */}
      {subView === 'pricing' && (
        <View style={s.subContent}>
          <Text style={s.subTitle}>กำหนดราคา</Text>
          <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 16 }}>ตั้งราคาขาย / ราคาทุน / ราคาสมาชิก</Text>
          <View style={{ backgroundColor: '#fafafa', borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', backgroundColor: Colors.background, paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
              <Text style={{ flex: 2, fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>สินค้า</Text>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textAlign: 'right' }}>ราคาทุน</Text>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textAlign: 'right' }}>ราคาขาย</Text>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textAlign: 'right' }}>ราคาสมาชิก</Text>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textAlign: 'right' }}>กำไร %</Text>
            </View>
            {products.slice(0, 15).map((p, i) => {
              const profit = p.salePrice > 0 && p.costPrice > 0 ? ((p.salePrice - p.costPrice) / p.costPrice * 100).toFixed(1) : '—';
              return (
                <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: i % 2 === 1 ? Colors.background : '#fafafa' }}>
                  <Text style={{ flex: 2, fontSize: 13, color: Colors.text }} numberOfLines={1}>{p.name}</Text>
                  <Text style={{ flex: 1, fontSize: 13, color: Colors.textSecondary, textAlign: 'right' }}>฿{fmt(p.costPrice)}</Text>
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: Colors.text, textAlign: 'right' }}>฿{fmt(p.salePrice)}</Text>
                  <Text style={{ flex: 1, fontSize: 13, color: Palette.primary, textAlign: 'right' }}>฿{fmt(p.salePrice * 0.95)}</Text>
                  <Text style={{ flex: 1, fontSize: 13, color: Number(profit) > 30 ? '#16a34a' : '#f59e0b', fontWeight: '600', textAlign: 'right' }}>{profit}%</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ── Inventory ── */}
      {subView === 'inventory' && (
        <View style={s.subContent}>
          <Text style={s.subTitle}>คลังสินค้า</Text>
          <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 16 }}>ตรวจสอบสต๊อก / สินค้าใกล้หมด / เคลื่อนไหว</Text>

          {/* KPI */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: '#fafafa', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.text }}>{products.length}</Text>
              <Text style={{ fontSize: 12, color: Colors.textSecondary }}>สินค้าทั้งหมด</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#fafafa', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#16a34a' }}>{products.filter(p => p.stockQty > p.minStock).length}</Text>
              <Text style={{ fontSize: 12, color: Colors.textSecondary }}>สต๊อกปกติ</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#fafafa', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#f59e0b' }}>{products.filter(p => p.stockQty > 0 && p.stockQty <= p.minStock).length}</Text>
              <Text style={{ fontSize: 12, color: Colors.textSecondary }}>ใกล้หมด</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#fafafa', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#ef4444' }}>{products.filter(p => p.stockQty === 0).length}</Text>
              <Text style={{ fontSize: 12, color: Colors.textSecondary }}>หมดสต๊อก</Text>
            </View>
          </View>

          {/* Table */}
          <View style={{ backgroundColor: '#fafafa', borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', backgroundColor: Colors.background, paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
              <Text style={{ flex: 2, fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>สินค้า</Text>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textAlign: 'right' }}>คงเหลือ</Text>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textAlign: 'right' }}>ขั้นต่ำ</Text>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' }}>สถานะ</Text>
            </View>
            {products.slice(0, 20).map((p, i) => {
              const status = p.stockQty === 0 ? { l: 'หมด', c: '#ef4444', bg: '#fee2e2' } : p.stockQty <= p.minStock ? { l: 'ใกล้หมด', c: '#f59e0b', bg: '#fef3c7' } : { l: 'ปกติ', c: '#16a34a', bg: '#dcfce7' };
              return (
                <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: i % 2 === 1 ? Colors.background : '#fafafa' }}>
                  <Text style={{ flex: 2, fontSize: 13, color: Colors.text }} numberOfLines={1}>{p.name}</Text>
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: Colors.text, textAlign: 'right' }}>{p.stockQty}</Text>
                  <Text style={{ flex: 1, fontSize: 13, color: Colors.textSecondary, textAlign: 'right' }}>{p.minStock}</Text>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: status.bg }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: status.c }}>{status.l}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ── Import/Export ── */}
      {subView === 'import' && (
        <View style={s.subContent}>
          <Text style={s.subTitle}>Import / Export สินค้า</Text>
          <View style={s.importGrid}>
            <View style={s.importCard}>
              <Ionicons name="cloud-upload-outline" size={32} color={Palette.primary} />
              <Text style={s.importCardTitle}>Import จาก Excel</Text>
              <Text style={s.importCardSub}>รองรับ .xlsx, .csv ขนาดไม่เกิน 10MB</Text>
              <TouchableOpacity style={s.importBtn}>
                <Text style={s.importBtnText}>เลือกไฟล์</Text>
              </TouchableOpacity>
            </View>
            <View style={s.importCard}>
              <Ionicons name="cloud-download-outline" size={32} color={Palette.success} />
              <Text style={s.importCardTitle}>Export สินค้าทั้งหมด</Text>
              <Text style={s.importCardSub}>{products.length} รายการ</Text>
              <TouchableOpacity style={[s.importBtn, { backgroundColor: Palette.success }]}>
                <Text style={s.importBtnText}>Export Excel</Text>
              </TouchableOpacity>
            </View>
            <View style={s.importCard}>
              <Ionicons name="document-text-outline" size={32} color={Palette.warning} />
              <Text style={s.importCardTitle}>Download Template</Text>
              <Text style={s.importCardSub}>แบบฟอร์มสำหรับกรอกข้อมูล</Text>
              <TouchableOpacity style={[s.importBtn, { backgroundColor: Palette.warning }]}>
                <Text style={s.importBtnText}>ดาวน์โหลด</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ── Master ── */}
      {subView === 'master' && (
        <View style={s.subContent}>
          <MasterScreen allProducts={products} />
        </View>
      )}

      {/* Add/Edit Modal */}
      <ProductFormModal
        key={editProduct?.id ?? 'new'}
        visible={showModal}
        product={editProduct}
        onSave={data => {
          if (editProduct) {
            updateProduct(editProduct.id, data as Partial<ProductMaster>);
          } else {
            const newP: ProductMaster = {
              id: `p_${Date.now()}`,
              ...data as any,
              productType: (data as any).productType ?? 'general',
              stockQty: 0,
              vatRate: data.vatIncluded ? 7 : 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            addProduct(newP);
          }
          setShowModal(false);
        }}
        onClose={() => setShowModal(false)}
      />
    </View>
  );
};

const s: Record<string, any> = {
  root: { flex: 1, gap: 14 },
  subNav: {
    flexDirection: 'row', gap: 4, backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: Palette.border, borderRadius: 16,
    padding: 5,
  },
  subNavMobile: { flexWrap: 'wrap' },
  subTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    minHeight: 42, paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 11, borderWidth: 1, borderColor: 'transparent',
  },
  subTabActive: { borderColor: '#fecdd3', backgroundColor: Palette.primaryLight },
  subTabText: { fontSize: 12, color: Palette.textSecondary },
  subTabTextActive: { color: Palette.primary, fontWeight: '700' },
  // Toolbar
  toolbar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    flexWrap: 'wrap',
  },
  toolbarMobile: { alignItems: 'stretch' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 200,
    backgroundColor: '#ffffff', borderRadius: 12,
    borderWidth: 1, borderColor: Palette.border,
    paddingHorizontal: 12, height: 44,
  },
  searchInput: { flex: 1, fontSize: 12, color: Palette.text },
  chipRow: { gap: 6, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#fafafa', borderWidth: 1, borderColor: Palette.border,
  },
  chipActive: { backgroundColor: Palette.primary, borderColor: Palette.primary },
  chipText: { fontSize: 13, color: Palette.textSecondary },
  chipTextActive: { color: '#fafafa', fontWeight: '700' },
  statusToggle: {
    flexDirection: 'row', backgroundColor: Palette.gray100,
    borderRadius: 8, padding: 3, gap: 2,
  },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  statusBtnActive: { backgroundColor: '#fafafa' },
  statusBtnText: { fontSize: 13, color: Palette.textSecondary },
  statusBtnTextActive: { color: Palette.text, fontWeight: '700' },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: Palette.border,
    borderRadius: 8, paddingHorizontal: 12, height: 40,
    backgroundColor: '#fafafa',
  },
  exportBtnText: { fontSize: 12, color: Palette.textSecondary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Palette.primary, borderRadius: 8, paddingHorizontal: 16, height: 40,
  },
  addBtnText: { fontSize: 12, fontWeight: '700', color: '#fafafa' },
  // Table
  table: {
    backgroundColor: '#ffffff', borderRadius: 16,
    borderWidth: 1, borderColor: Palette.border, flex: 1,
    overflow: 'hidden' as any,
  },
  thead: {
    flexDirection: 'row', backgroundColor: Palette.gray50,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Palette.border,
  },
  th: { fontSize: 13, fontWeight: '700', color: Palette.textSecondary, textTransform: 'uppercase' },
  tr: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Palette.border, alignItems: 'center',
  },
  trAlt: { backgroundColor: Palette.gray50 },
  td: { flex: 1, fontSize: 12, color: Palette.text },
  tdCol: { justifyContent: 'center' },
  tdBold: { fontSize: 12, fontWeight: '600', color: Palette.text },
  tdSub: { fontSize: 13, color: Palette.textSecondary, marginTop: 1 },
  // Thumbnail
  tdThumb: { justifyContent: 'center', alignItems: 'flex-start' },
  thumb: { width: 40, height: 40, borderRadius: 8 },
  thumbPlaceholder: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: Palette.gray100,
    alignItems: 'center', justifyContent: 'center',
  },
  // UOM badge
  uomBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Palette.primaryLight, borderRadius: 12,
    paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start',
  },
  uomBadgeText: { fontSize: 12, fontWeight: '700', color: Palette.primary },
  badge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 13, fontWeight: '700' },
  tdActions: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end' },
  actionBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  count: {
    fontSize: 13, color: Palette.textSecondary,
    padding: 10, textAlign: 'right',
    borderTopWidth: 1, borderTopColor: Palette.border,
  },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 12, color: Palette.textSecondary },
  // Sub views
  subContent: { flex: 1, gap: 16 },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subTitle: { fontSize: 14, fontWeight: '700', color: Palette.text },
  importGrid: { flexDirection: 'row', gap: 16 },
  importCard: {
    flex: 1, backgroundColor: '#fafafa', borderRadius: 12,
    padding: 24, alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: Palette.border,
  },
  importCardTitle: { fontSize: 12, fontWeight: '700', color: Palette.text },
  importCardSub: { fontSize: 12, color: Palette.textSecondary, textAlign: 'center' },
  importBtn: {
    backgroundColor: Palette.primary, borderRadius: 8,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 4,
  },
  importBtnText: { fontSize: 12, fontWeight: '700', color: '#fafafa' },
  catGrid: { gap: 8 },
  catCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fafafa', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Palette.border,
  },
  catCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  catIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  catName: { fontSize: 12, fontWeight: '600', color: Palette.text },
  catCount: { fontSize: 13, color: Palette.textSecondary },
};
