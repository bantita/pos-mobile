/**
 * SCR-SET-003 UserManageScreen
 * จัดการผู้ใช้งาน
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ScrollView, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { usePermission } from '../../hooks/usePermission';
import { usePermissionStore, Role } from '../../store/permissionStore';
import { PermissionGuard } from '../../components/settings/PermissionGuard';

interface AppUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: Role;
  posId: string;
  posName: string;
  active: boolean;
  lastLogin: Date;
}

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

const MOCK_USERS: AppUser[] = [
  {
    id: 'usr_001',
    name: 'สมชาย เจ้าของร้าน',
    phone: '081-001-0001',
    email: 'somchai@abcshop.th',
    role: 'owner',
    posId: 'pos_001',
    posName: 'POS-001 สาขาหลัก',
    active: true,
    lastLogin: new Date(Date.now() - 3600000),
  },
  {
    id: 'usr_002',
    name: 'มานี ผู้จัดการ',
    phone: '081-002-0002',
    email: 'manee@abcshop.th',
    role: 'manager',
    posId: 'pos_001',
    posName: 'POS-001 สาขาหลัก',
    active: true,
    lastLogin: new Date(Date.now() - 7200000),
  },
  {
    id: 'usr_003',
    name: 'สุดา แคชเชียร์',
    phone: '081-003-0003',
    email: 'suda@abcshop.th',
    role: 'cashier',
    posId: 'pos_002',
    posName: 'POS-002 สาขาหลัก',
    active: true,
    lastLogin: new Date(Date.now() - 1800000),
  },
  {
    id: 'usr_004',
    name: 'วิชัย พนักงานคลัง',
    phone: '081-004-0004',
    email: 'wichai@abcshop.th',
    role: 'stock_staff',
    posId: 'pos_003',
    posName: 'POS-003 สาขาลาดพร้าว',
    active: true,
    lastLogin: new Date(Date.now() - 14400000),
  },
  {
    id: 'usr_005',
    name: 'ปิยะ ดูรายงาน',
    phone: '081-005-0005',
    email: 'piya@abcshop.th',
    role: 'report_viewer',
    posId: 'pos_001',
    posName: 'POS-001 สาขาหลัก',
    active: false,
    lastLogin: new Date(Date.now() - 86400000 * 5),
  },
];

const SELECTABLE_ROLES: Role[] = ['manager', 'cashier', 'stock_staff', 'report_viewer', 'admin'];

interface UserManageScreenProps {
  onBack: () => void;
}

const EMPTY_USER: Omit<AppUser, 'id' | 'lastLogin'> = {
  name: '',
  phone: '',
  email: '',
  role: 'cashier',
  posId: 'pos_001',
  posName: 'POS-001 สาขาหลัก',
  active: true,
};

export const UserManageScreen: React.FC<UserManageScreenProps> = ({ onBack }) => {
  const { isOwner, isManager } = usePermission();
  const { addAuditLog, currentRole } = usePermissionStore();

  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AppUser[]>(MOCK_USERS);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<AppUser | null>(null);
  const [form, setForm] = useState<Omit<AppUser, 'id' | 'lastLogin'>>(EMPTY_USER);

  // role-based visibility: manager เห็นเฉพาะ cashier/stock_staff
  const visibleUsers = users.filter((u) => {
    if (!isOwner && isManager) {
      if (u.role === 'owner' || u.role === 'manager' || u.role === 'admin') return false;
    }
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const canAddEdit = isOwner || isManager;

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_USER);
    setModalVisible(true);
  };

  const openEdit = (user: AppUser) => {
    setEditTarget(user);
    const { id, lastLogin, ...rest } = user;
    setForm(rest);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!form.name) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกชื่อผู้ใช้');
      return;
    }
    if (editTarget) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editTarget.id ? { ...editTarget, ...form } : u))
      );
      addAuditLog({
        userId: 'usr_001',
        userName: 'สมชาย เจ้าของร้าน',
        userRole: currentRole,
        action: 'USER_EDIT',
        module: 'users',
        description: `แก้ไขผู้ใช้: ${form.name}`,
        beforeValue: `Role: ${editTarget.role}`,
        afterValue: `Role: ${form.role}`,
      });
    } else {
      const newUser: AppUser = {
        ...form,
        id: `usr_${Date.now()}`,
        lastLogin: new Date(0),
      };
      setUsers((prev) => [...prev, newUser]);
      addAuditLog({
        userId: 'usr_001',
        userName: 'สมชาย เจ้าของร้าน',
        userRole: currentRole,
        action: 'USER_ADD',
        module: 'users',
        description: `เพิ่มผู้ใช้ใหม่: ${form.name} (${ROLE_LABELS[form.role]})`,
      });
    }
    setModalVisible(false);
  };

  const handleToggleActive = (user: AppUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u))
    );
    addAuditLog({
      userId: 'usr_001',
      userName: 'สมชาย เจ้าของร้าน',
      userRole: currentRole,
      action: 'USER_DISABLE',
      module: 'users',
      description: `${user.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}ผู้ใช้: ${user.name}`,
      beforeValue: user.active ? 'active' : 'inactive',
      afterValue: user.active ? 'inactive' : 'active',
    });
  };

  const handleResetPassword = (user: AppUser) => {
    Alert.alert('Reset Password', `รีเซ็ตรหัสผ่านของ ${user.name}?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ยืนยัน',
        onPress: () => {
          addAuditLog({
            userId: 'usr_001',
            userName: 'สมชาย เจ้าของร้าน',
            userRole: currentRole,
            action: 'PASSWORD_RESET',
            module: 'users',
            description: `รีเซ็ตรหัสผ่านผู้ใช้: ${user.name}`,
          });
          Alert.alert('สำเร็จ', 'ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว');
        },
      },
    ]);
  };

  const renderUser = ({ item }: { item: AppUser }) => (
    <View style={[styles.userCard, !item.active && styles.userCardInactive]}>
      <View style={[styles.avatarIcon, { backgroundColor: ROLE_COLORS[item.role] + '20' }]}>
        <Ionicons name="person" size={22} color={ROLE_COLORS[item.role]} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.userNameRow}>
          <Text style={styles.userName}>{item.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[item.role] + '20' }]}>
            <Text style={[styles.roleText, { color: ROLE_COLORS[item.role] }]}>
              {ROLE_LABELS[item.role]}
            </Text>
          </View>
        </View>
        <Text style={styles.userSub}>{item.phone} · {item.posName}</Text>
        <View style={[styles.statusBadge, item.active ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.statusText, { color: item.active ? Colors.success : Colors.gray400 }]}>
            {item.active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      {canAddEdit && (
        <View style={styles.actionCol}>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleToggleActive(item)} style={styles.iconBtn}>
            <Ionicons
              name={item.active ? 'toggle' : 'toggle-outline'}
              size={20}
              color={item.active ? Colors.success : Colors.gray400}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleResetPassword(item)} style={styles.iconBtn}>
            <Ionicons name="key-outline" size={18} color={Colors.warning} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>จัดการผู้ใช้งาน</Text>
          <Text style={styles.headerSub}>{visibleUsers.length} ผู้ใช้</Text>
        </View>
        <PermissionGuard module="users" action="add">
          <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
            <Ionicons name="person-add-outline" size={20} color={Colors.white} />
          </TouchableOpacity>
        </PermissionGuard>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="ค้นหาชื่อ, เบอร์โทร, อีเมล..."
          placeholderTextColor={Colors.gray400}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={visibleUsers}
        keyExtractor={(i) => i.id}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={Colors.gray300} />
            <Text style={styles.emptyText}>ไม่พบผู้ใช้งาน</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: Spacing.xl }} />}
      />

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editTarget ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'name', label: 'ชื่อ-นามสกุล *', placeholder: 'ชื่อ นามสกุล' },
                { key: 'phone', label: 'เบอร์โทร', placeholder: '08x-xxx-xxxx' },
                { key: 'email', label: 'อีเมล', placeholder: 'user@example.com' },
              ].map((f) => (
                <View key={f.key} style={styles.modalField}>
                  <Text style={styles.modalLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={form[f.key as keyof typeof form] as string}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
                    placeholder={f.placeholder}
                  />
                </View>
              ))}

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Role</Text>
                <View style={styles.roleGrid}>
                  {SELECTABLE_ROLES.map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.roleOption,
                        form.role === r && { borderColor: ROLE_COLORS[r], backgroundColor: ROLE_COLORS[r] + '15' },
                      ]}
                      onPress={() => setForm((prev) => ({ ...prev, role: r }))}
                    >
                      <Text style={[styles.roleOptionText, form.role === r && { color: ROLE_COLORS[r] }]}>
                        {ROLE_LABELS[r]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalField}>
                <View style={styles.switchRow}>
                  <Text style={styles.modalLabel}>สถานะ Active</Text>
                  <Switch
                    value={form.active}
                    onValueChange={(v) => setForm((prev) => ({ ...prev, active: v }))}
                    trackColor={{ false: Colors.gray200, true: Colors.primaryLight }}
                    thumbColor={form.active ? Colors.primary : Colors.gray400}
                  />
                </View>
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>บันทึก</Text>
            </TouchableOpacity>
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
  headerSub: { ...Typography.caption, color: Colors.textSecondary },
  addBtn: { padding: 6 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, paddingVertical: 10, ...Typography.body2, color: Colors.text },
  list: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
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
  userCardInactive: { opacity: 0.6 },
  avatarIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  userName: { ...Typography.label, color: Colors.text },
  roleBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  roleText: { fontSize: FontSize.caption, fontWeight: '700' },
  userSub: { ...Typography.caption, color: Colors.textSecondary },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeActive: { backgroundColor: Colors.successLight },
  badgeInactive: { backgroundColor: Colors.backgroundSecondary },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  actionCol: { gap: 4 },
  iconBtn: { padding: 4 },
  emptyState: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyText: { ...Typography.body2, color: Colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { ...Typography.h4, color: Colors.text },
  modalField: { marginBottom: Spacing.md },
  modalLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: 6 },
  modalInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    ...Typography.body1,
    color: Colors.text,
  },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  roleOption: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleOptionText: { ...Typography.caption, color: Colors.textSecondary },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  saveBtnText: { ...Typography.button, color: Colors.white },
});
