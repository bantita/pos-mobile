import React, { useState } from 'react';
import { FlatList, Modal } from 'react-native';
import { ScrollView, Text, TouchableOpacity, View } from '@/shared/tw/index';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { usePermission } from '@/shared/hooks/usePermission';
import { usePermissionStore, Role, Action, Module } from '@/features/settings/application/stores/permissionStore';

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
      <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
        <View className={cn('bg-rose-600 flex-row items-center gap-2 px-3 py-3')}>
          <TouchableOpacity onPress={onBack} className={cn('p-1')}>
            <Ionicons name="arrow-back" size={24} color="#fafafa" />
          </TouchableOpacity>
          <Text className={cn('text-lg font-extrabold text-white')}>จัดการ Role</Text>
        </View>
        <View className={cn('flex-1 items-center justify-center gap-2')}>
          <Ionicons name="lock-closed-outline" size={48} color="#d1d5db" />
          <Text className={cn('text-lg font-bold text-slate-950')}>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</Text>
          <Text className={cn('text-base font-medium text-slate-600')}>เฉพาะ Owner / Admin เท่านั้น</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderRoleCard = ({ item }: { item: typeof rolePermissions[0] }) => {
    const totalPerms = item.permissions.reduce((sum, p) => sum + p.actions.length, 0);

    return (
      <TouchableOpacity
        className={cn('bg-white rounded-2xl flex-row items-center overflow-hidden shadow-sm')}
        onPress={() => setSelectedRole(item.role)}
        activeOpacity={0.85}
      >
        <View style={{ width: 5, alignSelf: 'stretch', backgroundColor: item.color }} />
        <View className={cn('flex-1 p-3 gap-2')}>
          <View className={cn('flex-row items-center gap-2')}>
            <View className={cn('rounded-lg px-2 py-0.5')} style={{ backgroundColor: item.color + '20' }}>
              <Text className={cn('text-sm font-bold')} style={{ color: item.color }}>{item.label}</Text>
            </View>
            <Text className={cn('text-xs italic font-medium text-slate-600')}>{item.role}</Text>
          </View>
          <View className={cn('flex-row gap-3')}>
            <View className={cn('flex-row items-center gap-1')}>
              <Ionicons name="people-outline" size={14} color="#57534e" />
              <Text className={cn('text-xs font-medium text-slate-600')}>{USER_COUNT_MOCK[item.role]} ผู้ใช้</Text>
            </View>
            <View className={cn('flex-row items-center gap-1')}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#57534e" />
              <Text className={cn('text-xs font-medium text-slate-600')}>{totalPerms} สิทธิ์</Text>
            </View>
            <View className={cn('flex-row items-center gap-1')}>
              <Ionicons name="layers-outline" size={14} color="#57534e" />
              <Text className={cn('text-xs font-medium text-slate-600')}>{item.permissions.length} โมดูล</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>
    );
  };

  const selectedRoleData = rolePermissions.find((r) => r.role === selectedRole);

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('bg-rose-600 flex-row items-center gap-2 px-3 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-lg font-extrabold text-white')}>จัดการ Role</Text>
          <Text className={cn('text-xs font-medium text-rose-100')}>{rolePermissions.length} roles</Text>
        </View>
        <Ionicons name="shield-outline" size={24} color="#fecdd3" />
      </View>

      <FlatList
        data={rolePermissions}
        keyExtractor={(r) => r.role}
        renderItem={renderRoleCard}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 20 }} />}
      />

      <Modal visible={selectedRole !== null} animationType="slide" transparent>
        <View className={cn('flex-1 bg-black/40 justify-end')}>
          <View className={cn('bg-white rounded-t-2xl p-4 max-h-[85%]')}>
            <View className={cn('flex-row justify-between items-center mb-3')}>
              <View className={cn('flex-row items-center gap-2')}>
                {selectedRoleData && (
                  <View className={cn('rounded-lg px-2 py-0.5')} style={{ backgroundColor: selectedRoleData.color + '20' }}>
                    <Text className={cn('text-sm font-bold')} style={{ color: selectedRoleData.color }}>
                      {selectedRoleData.label}
                    </Text>
                  </View>
                )}
                <Text className={cn('text-lg font-extrabold text-slate-950')}>สิทธิ์การเข้าถึง</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedRole(null)}>
                <Ionicons name="close" size={24} color="#292524" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {ALL_MODULES.map((mod) => {
                const actions = selectedRole ? getVisibleActions(selectedRole, mod) : [];
                return (
                  <View key={mod} className={cn('py-2 border-b border-slate-200 gap-1.5')}>
                    <Text className={cn('text-xs font-bold text-slate-600')}>{MODULE_LABELS[mod]}</Text>
                    <View className={cn('flex-row flex-wrap gap-1')}>
                      {(['view', 'add', 'edit', 'delete', 'approve', 'export'] as Action[]).map((a) => (
                        <View
                          key={a}
                          className={cn('px-1.5 py-0.5 rounded-xl border', actions.includes(a) ? 'bg-[#f6f7fb] border-rose-500' : 'bg-[#f6f7fb] border-slate-200')}
                        >
                          <Text className={cn('text-xs font-bold', actions.includes(a) ? 'text-rose-500' : 'text-gray-300')}>
                            {ACTION_LABELS[a]}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
              <View style={{ height: 16 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
