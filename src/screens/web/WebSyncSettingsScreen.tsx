/**
 * WebSyncSettingsScreen — Back-office Sync Monitor (web)
 * ผูกกับ useSyncStore (store จริง) — mock-only ผ่าน FEATURE_FLAGS.MOCK_SYNC ภายใน store
 * มิเรอร์ STATUS config/labels จาก src/screens/sync/SyncQueueScreen.tsx
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { useSyncStore } from '../../store/syncStore';
import {
  LocalTransaction, SyncStatus, ConflictResolution,
  ENTITY_LABELS, ENTITY_ICONS,
} from '../../types/sync';
import { formatDateTime } from '../../utils/format';

interface Props {
  onBack: () => void;
}

// มิเรอร์จาก SyncQueueScreen STATUS_CFG — ปรับใช้โทนสี WebColors
const STATUS_CFG: Record<SyncStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:  { label: 'รอ',          color: WebColors.warning, bg: WebColors.warningLight, icon: 'time-outline' },
  syncing:  { label: 'กำลังซิงค์', color: WebColors.info,    bg: WebColors.infoLight,    icon: 'sync-outline' },
  success:  { label: 'สำเร็จ',      color: WebColors.success, bg: WebColors.successLight, icon: 'checkmark-circle-outline' },
  failed:   { label: 'ล้มเหลว',    color: WebColors.danger,  bg: WebColors.dangerLight,  icon: 'close-circle-outline' },
  conflict: { label: 'ขัดแย้ง',    color: WebColors.primary, bg: WebColors.primaryLight, icon: 'alert-circle-outline' },
};

const CONFLICT_TYPE_LABELS: Record<string, string> = {
  duplicate_docno:   'เลขที่เอกสารซ้ำ',
  stock_changed:     'สต๊อกถูกแก้ไขจากเครื่องอื่น',
  data_modified:     'ข้อมูลถูกแก้ไขพร้อมกัน',
  deleted_on_server: 'เอกสารถูกลบจาก Server',
};

const RESOLUTION_OPTIONS: { key: ConflictResolution; label: string; sub: string; icon: string }[] = [
  { key: 'server_wins', label: 'ใช้ข้อมูล Server',    sub: 'ยกเลิกการแก้ไขจากเครื่อง ใช้ข้อมูล Server', icon: 'cloud-outline' },
  { key: 'client_wins', label: 'ใช้ข้อมูลเครื่องนี้', sub: 'เขียนทับข้อมูล Server ด้วยค่าจากเครื่อง',    icon: 'phone-portrait-outline' },
  { key: 'manual_merge', label: 'Merge ด้วยตนเอง',     sub: 'กรอกค่าที่ต้องการบันทึกเอง',                 icon: 'git-merge-outline' },
];

// lastSyncAt อาจถูก rehydrate เป็น string จาก persist — แปลงให้ปลอดภัยก่อน format
const toDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export const WebSyncSettingsScreen: React.FC<Props> = ({ onBack }) => {
  const {
    transactions, isOnline, isSyncing, lastSyncAt,
    getStats, startSync, retryAllFailed, retryTransaction, resolveConflict,
  } = useSyncStore();
  const stats = getStats();

  // inline conflict resolver state
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolution, setResolution] = useState<ConflictResolution | null>(null);
  const [manualValue, setManualValue] = useState('');

  // รายการที่ต้องแสดง: pending + syncing + failed + conflict (ซ่อน success ที่ sync จบแล้ว)
  const queueItems = transactions.filter(
    t => t.status === 'pending' || t.status === 'syncing' || t.status === 'failed' || t.status === 'conflict'
  );

  const lastSync = toDate(lastSyncAt);

  const SUMMARY: { key: SyncStatus; label: string; count: number }[] = [
    { key: 'pending',  label: 'รอ',         count: stats.pending },
    { key: 'syncing',  label: 'กำลังซิงค์', count: stats.syncing },
    { key: 'success',  label: 'สำเร็จ',     count: stats.success },
    { key: 'failed',   label: 'ล้มเหลว',    count: stats.failed },
    { key: 'conflict', label: 'ขัดแย้ง',    count: stats.conflict },
  ];

  const openResolver = (tx: LocalTransaction) => {
    setResolvingId(tx.id);
    setResolution(null);
    setManualValue('');
  };

  const closeResolver = () => {
    setResolvingId(null);
    setResolution(null);
    setManualValue('');
  };

  const confirmResolve = () => {
    if (!resolvingId || !resolution) return;
    if (resolution === 'manual_merge' && !manualValue.trim()) {
      if (typeof window !== 'undefined') window.alert('กรุณากรอกค่าที่ต้องการ');
      return;
    }
    resolveConflict(resolvingId, resolution, resolution === 'manual_merge' ? manualValue.trim() : undefined);
    closeResolver();
  };

  const resolvingTx = transactions.find(t => t.id === resolvingId && t.status === 'conflict');

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.headerRow}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color={WebColors.primary} />
          <Text style={s.backText}>ตั้งค่า</Text>
        </TouchableOpacity>
      </View>

      <View style={s.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.pageTitle}>Sync Monitor</Text>
          <Text style={s.pageSub}>
            {lastSync ? `ซิงค์ล่าสุด: ${formatDateTime(lastSync)}` : 'ยังไม่เคยซิงค์'}
          </Text>
        </View>
        <View style={[s.onlineChip, { backgroundColor: isOnline ? WebColors.successLight : WebColors.dangerLight }]}>
          <View style={[s.onlineDot, { backgroundColor: isOnline ? WebColors.success : WebColors.danger }]} />
          <Text style={[s.onlineText, { color: isOnline ? WebColors.success : WebColors.danger }]}>
            {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
          </Text>
        </View>
      </View>

      {/* Summary badges */}
      <View style={s.summaryRow}>
        {SUMMARY.map(item => {
          const cfg = STATUS_CFG[item.key];
          return (
            <View key={item.key} style={[s.summaryCard, { borderColor: cfg.color + '40' }]}>
              <View style={[s.summaryIcon, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
              </View>
              <Text style={[s.summaryCount, { color: cfg.color }]}>{item.count}</Text>
              <Text style={s.summaryLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Action bar */}
      <View style={s.actionBar}>
        <TouchableOpacity
          style={[s.syncBtn, (!isOnline || isSyncing) && s.btnDisabled]}
          onPress={startSync}
          disabled={!isOnline || isSyncing}
        >
          {isSyncing
            ? <ActivityIndicator size="small" color={WebColors.white} />
            : <Ionicons name="cloud-upload-outline" size={16} color={WebColors.white} />}
          <Text style={s.syncBtnText}>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ทันที'}</Text>
        </TouchableOpacity>

        {stats.failed > 0 && (
          <TouchableOpacity
            style={[s.retryAllBtn, isSyncing && s.btnDisabled]}
            onPress={retryAllFailed}
            disabled={isSyncing}
          >
            <Ionicons name="refresh-outline" size={15} color={WebColors.warning} />
            <Text style={s.retryAllText}>ลองใหม่ทั้งหมด ({stats.failed})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Syncing indicator */}
      {isSyncing && (
        <View style={s.syncingBar}>
          <ActivityIndicator size="small" color={WebColors.info} />
          <Text style={s.syncingText}>กำลังซิงค์ข้อมูลกับ Server...</Text>
        </View>
      )}

      {/* Queue list */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
        {queueItems.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="cloud-done-outline" size={52} color={WebColors.border} />
            <Text style={s.emptyTitle}>ไม่มีรายการในคิว</Text>
            <Text style={s.emptySub}>ข้อมูลทุกรายการซิงค์เรียบร้อยแล้ว</Text>
          </View>
        ) : (
          queueItems.map(item => {
            const cfg = STATUS_CFG[item.status];
            const isResolvingThis = resolvingId === item.id;
            return (
              <View key={item.id} style={s.card}>
                <View style={s.cardRow}>
                  <View style={[s.entityIcon, { backgroundColor: WebColors.primaryLight }]}>
                    <Ionicons name={ENTITY_ICONS[item.entityType] as any} size={18} color={WebColors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.cardTopRow}>
                      <Text style={s.docNo}>{item.documentNo}</Text>
                      <View style={[s.badge, { backgroundColor: cfg.bg }]}>
                        <Ionicons name={cfg.icon as any} size={10} color={cfg.color} />
                        <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                    </View>
                    <Text style={s.desc} numberOfLines={1}>{item.description}</Text>
                    <Text style={s.meta}>
                      {ENTITY_LABELS[item.entityType]} · {item.deviceName}
                    </Text>
                    {item.status === 'failed' && item.errorMessage && (
                      <Text style={s.errorText} numberOfLines={2}>{item.errorMessage}</Text>
                    )}
                    {item.status === 'conflict' && item.conflictData && (
                      <View style={s.conflictHint}>
                        <Ionicons name="alert-circle-outline" size={11} color={WebColors.primary} />
                        <Text style={s.conflictHintText}>
                          {CONFLICT_TYPE_LABELS[item.conflictData.conflictType] ?? item.conflictData.conflictType}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Per-item actions */}
                <View style={s.cardActions}>
                  {item.status === 'failed' && (
                    <TouchableOpacity style={s.retryBtn} onPress={() => retryTransaction(item.id)} disabled={isSyncing}>
                      <Ionicons name="refresh-outline" size={13} color={WebColors.warning} />
                      <Text style={s.retryBtnText}>ลองใหม่</Text>
                    </TouchableOpacity>
                  )}
                  {item.status === 'conflict' && !isResolvingThis && (
                    <TouchableOpacity style={s.resolveBtn} onPress={() => openResolver(item)}>
                      <Ionicons name="git-merge-outline" size={13} color={WebColors.primary} />
                      <Text style={s.resolveBtnText}>แก้ขัดแย้ง</Text>
                    </TouchableOpacity>
                  )}
                  {item.syncAttempts > 0 && (
                    <Text style={s.attemptsText}>ลอง {item.syncAttempts} ครั้ง</Text>
                  )}
                </View>

                {/* Inline conflict resolver */}
                {isResolvingThis && resolvingTx?.conflictData && (
                  <View style={s.resolver}>
                    <View style={s.compareRow}>
                      <View style={[s.compareCard, { backgroundColor: WebColors.primaryLight }]}>
                        <Text style={s.compareLabel}>เครื่องนี้</Text>
                        <Text style={s.compareValue}>{resolvingTx.conflictData.clientValue}</Text>
                      </View>
                      <View style={[s.compareCard, { backgroundColor: WebColors.infoLight }]}>
                        <Text style={s.compareLabel}>Server</Text>
                        <Text style={s.compareValue}>{resolvingTx.conflictData.serverValue}</Text>
                      </View>
                    </View>

                    {RESOLUTION_OPTIONS.map(opt => (
                      <TouchableOpacity
                        key={opt.key}
                        style={[s.optionRow, resolution === opt.key && s.optionRowActive]}
                        onPress={() => setResolution(opt.key)}
                      >
                        <Ionicons
                          name={resolution === opt.key ? 'radio-button-on' : 'radio-button-off'}
                          size={16} color={resolution === opt.key ? WebColors.primary : WebColors.textSecondary}
                        />
                        <Ionicons name={opt.icon as any} size={15} color={WebColors.textSecondary} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.optionLabel}>{opt.label}</Text>
                          <Text style={s.optionSub}>{opt.sub}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}

                    {resolution === 'manual_merge' && (
                      <TextInput
                        style={s.manualInput}
                        value={manualValue}
                        onChangeText={setManualValue}
                        placeholder="กรอกค่าที่ต้องการบันทึก..."
                        placeholderTextColor={WebColors.textDisabled}
                        multiline
                      />
                    )}

                    <View style={s.resolverActions}>
                      <TouchableOpacity style={s.cancelBtn} onPress={closeResolver}>
                        <Text style={s.cancelBtnText}>ยกเลิก</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.confirmBtn, !resolution && s.btnDisabled]}
                        onPress={confirmResolve}
                        disabled={!resolution}
                      >
                        <Text style={s.confirmBtnText}>ยืนยันการแก้ไข</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 12, color: WebColors.primary, fontWeight: '600' },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pageTitle: { fontSize: 16, fontWeight: '800', color: WebColors.text },
  pageSub: { fontSize: 12, color: WebColors.textSecondary, marginTop: 2 },
  onlineChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineText: { fontSize: 11, fontWeight: '700' },

  summaryRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  summaryCard: {
    flex: 1, minWidth: 100, alignItems: 'center', gap: 4,
    backgroundColor: WebColors.white, borderRadius: 12, borderWidth: 1,
    paddingVertical: 12, paddingHorizontal: 8,
  },
  summaryIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  summaryCount: { fontSize: 18, fontWeight: '800' },
  summaryLabel: { fontSize: 11, color: WebColors.textSecondary, fontWeight: '600' },

  actionBar: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  syncBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: WebColors.primary, borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 11,
  },
  syncBtnText: { fontSize: 13, fontWeight: '700', color: WebColors.white },
  retryAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: WebColors.warningLight, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: WebColors.warning,
  },
  retryAllText: { fontSize: 12, fontWeight: '700', color: WebColors.warning },
  btnDisabled: { opacity: 0.5 },

  syncingBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: WebColors.infoLight, borderRadius: 10, padding: 10,
  },
  syncingText: { fontSize: 12, color: WebColors.info, fontWeight: '600' },

  listContent: { gap: 10, paddingBottom: 20 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 50 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: WebColors.textSecondary },
  emptySub: { fontSize: 12, color: WebColors.textDisabled },

  card: {
    backgroundColor: WebColors.white, borderRadius: 12,
    borderWidth: 1, borderColor: WebColors.border, padding: 14, gap: 10,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  entityIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  docNo: { fontSize: 13, fontWeight: '700', color: WebColors.text },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  desc: { fontSize: 12, color: WebColors.text, marginTop: 2 },
  meta: { fontSize: 11, color: WebColors.textSecondary, marginTop: 2 },
  errorText: { fontSize: 11, color: WebColors.danger, marginTop: 3 },
  conflictHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  conflictHintText: { fontSize: 11, color: WebColors.primary, fontWeight: '600' },

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: WebColors.warningLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: WebColors.warning,
  },
  retryBtnText: { fontSize: 11, fontWeight: '700', color: WebColors.warning },
  resolveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: WebColors.primaryLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: WebColors.primary,
  },
  resolveBtnText: { fontSize: 11, fontWeight: '700', color: WebColors.primary },
  attemptsText: { fontSize: 11, color: WebColors.textSecondary, marginLeft: 'auto' },

  // Inline resolver
  resolver: { gap: 8, borderTopWidth: 1, borderTopColor: WebColors.border, paddingTop: 10 },
  compareRow: { flexDirection: 'row', gap: 8 },
  compareCard: { flex: 1, borderRadius: 8, padding: 8, gap: 2 },
  compareLabel: { fontSize: 10, fontWeight: '700', color: WebColors.textSecondary },
  compareValue: { fontSize: 12, fontWeight: '600', color: WebColors.text },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 8, borderWidth: 1, borderColor: WebColors.border, padding: 10,
  },
  optionRowActive: { borderColor: WebColors.primary, backgroundColor: WebColors.primaryLight },
  optionLabel: { fontSize: 12, fontWeight: '700', color: WebColors.text },
  optionSub: { fontSize: 11, color: WebColors.textSecondary, marginTop: 1 },
  manualInput: {
    borderWidth: 1, borderColor: WebColors.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 12, color: WebColors.text,
    minHeight: 60, textAlignVertical: 'top',
  },
  resolverActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: WebColors.border },
  cancelBtnText: { fontSize: 12, fontWeight: '600', color: WebColors.textSecondary },
  confirmBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: WebColors.primary },
  confirmBtnText: { fontSize: 12, fontWeight: '700', color: WebColors.white },
});
