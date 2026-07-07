import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from '@/shared/tw/index';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePermission } from '@/shared/hooks/usePermission';
import { Module, Role, usePermissionStore } from '@/features/settings/application/stores/permissionStore';

const ROLE_COLORS: Record<Role, string> = {
  owner: '#e11d48',
  manager: '#f43f5e',
  cashier: '#059669',
  stock_staff: '#d97706',
  report_viewer: '#7c3aed',
  admin: '#475569',
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
  const { isOwner, isAdmin, role } = usePermission();
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
      color: '#e11d48',
      items: [
        { icon: 'storefront-outline', label: 'ตั้งค่าร้านค้า', sub: 'ชื่อร้าน, ที่อยู่, VAT, ใบเสร็จ', screen: 'ShopSettings', module: 'settings' },
        { icon: 'business-outline', label: 'จัดการสาขา', sub: '3 สาขา', screen: 'BranchManage', module: 'settings' },
        { icon: 'desktop-outline', label: 'จัดการจุดขาย (POS)', sub: '3 เครื่อง', screen: 'POSManage', module: 'settings' },
        { icon: 'print-outline', label: 'ตั้งค่าเครื่องพิมพ์', sub: 'Bluetooth, WiFi, USB', screen: 'PrinterSettings', module: 'settings' },
        { icon: 'tv-outline', label: 'ตั้งค่าจอที่ 2', sub: 'Customer Display + โฆษณา', screen: 'CustomerDisplaySettings', module: 'settings' },
      ],
    },
    {
      title: 'ผู้ใช้งาน',
      icon: 'people-outline',
      color: '#7c3aed',
      items: [
        { icon: 'person-outline', label: 'จัดการพนักงาน', sub: 'เพิ่ม/แก้ไข ข้อมูลพนักงาน', screen: 'StaffManagement', module: 'users' },
        { icon: 'people-outline', label: 'จัดการผู้ใช้งาน', sub: 'User Account + สิทธิ์', screen: 'UserManagement', module: 'users' },
        { icon: 'shield-outline', label: 'จัดการ Role', sub: '6 roles', screen: 'RoleManage', module: 'roles', requireOwnerAdmin: true },
        { icon: 'grid-outline', label: 'Permission Matrix', sub: 'ตั้งค่าสิทธิ์ละเอียด', screen: 'PermissionMatrix', module: 'roles', requireOwnerAdmin: true },
      ],
    },
    {
      title: 'ระบบ',
      icon: 'cog-outline',
      color: '#475569',
      items: [
        { icon: 'shield-half-outline', label: 'ความปลอดภัย', sub: 'Password, Session, Device', screen: 'SecuritySettings', module: 'settings', requireOwnerAdmin: true },
        { icon: 'document-text-outline', label: 'Audit Log', sub: `${auditLog.length} รายการ`, screen: 'AuditLog', module: 'audit_log' },
        { icon: 'cloud-upload-outline', label: 'Sync Monitor', sub: 'ติดตามการซิงค์ข้อมูล', screen: 'SyncMonitor', module: 'sync', badge: pendingCount, badgeColor: failedSyncCount > 0 ? '#e11d48' : '#d97706' },
      ],
    },
  ];

  const roleColor = ROLE_COLORS[role as Role] ?? '#475569';

  return (
    <SafeAreaView className="flex-1 bg-[#f6f7fb]" edges={['top']}>
      <View className="flex-row items-center justify-between bg-rose-600 px-5 py-4">
        <View>
          <Text className="text-xl font-extrabold text-white">ตั้งค่า</Text>
          <Text className="text-xs font-medium text-rose-100">Settings</Text>
        </View>
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-rose-500">
          <Ionicons name="settings-outline" size={18} color="#fff" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="flex-row items-center gap-3 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
          <View
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: roleColor + '15' }}
          >
            <Ionicons name="person" size={24} color={roleColor} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-extrabold text-slate-900">สมชาย เจ้าของร้าน</Text>
            <View className="mt-1 flex-row items-center gap-2">
              <View className="rounded-lg px-2 py-0.5" style={{ backgroundColor: roleColor + '15' }}>
                <Text className="text-xs font-bold" style={{ color: roleColor }}>
                  {ROLE_LABELS[role as Role] ?? role}
                </Text>
              </View>
              <Text className="text-xs font-medium text-slate-500">สาขาหลัก</Text>
            </View>
          </View>
        </View>

        <View className="rounded-2xl border border-amber-200 bg-amber-50 p-3 shadow-sm gap-2">
          <View className="flex-row items-center gap-1.5">
            <View className="h-5 w-5 items-center justify-center rounded-md bg-amber-100">
              <Ionicons name="swap-horizontal-outline" size={12} color="#d97706" />
            </View>
            <Text className="text-xs font-bold text-amber-800">Demo: เปลี่ยน Role</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-1.5">
              {ALL_ROLES.map((r) => (
                <TouchableOpacity
                  key={r}
                  className={cn(
                    'rounded-full border px-3 py-1.5',
                    currentRole === r ? 'border-transparent' : 'border-slate-200 bg-white'
                  )}
                  style={currentRole === r ? { backgroundColor: ROLE_COLORS[r] } : undefined}
                  onPress={() => setCurrentRole(r)}
                >
                  <Text
                    className={cn('text-xs font-bold', currentRole === r ? 'text-white' : 'text-slate-600')}
                  >
                    {ROLE_LABELS[r]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} className="gap-2">
            <View className="flex-row items-center gap-2 px-1">
              <View
                className="h-6 w-6 items-center justify-center rounded-lg"
                style={{ backgroundColor: section.color + '12' }}
              >
                <Ionicons name={section.icon as any} size={14} color={section.color} />
              </View>
              <Text className="text-sm font-bold text-slate-700">{section.title}</Text>
            </View>

            <View className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm">
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
                    className={cn(
                      'flex-row items-center gap-3 px-4 py-3.5',
                      idx < section.items.length - 1 && 'border-b border-slate-100',
                      disabled && 'opacity-40'
                    )}
                    onPress={() => !disabled && navigation.navigate(item.screen)}
                    activeOpacity={disabled ? 1 : 0.7}
                  >
                    <View
                      className="h-9 w-9 items-center justify-center rounded-xl"
                      style={{ backgroundColor: disabled ? '#f8fafc' : section.color + '10' }}
                    >
                      <Ionicons
                        name={(!menuOn ? 'eye-off-outline' : item.icon) as any}
                        size={18}
                        color={disabled ? '#cbd5e1' : section.color}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className={cn('text-sm font-bold text-slate-900', disabled && 'text-slate-400')}>
                        {item.label}
                      </Text>
                      <Text className="mt-0.5 text-xs font-medium text-slate-500">
                        {!menuOn ? 'เมนูถูกปิดใช้งาน' : !canAccess ? 'ไม่มีสิทธิ์เข้าถึง' : item.sub}
                      </Text>
                    </View>
                    {item.badge !== undefined && item.badge > 0 && !disabled && (
                      <View
                        className="min-w-[22px] items-center justify-center rounded-full px-1.5 py-0.5"
                        style={{ backgroundColor: item.badgeColor ?? '#e11d48' }}
                      >
                        <Text className="text-xs font-bold text-white">{item.badge}</Text>
                      </View>
                    )}
                    {disabled && (
                      <Ionicons name="lock-closed-outline" size={14} color="#cbd5e1" />
                    )}
                    {!disabled && (
                      <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View className="items-center gap-3 pt-4 pb-6">
          <Text className="text-xs font-medium text-slate-400">POS Mobile v1.0.0</Text>
          <TouchableOpacity className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-5 py-2.5">
            <Ionicons name="log-out-outline" size={16} color="#475569" />
            <Text className="text-sm font-bold text-slate-700">ออกจากระบบ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
