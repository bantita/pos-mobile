/**
 * SCR-DASH-003 — Sync Status Screen
 * FR-DASH-003: ดูสถานะการ Sync และ Retry
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SyncQueueItem, SyncItemStatus, SyncItemType } from '../../types/dashboard';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatDateTime } from '../../utils/format';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_QUEUE: SyncQueueItem[] = [
  { id: '1', type: 'sale', documentNo: 'INV00125', description: 'ขายสินค้า 3 รายการ', status: 'failed', createdAt: new Date(Date.now() - 5 * 60000), retryCount: 2, errorMessage: 'Connection timeout' },
  { id: '2', type: 'sale', documentNo: 'INV00124', description: 'ขายสินค้า 5 รายการ', status: 'pending', createdAt: new Date(Date.now() - 10 * 60000), retryCount: 0 },
  { id: '3', type: 'stock', documentNo: 'RCV00012', description: 'รับสินค้า 2 รายการ', status: 'pending', createdAt: new Date(Date.now() - 15 * 60000), retryCount: 0 },
  { id: '4', type: 'payment', documentNo: 'PAY00088', description: 'ชำระเงิน QR Code', status: 'success', createdAt: new Date(Date.now() - 20 * 60000), retryCount: 1 },
  { id: '5', type: 'product', documentNo: 'PRD00045', description: 'อัปเดตราคาสินค้า', status: 'success', createdAt: new Date(Date.now() - 30 * 60000), retryCount: 0 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<SyncItemStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  pending:  { label: 'รอ Sync',  color: Colors.warning, bgColor: Colors.warningLight, icon: 'time-outline' },
  syncing:  { label: 'กำลัง Sync', color: Colors.primary, bgColor: Colors.primaryLight, icon: 'sync-outline' },
  success:  { label: 'สำเร็จ',   color: Colors.success, bgColor: Colors.successLight, icon: 'checkmark-circle-outline' },
  failed:   { label: 'ล้มเหลว',  color: Colors.danger,  bgColor: Colors.dangerLight,  icon: 'close-circle-outline' },
};

const TYPE_CONFIG: Record<SyncItemType, { label: string; icon: string; color: string }> = {
  sale:     { label: 'ขายสินค้า', icon: 'cart-outline',     color: Colors.primary },
  stock:    { label: 'สต๊อก',    icon: 'archive-outline',   color: Colors.success },
  product:  { label: 'สินค้า',   icon: 'cube-outline',      color: Colors.category1 },
  payment:  { label: 'ชำระเงิน', icon: 'card-outline',      color: Colors.warning },
};

// ─── Main Component ───────────────────────────────────────────────────────────
interface SyncStatusScreenProps {
  onBack: () => void;
  canRetry?: boolean;
}

export const SyncStatusScreen: React.FC<SyncStatusScreenProps> = ({
  onBack,
  canRetry = true,
}) => {
  const [queue, setQueue] = useState<SyncQueueItem[]>(MOCK_QUEUE);
  const [retrying, setRetrying] = useState(false);
  const [filter, setFilter] = useState<SyncItemStatus | 'all'>('all');

  const counts = {
    pending: queue.filter((q) => q.status === 'pending').length,
    failed:  queue.filter((q) => q.status === 'failed').length,
    success: queue.filter((q) => q.status === 'success').length,
  };

  const filtered = filter === 'all' ? queue : queue.filter((q) => q.status === filter);

  const handleRetryAll = () => {
    Alert.alert('Retry ทั้งหมด', `จะลอง Sync ${counts.failed} รายการที่ล้มเหลวอีกครั้ง`, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'Retry',
        onPress: () => {
          setRetrying(true);
          setTimeout(() => {
            setQueue((prev) =>
              prev.map((item) =>
                item.status === 'failed' ? { ...item, status: 'pending', retryCount: item.retryCount + 1, errorMessage: undefined } : item
              )
            );
            setRetrying(false);
          }, 1500);
        },
      },
    ]);
  };

  const handleRetryOne = (id: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'pending', retryCount: item.retryCount + 1, errorMessage: undefined } : item
      )
    );
  };

  const renderItem = ({ item }: { item: SyncQueueItem }) => {
    const st = STATUS_CONFIG[item.status];
    const tp = TYPE_CONFIG[item.type];
    return (
      <View style={styles.queueCard}>
        <View style={[styles.queueTypeIcon, { backgroundColor: tp.color + '18' }]}>
          <Ionicons name={tp.icon as any} size={20} color={tp.color} />
        </View>
        <View style={styles.queueInfo}>
          <View style={styles.queueTopRow}>
            <Text style={styles.queueDocNo}>{item.documentNo}</Text>
            <View style={[styles.statusBadge, { backgroundColor: st.bgColor }]}>
              <Ionicons name={st.icon as any} size={11} color={st.color} />
              <Text style={[styles.statusBadgeText, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>
          <Text style={styles.queueDesc}>{item.description}</Text>
          <Text style={styles.queueMeta}>
            {tp.label} · {formatDateTime(item.createdAt)}
            {item.retryCount > 0 ? ` · Retry ${item.retryCount}ครั้ง` : ''}
          </Text>
          {item.errorMessage && (
            <Text style={styles.queueError}>⚠ {item.errorMessage}</Text>
          )}
        </View>
        {item.status === 'failed' && canRetry && (
          <TouchableOpacity style={styles.retryOneBtn} onPress={() => handleRetryOne(item.id)}>
            <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>สถานะ Sync</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        {[
          { key: 'pending', label: 'รอ Sync', count: counts.pending, color: Colors.warning, bg: Colors.warningLight, icon: 'time-outline' },
          { key: 'failed',  label: 'ล้มเหลว', count: counts.failed,  color: Colors.danger,  bg: Colors.dangerLight,  icon: 'close-circle-outline' },
          { key: 'success', label: 'สำเร็จ',  count: counts.success, color: Colors.success, bg: Colors.successLight, icon: 'checkmark-circle-outline' },
        ].map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.summaryCard, filter === s.key && { borderColor: s.color, borderWidth: 2 }]}
            onPress={() => setFilter(filter === s.key ? 'all' : s.key as SyncItemStatus)}
            activeOpacity={0.8}
          >
            <View style={[styles.summaryIcon, { backgroundColor: s.bg }]}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
            </View>
            <Text style={[styles.summaryCount, { color: s.color }]}>{s.count}</Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'failed', 'success'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {{ all: 'ทั้งหมด', pending: 'รอ', failed: 'ล้มเหลว', success: 'สำเร็จ' }[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cloud-done-outline" size={56} color={Colors.gray300} />
            <Text style={styles.emptyText}>ไม่มีรายการ</Text>
          </View>
        }
      />

      {/* Retry All Button */}
      {counts.failed > 0 && canRetry && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.retryAllBtn, retrying && styles.retryAllBtnDisabled]}
            onPress={handleRetryAll}
            disabled={retrying}
            activeOpacity={0.85}
          >
            <Ionicons name={retrying ? 'hourglass-outline' : 'refresh-outline'} size={20} color={Colors.white} />
            <Text style={styles.retryAllText}>
              {retrying ? 'กำลัง Retry...' : `Retry ทั้งหมด (${counts.failed} รายการ)`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
  summaryCard: {
    flex: 1, alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
  },
  summaryIcon: {
    width: 40, height: 40, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryCount: { fontSize: 24, fontWeight: '800' },
  summaryLabel: { ...Typography.caption, color: Colors.textSecondary },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  filterTab: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full, backgroundColor: Colors.gray100,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterTabText: { ...Typography.caption, color: Colors.textSecondary },
  filterTabTextActive: { color: Colors.white, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 80, gap: Spacing.sm },
  queueCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 1,
  },
  queueTypeIcon: {
    width: 40, height: 40, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  queueInfo: { flex: 1, gap: 2 },
  queueTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  queueDocNo: { ...Typography.label, color: Colors.text },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  queueDesc: { ...Typography.body2, color: Colors.text },
  queueMeta: { ...Typography.caption, color: Colors.textSecondary },
  queueError: { ...Typography.caption, color: Colors.danger, marginTop: 2 },
  retryOneBtn: {
    width: 32, height: 32, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyText: { ...Typography.body1, color: Colors.gray400 },
  footer: {
    padding: Spacing.md, backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  retryAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md,
  },
  retryAllBtnDisabled: { backgroundColor: Colors.gray300 },
  retryAllText: { ...Typography.button, color: Colors.white },
});
