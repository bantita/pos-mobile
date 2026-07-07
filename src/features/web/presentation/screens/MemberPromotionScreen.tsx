/**
 * MemberPromotionScreen — Member Promotion Engine
 * จัดการโปรโมชั่นเฉพาะสมาชิก (แยกจาก PromotionScreen)
 * เข้าถึงจาก CRM sidebar: "โปรโมชั่นสมาชิก"
 */
import React, { useState, useMemo } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { Palette } from '@/shared/constants/palette';
import { MemberPromotion, MemberPromoType, MemberPromoStatus } from '@/features/promotion/domain/memberPromotion';
import { MOCK_MEMBER_PROMOTIONS } from '@/features/promotion/data/mocks/mockMemberPromotions';

// ─── Constants ────────────────────────────────────────────────────────────────

type CategoryKey = 'discount' | 'lifecycle' | 'points' | 'milestone' | 'segment' | 'special';

interface PromoCategory {
  key: CategoryKey;
  label: string;
  icon: string;
  types: MemberPromoType[];
}

const CATEGORIES: PromoCategory[] = [
  { key: 'discount', label: 'ส่วนลดสมาชิก', icon: 'pricetag-outline', types: ['member_price', 'level_discount'] },
  { key: 'lifecycle', label: 'วันเกิด & Welcome', icon: 'gift-outline', types: ['birthday', 'welcome', 'anniversary'] },
  { key: 'points', label: 'แต้มสะสม', icon: 'star-outline', types: ['bonus_points', 'points_to_discount', 'points_to_product'] },
  { key: 'milestone', label: 'ยอดซื้อ & ครั้ง', icon: 'trophy-outline', types: ['spend_milestone', 'visit_milestone', 'stamp'] },
  { key: 'segment', label: 'กลุ่มลูกค้า', icon: 'people-outline', types: ['segment', 'win_back', 'favorite_product'] },
  { key: 'special', label: 'พิเศษ', icon: 'diamond-outline', types: ['level_upgrade', 'vip_exclusive', 'referral', 'avg_spend'] },
];

/** Phase 1 types ที่พร้อมใช้งาน */
const PHASE1_TYPES: MemberPromoType[] = [
  'member_price', 'level_discount', 'birthday', 'welcome',
  'bonus_points', 'points_to_discount', 'points_to_product', 'stamp',
];

interface PromoTypeInfo {
  type: MemberPromoType;
  label: string;
  icon: string;
}

const ALL_PROMO_TYPES: PromoTypeInfo[] = [
  { type: 'member_price', label: '1. ราคาสมาชิก', icon: 'pricetag' },
  { type: 'level_discount', label: '2. ส่วนลดตามระดับ', icon: 'ribbon' },
  { type: 'birthday', label: '3. วันเกิด', icon: 'balloon' },
  { type: 'welcome', label: '4. สมัครใหม่ (Welcome)', icon: 'hand-left' },
  { type: 'level_upgrade', label: '5. เลื่อนระดับ', icon: 'arrow-up-circle' },
  { type: 'bonus_points', label: '6. แต้มสะสมพิเศษ', icon: 'star' },
  { type: 'points_to_discount', label: '7. แต้มแลกส่วนลด', icon: 'swap-horizontal' },
  { type: 'points_to_product', label: '8. แต้มแลกสินค้า', icon: 'cube' },
  { type: 'spend_milestone', label: '9. ยอดซื้อสะสม', icon: 'cash' },
  { type: 'visit_milestone', label: '10. จำนวนครั้งซื้อ', icon: 'footsteps' },
  { type: 'segment', label: '11. เฉพาะกลุ่ม', icon: 'layers' },
  { type: 'win_back', label: '12. ลูกค้ากลับมา', icon: 'refresh-circle' },
  { type: 'favorite_product', label: '13. ตามสินค้าโปรด', icon: 'heart' },
  { type: 'avg_spend', label: '14. ตามยอดซื้อเฉลี่ย', icon: 'analytics' },
  { type: 'vip_exclusive', label: '15. VIP เท่านั้น', icon: 'shield-checkmark' },
  { type: 'stamp', label: '16. Stamp Campaign', icon: 'grid' },
  { type: 'referral', label: '17. แนะนำเพื่อน', icon: 'people' },
  { type: 'anniversary', label: '18. ครบรอบสมาชิก', icon: 'calendar' },
];

