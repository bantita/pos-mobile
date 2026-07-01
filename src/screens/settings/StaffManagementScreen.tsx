/**
 * SCR-SET-STAFF — จัดการพนักงาน
 * แสดงรายชื่อพนักงาน + เพิ่ม/แก้ไข/ลบ
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Alert, Modal, ScrollView, TextInput, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { useEmployeeStore } from '../../store/employeeStore';
import {
  Employee, ContractType, EmployeeStatus,
  CONTRACT_TYPE_LABELS, EMPLOYEE_STATUS_LABELS,
  DEPARTMENTS, POSITIONS,
} from '../../types/staff';

interface StaffManagementScreenProps {
  onBack: () => void;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: EmployeeStatus }> = ({ status }) => {
  const colors: Record<EmployeeStatus, string> = {
    active: Colors.success, inactive: Colors.gray400,
    resigned: Colors.warning, terminated: Colors.danger,
  };
  return (
    <View style={[badgeStyles.badge, { backgroundColor: colors[status] + '20' }]}>
      <View style={[badgeStyles.dot, { backgroundColor: colors[status] }]} />
      <Text style={[badgeStyles.text, { color: colors[status] }]}>
        {EMPLOYEE_STATUS_LABELS[status]}
      </Text>
    </View>
  );
};
const badgeStyles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: FontSize.caption, fontWeight: '600' },
});

// ─── Main Component ───────────────────────────────────────────────────────────
export const StaffManagementScreen: React.FC<StaffManagementScreenProps> = ({ onBack }) => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, getUserByEmployeeId } = useEmployeeStore();
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchText, setSearchText] = useState('');

  const filtered = employees.filter((e) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    const fullName = `${e.personal.firstName} ${e.personal.lastName} ${e.personal.nickname ?? ''}`.toLowerCase();
    return fullName.includes(q) || e.employeeCode.toLowerCase().includes(q) || e.contact.phone.includes(q);
  });

  const handleDelete = (emp: Employee) => {
    const user = getUserByEmployeeId(emp.id);
    Alert.alert(
      'ลบพนักงาน',
      `ต้องการลบ "${emp.personal.firstName} ${emp.personal.lastName}"?${user ? '\n⚠️ User Account ที่เชื่อมจะถูกลบด้วย' : ''}`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ลบ', style: 'destructive', onPress: () => deleteEmployee(emp.id) },
      ]
    );
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setShowForm(true);
  };

  const renderEmployee = ({ item }: { item: Employee }) => {
    const user = getUserByEmployeeId(item.id);
    return (
      <TouchableOpacity style={styles.card} onPress={() => handleEdit(item)} activeOpacity={0.7}>
        <View style={[styles.avatar, item.isTechnician && styles.avatarTech]}>
          <Ionicons
            name={item.isTechnician ? 'cut' : 'person'}
            size={20}
            color={item.isTechnician ? Colors.category1 : Colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {item.personal.firstName} {item.personal.lastName}
              {item.personal.nickname ? ` (${item.personal.nickname})` : ''}
            </Text>
            <StatusBadge status={item.status} />
          </View>
          <Text style={styles.meta}>
            {item.employeeCode} · {item.employment.position} · {item.employment.department}
          </Text>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={12} color={Colors.gray400} />
            <Text style={styles.infoText}>{item.contact.phone}</Text>
            {user && (
              <>
                <Ionicons name="person-circle-outline" size={12} color={Colors.primary} />
                <Text style={[styles.infoText, { color: Colors.primary }]}>มี User</Text>
              </>
            )}
            {item.isTechnician && (
              <>
                <Ionicons name="cut-outline" size={12} color={Colors.category1} />
                <Text style={[styles.infoText, { color: Colors.category1 }]}>ช่างบริการ</Text>
              </>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
        </TouchableOpacity>
      </TouchableOpacity>
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
          <Text style={styles.headerTitle}>จัดการพนักงาน</Text>
          <Text style={styles.headerSub}>{employees.length} คน</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={styles.addBtnText}>เพิ่ม</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาชื่อ, รหัส, เบอร์โทร..."
            placeholderTextColor={Colors.gray400}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={16} color={Colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderEmployee}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={56} color={Colors.gray300} />
            <Text style={styles.emptyText}>ไม่พบพนักงาน</Text>
          </View>
        }
      />

      {/* Form Modal */}
      <EmployeeFormModal
        visible={showForm}
        employee={editingEmployee}
        onSave={(emp) => {
          if (editingEmployee) {
            updateEmployee(editingEmployee.id, emp);
          } else {
            addEmployee(emp as Employee);
          }
          setShowForm(false);
          setEditingEmployee(null);
        }}
        onClose={() => { setShowForm(false); setEditingEmployee(null); }}
      />
    </SafeAreaView>
  );
};

