/**
 * StorePromoCreateScreen — ฟอร์มกำหนดโปรโมชั่น (refactored)
 * Delegates condition tabs to PromoConditionTabs and reward section to PromoRewardSection.
 * This file handles: Section 1 header fields, modals, actions.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { usePromoStore } from '../../store/promoStore';
import { MOCK_PRODUCTS } from '../../data/mockProducts';
import { PromoConditionTabs, ConditionProduct } from './components/PromoConditionTabs';
import { PromoRewardSection, DiscountProduct, FreeProduct } from './components/PromoRewardSection';
import { DatePicker } from '../../components/ui/DatePicker';

// Re-export types for consumers
export type { ConditionProduct, DiscountProduct, FreeProduct };

interface Props {
  onBack: () => void;
  onSave?: (name: string) => void;
  promoGroups?: Array<{ id: string; name: string }>;
  editPromoId?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
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

  // Helper: map product IDs → ConditionProduct[]
  const mapProducts = (ids?: string[]): ConditionProduct[] => {
    if (!ids || ids.length === 0) return [];
    return ids.map(id => {
      const p = MOCK_PRODUCTS.find(x => x.id === id);
      return { id, code: p?.code ?? id, name: p?.name ?? id, unit: p?.unit ?? 'ชิ้น', conditionType: 'ทุกๆ', qty: String(editPromo?.buyQty ?? '1'), qtyTo: '', condition: 'มากกว่า', promoGroupName: '' };
    });
  };

  // ─── Section 1 State ────────────────────────────────────────────────────────
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

  // ─── Condition State ────────────────────────────────────────────────────────
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

  // ─── Reward State ───────────────────────────────────────────────────────────
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

  // ─── Modal State ────────────────────────────────────────────────────────────
  const [showPromoTypePicker, setShowPromoTypePicker] = useState(false);
  const [showDiscountTypePicker, setShowDiscountTypePicker] = useState(false);
  const [showPromoGroupPicker, setShowPromoGroupPicker] = useState(false);
  const [showPurchaseTypePicker, setShowPurchaseTypePicker] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productModalTarget, setProductModalTarget] = useState<'condition' | 'discount' | 'freebie' | 'excluded'>('condition');

  const availableGroups = promoGroups || MOCK_PROMO_GROUPS;

  // ─── Handlers ───────────────────────────────────────────────────────────────
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
      Alert.alert('กรุณากรอกข้อมูล', 'ชื่อโปรโมชั่นจำเป็นต้องกรอก');
      return;
    }
    if (!startDate.trim()) {
      Alert.alert('กรุณากรอกข้อมูล', 'วันที่เริ่มมีผลจำเป็นต้องกรอก');
      return;
    }
    Alert.alert('บันทึกสำเร็จ', 'เพิ่มโปรโมชั่นเรียบร้อยแล้ว', [
      { text: 'ตกลง', onPress: () => { onSave?.(name); onBack(); } },
    ]);
  };

  // ─── Render: Picker Modal ───────────────────────────────────────────────────
  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    options: string[],
    onSelect: (val: string) => void,
    title: string,
  ) => (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.pickerModal}>
          <Text style={styles.pickerTitle}>{title}</Text>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.pickerOption}
              onPress={() => { onSelect(opt); onClose(); }}
            >
              <Text style={styles.pickerOptionText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ─── Render: Product Modal ──────────────────────────────────────────────────
  const renderProductModal = () => (
    <Modal visible={showProductModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.productModal}>
          <View style={styles.productModalHeader}>
            <Text style={styles.pickerTitle}>เลือกสินค้า</Text>
            <TouchableOpacity onPress={() => setShowProductModal(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={MOCK_PRODUCTS.filter((p) => p.status === 'active')}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.productItem} onPress={() => handleSelectProduct(item.id)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productItemCode}>{item.code}</Text>
                  <Text style={styles.productItemName}>{item.name}</Text>
                </View>
                <Text style={styles.productItemPrice}>฿{item.salePrice}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    </Modal>
  );

  // ─── Main Render ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>กำหนดโปรโมชั่น</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* ─── Section 1: ข้อมูลทั่วไป ─────────────────────────────────────── */}
        <Text style={styles.sectionHeader}>1) ข้อมูลทั่วไป</Text>

        <Text style={styles.fieldLabel}>ชื่อโปรโมชั่น *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="กรอกชื่อโปรโมชั่น"
          placeholderTextColor={Colors.textDisabled}
        />

        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <Text style={styles.fieldLabel}>ประเภทโปรโมชั่น</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowPromoTypePicker(true)}>
              <Text style={styles.inputText}>{promoType}</Text>
              <Ionicons name="chevron-down" size={18} color={Colors.gray400} />
            </TouchableOpacity>
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.fieldLabel}>ประเภทส่วนลด</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowDiscountTypePicker(true)}>
              <Text style={styles.inputText}>{discountType}</Text>
              <Ionicons name="chevron-down" size={18} color={Colors.gray400} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <DatePicker
              label="วันที่เริ่มมีผล *"
              value={startDate ? new Date(startDate) : null}
              onChange={(d) => setStartDate(d ? d.toISOString().slice(0, 10) : '')}
            />
          </View>
          <View style={styles.fieldHalf}>
            <DatePicker
              label="วันที่สิ้นสุด"
              value={endDate ? new Date(endDate) : null}
              onChange={(d) => setEndDate(d ? d.toISOString().slice(0, 10) : '')}
              disabled={noEndDate}
            />
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setNoEndDate(!noEndDate)}>
              <Ionicons name={noEndDate ? 'checkbox' : 'square-outline'} size={20} color={noEndDate ? Colors.primary : Colors.gray400} />
              <Text style={styles.checkboxLabel}>ไม่มีวันสิ้นสุด</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.fieldHalf}>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setAutoCalc(!autoCalc)}>
              <Ionicons name={autoCalc ? 'checkbox' : 'square-outline'} size={20} color={autoCalc ? Colors.primary : Colors.gray400} />
              <Text style={styles.checkboxLabel}>คำนวณอัตโนมัติ</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ─── Section 2: Conditions (delegated) ───────────────────────────── */}
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

        <View style={styles.divider} />

        {/* ─── Section 3: Rewards (delegated) ──────────────────────────────── */}
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

        <View style={{ height: Spacing.lg }} />

        {/* ─── Actions ─────────────────────────────────────────────────────── */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
            <Text style={styles.cancelBtnText}>ยกเลิก</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark" size={18} color={Colors.white} />
            <Text style={styles.saveBtnText}>บันทึก</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ─── Modals ────────────────────────────────────────────────────────── */}
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

      {/* Branch Modal */}
      <Modal visible={showBranchModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowBranchModal(false)}>
          <View style={styles.branchModal}>
            <Text style={styles.pickerTitle}>เลือกสาขา</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {MOCK_BRANCHES.map((branch) => (
                <TouchableOpacity key={branch.id} style={styles.branchModalRow} onPress={() => toggleBranch(branch.id)}>
                  <Ionicons
                    name={selectedBranches.includes(branch.id) ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={selectedBranches.includes(branch.id) ? Colors.primary : Colors.gray400}
                  />
                  <Text style={styles.branchModalText}>{branch.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.branchModalDoneBtn} onPress={() => setShowBranchModal(false)}>
              <Text style={styles.branchModalDoneBtnText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...Typography.h4, color: Colors.text },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: Spacing.md, paddingBottom: Spacing.xxl,
    ...(Platform.OS === 'web' ? { maxWidth: 900, alignSelf: 'center' as const, width: '100%' } : {}),
  },
  sectionHeader: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md, marginTop: Spacing.sm },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.lg },
  fieldLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    ...Typography.body2, color: Colors.text, backgroundColor: Colors.white,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44,
  },
  inputText: { ...Typography.body2, color: Colors.text, flex: 1 },
  fieldRow: { flexDirection: 'row', gap: Spacing.md },
  fieldHalf: { flex: 1 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: Spacing.sm },
  checkboxLabel: { ...Typography.body2, color: Colors.text },
  // Actions
  actions: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.md },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2, alignItems: 'center',
  },
  cancelBtnText: { ...Typography.button, color: Colors.textSecondary },
  saveBtn: {
    flex: 1, backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.xs,
  },
  saveBtnText: { ...Typography.button, color: Colors.white },
  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  pickerModal: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, width: '80%', maxWidth: 340 },
  pickerTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md },
  pickerOption: { paddingVertical: Spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  pickerOptionText: { ...Typography.body2, color: Colors.text },
  // Product Modal
  productModal: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, width: '90%', maxWidth: 500, maxHeight: '70%', padding: Spacing.lg },
  productModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  productItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  productItemCode: { ...Typography.caption, color: Colors.textSecondary },
  productItemName: { ...Typography.body2, color: Colors.text },
  productItemPrice: { ...Typography.body2, color: Colors.primary, fontWeight: '600' },
  separator: { height: 1, backgroundColor: Colors.divider },
  // Branch Modal
  branchModal: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, width: '85%', maxWidth: 380 },
  branchModalRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  branchModalText: { ...Typography.body2, color: Colors.text },
  branchModalDoneBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm + 2, alignItems: 'center', marginTop: Spacing.md },
  branchModalDoneBtnText: { ...Typography.button, color: Colors.white },
});
