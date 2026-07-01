/**
 * POScreen — ใบสั่งซื้อ (Purchase Order)
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
import { PurchaseOrder, POStatus } from '../../types/purchase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface Props {
  onBack?: () => void;
}

type TabFilter = 'draft' | 'approved' | 'partial_receive' | 'completed';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'แบบร่าง', color: Colors.gray600, bg: Colors.gray200 },
  approved: { label: 'อนุมัติ', color: Colors.success, bg: Colors.successLight },
  partial_receive: { label: 'รับบางส่วน', color: Colors.warning, bg: Colors.warningLight },
  completed: { label: 'เสร็จสิ้น', color: Colors.accentDark, bg: Colors.accentLight },
  cancelled: { label: 'ยกเลิก', color: Colors.danger, bg: Colors.dangerLight },
};

const formatCurrency = (n: number) =>
  n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const POScreen: React.FC<Props> = ({ onBack }) => {
  const { purchaseOrders } = usePurchaseStore();
  const [activeTab, setActiveTab] = useState<TabFilter>('approved');

  const filtered = useMemo(() => {
    return purchaseOrders.filter((po) => po.status === activeTab);
  }, [purchaseOrders, activeTab]);

  const handleCreate = () => {
    Alert.alert('สร้าง PO', 'ฟีเจอร์สร้างใบสั่งซื้อจะพร้อมใช้งานเร็วๆ นี้', [{ text: 'ตกลง' }]);
  };

  const handleTapPO = (po: PurchaseOrder) => {
    const itemsList = po.items
      .map((i) => `• ${i.productName} x${i.orderQty} ${i.unit} (รับแล้ว ${i.receivedQty})`)
      .join('\n');
    Alert.alert(
      po.poNo,
      `Supplier: ${po.supplierName}\nสถานะ: ${STATUS_CONFIG[po.status]?.label ?? po.status}\nยอดรวม: ฿${formatCurrency(po.grandTotal)}\nกำหนดส่ง: ${po.deliveryDate}\n\nรายการ:\n${itemsList}`,
      [{ text: 'ปิด' }]
    );
  };

  const renderPO = ({ item: po }: { item: PurchaseOrder }) => {
    const cfg = STATUS_CONFIG[po.status] ?? STATUS_CONFIG.draft;
    const date = po.deliveryDate
      ? new Date(po.deliveryDate).toLocaleDateString('th-TH', {
          day: 'numeric', month: 'short', year: '2-digit',
        })
      : '-';

    return (
      <TouchableOpacity style={styles.card} onPress={() => handleTapPO(po)} activeOpacity={0.8}>
        <View style={styles.cardTop}>
          <View style={styles.iconWrap}>
            <Ionicons name="cart-outline" size={22} color={Colors.success} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.docNo}>{po.poNo}</Text>
            <Text style={styles.supplierName} numberOfLines={1}>{po.supplierName}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={13} color={Colors.primary} />
            <Text style={[styles.detailText, { color: Colors.primary, fontWeight: '700' }]}>
              ฿{formatCurrency(po.grandTotal)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.detailText}>กำหนดส่ง: {date}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.stat}>
            <Ionicons name="list-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.statText}>{po.items.length} รายการ</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="cube-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.statText}>
              {po.items.reduce((sum, i) => sum + i.receivedQty, 0)}/{po.items.reduce((sum, i) => sum + i.orderQty, 0)} หน่วย
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'draft', label: 'Draft' },
    { key: 'approved', label: 'Approved' },
    { key: 'partial_receive', label: 'Partial' },
    { key: 'completed', label: 'Completed' },
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
          <Text style={styles.headerTitle}>ใบสั่งซื้อ (PO)</Text>
          <Text style={styles.headerSub}>Purchase Order · {purchaseOrders.length} รายการ</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
          <Ionicons name="add" size={18} color={Colors.white} />
          <Text style={styles.createBtnText}>สร้าง PO</Text>
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
        keyExtractor={(po) => po.id}
        renderItem={renderPO}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={56} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>ไม่มีใบสั่งซื้อในสถานะนี้</Text>
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
    backgroundColor: Colors.success, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
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
  tabActive: { borderBottomColor: Colors.success },
  tabText: { ...Typography.label, color: Colors.textSecondary, fontSize: 12 },
  tabTextActive: { color: Colors.success, fontWeight: '700' },
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
    backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  docNo: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  supplierName: { ...Typography.caption, color: Colors.textSecondary },
  badge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardDetails: { gap: 3, paddingLeft: 56 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { ...Typography.caption, color: Colors.text },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    paddingTop: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { ...Typography.caption, color: Colors.textSecondary },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: Spacing.lg },
  emptyTitle: { ...Typography.h3, color: Colors.gray400 },
});