// ─── Employee Form Modal ──────────────────────────────────────────────────────
interface EmployeeFormModalProps {
  visible: boolean;
  employee: Employee | null;
  onSave: (data: Partial<Employee> & { id?: string }) => void;
  onClose: () => void;
}

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({ visible, employee, onSave, onClose }) => {
  const isEdit = !!employee;

  // Personal
  const [firstName, setFirstName] = useState(employee?.personal.firstName ?? '');
  const [lastName, setLastName] = useState(employee?.personal.lastName ?? '');
  const [nickname, setNickname] = useState(employee?.personal.nickname ?? '');
  const [idCard, setIdCard] = useState(employee?.personal.idCard ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(employee?.personal.dateOfBirth ?? '');
  const [nationality, setNationality] = useState(employee?.personal.nationality ?? 'ไทย');
  const [registeredAddress, setRegisteredAddress] = useState(employee?.personal.registeredAddress ?? '');
  const [currentAddress, setCurrentAddress] = useState(employee?.personal.currentAddress ?? '');

  // Contact
  const [phone, setPhone] = useState(employee?.contact.phone ?? '');
  const [email, setEmail] = useState(employee?.contact.email ?? '');
  const [lineId, setLineId] = useState(employee?.contact.lineId ?? '');
  const [emergencyName, setEmergencyName] = useState(employee?.contact.emergencyContactName ?? '');
  const [emergencyPhone, setEmergencyPhone] = useState(employee?.contact.emergencyContactPhone ?? '');
  const [emergencyRelation, setEmergencyRelation] = useState(employee?.contact.emergencyContactRelation ?? '');

  // Employment
  const [position, setPosition] = useState(employee?.employment.position ?? '');
  const [department, setDepartment] = useState(employee?.employment.department ?? '');
  const [startDate, setStartDate] = useState(employee?.employment.startDate ?? '');
  const [contractType, setContractType] = useState<ContractType>(employee?.employment.contractType ?? 'permanent');

  // Flags
  const [isTechnician, setIsTechnician] = useState(employee?.isTechnician ?? false);
  const [pdpaConsent, setPdpaConsent] = useState(employee?.documents.pdpaConsent ?? false);

  // Reset form when employee changes
  React.useEffect(() => {
    if (visible) {
      setFirstName(employee?.personal.firstName ?? '');
      setLastName(employee?.personal.lastName ?? '');
      setNickname(employee?.personal.nickname ?? '');
      setIdCard(employee?.personal.idCard ?? '');
      setDateOfBirth(employee?.personal.dateOfBirth ?? '');
      setNationality(employee?.personal.nationality ?? 'ไทย');
      setRegisteredAddress(employee?.personal.registeredAddress ?? '');
      setCurrentAddress(employee?.personal.currentAddress ?? '');
      setPhone(employee?.contact.phone ?? '');
      setEmail(employee?.contact.email ?? '');
      setLineId(employee?.contact.lineId ?? '');
      setEmergencyName(employee?.contact.emergencyContactName ?? '');
      setEmergencyPhone(employee?.contact.emergencyContactPhone ?? '');
      setEmergencyRelation(employee?.contact.emergencyContactRelation ?? '');
      setPosition(employee?.employment.position ?? '');
      setDepartment(employee?.employment.department ?? '');
      setStartDate(employee?.employment.startDate ?? '');
      setContractType(employee?.employment.contractType ?? 'permanent');
      setIsTechnician(employee?.isTechnician ?? false);
      setPdpaConsent(employee?.documents.pdpaConsent ?? false);
    }
  }, [visible, employee]);

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อ-นามสกุล');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกเบอร์โทรศัพท์');
      return;
    }

    const data: Employee = {
      id: employee?.id ?? `emp-${Date.now()}`,
      employeeCode: employee?.employeeCode ?? `EMP${String(Date.now()).slice(-4)}`,
      personal: {
        firstName, lastName, nickname: nickname || undefined,
        idCard, dateOfBirth, nationality,
        registeredAddress, currentAddress,
      },
      contact: {
        phone, email: email || undefined, lineId: lineId || undefined,
        emergencyContactName: emergencyName,
        emergencyContactPhone: emergencyPhone,
        emergencyContactRelation: emergencyRelation,
      },
      documents: {
        idCardCopy: false, houseCopy: false, photoUploaded: false,
        pdpaConsent, pdpaConsentDate: pdpaConsent ? new Date().toISOString().slice(0, 10) : undefined,
      },
      employment: {
        position, department, startDate,
        contractType,
      },
      status: employee?.status ?? 'active',
      isTechnician,
      technicianStatus: isTechnician ? 'available' : undefined,
      createdAt: employee?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    onSave(data);
  };

  const FormField: React.FC<{
    label: string; value: string; onChangeText: (t: string) => void;
    placeholder?: string; required?: boolean; keyboardType?: any; maxLength?: number; multiline?: boolean;
  }> = ({ label, value, onChangeText, placeholder, required, keyboardType, maxLength, multiline }) => (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}{required && <Text style={{ color: Colors.danger }}> *</Text>}</Text>
      <TextInput
        style={[formStyles.input, multiline && formStyles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray400}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={formStyles.container}>
        {/* Header */}
        <View style={formStyles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={formStyles.headerTitle}>{isEdit ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงานใหม่'}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={formStyles.saveText}>บันทึก</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={formStyles.scroll} keyboardShouldPersistTaps="handled">
          {/* ข้อมูลส่วนบุคคล */}
          <Text style={formStyles.sectionTitle}>👤 ข้อมูลส่วนบุคคล</Text>
          <FormField label="ชื่อ" value={firstName} onChangeText={setFirstName} placeholder="ชื่อจริง" required />
          <FormField label="นามสกุล" value={lastName} onChangeText={setLastName} placeholder="นามสกุล" required />
          <FormField label="ชื่อเล่น" value={nickname} onChangeText={setNickname} placeholder="ชื่อเล่น (ไม่บังคับ)" />
          <FormField label="เลขบัตรประชาชน" value={idCard} onChangeText={setIdCard} placeholder="1234567890123" keyboardType="number-pad" maxLength={13} />
          <FormField label="วันเกิด" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" />
          <FormField label="สัญชาติ" value={nationality} onChangeText={setNationality} placeholder="ไทย" />
          <FormField label="ที่อยู่ตามทะเบียนบ้าน" value={registeredAddress} onChangeText={setRegisteredAddress} placeholder="เลขที่ ถนน แขวง เขต จังหวัด" multiline />
          <FormField label="ที่อยู่ปัจจุบัน" value={currentAddress} onChangeText={setCurrentAddress} placeholder="ที่อยู่ปัจจุบัน" multiline />

          {/* ช่องทางติดต่อ */}
          <Text style={formStyles.sectionTitle}>📞 ช่องทางติดต่อ</Text>
          <FormField label="เบอร์โทรศัพท์" value={phone} onChangeText={setPhone} placeholder="0812345678" keyboardType="phone-pad" required />
          <FormField label="อีเมล" value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" />
          <FormField label="Line ID" value={lineId} onChangeText={setLineId} placeholder="Line ID (ไม่บังคับ)" />
          <FormField label="บุคคลติดต่อฉุกเฉิน" value={emergencyName} onChangeText={setEmergencyName} placeholder="ชื่อ-สกุล" />
          <FormField label="เบอร์ฉุกเฉิน" value={emergencyPhone} onChangeText={setEmergencyPhone} placeholder="เบอร์โทร" keyboardType="phone-pad" />
          <FormField label="ความสัมพันธ์" value={emergencyRelation} onChangeText={setEmergencyRelation} placeholder="เช่น มารดา, ภรรยา" />

          {/* ข้อมูลการจ้างงาน */}
          <Text style={formStyles.sectionTitle}>💼 ข้อมูลการจ้างงาน</Text>
          <FormField label="ตำแหน่ง" value={position} onChangeText={setPosition} placeholder="เช่น แคชเชียร์, ช่างตัดผม" />
          <FormField label="แผนก" value={department} onChangeText={setDepartment} placeholder="เช่น ขาย, บริการ" />
          <FormField label="วันที่เริ่มงาน" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />

          {/* ประเภทสัญญา */}
          <View style={formStyles.field}>
            <Text style={formStyles.label}>ประเภทสัญญาจ้าง</Text>
            <View style={formStyles.chipRow}>
              {(['probation', 'permanent', 'temporary', 'parttime'] as ContractType[]).map((ct) => (
                <TouchableOpacity
                  key={ct}
                  style={[formStyles.chip, contractType === ct && formStyles.chipActive]}
                  onPress={() => setContractType(ct)}
                >
                  <Text style={[formStyles.chipText, contractType === ct && formStyles.chipTextActive]}>
                    {CONTRACT_TYPE_LABELS[ct]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ช่างบริการ */}
          <View style={formStyles.switchRow}>
            <View>
              <Text style={formStyles.switchLabel}>เป็นช่าง/พนักงานบริการ</Text>
              <Text style={formStyles.switchSub}>แสดงใน popup เลือกช่างหน้า POS</Text>
            </View>
            <Switch
              value={isTechnician}
              onValueChange={setIsTechnician}
              trackColor={{ true: Colors.category1, false: Colors.gray200 }}
              thumbColor={Colors.white}
            />
          </View>

          {/* PDPA */}
          <View style={formStyles.switchRow}>
            <View>
              <Text style={formStyles.switchLabel}>ยินยอม PDPA</Text>
              <Text style={formStyles.switchSub}>ยินยอมเปิดเผยข้อมูลส่วนบุคคล</Text>
            </View>
            <Switch
              value={pdpaConsent}
              onValueChange={setPdpaConsent}
              trackColor={{ true: Colors.success, false: Colors.gray200 }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const formStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  headerTitle: { ...Typography.h4, color: Colors.white },
  saveText: { ...Typography.button, color: Colors.white },
  scroll: { padding: Spacing.md, gap: Spacing.sm },
  sectionTitle: { ...Typography.label, color: Colors.primary, fontWeight: '700', marginTop: Spacing.md, marginBottom: Spacing.xs },
  field: { marginBottom: Spacing.sm },
  label: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600', marginBottom: 4 },
  input: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    ...Typography.body2, color: Colors.text,
  },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: {
    paddingHorizontal: Spacing.sm, paddingVertical: 6,
    borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { ...Typography.caption, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white, fontWeight: '700' },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  switchLabel: { ...Typography.label, color: Colors.text },
  switchSub: { ...Typography.caption, color: Colors.textSecondary },
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
  searchWrap: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, height: 40,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, ...Typography.body2, color: Colors.text },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  avatarTech: { backgroundColor: Colors.primaryLight },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  name: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  meta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  infoText: { ...Typography.caption, color: Colors.textSecondary },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.sm },
  emptyText: { ...Typography.body1, color: Colors.gray400 },
});
