/**
 * PromotionScreen — M07 โปรโมชั่น
 * Header with 2 action buttons + Filter tabs + Promo Grid/List + Create/Edit form views
 * Responsive: multi-column (≥768px) / single-column (<768px)
 *
 * Sub-view state management (no React Navigation stacks on web):
 * - 'main' → promo list with filter tabs + 2 header buttons
 * - 'store_create' → StorePromoCreateScreen form
 * - 'promo_group_manage' → PromoGroupManageView (create/manage product groups)
 * - 'promo_edit' → edit form (StorePromoCreateScreen pre-filled)
 */
import React, { useState, useMemo } from 'react';
import { FlatList, Modal, useWindowDimensions } from 'react-native';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { Palette } from '@/shared/constants/palette';
import { Colors, Space, Radius, Shadow, Font } from '@/shared/ui/tokens';
import { usePromoStore } from '@/features/promotion/application/stores/promoStore';
import { StorePromoCreateScreen } from '@/features/promotion/presentation/screens/StorePromoCreateScreen';
import { MOCK_PRODUCTS } from '@/features/product/data/mocks/mockProducts';
import { CouponScreen } from '@/features/web/presentation/screens/CouponScreen';
import { CampaignScreen } from '@/features/web/presentation/screens/CampaignScreen';
import { SegmentScreen } from '@/features/web/presentation/screens/SegmentScreen';
import { GamificationScreen } from '@/features/web/presentation/screens/GamificationScreen';

const fmt = (n: number) => n.toLocaleString('th-TH');

// ─── View Types ───────────────────────────────────────────────────────────────
type PromoView =
  | 'main'
  | 'store_create'
  | 'promo_edit'
  | 'promo_detail'
  | 'promo_group_manage'
  | 'coupon_manage'
  | 'campaign'
  | 'segment'
  | 'gamification';

// ─── Promo Group Interface ─────────────────────────────────────────────────────
interface PromoGroupProduct {
  productId: string;
  code: string;
  name: string;
  unit: string;
  approved: boolean;
  active: boolean;
}

interface PromoGroup {
  id: string;
  name: string;
  nameEN?: string;
  remark?: string;
  products: PromoGroupProduct[];
}

// ─── Promo Type Icons ─────────────────────────────────────────────────────────
const PROMO_ICONS: Record<string, { icon: string; color: string }> = {
  percent: { icon: 'pricetag-outline', color: Palette.primary },
  fixed: { icon: 'cash-outline', color: Palette.success },
  coupon: { icon: 'ticket-outline', color: Palette.info },
  member_price: { icon: 'people-outline', color: Palette.purple },
  buy_x_get_y: { icon: 'gift-outline', color: '#f97316' },
  happy_hour: { icon: 'time-outline', color: '#0d9488' },
  mix_match: { icon: 'layers-outline', color: '#6366f1' },
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: Palette.successLight, text: Palette.success },
  draft: { bg: Palette.gray100, text: Palette.grayMedium },
  expired: { bg: Palette.warningLight, text: '#ea580c' },
  disabled: { bg: Palette.dangerLight, text: Palette.danger },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.draft;
  const labelMap: Record<string, string> = { active: 'ใช้งาน', draft: 'ร่าง', expired: 'หมดอายุ', disabled: 'ปิดใช้งาน' };
  return (
    <View style={[sb.wrap, { backgroundColor: c.bg }]}>
      <Text style={[sb.text, { color: c.text }]}>{labelMap[status] || status}</Text>
    </View>
  );
};
const sb: Record<string, any> = {
  wrap: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  text: { fontSize: 12, fontWeight: '700' },
};

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
const TABS = ['ทั้งหมด', 'active', 'expired', 'disabled'] as const;
const TAB_LABELS: Record<string, string> = { ทั้งหมด: 'ทั้งหมด', active: 'Active', expired: 'Expired', disabled: 'Disabled' };

// ─── Web Form Wrapper (constrains mobile form screens for web) ────────────────
const FormWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={formWrapperStyles.container}>
    <View style={formWrapperStyles.inner}>
      {children}
    </View>
  </View>
);
const formWrapperStyles: Record<string, any> = {
  container: {
    flex: 1,
    backgroundColor: Palette.contentBg,
    alignItems: 'center',
    paddingVertical: 20,
  },
  inner: {
    width: '100%',
    maxWidth: 1100,
    flex: 1,
  },
};

