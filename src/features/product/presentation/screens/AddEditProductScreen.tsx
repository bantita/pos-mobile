import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, FlatList, KeyboardAvoidingView } from '@/shared/tw/index';
import { Switch, Modal, Platform } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { ProductMaster } from '@/features/product/domain/product';
import { MOCK_CATEGORIES, MOCK_BRANDS, UNITS } from '@/features/product/data/mocks/mockProducts';
import { UOMManager } from '@/features/product/presentation/components/UOMManager';
import type { ProductUOM } from '@/features/product/domain/product';
import { formatCurrency } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

interface AddEditProductScreenProps {
  product?: ProductMaster;
  onBack: () => void;
  onSaved: (product: ProductMaster) => void;
}

const SectionHeader: React.FC<{ title: string; icon: string }> = ({ title, icon }) => (
  <View className={cn('flex-row items-center gap-1 mb-2')}>
    <View className={cn('w-[26px] h-[26px] rounded-[6px] bg-rose-50 items-center justify-center')}>
      <Ionicons name={icon as any} size={16} color="#f87171" />
    </View>
    <Text className={cn('text-xs font-bold text-rose-600')}>{title}</Text>
  </View>
);

interface PickerModalProps {
  visible: boolean;
  title: string;
  items: { id: string; name: string }[];
  selectedId: string;
  onSelect: (id: string, name: string) => void;
  onClose: () => void;
}
const PickerModal: React.FC<PickerModalProps> = ({ visible, title, items, selectedId, onSelect, onClose }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View className={cn('flex-1 justify-end', 'bg-black/50')}>
      <View className={cn('bg-white rounded-t-[24px] p-4 max-h-[70%]')}>
        <View className={cn('w-10 h-1 bg-gray-200 rounded-[2px] self-center mb-3')} />
        <Text className={cn('text-lg font-bold text-slate-950 mb-3')}>{title}</Text>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={cn('flex-row items-center justify-between py-3 border-b border-slate-200', selectedId === item.id && 'bg-rose-50 rounded-lg px-2')}
              onPress={() => { onSelect(item.id, item.name); onClose(); }}
            >
              <Text className={cn('text-base leading-relaxed text-slate-950', selectedId === item.id && 'text-rose-600 font-bold')}>
                {item.name}
              </Text>
              {selectedId === item.id && <Ionicons name="checkmark-circle" size={20} color="#f87171" />}
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity className={cn('items-center py-3 mt-1')} onPress={onClose}>
          <Text className={cn('text-base font-bold text-rose-600')}>ยกเลิก</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export const AddEditProductScreen: React.FC<AddEditProductScreenProps> = ({
  product, onBack, onSaved,
}) => {
  const isEdit = !!product;

  const [code, setCode] = useState(product?.code ?? '');
  const [barcode, setBarcode] = useState(product?.barcode ?? '');
  const [name, setName] = useState(product?.name ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? '');
  const [categoryName, setCategoryName] = useState(product?.categoryName ?? '');
  const [brandId, setBrandId] = useState(product?.brandId ?? '');
  const [brandName, setBrandName] = useState(product?.brandName ?? '');
  const [unit, setUnit] = useState(product?.unit ?? 'ชิ้น');
  const [costPrice, setCostPrice] = useState(product ? String(product.costPrice) : '');
  const [salePrice, setSalePrice] = useState(product ? String(product.salePrice) : '');
  const [vatEnabled, setVatEnabled] = useState(product?.vatIncluded ?? true);
  const [vatRate, setVatRate] = useState(product?.vatRate ?? 7);
  const [productType, setProductType] = useState<'general' | 'service'>(product?.productType ?? 'general');
  const [minStock, setMinStock] = useState(product ? String(product.minStock) : '5');
  const [status, setStatus] = useState<'active' | 'inactive'>(product?.status ?? 'active');
  const [uoms, setUoms] = useState<ProductUOM[]>(
    product?.uoms ?? []
  );
  const [saving, setSaving] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const syncBaseUOM = (newUnit: string, newCost: number, newSale: number) => {
    setUoms((prev) => {
      if (prev.length === 0) {
        return [{
          id: 'uom_base',
          unit: newUnit,
          ratio: 1,
          costPrice: newCost,
          salePrice: newSale,
          barcodes: barcode ? [barcode] : [],
          isDefault: true,
        }];
      }
      return prev.map((u, i) => i === 0 ? { ...u, unit: newUnit, costPrice: newCost, salePrice: newSale } : u);
    });
  };

  const handleUnitChange = (v: string) => {
    setUnit(v);
    syncBaseUOM(v, parseFloat(costPrice) || 0, parseFloat(salePrice) || 0);
  };
  const handleCostChange = (v: string) => {
    setCostPrice(v);
    syncBaseUOM(unit, parseFloat(v) || 0, parseFloat(salePrice) || 0);
  };
  const handleSaleChange = (v: string) => {
    setSalePrice(v);
    syncBaseUOM(unit, parseFloat(costPrice) || 0, parseFloat(v) || 0);
  };

  const cost = parseFloat(costPrice) || 0;
  const sale = parseFloat(salePrice) || 0;
  const margin = sale > 0 ? (((sale - cost) / sale) * 100).toFixed(1) : '0';
  const profit = sale - cost;

  const autoGenCode = () => {
    const ts = Date.now().toString().slice(-6);
    setCode(`P${ts}`);
  };

  const validate = (): string | null => {
    if (!code.trim()) return 'กรุณากรอกรหัสสินค้า';
    if (!name.trim()) return 'กรุณากรอกชื่อสินค้า';
    if (!categoryId) return 'กรุณาเลือกหมวดหมู่';
    if (sale <= 0) return 'กรุณากรอกราคาขาย';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setAlertMessage(err); setAlertVisible(true); return; }
    setSaving(true);
    setTimeout(() => {
      const saved: ProductMaster = {
        id: product?.id ?? `p_${Date.now()}`,
        code, barcode, name, categoryId, categoryName,
        brandId: brandId || undefined, brandName: brandName || undefined,
        unit, costPrice: cost, salePrice: sale,
        vatIncluded: vatEnabled, vatRate: vatEnabled ? vatRate : 0,
        productType,
        status, stockQty: product?.stockQty ?? 0,
        minStock: parseInt(minStock) || 5,
        uoms: uoms.length > 0 ? uoms : [{
          id: 'uom_base', unit, ratio: 1,
          costPrice: cost, salePrice: sale,
          barcodes: barcode ? [barcode] : [],
          isDefault: true,
        }],
        createdAt: product?.createdAt ?? new Date(),
        updatedAt: new Date(),
      };
      setSaving(false);
      if (isEdit) {
        if (product && product.salePrice !== sale) {
          console.log(`[AUDIT] PRICE_CHANGE - Product: ${name}, Old: ${product.salePrice}, New: ${sale}, At: ${new Date().toISOString()}`);
        }
      }
      onSaved(saved);
    }, 800);
  };

  const FieldRow: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
    <View className={cn('mb-3')}>
      <Text className={cn('text-xs font-bold text-gray-700 mb-1')}>{label}{required && <Text className={cn('text-rose-600')}> *</Text>}</Text>
      {children}
    </View>
  );

  const PickerField: React.FC<{ label: string; value: string; placeholder: string; required?: boolean; onPress: () => void }> = ({ label, value, placeholder, required, onPress }) => (
    <FieldRow label={label} required={required}>
      <TouchableOpacity className={cn('flex-row items-center justify-between bg-rose-50 rounded-xl border border-slate-200 px-3 py-[10px]')} onPress={onPress} activeOpacity={0.8}>
        <Text className={cn('text-base leading-relaxed font-medium', value ? 'text-slate-950' : 'text-gray-400')}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#9ca3af" />
      </TouchableOpacity>
    </FieldRow>
  );

  return (
    <SafeAreaView className={cn('flex-1', 'bg-[#f6f7fb]')} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className={cn('flex-1')}>
        <View className={cn('flex-row items-center justify-between bg-rose-600 px-3 py-3')}>
          <TouchableOpacity onPress={onBack} className={cn('p-1')}>
            <Ionicons name="arrow-back" size={24} color="#fafafa" />
          </TouchableOpacity>
          <Text className={cn('text-lg font-extrabold text-white')}>{isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerClassName={cn('p-3 gap-3 pb-[100px]')} keyboardShouldPersistTaps="handled">

          <View className={cn('bg-white rounded-2xl p-3 shadow-sm')}>
            <SectionHeader title="ข้อมูลพื้นฐาน" icon="information-circle-outline" />

            <FieldRow label="รหัสสินค้า" required>
              <View className={cn('flex-row gap-2')}>
                <TextInput
                  className={cn('flex-1 bg-rose-50 rounded-xl border border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950 font-medium')}
                  value={code}
                  onChangeText={setCode}
                  placeholder="เช่น P001"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="characters"
                />
                <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-50 rounded-xl px-3 py-2 border border-rose-500 min-h-10')} onPress={autoGenCode}>
                  <Ionicons name="refresh-outline" size={16} color="#f87171" />
                  <Text className={cn('text-xs text-rose-600 font-bold')}>Auto</Text>
                </TouchableOpacity>
              </View>
            </FieldRow>

            <FieldRow label="บาร์โค้ด">
              <View className={cn('flex-row gap-2')}>
                <TextInput
                  className={cn('flex-1 bg-rose-50 rounded-xl border border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950 font-medium')}
                  value={barcode}
                  onChangeText={setBarcode}
                  placeholder="สแกนหรือกรอกบาร์โค้ด"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                />
                <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-50 rounded-xl px-2 border border-rose-500')}>
                  <Ionicons name="barcode-outline" size={18} color="#f87171" />
                </TouchableOpacity>
              </View>
            </FieldRow>

            <FieldRow label="ชื่อสินค้า" required>
              <TextInput
                className={cn('bg-rose-50 rounded-xl border border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950 font-medium')}
                value={name}
                onChangeText={setName}
                placeholder="กรอกชื่อสินค้า"
                placeholderTextColor="#9ca3af"
              />
            </FieldRow>
          </View>

          <View className={cn('bg-white rounded-2xl p-3 shadow-sm')}>
            <SectionHeader title="หมวดหมู่และหน่วย" icon="list-outline" />
            <PickerField label="หมวดหมู่" value={categoryName} placeholder="เลือกหมวดหมู่" required onPress={() => setShowCatPicker(true)} />
            <PickerField label="Brand" value={brandName} placeholder="เลือก Brand (ถ้ามี)" onPress={() => setShowBrandPicker(true)} />
            <PickerField label="หน่วยนับ" value={unit} placeholder="เลือกหน่วย" required onPress={() => setShowUnitPicker(true)} />
          </View>

          <View className={cn('bg-white rounded-2xl p-3 shadow-sm')}>
            <SectionHeader title="ราคาและต้นทุน" icon="cash-outline" />
            <View className={cn('flex-row gap-3')}>
              <FieldRow label="ราคาทุน (฿)">
                <TextInput
                  className={cn('bg-rose-50 rounded-xl border border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950 font-medium')}
                  value={costPrice}
                  onChangeText={handleCostChange}
                  placeholder="0.00"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                />
              </FieldRow>
              <FieldRow label="ราคาขาย (฿)" required>
                <TextInput
                  className={cn('bg-rose-50 rounded-xl border border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950 font-medium')}
                  value={salePrice}
                  onChangeText={handleSaleChange}
                  placeholder="0.00"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                />
              </FieldRow>
            </View>

            {cost > 0 && sale > 0 && (
              <View className={cn('flex-row bg-rose-50 rounded-xl p-3 mb-3 border border-slate-200')}>
                <View className={cn('flex-1 items-center')}>
                  <Text className={cn('text-xs text-slate-500 font-medium')}>กำไร/ชิ้น</Text>
                  <Text className={cn('text-xs font-bold')} style={{ color: profit >= 0 ? '#0f766e' : '#ef4444' }}>
                    ฿{formatCurrency(profit)}
                  </Text>
                </View>
                <View className={cn('w-[1px] bg-slate-200')} />
                <View className={cn('flex-1 items-center')}>
                  <Text className={cn('text-xs text-slate-500 font-medium')}>Margin</Text>
                  <Text className={cn('text-xs font-bold')} style={{ color: parseFloat(margin) >= 20 ? '#0f766e' : '#a16207' }}>
                    {margin}%
                  </Text>
                </View>
                <View className={cn('w-[1px] bg-slate-200')} />
                <View className={cn('flex-1 items-center')}>
                  <Text className={cn('text-xs text-slate-500 font-medium')}>VAT 7%</Text>
                  <Text className={cn('text-xs font-semibold text-slate-950')}>{vatEnabled ? '฿' + formatCurrency(sale * 0.07) : '-'}</Text>
                </View>
              </View>
            )}

            <View className={cn('flex-row items-center justify-between py-[2px]')}>
              <View>
                <Text className={cn('text-xs font-bold text-slate-950')}>ราคารวม VAT</Text>
                <Text className={cn('text-xs text-slate-500 font-medium')}>ราคาขายรวมภาษีมูลค่าเพิ่มแล้ว</Text>
              </View>
              <Switch
                value={vatEnabled}
                onValueChange={setVatEnabled}
              />
            </View>
            {vatEnabled && (
              <View className={cn('flex-row items-center gap-2 mt-1 pl-1')}>
                <Text className={cn('text-xs text-gray-600 mr-1 font-medium')}>อัตรา VAT:</Text>
                {[7, 0].map((rate) => (
                  <TouchableOpacity
                    key={rate}
                    className={cn('px-3 py-[6px] rounded-full bg-neutral-100 border border-slate-200', vatRate === rate && 'bg-rose-500 border-rose-500')}
                    onPress={() => setVatRate(rate)}
                  >
                    <Text className={cn('text-xs font-semibold text-gray-600 text-[13px]', vatRate === rate && 'text-white')}>
                      {rate}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View className={cn('bg-white rounded-2xl p-3 shadow-sm')}>
            <SectionHeader title="ประเภทสินค้า" icon="pricetag-outline" />
            <View className={cn('flex-row gap-2')}>
              <TouchableOpacity
                className={cn('flex-1 flex-row items-center justify-center gap-1 py-3 rounded-xl bg-neutral-100 border border-slate-200', productType === 'general' && 'bg-rose-500 border-rose-500')}
                onPress={() => setProductType('general')}
              >
                <Ionicons name="cube-outline" size={20} color={productType === 'general' ? '#fafafa' : '#4b5563'} />
                <Text className={cn('text-xs font-semibold text-gray-600', productType === 'general' && 'text-white')}>สินค้าทั่วไป</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={cn('flex-1 flex-row items-center justify-center gap-1 py-3 rounded-xl bg-neutral-100 border border-slate-200', productType === 'service' && 'bg-rose-500 border-rose-500')}
                onPress={() => setProductType('service')}
              >
                <Ionicons name="cut-outline" size={20} color={productType === 'service' ? '#fafafa' : '#4b5563'} />
                <Text className={cn('text-xs font-semibold text-gray-600', productType === 'service' && 'text-white')}>สินค้าบริการ</Text>
              </TouchableOpacity>
            </View>
            {productType === 'service' && (
              <Text className={cn('text-xs text-rose-600 mt-2 font-medium')}>
                สินค้าบริการจะแสดง popup เลือกช่าง/พนักงานทุกครั้งที่เพิ่มในบิล
              </Text>
            )}
          </View>

          <View className={cn('bg-white rounded-2xl p-3 shadow-sm')}>
            <UOMManager
              uoms={uoms}
              baseUnit={unit || 'ชิ้น'}
              baseCostPrice={cost}
              baseSalePrice={sale}
              onChange={setUoms}
            />
          </View>

          <View className={cn('bg-white rounded-2xl p-3 shadow-sm')}>
            <SectionHeader title="สต๊อก" icon="archive-outline" />
            <FieldRow label="จำนวนขั้นต่ำ (Min Stock)">
              <TextInput
                className={cn('bg-rose-50 rounded-xl border border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950 font-medium')}
                value={minStock}
                onChangeText={setMinStock}
                placeholder="5"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
              />
            </FieldRow>
            <Text className={cn('text-xs text-slate-500 font-medium', '-mt-[2px]')}>
              ระบบจะแจ้งเตือนเมื่อสต๊อกเหลือน้อยกว่าค่านี้
            </Text>
          </View>

          <View className={cn('bg-white rounded-2xl p-3 shadow-sm')}>
            <SectionHeader title="รูปภาพสินค้า" icon="image-outline" />
            <TouchableOpacity className={cn('border-2 border-dashed border-slate-200 rounded-xl p-5 items-center gap-1')}>
              <Ionicons name="camera-outline" size={32} color="#9ca3af" />
              <Text className={cn('text-xs font-semibold text-gray-400')}>กดเพื่อเพิ่มรูปภาพ</Text>
              <Text className={cn('text-xs text-gray-300 font-medium')}>รองรับ JPG, PNG ขนาดไม่เกิน 5MB</Text>
            </TouchableOpacity>
          </View>

          <View className={cn('bg-white rounded-2xl p-3 shadow-sm')}>
            <SectionHeader title="สถานะ" icon="toggle-outline" />
            <View className={cn('flex-row items-center justify-between py-[2px]')}>
              <View>
                <Text className={cn('text-xs font-bold text-slate-950')}>เปิดใช้งานสินค้า</Text>
                <Text className={cn('text-xs text-slate-500 font-medium')}>สินค้าจะแสดงในหน้าขายและรายงาน</Text>
              </View>
              <Switch
                value={status === 'active'}
                onValueChange={(v) => setStatus(v ? 'active' : 'inactive')}
              />
            </View>
          </View>

          {isEdit && product && parseFloat(salePrice) !== product.salePrice && (
            <View className={cn('flex-row items-start gap-2 bg-rose-50 rounded-xl p-3 border-l-4 border-l-rose-500')}>
              <Ionicons name="information-circle-outline" size={16} color="#f87171" />
              <Text className={cn('text-base text-rose-600 flex-1 font-medium')}>
                การเปลี่ยนราคาจาก ฿{formatCurrency(product.salePrice)} → ฿{formatCurrency(sale)} จะถูกบันทึกใน Audit Log
              </Text>
            </View>
          )}

          <View className={cn('h-5')} />
        </ScrollView>

        <View className={cn('p-3 bg-white border-t border-slate-200')}>
          <TouchableOpacity
            className={cn('flex-row items-center justify-center gap-2 bg-rose-500 rounded-xl py-3', saving && 'bg-gray-300')}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Ionicons name={saving ? 'hourglass-outline' : 'checkmark-circle-outline'} size={22} color="#fafafa" />
            <Text className={cn('text-base font-semibold text-white')}>{saving ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <PickerModal
        visible={showCatPicker} title="เลือกหมวดหมู่"
        items={MOCK_CATEGORIES.filter((c) => c.status === 'active')}
        selectedId={categoryId}
        onSelect={(id, nm) => { setCategoryId(id); setCategoryName(nm); }}
        onClose={() => setShowCatPicker(false)}
      />
      <PickerModal
        visible={showBrandPicker} title="เลือก Brand"
        items={[{ id: '', name: '— ไม่ระบุ —' }, ...MOCK_BRANDS.filter((b) => b.status === 'active')]}
        selectedId={brandId}
        onSelect={(id, nm) => { setBrandId(id); setBrandName(id ? nm : ''); }}
        onClose={() => setShowBrandPicker(false)}
      />
      <PickerModal
        visible={showUnitPicker} title="เลือกหน่วยนับ"
        items={UNITS.map((u) => ({ id: u, name: u }))}
        selectedId={unit}
        onSelect={(id) => setUnit(id)}
        onClose={() => setShowUnitPicker(false)}
      />

      <AlertDialog
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title="ข้อมูลไม่ครบ"
        message={alertMessage}
        variant="warning"
      />
    </SafeAreaView>
  );
};
