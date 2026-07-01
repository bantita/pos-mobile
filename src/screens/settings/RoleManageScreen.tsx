/**
 * SCR-SET-004 RoleManageScreen
 * จัดการ Role — เฉพาะ owner/admin
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { usePermission } from '../../hooks/usePermission';
import { usePermissionStore, Role, Action, Module } from '../../store/permissionStore';

const ALL_MODULES: Module[] = [
  'sale', 'product', 'inventory', 'reports', 'crm', 'promotion',
  'supplier', 'settings', 'users', 'roles', 'audit_log', 'sync',
];

const MODULE_LABELS: Record<Module, string> = {
  sale: 'การขาย',
  product: 'สินค้า',
  inventory: 'คลังสินค้า',
  reports: 'รายงาน',
  crm: 'CRM',
  promotion: 'โปรโมชัน',
  supplier: 'ซัพพลายเออร์',
  settings: 'ตั้งค่า',
  users: 'ผู้ใช้งาน',
  roles: 'Role',
  audit_log: 'Audit Log',
  sync: 'ซิงค์ข้อมูล',
};

const ACTION_LABELS: Record<Action, string> = {
  view: 'ดู',
  add: 'เพิ่ม',
  edit: 'แก้ไข',
  delete: 'ลบ',
  approve: 'อนุมัติ',
  export: 'ส่งออก',
};

const USER_COUNT_MOCK: Record<Role, number> = {
  owner: 1,
  manager: 2,
  cashier: 5,
  stock_staff: 3,
  report_viewer: 2,
  admin: 1,
};

interface RoleManageScreenProps {
  onBack: () => void;
}

export const RoleManageScreen: React.FC<RoleManageScreenProps> = ({ onBack }) => {
  const { isOwner, isAdmin } = usePermission();
  const { rolePermissions, getVisibleActions } = usePermissionStore();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  if (!isOwner && !isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>จัดการ Role</Text>
        </View>
        <View style={styles.noAccess}>
          <Ionicons name="lock-closed-outline" size={48} color={Colors.gray300} />
          <Text style={styles.noAccessText}>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</Text>
          <Text style={styles.noAccessSub}>เฉพาะ Owner / Admin เท่านั้น</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderRoleCard = ({ item }: { item: typeof rolePermissions[0] }) => {
    const totalPerms = item.permissions.reduce((sum, p) => sum + p.actions.length, 0);

    return (
      <TouchableOpacity
        style={styles.roleCard}
        onPress={() => setSelectedRole(item.role)}
        activeOpacity={0.85}
      >
        <View style={[styles.roleColorBar, { backgroundColor: item.color }]} />
        <View style={styles.roleCardContent}>
          <View style={styles.roleCardHeader}>
            <View style={[styles.roleBadge, { backgroundColor: item.color + '20' }]}>
              <Text style={[styles.roleBadgeText, { color: item.color }]}>{item.label}</Text>
            </View>
            <Text style={styles.roleKey}>{item.role}</Text>
          </View>
          <View style={styles.roleStats}>
            <View style={styles.roleStat}>
              <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.roleStatText}>{USER_COUNT_MOCK[item.role]} ผู้ใช้</Text>
            </View>
            <View style={styles.roleStat}>
              <Ionicons name="shield-checkmark-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.roleStatText}>{totalPerms} สิทธิ์</Text>
            </View>
            <View style={styles.roleStat}>
              <Ionicons name="layers-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.roleStatText}>{item.permissions.length} โมดูล</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
      </TouchableOpacity>
    );
  };

  const selectedRoleData = rolePermissions.find((r) => r.role === selectedRole);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>จัดการ Role</Text>
          <Text style={styles.headerSub}>{rolePermissions.length} roles</Text>
        </View>
        <Ionicons name="shield-outline" size={24} color="rgba(255,255,255,0.7)" />
      </View>

      <FlatList
        data={rolePermissions}
        keyExtractor={(r) => r.role}
        renderItem={renderRoleCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: Spacing.xl }} />}
      />

      {/* Permission Detail Sheet */}
      <Modal visible={selectedRole !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                {selectedRoleData && (
                  <View style={[styles.roleBadge, { backgroundColor: selectedRoleData.color + '20' }]}>
                    <Text style={[styles.roleBadgeText, { color: selectedRoleData.color }]}>
                      {selectedRoleData.label}
                    </Text>
                  </View>
                )}
                <Text style={styles.modalTitle}>สิทธิ์การเข้าถึง</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedRole(null)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {ALL_MODULES.map((mod) => {
                const actions = selectedRole ? getVisibleActions(selectedRole, mod) : [];
                return (
                  <View key={mod} style={styles.permRow}>
                    <Text style={styles.permModule}>{MODULE_LABELS[mod]}</Text>
                    <View style={styles.permActions}>
                      {(['view', 'add', 'edit', 'delete', 'approve', 'export'] as Action[]).map((a) => (
                        <View
                          key={a}
                          style={[
                            styles.permActionChip,
                            actions.includes(a)
                              ? styles.permChipActive
                              : styles.permChipInactive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.permChipText,
                              actions.includes(a) ? styles.permChipTextActive : styles.permChipTextInactive,
                            ]}
                          >
                            {ACTION_LABELS[a]}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
              <View style={{ height: Spacing.lg }} />
            </ScrollView>
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
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  noAccess: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  noAccessText: { ...Typography.h4, color: Colors.text },
  noAccessSub: { ...Typography.body2, color: Colors.textSecondary },
  list: { padding: Spacing.md, gap: Spacing.sm },
  roleCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  roleColorBar: { width: 5, alignSelf: 'stretch' },
  roleCardContent: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
  roleCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  roleBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  roleBadgeText: { fontSize: FontSize.sm, fontWeight: '700' },
  roleKey: { ...Typography.caption, color: Colors.textSecondary, fontStyle: 'italic' },
  roleStats: { flexDirection: 'row', gap: Spacing.md },
  roleStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roleStatText: { ...Typography.caption, color: Colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  modalTitle: { ...Typography.h4, color: Colors.text },
  permRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 6,
  },
  permModule: { ...Typography.label, color: Colors.textSecondary },
  permActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  permActionChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  permChipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  permChipInactive: { backgroundColor: Colors.backgroundSecondary, borderColor: Colors.border },
  permChipText: { fontSize: FontSize.xs, fontWeight: '600' },
  permChipTextActive: { color: Colors.primary },
  permChipTextInactive: { color: Colors.gray300 },
});
