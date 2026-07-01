/**
 * ServiceStaffPopup — เลือกช่าง/พนักงานบริการ
 * แสดงเมื่อกดสินค้าประเภท service ใน POS
 * ทุกครั้งที่เลือกสินค้าบริการ จะ popup ให้เลือกช่างใหม่เสมอ
 */
import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Technician } from '../../types/store';

interface ServiceStaffPopupProps {
  visible: boolean;
  productName: string;
  technicians: Technician[];
  onSelect: (tech: Technician) => void;
  onClose: () => void;
}

export const ServiceStaffPopup: React.FC<ServiceStaffPopupProps> = ({
  visible, productName, technicians, onSelect, onClose,
}) => {
  const available = technicians.filter((t) => t.status === 'available');
  const unavailable = technicians.filter((t) => t.status === 'unavailable');

  const renderTechnician = (tech: Technician, isAvailable: boolean) => (
    <TouchableOpacity
      key={tech.id}
      style={[styles.techRow, !isAvailable && styles.techRowDisabled]}
      onPress={() => isAvailable && onSelect(tech)}
      disabled={!isAvailable}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, !isAvailable && styles.avatarDisabled]}>
        <Ionicons
          name="person"
          size={24}
          color={isAvailable ? Colors.white : Colors.gray400}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.techName, !isAvailable && styles.techNameDisabled]}>
          {tech.name}
        </Text>
        <Text style={styles.techPosition}>{tech.position}</Text>
      </View>
      {isAvailable ? (
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>ว่าง</Text>
        </View>
      ) : (
        <View style={[styles.statusBadge, styles.statusBadgeBusy]}>
          <View style={[styles.statusDot, styles.statusDotBusy]} />
          <Text style={[styles.statusText, styles.statusTextBusy]}>ไม่ว่าง</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="cut-outline" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>เลือกพนักงานบริการ</Text>
              <Text style={styles.subtitle}>สินค้า: {productName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.gray500} />
            </TouchableOpacity>
          </View>

          {/* Available */}
          {available.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                พนักงานว่าง ({available.length})
              </Text>
              {available.map((t) => renderTechnician(t, true))}
            </View>
          )}

          {/* Unavailable */}
          {unavailable.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: Colors.gray400 }]}>
                ไม่ว่าง ({unavailable.length})
              </Text>
              {unavailable.map((t) => renderTechnician(t, false))}
            </View>
          )}

          {/* Empty state */}
          {technicians.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={Colors.gray300} />
              <Text style={styles.emptyText}>ยังไม่มีพนักงานบริการ</Text>
              <Text style={styles.emptySubText}>เพิ่มพนักงานได้ที่เมนูตั้งค่า</Text>
            </View>
          )}

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>ยกเลิก</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  handle: {
    width: 40, height: 4, backgroundColor: Colors.gray200,
    borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { ...Typography.h4, color: Colors.text },
  subtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: { padding: 4 },
  section: { marginBottom: Spacing.md, gap: Spacing.sm },
  sectionLabel: {
    ...Typography.caption, color: Colors.gray600,
    fontWeight: '600', textTransform: 'uppercase',
    marginBottom: 4,
  },
  techRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray50, borderWidth: 1, borderColor: Colors.border,
  },
  techRowDisabled: { opacity: 0.5 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarDisabled: { backgroundColor: Colors.gray300 },
  techName: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  techNameDisabled: { color: Colors.gray400 },
  techPosition: { ...Typography.caption, color: Colors.textSecondary },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeBusy: { backgroundColor: Colors.gray100 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  statusDotBusy: { backgroundColor: Colors.gray400 },
  statusText: { ...Typography.caption, color: Colors.success, fontWeight: '600' },
  statusTextBusy: { color: Colors.gray400 },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyText: { ...Typography.body1, color: Colors.gray400 },
  emptySubText: { ...Typography.caption, color: Colors.gray300 },
  cancelBtn: {
    alignItems: 'center', paddingVertical: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.sm,
  },
  cancelText: { ...Typography.button, color: Colors.danger },
});
