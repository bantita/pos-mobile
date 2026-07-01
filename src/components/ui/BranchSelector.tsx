/**
 * BranchSelector — Dropdown เลือกสาขาที่ใช้งาน
 * แสดงเฉพาะสาขาที่ user มีสิทธิ์เข้าถึง
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing, BorderRadius, ComponentSize } from '@/constants/spacing';
import { useBranchGuard, BranchInfo } from '@/hooks/useBranchGuard';

interface BranchSelectorProps {
  style?: any;
  compact?: boolean;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({ style, compact }) => {
  const { accessibleBranches, activeBranch, setActiveBranch, hasAllAccess } = useBranchGuard();
  const [open, setOpen] = useState(false);

  // ถ้ามีสาขาเดียว ไม่ต้องแสดง selector
  if (accessibleBranches.length <= 1 && !hasAllAccess) {
    return (
      <View style={[styles.badge, style]}>
        <Ionicons name="business-outline" size={14} color={Colors.primary} />
        <Text style={styles.badgeText}>{activeBranch?.name ?? 'สาขาหลัก'}</Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, compact && styles.selectorCompact, style]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="business-outline" size={16} color={Colors.primary} />
        <Text style={styles.selectorText} numberOfLines={1}>
          {activeBranch?.name ?? 'เลือกสาขา'}
        </Text>
        <Ionicons name="chevron-down" size={14} color={Colors.gray400} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={styles.dropdown}>
            <Text style={styles.dropdownTitle}>เลือกสาขา</Text>

            {hasAllAccess && (
              <TouchableOpacity
                style={[styles.item, !activeBranch && styles.itemActive]}
                onPress={() => { setActiveBranch(null); setOpen(false); }}
              >
                <Ionicons name="globe-outline" size={18} color={Colors.info} />
                <Text style={styles.itemText}>ทุกสาขา</Text>
                {!activeBranch && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
              </TouchableOpacity>
            )}

            <FlatList
              data={accessibleBranches}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isActive = activeBranch?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.item, isActive && styles.itemActive]}
                    onPress={() => { setActiveBranch(item.id); setOpen(false); }}
                  >
                    <Ionicons name="storefront-outline" size={18} color={isActive ? Colors.primary : Colors.gray600} />
                    <Text style={[styles.itemText, isActive && styles.itemTextActive]}>{item.name}</Text>
                    {isActive && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  badgeText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  selector: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    height: ComponentSize.button.sm,
  },
  selectorCompact: { paddingHorizontal: Spacing.sm, height: 32 },
  selectorText: { ...Typography.bodySmall, color: Colors.text, flex: 1 },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center', padding: Spacing.xl,
  },
  dropdown: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, width: '100%', maxWidth: 360, maxHeight: 400,
  },
  dropdownTitle: { ...Typography.titleMedium, color: Colors.text, marginBottom: Spacing.md },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  itemActive: { backgroundColor: Colors.primaryLight },
  itemText: { ...Typography.bodyMedium, color: Colors.text, flex: 1 },
  itemTextActive: { color: Colors.primary, fontWeight: '600' },
});