// ─── PromoGroupManageView ─────────────────────────────────────────────────────
const PromoGroupManageView: React.FC<{
  promoGroups: PromoGroup[];
  setPromoGroups: React.Dispatch<React.SetStateAction<PromoGroup[]>>;
  onBack: () => void;
}> = ({ promoGroups, setPromoGroups, onBack }) => {
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formNameEN, setFormNameEN] = useState('');
  const [formRemark, setFormRemark] = useState('');
  const [formProducts, setFormProducts] = useState<PromoGroupProduct[]>([]);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [showPGProductModal, setShowPGProductModal] = useState(false);

  const handleSave = () => {
    if (!formName.trim()) return;
    const newGroup: PromoGroup = {
      id: Date.now().toString(),
      name: formName.trim(),
      nameEN: formNameEN.trim() || undefined,
      remark: formRemark.trim() || undefined,
      products: formProducts,
    };
    setPromoGroups(prev => [...prev, newGroup]);
    // Reset form
    setFormName('');
    setFormNameEN('');
    setFormRemark('');
    setFormProducts([]);
    setShowForm(false);
  };

  const handleAddProduct = (productId: string) => {
    // Avoid duplicates
    if (formProducts.some(p => p.productId === productId)) {
      setShowPGProductModal(false);
      return;
    }
    const product = MOCK_PRODUCTS.find(mp => mp.id === productId);
    if (!product) return;
    setFormProducts(prev => [...prev, {
      productId: product.id,
      code: product.code,
      name: product.name,
      unit: product.unit,
      approved: false,
      active: true,
    }]);
    setShowPGProductModal(false);
  };

  const toggleProductApproval = (index: number) => {
    setFormProducts(prev => prev.map((p, i) => i === index ? { ...p, approved: !p.approved } : p));
  };

  const toggleProductActive = (index: number) => {
    setFormProducts(prev => prev.map((p, i) => i === index ? { ...p, active: !p.active } : p));
  };

  return (
    <ScrollView style={pgStyles.container} contentContainerStyle={pgStyles.content}>
      {/* Header */}
      <View style={pgStyles.header}>
        <TouchableOpacity onPress={onBack} style={pgStyles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Palette.text} />
        </TouchableOpacity>
        <Text style={pgStyles.headerTitle}>จัดกลุ่มสินค้าโปรโมชั่น</Text>
      </View>

      {/* Create New Group Button */}
      {!showForm && (
        <TouchableOpacity style={pgStyles.createBtn} onPress={() => setShowForm(true)}>
          <Ionicons name="add-outline" size={18} color="#fafafa" />
          <Text style={pgStyles.createBtnText}>สร้างกลุ่มใหม่</Text>
        </TouchableOpacity>
      )}

      {/* Create Form */}
      {showForm && (
        <View style={pgStyles.formCard}>
          <Text style={pgStyles.formTitle}>สร้างกลุ่มสินค้าโปรโมชั่น</Text>

          <View style={pgStyles.fieldGroup}>
            <Text style={pgStyles.fieldLabel}>ชื่อกลุ่มสินค้าโปรโมชั่น *</Text>
            <TextInput
              style={pgStyles.input}
              value={formName}
              onChangeText={setFormName}
              placeholder="กรอกชื่อกลุ่ม"
              placeholderTextColor={Palette.textDisabled}
            />
          </View>

          <View style={pgStyles.fieldGroup}>
            <Text style={pgStyles.fieldLabel}>ชื่อกลุ่มสินค้าโปรโมชั่น-EN</Text>
            <TextInput
              style={pgStyles.input}
              value={formNameEN}
              onChangeText={setFormNameEN}
              placeholder="Group name (English)"
              placeholderTextColor={Palette.textDisabled}
            />
          </View>

          <View style={pgStyles.fieldGroup}>
            <Text style={pgStyles.fieldLabel}>หมายเหตุ</Text>
            <TextInput
              style={pgStyles.input}
              value={formRemark}
              onChangeText={setFormRemark}
              placeholder="หมายเหตุ (ถ้ามี)"
              placeholderTextColor={Palette.textDisabled}
            />
          </View>

          {/* Product Picker Button */}
          <TouchableOpacity style={pgStyles.pickBtn} onPress={() => setShowPGProductModal(true)}>
            <Ionicons name="search-outline" size={16} color={Palette.primary} />
            <Text style={pgStyles.pickBtnText}>เลือก</Text>
          </TouchableOpacity>

          {/* Product Table */}
          {formProducts.length > 0 && (
            <View style={pgStyles.table}>
              <View style={pgStyles.tableHeader}>
                <Text style={[pgStyles.thText, { width: 40 }]}>ลำดับ</Text>
                <Text style={[pgStyles.thText, { width: 80 }]}>สินค้า</Text>
                <Text style={[pgStyles.thText, { flex: 1 }]}>ชื่อสินค้า</Text>
                <Text style={[pgStyles.thText, { width: 60 }]}>หน่วย</Text>
                <Text style={[pgStyles.thText, { width: 60 }]}>อนุมัติ</Text>
                <Text style={[pgStyles.thText, { width: 70 }]}>สถานะ</Text>
              </View>
              {formProducts.map((product, idx) => (
                <View key={product.productId} style={pgStyles.tableRow}>
                  <Text style={[pgStyles.tdText, { width: 40 }]}>{idx + 1}</Text>
                  <Text style={[pgStyles.tdText, { width: 80 }]}>{product.code}</Text>
                  <Text style={[pgStyles.tdText, { flex: 1 }]} numberOfLines={1}>{product.name}</Text>
                  <Text style={[pgStyles.tdText, { width: 60 }]}>{product.unit}</Text>
                  <TouchableOpacity onPress={() => toggleProductApproval(idx)} style={{ width: 60, alignItems: 'center' }}>
                    <Ionicons
                      name={product.approved ? 'checkbox-outline' : 'square-outline'}
                      size={18}
                      color={product.approved ? Palette.success : Palette.grayMedium}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => toggleProductActive(idx)} style={{ width: 70, alignItems: 'center' }}>
                    <Text style={[pgStyles.statusText, { color: product.active ? Palette.success : Palette.danger }]}>
                      {product.active ? 'Y ใช้งาน' : 'N ไม่ใช้'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={pgStyles.formActions}>
            <TouchableOpacity style={pgStyles.cancelBtn} onPress={() => setShowForm(false)}>
              <Text style={pgStyles.cancelBtnText}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={pgStyles.saveBtn} onPress={handleSave}>
              <Text style={pgStyles.saveBtnText}>บันทึก</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Existing Groups List */}
      {promoGroups.length > 0 && (
        <View style={pgStyles.groupsSection}>
          <Text style={pgStyles.groupsSectionTitle}>กลุ่มสินค้าที่สร้างแล้ว</Text>
          {promoGroups.map(group => (
            <TouchableOpacity
              key={group.id}
              style={pgStyles.groupCard}
              onPress={() => setExpandedGroupId(prev => prev === group.id ? null : group.id)}
            >
              <View style={pgStyles.groupCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={pgStyles.groupName}>{group.name}</Text>
                  {group.nameEN ? <Text style={pgStyles.groupNameEN}>{group.nameEN}</Text> : null}
                </View>
                <Text style={pgStyles.groupCount}>{group.products.length} สินค้า</Text>
                <Ionicons
                  name={expandedGroupId === group.id ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Palette.grayMedium}
                />
              </View>
              {expandedGroupId === group.id && group.products.length > 0 && (
                <View style={pgStyles.expandedProducts}>
                  {group.products.map((p, idx) => (
                    <View key={p.productId} style={pgStyles.expandedRow}>
                      <Text style={pgStyles.expandedText}>{idx + 1}. {p.code} — {p.name} ({p.unit})</Text>
                      <Text style={[pgStyles.expandedStatus, { color: p.active ? Palette.success : Palette.danger }]}>
                        {p.active ? 'Y' : 'N'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Empty state */}
      {promoGroups.length === 0 && !showForm && (
        <View style={pgStyles.emptyState}>
          <Ionicons name="albums-outline" size={48} color={Palette.border} />
          <Text style={pgStyles.emptyText}>ยังไม่มีกลุ่มสินค้าโปรโมชั่น</Text>
          <Text style={pgStyles.emptySubText}>กด "สร้างกลุ่มใหม่" เพื่อเริ่มต้น</Text>
        </View>
      )}

      {/* Product Picker Modal */}
      <Modal visible={showPGProductModal} transparent animationType="fade" onRequestClose={() => setShowPGProductModal(false)}>
        <View style={pgStyles.modalOverlay}>
          <View style={pgStyles.modalContent}>
            <View style={pgStyles.modalHeader}>
              <Text style={pgStyles.modalTitle}>เลือกสินค้า</Text>
              <TouchableOpacity onPress={() => setShowPGProductModal(false)}>
                <Ionicons name="close" size={22} color={Palette.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={MOCK_PRODUCTS.filter(mp => mp.status === 'active')}
              keyExtractor={(item) => item.id}
              style={pgStyles.modalList}
              renderItem={({ item }) => {
                const alreadyAdded = formProducts.some(p => p.productId === item.id);
                return (
                  <TouchableOpacity
                    style={[pgStyles.modalItem, alreadyAdded && pgStyles.modalItemDisabled]}
                    onPress={() => !alreadyAdded && handleAddProduct(item.id)}
                    disabled={alreadyAdded}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={pgStyles.modalItemName}>{item.name}</Text>
                      <Text style={pgStyles.modalItemCode}>{item.code} — {item.unit}</Text>
                    </View>
                    {alreadyAdded && (
                      <Ionicons name="checkmark-circle" size={18} color={Palette.success} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const pgStyles: Record<string, any> = {
  container: { flex: 1, backgroundColor: Palette.contentBg },
  content: { padding: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 14, fontWeight: '800', color: Palette.text },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Palette.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, alignSelf: 'flex-start' },
  createBtnText: { color: '#fafafa', fontSize: 12, fontWeight: '700' },
  formCard: { backgroundColor: '#fafafa', borderRadius: 12, borderWidth: 1, borderColor: Palette.border, padding: 20, gap: 14 },
  formTitle: { fontSize: 12, fontWeight: '700', color: Palette.text },
  fieldGroup: { gap: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Palette.textSecondary },
  input: { borderWidth: 1, borderColor: Palette.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: Palette.text, backgroundColor: '#fafafa' },
  pickBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Palette.primary, alignSelf: 'flex-start' },
  pickBtnText: { fontSize: 12, fontWeight: '700', color: Palette.primary },
  table: { borderWidth: 1, borderColor: Palette.border, borderRadius: 8, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.gray100, paddingHorizontal: 10, paddingVertical: 8 },
  thText: { fontSize: 13, fontWeight: '700', color: Palette.textSecondary },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: Palette.border },
  tdText: { fontSize: 13, color: Palette.text },
  statusText: { fontSize: 12, fontWeight: '700' },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Palette.border },
  cancelBtnText: { fontSize: 12, fontWeight: '600', color: Palette.textSecondary },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: Palette.primary },
  saveBtnText: { fontSize: 12, fontWeight: '700', color: '#fafafa' },
  groupsSection: { gap: 10 },
  groupsSectionTitle: { fontSize: 12, fontWeight: '700', color: Palette.text },
  groupCard: { backgroundColor: '#fafafa', borderRadius: 12, borderWidth: 1, borderColor: Palette.border, padding: 14, gap: 8 },
  groupCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  groupName: { fontSize: 12, fontWeight: '700', color: Palette.text },
  groupNameEN: { fontSize: 13, color: Palette.textSecondary },
  groupCount: { fontSize: 13, fontWeight: '600', color: Palette.grayMedium },
  expandedProducts: { gap: 4, paddingLeft: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: Palette.border },
  expandedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  expandedText: { fontSize: 13, color: Palette.text },
  expandedStatus: { fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 12, fontWeight: '600', color: Palette.textSecondary },
  emptySubText: { fontSize: 13, color: Palette.grayMedium },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fafafa', borderRadius: 12, width: '90%', maxWidth: 500, maxHeight: '70%', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Palette.border },
  modalTitle: { fontSize: 12, fontWeight: '700', color: Palette.text },
  modalList: { paddingHorizontal: 16 },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Palette.border, flexDirection: 'row', alignItems: 'center' },
  modalItemDisabled: { opacity: 0.5 },
  modalItemName: { fontSize: 12, fontWeight: '600', color: Palette.text },
  modalItemCode: { fontSize: 13, color: Palette.textSecondary, marginTop: 2 },
};

// ─── Audit Log Interface ──────────────────────────────────────────────────────
interface AuditLogEntry {
  id: string;
  promoId: string;
  promoName: string;
  action: 'สร้าง' | 'แก้ไข' | 'ยืนยัน' | 'ยกเลิก' | 'ปิดใช้งาน';
  performedBy: string;
  performedAt: string; // ISO datetime
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const PromotionScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const { promotions, disablePromotion } = usePromoStore();

  // Sub-view state
  const [currentView, setCurrentView] = useState<PromoView>('main');
  const [editPromoId, setEditPromoId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>('ทั้งหมด');

  // Promo groups state
  const [promoGroups, setPromoGroups] = useState<PromoGroup[]>([]);

  // Audit log state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const addAuditLog = (promoId: string, promoName: string, action: AuditLogEntry['action']) => {
    const entry: AuditLogEntry = {
      id: Date.now().toString(),
      promoId,
      promoName,
      action,
      performedBy: 'เจ้าของร้าน',
      performedAt: new Date().toISOString(),
    };
    setAuditLogs(prev => [entry, ...prev]);
  };

  const filtered = useMemo(() => {
    if (activeTab === 'ทั้งหมด') return promotions;
    return promotions.filter(p => p.status === activeTab);
  }, [activeTab, promotions]);

  const handlePromoCardPress = (promoId: string) => {
    setEditPromoId(promoId);
    setCurrentView('promo_detail');
  };

  const handleBack = () => {
    setCurrentView('main');
    setEditPromoId(null);
  };

  // ─── Render Form Views ────────────────────────────────────────────────────
  if (currentView === 'promo_group_manage') {
    return (
      <PromoGroupManageView
        promoGroups={promoGroups}
        setPromoGroups={setPromoGroups}
        onBack={handleBack}
      />
    );
  }

  if (currentView === 'promo_detail') {
    const promo = promotions.find(p => p.id === editPromoId);
    if (!promo) {
      return (
        <View style={detailStyles.container}>
          <Text style={detailStyles.errorText}>ไม่พบข้อมูลโปรโมชั่น</Text>
          <TouchableOpacity style={detailStyles.backBtnBottom} onPress={handleBack}>
            <Text style={detailStyles.backBtnBottomText}>← ย้อนกลับ</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const typeLabels: Record<string, string> = {
      percent: 'ส่วนลด %',
      fixed: 'ส่วนลดเงิน',
      coupon: 'คูปอง',
      member_price: 'ราคาสมาชิก',
      buy_x_get_y: 'ซื้อ X แถม Y',
      happy_hour: 'Happy Hour',
      mix_match: 'Mix & Match',
    };
    const statusLabels: Record<string, string> = { active: 'ใช้งาน', draft: 'ร่าง', expired: 'หมดอายุ', disabled: 'ปิดใช้งาน' };
    const promoAuditLogs = auditLogs.filter(log => log.promoId === promo.id);

    return (
      <ScrollView style={detailStyles.container} contentContainerStyle={detailStyles.content}>
        {/* Header */}
        <View style={detailStyles.header}>
          <TouchableOpacity onPress={handleBack} style={detailStyles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Palette.text} />
            <Text style={detailStyles.backBtnText}>ย้อนกลับ</Text>
          </TouchableOpacity>
          <Text style={detailStyles.headerTitle}>รายละเอียดโปรโมชั่น</Text>
        </View>

        {/* Detail Card */}
        <View style={detailStyles.card}>
          <View style={detailStyles.fieldRow}>
            <Text style={detailStyles.fieldLabel}>ชื่อ</Text>
            <Text style={detailStyles.fieldValue}>{promo.name}</Text>
          </View>
          <View style={detailStyles.fieldRow}>
            <Text style={detailStyles.fieldLabel}>รหัส</Text>
            <Text style={detailStyles.fieldValue}>{promo.promoCode}</Text>
          </View>
          <View style={detailStyles.fieldRow}>
            <Text style={detailStyles.fieldLabel}>ประเภท</Text>
            <Text style={detailStyles.fieldValue}>{typeLabels[promo.type] || promo.type}</Text>
          </View>
          <View style={detailStyles.fieldRow}>
            <Text style={detailStyles.fieldLabel}>สถานะ</Text>
            <StatusBadge status={promo.status} />
          </View>
          <View style={detailStyles.fieldRow}>
            <Text style={detailStyles.fieldLabel}>ช่วงวันที่</Text>
            <Text style={detailStyles.fieldValue}>{promo.startDate} ~ {promo.endDate}</Text>
          </View>
          <View style={detailStyles.fieldRow}>
            <Text style={detailStyles.fieldLabel}>ใช้งานแล้ว</Text>
            <Text style={detailStyles.fieldValue}>{fmt(promo.usageCount)} ครั้ง</Text>
          </View>
          <View style={detailStyles.fieldRow}>
            <Text style={detailStyles.fieldLabel}>ส่วนลดรวม</Text>
            <Text style={[detailStyles.fieldValue, { color: Palette.primary, fontWeight: '700' }]}>฿{fmt(promo.totalDiscountGiven)}</Text>
          </View>
        </View>

        {/* Audit Log Section */}
        <View style={detailStyles.auditSection}>
          <Text style={detailStyles.auditTitle}>ประวัติการดำเนินการ (Audit Log)</Text>
          {promoAuditLogs.length === 0 ? (
            <Text style={detailStyles.auditEmpty}>ยังไม่มีประวัติการดำเนินการ</Text>
          ) : (
            promoAuditLogs.map(log => (
              <View key={log.id} style={detailStyles.auditRow}>
                <Text style={detailStyles.auditDot}>•</Text>
                <Text style={detailStyles.auditText}>
                  {new Date(log.performedAt).toLocaleString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })} - {log.action} โดย {log.performedBy}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Action Buttons */}
        <View style={detailStyles.actions}>
          <TouchableOpacity style={detailStyles.backBtnBottom} onPress={handleBack}>
            <Text style={detailStyles.backBtnBottomText}>← ย้อนกลับ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={detailStyles.editBtn}
            onPress={() => {
              addAuditLog(promo.id, promo.name, 'แก้ไข');
              setCurrentView('promo_edit');
            }}
          >
            <Ionicons name="create-outline" size={16} color="#fafafa" />
            <Text style={detailStyles.editBtnText}>แก้ไข</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (currentView === 'coupon_manage') return <CouponScreen onBack={() => setCurrentView('main')} />;
  if (currentView === 'campaign') return <CampaignScreen onBack={() => setCurrentView('main')} />;
  if (currentView === 'segment') return <SegmentScreen onBack={() => setCurrentView('main')} />;
  if (currentView === 'gamification') return <GamificationScreen onBack={() => setCurrentView('main')} />;

  if (currentView !== 'main') {
    return (
      <FormWrapper>
        {currentView === 'store_create' && (
          <StorePromoCreateScreen
            onBack={handleBack}
            onSave={(promoName) => {
              const id = Date.now().toString();
              addAuditLog(id, promoName, 'สร้าง');
            }}
          />
        )}
        {currentView === 'promo_edit' && (
          <StorePromoCreateScreen onBack={handleBack} editPromoId={editPromoId ?? undefined} />
        )}
      </FormWrapper>
    );
  }

  // ─── Main View ────────────────────────────────────────────────────────────
  return (
    <ScrollView style={s.container} contentContainerStyle={[s.containerContent, isMobile && s.containerContentMobile]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[s.headerRow, isMobile && s.headerRowMobile]}>
        <Text style={s.title}>โปรโมชั่น</Text>
        <View style={[s.headerButtons, isMobile && s.headerButtonsMobile]}>
          <TouchableOpacity style={[s.secondaryBtn, isMobile && s.actionBtnMobile]} onPress={() => setCurrentView('coupon_manage')}>
            <Ionicons name="ticket-outline" size={16} color={Palette.primary} />
            <Text style={s.secondaryBtnText}>คูปอง</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.secondaryBtn, isMobile && s.actionBtnMobile]} onPress={() => setCurrentView('campaign')}>
            <Ionicons name="megaphone-outline" size={16} color={Palette.primary} />
            <Text style={s.secondaryBtnText}>Campaign</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.secondaryBtn, isMobile && s.actionBtnMobile]} onPress={() => setCurrentView('segment')}>
            <Ionicons name="people-outline" size={16} color={Palette.primary} />
            <Text style={s.secondaryBtnText}>Segment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.secondaryBtn, isMobile && s.actionBtnMobile]} onPress={() => setCurrentView('gamification')}>
            <Ionicons name="game-controller-outline" size={16} color={Palette.primary} />
            <Text style={s.secondaryBtnText}>Gamification</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.secondaryBtn, isMobile && s.actionBtnMobile]} onPress={() => setCurrentView('promo_group_manage')}>
            <Ionicons name="albums-outline" size={16} color={Palette.primary} />
            <Text style={s.secondaryBtnText}>จัดกลุ่มสินค้าโปรโมชั่น</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.addBtn, isMobile && s.actionBtnMobile]} onPress={() => setCurrentView('store_create')}>
            <Ionicons name="add-outline" size={18} color="#fafafa" />
            <Text style={s.addBtnText}>สร้างโปรโมชั่น</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={[s.tabRow, isMobile && s.tabRowMobile]}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[s.tab, activeTab === t && s.tabActive]} onPress={() => setActiveTab(t)}>
            <Text style={[s.tabText, activeTab === t && s.tabTextActive]}>{TAB_LABELS[t]}</Text>
            {t !== 'ทั้งหมด' && (
              <View style={[s.tabCount, activeTab === t && s.tabCountActive]}>
                <Text style={[s.tabCountText, activeTab === t && s.tabCountTextActive]}>
                  {promotions.filter(p => p.status === t).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── Promo Grid (clickable cards) ──────────────────────────────── */}
      <View style={s.grid}>
        {filtered.map(p => {
          const typeInfo = PROMO_ICONS[p.type] || PROMO_ICONS.percent;
          return (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.7}
              onPress={() => handlePromoCardPress(p.id)}
              style={[s.card, isMobile && s.cardMobile]}
            >
              <View style={s.cardHeader}>
                <View style={[s.typeIcon, { backgroundColor: typeInfo.color + '18' }]}>
                  <Ionicons name={typeInfo.icon as any} size={18} color={typeInfo.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardName} numberOfLines={1}>{p.name}</Text>
                  <Text style={s.cardCode}>{p.promoCode}</Text>
                </View>
                <StatusBadge status={p.status} />
              </View>

              <View style={s.cardBody}>
                <View style={s.cardStat}>
                  <Text style={s.statLabel}>ช่วงวันที่</Text>
                  <Text style={s.statValue}>{p.startDate} ~ {p.endDate}</Text>
                </View>
                <View style={s.cardStatRow}>
                  <View style={s.cardStat}>
                    <Text style={s.statLabel}>ใช้งานแล้ว</Text>
                    <Text style={s.statValue}>{fmt(p.usageCount)} ครั้ง</Text>
                  </View>
                  <View style={s.cardStat}>
                    <Text style={s.statLabel}>ส่วนลดรวม</Text>
                    <Text style={[s.statValue, { color: Palette.primary }]}>฿{fmt(p.totalDiscountGiven)}</Text>
                  </View>
                </View>
              </View>

              {p.status === 'active' && (
                <TouchableOpacity
                  style={s.disableBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    addAuditLog(p.id, p.name, 'ปิดใช้งาน');
                    disablePromotion(p.id);
                  }}
                >
                  <Ionicons name="pause-circle-outline" size={14} color={Palette.danger} />
                  <Text style={s.disableBtnText}>ปิดใช้งาน</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
        {filtered.length === 0 && (
          <View style={s.emptyState}>
            <Ionicons name="pricetags-outline" size={48} color={Palette.border} />
            <Text style={s.emptyText}>ไม่มีโปรโมชั่นในหมวดนี้</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// ─── Detail View Styles ───────────────────────────────────────────────────────
const detailStyles: Record<string, any> = {
  container: { flex: 1, backgroundColor: Palette.contentBg },
  content: { padding: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  backBtnText: { fontSize: 12, color: Palette.text, fontWeight: '600' },
  headerTitle: { fontSize: 14, fontWeight: '800', color: Palette.text },
  card: { backgroundColor: '#fafafa', borderRadius: 12, borderWidth: 1, borderColor: Palette.border, padding: 20, gap: 14 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Palette.textSecondary, width: 100 },
  fieldValue: { fontSize: 12, color: Palette.text, flex: 1 },
  auditSection: { backgroundColor: '#fafafa', borderRadius: 12, borderWidth: 1, borderColor: Palette.border, padding: 20, gap: 10 },
  auditTitle: { fontSize: 12, fontWeight: '700', color: Palette.text, marginBottom: 4 },
  auditEmpty: { fontSize: 13, color: Palette.grayMedium, fontStyle: 'italic' },
  auditRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  auditDot: { fontSize: 12, color: Palette.textSecondary, lineHeight: 18 },
  auditText: { fontSize: 13, color: Palette.text, lineHeight: 18, flex: 1 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 8 },
  backBtnBottom: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: Palette.border, backgroundColor: '#fafafa' },
  backBtnBottomText: { fontSize: 12, fontWeight: '600', color: Palette.textSecondary },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: Palette.primary },
  editBtnText: { fontSize: 12, fontWeight: '700', color: '#fafafa' },
  errorText: { fontSize: 12, color: Palette.danger, textAlign: 'center', marginTop: 40 },
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, any> = {
  container: { flex: 1, backgroundColor: Palette.contentBg },
  containerContent: { padding: 20, gap: 16 },
  containerContentMobile: { padding: 14, gap: 14 },

  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  headerRowMobile: { alignItems: 'stretch' },
  title: { fontSize: 14, fontWeight: '800', color: Palette.text },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerButtonsMobile: { width: '100%', flexWrap: 'wrap' },
  actionBtnMobile: { minHeight: 42, flexGrow: 1, justifyContent: 'center' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Palette.primary, backgroundColor: '#fafafa' },
  secondaryBtnText: { color: Palette.primary, fontSize: 12, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Palette.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fafafa', fontSize: 12, fontWeight: '700' },

  // Tabs
  tabRow: { flexDirection: 'row', gap: 6 },
  tabRowMobile: { flexWrap: 'wrap' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Palette.border, backgroundColor: '#fafafa' },
  tabActive: { backgroundColor: Palette.primary, borderColor: Palette.primary },
  tabText: { fontSize: 13, color: Palette.textSecondary, fontWeight: '600' },
  tabTextActive: { color: '#fafafa' },
  tabCount: { backgroundColor: Palette.gray100, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabCountText: { fontSize: 12, fontWeight: '700', color: Palette.textSecondary },
  tabCountTextActive: { color: '#fafafa' },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingBottom: 20 },

  // Card (clickable)
  card: { width: 320, backgroundColor: '#fafafa', borderRadius: 12, borderWidth: 1, borderColor: Palette.border, padding: 14, gap: 10 },
  cardMobile: { width: '100%' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 12, fontWeight: '700', color: Palette.text },
  cardCode: { fontSize: 13, color: Palette.textSecondary, marginTop: 1 },
  cardBody: { gap: 6 },
  cardStatRow: { flexDirection: 'row', gap: 16 },
  cardStat: { gap: 2 },
  statLabel: { fontSize: 12, color: Palette.textSecondary },
  statValue: { fontSize: 13, fontWeight: '600', color: Palette.text },
  disableBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  disableBtnText: { fontSize: 13, color: Palette.danger, fontWeight: '600' },

  // Empty
  emptyState: { width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 12, color: Palette.textSecondary },
};
