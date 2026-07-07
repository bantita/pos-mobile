import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from '@/shared/tw/index';
import { Switch } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { usePromoManagementStore } from '@/features/promotion/application/stores/promoManagementStore';
import { validateProductGroupForm, ValidationError } from '@/shared/lib/promoValidation';
import { ProductGroupItem, FreeProductItem, ProductGroupDiscountType } from '@/features/promotion/domain/productGroupPromo';
import { MOCK_PRODUCTS } from '@/features/product/data/mocks/mockProducts';
import { cn } from '@/shared/lib/cn';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';

interface Props {
  onBack: () => void;
}

const MOCK_GROUP_PRODUCTS: ProductGroupItem[] = MOCK_PRODUCTS.slice(0, 4).map((p) => ({
  productId: p.id,
  productCode: p.code,
  productName: p.name,
  quantity: 1,
  unitPrice: p.salePrice,
}));

const MOCK_FREE_PRODUCTS: FreeProductItem[] = MOCK_PRODUCTS.slice(4, 6).map((p) => ({
  productId: p.id,
  productCode: p.code,
  productName: p.name,
  quantity: 1,
  unitPrice: p.salePrice,
}));

const DISCOUNT_TYPE_OPTIONS: { value: ProductGroupDiscountType; label: string }[] = [
  { value: 'set_price', label: 'ตั้งราคาขาย' },
  { value: 'fixed_amount', label: 'ส่วนลด' },
  { value: 'percent', label: 'ส่วนลด %' },
  { value: 'free_product', label: 'แถมสินค้า' },
];