const getTypeLabel = (type: MemberPromoType): string => {
  return ALL_PROMO_TYPES.find(t => t.type === type)?.label || type;
};

const getTypeIcon = (type: MemberPromoType): string => {
  return ALL_PROMO_TYPES.find(t => t.type === type)?.icon || 'help-circle';
};

const getStatusInfo = (status: MemberPromoStatus) => {
  switch (status) {
    case 'active': return { label: 'Active', color: Palette.success, bg: Palette.successLight };
    case 'paused': return { label: 'หยุดชั่วคราว', color: Palette.warning, bg: Palette.warningLight };
    case 'expired': return { label: 'หมดอายุ', color: Palette.grayMedium, bg: Palette.gray100 };
    case 'draft': return { label: 'แบบร่าง', color: Palette.info, bg: Palette.infoLight };
  }
};

const formatRewards = (promo: MemberPromotion): string => {
  return promo.rewards.map(r => {
    switch (r.type) {
      case 'discount_percent': return `ลด ${r.value}%${r.maxDiscount ? ` (สูงสุด ${r.maxDiscount}฿)` : ''}`;
      case 'discount_amount': return `ลด ${r.value} บาท`;
      case 'coupon': return `คูปอง ${r.value} บาท`;
      case 'points': return `${r.value} แต้ม`;
      case 'free_product': return `แลกสินค้าฟรี`;
      case 'point_multiplier': return `แต้ม x${r.value}`;
      default: return '';
    }
  }).join(' + ');
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

const KPICard: React.FC<{ label: string; value: string | number; color?: string; icon: string }> = ({ label, value, color, icon }) => (
  <View style={styles.kpiCard}>
    <View style={[styles.kpiIconWrap, { backgroundColor: (color || Palette.primary) + '15' }]}>
      <Ionicons name={icon as any} size={20} color={color || Palette.primary} />
    </View>
    <Text style={[styles.kpiValue, color ? { color } : undefined]}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </Text>
    <Text style={styles.kpiLabel}>{label}</Text>
  </View>
);

const StatusBadge: React.FC<{ status: MemberPromoStatus }> = ({ status }) => {
  const info = getStatusInfo(status);
  return (
    <View style={[styles.badge, { backgroundColor: info.bg }]}>
      <Text style={[styles.badgeText, { color: info.color }]}>{info.label}</Text>
    </View>
  );
};

// ─── Create Promo Form ────────────────────────────────────────────────────────

interface CreateFormProps {
  onClose: () => void;
}

const CreatePromoForm: React.FC<CreateFormProps> = ({ onClose }) => {
  const [selectedType, setSelectedType] = useState<MemberPromoType | ''>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  return (
    <View style={styles.formPanel}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>สร้างโปรโมชั่นสมาชิก</Text>
        <TouchableOpacity onPress={onClose} style={styles.formCloseBtn}>
          <Ionicons name="close" size={22} color={Palette.grayMedium} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.formBody} showsVerticalScrollIndicator={false}>
        {/* ประเภทโปรโมชั่น */}
        <Text style={styles.formLabel}>ประเภทโปรโมชั่น *</Text>
        <View style={styles.typeGrid}>
          {ALL_PROMO_TYPES.map(t => {
            const isPhase1 = PHASE1_TYPES.includes(t.type);
            const isSelected = selectedType === t.type;
            return (
              <TouchableOpacity
                key={t.type}
                style={[
                  styles.typeOption,
                  isSelected && styles.typeOptionActive,
                  !isPhase1 && styles.typeOptionDisabled,
                ]}
                onPress={() => isPhase1 && setSelectedType(t.type)}
                disabled={!isPhase1}
              >
                <Ionicons name={t.icon as any} size={16} color={isSelected ? '#fafafa' : isPhase1 ? Palette.primary : Palette.textDisabled} />
                <Text style={[
                  styles.typeOptionText,
                  isSelected && styles.typeOptionTextActive,
                  !isPhase1 && { color: Palette.textDisabled },
                ]} numberOfLines={1}>{t.label}</Text>
                {!isPhase1 && <Text style={styles.comingSoonBadge}>เร็วๆ นี้</Text>}
                {isPhase1 && !isSelected && <Text style={styles.readyBadge}>พร้อมใช้งาน</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ชื่อ & รายละเอียด */}
        <Text style={styles.formLabel}>ชื่อโปรโมชั่น *</Text>
        <TextInput
          style={styles.formInput}
          value={name}
          onChangeText={setName}
          placeholder="เช่น ราคาสมาชิก น้ำดื่ม"
          placeholderTextColor={Palette.textDisabled}
        />

        <Text style={styles.formLabel}>รายละเอียด</Text>
        <TextInput
          style={[styles.formInput, { height: 80 }]}
          value={description}
          onChangeText={setDescription}
          placeholder="อธิบายโปรโมชั่น..."
          placeholderTextColor={Palette.textDisabled}
          multiline
        />

        {/* วันที่ */}
        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={styles.formLabel}>วันเริ่ม *</Text>
            <TextInput
              style={styles.formInput}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2024-01-01"
              placeholderTextColor={Palette.textDisabled}
            />
          </View>
          <View style={styles.formCol}>
            <Text style={styles.formLabel}>วันสิ้นสุด *</Text>
            <TextInput
              style={styles.formInput}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="2024-12-31"
              placeholderTextColor={Palette.textDisabled}
            />
          </View>
        </View>

        {/* Dynamic fields based on type */}
        {selectedType === 'member_price' && (
          <View>
            <Text style={styles.formLabel}>สินค้าที่ใช้ได้</Text>
            <TextInput style={styles.formInput} placeholder="รหัสสินค้า (คั่นด้วย ,)" placeholderTextColor={Palette.textDisabled} />
            <Text style={styles.formLabel}>ส่วนลด (บาท)</Text>
            <TextInput style={styles.formInput} placeholder="เช่น 3" placeholderTextColor={Palette.textDisabled} keyboardType="numeric" />
          </View>
        )}
        {selectedType === 'level_discount' && (
          <View>
            <Text style={styles.formLabel}>ระดับ & เปอร์เซ็นต์ส่วนลด</Text>
            <TextInput style={styles.formInput} placeholder="Silver: 3%, Gold: 5%, Platinum: 10%, VIP: 15%" placeholderTextColor={Palette.textDisabled} />
          </View>
        )}
        {selectedType === 'birthday' && (
          <View>
            <Text style={styles.formLabel}>ส่วนลด (%)</Text>
            <TextInput style={styles.formInput} placeholder="เช่น 20" placeholderTextColor={Palette.textDisabled} keyboardType="numeric" />
            <Text style={styles.formLabel}>ส่วนลดสูงสุด (บาท)</Text>
            <TextInput style={styles.formInput} placeholder="เช่น 500" placeholderTextColor={Palette.textDisabled} keyboardType="numeric" />
          </View>
        )}
        {selectedType === 'welcome' && (
          <View>
            <Text style={styles.formLabel}>แต้มที่ได้รับ</Text>
            <TextInput style={styles.formInput} placeholder="เช่น 100" placeholderTextColor={Palette.textDisabled} keyboardType="numeric" />
            <Text style={styles.formLabel}>คูปอง (บาท)</Text>
            <TextInput style={styles.formInput} placeholder="เช่น 50" placeholderTextColor={Palette.textDisabled} keyboardType="numeric" />
          </View>
        )}
        {selectedType === 'bonus_points' && (
          <View>
            <Text style={styles.formLabel}>ตัวคูณแต้ม (x)</Text>
            <TextInput style={styles.formInput} placeholder="เช่น 3" placeholderTextColor={Palette.textDisabled} keyboardType="numeric" />
            <Text style={styles.formLabel}>หมวดสินค้า</Text>
            <TextInput style={styles.formInput} placeholder="เช่น coffee, bakery" placeholderTextColor={Palette.textDisabled} />
          </View>
        )}
        {selectedType === 'stamp' && (
          <View>
            <Text style={styles.formLabel}>เป้าหมายแสตมป์ (ดวง)</Text>
            <TextInput style={styles.formInput} placeholder="เช่น 10" placeholderTextColor={Palette.textDisabled} keyboardType="numeric" />
            <Text style={styles.formLabel}>ทุกกี่บาทได้ 1 แสตมป์</Text>
            <TextInput style={styles.formInput} placeholder="เช่น 100" placeholderTextColor={Palette.textDisabled} keyboardType="numeric" />
          </View>
        )}
        {(selectedType === 'points_to_discount' || selectedType === 'points_to_product') && (
          <View>
            <Text style={styles.formLabel}>แต้มที่ใช้แลก</Text>
            <TextInput style={styles.formInput} placeholder="เช่น 100, 500, 1000" placeholderTextColor={Palette.textDisabled} />
            <Text style={styles.formLabel}>มูลค่าที่ได้</Text>
            <TextInput style={styles.formInput} placeholder="เช่น 10, 60, 150" placeholderTextColor={Palette.textDisabled} />
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity style={styles.formSubmitBtn}>
          <Ionicons name="checkmark-circle" size={18} color="#fafafa" />
          <Text style={styles.formSubmitText}>บันทึกโปรโมชั่น</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const MemberPromotionScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryKey | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<MemberPromoStatus | 'all'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Filter promotions
  const filteredPromos = useMemo(() => {
    let list = [...MOCK_MEMBER_PROMOTIONS];
    if (activeCategory !== 'all') {
      const cat = CATEGORIES.find(c => c.key === activeCategory);
      if (cat) list = list.filter(p => cat.types.includes(p.type));
    }
    if (statusFilter !== 'all') {
      list = list.filter(p => p.status === statusFilter);
    }
    return list;
  }, [activeCategory, statusFilter]);

  // KPI calculations
  const totalPromos = MOCK_MEMBER_PROMOTIONS.length;
  const activePromos = MOCK_MEMBER_PROMOTIONS.filter(p => p.status === 'active').length;
  const totalUsage = MOCK_MEMBER_PROMOTIONS.reduce((sum, p) => sum + p.usageCount, 0);
  const totalReward = MOCK_MEMBER_PROMOTIONS.reduce((sum, p) => sum + p.totalRewardGiven, 0);

  const statusFilters: { key: MemberPromoStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'active', label: 'Active' },
    { key: 'paused', label: 'หยุดชั่วคราว' },
    { key: 'expired', label: 'หมดอายุ' },
    { key: 'draft', label: 'แบบร่าง' },
  ];

  return (
    <View style={styles.container}>
      {/* Left Category Sidebar */}
      <View style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>หมวดโปรโมชั่น</Text>

        <TouchableOpacity
          style={[styles.catItem, activeCategory === 'all' && styles.catItemActive]}
          onPress={() => setActiveCategory('all')}
        >
          <Ionicons name="apps-outline" size={16} color={activeCategory === 'all' ? Palette.primary : Palette.grayMedium} />
          <Text style={[styles.catLabel, activeCategory === 'all' && styles.catLabelActive]}>ทั้งหมด</Text>
          <Text style={styles.catCount}>{totalPromos}</Text>
        </TouchableOpacity>

        {CATEGORIES.map(cat => {
          const count = MOCK_MEMBER_PROMOTIONS.filter(p => cat.types.includes(p.type)).length;
          const isActive = activeCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.catItem, isActive && styles.catItemActive]}
              onPress={() => setActiveCategory(cat.key)}
            >
              <Ionicons name={cat.icon as any} size={16} color={isActive ? Palette.primary : Palette.grayMedium} />
              <Text style={[styles.catLabel, isActive && styles.catLabelActive]}>{cat.label}</Text>
              {count > 0 && <Text style={styles.catCount}>{count}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Right Content */}
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentInner}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.pageTitle}>โปรโมชั่นสมาชิก</Text>
              <Text style={styles.pageSubtitle}>จัดการโปรโมชั่นเฉพาะสมาชิก 18 ประเภท</Text>
            </View>
            <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateForm(true)}>
              <Ionicons name="add-circle" size={18} color="#fafafa" />
              <Text style={styles.createBtnText}>สร้างโปรโมชั่น</Text>
            </TouchableOpacity>
          </View>

          {/* KPI Row */}
          <View style={styles.kpiRow}>
            <KPICard label="โปรทั้งหมด" value={totalPromos} color={Palette.primary} icon="layers-outline" />
            <KPICard label="Active" value={activePromos} color={Palette.success} icon="checkmark-circle-outline" />
            <KPICard label="ใช้แล้ว (ครั้ง)" value={totalUsage} color={Palette.info} icon="people-outline" />
            <KPICard label="ส่วนลดรวม (฿)" value={totalReward} color={Palette.purple} icon="cash-outline" />
          </View>

          {/* Status Filter */}
          <View style={styles.filterRow}>
            {statusFilters.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, statusFilter === f.key && styles.filterChipActive]}
                onPress={() => setStatusFilter(f.key)}
              >
                <Text style={[styles.filterChipText, statusFilter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Promotion Cards Grid */}
          <View style={styles.promoGrid}>
            {filteredPromos.map(promo => (
              <View key={promo.id} style={styles.promoCard}>
                {/* Card Header */}
                <View style={styles.promoCardHeader}>
                  <View style={styles.promoTypeWrap}>
                    <View style={[styles.promoIconBg, { backgroundColor: Palette.primaryLight }]}>
                      <Ionicons name={getTypeIcon(promo.type) as any} size={16} color={Palette.primary} />
                    </View>
                    <View style={styles.promoTypeBadge}>
                      <Text style={styles.promoTypeBadgeText}>{getTypeLabel(promo.type)}</Text>
                    </View>
                  </View>
                  <StatusBadge status={promo.status} />
                </View>

                {/* Card Body */}
                <Text style={styles.promoName}>{promo.name}</Text>
                <Text style={styles.promoDesc} numberOfLines={2}>{promo.description}</Text>

                {/* Rewards */}
                <View style={styles.rewardRow}>
                  <Ionicons name="gift-outline" size={14} color={Palette.success} />
                  <Text style={styles.rewardText}>{formatRewards(promo)}</Text>
                </View>

                {/* Date */}
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={13} color={Palette.grayMedium} />
                  <Text style={styles.dateText}>{promo.startDate} ~ {promo.endDate}</Text>
                </View>

                {/* Stats & Toggle */}
                <View style={styles.promoCardFooter}>
                  <View style={styles.statRow}>
                    <Text style={styles.statText}>ใช้ {promo.usageCount} ครั้ง</Text>
                    <Text style={styles.statDivider}>|</Text>
                    <Text style={styles.statText}>฿{promo.totalRewardGiven.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      promo.status === 'active' ? styles.toggleBtnActive : styles.toggleBtnPaused,
                    ]}
                  >
                    <Ionicons
                      name={promo.status === 'active' ? 'pause' : 'play'}
                      size={14}
                      color={promo.status === 'active' ? Palette.warning : Palette.success}
                    />
                    <Text style={[
                      styles.toggleBtnText,
                      { color: promo.status === 'active' ? Palette.warning : Palette.success },
                    ]}>
                      {promo.status === 'active' ? 'หยุด' : 'เปิด'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {filteredPromos.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={Palette.textDisabled} />
                <Text style={styles.emptyText}>ไม่พบโปรโมชั่นในหมวดนี้</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Create Form Panel (Overlay) */}
      {showCreateForm && <CreatePromoForm onClose={() => setShowCreateForm(false)} />}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, any> = {
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Palette.contentBg,
  },

  // ── Sidebar ──
  sidebar: {
    width: 180,
    backgroundColor: Palette.white,
    borderRightWidth: 1,
    borderRightColor: Palette.border,
    paddingTop: 20,
    paddingHorizontal: 12,
  },
  sidebarTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.grayMedium,
    marginBottom: 12,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 2,
    gap: 8,
  },
  catItemActive: {
    backgroundColor: Palette.primaryLight,
  },
  catLabel: {
    flex: 1,
    fontSize: 13,
    color: Palette.text,
  },
  catLabelActive: {
    color: Palette.primary,
    fontWeight: '600',
  },
  catCount: {
    fontSize: 15,
    color: Palette.grayMedium,
    backgroundColor: Palette.gray100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },

  // ── Content ──
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 24,
  },

  // ── Header ──
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.text,
  },
  pageSubtitle: {
    fontSize: 13,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  createBtnText: {
    color: '#fafafa',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── KPI ──
  kpiRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Palette.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 19,
    fontWeight: '700',
    color: Palette.text,
  },
  kpiLabel: {
    fontSize: 15,
    color: Palette.textSecondary,
    marginTop: 4,
  },

  // ── Filters ──
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  filterChipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: Palette.text,
  },
  filterChipTextActive: {
    color: '#fafafa',
    fontWeight: '600',
  },

  // ── Promo Grid ──
  promoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  promoCard: {
    width: '48%' as any,
    backgroundColor: Palette.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  promoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  promoTypeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promoIconBg: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoTypeBadge: {
    backgroundColor: Palette.gray100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  promoTypeBadgeText: {
    fontSize: 15,
    color: Palette.textSecondary,
    fontWeight: '500',
  },

  // ── Card Body ──
  promoName: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.text,
    marginBottom: 4,
  },
  promoDesc: {
    fontSize: 15,
    color: Palette.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    backgroundColor: Palette.successLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  rewardText: {
    fontSize: 15,
    color: Palette.success,
    fontWeight: '500',
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 15,
    color: Palette.grayMedium,
  },

  // ── Card Footer ──
  promoCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Palette.cardBorder,
    paddingTop: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 15,
    color: Palette.textSecondary,
  },
  statDivider: {
    color: Palette.border,
    fontSize: 15,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  toggleBtnActive: {
    backgroundColor: Palette.warningLight,
  },
  toggleBtnPaused: {
    backgroundColor: Palette.successLight,
  },
  toggleBtnText: {
    fontSize: 15,
    fontWeight: '500',
  },

  // ── Badge ──
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // ── Empty State ──
  emptyState: {
    width: '100%' as any,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 13,
    color: Palette.textDisabled,
    marginTop: 12,
  },

  // ── Form Panel ──
  formPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 420,
    backgroundColor: Palette.white,
    borderLeftWidth: 1,
    borderLeftColor: Palette.border,
    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
    zIndex: 100,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.text,
  },
  formCloseBtn: {
    padding: 4,
  },
  formBody: {
    flex: 1,
    padding: 20,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.text,
    marginBottom: 6,
    marginTop: 14,
  },
  formInput: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Palette.text,
    backgroundColor: Palette.gray50,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formCol: {
    flex: 1,
  },

  // ── Type Grid ──
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.gray50,
    width: '48%' as any,
  },
  typeOptionActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  typeOptionDisabled: {
    opacity: 0.5,
  },
  typeOptionText: {
    fontSize: 15,
    color: Palette.text,
    flex: 1,
  },
  typeOptionTextActive: {
    color: '#fafafa',
    fontWeight: '600',
  },
  comingSoonBadge: {
    fontSize: 14,
    color: Palette.warning,
    backgroundColor: Palette.warningLight,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  readyBadge: {
    fontSize: 14,
    color: Palette.success,
    backgroundColor: Palette.successLight,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },

  // ── Submit ──
  formSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 40,
    gap: 8,
  },
  formSubmitText: {
    color: '#fafafa',
    fontSize: 13,
    fontWeight: '600',
  },
};
