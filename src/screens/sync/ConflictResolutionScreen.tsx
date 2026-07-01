/**
 * SCR-SYNC-003 — Conflict Resolution
 * FR-SYNC-003: Server Wins / Client Wins / Manual Merge
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSyncStore } from '../../store/syncStore';
import { ConflictResolution, ENTITY_LABELS, ENTITY_ICONS } from '../../types/sync';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatDateTime } from '../../utils/format';

interface Props {
  onBack: () => void;
  onResolved: () => void;
}

const CONFLICT_TYPE_LABELS: Record<string, string> = {
  duplicate_docno: 'เลขที่เอกสารซ้ำ',
  stock_changed:   'สต๊อกถูกแก้ไขจากเครื่องอื่น',
  data_modified:   'ข้อมูลถูกแก้ไขพร้อมกัน',
  deleted_on_server: 'เอกสารถูกลบจาก Server',
};

const RESOLUTION_OPTIONS: {
  key: ConflictResolution;
  label: string;
  sub: string;
  icon: string;
  color: string;
  bg: string;
}[] = [
  {
    key: 'server_wins',
    label: 'ใช้ข้อมูล Server',
    sub: 'ยกเลิกการแก้ไขจากเครื่องนี้ ใช้ข้อมูล Server แทน',
    icon: 'cloud-outline',
    color: Colors.accentDark,
    bg: Colors.accentLight,
  },
  {
    key: 'client_wins',
    label: 'ใช้ข้อมูลเครื่องนี้',
    sub: 'เขียนทับข้อมูล Server ด้วยข้อมูลจากเครื่องนี้',
    icon: 'phone-portrait-outline',
    color: Colors.primary,
    bg: Colors.primaryLight,
  },
  {
    key: 'manual_merge',
    label: 'Merge ด้วยตนเอง',
    sub: 'เลือกค่าที่ต้องการบันทึกเอง',
    icon: 'git-merge-outline',
    color: Colors.category1,
    bg: Colors.primaryLight,
  },
];

export const ConflictResolutionScreen: React.FC<Props> = ({ onBack, onResolved }) => {
  const { transactions, resolveConflict } = useSyncStore();
  const conflicts = transactions.filter(t => t.status === 'conflict');
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(
    conflicts.length > 0 ? conflicts[0].id : null
  );
  const [selectedResolution, setSelectedResolution] = useState<ConflictResolution | null>(null);
  const [manualValue, setManualValue] = useState('');
  const [resolving, setResolving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedTx = transactions.find(t => t.id === selectedConflictId);

  const handleResolve = () => {
    if (!selectedConflictId || !selectedResolution) return;
    if (selectedResolution === 'manual_merge' && !manualValue.trim()) {
      Alert.alert('กรุณากรอกค่าที่ต้องการ');
      return;
    }
    Alert.alert(
      'ยืนยันการแก้ไขขัดแย้ง',
      `จะใช้วิธี "${RESOLUTION_OPTIONS.find(r => r.key === selectedResolution)?.label}"${
        selectedResolution === 'manual_merge' ? `\nค่า: ${manualValue}` : ''
      }`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ยืนยัน',
          onPress: () => {
            setResolving(true);
            resolveConflict(
              selectedConflictId,
              selectedResolution,
              selectedResolution === 'manual_merge' ? manualValue : undefined
            );
            setTimeout(() => {
              setResolving(false);
              setShowSuccess(true);
              setTimeout(() => {
                setShowSuccess(false);
                // next conflict
                const remaining = transactions.filter(t => t.status === 'conflict' && t.id !== selectedConflictId);
                if (remaining.length > 0) {
                  setSelectedConflictId(remaining[0].id);
                  setSelectedResolution(null);
                  setManualValue('');
                } else {
                  onResolved();
                }
              }, 1200);
            }, 1000);
          },
        },
      ]
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
          <Text style={styles.headerTitle}>แก้ไขข้อมูลขัดแย้ง</Text>
          <Text style={styles.headerSub}>{conflicts.length} รายการที่ต้องแก้</Text>
        </View>
        {conflicts.length > 0 && (
          <View style={styles.conflictCounter}>
            <Text style={styles.conflictCounterText}>{conflicts.length}</Text>
          </View>
        )}
      </View>

      {conflicts.length === 0 ? (
        <View style={styles.noConflicts}>
          <View style={styles.noConflictsIcon}>
            <Ionicons name="checkmark-circle" size={72} color={Colors.success} />
          </View>
          <Text style={styles.noConflictsTitle}>ไม่มีข้อมูลขัดแย้ง</Text>
          <Text style={styles.noConflictsSub}>ข้อมูลทุกรายการสอดคล้องกันแล้ว</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={onBack}>
            <Text style={styles.doneBtnText}>กลับหน้าก่อน</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Conflict Selector (มีหลาย) */}
          {conflicts.length > 1 && (
            <View style={styles.conflictListSection}>
              <Text style={styles.sectionLabel}>เลือกรายการที่ขัดแย้ง</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.conflictChips}>
                  {conflicts.map((tx) => (
                    <TouchableOpacity
                      key={tx.id}
                      style={[styles.conflictChip, selectedConflictId === tx.id && styles.conflictChipActive]}
                      onPress={() => { setSelectedConflictId(tx.id); setSelectedResolution(null); setManualValue(''); }}
                    >
                      <Text style={[styles.conflictChipText, selectedConflictId === tx.id && styles.conflictChipTextActive]}>
                        {tx.documentNo}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {selectedTx && (
            <>
              {/* Conflict Detail Card */}
              <View style={styles.conflictCard}>
                <View style={styles.conflictCardHeader}>
                  <View style={[styles.entityIconBox, { backgroundColor: Colors.accentLight }]}>
                    <Ionicons name={ENTITY_ICONS[selectedTx.entityType] as any} size={22} color={Colors.accentDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.conflictDocNo}>{selectedTx.documentNo}</Text>
                    <Text style={styles.conflictDesc}>{selectedTx.description}</Text>
                    <Text style={styles.conflictMeta}>{ENTITY_LABELS[selectedTx.entityType]} · {selectedTx.deviceName}</Text>
                  </View>
                </View>

                {/* Conflict type */}
                <View style={styles.conflictTypeBadge}>
                  <Ionicons name="alert-circle-outline" size={14} color={Colors.primary} />
                  <Text style={styles.conflictTypeText}>
                    {CONFLICT_TYPE_LABELS[selectedTx.conflictData?.conflictType ?? ''] ?? selectedTx.conflictData?.conflictType}
                  </Text>
                </View>

                {/* Values comparison */}
                {selectedTx.conflictData && (
                  <View style={styles.comparison}>
                    <Text style={styles.comparisonTitle}>เปรียบเทียบข้อมูล — {selectedTx.conflictData.field}</Text>
                    <View style={styles.valueCards}>
                      <View style={[styles.valueCard, styles.valueCardClient]}>
                        <View style={styles.valueCardHeader}>
                          <Ionicons name="phone-portrait-outline" size={14} color={Colors.primary} />
                          <Text style={styles.valueCardLabel}>เครื่องนี้ (Client)</Text>
                        </View>
                        <Text style={styles.valueCardValue}>{selectedTx.conflictData.clientValue}</Text>
                        <Text style={styles.valueCardSub}>{selectedTx.deviceName}</Text>
                      </View>
                      <View style={styles.valueCardArrow}>
                        <Ionicons name="swap-horizontal-outline" size={20} color={Colors.textSecondary} />
                      </View>
                      <View style={[styles.valueCard, styles.valueCardServer]}>
                        <View style={styles.valueCardHeader}>
                          <Ionicons name="cloud-outline" size={14} color={Colors.accentDark} />
                          <Text style={[styles.valueCardLabel, { color: Colors.accentDark }]}>Server</Text>
                        </View>
                        <Text style={styles.valueCardValue}>{selectedTx.conflictData.serverValue}</Text>
                        <Text style={styles.valueCardSub}>อัปเดตล่าสุด</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Resolution Options */}
              <View style={styles.resolutionSection}>
                <Text style={styles.sectionLabel}>เลือกวิธีแก้ไข</Text>
                {RESOLUTION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.resolutionCard, selectedResolution === opt.key && { borderColor: opt.color, borderWidth: 2 }]}
                    onPress={() => setSelectedResolution(opt.key)}
                    activeOpacity={0.8}
                  >
                    {selectedResolution === opt.key && (
                      <View style={[styles.resolutionCheck, { backgroundColor: opt.color }]}>
                        <Ionicons name="checkmark" size={12} color={Colors.white} />
                      </View>
                    )}
                    <View style={[styles.resolutionIcon, { backgroundColor: opt.bg }]}>
                      <Ionicons name={opt.icon as any} size={24} color={opt.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resolutionLabel, selectedResolution === opt.key && { color: opt.color }]}>
                        {opt.label}
                      </Text>
                      <Text style={styles.resolutionSub}>{opt.sub}</Text>
                      {opt.key === 'server_wins' && selectedTx.conflictData && (
                        <Text style={styles.resolutionPreview}>ค่าที่จะใช้: {selectedTx.conflictData.serverValue}</Text>
                      )}
                      {opt.key === 'client_wins' && selectedTx.conflictData && (
                        <Text style={styles.resolutionPreview}>ค่าที่จะใช้: {selectedTx.conflictData.clientValue}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Manual merge input */}
              {selectedResolution === 'manual_merge' && (
                <View style={styles.manualSection}>
                  <Text style={styles.sectionLabel}>กรอกค่าที่ต้องการ</Text>
                  <View style={styles.manualHint}>
                    <Text style={styles.manualHintText}>Client: {selectedTx.conflictData?.clientValue}</Text>
                    <Text style={styles.manualHintText}>Server: {selectedTx.conflictData?.serverValue}</Text>
                  </View>
                  <TextInput
                    style={styles.manualInput}
                    value={manualValue}
                    onChangeText={setManualValue}
                    placeholder="กรอกค่าที่ต้องการ..."
                    placeholderTextColor={Colors.textDisabled}
                    multiline
                  />
                </View>
              )}

              {/* Resolve Button */}
              <TouchableOpacity
                style={[styles.resolveBtn, (!selectedResolution || resolving) && styles.resolveBtnDisabled]}
                onPress={handleResolve}
                disabled={!selectedResolution || resolving}
              >
                <Ionicons
                  name={resolving ? 'hourglass-outline' : 'git-merge-outline'}
                  size={20} color={Colors.white}
                />
                <Text style={styles.resolveBtnText}>
                  {resolving ? 'กำลังแก้ไข...' : 'ยืนยันการแก้ไข'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      )}

      {/* Success overlay */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
            <Text style={styles.successText}>แก้ไขสำเร็จ!</Text>
          </View>
        </View>
      </Modal>
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
  conflictCounter: { backgroundColor: Colors.primary, borderRadius: 12, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  conflictCounterText: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.white },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs },

  // No conflicts
  noConflicts: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.xl },
  noConflictsIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center' },
  noConflictsTitle: { ...Typography.h3, color: Colors.text },
  noConflictsSub: { ...Typography.body2, color: Colors.textSecondary },
  doneBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  doneBtnText: { ...Typography.button, color: Colors.white },

  // Conflict selector
  conflictListSection: { gap: Spacing.xs },
  conflictChips: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  conflictChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  conflictChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  conflictChipText: { ...Typography.body2, color: Colors.text, fontWeight: '500' },
  conflictChipTextActive: { color: Colors.white, fontWeight: '700' },

  // Conflict detail
  conflictCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.primaryMid,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  conflictCardHeader: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  entityIconBox: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  conflictDocNo: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  conflictDesc: { ...Typography.caption, color: Colors.textSecondary },
  conflictMeta: { ...Typography.caption, color: Colors.textDisabled },
  conflictTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm, padding: Spacing.sm },
  conflictTypeText: { ...Typography.label, color: Colors.primary },

  // Comparison
  comparison: { gap: Spacing.sm },
  comparisonTitle: { ...Typography.label, color: Colors.textSecondary },
  valueCards: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  valueCard: { flex: 1, borderRadius: BorderRadius.md, padding: Spacing.sm, gap: Spacing.xs },
  valueCardClient: { backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primaryMid },
  valueCardServer: { backgroundColor: Colors.accentLight, borderWidth: 1, borderColor: Colors.accentDark + '40' },
  valueCardArrow: { alignItems: 'center' },
  valueCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  valueCardLabel: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },
  valueCardValue: { ...Typography.body2, color: Colors.text, fontWeight: '600' },
  valueCardSub: { ...Typography.caption, color: Colors.textSecondary },

  // Resolution
  resolutionSection: { gap: Spacing.sm },
  resolutionCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.md, position: 'relative',
  },
  resolutionCheck: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  resolutionIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  resolutionLabel: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  resolutionSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  resolutionPreview: { ...Typography.caption, color: Colors.textSecondary, fontStyle: 'italic', marginTop: 3 },

  // Manual merge
  manualSection: { gap: Spacing.sm },
  manualHint: { backgroundColor: Colors.surfaceWarm, borderRadius: BorderRadius.sm, padding: Spacing.sm, gap: 2 },
  manualHintText: { ...Typography.caption, color: Colors.textSecondary },
  manualInput: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Typography.body1, color: Colors.text, minHeight: 80, textAlignVertical: 'top',
  },

  // Resolve button
  resolveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md,
  },
  resolveBtnDisabled: { backgroundColor: Colors.gray300 },
  resolveBtnText: { ...Typography.button, color: Colors.white },

  // Success
  successOverlay: { flex: 1, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center' },
  successBox: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', gap: Spacing.md },
  successText: { ...Typography.h3, color: Colors.success },
});
