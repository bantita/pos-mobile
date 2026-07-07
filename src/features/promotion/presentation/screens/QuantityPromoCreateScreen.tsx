import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { usePromoManagementStore } from '@/features/promotion/application/stores/promoManagementStore';
import { QuantityProductItem, QuantityTier } from '@/features/promotion/domain/quantityPromo';
import {
  validateQuantityForm,
  detectTierOverlaps,
  calculateTierPreview,
} from '@/shared/lib/promoValidation';
import { MOCK_PRODUCTS } from '@/features/product/data/mocks/mockProducts';
import { cn } from '@/shared/lib/cn';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';

interface Props {
  onBack: () => void;
}

const genTierId = () => 't_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const createEmptyTier = (): QuantityTier => ({
  id: genTierId(),
  minQty: 1,
  maxQty: 10,
  discountPerUnit: 5,
});

export const QuantityPromoCreateScreen: React.FC<Props> = ({ onBack }) => {
  const { createQuantityPromo } = usePromoManagementStore();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [noEndDate, setNoEndDate] = useState(false);
  const [branchScope, setBranchScope] = useState<'all' | 'selected'>('all');
  const [description, setDescription] = useState('');
  const [products, setProducts] = useState<QuantityProductItem[]>([]);
  const [tiers, setTiers] = useState<QuantityTier[]>([createEmptyTier()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; variant: 'info' | 'success' | 'warning' | 'danger'; onConfirm?: () => void }>({ visible: false, title: '', message: '', variant: 'info' });

  const handleAddProducts = useCallback(() => {
    const available = MOCK_PRODUCTS.filter(
      (mp) => mp.status === 'active' && !products.find((p) => p.productId === mp.id)
    );
    const toAdd = available.slice(0, 3).map((mp): QuantityProductItem => ({
      productId: mp.id,
      productCode: mp.code,
      productName: mp.name,
      sellingPrice: mp.salePrice,
    }));
    if (toAdd.length === 0) {
      setAlert({ visible: true, title: 'ไม่มีสินค้า', message: 'ไม่มีสินค้าเพิ่มเติมที่จะเลือก', variant: 'warning' });
      return;
    }
    setProducts((prev) => [...prev, ...toAdd]);
  }, [products]);

  const handleRemoveProduct = useCallback((productId: string) => {
    setProducts((prev) => prev.filter((p) => p.productId !== productId));
  }, []);

  const handleAddTier = useCallback(() => {
    if (tiers.length >= 10) {
      setAlert({ visible: true, title: 'เกินจำนวน', message: 'กำหนดช่วงจำนวนได้สูงสุด 10 ช่วง', variant: 'warning' });
      return;
    }
    setTiers((prev) => [...prev, createEmptyTier()]);
  }, [tiers.length]);

  const handleRemoveTier = useCallback((tierId: string) => {
    setTiers((prev) => prev.filter((t) => t.id !== tierId));
  }, []);

  const handleTierChange = useCallback((tierId: string, field: keyof QuantityTier, value: string) => {
    setTiers((prev) =>
      prev.map((t) => {
        if (t.id !== tierId) return t;
        const numVal = parseFloat(value) || 0;
        return { ...t, [field]: numVal };
      })
    );
  }, []);

  const basePrice = useMemo(() => {
    if (products.length === 0) return 0;
    return products[0].sellingPrice;
  }, [products]);

  const tierPreviews = useMemo(() => {
    if (basePrice <= 0 || tiers.length === 0) return [];
    return calculateTierPreview(tiers, basePrice);
  }, [tiers, basePrice]);

  const handleSave = useCallback(() => {
    const formData = {
      name,
      startDate,
      endDate: noEndDate ? undefined : endDate,
      noEndDate,
      products: products.map((p) => ({ productId: p.productId })),
      tiers,
    };
    const validation = validateQuantityForm(formData);
    if (!validation.valid) {
      const errMap: Record<string, string> = {};
      validation.errors.forEach((e) => { errMap[e.field] = e.message; });
      setErrors(errMap);
      setAlert({ visible: true, title: 'ข้อมูลไม่ครบ', message: validation.errors[0].message, variant: 'warning' });
      return;
    }

    const overlaps = detectTierOverlaps(tiers);
    if (overlaps.length > 0) {
      setAlert({ visible: true, title: 'ช่วงจำนวนซ้อนทับ', message: 'กรุณาแก้ไขช่วงจำนวนไม่ให้ซ้อนกัน', variant: 'warning' });
      return;
    }

    setErrors({});
    createQuantityPromo({
      name: name.trim(),
      startDate,
      endDate: noEndDate ? undefined : endDate,
      noEndDate,
      branchScope,
      branchIds: branchScope === 'all' ? undefined : [],
      description: description.trim() || undefined,
      products,
      tiers,
      createdBy: 'current_user',
      shopId: 'shop_001',
    });
    setAlert({ visible: true, title: 'สำเร็จ', message: 'สร้างโปรโมชั่นจำนวนสินค้าเรียบร้อยแล้ว', variant: 'success', onConfirm: onBack });
  }, [name, startDate, endDate, noEndDate, branchScope, description, products, tiers, createQuantityPromo, onBack]);

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('bg-rose-600 flex-row items-center px-3 py-3 gap-2 shadow-sm')}>
        <TouchableOpacity onPress={onBack} className={cn('w-9 h-9 rounded-full items-center justify-center bg-white/20')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fafafa" />
        </TouchableOpacity>
        <Text className={cn('text-xl font-extrabold text-white flex-1')}>เพิ่มโปรโมชั่นจำนวนสินค้า</Text>
      </View>

      <ScrollView className={cn('flex-1')} contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 60 }}>
        <View className={cn('bg-white rounded-2xl p-4 shadow-sm gap-3')}>
          <Text className={cn('text-lg font-extrabold text-slate-950')}>ข้อมูลโปรโมชั่น</Text>

          <View className={cn('gap-1')}>
            <Text className={cn('text-xs font-bold text-slate-600')}>ชื่อโปรโมชั่น *</Text>
            <TextInput
              className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-950 bg-white h-11')}
              placeholder="ระบุชื่อโปรโมชั่น"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              style={errors['name'] ? { borderColor: '#ef4444' } : undefined}
            />
            {errors['name'] && <Text className={cn('text-xs text-rose-600')}>{errors['name']}</Text>}
          </View>

          <View className={cn('gap-1')}>
            <Text className={cn('text-xs font-bold text-slate-600')}>วันที่เริ่มโปรโมชั่น *</Text>
            <TextInput
              className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-950 bg-white h-11')}
              placeholder="dd/mm/yyyy"
              placeholderTextColor="#9ca3af"
              value={startDate}
              onChangeText={setStartDate}
              style={errors['startDate'] ? { borderColor: '#ef4444' } : undefined}
            />
            {errors['startDate'] && <Text className={cn('text-xs text-rose-600')}>{errors['startDate']}</Text>}
          </View>

          <View className={cn('gap-1')}>
            <Text className={cn('text-xs font-bold text-slate-600')}>วันที่สิ้นสุดโปรโมชั่น *</Text>
            <TextInput
              className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium bg-white h-11')}
              placeholder="dd/mm/yyyy"
              placeholderTextColor="#9ca3af"
              value={endDate}
              onChangeText={setEndDate}
              editable={!noEndDate}
              style={{
                color: noEndDate ? '#57534e' : '#292524',
                backgroundColor: noEndDate ? '#f5f5f5' : '#fafafa',
                borderColor: errors['endDate'] ? '#ef4444' : '#e7e5e4',
              }}
            />
            {errors['endDate'] && <Text className={cn('text-xs text-rose-600')}>{errors['endDate']}</Text>}
          </View>

          <TouchableOpacity
            className={cn('flex-row items-center gap-2 py-1')}
            onPress={() => { setNoEndDate(!noEndDate); if (!noEndDate) setEndDate(''); }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={noEndDate ? 'checkbox' : 'square-outline'}
              size={20}
              color={noEndDate ? '#f87171' : '#9ca3af'}
            />
            <Text className={cn('text-sm font-medium text-slate-950')}>ไม่กำหนดวันสิ้นสุด</Text>
          </TouchableOpacity>

          <View className={cn('gap-1')}>
            <Text className={cn('text-xs font-bold text-slate-600')}>คลังสินค้า/สาขา</Text>
            <View className={cn('flex-row gap-4')}>
              <TouchableOpacity
                className={cn('flex-row items-center gap-1')}
                onPress={() => setBranchScope('all')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={branchScope === 'all' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={branchScope === 'all' ? '#f87171' : '#9ca3af'}
                />
                <Text className={cn('text-sm font-medium text-slate-950')}>ทั้งหมด</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={cn('flex-row items-center gap-1')}
                onPress={() => setBranchScope('selected')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={branchScope === 'selected' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={branchScope === 'selected' ? '#f87171' : '#9ca3af'}
                />
                <Text className={cn('text-sm font-medium text-slate-950')}>บางส่วน</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className={cn('gap-1')}>
            <Text className={cn('text-xs font-bold text-slate-600')}>รายละเอียด</Text>
            <TextInput
              className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-950 bg-white')}
              style={{ minHeight: 72, textAlignVertical: 'top' }}
              placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View className={cn('bg-white rounded-2xl p-4 shadow-sm gap-3')}>
          <View className={cn('flex-row items-center justify-between')}>
            <Text className={cn('text-lg font-extrabold text-slate-950')}>สินค้า</Text>
            <TouchableOpacity className={cn('bg-rose-500 rounded-xl px-4 py-2.5 min-h-10')} onPress={handleAddProducts} activeOpacity={0.8}>
              <Text className={cn('text-sm font-bold text-white')}>เลือก</Text>
            </TouchableOpacity>
          </View>
          {errors['products'] && <Text className={cn('text-xs text-rose-600')}>{errors['products']}</Text>}

          {products.length > 0 && (
            <View className={cn('border border-slate-200 rounded-xl overflow-hidden')}>
              <View className={cn('flex-row items-center bg-neutral-100 py-1 px-2 border-b border-slate-200')}>
                <Text style={{ width: 70 }} className={cn('text-xs font-bold text-slate-600')}>รหัสสินค้า</Text>
                <Text className={cn('flex-1 text-xs font-bold text-slate-600 px-1')}>ชื่อสินค้า</Text>
                <Text className={cn('text-xs font-bold text-slate-600 text-right')} style={{ width: 70 }}>ราคาขาย</Text>
                <View style={{ width: 28, alignItems: 'center' }} />
              </View>
              {products.map((p) => (
                <View key={p.productId} className={cn('flex-row items-center py-1 px-2 border-b border-slate-100')}>
                  <Text style={{ width: 70 }} className={cn('text-xs font-medium text-slate-950')}>{p.productCode}</Text>
                  <Text className={cn('flex-1 text-xs font-medium text-slate-950 px-1')} numberOfLines={1}>{p.productName}</Text>
                  <Text className={cn('text-xs font-medium text-slate-950 text-right')} style={{ width: 70 }}>฿{p.sellingPrice.toLocaleString()}</Text>
                  <TouchableOpacity
                    style={{ width: 28, alignItems: 'center' }}
                    onPress={() => handleRemoveProduct(p.productId)}
                  >
                    <Ionicons name="close-circle" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {products.length === 0 && (
            <Text className={cn('text-sm font-medium text-gray-400 text-center py-3')}>กดปุ่ม "เลือก" เพื่อเพิ่มสินค้า</Text>
          )}
        </View>

        <View className={cn('bg-white rounded-2xl p-4 shadow-sm gap-3')}>
          <Text className={cn('text-lg font-extrabold text-slate-950')}>ช่วงราคา</Text>
          {errors['tiers'] && <Text className={cn('text-xs text-rose-600')}>{errors['tiers']}</Text>}

          <View className={cn('flex-row items-center bg-neutral-100 py-2 px-3 rounded-xl gap-1')}>
            <Text style={{ width: 24, textAlign: 'center' }} className={cn('text-xs font-bold text-slate-600')}>#</Text>
            <Text className={cn('flex-1 text-xs font-bold text-slate-600')}>จำนวนขั้นต่ำ/ชิ้น</Text>
            <Text style={{ width: 16, textAlign: 'center' }} className={cn('text-xs font-bold text-slate-600')}>-</Text>
            <Text className={cn('flex-1 text-xs font-bold text-slate-600')}>จำนวนสูงสุด/ชิ้น</Text>
            <Text style={{ flex: 1.2 }} className={cn('text-xs font-bold text-slate-600')}>ส่วนลดต่อหน่วย</Text>
            <View style={{ width: 28, alignItems: 'center' }} />
          </View>

          {tiers.map((tier, idx) => (
            <View key={tier.id} className={cn('flex-row items-center py-2 gap-1 px-3')}>
              <Text style={{ width: 24, textAlign: 'center' }} className={cn('text-xs font-bold text-slate-600')}>{idx + 1}</Text>
              <TextInput
                className={cn('flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-950 text-center')}
                keyboardType="numeric"
                value={tier.minQty.toString()}
                onChangeText={(v) => handleTierChange(tier.id, 'minQty', v)}
              />
              <Text style={{ width: 16, textAlign: 'center' }} className={cn('text-xs font-bold text-slate-600')}>-</Text>
              <TextInput
                className={cn('flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-950 text-center')}
                keyboardType="numeric"
                value={tier.maxQty.toString()}
                onChangeText={(v) => handleTierChange(tier.id, 'maxQty', v)}
              />
              <TextInput
                className={cn('border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-950 text-center')}
                style={{ flex: 1.2 }}
                keyboardType="numeric"
                value={tier.discountPerUnit.toString()}
                onChangeText={(v) => handleTierChange(tier.id, 'discountPerUnit', v)}
                placeholder="%"
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity style={{ width: 28, alignItems: 'center' }} onPress={() => handleRemoveTier(tier.id)}>
                <Ionicons name="close-circle" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity className={cn('flex-row items-center self-start py-2 px-3 gap-1 min-h-10')} onPress={handleAddTier} activeOpacity={0.7}>
            <Ionicons name="add-circle-outline" size={16} color="#f87171" />
            <Text className={cn('text-xs font-bold text-rose-500')}>+ เพิ่ม</Text>
          </TouchableOpacity>

          <Text className={cn('text-xs font-medium text-slate-600 italic')}>ใส่ส่วนลดเป็นเงิน หรือเป็นเปอร์เซ็นต์ก็ได้</Text>

          {tierPreviews.length > 0 && (
            <View className={cn('rounded-xl p-3 gap-1 bg-purple-50')}>
              <Text className={cn('text-xs font-extrabold text-sky-600')}>ตัวอย่างส่วนลด (ราคาฐาน ฿{basePrice.toLocaleString()})</Text>
              {tierPreviews.map((pv) => (
                <View key={pv.tierId} className={cn('py-0.5')}>
                  <Text className={cn('text-xs font-medium text-slate-950')}>
                    ซื้อ {pv.sampleQty} ชิ้น → ฿{pv.discountedPrice.toFixed(2)}/ชิ้น (ลด {pv.discountPercent}%)
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity className={cn('bg-rose-600 rounded-xl py-3 items-center shadow-lg shadow-rose-500/40')} onPress={handleSave} activeOpacity={0.85}>
          <Text className={cn('text-base font-bold text-white')}>บันทึก</Text>
        </TouchableOpacity>
      </ScrollView>

      <AlertDialog
        visible={alert.visible}
        onClose={() => setAlert({ ...alert, visible: false })}
        title={alert.title}
        message={alert.message}
        variant={alert.variant}
        confirmLabel="ตกลง"
        onConfirm={alert.onConfirm}
      />
    </SafeAreaView>
  );
};
