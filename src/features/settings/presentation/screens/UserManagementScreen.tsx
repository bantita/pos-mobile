import React, { useState } from 'react';
import { FlatList, Modal } from 'react-native';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { useEmployeeStore } from '@/features/settings/application/stores/employeeStore';
import {
  UserAccount, UserRole, UserStatus,
  USER_ROLE_LABELS, Employee,
} from '@/features/settings/domain/staff';

interface UserManagementScreenProps {
  onBack: () => void;
}

const ROLE_COLORS: Record<UserRole, string> = {
  owner: '#f87171', manager: '#f87171', cashier: '#0f766e',
  stock_staff: '#a16207', report_viewer: '#f87171', admin: '#4b5563',
};

const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => (
  <View className={cn('px-2 py-0.5 rounded-xl')} style={{ backgroundColor: ROLE_COLORS[role] + '18' }}>
    <Text style={[{ color: ROLE_COLORS[role] }]} className={cn('text-xs font-bold')}>
      {USER_ROLE_LABELS[role]}
    </Text>
  </View>
);

const StatusDot: React.FC<{ status: UserStatus }> = ({ status }) => {
  const c = status === 'active' ? '#0f766e' : status === 'suspended' ? '#a16207' : '#9ca3af';
  const label = status === 'active' ? 'ใช้งาน' : status === 'suspended' ? 'ระงับ' : 'ปิดใช้งาน';
  return (
    <View className={cn('flex-row items-center gap-1')}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c }} />
      <Text style={{ fontSize: 12, color: c, fontWeight: '600' }}>{label}</Text>
    </View>
  );
};

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ onBack }) => {
  const { users, employees, addUser, updateUser, deleteUser, getEmployee, getEmployeesWithoutUser } = useEmployeeStore();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{ visible: boolean; user: UserAccount | null }>({ visible: false, user: null });
  const [alertDialog, setAlertDialog] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });

  const handleDelete = (user: UserAccount) => {
    setConfirmDelete({ visible: true, user });
  };

  const confirmDeleteAction = () => {
    if (confirmDelete.user) {
      deleteUser(confirmDelete.user.id);
    }
    setConfirmDelete({ visible: false, user: null });
  };

  const handleToggleStatus = (user: UserAccount) => {
    const newStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    updateUser(user.id, { status: newStatus });
  };

  const renderUser = ({ item }: { item: UserAccount }) => {
    const emp = getEmployee(item.employeeId);
    return (
      <View className={cn('flex-row items-center gap-3 bg-white rounded-2xl p-3 border border-slate-100 shadow-sm')}>
        <View className={cn('w-11 h-11 rounded-full items-center justify-center')} style={{ backgroundColor: ROLE_COLORS[item.role] + '20' }}>
          <Ionicons name="person" size={20} color={ROLE_COLORS[item.role]} />
        </View>
        <View style={{ flex: 1 }}>
          <View className={cn('flex-row items-center gap-2 flex-wrap')}>
            <Text className={cn('text-xs font-bold text-slate-950')}>
              {emp ? `${emp.personal.firstName} ${emp.personal.lastName}` : 'ไม่พบพนักงาน'}
            </Text>
            <RoleBadge role={item.role} />
          </View>
          <Text className={cn('text-xs font-medium text-slate-600 mt-0.5')}>@{item.username}</Text>
          <View className={cn('flex-row items-center gap-3 mt-1')}>
            <StatusDot status={item.status} />
            {item.lastLogin && (
              <Text className={cn('text-xs font-medium text-gray-400')}>
                เข้าใช้ล่าสุด: {item.lastLogin.toLocaleDateString('th-TH')}
              </Text>
            )}
          </View>
        </View>
        <View className={cn('flex-col gap-1')}>
          <TouchableOpacity onPress={() => handleToggleStatus(item)} className={cn('p-2')}>
            <Ionicons
              name={item.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
              size={20}
              color={item.status === 'active' ? '#a16207' : '#0f766e'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setEditingUser(item); setShowForm(true); }} className={cn('p-2')}>
            <Ionicons name="create-outline" size={18} color="#f87171" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} className={cn('p-2')}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-3 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-lg font-extrabold text-white')}>จัดการผู้ใช้งาน</Text>
          <Text className={cn('text-xs font-medium text-rose-100')}>{users.length} ผู้ใช้</Text>
        </View>
        <TouchableOpacity className={cn('min-h-10 flex-row items-center gap-1 rounded-full bg-rose-500 px-3 py-2')} onPress={() => { setEditingUser(null); setShowForm(true); }}>
          <Ionicons name="person-add" size={16} color="#fafafa" />
          <Text className={cn('text-xs text-white font-bold')}>เพิ่ม</Text>
        </TouchableOpacity>
      </View>

      <View className={cn('flex-row items-center gap-1 bg-blue-50 mx-3 mb-0 rounded-xl p-3 shadow-sm')}>
        <Ionicons name="information-circle-outline" size={16} color="#2563eb" />
        <Text className={cn('text-xs font-medium text-blue-600 flex-1')}>ผู้ใช้งานต้องเชื่อมกับพนักงานเสมอ · พนักงานไม่จำเป็นต้องมี User</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className={cn('items-center py-16 gap-2')}>
            <Ionicons name="person-outline" size={56} color="#d1d5db" />
            <Text className={cn('text-base font-medium text-gray-400')}>ยังไม่มีผู้ใช้งาน</Text>
          </View>
        }
      />

      <UserFormModal
        visible={showForm}
        user={editingUser}
        availableEmployees={getEmployeesWithoutUser()}
        allEmployees={employees}
        onSave={(user) => {
          if (editingUser) {
            updateUser(editingUser.id, user);
          } else {
            addUser(user as UserAccount);
          }
          setShowForm(false);
          setEditingUser(null);
        }}
        onClose={() => { setShowForm(false); setEditingUser(null); }}
        setAlertDialog={setAlertDialog}
      />

      <ConfirmModal
        visible={confirmDelete.visible}
        title="ลบผู้ใช้งาน"
        message={`ลบ User "${confirmDelete.user?.username}" ของ ${confirmDelete.user ? getEmployee(confirmDelete.user.employeeId)?.personal.firstName ?? '?' : '?'}?\n(ข้อมูลพนักงานจะยังอยู่)`}
        variant="danger"
        confirmLabel="ลบ"
        cancelLabel="ยกเลิก"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ visible: false, user: null })}
        onClose={() => setConfirmDelete({ visible: false, user: null })}
      />

      <AlertDialog
        visible={alertDialog.visible}
        title={alertDialog.title}
        message={alertDialog.message}
        onClose={() => setAlertDialog({ visible: false, title: '', message: '' })}
        onConfirm={() => setAlertDialog({ visible: false, title: '', message: '' })}
      />
    </SafeAreaView>
  );
};