function getTodayISO(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export const GroupProductPromoCreateScreen: React.FC<Props> = ({ onBack }) => {
  const { createProductGroupPromo } = usePromoManagementStore();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(getTodayISO());
  const [endDate, setEndDate] = useState('');
  const [noEndDate, setNoEndDate] = useState(false);
  const [description, setDescription] = useState('');
  const [products, setProducts] = useState<ProductGroupItem[]>([]);
  const [minBillTotal, setMinBillTotal] = useState('0.00');
  const [discountType, setDiscountType] = useState<ProductGroupDiscountType | ''>('');
  const [discountValue, setDiscountValue] = useState('0');
  const [freeProducts, setFreeProducts] = useState<FreeProductItem[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; variant: 'info' | 'success' | 'warning' | 'danger'; onConfirm?: () => void }>({ visible: false, title: '', message: '', variant: 'info' });

  const getError = useCallback(
    (field: string) => errors.find((e) => e.field === field)?.message,
    [errors]
  );

  const discountSuffix = useMemo(() => {
    if (discountType === 'percent') return '%';
    if (discountType === 'fixed_amount' || discountType === 'set_price') return 'บาท';
    return '';
  }, [discountType]);

  const updateProductQty = (idx: number, delta: number) => {
    setProducts((prev) =>
      prev.map((p, i) =>
        i === idx ? { ...p, quantity: Math.max(1, Math.min(999, p.quantity + delta)) } : p
      )
    );
  };

  const updateFreeProductQty = (idx: number, delta: number) => {
    setFreeProducts((prev) =>
      prev.map((p, i) =>
        i === idx ? { ...p, quantity: Math.max(1, Math.min(999, p.quantity + delta)) } : p
      )
    );
  };

  const handleSelectProducts = () => {
    if (products.length === 0) {
      setProducts(MOCK_GROUP_PRODUCTS);
    }
  };

  const handleSelectFreeProducts = () => {
    if (freeProducts.length === 0) {
      setFreeProducts(MOCK_FREE_PRODUCTS);
    }
  };

  const handleSave = () => {
    const formData = {
      name: name.trim(),
      startDate,
      endDate: noEndDate ? undefined : endDate,
      noEndDate,
      products: products.map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
      })),
      discountType: discountType as string,
      discountValue: parseFloat(discountValue) || 0,
      minBillTotal: parseFloat(minBillTotal) || 0,
      freeProducts: freeProducts.map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
      })),
    };

    const result = validateProductGroupForm(formData);
    setErrors(result.errors);

    if (!result.valid) return;

    setSaving(true);
    try {
      createProductGroupPromo({
        name: name.trim(),
        startDate,
        endDate: noEndDate ? undefined : endDate,
        noEndDate,
        branchId: 'main',
        description: description.trim() || undefined,
        products,
        minBillTotal: parseFloat(minBillTotal) || 0,
        discountType: discountType as ProductGroupDiscountType,
        discountValue: parseFloat(discountValue) || 0,
        freeProducts: discountType === 'free_product' ? freeProducts : [],
        createdBy: 'current_user',
        shopId: 'shop_001',
      });
      setAlert({ visible: true, title: 'สำเร็จ', message: 'บันทึกโปรโมชั่นกลุ่มสินค้าเรียบร้อย', variant: 'success', onConfirm: onBack });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('bg-rose-600 flex-row items-center px-3 py-3 gap-2 shadow-sm')}>
        <TouchableOpacity onPress={onBack} className={cn('w-9 h-9 rounded-full items-center justify-center bg-white/20')} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#fafafa" />
        </TouchableOpacity>
        <Text className={cn('text-lg font-extrabold text-white flex-1')}>เพิ่มโปรโมชั่นกลุ่มสินค้า</Text>
      </View>

      <ScrollView className={cn('flex-1')} contentContainerStyle={{ padding: 12, paddingBottom: 60, gap: 12 }}>
        <View className={cn('bg-white rounded-2xl p-4 shadow-sm')}>
          <Text className={cn('text-base font-extrabold text-slate-950 mb-3')}>ข้อมูลโปรโมชั่น</Text>

          <View className={cn('mb-3')}>
            <Text className={cn('text-xs font-bold text-slate-600 mb-1')}>ชื่อโปรโมชั่น *</Text>
            <TextInput
              className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-950 bg-white h-11')}
              value={name}
              onChangeText={setName}
              placeholder="ระบุชื่อโปรโมชั่น"
              placeholderTextColor="#9ca3af"
              style={getError('name') ? { borderColor: '#ef4444' } : undefined}
            />
            {getError('name') && <Text className={cn('text-xs text-rose-600 mt-1')}>{getError('name')}</Text>}
          </View>

          <View className={cn('mb-3')}>
            <Text className={cn('text-xs font-bold text-slate-600 mb-1')}>วันเริ่ม *</Text>
            <TextInput
              className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-950 bg-white h-11')}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              style={getError('startDate') ? { borderColor: '#ef4444' } : undefined}
            />
            {getError('startDate') && <Text className={cn('text-xs text-rose-600 mt-1')}>{getError('startDate')}</Text>}
          </View>

          <View className={cn('mb-3')}>
            <Text className={cn('text-xs font-bold text-slate-600 mb-1')}>วันสิ้นสุด *</Text>
            <TextInput
              className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium bg-white h-11')}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              editable={!noEndDate}
              style={{
                color: noEndDate ? '#57534e' : '#292524',
                backgroundColor: noEndDate ? '#f5f5f5' : '#fafafa',
                borderColor: !noEndDate && getError('endDate') ? '#ef4444' : '#e7e5e4',
              }}
            />
            {!noEndDate && getError('endDate') && (
              <Text className={cn('text-xs text-rose-600 mt-1')}>{getError('endDate')}</Text>
            )}
          </View>

          <View className={cn('flex-row items-center gap-2 mb-3')}>
            <Switch
              value={noEndDate}
              onValueChange={setNoEndDate}
            />
            <Text className={cn('text-sm font-medium text-slate-950')}>ไม่กำหนดวันสิ้นสุด</Text>
          </View>

          <View className={cn('mb-3')}>
            <Text className={cn('text-xs font-bold text-slate-600 mb-1')}>คลังสินค้า/สาขา</Text>
            <View className={cn('border border-slate-200 rounded-xl px-3 py-2 bg-neutral-100')}>
              <Text className={cn('text-sm font-medium text-slate-600')}>คลังสินค้าหลัก</Text>
            </View>
          </View>

          <View className={cn('mb-1')}>
            <Text className={cn('text-xs font-bold text-slate-600 mb-1')}>รายละเอียด</Text>
            <TextInput
              className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-950 bg-white')}
              style={{ minHeight: 70, textAlignVertical: 'top' }}
              value={description}
              onChangeText={setDescription}
              placeholder="รายละเอียดโปรโมชั่น (ถ้ามี)"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View className={cn('bg-white rounded-2xl p-4 shadow-sm')}>
          <View className={cn('flex-row items-center justify-between mb-3')}>
            <Text className={cn('text-base font-extrabold text-slate-950')}>เงื่อนไขโปรโมชั่น</Text>
          </View>

          <View className={cn('flex-row items-center gap-2 mb-2')}>
            <View className={cn('bg-rose-50 rounded-xl px-2 py-1')}>
              <Text className={cn('text-xs font-bold text-rose-500')}>สินค้า</Text>
            </View>
            <TouchableOpacity
              className={cn('bg-emerald-700 rounded-xl px-3 py-1.5')}
              onPress={handleSelectProducts}
              activeOpacity={0.8}
            >
              <Text className={cn('text-xs font-bold text-white')}>เลือก</Text>
            </TouchableOpacity>
          </View>

          {getError('products') && (
            <Text className={cn('text-xs text-rose-600 mb-1')}>{getError('products')}</Text>
          )}

          {products.length > 0 && (
            <View className={cn('border border-slate-200 rounded-xl overflow-hidden')}>
              <View className={cn('flex-row items-center bg-neutral-100 px-2 py-1 border-b border-slate-200')}>
                <Text className={cn('text-xs font-bold text-slate-600 text-center')} style={{ width: 24 }}>#</Text>
                <Text className={cn('text-xs font-bold text-slate-600')} style={{ width: 70 }}>รหัสสินค้า</Text>
                <Text className={cn('text-xs font-bold text-slate-600 flex-1 px-1')}>ชื่อ</Text>
                <Text className={cn('text-xs font-bold text-slate-600 text-center')} style={{ width: 80 }}>จำนวน</Text>
                <Text className={cn('text-xs font-bold text-slate-600 text-right')} style={{ width: 80 }}>มูลค่าต่อหน่วย</Text>
              </View>
              {products.map((p, idx) => (
                <View key={p.productId} className={cn('flex-row items-center px-2 py-1 border-b border-slate-100')}>
                  <Text className={cn('text-xs font-medium text-slate-950 text-center')} style={{ width: 24 }}>{idx + 1}</Text>
                  <Text className={cn('text-xs font-medium text-slate-950')} style={{ width: 70 }}>{p.productCode}</Text>
                  <Text className={cn('text-xs font-medium text-slate-950 flex-1 px-1')} numberOfLines={1}>
                    {p.productName}
                  </Text>
                  <View className={cn('flex-row items-center')} style={{ width: 80, gap: 4 }}>
                    <TouchableOpacity onPress={() => updateProductQty(idx, -1)}>
                      <Ionicons name="remove-circle-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                    <Text className={cn('text-xs font-bold text-slate-950 text-center')} style={{ minWidth: 20 }}>{p.quantity}</Text>
                    <TouchableOpacity onPress={() => updateProductQty(idx, 1)}>
                      <Ionicons name="add-circle-outline" size={20} color="#0f766e" />
                    </TouchableOpacity>
                  </View>
                  <Text className={cn('text-xs font-medium text-slate-950 text-right')} style={{ width: 80 }}>฿{p.unitPrice}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className={cn('bg-white rounded-2xl p-4 shadow-sm')}>
          <Text className={cn('text-base font-extrabold text-slate-950 mb-3')}>ตั้งค่าส่วนลด</Text>

          <View className={cn('mb-3')}>
            <Text className={cn('text-xs font-bold text-slate-600 mb-1')}>A: ราคารวมขั้นต่ำทั้งบิล</Text>
            <TextInput
              className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-950 bg-white h-11')}
              value={minBillTotal}
              onChangeText={setMinBillTotal}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
              style={getError('minBillTotal') ? { borderColor: '#ef4444' } : undefined}
            />
            {getError('minBillTotal') && (
              <Text className={cn('text-xs text-rose-600 mt-1')}>{getError('minBillTotal')}</Text>
            )}
          </View>

          <View className={cn('mb-3')}>
            <Text className={cn('text-xs font-bold text-slate-600 mb-1')}>B: ประเภท *</Text>
            <View className={cn('flex-row flex-wrap gap-1.5')}>
              {DISCOUNT_TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  className={cn('border rounded-xl px-3 py-1.5')}
                  style={{
                    borderColor: discountType === opt.value ? '#f87171' : '#e7e5e4',
                    backgroundColor: discountType === opt.value ? '#fee2e2' : '#fafafa',
                  }}
                  onPress={() => setDiscountType(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text className={cn('text-xs font-medium')} style={{
                    color: discountType === opt.value ? '#f87171' : '#57534e',
                    fontWeight: discountType === opt.value ? '700' : '500',
                  }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {getError('discountType') && (
              <Text className={cn('text-xs text-rose-600 mt-1')}>{getError('discountType')}</Text>
            )}
          </View>

          {discountType !== '' && discountType !== 'free_product' && (
            <View className={cn('mb-1')}>
              <Text className={cn('text-xs font-bold text-slate-600 mb-1')}>ส่วนลด</Text>
              <View className={cn('flex-row items-center gap-2')}>
                <TextInput
                  className={cn('flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-950 bg-white h-11')}
                  value={discountValue}
                  onChangeText={setDiscountValue}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  style={getError('discountValue') ? { borderColor: '#ef4444' } : undefined}
                />
                <Text className={cn('text-xs font-bold text-slate-600')}>{discountSuffix}</Text>
              </View>
              {getError('discountValue') && (
                <Text className={cn('text-xs text-rose-600 mt-1')}>{getError('discountValue')}</Text>
              )}
            </View>
          )}
        </View>

        {discountType === 'free_product' && (
          <View className={cn('bg-white rounded-2xl p-4 shadow-sm')}>
            <View className={cn('flex-row items-center justify-between mb-3')}>
              <Text className={cn('text-base font-extrabold text-slate-950')}>โปรโมชั่นของแถม</Text>
            </View>

            <View className={cn('flex-row items-center gap-2 mb-2')}>
              <View className={cn('bg-rose-50 rounded-xl px-2 py-1')}>
                <Text className={cn('text-xs font-bold text-rose-500')}>สินค้า</Text>
              </View>
              <TouchableOpacity
                className={cn('bg-emerald-700 rounded-xl px-3 py-1.5')}
                onPress={handleSelectFreeProducts}
                activeOpacity={0.8}
              >
                <Text className={cn('text-xs font-bold text-white')}>เลือก</Text>
              </TouchableOpacity>
            </View>

            {getError('freeProducts') && (
              <Text className={cn('text-xs text-rose-600 mb-1')}>{getError('freeProducts')}</Text>
            )}

            {freeProducts.length > 0 && (
              <View className={cn('border border-slate-200 rounded-xl overflow-hidden')}>
                <View className={cn('flex-row items-center bg-neutral-100 px-2 py-1 border-b border-slate-200')}>
                  <Text className={cn('text-xs font-bold text-slate-600 text-center')} style={{ width: 24 }}>#</Text>
                  <Text className={cn('text-xs font-bold text-slate-600')} style={{ width: 70 }}>รหัสสินค้า</Text>
                  <Text className={cn('text-xs font-bold text-slate-600 flex-1 px-1')}>ชื่อ</Text>
                  <Text className={cn('text-xs font-bold text-slate-600 text-center')} style={{ width: 80 }}>จำนวน</Text>
                  <Text className={cn('text-xs font-bold text-slate-600 text-right')} style={{ width: 80 }}>มูลค่าต่อหน่วย</Text>
                </View>
                {freeProducts.map((p, idx) => (
                  <View key={p.productId} className={cn('flex-row items-center px-2 py-1 border-b border-slate-100')}>
                    <Text className={cn('text-xs font-medium text-slate-950 text-center')} style={{ width: 24 }}>{idx + 1}</Text>
                    <Text className={cn('text-xs font-medium text-slate-950')} style={{ width: 70 }}>{p.productCode}</Text>
                    <Text className={cn('text-xs font-medium text-slate-950 flex-1 px-1')} numberOfLines={1}>
                      {p.productName}
                    </Text>
                    <View className={cn('flex-row items-center')} style={{ width: 80, gap: 4 }}>
                      <TouchableOpacity onPress={() => updateFreeProductQty(idx, -1)}>
                        <Ionicons name="remove-circle-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                      <Text className={cn('text-xs font-bold text-slate-950 text-center')} style={{ minWidth: 20 }}>{p.quantity}</Text>
                      <TouchableOpacity onPress={() => updateFreeProductQty(idx, 1)}>
                        <Ionicons name="add-circle-outline" size={20} color="#0f766e" />
                      </TouchableOpacity>
                    </View>
                    <Text className={cn('text-xs font-medium text-slate-950 text-right')} style={{ width: 80 }}>฿{p.unitPrice}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          className={cn('bg-rose-600 rounded-xl py-3 items-center shadow-lg shadow-rose-500/40')}
          style={{ opacity: saving ? 0.5 : 1 }}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text className={cn('text-base font-bold text-white')}>
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Text>
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
