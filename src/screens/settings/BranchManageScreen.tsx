/**
 * SCR-SET-002 BranchManageScreen
 * จัดการสาขา
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { usePermission } from '../../hooks/usePermission';
import { usePermissionStore } from '../../store/permissionStore';
import { PermissionGuard } from '../../components/settings/PermissionGuard';

interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  taxId: string;
  phone: string;
  manager: string;
  posCount: number;
  status: 'active' | 'inactive';
}

const MOCK_BRANCHES: Branch[] = [
  {
    id: 'br_001',
    code: 'HQ',
    name: 'สาขาหลัก (สำนักงานใหญ่)',
    address: '123 ถ.รัชดาภิเษก แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900',
    taxId: '0105556123456',
    phone: '02-123-4567',
    manager: 'มานี ผู้จัดการ',
    posCount: 3,
    status: 'active',
  },
  {
    id: 'br_002',
    code: 'LPL',
    name: 'สาขาลาดพร้าว',
    address: '456 ถ.ลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900',
    taxId: '0105556123456',
    phone: '02-234-5678',
    manager: 'สมหญิง รองสาขา',
    posCount: 2,
    status: 'active',
  },
  {
    id: 'br_003',
    code: 'NBR',
    name: 'สาขานนทบุรี',
    address: '789 ถ.นนทบุรี ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000',
    taxId: '0105556123456',
    phone: '02-345-6789',
    manager: 'วิโรจน์ สาขา',
    posCount: 1,
    status: 'inactive',
  },
];

interface BranchManageScreenProps {
  onBack: () => void;
}

const EMPTY_BRANCH: Omit<Branch, 'id' | 'posCount'> = {
  code: '', name: '', address: '', taxId: '', phone: '', manager: '', status: 'active',
};

export const BranchManageScreen: React.FC<BranchManageScreenProps> = ({ onBack }) => {
  const { isOwner, isAdmin } = usePermission();
  const { addAuditLog, currentRole } = usePermissionStore();
  const canEdit = isOwner || isAdmin;

  const [branches, setBranches] = useState<Branch[]>(MOCK_BRANCHES);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Branch | null>(null);
  const [form, setForm] = useState<Omit<Branch, 'id' | 'posCount'>>(EMPTY_BRANCH);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_BRANCH);
    setModalVisible(true);
  };

  const openEdit = (branch: Branch) => {
    setEditTarget(branch);
    const { id, posCount, ...rest } = branch;
    setForm(rest);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!form.code || !form.name) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกรหัสสาขาและชื่อสาขา');
      return;
    }
    if (editTarget) {
      setBranches((prev) =>
        prev.map((b) => (b.id === editTarget.id ? { ...editTarget, ...form } : b))
      );
      addAuditLog({
        userId: 'usr_001',
        userName: 'สมชาย เจ้าของร้าน',
        userRole: currentRole,
        action: 'BRANCH_EDIT',
        module: 'settings',
        description: `แก้ไขสาขา: ${form.name}`,
        beforeValue: `ชื่อ: ${editTarget.name}`,
        afterValue: `ชื่อ: ${form.name}`,
      });
    } else {
      const newBranch: Branch = {
        ...form,
        id: `br_${Date.now()}`,
        posCount: 0,
      };
      setBranches((prev) => [...prev, newBranch]);
      addAuditLog({
        userId: 'usr_001',
        userName: 'สมชาย เจ้าของร้าน',
        userRole: currentRole,
        action: 'BRANCH_ADD',
        module: 'settings',
        description: `เพิ่มสาขาใหม่: ${form.name} (${form.code})`,
      });
    }
    setModalVisible(false);
  };

  const renderBranch = ({ item }: { item: Branch }) => (
    <View style={styles.branchCard}>
      <View style={styles.branchHeader}>
        <View style={styles.branchCodeBadge}>
          <Text style={styles.branchCode}>{item.code}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.branchName}>{item.name}</Text>
          <Text style={styles.branchManager}>
            <Ionicons name="person-outline" size={11} /> {item.manager}
          </Text>
        </View>
        <View style={[styles.statusBadge, item.status === 'active' ? styles.statusActive : styles.statusInactive]}>
          <Text style={[styles.statusText, { color: item.status === 'active' ? Colors.success : Colors.textDisabled }]}>
            {item.status === 'active' ? 'เปิด' : 'ปิด'}
          </Text>
        </View>
        <PermissionGuard module="settings" action="edit">
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </PermissionGuard>
      </View>
      <Text style={styles.branchAddress}>
        <Ionicons name="location-outline" size={12} /> {item.address}
      </Text>
      <View style={styles.branchMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="call-outline" size={12} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{item.phone}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="desktop-outline" size={12} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{item.posCount} จุดขาย</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>จัดการสาขา</Text>
          <Text style={styles.headerSub}>{branches.length} สาขา</Text>
        </View>
        <Ionicons name="business-outline" size={24} color="rgba(255,255,255,0.7)" />
      </View>

      <FlatList
        data={branches}
        keyExtractor={(i) => i.id}
        renderItem={renderBranch}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: Spacing.xxl }} />}
      />

      {/* FAB */}
      <PermissionGuard module="settings" action="add">
        <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
      </PermissionGuard>

      {/* Modal Add/Edit */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editTarget ? 'แก้ไขสาขา' : 'เพิ่มสาขาใหม่'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'code', label: 'รหัสสาขา *', placeholder: 'เช่น HQ, BKK01' },
                { key: 'name', label: 'ชื่อสาขา *', placeholder: 'ชื่อสาขา' },
                { key: 'address', label: 'ที่อยู่', placeholder: 'ที่อยู่สาขา' },
                { key: 'taxId', label: 'เลขผู้เสียภาษี', placeholder: '0000000000000' },
                { key: 'phone', label: 'เบอร์โทร', placeholder: '02-xxx-xxxx' },
                { key: 'manager', label: 'ผู้จัดการสาขา', placeholder: 'ชื่อผู้จัดการ' },
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
                <Text style={styles.modalLabel}>สถานะ</Text>
                <View style={styles.statusToggle}>
                  {(['active', 'inactive'] as const).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.statusOption, form.status === s && styles.statusOptionSelected]}
                      onPress={() => setForm((prev) => ({ ...prev, status: s }))}
                    >
                      <Text style={[styles.statusOptionText, form.status === s && { color: Colors.white }]}>
                        {s === 'active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave}>
              <Text style={styles.modalSaveBtnText}>บันทึก</Text>
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
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  list: { padding: Spacing.md, gap: Spacing.sm },
  branchCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  branchHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  branchCodeBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 44,
    alignItems: 'center',
  },
  branchCode: { ...Typography.label, color: Colors.primary, fontSize: FontSize.sm },
  branchName: { ...Typography.label, color: Colors.text },
  branchManager: { ...Typography.caption, color: Colors.textSecondary },
  statusBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  statusActive: { backgroundColor: Colors.successLight },
  statusInactive: { backgroundColor: Colors.backgroundSecondary },
  statusText: { fontSize: FontSize.caption, fontWeight: '700' },
  editBtn: { padding: 4 },
  branchAddress: { ...Typography.caption, color: Colors.textSecondary },
  branchMeta: { flexDirection: 'row', gap: Spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...Typography.caption, color: Colors.textSecondary },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '85%',
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
  statusToggle: { flexDirection: 'row', gap: Spacing.sm },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statusOptionSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  statusOptionText: { ...Typography.label, color: Colors.text },
  modalSaveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  modalSaveBtnText: { ...Typography.button, color: Colors.white },
});
