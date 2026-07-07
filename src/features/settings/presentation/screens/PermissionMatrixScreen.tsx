import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from '@/shared/tw/index';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { usePermission } from '@/shared/hooks/usePermission';
import { usePermissionStore, Role, Action, Module } from '@/features/settings/application/stores/permissionStore';

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
  owner: '#f87171',
  manager: '#f87171',
  cashier: '#0f766e',
  stock_staff: '#a16207',
  report_viewer: '#ef4444',
  admin: '#4b5563',
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

  const [alertDialog, setAlertDialog] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });

  if (!isOwner && !isAdmin) {
    return (
      <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
        <View className={cn('flex-row items-center gap-2 bg-rose-600 px-3 py-3')}>
          <TouchableOpacity onPress={onBack} className={cn('p-1')}>
            <Ionicons name="arrow-back" size={24} color="#fafafa" />
          </TouchableOpacity>
          <Text className={cn('text-lg font-extrabold text-white')}>Permission Matrix</Text>
        </View>
        <View className={cn('flex-1 items-center justify-center gap-2')}>
          <Ionicons name="lock-closed-outline" size={48} color="#d1d5db" />
          <Text className={cn('text-lg font-bold text-slate-950')}>ไม่มีสิทธิ์เข้าถึง</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleTogglePermission = (mod: Module, action: Action) => {
    if (!isOwner) {
      setAlertDialog({ visible: true, title: 'ไม่มีสิทธิ์', message: 'เฉพาะเจ้าของเท่านั้นที่เปลี่ยน permission ได้' });
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
    setAlertDialog({ visible: true, title: 'สำเร็จ', message: 'บันทึก Permission เรียบร้อย' });
  };

  const enabledCount = MATRIX_MODULES.reduce(
    (sum, mod) =>
      sum + MATRIX_ACTIONS.filter((a) => hasPermission(activeRole, mod, a)).length,
    0
  );

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-3 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-lg font-extrabold text-white')}>Permission Matrix</Text>
          <Text className={cn('text-xs font-medium text-rose-100')}>{enabledCount} สิทธิ์เปิดใช้</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className={cn('bg-white border-b border-slate-200')}>
        <View className={cn('flex-row px-3 py-2 gap-1')}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r}
              className={cn('px-3 py-1.5 rounded-full border', activeRole === r ? 'border-rose-600' : 'border-slate-200')}
              style={activeRole === r ? { backgroundColor: ROLE_COLORS[r] } : { backgroundColor: '#fff' }}
              onPress={() => setActiveRole(r)}
            >
              <Text className={cn('text-sm font-bold', activeRole === r ? 'text-white' : 'text-slate-600')}>
                {ROLE_LABELS[r]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className={cn('bg-white mx-3 mb-0 rounded-2xl p-3 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-slate-600 mb-2')}>การมองเห็นเมนู (ทุก Role)</Text>
          <View className={cn('flex-row flex-wrap gap-1')}>
            {MATRIX_MODULES.map((mod) => {
              const mv = menuVisibility.find((m) => m.module === mod);
              return (
                <TouchableOpacity
                  key={mod}
                  className={cn('min-h-9 flex-row items-center gap-1 rounded-xl border px-2 py-1.5', mv?.enabled ? 'bg-[#f6f7fb] border-rose-500' : 'bg-[#f6f7fb] border-slate-200')}
                  onPress={() => isOwner && toggleMenuVisibility(mod)}
                  activeOpacity={isOwner ? 0.7 : 1}
                >
                  <Ionicons
                    name={mv?.enabled ? 'eye-outline' : 'eye-off-outline'}
                    size={12}
                    color={mv?.enabled ? '#f87171' : '#9ca3af'}
                  />
                  <Text style={[{ color: mv?.enabled ? '#f87171' : '#9ca3af' }]} className={cn('text-xs font-bold')}>
                    {MODULE_LABELS[mod]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className={cn('flex-row gap-2 mb-3 px-3 mt-3')}>
          <TouchableOpacity
            className={cn('px-4 py-2 rounded-full border', permView === 'screens' ? 'bg-rose-600 border-rose-600' : 'bg-white border-slate-200')}
            onPress={() => setPermView('screens')}
          >
            <Text className={cn('text-sm font-bold', permView === 'screens' ? 'text-white' : 'text-slate-600')}>สิทธิ์เข้าถึงหน้าจอ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={cn('px-4 py-2 rounded-full border', permView === 'modules' ? 'bg-rose-600 border-rose-600' : 'bg-white border-slate-200')}
            onPress={() => setPermView('modules')}
          >
            <Text className={cn('text-sm font-bold', permView === 'modules' ? 'text-white' : 'text-slate-600')}>โมดูล / Action</Text>
          </TouchableOpacity>
        </View>

        {permView === 'screens' && (
        <View className={cn('bg-white mx-3 mb-0 rounded-2xl p-3 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-slate-600 mb-2')}>
            สิทธิ์เข้าถึงหน้าจอ — {ROLE_LABELS[activeRole]}
          </Text>
          <Text className={cn('text-xs font-medium text-slate-600 mb-3')}>
            เลือกหน้าจอที่ role นี้สามารถเข้าใช้งานได้
          </Text>
          {(() => {
            const { ALL_SCREENS } = require('@/features/settings/domain/rolePermissions');
            const groups = [...new Set(ALL_SCREENS.map((s: any) => s.group))] as string[];
            const roleScreens = getScreensForRole(activeRole);
            return groups.map((group: string) => (
              <View key={group} style={{ marginBottom: 12 }}>
                <Text className={cn('text-xs font-bold text-slate-600 mb-1')}>{group}</Text>
                {ALL_SCREENS.filter((s: any) => s.group === group).map((screen: any) => {
                  const enabled = roleScreens.includes(screen.key);
                  return (
                    <TouchableOpacity
                      key={screen.key}
                      className={cn('flex-row items-center py-1 gap-2')}
                      onPress={() => toggleScreenForRole(activeRole, screen.key)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={enabled ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={enabled ? '#0f766e' : '#d1d5db'}
                      />
                      <Text className={cn('text-base font-medium text-slate-950')}>{screen.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ));
          })()}
        </View>
        )}

        {permView === 'modules' && (
        <View className={cn('bg-white mx-3 mb-0 rounded-2xl p-3 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-slate-600 mb-2')}>
            สิทธิ์ของ {ROLE_LABELS[activeRole]}
          </Text>
          <View className={cn('rounded-xl overflow-hidden border border-slate-200')}>
            <View className={cn('flex-row bg-slate-100')}>
              <View style={{ width: 60, paddingHorizontal: 6, paddingVertical: 10, justifyContent: 'center' }} />
              {MATRIX_ACTIONS.map((a) => (
                <View key={a} className={cn('flex-1 items-center justify-center py-2.5')}>
                  <Text className={cn('text-xs font-bold text-slate-600')}>{ACTION_LABELS[a]}</Text>
                </View>
              ))}
            </View>
            {MATRIX_MODULES.map((mod, idx) => (
              <View
                key={mod}
                className={cn('flex-row', idx % 2 === 1 ? 'bg-[#f6f7fb]' : 'bg-white')}
              >
                <View style={{ width: 60, paddingHorizontal: 6, paddingVertical: 10, justifyContent: 'center' }}>
                  <Text className={cn('text-xs font-bold text-slate-600')}>{MODULE_LABELS[mod]}</Text>
                </View>
                {MATRIX_ACTIONS.map((action) => {
                  const has = hasPermission(activeRole, mod, action);
                  return (
                    <TouchableOpacity
                      key={action}
                      className={cn('flex-1 items-center justify-center py-2.5')}
                      onPress={() => handleTogglePermission(mod, action)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={has ? 'checkmark-circle' : 'close-circle-outline'}
                        size={20}
                        color={has ? '#0f766e' : '#d1d5db'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
        )}

        <View className={cn('p-3 pt-3')}>
          <TouchableOpacity className={cn('flex-row items-center justify-center gap-2 bg-rose-500 rounded-xl py-3 shadow-sm')} onPress={handleSave} activeOpacity={0.85}>
            <Ionicons name="save-outline" size={18} color="#fafafa" />
            <Text className={cn('text-base font-bold text-white')}>บันทึก Permission</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <AlertDialog
        visible={alertDialog.visible}
        title={alertDialog.title}
        message={alertDialog.message}
        variant={alertDialog.title === 'ไม่มีสิทธิ์' ? 'warning' : 'success'}
        onClose={() => setAlertDialog({ visible: false, title: '', message: '' })}
        onConfirm={() => setAlertDialog({ visible: false, title: '', message: '' })}
      />
    </SafeAreaView>
  );
};
