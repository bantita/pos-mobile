/**
 * SCR-SET-005 PermissionMatrixScreen
 * Permission Matrix — เฉพาะ owner/admin
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { usePermission } from '../../hooks/usePermission';
import { usePermissionStore, Role, Action, Module } from '../../store/permissionStore';

const MATRIX_MODULES: Module[] = [
  'sale', 'product', 'inventory', 'reports', 'settings',
  'users', 'roles', 'audit_log', 'sync',
];

const MATRIX_ACTIONS: Action[] = ['view', 'add', 'edit', 'delete', 'approve', 'export'];

const MODULE_LABELS: Record<Module, string> = {
  sale: 'การขาย',
  product: 'สินค้า',
  inventory: 'คลัง',
  reports: 'รายงาน',
  crm: 'CRM',
  promotion: 'โปรโมชัน',
  supplier: 'ซัพพลาย',
  settings: 'ตั้งค่า',
  users: 'ผู้ใช้',
  roles: 'Role',
  audit_log: 'Audit',
  sync: 'Sync',
};

const ACTION_LABELS: Record<Action, string> = {
  view: 'ดู',
  add: 'เพิ่ม',
  edit: 'แก้',
  delete: 'ลบ',
  approve: 'อนุ',
  export: 'ส่ง',
};

const ROLES: Role[] = ['owner', 'manager', 'cashier', 'stock_staff', 'report_viewer', 'admin'];

const ROLE_COLORS: Record<Role, string> = {
  owner: Colors.category1,
  manager: Colors.primary,
  cashier: Colors.success,
  stock_staff: Colors.warning,
  report_viewer: Colors.danger,
  admin: Colors.gray600,
};

const ROLE_LABELS: Record<Role, string> = {
  owner: 'เจ้าของ',
  manager: 'ผู้จัดการ',
  cashier: 'แคชเชียร์',
  stock_staff: 'คลัง',
  report_viewer: 'รายงาน',
  admin: 'Admin',
};

interface PermissionMatrixScreenProps {
  onBack: () => void;
}

export const PermissionMatrixScreen: React.FC<PermissionMatrixScreenProps> = ({ onBack }) => {
  const { isOwner, isAdmin } = usePermission();
  const {
    hasPermission, updateRolePermission, menuVisibility, toggleMenuVisibility,
    addAuditLog, currentRole, getScreensForRole, toggleScreenForRole,
  } = usePermissionStore();

  const [activeRole, setActiveRole] = useState<Role>('owner');
  const [permView, setPermView] = useState<'modules' | 'screens'>('screens');

  if (!isOwner && !isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Permission Matrix</Text>
        </View>
        <View style={styles.noAccess}>
          <Ionicons name="lock-closed-outline" size={48} color={Colors.gray300} />
          <Text style={styles.noAccessText}>ไม่มีสิทธิ์เข้าถึง</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleTogglePermission = (mod: Module, action: Action) => {
    if (!isOwner) {
      Alert.alert('ไม่มีสิทธิ์', 'เฉพาะเจ้าของเท่านั้นที่เปลี่ยน permission ได้');
      return;
    }
    const current = usePermissionStore.getState();
    const rp = current.rolePermissions.find((r) => r.role === activeRole);
    if (!rp) return;
    const perm = rp.permissions.find((p) => p.module === mod);
    const currentActions = perm?.actions ?? [];
    let newActions: Action[];
    if (currentActions.includes(action)) {
      newActions = currentActions.filter((a) => a !== action);
    } else {
      newActions = [...currentActions, action];
    }
    updateRolePermission(activeRole, mod, newActions);
  };

  const handleSave = () => {
    addAuditLog({
      userId: 'usr_001',
      userName: 'สมชาย เจ้าของร้าน',
      userRole: currentRole,
      action: 'PERMISSION_CHANGE',
      module: 'roles',
      description: `อัปเดต Permission Matrix — Role: ${activeRole}`,
    });
    Alert.alert('สำเร็จ', 'บันทึก Permission เรียบร้อย');
  };

  const enabledCount = MATRIX_MODULES.reduce(
    (sum, mod) =>
      sum + MATRIX_ACTIONS.filter((a) => hasPermission(activeRole, mod, a)).length,
    0
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Permission Matrix</Text>
          <Text style={styles.headerSub}>{enabledCount} สิทธิ์เปิดใช้</Text>
        </View>
      </View>

      {/* Role Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.tab,
                activeRole === r && { backgroundColor: ROLE_COLORS[r], borderColor: ROLE_COLORS[r] },
              ]}
              onPress={() => setActiveRole(r)}
            >
              <Text style={[styles.tabText, activeRole === r && { color: Colors.white }]}>
                {ROLE_LABELS[r]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Menu Visibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>การมองเห็นเมนู (ทุก Role)</Text>
          <View style={styles.visibilityGrid}>
            {MATRIX_MODULES.map((mod) => {
              const mv = menuVisibility.find((m) => m.module === mod);
              return (
                <TouchableOpacity
                  key={mod}
                  style={[
                    styles.visChip,
                    mv?.enabled ? styles.visChipOn : styles.visChipOff,
                  ]}
                  onPress={() => isOwner && toggleMenuVisibility(mod)}
                  activeOpacity={isOwner ? 0.7 : 1}
                >
                  <Ionicons
                    name={mv?.enabled ? 'eye-outline' : 'eye-off-outline'}
                    size={12}
                    color={mv?.enabled ? Colors.primary : Colors.gray400}
                  />
                  <Text style={[styles.visChipText, { color: mv?.enabled ? Colors.primary : Colors.gray400 }]}>
                    {MODULE_LABELS[mod]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
          <TouchableOpacity
            style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: permView === 'screens' ? Colors.primary : Colors.surface, borderWidth: 1, borderColor: permView === 'screens' ? Colors.primary : Colors.border }}
            onPress={() => setPermView('screens')}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: permView === 'screens' ? '#fff' : Colors.textSecondary }}>สิทธิ์เข้าถึงหน้าจอ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: permView === 'modules' ? Colors.primary : Colors.surface, borderWidth: 1, borderColor: permView === 'modules' ? Colors.primary : Colors.border }}
            onPress={() => setPermView('modules')}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: permView === 'modules' ? '#fff' : Colors.textSecondary }}>โมดูล / Action</Text>
          </TouchableOpacity>
        </View>

        {/* Screen-Level Permissions (show first by default) */}
        {permView === 'screens' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            สิทธิ์เข้าถึงหน้าจอ — {ROLE_LABELS[activeRole]}
          </Text>
          <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.md }}>
            เลือกหน้าจอที่ role นี้สามารถเข้าใช้งานได้
          </Text>
          {(() => {
            const { ALL_SCREENS } = require('../../constants/rolePermissions');
            const groups = [...new Set(ALL_SCREENS.map((s: any) => s.group))] as string[];
            const roleScreens = getScreensForRole(activeRole);
            return groups.map((group: string) => (
              <View key={group} style={{ marginBottom: Spacing.md }}>
                <Text style={{ ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs }}>{group}</Text>
                {ALL_SCREENS.filter((s: any) => s.group === group).map((screen: any) => {
                  const enabled = roleScreens.includes(screen.key);
                  return (
                    <TouchableOpacity
                      key={screen.key}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs, gap: Spacing.sm }}
                      onPress={() => toggleScreenForRole(activeRole, screen.key)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={enabled ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={enabled ? Colors.success : Colors.gray300}
                      />
                      <Text style={{ ...Typography.body2, color: Colors.text }}>{screen.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ));
          })()}
        </View>
        )}

        {/* Matrix (module/action) */}
        {permView === 'modules' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            สิทธิ์ของ {ROLE_LABELS[activeRole]}
          </Text>
          <View style={styles.matrixContainer}>
            {/* Column headers */}
            <View style={styles.matrixHeader}>
              <View style={styles.matrixModuleCol} />
              {MATRIX_ACTIONS.map((a) => (
                <View key={a} style={styles.matrixCell}>
                  <Text style={styles.matrixHeaderText}>{ACTION_LABELS[a]}</Text>
                </View>
              ))}
            </View>
            {/* Rows */}
            {MATRIX_MODULES.map((mod, idx) => (
              <View
                key={mod}
                style={[styles.matrixRow, idx % 2 === 1 && styles.matrixRowAlt]}
              >
                <View style={styles.matrixModuleCol}>
                  <Text style={styles.matrixModuleText}>{MODULE_LABELS[mod]}</Text>
                </View>
                {MATRIX_ACTIONS.map((action) => {
                  const has = hasPermission(activeRole, mod, action);
                  return (
                    <TouchableOpacity
                      key={action}
                      style={styles.matrixCell}
                      onPress={() => handleTogglePermission(mod, action)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={has ? 'checkmark-circle' : 'close-circle-outline'}
                        size={20}
                        color={has ? Colors.success : Colors.gray300}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
        )}

        {/* Save */}
        <View style={styles.saveRow}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Ionicons name="save-outline" size={18} color={Colors.white} />
            <Text style={styles.saveBtnText}>บันทึก Permission</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
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
  tabsScroll: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabs: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.xs },
  tab: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  section: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    marginBottom: 0,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm },
  visibilityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  visChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  visChipOn: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  visChipOff: { backgroundColor: Colors.backgroundSecondary, borderColor: Colors.border },
  visChipText: { fontSize: FontSize.caption, fontWeight: '600' },
  matrixContainer: { borderRadius: BorderRadius.sm, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  matrixHeader: { flexDirection: 'row', backgroundColor: Colors.backgroundSecondary },
  matrixHeaderText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  matrixRow: { flexDirection: 'row', backgroundColor: Colors.surface },
  matrixRowAlt: { backgroundColor: Colors.backgroundSecondary },
  matrixModuleCol: { width: 60, paddingHorizontal: 6, paddingVertical: 10, justifyContent: 'center' },
  matrixModuleText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  matrixCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  saveRow: { padding: Spacing.md, paddingTop: Spacing.md },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  saveBtnText: { ...Typography.button, color: Colors.white },
});
