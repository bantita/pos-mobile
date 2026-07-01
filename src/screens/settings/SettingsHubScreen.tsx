/**
 * Settings Hub — SCR-SET-000
 * หน้าหลักของโมดูล Settings
 */
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { usePermission } from '../../hooks/usePermission';
import { usePermissionStore, Role, Module } from '../../store/permissionStore';

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
  stock_staff: 'พนักงานคลัง',
  report_viewer: 'ดูรายงาน',
  admin: 'ผู้ดูแลระบบ',
};

const ALL_ROLES: Role[] = ['owner', 'manager', 'cashier', 'stock_staff', 'report_viewer', 'admin'];

interface MenuItemConfig {
  icon: string;
  label: string;
  sub: string;
  screen: string;
  module: Module;
  badge?: number;
  badgeColor?: string;
  requireOwnerAdmin?: boolean;
}

interface SectionConfig {
  title: string;
  icon: string;
  color: string;
  items: MenuItemConfig[];
}

interface SettingsHubScreenProps {
  navigation: any;
}

export const SettingsHubScreen: React.FC<SettingsHubScreenProps> = ({ navigation }) => {
  const { isOwner, isAdmin, isManager, role } = usePermission();
  const {
    setCurrentRole, currentRole, menuVisibility,
    hasPermission, auditLog,
  } = usePermissionStore();

  const isMenuEnabled = (module: Module) =>
    menuVisibility.find((m) => m.module === module)?.enabled ?? true;

  const pendingSyncCount = 3;
  const failedSyncCount = 2;
  const conflictCount = 2;
  const pendingCount = pendingSyncCount + failedSyncCount + conflictCount;

  const SECTIONS: SectionConfig[] = [
    {
      title: 'ร้านค้า',
      icon: 'storefront-outline',
      color: Colors.primary,
      items: [
        {
          icon: 'storefront-outline',
          label: 'ตั้งค่าร้านค้า',
          sub: 'ชื่อร้าน, ที่อยู่, VAT, ใบเสร็จ',
          screen: 'ShopSettings',
          module: 'settings',
        },
        {
          icon: 'business-outline',
          label: 'จัดการสาขา',
          sub: '3 สาขา',
          screen: 'BranchManage',
          module: 'settings',
        },
        {
          icon: 'desktop-outline',
          label: 'จัดการจุดขาย (POS)',
          sub: '3 เครื่อง',
          screen: 'POSManage',
          module: 'settings',
        },
        {
          icon: 'print-outline',
          label: 'ตั้งค่าเครื่องพิมพ์',
          sub: 'Bluetooth, WiFi, USB',
          screen: 'PrinterSettings',
          module: 'settings',
        },
        {
          icon: 'tv-outline',
          label: 'ตั้งค่าจอที่ 2',
          sub: 'Customer Display + โฆษณา',
          screen: 'CustomerDisplaySettings',
          module: 'settings',
        },
      ],
    },
    {
      title: 'ผู้ใช้งาน',
      icon: 'people-outline',
      color: Colors.category1,
      items: [
        {
          icon: 'person-outline',
          label: 'จัดการพนักงาน',
          sub: 'เพิ่ม/แก้ไข ข้อมูลพนักงาน',
          screen: 'StaffManagement',
          module: 'users',
        },
        {
          icon: 'people-outline',
          label: 'จัดการผู้ใช้งาน',
          sub: 'User Account + สิทธิ์',
          screen: 'UserManagement',
          module: 'users',
        },
        {
          icon: 'shield-outline',
          label: 'จัดการ Role',
          sub: '6 roles',
          screen: 'RoleManage',
          module: 'roles',
          requireOwnerAdmin: true,
        },
        {
          icon: 'grid-outline',
          label: 'Permission Matrix',
          sub: 'ตั้งค่าสิทธิ์ละเอียด',
          screen: 'PermissionMatrix',
          module: 'roles',
          requireOwnerAdmin: true,
        },
      ],
    },
    {
      title: 'ระบบ',
      icon: 'cog-outline',
      color: Colors.gray700,
      items: [
        {
          icon: 'shield-half-outline',
          label: 'ความปลอดภัย',
          sub: 'Password, Session, Device',
          screen: 'SecuritySettings',
          module: 'settings',
          requireOwnerAdmin: true,
        },
        {
          icon: 'document-text-outline',
          label: 'Audit Log',
          sub: `${auditLog.length} รายการ`,
          screen: 'AuditLog',
          module: 'audit_log',
        },
        {
          icon: 'cloud-upload-outline',
          label: 'Sync Monitor',
          sub: 'ติดตามการซิงค์ข้อมูล',
          screen: 'SyncMonitor',
          module: 'sync',
          badge: pendingCount,
          badgeColor: failedSyncCount > 0 ? Colors.danger : Colors.warning,
        },
      ],
    },
  ];

  const roleColor = ROLE_COLORS[role as Role] ?? Colors.gray600;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>ตั้งค่า</Text>
          <Text style={styles.headerSub}>Settings</Text>
        </View>
        <Ionicons name="settings-outline" size={28} color={Colors.textSecondary} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Current User Card */}
        <View style={styles.userCard}>
          <View style={[styles.avatarCircle, { backgroundColor: roleColor + '20' }]}>
            <Ionicons name="person" size={28} color={roleColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>สมชาย เจ้าของร้าน</Text>
            <View style={styles.userMeta}>
              <View style={[styles.roleBadge, { backgroundColor: roleColor + '20' }]}>
                <Text style={[styles.roleBadgeText, { color: roleColor }]}>
                  {ROLE_LABELS[role as Role] ?? role}
                </Text>
              </View>
              <Text style={styles.userShop}>ร้านสะดวกซื้อ ABC</Text>
            </View>
            <Text style={styles.userBranch}>
              <Ionicons name="location-outline" size={11} /> สาขาหลัก
            </Text>
          </View>
        </View>

        {/* Role Switcher (Dev/Demo mode) */}
        <View style={styles.roleCard}>
          <View style={styles.roleCardHeader}>
            <Ionicons name="swap-horizontal-outline" size={16} color={Colors.warning} />
            <Text style={styles.roleCardTitle}>Dev Mode: เปลี่ยน Role</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.roleRow}>
              {ALL_ROLES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.roleChip,
                    currentRole === r && {
                      backgroundColor: ROLE_COLORS[r],
                      borderColor: ROLE_COLORS[r],
                    },
                  ]}
                  onPress={() => setCurrentRole(r)}
                >
                  <Text style={[
                    styles.roleChipText,
                    currentRole === r && { color: Colors.white },
                  ]}>
                    {ROLE_LABELS[r]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Menu Sections */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBox, { backgroundColor: section.color + '15' }]}>
                <Ionicons name={section.icon as any} size={16} color={section.color} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>

            <View style={styles.menuCard}>
              {section.items.map((item, idx) => {
                const menuOn = isMenuEnabled(item.module);
                const canAccess =
                  item.requireOwnerAdmin
                    ? isOwner || isAdmin
                    : hasPermission(currentRole, item.module, 'view');
                const disabled = !menuOn || !canAccess;

                return (
                  <TouchableOpacity
                    key={item.screen}
                    style={[
                      styles.menuItem,
                      idx < section.items.length - 1 && styles.menuItemBorder,
                      disabled && styles.menuItemDisabled,
                    ]}
                    onPress={() => !disabled && navigation.navigate(item.screen)}
                    activeOpacity={disabled ? 1 : 0.7}
                  >
                    <View style={[
                      styles.menuIconBox,
                      {
                        backgroundColor: disabled
                          ? Colors.gray100
                          : section.color + '15',
                      },
                    ]}>
                      <Ionicons
                        name={(!menuOn ? 'eye-off-outline' : item.icon) as any}
                        size={20}
                        color={disabled ? Colors.gray300 : section.color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.menuLabel, disabled && styles.menuLabelDisabled]}>
                        {item.label}
                      </Text>
                      <Text style={styles.menuSub}>
                        {!menuOn ? 'เมนูถูกปิดใช้งาน' : !canAccess ? 'ไม่มีสิทธิ์เข้าถึง' : item.sub}
                      </Text>
                    </View>
                    {item.badge !== undefined && item.badge > 0 && !disabled && (
                      <View style={[styles.badge, { backgroundColor: item.badgeColor ?? Colors.danger }]}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                    {!menuOn && (
                      <Ionicons name="lock-closed-outline" size={14} color={Colors.gray300} />
                    )}
                    {menuOn && !canAccess && (
                      <Ionicons name="lock-closed-outline" size={14} color={Colors.gray300} />
                    )}
                    {!disabled && (
                      <Ionicons name="chevron-forward" size={16} color={Colors.gray300} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerVersion}>POS Mobile v1.0.0 (M10)</Text>
          <TouchableOpacity style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
            <Text style={styles.logoutBtnText}>ออกจากระบบ</Text>
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
    backgroundColor: Colors.gray800,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  headerTitle: { ...Typography.h3, color: Colors.white },
  headerSub: { ...Typography.caption, color: Colors.textSecondary },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  userCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: { ...Typography.h4, color: Colors.text },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 3 },
  roleBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  roleBadgeText: { fontSize: FontSize.sm, fontWeight: '700' },
  userShop: { ...Typography.caption, color: Colors.textSecondary },
  userBranch: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  roleCard: {
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.warning + '50',
  },
  roleCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  roleCardTitle: { ...Typography.caption, color: Colors.warning, fontWeight: '700' },
  roleRow: { flexDirection: 'row', gap: Spacing.xs },
  roleChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  roleChipText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  section: { gap: Spacing.xs },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  sectionIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { ...Typography.label, color: Colors.textSecondary },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  menuItemDisabled: { opacity: 0.5 },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { ...Typography.label, color: Colors.text },
  menuLabelDisabled: { color: Colors.textDisabled },
  menuSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 1 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.white },
  footer: { alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.sm },
  footerVersion: { ...Typography.caption, color: Colors.gray400 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dangerLight,
  },
  logoutBtnText: { ...Typography.label, color: Colors.danger },
});
