import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { usePromoManagementStore } from '@/features/promotion/application/stores/promoManagementStore';
import { validateBundleForm, BundleFormData } from '@/shared/lib/promoValidation';
import { BundleProductItem, BundleDiscountType, BundleBranchScope } from '@/features/promotion/domain/bundlePromo';
import { FreeProductItem } from '@/features/promotion/domain/productGroupPromo';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';

interface Props {
  onBack: () => void;
}

const DISCOUNT_TYPE_OPTIONS: { value: BundleDiscountType; label: string }[] = [
  { value: 'set_price', label: 'ตั้งราคาขาย' },
  { value: 'fixed_amount', label: 'ส่วนลดเงิน (บาท)' },
  { value: 'percent', label: 'ส่วนลด (%)' },
  { value: 'free_product', label: 'แถมสินค้า' },
];

const getToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const BundleProductPromoCreateScreen: React.FC<Props> = ({ onBack }) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState('');
  const [noEndDate, setNoEndDate] = useState(false);
  const [branchScope, setBranchScope] = useState<BundleBranchScope>('all');
  const [description, setDescription] = useState('');
  const [products, setProducts] = useState<BundleProductItem[]>([]);
  const [minBillTotal, setMinBillTotal] = useState(0);
  const [discountType, setDiscountType] = useState<BundleDiscountType | ''>('');
  const [discountValue, setDiscountValue] = useState(0);
  const [freeProducts, setFreeProducts] = useState<FreeProductItem[]>([]);
  const [showDiscountDropdown, setShowDiscountDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; variant: 'info' | 'success' | 'warning' | 'danger'; onConfirm?: () => void }>({ visible: false, title: '', message: '', variant: 'info' });

  const { createBundlePromo } = usePromoManagementStore();

  const handleAddProduct = () => {
    if (products.length >= 50) {
      setAlert({ visible: true, title: 'แจ้งเตือน', message: 'เลือกสินค้าได้สูงสุด 50 รายการ', variant: 'warning' });
      return;
    }
    const newProduct: BundleProductItem = {
      productId: `prod_${Date.now()}`,
      productCode: `SKU${String(products.length + 1).padStart(4, '0')}`,
      productName: `สินค้า ${products.length + 1}`,
      quantity: 1,
      unitPrice: 0,
    };
    setProducts([...products, newProduct]);
  };

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleProductQtyChange = (index: number, qty: string) => {
    const num = parseInt(qty, 10) || 0;
    const updated = [...products];
    updated[index] = { ...updated[index], quantity: Math.max(1, Math.min(999, num)) };
    setProducts(updated);
  };

  const handleProductPriceChange = (index: number, price: string) => {
    const num = parseFloat(price) || 0;
    const updated = [...products];
    updated[index] = { ...updated[index], unitPrice: Math.max(0, num) };
    setProducts(updated);
  };

  const handleAddFreeProduct = () => {
    if (freeProducts.length >= 10) {
      setAlert({ visible: true, title: 'แจ้งเตือน', message: 'เลือกสินค้าแถมได้สูงสุด 10 รายการ', variant: 'warning' });
      return;
    }
    const newFree: FreeProductItem = {
      productId: `free_${Date.now()}`,
      productCode: `FREE${String(freeProducts.length + 1).padStart(4, '0')}`,
      productName: `สินค้าแถม ${freeProducts.length + 1}`,
      quantity: 1,
      unitPrice: 0,
    };
    setFreeProducts([...freeProducts, newFree]);
  };

  const handleRemoveFreeProduct = (index: number) => {
    setFreeProducts(freeProducts.filter((_, i) => i !== index));
  };

  const handleFreeProductQtyChange = (index: number, qty: string) => {
    const num = parseInt(qty, 10) || 0;
    const updated = [...freeProducts];
    updated[index] = { ...updated[index], quantity: Math.max(1, Math.min(999, num)) };
    setFreeProducts(updated);
  };

  const handleSave = () => {
    const formData: BundleFormData = {
      name: name.trim(),
      startDate,
      endDate: noEndDate ? undefined : endDate,
      noEndDate,
      products: products.map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
      })),
      discountType: discountType || '',
      discountValue,
      minBillTotal,
      freeProducts: freeProducts.map((fp) => ({
        productId: fp.productId,
        quantity: fp.quantity,
      })),
    };

    const result = validateBundleForm(formData);
    if (!result.valid) {
      const errMap: Record<string, string> = {};
      result.errors.forEach((e) => { errMap[e.field] = e.message; });
      setErrors(errMap);
      setAlert({ visible: true, title: 'ข้อมูลไม่ครบถ้วน', message: result.errors[0].message, variant: 'warning' });
      return;
    }

    setErrors({});
    createBundlePromo({
      name: name.trim(),
      startDate,
      endDate: noEndDate ? undefined : endDate,
      noEndDate,
      branchScope,
      branchIds: branchScope === 'all' ? undefined : [],
      description: description.trim() || undefined,
      products,
      minBillTotal,
      discountType: discountType as BundleDiscountType,
      discountValue,
      freeProducts: discountType === 'free_product' ? freeProducts : [],
      createdBy: 'current_user',
      shopId: 'current_shop',
    });

    setAlert({ visible: true, title: 'สำเร็จ', message: 'บันทึกโปรโมชั่นสินค้าร่วมเรียบร้อย', variant: 'success', onConfirm: onBack });
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('bg-rose-600 flex-row items-center px-3 py-3 gap-2 shadow-sm')}>
        <TouchableOpacity onPress={onBack} className={cn('w-9 h-9 rounded-full items-center justify-center bg-white/20')} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#fafafa" />
        </TouchableOpacity>
        <Text className={cn('text-lg font-extrabold text-white flex-1')}>เพิ่มโปรโมชั่นสินค้าร่วม</Text>
      </View>

      <ScrollView
        className={cn('flex-1')}
        contentContainerStyle={{ padding: 12, paddingBottom: 60, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <View className={cn('bg-white rounded-2xl p-4 shadow-sm gap-3')}>
          <Text className={cn('text-base font-extrabold text-slate-950')}>ข้อมูลทั่วไป</Text>

          <View className={cn('gap-1')}>
            <Text className={cn('text-xs font-bold text-slate-500')}>ชื่อโปรโมชั่น <Text className={cn('text-rose-600')}>*</Text></Text>
            <TextInput
              className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-950 bg-white h-11', errors.name && 'border-rose-600')}
              placeholder="กรอกชื่อโปรโมชั่น"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
            />
            {errors.name && <Text className={cn('text-xs text-rose-600')}>{errors.name}</Text>}
          </View>

          <View className={cn('gap-1')}>
            <Text className={cn('text-xs font-bold text-slate-500')}>วันเริ่ม <Text className={cn('text-rose-600')}>*</Text></Text>
            <TextInput
              className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-950 bg-white h-11', errors.startDate && 'border-rose-600')}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              value={startDate}
              onChangeText={setStartDate}
            />
            {errors.startDate && <Text className={cn('text-xs text-rose-600')}>{errors.startDate}</Text>}
          </View>

          <View className={cn('gap-1')}>
            <Text className={cn('text-xs font-bold text-slate-500')}>วันสิ้นสุด <Text className={cn('text-rose-600')}>*</Text></Text>
            <TextInput
              className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium bg-white h-11', noEndDate ? 'bg-neutral-100 text-slate-500' : 'text-slate-950', errors.endDate && 'border-rose-600')}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              value={endDate}
              onChangeText={setEndDate}
              editable={!noEndDate}
            />
            {errors.endDate && <Text className={cn('text-xs text-rose-600')}>{errors.endDate}</Text>}
            <TouchableOpacity
              className={cn('flex-row items-center gap-2 mt-1')}
              onPress={() => setNoEndDate(!noEndDate)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={noEndDate ? 'checkbox' : 'square-outline'}
                size={20}
                color={noEndDate ? '#f87171' : '#9ca3af'}
              />
              <Text className={cn('text-sm font-medium text-slate-950')}>ไม่กำหนดวันสิ้นสุด</Text>
            </TouchableOpacity>
          </View>

          <View className={cn('gap-1')}>
            <Text className={cn('text-xs font-bold text-slate-500')}>คลังสินค้า/สาขา</Text>
            <View className={cn('flex-row items-center gap-4')}>
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
            <Text className={cn('text-xs font-bold text-slate-500')}>รายละเอียด</Text>
            <TextInput
              className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-950 bg-white h-20')}
              placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={{ textAlignVertical: 'top' }}
            />
          </View>
        </View>

        <View className={cn('bg-white rounded-2xl p-4 shadow-sm gap-3')}>
          <View className={cn('flex-row items-center justify-between')}>
            <Text className={cn('text-base font-extrabold text-slate-950')}>เงื่อนไขโปรโมชั่น — สินค้าร่วม</Text>
            <TouchableOpacity className={cn('flex-row items-center gap-1')} onPress={handleAddProduct} activeOpacity={0.7}>
              <Ionicons name="add-circle-outline" size={18} color="#f87171" />
              <Text className={cn('text-xs font-bold text-rose-600')}>เพิ่มสินค้า</Text>
            </TouchableOpacity>
          </View>
          {errors.products && <Text className={cn('text-xs text-rose-600')}>{errors.products}</Text>}

          {products.length > 0 && (
            <View className={cn('flex-row items-center py-1 border-b border-slate-200')}>
              <Text className={cn('text-xs font-bold text-slate-500')} style={{ flex: 1.2 }}>รหัสสินค้า</Text>
              <Text className={cn('text-xs font-bold text-slate-500')} style={{ flex: 1.5 }}>ชื่อ</Text>
              <Text className={cn('text-xs font-bold text-slate-500 w-14 text-center')}>จำนวน</Text>
              <Text className={cn('text-xs font-bold text-slate-500 w-[72px] text-center')}>มูลค่า/หน่วย</Text>
              <View className={cn('w-7 items-center')} />
            </View>
          )}

          {products.map((product, index) => (
            <View key={product.productId} className={cn('flex-row items-center py-1 border-b border-slate-100')}>
              <Text className={cn('text-xs font-medium text-slate-950')} style={{ flex: 1.2 }} numberOfLines={1}>
                {product.productCode}
              </Text>
              <Text className={cn('text-xs font-medium text-slate-950')} style={{ flex: 1.5 }} numberOfLines={1}>
                {product.productName}
              </Text>
              <TextInput
                className={cn('text-xs font-medium text-slate-950 border border-slate-200 rounded-xl text-center py-0.5 px-1 h-[30px] w-14')}
                value={String(product.quantity)}
                onChangeText={(v) => handleProductQtyChange(index, v)}
                keyboardType="numeric"
              />
              <TextInput
                className={cn('text-xs font-medium text-slate-950 border border-slate-200 rounded-xl text-center py-0.5 px-1 h-[30px] w-[72px]')}
                value={String(product.unitPrice)}
                onChangeText={(v) => handleProductPriceChange(index, v)}
                keyboardType="numeric"
              />
              <TouchableOpacity
                className={cn('w-7 items-center')}
                onPress={() => handleRemoveProduct(index)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}

          {products.length === 0 && (
            <View className={cn('items-center py-4')}>
              <Text className={cn('text-xs font-medium text-gray-400')}>
                ยังไม่ได้เลือกสินค้า (ขั้นต่ำ 2 รายการ, สูงสุด 50)
              </Text>
            </View>
          )}
        </View>

        <View className={cn('bg-white rounded-2xl p-4 shadow-sm gap-3')}>
          <Text className={cn('text-base font-extrabold text-slate-950')}>ส่วนลด</Text>

          <View className={cn('gap-1')}>
            <Text className={cn('text-xs font-bold text-slate-500')}>ราคารวมขั้นต่ำทั้งบิล (บาท)</Text>
            <TextInput
              className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-950 bg-white h-11', errors.minBillTotal && 'border-rose-600')}
              placeholder="0"
              placeholderTextColor="#9ca3af"
              value={minBillTotal > 0 ? String(minBillTotal) : ''}
              onChangeText={(v) => setMinBillTotal(parseFloat(v) || 0)}
              keyboardType="numeric"
            />
            {errors.minBillTotal && <Text className={cn('text-xs text-rose-600')}>{errors.minBillTotal}</Text>}
          </View>

          <View className={cn('gap-1')}>
            <Text className={cn('text-xs font-bold text-slate-500')}>ประเภทส่วนลด <Text className={cn('text-rose-600')}>*</Text></Text>
            <TouchableOpacity
              className={cn('border border-slate-200 rounded-xl px-3 py-2 h-11 flex-row items-center justify-between bg-white shadow-sm', errors.discountType && 'border-rose-600')}
              onPress={() => setShowDiscountDropdown(!showDiscountDropdown)}
              activeOpacity={0.7}
            >
              <Text className={cn('text-sm font-medium text-slate-950', !discountType && 'text-gray-400')}>
                {discountType
                  ? DISCOUNT_TYPE_OPTIONS.find((o) => o.value === discountType)?.label
                  : 'เลือกประเภทส่วนลด'}
              </Text>
              <Ionicons
                name={showDiscountDropdown ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#9ca3af"
              />
            </TouchableOpacity>
            {errors.discountType && <Text className={cn('text-xs text-rose-600')}>{errors.discountType}</Text>}

            {showDiscountDropdown && (
              <View className={cn('border border-slate-200 rounded-xl bg-white mt-1 overflow-hidden shadow-sm')}>
                {DISCOUNT_TYPE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    className={cn('px-3 py-2 border-b border-slate-100', discountType === opt.value && 'bg-rose-50')}
                    onPress={() => {
                      setDiscountType(opt.value);
                      setShowDiscountDropdown(false);
                      if (opt.value === 'free_product') {
                        setDiscountValue(0);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text className={cn('text-sm font-medium text-slate-950', discountType === opt.value && 'text-rose-600 font-bold')}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {discountType !== '' && discountType !== 'free_product' && (
            <View className={cn('gap-1')}>
              <Text className={cn('text-xs font-bold text-slate-500')}>
                {discountType === 'percent' ? 'เปอร์เซ็นต์ส่วนลด (1-99)' :
                 discountType === 'set_price' ? 'ราคาขาย (บาท)' :
                 'จำนวนเงินที่ลด (บาท)'}
              </Text>
              <TextInput
                className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-950 bg-white h-11', errors.discountValue && 'border-rose-600')}
                placeholder="0"
                placeholderTextColor="#9ca3af"
                value={discountValue > 0 ? String(discountValue) : ''}
                onChangeText={(v) => setDiscountValue(parseFloat(v) || 0)}
                keyboardType="numeric"
              />
              {errors.discountValue && <Text className={cn('text-xs text-rose-600')}>{errors.discountValue}</Text>}
            </View>
          )}
        </View>

        {discountType === 'free_product' && (
          <View className={cn('bg-white rounded-2xl p-4 shadow-sm gap-3')}>
            <View className={cn('flex-row items-center justify-between')}>
              <Text className={cn('text-base font-extrabold text-slate-950')}>โปรโมชั่นของแถม</Text>
              <TouchableOpacity className={cn('flex-row items-center gap-1')} onPress={handleAddFreeProduct} activeOpacity={0.7}>
                <Ionicons name="add-circle-outline" size={18} color="#f87171" />
                <Text className={cn('text-xs font-bold text-rose-600')}>เพิ่มสินค้าแถม</Text>
              </TouchableOpacity>
            </View>
            {errors.freeProducts && <Text className={cn('text-xs text-rose-600')}>{errors.freeProducts}</Text>}

            {freeProducts.map((fp, index) => (
              <View key={fp.productId} className={cn('flex-row items-center gap-2 py-1 border-b border-slate-100')}>
                <View className={cn('flex-1')}>
                  <Text className={cn('text-sm font-bold text-slate-950')} numberOfLines={1}>
                    {fp.productName}
                  </Text>
                  <Text className={cn('text-xs font-medium text-slate-500')}>{fp.productCode}</Text>
                </View>
                <TextInput
                  className={cn('w-[60px] text-xs font-medium text-slate-950 border border-slate-200 rounded-xl text-center py-0.5 px-1 h-[30px]')}
                  value={String(fp.quantity)}
                  onChangeText={(v) => handleFreeProductQtyChange(index, v)}
                  keyboardType="numeric"
                  placeholder="จำนวน"
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity
                  onPress={() => handleRemoveFreeProduct(index)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            {freeProducts.length === 0 && (
              <View className={cn('items-center py-4')}>
                <Text className={cn('text-xs font-medium text-gray-400')}>
                  ยังไม่ได้เลือกสินค้าแถม (1-10 รายการ)
                </Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity className={cn('flex-row items-center justify-center gap-2 bg-rose-600 rounded-xl py-3 shadow-lg shadow-rose-500/40')} onPress={handleSave} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#fafafa" />
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
