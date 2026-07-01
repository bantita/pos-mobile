/**
 * PRScreen — ใบขอซื้อ (Purchase Requisition)
 * M08 Supplier & Purchase
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePurchaseStore } from '../../store/purchaseStore';
import { PurchaseRequisition, PRStatus } from '../../types/purchase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface Props {
  onBack?: () => void;
}

type TabFilter = 'all' | 'draft' | 'approved';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'แบบร่าง', color: Colors.gray600, bg: Colors.gray200 },
  submitted: { label: 'ส่งแล้ว', color: Colors.warning, bg: Colors.warningLight },
  approved: { label: 'อนุมัติ', color: Colors.success, bg: Colors.successLight },
  rejected: { label: 'ปฏิเสธ', color: Colors.danger, bg: Colors.dangerLight },
  converted: { label: 'แปลงแล้ว', color: Colors.accentDark, bg: Colors.accentLight },
};

export const PRScreen: React.FC<Props> = ({ onBack }) => {
  const { requisitions } = usePurchaseStore();
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  const filtered = useMemo(() => {
    if (activeTab === 'all') return requisitions;
    return requisitions.filter((pr) => pr.status === activeTab);
  }, [requisitions, activeTab]);

  const handleCreate = () => {
    Alert.alert('สร้าง PR', 'ฟีเจอร์สร้างใบขอซื้อจะพร้อมใช้งานเร็วๆ นี้', [{ text: 'ตกลง' }]);
  };

  const handleTapPR = (pr: PurchaseRequisition) => {
    const itemsList = pr.items.map((i) => `• ${i.productName} x${i.requestQty} ${i.unit}`).join('\n');
    Alert.alert(
      pr.prNo,
      `สถานะ: ${STATUS_CONFIG[pr.status]?.label ?? pr.status}\nเหตุผล: ${pr.reason}\nผู้ขอ: ${pr.requestedBy}\n\nรายการ:\n${itemsList}`,
      [{ text: 'ปิด' }]
    );
  };

  const renderPR = ({ item: pr }: { item: PurchaseRequisition }) => {
    const cfg = STATUS_CONFIG[pr.status] ?? STATUS_CONFIG.draft;
    const date = new Date(pr.requestedAt).toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', year: '2-digit',
    });

    return (
      <TouchableOpacity style={styles.card} onPress={() => handleTapPR(pr)} activeOpacity={0.8}>
        <View style={styles.cardTop}>
          <View style={styles.iconWrap}>
            <Ionicons name="document-text-outline" size={22} color={Colors.warning} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.docNo}>{pr.prNo}</Text>
            <Text style={styles.docDate}>{date}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="chatbubble-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>{pr.reason}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{pr.requestedBy}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.stat}>
            <Ionicons name="list-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.statText}>{pr.items.length} รายการ</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'draft', label: 'Draft' },
    { key: 'approved', label: 'Approved' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>ใบขอซื้อ (PR)</Text>
          <Text style={styles.headerSub}>Purchase Requisition · {requisitions.length} รายการ</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
          <Ionicons name="add" size={18} color={Colors.white} />
          <Text style={styles.createBtnText}>สร้าง PR</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(pr) => pr.id}
        renderItem={renderPR}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={56} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>ไม่มีใบขอซื้อ</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.warning, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.75)' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  createBtnText: { ...Typography.label, color: Colors.white },
  tabBar: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.sm,
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.warning },
  tabText: { ...Typography.label, color: Colors.textSecondary },
  tabTextActive: { color: Colors.warning, fontWeight: '700' },
  list: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.sm,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconWrap: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: Colors.warningLight, alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  docNo: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  docDate: { ...Typography.caption, color: Colors.textSecondary },
  badge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardDetails: { gap: 3, paddingLeft: 56 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { ...Typography.caption, color: Colors.text },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.xs,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { ...Typography.caption, color: Colors.textSecondary },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: Spacing.lg },
  emptyTitle: { ...Typography.h3, color: Colors.gray400 },
});