interface UserFormModalProps {
  visible: boolean;
  user: UserAccount | null;
  availableEmployees: Employee[];
  allEmployees: Employee[];
  onSave: (data: Partial<UserAccount> & { id?: string }) => void;
  onClose: () => void;
  setAlertDialog: (d: { visible: boolean; title: string; message: string }) => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  visible, user, availableEmployees, allEmployees, onSave, onClose, setAlertDialog,
}) => {
  const isEdit = !!user;
  const [employeeId, setEmployeeId] = useState(user?.employeeId ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [role, setRole] = useState<UserRole>(user?.role ?? 'cashier');
  const [showEmpPicker, setShowEmpPicker] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setEmployeeId(user?.employeeId ?? '');
      setUsername(user?.username ?? '');
      setRole(user?.role ?? 'cashier');
    }
  }, [visible, user]);

  const selectedEmp = allEmployees.find((e) => e.id === employeeId);

  const pickableEmployees = isEdit
    ? allEmployees.filter((e) => e.status === 'active')
    : availableEmployees;

  const handleSave = () => {
    if (!employeeId) {
      setAlertDialog({ visible: true, title: 'ข้อมูลไม่ครบ', message: 'กรุณาเลือกพนักงาน' });
      return;
    }
    if (!username.trim()) {
      setAlertDialog({ visible: true, title: 'ข้อมูลไม่ครบ', message: 'กรุณากรอก Username' });
      return;
    }
    const data: UserAccount = {
      id: user?.id ?? `usr-${Date.now()}`,
      employeeId,
      username,
      role,
      status: user?.status ?? 'active',
      lastLogin: user?.lastLogin,
      createdAt: user?.createdAt ?? new Date(),
    };
    onSave(data);
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')}>
        <View className={cn('flex-row items-center justify-between bg-rose-600 px-3 py-3')}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#fafafa" />
          </TouchableOpacity>
          <Text className={cn('text-lg font-extrabold text-white')}>{isEdit ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</Text>
          <TouchableOpacity onPress={handleSave} className={cn('p-2')}>
            <Text className={cn('text-base font-bold text-white')}>บันทึก</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 12 }} keyboardShouldPersistTaps="handled">
          <Text className={cn('text-xs font-bold text-rose-500 mt-3 mb-2')}>เลือกพนักงาน</Text>
          <TouchableOpacity className={cn('flex-row items-center justify-between bg-white rounded-xl border border-rose-200 p-3 mb-3 shadow-sm')} onPress={() => setShowEmpPicker(true)}>
            {selectedEmp ? (
              <View className={cn('flex-row items-center gap-2')}>
                <Ionicons name="person-circle" size={28} color="#f87171" />
                <View>
                  <Text className={cn('text-xs font-bold text-slate-950')}>
                    {selectedEmp.personal.firstName} {selectedEmp.personal.lastName}
                  </Text>
                  <Text className={cn('text-xs font-medium text-slate-600')}>
                    {selectedEmp.employeeCode} · {selectedEmp.employment.position}
                  </Text>
                </View>
              </View>
            ) : (
              <Text className={cn('text-base font-medium text-gray-400')}>กดเพื่อเลือกพนักงาน</Text>
            )}
            <Ionicons name="chevron-down" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <Text className={cn('text-xs font-bold text-rose-500 mt-3 mb-2')}>Username</Text>
          <View className={cn('mb-3')}>
            <Text className={cn('text-xs font-bold text-slate-600 mb-1')}>Username / เบอร์โทร <Text style={{ color: '#ef4444' }}>*</Text></Text>
            <TextInput
              className={cn('bg-white rounded-xl border border-slate-200 px-3 py-2.5 text-base font-medium text-slate-950')}
              value={username}
              onChangeText={setUsername}
              placeholder="เช่น 0812345678"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
            />
            <Text className={cn('text-xs font-medium text-slate-600 mt-1')}>ใช้สำหรับ Login เข้าระบบ</Text>
          </View>

          <Text className={cn('text-xs font-bold text-rose-500 mt-3 mb-2')}>Role (สิทธิ์การใช้งาน)</Text>
          <View className={cn('flex-row flex-wrap gap-2')}>
            {(['owner', 'manager', 'cashier', 'stock_staff', 'report_viewer', 'admin'] as UserRole[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e7e5e4' }, role === r && { backgroundColor: ROLE_COLORS[r], borderColor: ROLE_COLORS[r] }]}
                onPress={() => setRole(r)}
              >
                <Text className={cn('text-xs font-bold text-slate-600')} style={[role === r && { color: '#fafafa' }]}>
                  {USER_ROLE_LABELS[r]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        <Modal visible={showEmpPicker} animationType="slide" transparent>
          <View className={cn('flex-1 justify-end')} style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <View className={cn('bg-white rounded-t-3xl p-4')} style={{ maxHeight: '70%' }}>
              <View className={cn('flex-row items-center justify-between mb-3')}>
                <Text className={cn('text-lg font-extrabold text-slate-950')}>เลือกพนักงาน</Text>
                <TouchableOpacity onPress={() => setShowEmpPicker(false)}>
                  <Ionicons name="close" size={22} color="#6b7280" />
                </TouchableOpacity>
              </View>
              {pickableEmployees.length === 0 ? (
                <View className={cn('items-center p-5')}>
                  <Text style={{ color: '#9ca3af' }} className={cn('font-medium')}>ไม่มีพนักงานที่ยังไม่มี User</Text>
                </View>
              ) : (
                <FlatList
                  data={pickableEmployees}
                  keyExtractor={(e) => e.id}
                  renderItem={({ item: emp }) => (
                    <TouchableOpacity
                      className={cn('flex-row items-center gap-2 py-3 border-b border-slate-200')}
                      style={[emp.id === employeeId && { backgroundColor: '#fee2e2', borderRadius: 8, paddingHorizontal: 8 }]}
                      onPress={() => {
                        setEmployeeId(emp.id);
                        if (!username) setUsername(emp.contact.phone);
                        setShowEmpPicker(false);
                      }}
                    >
                      <Ionicons name="person-circle-outline" size={28} color="#f87171" />
                      <View style={{ flex: 1 }}>
                        <Text className={cn('text-xs font-bold text-slate-950')}>{emp.personal.firstName} {emp.personal.lastName}</Text>
                        <Text className={cn('text-xs font-medium text-slate-600')}>{emp.employeeCode} · {emp.employment.position} · {emp.contact.phone}</Text>
                      </View>
                      {emp.id === employeeId && <Ionicons name="checkmark-circle" size={20} color="#f87171" />}
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};
