import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList } from '@/shared/tw/index';
import { Modal, Platform } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { usePromoStore } from '@/features/promotion/application/stores/promoStore';
import { ProductMaster } from '@/features/product/domain/product';
import { MOCK_PRODUCTS } from '@/features/product/data/mocks/mockProducts';
import { PromoConditionTabs, ConditionProduct } from '@/features/promotion/presentation/screens/components/PromoConditionTabs';
import { PromoRewardSection, DiscountProduct, FreeProduct } from '@/features/promotion/presentation/screens/components/PromoRewardSection';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';

export type { ConditionProduct, DiscountProduct, FreeProduct };

interface Props {
  onBack: () => void;
  onSave?: (name: string) => void;
  promoGroups?: Array<{ id: string; name: string }>;
  editPromoId?: string;
}

const MOCK_PROMO_GROUPS = [
  { id: 'pg-001', name: 'โปรเด็ก(แกดพล)' },
  { id: 'pg-002', name: 'โปรสินค้าเครื่องดื่ม' },
  { id: 'pg-003', name: 'กลุ่มขนมขบเคี้ยว' },
];

const PROMO_TYPES = ['โปรโมชั่น', 'รับคะแนน, ของกำนัล', 'คะแนนแลกสินค้า, ส่วนลด', 'ใช้คะแนนชำระ'];
const DISCOUNT_TYPES = ['ส่วนลดเฉพาะ', 'ส่วนลดท้ายบิล'];
const PURCHASE_TYPES = ['มากกว่า', 'น้อยกว่า', 'เท่ากับ', 'ทุกๆ'];
const MOCK_BRANCHES = [
  { id: 'branch-001', name: 'สาขาหลัก' },
  { id: 'branch-002', name: 'สาขา 2 (เซ็นทรัล)' },
  { id: 'branch-003', name: 'สาขา 3 (เทอร์มินอล 21)' },
  { id: 'branch-004', name: 'สาขา 4 (เมกาบางนา)' },
  { id: 'branch-005', name: 'สาขา 5 (สยามพารากอน)' },
  { id: 'branch-006', name: 'สาขา 6 (เอ็มควอเทียร์)' },
  { id: 'branch-007', name: 'สาขา 7 (ไอคอนสยาม)' },
  { id: 'branch-008', name: 'สาขา 8 (ฟิวเจอร์รังสิต)' },
];

