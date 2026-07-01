/**
 * SCR-SET-USER — จัดการผู้ใช้งาน
 * ผู้ใช้งานต้องเชื่อมกับพนักงาน (Employee) เสมอ
 * พนักงานไม่จำเป็นต้องมี User
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Alert, Modal, ScrollView, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { useEmployeeStore } from '../../store/employeeStore';
import {
  UserAccount, UserRole, UserStatus,
  USER_ROLE_LABELS, Employee,
} from '../../types/staff';

interface UserManagementScreenProps {
  onBack: () => void;
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<UserRole, string> = {
  owner: Colors.category1, manager: Colors.primary, cashier: Colors.success,
  stock_staff: Colors.warning, report_viewer: Colors.primary, admin: Colors.gray600,
};

const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => (
  <View style={[roleBadgeStyles.badge, { backgroundColor: ROLE_COLORS[role] + '18' }]}>
    <Text style={[roleBadgeStyles.text, { color: ROLE_COLORS[role] }]}>
      {USER_ROLE_LABELS[role]}
    </Text>
  </View>
);
const roleBadgeStyles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  text: { fontSize: FontSize.caption, fontWeight: '700' },
});

// ─── Status Indicator ─────────────────────────────────────────────────────────
const StatusDot: React.FC<{ status: UserStatus }> = ({ status }) => {
  const c = status === 'active' ? Colors.success : status === 'suspended' ? Colors.warning : Colors.gray400;
  const label = status === 'active' ? 'ใช้งาน' : status === 'suspended' ? 'ระงับ' : 'ปิดใช้งาน';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c }} />
      <Text style={{ fontSize: FontSize.xs, color: c, fontWeight: '600' }}>{label}</Text>
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ onBack }) => {
  const { users, employees, addUser, updateUser, deleteUser, getEmployee, getEmployeesWithoutUser } = useEmployeeStore();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  const handleDelete = (user: UserAccount) => {
    const emp = getEmployee(user.employeeId);
    Alert.alert(
      'ลบผู้ใช้งาน',
      `ลบ User "${user.username}" ของ ${emp?.personal.firstName ?? '?'}?\n(ข้อมูลพนักงานจะยังอยู่)`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ลบ', style: 'destructive', onPress: () => deleteUser(user.id) },
      ]
    );
  };

  const handleToggleStatus = (user: UserAccount) => {
    const newStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    updateUser(user.id, { status: newStatus });
  };

  const renderUser = ({ item }: { item: UserAccount }) => {
    const emp = getEmployee(item.employeeId);
    return (
      <View style={styles.card}>
        <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[item.role] + '20' }]}>
          <Ionicons name="person" size={20} color={ROLE_COLORS[item.role]} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {emp ? `${emp.personal.firstName} ${emp.personal.lastName}` : 'ไม่พบพนักงาน'}
            </Text>
            <RoleBadge role={item.role} />
          </View>
          <Text style={styles.username}>@{item.username}</Text>
          <View style={styles.metaRow}>
            <StatusDot status={item.status} />
            {item.lastLogin && (
              <Text style={styles.metaText}>
                เข้าใช้ล่าสุด: {item.lastLogin.toLocaleDateString('th-TH')}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleToggleStatus(item)} style={styles.actionBtn}>
            <Ionicons
              name={item.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
              size={20}
              color={item.status === 'active' ? Colors.warning : Colors.success}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setEditingUser(item); setShowForm(true); }} style={styles.actionBtn}>
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>จัดการผู้ใช้งาน</Text>
          <Text style={styles.headerSub}>{users.length} ผู้ใช้</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setEditingUser(null); setShowForm(true); }}>
          <Ionicons name="person-add" size={16} color={Colors.white} />
          <Text style={styles.addBtnText}>เพิ่ม</Text>
        </TouchableOpacity>
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
        <Text style={styles.infoText}>ผู้ใช้งานต้องเชื่อมกับพนักงานเสมอ · พนักงานไม่จำเป็นต้องมี User</Text>
      </View>

      {/* List */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="person-outline" size={56} color={Colors.gray300} />
            <Text style={styles.emptyText}>ยังไม่มีผู้ใช้งาน</Text>
          </View>
        }
      />

      {/* Form Modal */}
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
      />
    </SafeAreaView>
  );
};

// ─── User Form Modal ──────────────────────────────────────────────────────────
interface UserFormModalProps {
  visible: boolean;
  user: UserAccount | null;
  availableEmployees: Employee[];
  allEmployees: Employee[];
  onSave: (data: Partial<UserAccount> & { id?: string }) => void;
  onClose: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  visible, user, availableEmployees, allEmployees, onSave, onClose,
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

  // พนักงานที่เลือกได้ = ยังไม่มี user + ตัวที่กำลังแก้ไข
  const pickableEmployees = isEdit
    ? allEmployees.filter((e) => e.status === 'active')
    : availableEmployees;

