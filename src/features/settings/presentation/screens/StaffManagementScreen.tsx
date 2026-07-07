import React, { useState } from 'react';
import { FlatList, Modal, Switch } from 'react-native';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { useEmployeeStore } from '@/features/settings/application/stores/employeeStore';
import {
  Employee, ContractType, EmployeeStatus,
  CONTRACT_TYPE_LABELS, EMPLOYEE_STATUS_LABELS,
  DEPARTMENTS, POSITIONS,
} from '@/features/settings/domain/staff';

interface StaffManagementScreenProps {
  onBack: () => void;
}

const StatusBadge: React.FC<{ status: EmployeeStatus }> = ({ status }) => {
  const colors: Record<EmployeeStatus, string> = {
    active: '#0f766e', inactive: '#9ca3af',
    resigned: '#a16207', terminated: '#ef4444',
  };
  return (
    <View className={cn('flex-row items-center gap-1 px-2 py-0.5 rounded-full')} style={{ backgroundColor: colors[status] + '20' }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors[status] }} />
      <Text className={cn('text-xs font-bold')} style={{ color: colors[status] }}>
        {EMPLOYEE_STATUS_LABELS[status]}
      </Text>
    </View>
  );
};

export const StaffManagementScreen: React.FC<StaffManagementScreenProps> = ({ onBack }) => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, getUserByEmployeeId } = useEmployeeStore();
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchText, setSearchText] = useState('');

  const [confirmDelete, setConfirmDelete] = useState<{ visible: boolean; employee: Employee | null }>({ visible: false, employee: null });
  const [alertDialog, setAlertDialog] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });

  const filtered = employees.filter((e) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    const fullName = `${e.personal.firstName} ${e.personal.lastName} ${e.personal.nickname ?? ''}`.toLowerCase();
    return fullName.includes(q) || e.employeeCode.toLowerCase().includes(q) || e.contact.phone.includes(q);
  });

  const handleDelete = (emp: Employee) => {
    setConfirmDelete({ visible: true, employee: emp });
  };

  const confirmDeleteAction = () => {
    if (confirmDelete.employee) {
      deleteEmployee(confirmDelete.employee.id);
    }
    setConfirmDelete({ visible: false, employee: null });
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
      <TouchableOpacity className={cn('flex-row items-center gap-3 bg-white rounded-2xl p-3 border border-slate-100 shadow-sm')} onPress={() => handleEdit(item)} activeOpacity={0.7}>
        <View className={cn('w-11 h-11 rounded-full bg-slate-100 items-center justify-center')}>
          <Ionicons
            name={item.isTechnician ? 'cut' : 'person'}
            size={20}
            color="#f87171"
          />
        </View>
        <View style={{ flex: 1 }}>
          <View className={cn('flex-row items-center gap-2 flex-wrap')}>
            <Text className={cn('text-xs font-bold text-slate-950')}>
              {item.personal.firstName} {item.personal.lastName}
              {item.personal.nickname ? ` (${item.personal.nickname})` : ''}
            </Text>
            <StatusBadge status={item.status} />
          </View>
          <Text className={cn('text-xs font-medium text-slate-600 mt-0.5')}>
            {item.employeeCode} · {item.employment.position} · {item.employment.department}
          </Text>
          <View className={cn('flex-row items-center gap-1.5 mt-1 flex-wrap')}>
            <Ionicons name="call-outline" size={12} color="#9ca3af" />
            <Text className={cn('text-xs font-medium text-slate-600')}>{item.contact.phone}</Text>
            {user && (
              <>
                <Ionicons name="person-circle-outline" size={12} color="#f87171" />
                <Text className={cn('text-xs font-medium text-rose-500')}>มี User</Text>
              </>
            )}
            {item.isTechnician && (
              <>
                <Ionicons name="cut-outline" size={12} color="#f87171" />
                <Text className={cn('text-xs font-medium text-rose-500')}>ช่างบริการ</Text>
              </>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item)} className={cn('p-2')}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-3 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-lg font-extrabold text-white')}>จัดการพนักงาน</Text>
          <Text className={cn('text-xs font-medium text-rose-100')}>{employees.length} คน</Text>
        </View>
        <TouchableOpacity className={cn('min-h-10 flex-row items-center gap-1 rounded-full bg-rose-500 px-3 py-2')} onPress={handleAdd}>
          <Ionicons name="add" size={20} color="#fafafa" />
          <Text className={cn('text-xs text-white font-bold')}>เพิ่ม</Text>
        </TouchableOpacity>
      </View>

      <View className={cn('px-3 pt-2')}>
        <View className={cn('flex-row items-center gap-2 bg-white rounded-xl px-3 h-10 border border-slate-200 shadow-sm')}>
          <Ionicons name="search-outline" size={16} color="#9ca3af" />
          <TextInput
            className={cn('flex-1 text-base font-medium text-slate-950')}
            placeholder="ค้นหาชื่อ, รหัส, เบอร์โทร..."
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderEmployee}
        contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className={cn('items-center py-16 gap-2')}>
            <Ionicons name="people-outline" size={56} color="#d1d5db" />
            <Text className={cn('text-base font-medium text-gray-400')}>ไม่พบพนักงาน</Text>
          </View>
        }
      />

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
        setAlertDialog={setAlertDialog}
      />

      <ConfirmModal
        visible={confirmDelete.visible}
        title="ลบพนักงาน"
        message={`ต้องการลบ "${confirmDelete.employee?.personal.firstName} ${confirmDelete.employee?.personal.lastName}"?${confirmDelete.employee && getUserByEmployeeId(confirmDelete.employee.id) ? '\nUser Account ที่เชื่อมจะถูกลบด้วย' : ''}`}
        variant="danger"
        confirmLabel="ลบ"
        cancelLabel="ยกเลิก"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ visible: false, employee: null })}
        onClose={() => setConfirmDelete({ visible: false, employee: null })}
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