export const StorePromoCreateScreen: React.FC<Props> = ({ onBack, onSave, promoGroups, editPromoId }) => {
  const { promotions } = usePromoStore();
  const editPromo = editPromoId ? promotions.find(p => p.id === editPromoId) : null;
  const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; variant: 'info' | 'success' | 'warning' | 'danger'; onConfirm?: () => void }>({ visible: false, title: '', message: '', variant: 'info' });

  const mapProducts = (ids?: string[]): ConditionProduct[] => {
    if (!ids || ids.length === 0) return [];
    return ids.map(id => {
      const p = MOCK_PRODUCTS.find(x => x.id === id);
      return { id, code: p?.code ?? id, name: p?.name ?? id, unit: p?.unit ?? 'ชิ้น', conditionType: 'ทุกๆ', qty: String(editPromo?.buyQty ?? '1'), qtyTo: '', condition: 'มากกว่า', promoGroupName: '' };
    });
  };

  const [name, setName] = useState(editPromo?.name ?? '');
  const [startDate, setStartDate] = useState(editPromo?.startDate ?? '');
  const [endDate, setEndDate] = useState(editPromo?.endDate ?? '');
  const [noEndDate, setNoEndDate] = useState(!editPromo?.endDate);
  const [promoType, setPromoType] = useState(
    editPromo?.type === 'percent' || editPromo?.type === 'fixed' || editPromo?.type === 'coupon' ? 'โปรโมชั่น'
    : editPromo?.type === 'buy_x_get_y' ? 'รับคะแนน, ของกำนัล'
    : 'โปรโมชั่น'
  );
  const [autoCalc, setAutoCalc] = useState(false);
  const [discountType, setDiscountType] = useState(
    editPromo?.type === 'percent' || editPromo?.type === 'fixed' ? 'ส่วนลดเฉพาะ' : 'ส่วนลดท้ายบิล'
  );

  const [selectedProducts, setSelectedProducts] = useState<ConditionProduct[]>(mapProducts(editPromo?.applicableProducts));
  const [excludedProducts, setExcludedProducts] = useState<ConditionProduct[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [timeStart, setTimeStart] = useState(editPromo?.startTime ?? '');
  const [timeEnd, setTimeEnd] = useState(editPromo?.endTime ?? '');
  const [purchaseAmount, setPurchaseAmount] = useState(editPromo?.minPurchase ? String(editPromo.minPurchase) : '');
  const [purchaseAmountTo, setPurchaseAmountTo] = useState('');
  const [purchaseType, setPurchaseType] = useState('มากกว่า');
  const [promoGroup, setPromoGroup] = useState('');
  const [pointExchangeRate, setPointExchangeRate] = useState('');
  const [pointExchangeMin, setPointExchangeMin] = useState('');
  const [selectedCouponCampaigns, setSelectedCouponCampaigns] = useState<string[]>([]);

  const [discountProducts, setDiscountProducts] = useState<DiscountProduct[]>([]);
  const [freebieProducts, setFreebieProducts] = useState<FreeProduct[]>(() => {
    if (editPromo?.getProductId) {
      const p = MOCK_PRODUCTS.find(x => x.id === editPromo.getProductId);
      return [{ id: editPromo.getProductId, code: p?.code ?? '', name: p?.name ?? 'สินค้าแถม', unit: p?.unit ?? 'ชิ้น', condition: '', qty: String(editPromo.getQty ?? 1) }];
    }
    return [];
  });
  const [headerDiscount, setHeaderDiscount] = useState(editPromo?.discountPercent ? true : editPromo?.discountAmount ? true : false);
  const [headerDiscountAmount, setHeaderDiscountAmount] = useState(editPromo?.discountAmount ? String(editPromo.discountAmount) : '');
  const [headerDiscountPercent, setHeaderDiscountPercent] = useState(editPromo?.discountPercent ? String(editPromo.discountPercent) : '');
  const [rewardPoints, setRewardPoints] = useState('');
  const [maxDiscountCap, setMaxDiscountCap] = useState(editPromo?.maxDiscount ? String(editPromo.maxDiscount) : '');

  const [showPromoTypePicker, setShowPromoTypePicker] = useState(false);
  const [showDiscountTypePicker, setShowDiscountTypePicker] = useState(false);
  const [showPromoGroupPicker, setShowPromoGroupPicker] = useState(false);
  const [showPurchaseTypePicker, setShowPurchaseTypePicker] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productModalTarget, setProductModalTarget] = useState<'condition' | 'discount' | 'freebie' | 'excluded'>('condition');

  const availableGroups = promoGroups || MOCK_PROMO_GROUPS;

  const toggleBranch = (id: string) => {
    setSelectedBranches((prev) => prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]);
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const openProductModal = (target: 'condition' | 'discount' | 'freebie' | 'excluded') => {
    setProductModalTarget(target);
    setShowProductModal(true);
  };

  const handleSelectProduct = (productId: string) => {
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (!product) return;

    if (productModalTarget === 'condition') {
      if (selectedProducts.find((p) => p.id === productId)) return;
      setSelectedProducts((prev) => [...prev, {
        id: product.id, code: product.code, name: product.name,
        unit: product.unit, conditionType: 'ทุกๆ', qty: '1', qtyTo: '',
        condition: 'หรือ', promoGroupName: promoGroup,
      }]);
    } else if (productModalTarget === 'excluded') {
      if (excludedProducts.find((p) => p.id === productId)) return;
      setExcludedProducts((prev) => [...prev, {
        id: product.id, code: product.code, name: product.name,
        unit: product.unit, conditionType: 'ทุกๆ', qty: '1', qtyTo: '',
        condition: '', promoGroupName: promoGroup,
      }]);
    } else if (productModalTarget === 'discount') {
      if (discountProducts.find((p) => p.id === productId)) return;
      setDiscountProducts((prev) => [...prev, {
        id: product.id, code: product.code, name: product.name,
        unit: product.unit, condition: '', qty: '1', promoGroupName: promoGroup,
        discountPerUnit: '', discountPercent: '', discount: '', discountBill: false, salePrice: '',
      }]);
    } else if (productModalTarget === 'freebie') {
      if (freebieProducts.find((p) => p.id === productId)) return;
      setFreebieProducts((prev) => [...prev, {
        id: product.id, code: product.code, name: product.name,
        unit: product.unit, condition: '', qty: '1',
      }]);
    }
  };

  const updateDiscountProduct = (id: string, field: keyof DiscountProduct, value: string | boolean) => {
    setDiscountProducts((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSave = () => {
    if (!name.trim()) {
      setAlert({ visible: true, title: 'กรุณากรอกข้อมูล', message: 'ชื่อโปรโมชั่นจำเป็นต้องกรอก', variant: 'warning' });
      return;
    }
    if (!startDate.trim()) {
      setAlert({ visible: true, title: 'กรุณากรอกข้อมูล', message: 'วันที่เริ่มมีผลจำเป็นต้องกรอก', variant: 'warning' });
      return;
    }
    setAlert({ visible: true, title: 'บันทึกสำเร็จ', message: 'เพิ่มโปรโมชั่นเรียบร้อยแล้ว', variant: 'success', onConfirm: () => { onSave?.(name); onBack(); } });
  };

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    options: string[],
    onSelect: (val: string) => void,
    title: string,
  ) => (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={onClose}>
        <View className={cn('bg-white rounded-2xl p-4 shadow-sm')} style={{ width: '80%', maxWidth: 340 }}>
          <Text className={cn('text-lg font-extrabold text-slate-950 mb-3')}>{title}</Text>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              className={cn('py-2 border-b border-slate-100')}
              onPress={() => { onSelect(opt); onClose(); }}
            >
              <Text className={cn('text-sm font-medium text-slate-950')}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderProductModal = () => (
    <Modal visible={showProductModal} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
        <View className={cn('bg-white rounded-2xl p-4 shadow-sm')} style={{ width: '90%', maxWidth: 500, maxHeight: '70%' }}>
          <View className={cn('flex-row justify-between items-center mb-3')}>
            <Text className={cn('text-lg font-extrabold text-slate-950')}>เลือกสินค้า</Text>
            <TouchableOpacity onPress={() => setShowProductModal(false)}>
              <Ionicons name="close" size={24} color="#292524" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={MOCK_PRODUCTS.filter((p) => p.status === 'active')}
            keyExtractor={(item: ProductMaster) => item.id}
            renderItem={({ item }: { item: ProductMaster }) => (
              <TouchableOpacity className={cn('flex-row items-center py-2')} onPress={() => handleSelectProduct(item.id)}>
                <View className={cn('flex-1')}>
                  <Text className={cn('text-xs font-medium text-slate-600')}>{item.code}</Text>
                  <Text className={cn('text-sm font-medium text-slate-950')}>{item.name}</Text>
                </View>
                <Text className={cn('text-sm font-bold text-rose-500')}>฿{item.salePrice}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#ffe4e6' }} />}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')}>
      <View className={cn('flex-row items-center justify-between px-3 py-2 bg-rose-600 shadow-sm')}>
        <TouchableOpacity onPress={onBack} className={cn('w-10 h-10 items-center justify-center')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className={cn('text-lg font-extrabold text-white')}>กำหนดโปรโมชั่น</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className={cn('flex-1')} contentContainerStyle={{ padding: 12, paddingBottom: 24, ...(Platform.OS === 'web' ? { maxWidth: 900, alignSelf: 'center', width: '100%' } : {}) }}>
        <Text className={cn('text-lg font-extrabold text-slate-950 mb-3 mt-1')}>1) ข้อมูลทั่วไป</Text>

        <Text className={cn('text-xs font-bold text-slate-600 mt-2 mb-1')}>ชื่อโปรโมชั่น *</Text>
        <TextInput
          className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-950 bg-white shadow-sm')}
          style={{ minHeight: 44 }}
          value={name}
          onChangeText={setName}
          placeholder="กรอกชื่อโปรโมชั่น"
          placeholderTextColor="#57534e"
        />

        <View className={cn('flex-row gap-3')}>
          <View className={cn('flex-1')}>
            <Text className={cn('text-xs font-bold text-slate-600 mt-2 mb-1')}>ประเภทโปรโมชั่น</Text>
            <TouchableOpacity className={cn('border border-slate-200 rounded-xl px-3 py-2 bg-white shadow-sm flex-row items-center justify-between')}
              style={{ minHeight: 44 }} onPress={() => setShowPromoTypePicker(true)}>
              <Text className={cn('text-sm font-medium text-slate-950 flex-1')}>{promoType}</Text>
              <Ionicons name="chevron-down" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
          <View className={cn('flex-1')}>
            <Text className={cn('text-xs font-bold text-slate-600 mt-2 mb-1')}>ประเภทส่วนลด</Text>
            <TouchableOpacity className={cn('border border-slate-200 rounded-xl px-3 py-2 bg-white shadow-sm flex-row items-center justify-between')}
              style={{ minHeight: 44 }} onPress={() => setShowDiscountTypePicker(true)}>
              <Text className={cn('text-sm font-medium text-slate-950 flex-1')}>{discountType}</Text>
              <Ionicons name="chevron-down" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        <View className={cn('flex-row gap-3')}>
          <View className={cn('flex-1')}>
            <Text className={cn('text-xs font-bold text-slate-600 mt-2 mb-1')}>วันที่เริ่มมีผล *</Text>
            <TextInput
              className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-950 bg-white shadow-sm')}
              style={{ minHeight: 44 }}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#57534e"
            />
          </View>
          <View className={cn('flex-1')}>
            <Text className={cn('text-xs font-bold text-slate-600 mt-2 mb-1')}>วันที่สิ้นสุด</Text>
            <TextInput
              className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium bg-white shadow-sm')}
              style={{ minHeight: 44, color: noEndDate ? '#57534e' : '#292524' }}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#57534e"
              editable={!noEndDate}
            />
          </View>
        </View>

        <View className={cn('flex-row gap-3')}>
          <View className={cn('flex-1')}>
            <TouchableOpacity className={cn('flex-row items-center mt-2 gap-2')} onPress={() => setNoEndDate(!noEndDate)}>
              <Ionicons name={noEndDate ? 'checkbox' : 'square-outline'} size={20} color={noEndDate ? '#f87171' : '#9ca3af'} />
              <Text className={cn('text-sm font-medium text-slate-950')}>ไม่มีวันสิ้นสุด</Text>
            </TouchableOpacity>
          </View>
          <View className={cn('flex-1')}>
            <TouchableOpacity className={cn('flex-row items-center mt-2 gap-2')} onPress={() => setAutoCalc(!autoCalc)}>
              <Ionicons name={autoCalc ? 'checkbox' : 'square-outline'} size={20} color={autoCalc ? '#f87171' : '#9ca3af'} />
              <Text className={cn('text-sm font-medium text-slate-950')}>คำนวณอัตโนมัติ</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className={cn('h-px bg-rose-100 my-4')} />

        <PromoConditionTabs
          promoType={promoType}
          selectedBranches={selectedBranches}
          onToggleBranch={toggleBranch}
          onOpenBranchModal={() => setShowBranchModal(true)}
          branches={MOCK_BRANCHES}
          selectedDays={selectedDays}
          onToggleDay={toggleDay}
          timeStart={timeStart}
          timeEnd={timeEnd}
          onTimeStartChange={setTimeStart}
          onTimeEndChange={setTimeEnd}
          selectedProducts={selectedProducts}
          onOpenProductModal={() => openProductModal('condition')}
          onRemoveProduct={(id) => setSelectedProducts((prev) => prev.filter((p) => p.id !== id))}
          promoGroup={promoGroup}
          onOpenPromoGroupPicker={() => setShowPromoGroupPicker(true)}
          purchaseAmount={purchaseAmount}
          purchaseAmountTo={purchaseAmountTo}
          purchaseType={purchaseType}
          onPurchaseAmountChange={setPurchaseAmount}
          onPurchaseAmountToChange={setPurchaseAmountTo}
          onOpenPurchaseTypePicker={() => setShowPurchaseTypePicker(true)}
          excludedProducts={excludedProducts}
          onOpenExcludedModal={() => openProductModal('excluded')}
          onRemoveExcluded={(id) => setExcludedProducts((prev) => prev.filter((p) => p.id !== id))}
          pointExchangeRate={pointExchangeRate}
          pointExchangeMin={pointExchangeMin}
          onPointExchangeRateChange={setPointExchangeRate}
          onPointExchangeMinChange={setPointExchangeMin}
          selectedCouponCampaigns={selectedCouponCampaigns}
          onCouponCampaignsChange={setSelectedCouponCampaigns}
        />

        <View className={cn('h-px bg-rose-100 my-4')} />

        <PromoRewardSection
          promoType={promoType}
          headerDiscount={headerDiscount}
          onToggleHeaderDiscount={() => setHeaderDiscount(!headerDiscount)}
          headerDiscountAmount={headerDiscountAmount}
          headerDiscountPercent={headerDiscountPercent}
          onHeaderDiscountAmountChange={setHeaderDiscountAmount}
          onHeaderDiscountPercentChange={setHeaderDiscountPercent}
          discountProducts={discountProducts}
          onOpenDiscountProductModal={() => openProductModal('discount')}
          onRemoveDiscountProduct={(id) => setDiscountProducts((prev) => prev.filter((p) => p.id !== id))}
          onUpdateDiscountProduct={updateDiscountProduct}
          freebieProducts={freebieProducts}
          onOpenFreebieModal={() => openProductModal('freebie')}
          onRemoveFreebieProduct={(id) => setFreebieProducts((prev) => prev.filter((p) => p.id !== id))}
          promoGroup={promoGroup}
          onOpenPromoGroupPicker={() => setShowPromoGroupPicker(true)}
          onOpenExcludedDiscountModal={() => openProductModal('excluded')}
          rewardPoints={rewardPoints}
          onRewardPointsChange={setRewardPoints}
        />

        <View className={cn('h-4')} />

        <View className={cn('flex-row gap-3 py-3')}>
          <TouchableOpacity className={cn('flex-1 border border-slate-200 rounded-xl py-3 items-center bg-white shadow-sm')} onPress={onBack}>
            <Text className={cn('text-base font-bold text-slate-600')}>ยกเลิก</Text>
          </TouchableOpacity>
          <TouchableOpacity className={cn('flex-1 flex-row gap-1 bg-rose-600 rounded-xl py-3 items-center justify-center shadow-lg shadow-rose-500/40')} onPress={handleSave}>
            <Ionicons name="checkmark" size={18} color="#fafafa" />
            <Text className={cn('text-base font-bold text-white')}>บันทึก</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderPickerModal(showPromoTypePicker, () => setShowPromoTypePicker(false), PROMO_TYPES, setPromoType, 'ประเภทโปรโมชั่น')}
      {renderPickerModal(showDiscountTypePicker, () => setShowDiscountTypePicker(false), DISCOUNT_TYPES, setDiscountType, 'ประเภทส่วนลด')}
      {renderPickerModal(showPurchaseTypePicker, () => setShowPurchaseTypePicker(false), PURCHASE_TYPES, setPurchaseType, 'ประเภทเงื่อนไข')}
      {renderPickerModal(
        showPromoGroupPicker,
        () => setShowPromoGroupPicker(false),
        availableGroups.map((g) => g.name),
        (val) => setPromoGroup(val),
        'เลือกกลุ่มสินค้าโปรโมชั่น',
      )}
      {renderProductModal()}

      <Modal visible={showBranchModal} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={() => setShowBranchModal(false)}>
          <View className={cn('bg-white rounded-2xl p-4 shadow-sm')} style={{ width: '85%', maxWidth: 380 }}>
            <Text className={cn('text-lg font-extrabold text-slate-950 mb-3')}>เลือกสาขา</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {MOCK_BRANCHES.map((branch) => (
                <TouchableOpacity key={branch.id} className={cn('flex-row items-center gap-2 py-2 border-b border-slate-100')} onPress={() => toggleBranch(branch.id)}>
                  <Ionicons
                    name={selectedBranches.includes(branch.id) ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={selectedBranches.includes(branch.id) ? '#f87171' : '#9ca3af'}
                  />
                  <Text className={cn('text-sm font-medium text-slate-950')}>{branch.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity className={cn('bg-rose-600 rounded-xl py-2 items-center mt-3 shadow-sm')} onPress={() => setShowBranchModal(false)}>
              <Text className={cn('text-base font-bold text-white')}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
