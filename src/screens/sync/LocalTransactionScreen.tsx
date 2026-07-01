/**
 * SCR-SYNC-001 — Local Transaction
 * FR-SYNC-001: บันทึกธุรกรรม Offline ลง SQLite และสร้าง SyncQueue
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSyncStore } from '../../store/syncStore';
import { LocalTransaction, SyncEntityType, SyncStatus, ENTITY_LABELS, ENTITY_ICONS } from '../../types/sync';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatDateTime } from '../../utils/format';

const STATUS_CFG: Record<SyncStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:  { label: 'รอ Sync',     color: Colors.warning,  bg: Colors.warningLight,  icon: 'time-outline' },
  syncing:  { label: 'กำลัง Sync', color: Colors.accent,   bg: Colors.accentLight,   icon: 'sync-outline' },
  success:  { label: 'สำเร็จ',      color: Colors.success,  bg: Colors.successLight,  icon: 'checkmark-circle-outline' },
  failed:   { label: 'ล้มเหลว',    color: Colors.danger,   bg: Colors.dangerLight,   icon: 'close-circle-outline' },
  conflict: { label: 'ขัดแย้ง',    color: Colors.primary,  bg: Colors.primaryLight,  icon: 'alert-circle-outline' },
};

interface Props { onBack: () => void; onOpenQueue: () => void }

export const LocalTransactionScreen: React.FC<Props> = ({ onBack, onOpenQueue }) => {
  const { transactions, isOnline, getStats } = useSyncStore();
  const stats = getStats();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<SyncStatus | 'all'>('all');

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = !search ||
        t.documentNo.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.createdBy.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [transactions, search, filterStatus]);

  const renderItem = ({ item }: { item: LocalTransaction }) => {
    const sc = STATUS_CFG[item.status];
    const entityIcon = ENTITY_ICONS[item.entityType];
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.entityIcon, { backgroundColor: Colors.accentLight }]}>
            <Ionicons name={entityIcon as any} size={20} color={Colors.accentDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.docNo}>{item.documentNo}</Text>
            <Text style={styles.desc} numberOfLines={1}>{item.description}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Ionicons name={sc.icon as any} size={11} color={sc.color} />
            <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="layers-outline" size={11} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{ENTITY_LABELS[item.entityType]}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={11} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{item.createdBy}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="phone-portrait-outline" size={11} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{item.deviceName}</Text>
          </View>
          <Text style={styles.metaTime}>{formatDateTime(item.createdAt)}</Text>
        </View>
        {item.syncAttempts > 0 && (
          <Text style={styles.attempts}>ลองซิงค์แล้ว {item.syncAttempts} ครั้ง</Text>
        )}
        {item.status === 'failed' && item.errorMessage && (
          <View style={styles.errorRow}>
            <Ionicons name="warning-outline" size={12} color={Colors.danger} />
            <Text style={styles.errorText} numberOfLines={2}>{item.errorMessage}</Text>
          </View>
        )}
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
          <Text style={styles.headerTitle}>Local Transactions</Text>
          <View style={styles.onlineRow}>
            <View style={[styles.onlineDot, { backgroundColor: isOnline ? Colors.success : Colors.danger }]} />
            <Text style={styles.onlineText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.queueBtn} onPress={onOpenQueue}>
          <Ionicons name="cloud-upload-outline" size={18} color={Colors.primary} />
          <Text style={styles.queueBtnText}>Queue</Text>
          {stats.pending + stats.failed > 0 && (
            <View style={styles.queueBadge}>
              <Text style={styles.queueBadgeText}>{stats.pending + stats.failed}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'รอ Sync', count: stats.pending,  color: Colors.warning },
          { label: 'ล้มเหลว', count: stats.failed,   color: Colors.danger },
          { label: 'ขัดแย้ง', count: stats.conflict, color: Colors.primary },
          { label: 'สำเร็จ',  count: stats.success,  color: Colors.success },
        ].map((s, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.statCard, filterStatus === (['all','pending','failed','conflict','success'][i+1]||'all') && styles.statCardActive]}
            onPress={() => setFilterStatus((['pending','failed','conflict','success'][i]) as SyncStatus)}
          >
            <Text style={[styles.statCount, { color: s.color }]}>{s.count}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาเอกสาร, ผู้สร้าง..."
            placeholderTextColor={Colors.textDisabled}
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        {filterStatus !== 'all' && (
          <TouchableOpacity style={styles.clearFilter} onPress={() => setFilterStatus('all')}>
            <Text style={styles.clearFilterText}>ล้าง</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={t => t.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-outline" size={56} color={Colors.border} />
            <Text style={styles.emptyText}>ไม่พบรายการ</Text>
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
    backgroundColor: Colors.secondary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.secondaryDark,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.text },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  onlineText: { ...Typography.caption, color: Colors.textSecondary },
  queueBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: Colors.primary, position: 'relative',
  },
  queueBtnText: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },
  queueBadge: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: Colors.danger, borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  queueBadgeText: { fontSize: FontSize.xxs, color: Colors.white, fontWeight: '800' },
  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm },
  statCardActive: { backgroundColor: Colors.primaryLight },
  statCount: { fontSize: FontSize.titleLg, fontWeight: '800' },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, fontSize: FontSize.xxs },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, height: 42, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, ...Typography.body2, color: Colors.text },
  clearFilter: { backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 6 },
  clearFilterText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  entityIcon: { width: 40, height: 40, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  docNo: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  desc: { ...Typography.caption, color: Colors.textSecondary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { ...Typography.caption, color: Colors.textSecondary },
  metaTime: { ...Typography.caption, color: Colors.textDisabled, marginLeft: 'auto' },
  attempts: { ...Typography.caption, color: Colors.textSecondary, fontStyle: 'italic' },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs, backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.sm, padding: Spacing.sm },
  errorText: { ...Typography.caption, color: Colors.danger, flex: 1 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyText: { ...Typography.body1, color: Colors.textSecondary },
});
