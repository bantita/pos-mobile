/**
 * SCR-SET-010 SyncMonitorScreen
 * Sync Monitor — ติดตามสถานะการซิงค์ข้อมูล
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatDateTime } from '../../utils/format';
import { usePermissionStore } from '../../store/permissionStore';

type SyncStatus = 'pending' | 'success' | 'failed' | 'conflict';
type SyncType = 'sale' | 'product' | 'inventory' | 'user' | 'settings';

interface SyncItem {
  id: string;
  type: SyncType;
  docNo: string;
  deviceName: string;
  timestamp: Date;
  status: SyncStatus;
  errorMessage?: string;
}

const now = new Date();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60000);

const MOCK_SYNC: SyncItem[] = [
  { id: 's_001', type: 'sale',      docNo: 'INV-20250101-0045', deviceName: 'POS-001', timestamp: minutesAgo(2),   status: 'success' },
  { id: 's_002', type: 'sale',      docNo: 'INV-20250101-0046', deviceName: 'POS-002', timestamp: minutesAgo(3),   status: 'pending' },
  { id: 's_003', type: 'inventory', docNo: 'RCV-20250101-003',  deviceName: 'POS-003', timestamp: minutesAgo(5),   status: 'failed',  errorMessage: 'Network timeout — ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' },
  { id: 's_004', type: 'product',   docNo: 'PRD-00042',         deviceName: 'POS-001', timestamp: minutesAgo(8),   status: 'conflict' },
  { id: 's_005', type: 'sale',      docNo: 'INV-20250101-0044', deviceName: 'POS-001', timestamp: minutesAgo(10),  status: 'success' },
  { id: 's_006', type: 'settings',  docNo: 'SET-CONFIG',        deviceName: 'POS-002', timestamp: minutesAgo(12),  status: 'failed',  errorMessage: 'Authentication error — Token หมดอายุ' },
  { id: 's_007', type: 'sale',      docNo: 'INV-20250101-0043', deviceName: 'POS-003', timestamp: minutesAgo(15),  status: 'success' },
  { id: 's_008', type: 'inventory', docNo: 'ADJ-20250101-002',  deviceName: 'POS-001', timestamp: minutesAgo(18),  status: 'pending' },
  { id: 's_009', type: 'product',   docNo: 'PRD-00015',         deviceName: 'POS-002', timestamp: minutesAgo(22),  status: 'conflict' },
  { id: 's_010', type: 'user',      docNo: 'USR-UPDATE',        deviceName: 'POS-001', timestamp: minutesAgo(30),  status: 'success' },
];

const TYPE_ICONS: Record<SyncType, string> = {
  sale: 'receipt-outline',
  product: 'cube-outline',
  inventory: 'archive-outline',
  user: 'person-outline',
  settings: 'settings-outline',
};

const TYPE_COLORS: Record<SyncType, string> = {
  sale: Colors.success,
  product: Colors.primary,
  inventory: Colors.warning,
  user: Colors.category1,
  settings: Colors.gray600,
};

const STATUS_CONFIG: Record<SyncStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:  { label: 'รอซิงค์',  color: Colors.warning,  bg: Colors.warningLight,  icon: 'time-outline' },
  success:  { label: 'สำเร็จ',   color: Colors.success,  bg: Colors.successLight,  icon: 'checkmark-circle-outline' },
  failed:   { label: 'ล้มเหลว', color: Colors.danger,   bg: Colors.dangerLight,   icon: 'close-circle-outline' },
  conflict: { label: 'ขัดแย้ง', color: Colors.category1,       bg: Colors.primaryLight,            icon: 'alert-circle-outline' },
};

interface SyncMonitorScreenProps {
  onBack: () => void;
}

export const SyncMonitorScreen: React.FC<SyncMonitorScreenProps> = ({ onBack }) => {
  const { addAuditLog, currentRole } = usePermissionStore();
  const [syncItems, setSyncItems] = useState<SyncItem[]>(MOCK_SYNC);
  const [statusFilter, setStatusFilter] = useState<SyncStatus | 'all'>('all');
  const [isOnline] = useState(true);
  const [resolveModal, setResolveModal] = useState<SyncItem | null>(null);

  const filtered = statusFilter === 'all'
    ? syncItems
    : syncItems.filter((i) => i.status === statusFilter);

  const counts = {
    pending:  syncItems.filter((i) => i.status === 'pending').length,
    failed:   syncItems.filter((i) => i.status === 'failed').length,
    success:  syncItems.filter((i) => i.status === 'success').length,
    conflict: syncItems.filter((i) => i.status === 'conflict').length,
  };

  const handleRetry = (item: SyncItem) => {
    setSyncItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'pending', errorMessage: undefined } : i))
    );
    // simulate success after retry
    setTimeout(() => {
      setSyncItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'success' } : i))
      );
    }, 1500);
  };

  const handleRetryAll = () => {
    const failedItems = syncItems.filter((i) => i.status === 'failed');
    if (failedItems.length === 0) return;
    setSyncItems((prev) =>
      prev.map((i) => (i.status === 'failed' ? { ...i, status: 'pending', errorMessage: undefined } : i))
    );
    Alert.alert('Retry', `กำลังลองใหม่ ${failedItems.length} รายการ`);
  };

  const handleForceSync = () => {
    Alert.alert('Force Sync', 'บังคับซิงค์ข้อมูลทั้งหมดทันที?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'Force Sync',
        onPress: () => {
          addAuditLog({
            userId: 'usr_001',
            userName: 'สมชาย เจ้าของร้าน',
            userRole: currentRole,
            action: 'FORCE_SYNC',
            module: 'sync',
            description: 'บังคับซิงค์ข้อมูลทั้งหมด',
          });
          Alert.alert('สำเร็จ', 'เริ่มการ Force Sync แล้ว');
        },
      },
    ]);
  };

  const handleResolveConflict = (resolution: 'server' | 'client' | 'manual') => {
    if (!resolveModal) return;
    setSyncItems((prev) =>
      prev.map((i) =>
        i.id === resolveModal.id
          ? { ...i, status: resolution === 'manual' ? 'pending' : 'success' }
          : i
      )
    );
    addAuditLog({
      userId: 'usr_001',
      userName: 'สมชาย เจ้าของร้าน',
      userRole: currentRole,
      action: 'SYNC_CONFLICT_RESOLVE',
      module: 'sync',
      description: `แก้ไข Conflict: ${resolveModal.docNo} — ${resolution === 'server' ? 'Server Wins' : resolution === 'client' ? 'Client Wins' : 'Manual'}`,
      documentNo: resolveModal.docNo,
    });
    setResolveModal(null);
  };

  const renderItem = ({ item }: { item: SyncItem }) => {
    const sc = STATUS_CONFIG[item.status];
    const typeColor = TYPE_COLORS[item.type];

    return (
      <View style={styles.syncCard}>
        <View style={[styles.typeIcon, { backgroundColor: typeColor + '20' }]}>
          <Ionicons name={TYPE_ICONS[item.type] as any} size={18} color={typeColor} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={styles.syncTopRow}>
            <Text style={styles.syncDocNo}>{item.docNo}</Text>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <Ionicons name={sc.icon as any} size={10} color={sc.color} />
              <Text style={[styles.statusBadgeText, { color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>
          <View style={styles.syncMeta}>
            <Ionicons name="desktop-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.syncMetaText}>{item.deviceName}</Text>
            <Text style={styles.syncMetaText}>·</Text>
            <Text style={styles.syncMetaText}>{formatDateTime(item.timestamp)}</Text>
          </View>
          {item.errorMessage && (
            <Text style={styles.errorMsg}>{item.errorMessage}</Text>
          )}
          {item.status === 'failed' && (
            <TouchableOpacity style={styles.retryBtn} onPress={() => handleRetry(item)}>
              <Ionicons name="refresh-outline" size={14} color={Colors.danger} />
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          )}
          {item.status === 'conflict' && (
            <TouchableOpacity style={styles.resolveBtn} onPress={() => setResolveModal(item)}>
              <Ionicons name="git-merge-outline" size={14} color={Colors.category1} />
              <Text style={styles.resolveBtnText}>Resolve Conflict</Text>
            </TouchableOpacity>
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
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Sync Monitor</Text>
          <Text style={styles.headerSub}>{syncItems.length} รายการในคิว</Text>
        </View>
        <View style={[styles.onlineBadge, isOnline ? styles.onlineBadgeOn : styles.onlineBadgeOff]}>
          <View style={[styles.onlineDot, { backgroundColor: isOnline ? Colors.success : Colors.danger }]} />
          <Text style={[styles.onlineText, { color: isOnline ? Colors.success : Colors.danger }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Summary Badges */}
      <View style={styles.summaryRow}>
        {(['pending', 'failed', 'success', 'conflict'] as const).map((s) => {
          const sc = STATUS_CONFIG[s];
          return (
            <TouchableOpacity
              key={s}
              style={[
                styles.summaryBadge,
                { backgroundColor: sc.bg },
                statusFilter === s && styles.summaryBadgeActive,
              ]}
              onPress={() => setStatusFilter(statusFilter === s ? 'all' : s)}
            >
              <Text style={[styles.summaryCount, { color: sc.color }]}>{counts[s]}</Text>
              <Text style={[styles.summaryLabel, { color: sc.color }]}>{sc.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cloud-done-outline" size={48} color={Colors.gray300} />
            <Text style={styles.emptyText}>ไม่มีรายการที่ตรงกัน</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {counts.failed > 0 && (
          <TouchableOpacity style={styles.retryAllBtn} onPress={handleRetryAll}>
            <Ionicons name="refresh-circle-outline" size={18} color={Colors.danger} />
            <Text style={styles.retryAllBtnText}>Retry ทั้งหมด ({counts.failed})</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.forceSyncBtn} onPress={handleForceSync}>
          <Ionicons name="cloud-upload-outline" size={18} color={Colors.white} />
          <Text style={styles.forceSyncBtnText}>Force Sync ทันที</Text>
        </TouchableOpacity>
      </View>

      {/* Resolve Conflict Modal */}
      <Modal visible={resolveModal !== null} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>แก้ไข Conflict</Text>
            <Text style={styles.modalDocNo}>{resolveModal?.docNo}</Text>
            <Text style={styles.modalDesc}>ข้อมูลในเครื่องกับเซิร์ฟเวอร์ไม่ตรงกัน เลือกวิธีการแก้ไข:</Text>
            {[
              { key: 'server' as const, icon: 'cloud-outline', label: 'Server Wins', desc: 'ใช้ข้อมูลจากเซิร์ฟเวอร์', color: Colors.primary },
              { key: 'client' as const, icon: 'phone-portrait-outline', label: 'Client Wins', desc: 'ใช้ข้อมูลจากเครื่องนี้', color: Colors.success },
              { key: 'manual' as const, icon: 'create-outline', label: 'Manual', desc: 'แก้ไขด้วยตนเอง', color: Colors.warning },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={styles.resolveOption}
                onPress={() => handleResolveConflict(opt.key)}
              >
                <View style={[styles.resolveIconBox, { backgroundColor: opt.color + '20' }]}>
                  <Ionicons name={opt.icon as any} size={20} color={opt.color} />
                </View>
                <View>
                  <Text style={styles.resolveOptionLabel}>{opt.label}</Text>
                  <Text style={styles.resolveOptionDesc}>{opt.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.gray400} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelResolveBtn} onPress={() => setResolveModal(null)}>
              <Text style={styles.cancelResolveBtnText}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { ...Typography.h4, color: Colors.white },
  headerSub: { ...Typography.caption, color: Colors.textSecondary },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  onlineBadgeOn: { backgroundColor: Colors.successLight, borderColor: Colors.success },
  onlineBadgeOff: { backgroundColor: Colors.dangerLight, borderColor: Colors.danger },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontSize: FontSize.caption, fontWeight: '700' },
  summaryRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  summaryBadge: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    gap: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  summaryBadgeActive: { borderColor: Colors.primary },
  summaryCount: { fontSize: FontSize.titleLg, fontWeight: '800' },
  summaryLabel: { fontSize: FontSize.xs, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.md, gap: Spacing.xs },
  syncCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 1,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  syncDocNo: { ...Typography.label, color: Colors.text, fontSize: FontSize.body },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  syncMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  syncMetaText: { ...Typography.caption, color: Colors.textSecondary },
  errorMsg: { ...Typography.caption, color: Colors.danger, fontStyle: 'italic' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  retryBtnText: { fontSize: FontSize.caption, fontWeight: '700', color: Colors.danger },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.category1,
  },
  resolveBtnText: { fontSize: FontSize.caption, fontWeight: '700', color: Colors.category1 },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  retryAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.danger,
  },
  retryAllBtnText: { ...Typography.button, color: Colors.danger },
  forceSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  forceSyncBtnText: { ...Typography.button, color: Colors.white },
  emptyState: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyText: { ...Typography.body2, color: Colors.textSecondary },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    gap: Spacing.sm,
  },
  modalTitle: { ...Typography.h4, color: Colors.text },
  modalDocNo: { ...Typography.label, color: Colors.primary },
  modalDesc: { ...Typography.body2, color: Colors.textSecondary },
  resolveOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  resolveIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolveOptionLabel: { ...Typography.label, color: Colors.text },
  resolveOptionDesc: { ...Typography.caption, color: Colors.textSecondary },
  cancelResolveBtn: {
    marginTop: Spacing.xs,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
  },
  cancelResolveBtnText: { ...Typography.button, color: Colors.textSecondary },
});
