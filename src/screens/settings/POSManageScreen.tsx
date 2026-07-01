/**
 * SCR-SET-006 POSManageScreen
 * จัดการจุดขาย (POS)
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

interface POSDevice {
  id: string;
  code: string;
  name: string;
  branchId: string;
  branchName: string;
  prefix: string;
  runningNumber: number;
  printerType: 'bluetooth' | 'wifi' | 'usb' | 'none';
  printerStatus: 'connected' | 'disconnected';
  receiptTemplate: 'simple' | 'full' | 'tax_invoice';
  assignedUsers: string[];
  status: 'active' | 'inactive';
}

const MOCK_POS: POSDevice[] = [
  {
    id: 'pos_001',
    code: 'POS-001',
    name: 'เคาน์เตอร์หลัก',
    branchId: 'br_001',
    branchName: 'สาขาหลัก',
    prefix: 'INV',
    runningNumber: 1087,
    printerType: 'bluetooth',
    printerStatus: 'connected',
    receiptTemplate: 'full',
    assignedUsers: ['มานี ผู้จัดการ', 'สุดา แคชเชียร์'],
    status: 'active',
  },
  {
    id: 'pos_002',
    code: 'POS-002',
    name: 'เคาน์เตอร์สำรอง',
    branchId: 'br_001',
    branchName: 'สาขาหลัก',
    prefix: 'INV',
    runningNumber: 245,
    printerType: 'wifi',
    printerStatus: 'disconnected',
    receiptTemplate: 'simple',
    assignedUsers: ['สุดา แคชเชียร์'],
    status: 'active',
  },
  {
    id: 'pos_003',
    code: 'POS-003',
    name: 'จุดขาย LPL',
    branchId: 'br_002',
    branchName: 'สาขาลาดพร้าว',
    prefix: 'LPL',
    runningNumber: 512,
    printerType: 'usb',
    printerStatus: 'connected',
    receiptTemplate: 'tax_invoice',
    assignedUsers: ['วิชัย พนักงานคลัง'],
    status: 'active',
  },
];

const PRINTER_ICONS: Record<string, string> = {
  bluetooth: 'bluetooth-outline',
  wifi: 'wifi-outline',
  usb: 'hardware-chip-outline',
  none: 'print-outline',
};

const TEMPLATE_LABELS: Record<string, string> = {
  simple: 'Simple',
  full: 'Full (พร้อม VAT)',
  tax_invoice: 'ใบกำกับภาษี',
};

interface POSManageScreenProps {
  onBack: () => void;
}

const EMPTY_POS: Omit<POSDevice, 'id' | 'runningNumber'> = {
  code: '',
  name: '',
  branchId: 'br_001',
  branchName: 'สาขาหลัก',
  prefix: 'INV',
  printerType: 'bluetooth',
  printerStatus: 'disconnected',
  receiptTemplate: 'simple',
  assignedUsers: [],
  status: 'active',
};

export const POSManageScreen: React.FC<POSManageScreenProps> = ({ onBack }) => {
  const { isOwner, isAdmin, isManager } = usePermission();
  const { addAuditLog, currentRole } = usePermissionStore();
  const canEdit = isOwner || isAdmin || isManager;

  const [posList, setPosList] = useState<POSDevice[]>(MOCK_POS);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<POSDevice | null>(null);
  const [form, setForm] = useState<Omit<POSDevice, 'id' | 'runningNumber'>>(EMPTY_POS);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_POS);
    setModalVisible(true);
  };

  const openEdit = (pos: POSDevice) => {
    setEditTarget(pos);
    const { id, runningNumber, ...rest } = pos;
    setForm(rest);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!form.code || !form.name) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกรหัสและชื่อ POS');
      return;
    }
    if (editTarget) {
      setPosList((prev) =>
        prev.map((p) => (p.id === editTarget.id ? { ...editTarget, ...form } : p))
      );
      addAuditLog({
        userId: 'usr_001',
        userName: 'สมชาย เจ้าของร้าน',
        userRole: currentRole,
        action: 'POS_EDIT',
        module: 'settings',
        description: `แก้ไข POS: ${form.name}`,
      });
    } else {
      const newPos: POSDevice = { ...form, id: `pos_${Date.now()}`, runningNumber: 1 };
      setPosList((prev) => [...prev, newPos]);
      addAuditLog({
        userId: 'usr_001',
        userName: 'สมชาย เจ้าของร้าน',
        userRole: currentRole,
        action: 'POS_ADD',
        module: 'settings',
        description: `เพิ่ม POS ใหม่: ${form.name} (${form.code})`,
      });
    }
    setModalVisible(false);
  };

  const renderPOS = ({ item }: { item: POSDevice }) => (
    <View style={styles.posCard}>
      <View style={styles.posCardHeader}>
        <View style={styles.posCodeBadge}>
          <Ionicons name="desktop-outline" size={14} color={Colors.primary} />
          <Text style={styles.posCode}>{item.code}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.posName}>{item.name}</Text>
          <Text style={styles.posBranch}>{item.branchName}</Text>
        </View>
        <View style={[
          styles.printerStatus,
          item.printerStatus === 'connected' ? styles.printerOn : styles.printerOff,
        ]}>
          <Ionicons
            name={PRINTER_ICONS[item.printerType] as any}
            size={12}
            color={item.printerStatus === 'connected' ? Colors.success : Colors.gray400}
          />
          <Text style={[
            styles.printerStatusText,
            { color: item.printerStatus === 'connected' ? Colors.success : Colors.gray400 },
          ]}>
            {item.printerStatus === 'connected' ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}
          </Text>
        </View>
      </View>

      <View style={styles.posMeta}>
        <View style={styles.posMetaItem}>
          <Ionicons name="document-text-outline" size={12} color={Colors.textSecondary} />
          <Text style={styles.posMetaText}>Prefix: {item.prefix}-{String(item.runningNumber).padStart(5, '0')}</Text>
        </View>
        <View style={styles.posMetaItem}>
          <Ionicons name="receipt-outline" size={12} color={Colors.textSecondary} />
          <Text style={styles.posMetaText}>{TEMPLATE_LABELS[item.receiptTemplate]}</Text>
        </View>
      </View>

      <View style={styles.posUsers}>
        <Ionicons name="people-outline" size={12} color={Colors.textSecondary} />
        <Text style={styles.posMetaText}>{item.assignedUsers.join(', ') || 'ยังไม่ได้กำหนดผู้ใช้'}</Text>
      </View>

      <PermissionGuard module="settings" action="edit">
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
          <Ionicons name="create-outline" size={14} color={Colors.primary} />
          <Text style={styles.editBtnText}>แก้ไข</Text>
        </TouchableOpacity>
      </PermissionGuard>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>จัดการจุดขาย (POS)</Text>
          <Text style={styles.headerSub}>{posList.length} เครื่อง</Text>
        </View>
        <Ionicons name="desktop-outline" size={24} color="rgba(255,255,255,0.7)" />
      </View>

      <FlatList
        data={posList}
        keyExtractor={(i) => i.id}
        renderItem={renderPOS}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: Spacing.xxl }} />}
      />

      <PermissionGuard module="settings" action="add">
        <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
      </PermissionGuard>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editTarget ? 'แก้ไข POS' : 'เพิ่ม POS ใหม่'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'code', label: 'รหัส POS *', placeholder: 'POS-001' },
                { key: 'name', label: 'ชื่อจุดขาย *', placeholder: 'เคาน์เตอร์หลัก' },
                { key: 'prefix', label: 'Prefix เอกสาร', placeholder: 'INV' },
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
                <Text style={styles.modalLabel}>ประเภทเครื่องพิมพ์</Text>
                <View style={styles.optionGroup}>
                  {(['bluetooth', 'wifi', 'usb', 'none'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.optionBtn, form.printerType === t && styles.optionBtnSelected]}
                      onPress={() => setForm((prev) => ({ ...prev, printerType: t }))}
                    >
                      <Text style={[styles.optionBtnText, form.printerType === t && { color: Colors.white }]}>
                        {t === 'none' ? 'ไม่มี' : t.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Template ใบเสร็จ</Text>
                <View style={styles.optionGroup}>
                  {(['simple', 'full', 'tax_invoice'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.optionBtn, form.receiptTemplate === t && styles.optionBtnSelected]}
                      onPress={() => setForm((prev) => ({ ...prev, receiptTemplate: t }))}
                    >
                      <Text style={[styles.optionBtnText, form.receiptTemplate === t && { color: Colors.white }]}>
                        {TEMPLATE_LABELS[t]}
                      </Text>
                    </TouchableOpacity>
                  ))}
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
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  list: { padding: Spacing.md, gap: Spacing.sm },
  posCard: {
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
  posCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  posCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  posCode: { fontSize: FontSize.caption, fontWeight: '700', color: Colors.primary },
  posName: { ...Typography.label, color: Colors.text },
  posBranch: { ...Typography.caption, color: Colors.textSecondary },
  printerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  printerOn: { backgroundColor: Colors.successLight },
  printerOff: { backgroundColor: Colors.backgroundSecondary },
  printerStatusText: { fontSize: FontSize.xs, fontWeight: '600' },
  posMeta: { flexDirection: 'row', gap: Spacing.md },
  posMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  posMetaText: { ...Typography.caption, color: Colors.textSecondary },
  posUsers: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  editBtnText: { ...Typography.caption, color: Colors.primary },
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
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
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
  optionGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  optionBtn: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionBtnSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionBtnText: { ...Typography.caption, color: Colors.textSecondary },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  saveBtnText: { ...Typography.button, color: Colors.white },
});
