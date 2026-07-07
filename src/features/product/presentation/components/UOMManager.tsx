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
import { View, TouchableOpacity, FlatList, Modal, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { ProductUOM } from '@/features/product/domain/product';
import { cn } from '@/shared/lib/cn';
import { formatCurrency } from '@/shared/lib/format';
import { Text, TextInput } from '@/shared/tw/index';

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
    <View className="gap-1">
      <View className="flex-row gap-1">
        <TextInput
          className="flex-1 h-10 bg-gray-50 rounded-lg border border-slate-200 px-2 text-base text-slate-950"
          value={input}
          onChangeText={setInput}
          placeholder="กรอกหรือสแกนบาร์โค้ด"
          placeholderTextColor="#9ca3af"
          keyboardType="default"
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity className="w-10 h-10 bg-rose-50 rounded-lg items-center justify-center border border-rose-500" onPress={() => {/* TODO: camera scan */}}>
          <Ionicons name="barcode-outline" size={18} color="#f87171" />
        </TouchableOpacity>
        <TouchableOpacity className="w-10 h-10 bg-rose-500 rounded-lg items-center justify-center" onPress={handleAdd}>
          <Ionicons name="add" size={18} color="#fafafa" />
        </TouchableOpacity>
      </View>
      {barcodes.length > 0 && (
        <View className="flex-row flex-wrap gap-1">
          {barcodes.map((bc) => (
            <View key={bc} className="flex-row items-center gap-1 bg-rose-50 rounded-full px-2 py-1 border border-rose-500">
              <Ionicons name="barcode" size={12} color="#f87171" />
              <Text className="text-xs text-rose-600 font-semibold">{bc}</Text>
              <TouchableOpacity onPress={() => onRemove(bc)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="close-circle" size={14} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

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
    <View className={cn('bg-white rounded-xl border-[1.5px] border-slate-200 overflow-hidden', uom.isDefault && 'border-amber-500')}>
      {/* Header row */}
      <TouchableOpacity className="flex-row items-center gap-2 p-3" onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View className={cn('bg-gray-100 rounded-lg px-2 py-1 min-w-[52px] items-center', isBase && 'bg-rose-500')}>
          <Text className={cn('text-xs font-bold text-slate-950', isBase && 'text-white')}>{uom.unit}</Text>
        </View>

        <View className="flex-1">
          <Text className="text-xs text-slate-500">
            {isBase ? '(หน่วยฐาน)' : `1 ${uom.unit} = ${uom.ratio} ${baseUnit}`}
          </Text>
          <Text className="text-xs font-bold text-rose-600">฿{formatCurrency(uom.salePrice)}</Text>
        </View>

        <View className="flex-row items-center gap-1">
          {uom.isDefault && (
            <View className="flex-row items-center gap-0.5 bg-amber-500 rounded-full px-[6px] py-0.5">
              <Ionicons name="star" size={10} color="#fafafa" />
              <Text className="text-[9px] text-white font-extrabold">Default</Text>
            </View>
          )}
          <View className="flex-row items-center gap-0.5 bg-gray-100 rounded-lg px-[5px] py-0.5">
            <Ionicons name="barcode-outline" size={12} color="#6b7280" />
            <Text className="text-[10px] text-gray-500 font-semibold">{uom.barcodes.length}</Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#9ca3af" />
        </View>
      </TouchableOpacity>

      {/* Expanded detail */}
      {expanded && (
        <View className="border-t border-slate-200 p-3 gap-2 bg-gray-50">
          <View className="flex-row items-center gap-2">
            <Text className="text-xs text-slate-500 w-[60px]">ราคาขาย</Text>
            <Text className="text-base text-slate-950 font-medium">฿{formatCurrency(uom.salePrice)}</Text>
            {!isBase && (
              <Text className="text-xs text-gray-400">(auto: ฿{autoPrice})</Text>
            )}
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-xs text-slate-500 w-[60px]">ราคาทุน</Text>
            <Text className="text-base text-slate-950 font-medium">฿{formatCurrency(uom.costPrice)}</Text>
          </View>
          {!isBase && (
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-slate-500 w-[60px]">เรโช</Text>
              <Text className="text-base text-slate-950 font-medium">1 {uom.unit} = {uom.ratio} {baseUnit}</Text>
            </View>
          )}

          {/* Barcodes */}
          <Text className="text-xs font-semibold text-gray-700 mt-1">บาร์โค้ด ({uom.barcodes.length})</Text>
          <BarcodeChips
            barcodes={uom.barcodes}
            onAdd={(bc) => onBarcodesChange([...uom.barcodes, bc])}
            onRemove={(bc) => onBarcodesChange(uom.barcodes.filter((b) => b !== bc))}
          />

          {/* Action buttons */}
          <View className="flex-row gap-2 mt-1 flex-wrap">
            {!uom.isDefault && (
              <TouchableOpacity className="flex-row items-center gap-1 bg-white rounded-lg px-2 py-1 border border-slate-200" onPress={onSetDefault}>
                <Ionicons name="star-outline" size={14} color="#a16207" />
                <Text className="text-xs font-semibold text-amber-600">ตั้งเป็น Default</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity className="flex-row items-center gap-1 bg-white rounded-lg px-2 py-1 border border-slate-200" onPress={onEdit}>
              <Ionicons name="pencil-outline" size={14} color="#f87171" />
              <Text className="text-xs font-semibold text-rose-600">แก้ไข</Text>
            </TouchableOpacity>
            {!isBase && (
              <TouchableOpacity className="flex-row items-center gap-1 bg-rose-50 rounded-lg px-2 py-1 border border-rose-50" onPress={onDelete}>
                <Ionicons name="trash-outline" size={14} color="#ef4444" />
                <Text className="text-xs font-semibold text-rose-600">ลบ</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

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
      <View className="flex-1 bg-black/50 justify-end">
        <ScrollView>
          <View className="bg-white rounded-t-[24px] p-4 gap-3">
            <View className="w-10 h-1 bg-gray-200 rounded-sm self-center mb-1" />
            <Text className="text-lg font-semibold text-slate-950">{uom?.id ? 'แก้ไขหน่วยนับ' : 'เพิ่มหน่วยนับ'}</Text>

            {!isBase && (
              <View className="flex-row items-center gap-1 bg-rose-50 rounded-lg p-2">
                <Ionicons name="information-circle-outline" size={16} color="#f87171" />
                <Text className="text-base text-rose-600">หน่วยฐาน: <Text className="font-bold">{baseUnit}</Text> (ราคา ฿{baseSalePrice})</Text>
              </View>
            )}

            {/* Unit name */}
            <Text className="text-xs font-semibold text-gray-700">ชื่อหน่วย *</Text>
            <TextInput
              className="bg-gray-50 rounded-lg border-[1.5px] border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950"
              value={unit}
              onChangeText={setUnit}
              placeholder="เช่น แพ็ค, ลัง, โหล, กล่อง"
              placeholderTextColor="#9ca3af"
              editable={!isBase}
            />

            {/* Ratio (non-base only) */}
            {!isBase && (
              <>
                <Text className="text-xs font-semibold text-gray-700">เรโช (Ratio) *</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-base text-slate-950 min-w-[50px]">1 {unit || '?'} =</Text>
                  <TextInput
                    className="flex-1 bg-gray-50 rounded-lg border-[1.5px] border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950"
                    value={ratio}
                    onChangeText={setRatio}
                    placeholder="เช่น 6, 12, 24"
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                  />
                  <Text className="text-base text-slate-950 min-w-[40px]">{baseUnit}</Text>
                </View>
                {ratioNum > 1 && (
                  <View className="flex-row items-center gap-1 bg-rose-50 rounded-lg p-2">
                    <Ionicons name="swap-horizontal-outline" size={14} color="#f87171" />
                    <Text className="text-xs text-rose-600">
                      ซื้อ 1 {unit || '?'} = ได้ {ratioNum} {baseUnit} · Stock เพิ่ม {ratioNum} ชิ้น
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Price */}
            {!isBase && (
              <>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-semibold text-gray-700">ราคา</Text>
                  <TouchableOpacity
                    className={cn('flex-row items-center gap-1 bg-gray-100 rounded-full px-2 py-1 border border-slate-200', autoCalc && 'bg-rose-500 border-rose-500')}
                    onPress={() => setAutoCalc(!autoCalc)}
                  >
                    <Ionicons name={autoCalc ? 'flash' : 'flash-off-outline'} size={12} color={autoCalc ? '#fafafa' : '#6b7280'} />
                    <Text className={cn('text-[11px] text-gray-500 font-semibold', autoCalc && 'text-white')}>
                      คำนวณ auto
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Text className="text-xs text-slate-500 mb-1">ราคาทุน (฿)</Text>
                    <TextInput
                      className="bg-gray-50 rounded-lg border-[1.5px] border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950"
                      value={autoCalc ? autoCost : costPrice}
                      onChangeText={setCostPrice}
                      placeholder={autoCost}
                      placeholderTextColor="#9ca3af"
                      keyboardType="decimal-pad"
                      editable={!autoCalc}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-slate-500 mb-1">ราคาขาย (฿)</Text>
                    <TextInput
                      className="bg-gray-50 rounded-lg border-[1.5px] border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950"
                      value={autoCalc ? autoSale : salePrice}
                      onChangeText={setSalePrice}
                      placeholder={autoSale}
                      placeholderTextColor="#9ca3af"
                      keyboardType="decimal-pad"
                      editable={!autoCalc}
                    />
                  </View>
                </View>

                {autoCalc && ratioNum > 1 && (
                  <View className="bg-gray-50 rounded-lg p-2 gap-0.5">
                    <Text className="text-xs text-slate-950">
                      ราคาทุน: ฿{baseCostPrice} × {ratioNum} = <Text className="font-bold text-rose-600">฿{autoCost}</Text>
                    </Text>
                    <Text className="text-xs text-slate-950">
                      ราคาขาย: ฿{baseSalePrice} × {ratioNum} = <Text className="font-bold text-rose-600">฿{autoSale}</Text>
                    </Text>
                  </View>
                )}
              </>
            )}

            <View className="flex-row gap-2 pt-1">
              <TouchableOpacity className="flex-1 items-center py-3 rounded-xl border-[1.5px] border-slate-200" onPress={onClose}>
                <Text className="text-base font-semibold text-slate-500">ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-[2] flex-row items-center justify-center gap-1 bg-rose-500 rounded-xl py-3" onPress={handleSave}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fafafa" />
                <Text className="text-base font-semibold text-white">บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

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
    <View className="gap-3">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <Ionicons name="layers-outline" size={18} color="#f87171" />
          <Text className="text-xs font-bold text-rose-600">หน่วยนับและบาร์โค้ด</Text>
          <View className="bg-rose-500 rounded-[10px] px-[6px] py-[1px]">
            <Text className="text-[10px] text-white font-extrabold">{uoms.length}</Text>
          </View>
        </View>
        <TouchableOpacity className="flex-row items-center gap-1 bg-rose-50 rounded-xl px-2 py-1 border border-rose-500" onPress={openAdd}>
          <Ionicons name="add-circle-outline" size={16} color="#f87171" />
          <Text className="text-xs text-rose-600 font-bold">เพิ่มหน่วย</Text>
        </TouchableOpacity>
      </View>

      {/* Summary table */}
      {uoms.length > 1 && (
        <View className="rounded-xl overflow-hidden border border-slate-200">
          <View className="flex-row bg-gray-100 px-2 py-1">
            <Text className="flex-[1.5] text-xs text-slate-500 text-center">หน่วย</Text>
            <Text className="flex-1 text-xs text-slate-500 text-center">เรโช</Text>
            <Text className="flex-1 text-xs text-slate-500 text-center">ราคา</Text>
            <Text className="flex-1 text-xs text-slate-500 text-center">บาร์โค้ด</Text>
          </View>
          {uoms.map((uom) => (
            <View key={uom.id} className={cn('flex-row px-2 py-1 border-t border-slate-200', uom.isDefault && 'bg-amber-50')}>
              <View className="flex-[1.5] flex-row items-center gap-1">
                <Text className="text-xs text-slate-950 font-medium">{uom.unit}</Text>
                {uom.isDefault && <Ionicons name="star" size={10} color="#a16207" />}
              </View>
              <Text className="flex-1 text-xs text-slate-500 text-center">{uom.ratio === 1 ? '—' : `×${uom.ratio}`}</Text>
              <Text className="flex-1 text-xs text-center font-semibold text-rose-600">฿{uom.salePrice}</Text>
              <Text className="flex-1 text-xs text-slate-500 text-center">{uom.barcodes.length} บาร์</Text>
            </View>
          ))}
        </View>
      )}

      {/* UOM Cards */}
      <View className="gap-2">
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
        <View className="items-center gap-1 py-3">
          <Ionicons name="layers-outline" size={32} color="#d1d5db" />
          <Text className="text-base text-gray-400">ยังไม่มีหน่วยนับ กดเพิ่มหน่วย</Text>
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
