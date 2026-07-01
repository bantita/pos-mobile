/**
 * PromoListScreen — รายการโปรโมชั่นหมวดร้านค้า
 * M07 Promotion Engine
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Promotion, PromoStatus, PromoType } from '../../types/promotion';
import { usePromoStore } from '../../store/promoStore';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface Props {
  onNavigate: (screen: string) => void;
  onBack?: () => void;
}

type FilterTab = 'all' | 'active' | 'expired' | 'disabled';

const PROMO_TYPE_CONFIG: Record<PromoType, { icon: string; color: string; bgColor: string; label: string }> = {
  percent:      { icon: 'pricetag-outline',       color: Colors.primary,    bgColor: Colors.primaryLight,  label: 'ส่วนลด %' },
  fixed:        { icon: 'cash-outline',           color: Colors.success,    bgColor: Colors.successLight,  label: 'ส่วนลดเงิน' },
  coupon:       { icon: 'ticket-outline',         color: Colors.category1,  bgColor: Colors.primaryLight,  label: 'คูปอง' },
  member_price: { icon: 'people-outline',         color: Colors.accentDark, bgColor: Colors.accentLight,   label: 'ราคาสมาชิก' },
  buy_x_get_y:  { icon: 'gift-outline',           color: Colors.warning,    bgColor: Colors.warningLight,  label: 'ซื้อ X แถม Y' },
  mix_match:    { icon: 'layers-outline',         color: Colors.gray600,    bgColor: Colors.gray100,       label: 'Mix & Match' },
  happy_hour:   { icon: 'time-outline',           color: Colors.danger,     bgColor: Colors.dangerLight,   label: 'Happy Hour' },
};

/** Promo types available for creation in the Store category (excludes member_price) */
const STORE_PROMO_TYPES: { key: string; type: PromoType; route: string }[] = [
  { key: '1', type: 'percent',     route: 'PercentDiscount' },
  { key: '2', type: 'fixed',       route: 'FixedDiscount' },
  { key: '3', type: 'coupon',      route: 'Coupon' },
  { key: '4', type: 'buy_x_get_y', route: 'BuyXGetY' },
  { key: '5', type: 'mix_match',   route: 'MixMatch' },
  { key: '6', type: 'happy_hour',  route: 'HappyHour' },
];

const STATUS_CONFIG: Record<PromoStatus, { label: string; color: string; bgColor: string }> = {
  draft:    { label: 'แบบร่าง', color: Colors.gray600,  bgColor: Colors.gray200 },
  active:   { label: 'Active',  color: Colors.success,  bgColor: Colors.successLight },
  expired:  { label: 'Expired', color: Colors.warning,  bgColor: Colors.warningLight },
  disabled: { label: 'Disabled', color: Colors.danger,  bgColor: Colors.dangerLight },
};

