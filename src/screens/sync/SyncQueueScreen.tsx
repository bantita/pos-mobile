/**
 * SCR-SYNC-002 — Sync Queue
 * FR-SYNC-002: สถานะ Pending/Syncing/Success/Failed/Conflict + Retry Policy
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSyncStore } from '../../store/syncStore';
import { LocalTransaction, SyncStatus, ENTITY_LABELS, ENTITY_ICONS } from '../../types/sync';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatDateTime } from '../../utils/format';

const STATUS_CFG: Record<SyncStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:  { label: 'รอ',          color: Colors.warning,  bg: Colors.warningLight,  icon: 'time-outline' },
  syncing:  { label: 'กำลังซิงค์', color: Colors.accentDark, bg: Colors.accentLight, icon: 'sync-outline' },
  success:  { label: 'สำเร็จ',      color: Colors.success,  bg: Colors.successLight,  icon: 'checkmark-circle-outline' },
  failed:   { label: 'ล้มเหลว',    color: Colors.danger,   bg: Colors.dangerLight,   icon: 'close-circle-outline' },
  conflict: { label: 'ขัดแย้ง',    color: Colors.primary,  bg: Colors.primaryLight,  icon: 'alert-circle-outline' },
};

interface Props {
  onBack: () => void;
  onOpenConflict: (txId: string) => void;
}

type FilterTab = SyncStatus | 'all';

export const SyncQueueScreen: React.FC<Props> = ({ onBack, onOpenConflict }) => {
  const { transactions, isOnline, isSyncing, lastSyncAt, getStats, retryTransaction, retryAllFailed, startSync } = useSyncStore();
  const stats = getStats();
  const [filterTab, setFilterTab] = useState<FilterTab>('all');

  const filtered = filterTab === 'all'
    ? transactions
    : transactions.filter(t => t.status === filterTab);

  const failedCount = stats.failed;
  const conflictCount = stats.conflict;
  const actionNeeded = failedCount + conflictCount;

  const handleRetryAll = () => {
    Alert.alert('Retry ทั้งหมด', `จะลอง Sync ${failedCount} รายการที่ล้มเหลวอีกครั้ง`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'Retry', onPress: retryAllFailed },
    ]);
  };

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all',      label: 'ทั้งหมด', count: stats.total },
    { key: 'pending',  label: 'รอ',      count: stats.pending },
    { key: 'failed',   label: 'ล้มเหลว', count: stats.failed },
    { key: 'conflict', label: 'ขัดแย้ง', count: stats.conflict },
    { key: 'success',  label: 'สำเร็จ',  count: stats.success },
  ];

  const renderItem = ({ item }: { item: LocalTransaction }) => {
    const sc = STATUS_CFG[item.status];
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={[styles.entityIcon, { backgroundColor: Colors.accentLight }]}>
            <Ionicons name={ENTITY_ICONS[item.entityType] as any} size={18} color={Colors.accentDark} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.cardTopRow}>
              <Text style={styles.docNo}>{item.documentNo}</Text>
              <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                <Ionicons name={sc.icon as any} size={10} color={sc.color} />
                <Text style={[styles.badgeText, { color: sc.color }]}>{sc.label}</Text>
              </View>
            </View>
            <Text style={styles.desc} numberOfLines={1}>{item.description}</Text>
            <Text style={styles.meta}>
              {ENTITY_LABELS[item.entityType]} · {item.deviceName} · {formatDateTime(item.createdAt)}
            </Text>
            {item.status === 'failed' && item.errorMessage && (
              <Text style={styles.error} numberOfLines={1}>{item.errorMessage}</Text>
            )}
            {item.status === 'conflict' && item.conflictData && (
              <View style={styles.conflictHint}>
                <Ionicons name="alert-circle-outline" size={11} color={Colors.primary} />
                <Text style={styles.conflictHintText}>{item.conflictData.conflictType.replace(/_/g, ' ')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.cardActions}>
          {item.status === 'failed' && (
            <TouchableOpacity style={styles.retryBtn} onPress={() => retryTransaction(item.id)}>
              <Ionicons name="refresh-outline" size={13} color={Colors.warning} />
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          )}
          {item.status === 'conflict' && (
            <TouchableOpacity style={styles.resolveBtn} onPress={() => onOpenConflict(item.id)}>
              <Ionicons name="git-merge-outline" size={13} color={Colors.primary} />
              <Text style={styles.resolveBtnText}>แก้ขัดแย้ง</Text>
            </TouchableOpacity>
          )}
          {item.syncAttempts > 0 && (
            <Text style={styles.attemptsText}>ลอง {item.syncAttempts} ครั้ง</Text>
          )}
          {item.syncedAt && (
            <Text style={styles.syncedText}>Synced {formatDateTime(item.syncedAt)}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Sync Queue</Text>
          <Text style={styles.headerSub}>
            {lastSyncAt ? `ซิงค์ล่าสุด ${formatDateTime(lastSyncAt)}` : 'ยังไม่เคยซิงค์'}
          </Text>
        </View>
        {/* Online indicator */}
        <View style={[styles.onlineChip, { backgroundColor: isOnline ? Colors.successLight : Colors.dangerLight }]}>
          <View style={[styles.onlineDot, { backgroundColor: isOnline ? Colors.success : Colors.danger }]} />
          <Text style={[styles.onlineText, { color: isOnline ? Colors.success : Colors.danger }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Action Banner (ถ้ามี action ที่ต้องทำ) */}
      {actionNeeded > 0 && (
        <View style={styles.actionBanner}>
          <Ionicons name="warning-outline" size={16} color={Colors.warning} />
          <Text style={styles.actionBannerText}>
            มี {failedCount > 0 ? `${failedCount} รายการล้มเหลว` : ''}{failedCount > 0 && conflictCount > 0 ? ' และ ' : ''}{conflictCount > 0 ? `${conflictCount} ขัดแย้ง` : ''} ต้องดำเนินการ
          </Text>
          <View style={styles.actionBannerBtns}>
            {failedCount > 0 && (
              <TouchableOpacity style={styles.actionBannerBtn} onPress={handleRetryAll} disabled={isSyncing}>
                <Text style={styles.actionBannerBtnText}>{isSyncing ? 'กำลัง...' : `Retry ${failedCount}`}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Progress bar while syncing */}
      {isSyncing && (
        <View style={styles.syncingBar}>
          <Ionicons name="sync-outline" size={14} color={Colors.accentDark} />
          <Text style={styles.syncingText}>กำลัง Sync...</Text>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, filterTab === tab.key && styles.tabActive]}
            onPress={() => setFilterTab(tab.key)}
          >
            <Text style={[styles.tabText, filterTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabBadge, filterTab === tab.key && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, filterTab === tab.key && { color: Colors.primary }]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={t => t.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cloud-done-outline" size={56} color={Colors.border} />
            <Text style={styles.emptyTitle}>ไม่มีรายการ</Text>
          </View>
        }
      />

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.syncBtn, (!isOnline || isSyncing) && styles.syncBtnDisabled]}
          onPress={startSync}
          disabled={!isOnline || isSyncing}
        >
          <Ionicons name={isSyncing ? 'hourglass-outline' : 'cloud-upload-outline'} size={18} color={Colors.white} />
          <Text style={styles.syncBtnText}>{isSyncing ? 'กำลัง Sync...' : 'Force Sync ทันที'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.secondary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.secondaryDark,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.text },
  headerSub: { ...Typography.caption, color: Colors.textSecondary },
  onlineChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  onlineText: { fontSize: FontSize.caption, fontWeight: '700' },
  actionBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.warningLight, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.secondaryDark,
  },
  actionBannerText: { ...Typography.body2, color: Colors.warning, flex: 1 },
  actionBannerBtns: { flexDirection: 'row', gap: Spacing.xs },
  actionBannerBtn: { backgroundColor: Colors.warning, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  actionBannerBtnText: { fontSize: FontSize.caption, color: Colors.white, fontWeight: '700' },
  syncingBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.accentLight, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  syncingText: { ...Typography.body2, color: Colors.accentDark },
  progressBar: { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', width: '60%', backgroundColor: Colors.accentDark, borderRadius: 2 },
  tabRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: Spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { ...Typography.caption, color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  tabBadge: { backgroundColor: Colors.gray100, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  tabBadgeActive: { backgroundColor: Colors.primaryLight },
  tabBadgeText: { fontSize: FontSize.xxs, fontWeight: '700', color: Colors.textSecondary },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 80 },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  entityIcon: { width: 38, height: 38, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  docNo: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  badgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  desc: { ...Typography.caption, color: Colors.text },
  meta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  error: { ...Typography.caption, color: Colors.danger, marginTop: 2 },
  conflictHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  conflictHintText: { ...Typography.caption, color: Colors.primary, textTransform: 'capitalize' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.warningLight, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: Colors.warning },
  retryBtnText: { fontSize: FontSize.caption, color: Colors.warning, fontWeight: '700' },
  resolveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary },
  resolveBtnText: { fontSize: FontSize.caption, color: Colors.primary, fontWeight: '700' },
  attemptsText: { ...Typography.caption, color: Colors.textSecondary },
  syncedText: { ...Typography.caption, color: Colors.success, marginLeft: 'auto' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyTitle: { ...Typography.h3, color: Colors.textSecondary },
  footer: { padding: Spacing.md, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  syncBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md },
  syncBtnDisabled: { backgroundColor: Colors.gray300 },
  syncBtnText: { ...Typography.button, color: Colors.white },
});