  const handleSave = () => {
    if (!employeeId) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณาเลือกพนักงาน');
      return;
    }
    if (!username.trim()) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอก Username');
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
      <SafeAreaView style={fStyles.container}>
        <View style={fStyles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={fStyles.headerTitle}>{isEdit ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={fStyles.saveText}>บันทึก</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={fStyles.scroll} keyboardShouldPersistTaps="handled">
          {/* เลือกพนักงาน */}
          <Text style={fStyles.sectionTitle}>เลือกพนักงาน</Text>
          <TouchableOpacity style={fStyles.pickerBtn} onPress={() => setShowEmpPicker(true)}>
            {selectedEmp ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Ionicons name="person-circle" size={28} color={Colors.primary} />
                <View>
                  <Text style={fStyles.pickerValue}>
                    {selectedEmp.personal.firstName} {selectedEmp.personal.lastName}
                  </Text>
                  <Text style={fStyles.pickerSub}>
                    {selectedEmp.employeeCode} · {selectedEmp.employment.position}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={fStyles.pickerPlaceholder}>กดเพื่อเลือกพนักงาน</Text>
            )}
            <Ionicons name="chevron-down" size={18} color={Colors.gray400} />
          </TouchableOpacity>

          {/* Username */}
          <Text style={fStyles.sectionTitle}>Username</Text>
          <View style={fStyles.field}>
            <Text style={fStyles.label}>Username / เบอร์โทร <Text style={{ color: Colors.danger }}>*</Text></Text>
            <TextInput
              style={fStyles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="เช่น 0812345678"
              placeholderTextColor={Colors.gray400}
              autoCapitalize="none"
            />
            <Text style={fStyles.hint}>ใช้สำหรับ Login เข้าระบบ</Text>
          </View>

          {/* Role */}
          <Text style={fStyles.sectionTitle}>Role (สิทธิ์การใช้งาน)</Text>
          <View style={fStyles.roleGrid}>
            {(['owner', 'manager', 'cashier', 'stock_staff', 'report_viewer', 'admin'] as UserRole[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[fStyles.roleBtn, role === r && { backgroundColor: ROLE_COLORS[r], borderColor: ROLE_COLORS[r] }]}
                onPress={() => setRole(r)}
              >
                <Text style={[fStyles.roleBtnText, role === r && { color: Colors.white }]}>
                  {USER_ROLE_LABELS[r]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Employee Picker Modal */}
        <Modal visible={showEmpPicker} animationType="slide" transparent>
          <View style={fStyles.pickerOverlay}>
            <View style={fStyles.pickerSheet}>
              <View style={fStyles.pickerHeader}>
                <Text style={fStyles.pickerTitle}>เลือกพนักงาน</Text>
                <TouchableOpacity onPress={() => setShowEmpPicker(false)}>
                  <Ionicons name="close" size={22} color={Colors.gray500} />
                </TouchableOpacity>
              </View>
              {pickableEmployees.length === 0 ? (
                <View style={{ alignItems: 'center', padding: Spacing.xl }}>
                  <Text style={{ color: Colors.gray400 }}>ไม่มีพนักงานที่ยังไม่มี User</Text>
                </View>
              ) : (
                <FlatList
                  data={pickableEmployees}
                  keyExtractor={(e) => e.id}
                  renderItem={({ item: emp }) => (
                    <TouchableOpacity
                      style={[fStyles.empRow, emp.id === employeeId && fStyles.empRowActive]}
                      onPress={() => {
                        setEmployeeId(emp.id);
                        if (!username) setUsername(emp.contact.phone);
                        setShowEmpPicker(false);
                      }}
                    >
                      <Ionicons name="person-circle-outline" size={28} color={Colors.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={fStyles.empName}>{emp.personal.firstName} {emp.personal.lastName}</Text>
                        <Text style={fStyles.empMeta}>{emp.employeeCode} · {emp.employment.position} · {emp.contact.phone}</Text>
                      </View>
                      {emp.id === employeeId && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
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

// ─── Form Styles ──────────────────────────────────────────────────────────────
const fStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  headerTitle: { ...Typography.h4, color: Colors.white },
  saveText: { ...Typography.button, color: Colors.white },
  scroll: { padding: Spacing.md },
  sectionTitle: { ...Typography.label, color: Colors.primary, fontWeight: '700', marginTop: Spacing.md, marginBottom: Spacing.sm },
  field: { marginBottom: Spacing.md },
  label: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600', marginBottom: 4 },
  input: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    ...Typography.body2, color: Colors.text,
  },
  hint: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4 },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  pickerValue: { ...Typography.label, color: Colors.text },
  pickerSub: { ...Typography.caption, color: Colors.textSecondary },
  pickerPlaceholder: { ...Typography.body2, color: Colors.gray400 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  roleBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  roleBtnText: { ...Typography.label, color: Colors.textSecondary, fontSize: FontSize.sm },
  pickerOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  pickerSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '70%', padding: Spacing.lg,
  },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  pickerTitle: { ...Typography.h4, color: Colors.text },
  empRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  empRowActive: { backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm },
  empName: { ...Typography.label, color: Colors.text },
  empMeta: { ...Typography.caption, color: Colors.textSecondary },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { ...Typography.h4, color: Colors.white },
  headerSub: { ...Typography.caption, color: Colors.textSecondary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 6,
  },
  addBtnText: { ...Typography.caption, color: Colors.white, fontWeight: '700' },
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.primaryLight, margin: Spacing.md, marginBottom: 0,
    borderRadius: BorderRadius.sm, padding: Spacing.sm,
  },
  infoText: { ...Typography.caption, color: Colors.primary, flex: 1 },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  name: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  username: { ...Typography.caption, color: Colors.textSecondary, marginTop: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: 4 },
  metaText: { ...Typography.caption, color: Colors.gray400 },
  actions: { flexDirection: 'column', gap: 8 },
  actionBtn: { padding: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.sm },
  emptyText: { ...Typography.body1, color: Colors.gray400 },
});