export const PromoListScreen: React.FC<Props> = ({ onNavigate, onBack }) => {
  const { promotions } = usePromoStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [showTypeModal, setShowTypeModal] = useState(false);

  // Filter out member_price — those belong to the Member category now
  const storePromotions = useMemo(() => {
    return promotions.filter((p) => p.type !== 'member_price');
  }, [promotions]);

  const filtered = useMemo(() => {
    return storePromotions.filter((p) => {
      const matchSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.promoCode.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || p.status === filter;
      return matchSearch && matchFilter;
    });
  }, [storePromotions, search, filter]);

  const counts = {
    all: storePromotions.length,
    active: storePromotions.filter(p => p.status === 'active').length,
    expired: storePromotions.filter(p => p.status === 'expired').length,
    disabled: storePromotions.filter(p => p.status === 'disabled').length,
  };

  const FILTERS: { key: FilterTab; label: string; count: number; color: string }[] = [
    { key: 'all',      label: 'ทั้งหมด',  count: counts.all,      color: Colors.text },
    { key: 'active',   label: 'Active',   count: counts.active,   color: Colors.success },
    { key: 'expired',  label: 'Expired',  count: counts.expired,  color: Colors.warning },
    { key: 'disabled', label: 'Disabled', count: counts.disabled, color: Colors.danger },
  ];

  const handleCreatePromo = (route: string) => {
    setShowTypeModal(false);
    onNavigate(route);
  };

  const renderPromo = ({ item }: { item: Promotion }) => {
    const typeCfg = PROMO_TYPE_CONFIG[item.type];
    const statusCfg = STATUS_CONFIG[item.status];

    return (
      <View style={styles.promoCard}>
        {/* Top row */}
        <View style={styles.promoTop}>
          <View style={[styles.promoIcon, { backgroundColor: typeCfg.bgColor }]}>
            <Ionicons name={typeCfg.icon as any} size={20} color={typeCfg.color} />
          </View>
          <View style={styles.promoInfo}>
            <Text style={styles.promoName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.promoCode}>{item.promoCode}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bgColor }]}>
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.promoDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{item.startDate} ~ {item.endDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="stats-chart-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.detailText}>ใช้ไป {item.usageCount} ครั้ง</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.promoFooter}>
          <View style={[styles.typeTag, { backgroundColor: typeCfg.bgColor }]}>
            <Text style={[styles.typeTagText, { color: typeCfg.color }]}>{typeCfg.label}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="pricetag-outline" size={56} color={Colors.gray300} />
      <Text style={styles.emptyTitle}>ไม่พบโปรโมชั่น</Text>
      <Text style={styles.emptySubtitle}>
        {search || filter !== 'all'
          ? 'ลองเปลี่ยนตัวกรองหรือคำค้นหา'
          : 'กดปุ่มด้านล่างเพื่อสร้างโปรโมชั่นใหม่'}
      </Text>
      <TouchableOpacity
        style={styles.emptyCreateBtn}
        onPress={() => setShowTypeModal(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
        <Text style={styles.emptyCreateBtnText}>สร้างโปรโมชั่น</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color={Colors.white} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>โปรโมชั่นร้านค้า</Text>
            <Text style={styles.headerSub}>Store Promotions</Text>
          </View>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterBar}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterItem, filter === f.key && { borderBottomColor: f.color, borderBottomWidth: 2.5 }]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterCount, { color: f.color }]}>{f.count}</Text>
            <Text style={styles.filterLabel}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาชื่อหรือรหัสโปรโมชั่น..."
            placeholderTextColor={Colors.gray400}
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        renderItem={renderPromo}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* FAB — opens type selection modal */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowTypeModal(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={22} color={Colors.white} />
        <Text style={styles.fabText}>สร้างโปรโมชั่น</Text>
      </TouchableOpacity>

      {/* Type Selection Modal */}
      <Modal
        visible={showTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowTypeModal(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>เลือกประเภทโปรโมชั่น</Text>
            <View style={styles.typeGrid}>
              {STORE_PROMO_TYPES.map((item) => {
                const cfg = PROMO_TYPE_CONFIG[item.type];
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.typeOption}
                    onPress={() => handleCreatePromo(item.route)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.typeOptionIcon, { backgroundColor: cfg.bgColor }]}>
                      <Ionicons name={cfg.icon as any} size={24} color={cfg.color} />
                    </View>
                    <Text style={styles.typeOptionLabel}>{cfg.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowTypeModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>ยกเลิก</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  headerTitle: { ...Typography.h3, color: Colors.white },
  headerSub: { ...Typography.body2, color: 'rgba(255,255,255,0.7)' },
  filterBar: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterCount: { fontSize: FontSize.titleLg, fontWeight: '800' },
  filterLabel: { ...Typography.caption, color: Colors.textSecondary },
  searchRow: { padding: Spacing.md, paddingBottom: Spacing.xs },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.white, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, height: 44, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, ...Typography.body2, color: Colors.text },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100, gap: Spacing.md },
  promoCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  promoTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  promoIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  promoInfo: { flex: 1 },
  promoName: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  promoCode: { ...Typography.caption, color: Colors.textSecondary },
  statusBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  promoDetails: { gap: 3 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { ...Typography.caption, color: Colors.text },
  promoFooter: { flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.border },
  typeTag: { borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  typeTagText: { fontSize: FontSize.xs, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: Spacing.md },
  emptyTitle: { ...Typography.h3, color: Colors.gray400 },
  emptySubtitle: { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl },
  emptyCreateBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, marginTop: Spacing.sm },
  emptyCreateBtnText: { ...Typography.button, color: Colors.white, fontSize: FontSize.bodyLg },
  fab: { position: 'absolute', bottom: Spacing.lg, right: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  fabText: { ...Typography.button, color: Colors.white, fontSize: FontSize.bodyLg },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, paddingTop: Spacing.md },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.gray300, alignSelf: 'center', marginBottom: Spacing.md },
  modalTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.lg, textAlign: 'center' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'space-between' },
  typeOption: { width: '30%', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm },
  typeOptionIcon: { width: 56, height: 56, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  typeOptionLabel: { ...Typography.caption, color: Colors.text, fontWeight: '600', textAlign: 'center' },
  modalCancelBtn: { marginTop: Spacing.lg, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.gray100 },
  modalCancelText: { ...Typography.button, color: Colors.textSecondary },
});