interface EmployeeFormModalProps {
  visible: boolean;
  employee: Employee | null;
  onSave: (data: Partial<Employee> & { id?: string }) => void;
  onClose: () => void;
  setAlertDialog: (d: { visible: boolean; title: string; message: string }) => void;
}

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({ visible, employee, onSave, onClose, setAlertDialog }) => {
  const isEdit = !!employee;

  const [firstName, setFirstName] = useState(employee?.personal.firstName ?? '');
  const [lastName, setLastName] = useState(employee?.personal.lastName ?? '');
  const [nickname, setNickname] = useState(employee?.personal.nickname ?? '');
  const [idCard, setIdCard] = useState(employee?.personal.idCard ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(employee?.personal.dateOfBirth ?? '');
  const [nationality, setNationality] = useState(employee?.personal.nationality ?? 'ไทย');
  const [registeredAddress, setRegisteredAddress] = useState(employee?.personal.registeredAddress ?? '');
  const [currentAddress, setCurrentAddress] = useState(employee?.personal.currentAddress ?? '');

  const [phone, setPhone] = useState(employee?.contact.phone ?? '');
  const [email, setEmail] = useState(employee?.contact.email ?? '');
  const [lineId, setLineId] = useState(employee?.contact.lineId ?? '');
  const [emergencyName, setEmergencyName] = useState(employee?.contact.emergencyContactName ?? '');
  const [emergencyPhone, setEmergencyPhone] = useState(employee?.contact.emergencyContactPhone ?? '');
  const [emergencyRelation, setEmergencyRelation] = useState(employee?.contact.emergencyContactRelation ?? '');

  const [position, setPosition] = useState(employee?.employment.position ?? '');
  const [department, setDepartment] = useState(employee?.employment.department ?? '');
  const [startDate, setStartDate] = useState(employee?.employment.startDate ?? '');
  const [contractType, setContractType] = useState<ContractType>(employee?.employment.contractType ?? 'permanent');

  const [isTechnician, setIsTechnician] = useState(employee?.isTechnician ?? false);
  const [pdpaConsent, setPdpaConsent] = useState(employee?.documents.pdpaConsent ?? false);

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
      setAlertDialog({ visible: true, title: 'ข้อมูลไม่ครบ', message: 'กรุณากรอกชื่อ-นามสกุล' });
      return;
    }
    if (!phone.trim()) {
      setAlertDialog({ visible: true, title: 'ข้อมูลไม่ครบ', message: 'กรุณากรอกเบอร์โทรศัพท์' });
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
    <View className={cn('mb-2')}>
      <Text className={cn('text-xs font-bold text-slate-600 mb-1')}>{label}{required && <Text style={{ color: '#ef4444' }}> *</Text>}</Text>
      <TextInput
        className={cn('bg-white rounded-xl border border-slate-200 px-3 py-2.5 text-base font-medium text-slate-950', multiline && 'min-h-[70px]')}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')}>
        <View className={cn('flex-row items-center justify-between bg-rose-600 px-3 py-3')}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#fafafa" />
          </TouchableOpacity>
          <Text className={cn('text-lg font-extrabold text-white')}>{isEdit ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงานใหม่'}</Text>
          <TouchableOpacity onPress={handleSave} className={cn('p-2')}>
            <Text className={cn('text-base font-bold text-white')}>บันทึก</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }} keyboardShouldPersistTaps="handled">
          <View className={cn('mt-3 mb-1 flex-row items-center gap-1.5')}>
            <Ionicons name="person-outline" size={14} color="#f43f5e" />
            <Text className={cn('text-xs font-bold text-rose-500')}>ข้อมูลส่วนบุคคล</Text>
          </View>
          <FormField label="ชื่อ" value={firstName} onChangeText={setFirstName} placeholder="ชื่อจริง" required />
          <FormField label="นามสกุล" value={lastName} onChangeText={setLastName} placeholder="นามสกุล" required />
          <FormField label="ชื่อเล่น" value={nickname} onChangeText={setNickname} placeholder="ชื่อเล่น (ไม่บังคับ)" />
          <FormField label="เลขบัตรประชาชน" value={idCard} onChangeText={setIdCard} placeholder="1234567890123" keyboardType="number-pad" maxLength={13} />
          <FormField label="วันเกิด" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" />
          <FormField label="สัญชาติ" value={nationality} onChangeText={setNationality} placeholder="ไทย" />
          <FormField label="ที่อยู่ตามทะเบียนบ้าน" value={registeredAddress} onChangeText={setRegisteredAddress} placeholder="เลขที่ ถนน แขวง เขต จังหวัด" multiline />
          <FormField label="ที่อยู่ปัจจุบัน" value={currentAddress} onChangeText={setCurrentAddress} placeholder="ที่อยู่ปัจจุบัน" multiline />

          <View className={cn('mt-3 mb-1 flex-row items-center gap-1.5')}>
            <Ionicons name="call-outline" size={14} color="#f43f5e" />
            <Text className={cn('text-xs font-bold text-rose-500')}>ช่องทางติดต่อ</Text>
          </View>
          <FormField label="เบอร์โทรศัพท์" value={phone} onChangeText={setPhone} placeholder="0812345678" keyboardType="phone-pad" required />
          <FormField label="อีเมล" value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" />
          <FormField label="Line ID" value={lineId} onChangeText={setLineId} placeholder="Line ID (ไม่บังคับ)" />
          <FormField label="บุคคลติดต่อฉุกเฉิน" value={emergencyName} onChangeText={setEmergencyName} placeholder="ชื่อ-สกุล" />
          <FormField label="เบอร์ฉุกเฉิน" value={emergencyPhone} onChangeText={setEmergencyPhone} placeholder="เบอร์โทร" keyboardType="phone-pad" />
          <FormField label="ความสัมพันธ์" value={emergencyRelation} onChangeText={setEmergencyRelation} placeholder="เช่น มารดา, ภรรยา" />

          <View className={cn('mt-3 mb-1 flex-row items-center gap-1.5')}>
            <Ionicons name="briefcase-outline" size={14} color="#f43f5e" />
            <Text className={cn('text-xs font-bold text-rose-500')}>ข้อมูลการจ้างงาน</Text>
          </View>
          <FormField label="ตำแหน่ง" value={position} onChangeText={setPosition} placeholder="เช่น แคชเชียร์, ช่างตัดผม" />
          <FormField label="แผนก" value={department} onChangeText={setDepartment} placeholder="เช่น ขาย, บริการ" />
          <FormField label="วันที่เริ่มงาน" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />

          <View className={cn('mb-2')}>
            <Text className={cn('text-xs font-bold text-slate-600 mb-1')}>ประเภทสัญญาจ้าง</Text>
            <View className={cn('flex-row flex-wrap gap-1')}>
              {(['probation', 'permanent', 'temporary', 'parttime'] as ContractType[]).map((ct) => (
                <TouchableOpacity
                  key={ct}
                  className={cn('px-2 py-1.5 rounded-full bg-slate-100 border border-slate-200', contractType === ct && 'bg-rose-500 border-rose-500')}
                  onPress={() => setContractType(ct)}
                >
                  <Text className={cn('text-xs font-medium text-slate-600', contractType === ct && 'text-white font-bold')}>
                    {CONTRACT_TYPE_LABELS[ct]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className={cn('flex-row items-center justify-between bg-white rounded-xl p-3 mb-2 border border-slate-100 shadow-sm')}>
            <View>
              <Text className={cn('text-xs font-bold text-slate-950')}>เป็นช่าง/พนักงานบริการ</Text>
              <Text className={cn('text-xs font-medium text-slate-600')}>แสดงใน popup เลือกช่างหน้า POS</Text>
            </View>
            <Switch
              value={isTechnician}
              onValueChange={setIsTechnician}
            />
          </View>

          <View className={cn('flex-row items-center justify-between bg-white rounded-xl p-3 mb-2 border border-slate-100 shadow-sm')}>
            <View>
              <Text className={cn('text-xs font-bold text-slate-950')}>ยินยอม PDPA</Text>
              <Text className={cn('text-xs font-medium text-slate-600')}>ยินยอมเปิดเผยข้อมูลส่วนบุคคล</Text>
            </View>
            <Switch
              value={pdpaConsent}
              onValueChange={setPdpaConsent}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
