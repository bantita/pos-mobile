/**
 * WebUserStaffScreen — จัดการผู้ใช้งาน + พนักงาน (Modern UI)
 * Listing → กดเข้าฟอร์ม modern ข้อมูลครบ
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { Colors, Space, Radius, Shadow, Font } from '../../design-system/tokens';
import { useEmployeeStore } from '../../store/employeeStore';
import { usePOSPermissionStore } from '../../store/posPermissionStore';
import { LookupCheckbox } from '../../components/ui/LookupCheckbox';
import {
  Employee, UserAccount, UserRole,
  USER_ROLE_LABELS, CONTRACT_TYPE_LABELS, ContractType,
  EMPLOYEE_STATUS_LABELS, DEPARTMENTS, POSITIONS,
} from '../../types/staff';

const ROLE_COLORS: Record<UserRole, string> = {
  owner: WebColors.purple, manager: WebColors.info, cashier: WebColors.success,
  stock_staff: WebColors.warning, report_viewer: WebColors.primary, admin: Colors.textSecondary,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export const WebUserStaffScreen: React.FC = () => {
  const {
    employees, users, getEmployee,
    addEmployee, updateEmployee, deleteEmployee,
    addUser, updateUser, deleteUser, getEmployeesWithoutUser,
  } = useEmployeeStore();

  const { users: posUsers, generatePin: genPosPin, addUser: addPosUser, updateUser: updatePosUser } = usePOSPermissionStore();

  type ViewMode = 'list' | 'user-form' | 'staff-form';
  const [view, setView] = useState<ViewMode>('list');
  const [tab, setTab] = useState<'users' | 'staff'>('users');
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<UserAccount | null>(null);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const emp = getEmployee(u.employeeId);
    const n = emp ? `${emp.personal.firstName} ${emp.personal.lastName} ${emp.personal.nickname ?? ''}` : u.username;
    return n.toLowerCase().includes(search.toLowerCase()) || u.username.includes(search);
  });
  const filteredStaff = employees.filter(e => {
    if (!search) return true;
    return `${e.personal.firstName} ${e.personal.lastName} ${e.personal.nickname ?? ''} ${e.employeeCode} ${e.contact.phone}`
      .toLowerCase().includes(search.toLowerCase());
  });

  if (view === 'user-form') return (
    <UserFormView
      user={editUser}
      employees={employees}
      getEmployee={getEmployee}
      availableEmployees={getEmployeesWithoutUser()}
      onSave={(data) => { editUser ? updateUser(editUser.id, data) : addUser(data as UserAccount); setView('list'); }}
      onBack={() => setView('list')}
    />
  );
  if (view === 'staff-form') return (
    <StaffFormView
      employee={editEmp}
      onSave={(data) => { editEmp ? updateEmployee(editEmp.id, data) : addEmployee(data as Employee); setView('list'); }}
      onBack={() => setView('list')}
    />
  );

  return (
    <View style={ls.root}>
      {/* Top bar */}
      <View style={ls.topBar}>
        <View style={ls.tabs}>
          {(['users', 'staff'] as const).map(t => (
            <TouchableOpacity key={t} style={[ls.tab, tab === t && ls.tabActive]} onPress={() => setTab(t)}>
              <Ionicons name={t === 'users' ? 'people' : 'person'} size={15} color={tab === t ? WebColors.white : Colors.textSecondary} />
              <Text style={[ls.tabText, tab === t && ls.tabTextActive]}>
                {t === 'users' ? `ผู้ใช้งาน (${users.length})` : `พนักงาน (${employees.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={ls.searchWrap}>
          <Ionicons name="search" size={14} color={WebColors.textDisabled} />
          <TextInput style={ls.searchInput} placeholder="ค้นหา..." placeholderTextColor={WebColors.textDisabled} value={search} onChangeText={setSearch} />
        </View>
        <TouchableOpacity
          style={ls.addBtn}
          onPress={() => {
            if (tab === 'users') { setEditUser(null); setView('user-form'); }
            else { setEditEmp(null); setView('staff-form'); }
          }}
        >
          <Ionicons name="add" size={16} color={WebColors.white} />
          <Text style={ls.addBtnText}>{tab === 'users' ? 'เพิ่มผู้ใช้' : 'เพิ่มพนักงาน'}</Text>
        </TouchableOpacity>
      </View>

      {/* Listing - Table */}
      <ScrollView style={ls.scroll} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20, paddingTop: 12 }}>
        {tab === 'users' ? (
          <View style={ls.table}>
            <View style={ls.thead}>
              <Text style={[ls.th, { flex: 0.4 }]}>#</Text>
              <Text style={[ls.th, { flex: 2 }]}>ชื่อ-สกุล</Text>
              <Text style={[ls.th, { flex: 1.2 }]}>Username</Text>
              <Text style={[ls.th, { flex: 0.6 }]}>PIN</Text>
              <Text style={[ls.th, { flex: 1 }]}>แผนก</Text>
              <Text style={[ls.th, { flex: 1 }]}>บทบาท</Text>
              <Text style={[ls.th, { flex: 1.2 }]}>Login ล่าสุด</Text>
              <Text style={[ls.th, { flex: 0.7 }]}>สถานะ</Text>
              <Text style={[ls.th, { flex: 1.2 }]}>จัดการ</Text>
            </View>
            {filteredUsers.map((u, idx) => {
              const emp = getEmployee(u.employeeId);
              const posUser = posUsers.find(pu => pu.name.includes(u.username) || (emp && pu.name.includes(emp.personal.firstName)));
              const handleGenPin = (e: any) => {
                e.stopPropagation?.();
                if (posUser) {
                  updatePosUser(posUser.id, { pin: genPosPin() });
                } else {
                  const pin = genPosPin();
                  addPosUser({ name: emp ? `${emp.personal.firstName} ${emp.personal.lastName}` : u.username, pin, role: u.role, permissions: [] });
                }
              };
              return (
                <TouchableOpacity key={u.id} style={[ls.tr, idx % 2 === 1 && ls.trAlt]} onPress={() => { setEditUser(u); setView('user-form'); }}>
                  <Text style={[ls.td, { flex: 0.4 }]}>{idx + 1}</Text>
                  <View style={[ls.tdRow, { flex: 2 }]}>
                    <View style={[ls.avatarSm, { backgroundColor: ROLE_COLORS[u.role] + '20' }]}>
                      <Ionicons name="person" size={13} color={ROLE_COLORS[u.role]} />
                    </View>
                    <Text style={ls.tdBold}>{emp ? `${emp.personal.firstName} ${emp.personal.lastName}` : '—'}</Text>
                  </View>
                  <Text style={[ls.td, { flex: 1.2 }]}>{u.username}</Text>
                  <Text style={[ls.td, { flex: 0.6, fontWeight: '700', color: WebColors.purple, fontFamily: 'monospace', textAlign: 'center' }]}>{posUser?.pin ?? '—'}</Text>
                  <Text style={[ls.td, { flex: 1 }]}>{emp?.employment.department ?? '—'}</Text>
                  <View style={[ls.tdRow, { flex: 1 }]}>
                    <View style={[ls.badge, { backgroundColor: ROLE_COLORS[u.role] + '15' }]}>
                      <Text style={[ls.badgeText, { color: ROLE_COLORS[u.role] }]}>{USER_ROLE_LABELS[u.role]}</Text>
                    </View>
                  </View>
                  <Text style={[ls.td, { flex: 1.2 }]}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('th-TH') : '—'}</Text>
                  <View style={[ls.tdRow, { flex: 0.7 }]}>
                    <View style={[ls.statusDot, { backgroundColor: u.status === 'active' ? WebColors.success : WebColors.warning }]} />
                    <Text style={ls.tdSm}>{u.status === 'active' ? 'ใช้งาน' : 'ระงับ'}</Text>
                  </View>
                  <View style={[ls.tdRow, { flex: 1.2, gap: 6 }]}>
                    <TouchableOpacity onPress={handleGenPin} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="refresh" size={14} color={WebColors.warning} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setEditUser(u); setView('user-form'); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="create-outline" size={15} color={WebColors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { if (confirm('ลบผู้ใช้?')) deleteUser(u.id); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="trash-outline" size={15} color={WebColors.danger} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
            {filteredUsers.length === 0 && <Text style={ls.empty}>ไม่พบข้อมูล</Text>}
          </View>
        ) : (
          <View style={ls.table}>
            <View style={ls.thead}>
              <Text style={[ls.th, { flex: 0.4 }]}>#</Text>
              <Text style={[ls.th, { flex: 0.8 }]}>รหัส</Text>
              <Text style={[ls.th, { flex: 2 }]}>ชื่อ-สกุล</Text>
              <Text style={[ls.th, { flex: 1 }]}>ตำแหน่ง</Text>
              <Text style={[ls.th, { flex: 0.8 }]}>แผนก</Text>
              <Text style={[ls.th, { flex: 1 }]}>เบอร์โทร</Text>
              <Text style={[ls.th, { flex: 0.6 }]}>ช่าง</Text>
              <Text style={[ls.th, { flex: 0.7 }]}>สถานะ</Text>
              <Text style={[ls.th, { flex: 0.6 }]}>จัดการ</Text>
            </View>
            {filteredStaff.map((e, idx) => (
              <TouchableOpacity key={e.id} style={[ls.tr, idx % 2 === 1 && ls.trAlt]} onPress={() => { setEditEmp(e); setView('staff-form'); }}>
                <Text style={[ls.td, { flex: 0.4 }]}>{idx + 1}</Text>
                <Text style={[ls.td, { flex: 0.8, fontWeight: '600' }]}>{e.employeeCode}</Text>
                <View style={[ls.tdRow, { flex: 2 }]}>
                  <View style={[ls.avatarSm, { backgroundColor: e.isTechnician ? WebColors.purpleLight : WebColors.infoLight }]}>
                    <Ionicons name={e.isTechnician ? 'cut' : 'person'} size={13} color={e.isTechnician ? WebColors.purple : WebColors.info} />
                  </View>
                  <View>
                    <Text style={ls.tdBold}>{e.personal.firstName} {e.personal.lastName}</Text>
                    {e.personal.nickname ? <Text style={ls.tdSub}>({e.personal.nickname})</Text> : null}
                  </View>
                </View>
                <Text style={[ls.td, { flex: 1 }]}>{e.employment.position}</Text>
                <Text style={[ls.td, { flex: 0.8 }]}>{e.employment.department}</Text>
                <Text style={[ls.td, { flex: 1 }]}>{e.contact.phone}</Text>
                <View style={[ls.tdRow, { flex: 0.6 }]}>
                  {e.isTechnician ? <Text style={ls.techTag}>✓</Text> : <Text style={ls.tdSm}>—</Text>}
                </View>
                <View style={[ls.tdRow, { flex: 0.7 }]}>
                  <View style={[ls.statusDot, { backgroundColor: e.status === 'active' ? WebColors.success : Colors.textMuted }]} />
                  <Text style={ls.tdSm}>{EMPLOYEE_STATUS_LABELS[e.status]}</Text>
                </View>
                <View style={[ls.tdRow, { flex: 0.6, gap: 8 }]}>
                  <TouchableOpacity onPress={() => { setEditEmp(e); setView('staff-form'); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="create-outline" size={15} color={WebColors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { if (confirm('ลบพนักงาน?')) deleteEmployee(e.id); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={15} color={WebColors.danger} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
            {filteredStaff.length === 0 && <Text style={ls.empty}>ไม่พบข้อมูล</Text>}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// USER FORM
// ═══════════════════════════════════════════════════════════════════════════════
interface UserFormProps {
  user: UserAccount | null;
  employees: Employee[];
  getEmployee: (id: string) => Employee | undefined;
  availableEmployees: Employee[];
  onSave: (data: any) => void;
  onBack: () => void;
}
const UserFormView: React.FC<UserFormProps> = ({ user, employees, getEmployee, availableEmployees, onSave, onBack }) => {
  const isEdit = !!user;
  const emp = user ? getEmployee(user.employeeId) : null;
  const [username, setUsername] = useState(user?.username ?? '');
  const [role, setRole] = useState<UserRole>(user?.role ?? 'cashier');
  const [empId, setEmpId] = useState(user?.employeeId ?? '');
  const [status, setStatus] = useState(user?.status ?? 'active');
  const [branchIds, setBranchIds] = useState<string[]>(user?.branchIds ?? []);

  const pickable = isEdit ? employees.filter(e => e.status === 'active') : availableEmployees;
  const selEmp = employees.find(e => e.id === empId);

  const BRANCHES = [{ id: 'b1', name: 'สาขาหลัก' }, { id: 'b2', name: 'สาขา 1' }, { id: 'b3', name: 'สาขา เชียงใหม่' }];
  const toggleBranch = (id: string) => setBranchIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = () => {
    if (!username.trim()) { alert('กรุณากรอก Username'); return; }
    if (!empId) { alert('กรุณาเลือกพนักงาน'); return; }
    onSave({ id: user?.id ?? `usr-${Date.now()}`, employeeId: empId, username, role, status, branchIds, createdAt: user?.createdAt ?? new Date() });
  };

  return (
    <ScrollView style={fs.container} contentContainerStyle={fs.content}>
      <TouchableOpacity style={fs.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back" size={18} color={WebColors.primary} />
        <Text style={fs.backText}>กลับ</Text>
      </TouchableOpacity>
      <Text style={fs.title}>{isEdit ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}</Text>

      <View style={fs.card}>
        <Text style={fs.sectionTitle}>ข้อมูลผู้ใช้งาน</Text>
        <View style={fs.row}>
          <FormField label="Username / เบอร์โทร" value={username} onChange={setUsername} required flex={1} />
          <View style={[fs.fieldWrap, { flex: 1 }]}>
            <Text style={fs.label}>สถานะ</Text>
            <View style={fs.chipRow}>
              {(['active', 'suspended', 'inactive'] as const).map(st => (
                <TouchableOpacity key={st} style={[fs.chip, status === st && fs.chipActive]} onPress={() => setStatus(st)}>
                  <Text style={[fs.chipText, status === st && fs.chipTextActive]}>
                    {st === 'active' ? 'ใช้งาน' : st === 'suspended' ? 'ระงับ' : 'ปิด'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        <View style={fs.fieldWrap}>
          <Text style={fs.label}>Role (สิทธิ์) <Text style={{ color: WebColors.danger }}>*</Text></Text>
          <View style={fs.chipRow}>
            {(Object.keys(USER_ROLE_LABELS) as UserRole[]).map(r => (
              <TouchableOpacity key={r} style={[fs.chip, role === r && { backgroundColor: ROLE_COLORS[r], borderColor: ROLE_COLORS[r] }]} onPress={() => setRole(r)}>
                <Text style={[fs.chipText, role === r && { color: WebColors.white }]}>{USER_ROLE_LABELS[r]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={fs.fieldWrap}>
          <Text style={fs.label}>เลือกพนักงาน <Text style={{ color: WebColors.danger }}>*</Text></Text>
          <LookupCheckbox
            items={pickable.map(e => ({ id: e.id, label: `${e.personal.firstName} ${e.personal.lastName}`, sub: e.employeeCode, extra: e.employment.position }))}
            selectedIds={empId ? [empId] : []}
            onChange={(ids) => { const id = ids[ids.length - 1] || ''; setEmpId(id); const emp = pickable.find(e => e.id === id); if (emp && !username) setUsername(emp.contact.phone); }}
            placeholder="เลือกพนักงาน..."
            title="เลือกพนักงาน"
            columns={['ชื่อ-สกุล', 'รหัส', 'ตำแหน่ง']}
          />
        </View>
      </View>

      {/* เลือกสาขา */}
      <View style={fs.card}>
        <Text style={fs.sectionTitle}>สาขาที่เข้าถึงได้</Text>
        <Text style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 8 }}>
          {role === 'owner' || role === 'admin' ? 'เจ้าของ/ผู้ดูแลระบบ เห็นทุกสาขาอัตโนมัติ' : 'เลือกสาขาที่พนักงานคนนี้สามารถดูข้อมูลได้'}
        </Text>
        {role === 'owner' || role === 'admin' ? (
          <LookupCheckbox
            items={BRANCHES.map(b => ({ id: b.id, label: b.name }))}
            selectedIds={BRANCHES.map(b => b.id)}
            onChange={() => {}}
            placeholder="ทุกสาขา (อัตโนมัติ)"
            title="สาขาทั้งหมด"
            columns={['ชื่อสาขา']}
          />
        ) : (
          <LookupCheckbox
            items={BRANCHES.map(b => ({ id: b.id, label: b.name }))}
            selectedIds={branchIds}
            onChange={setBranchIds}
            placeholder="เลือกสาขา..."
            title="เลือกสาขาที่เข้าถึงได้"
            columns={['ชื่อสาขา']}
          />
        )}
      </View>

      <View style={fs.footer}>
        <TouchableOpacity style={fs.cancelBtn} onPress={onBack}><Text style={fs.cancelText}>ยกเลิก</Text></TouchableOpacity>
        <TouchableOpacity style={fs.saveBtn} onPress={handleSave}><Ionicons name="checkmark" size={16} color={WebColors.white} /><Text style={fs.saveText}>บันทึก</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STAFF FORM (ข้อมูลครบ)
// ═══════════════════════════════════════════════════════════════════════════════
interface StaffFormProps { employee: Employee | null; onSave: (data: any) => void; onBack: () => void; }
const StaffFormView: React.FC<StaffFormProps> = ({ employee, onSave, onBack }) => {
  const isEdit = !!employee;
  // Personal
  const [firstName, setFirstName] = useState(employee?.personal.firstName ?? '');
  const [lastName, setLastName] = useState(employee?.personal.lastName ?? '');
  const [nickname, setNickname] = useState(employee?.personal.nickname ?? '');
  const [firstNameEn, setFirstNameEn] = useState('');
  const [lastNameEn, setLastNameEn] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState(employee?.personal.dateOfBirth ?? '');
  const [nationality, setNationality] = useState(employee?.personal.nationality ?? 'ไทย');
  const [idCard, setIdCard] = useState(employee?.personal.idCard ?? '');
  const [taxId, setTaxId] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  // Address
  const [address, setAddress] = useState(employee?.personal.currentAddress ?? '');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('ไทย');
  // Contact
  const [phone, setPhone] = useState(employee?.contact.phone ?? '');
  const [mobile, setMobile] = useState(employee?.contact.phone ?? '');
  const [email, setEmail] = useState(employee?.contact.email ?? '');
  const [lineId, setLineId] = useState(employee?.contact.lineId ?? '');
  const [emergencyName, setEmergencyName] = useState(employee?.contact.emergencyContactName ?? '');
  const [emergencyPhone, setEmergencyPhone] = useState(employee?.contact.emergencyContactPhone ?? '');
  const [emergencyRelation, setEmergencyRelation] = useState(employee?.contact.emergencyContactRelation ?? '');
  // Employment
  const [position, setPosition] = useState(employee?.employment.position ?? '');
  const [department, setDepartment] = useState(employee?.employment.department ?? '');
  const [startDate, setStartDate] = useState(employee?.employment.startDate ?? '');
  const [endDate, setEndDate] = useState(employee?.employment.endDate ?? '');
  const [contractType, setContractType] = useState<ContractType>(employee?.employment.contractType ?? 'permanent');
  const [isTechnician, setIsTechnician] = useState(employee?.isTechnician ?? false);
  const [remark, setRemark] = useState('');

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim()) { alert('กรุณากรอกชื่อ-นามสกุล'); return; }
    if (!phone.trim()) { alert('กรุณากรอกเบอร์โทร'); return; }
    const data: Employee = {
      id: employee?.id ?? `emp-${Date.now()}`,
      employeeCode: employee?.employeeCode ?? `EMP${String(Date.now()).slice(-4)}`,
      personal: { firstName, lastName, nickname: nickname || undefined, idCard, dateOfBirth: dob, nationality, registeredAddress: address, currentAddress: address },
      contact: { phone: mobile || phone, email: email || undefined, lineId: lineId || undefined, emergencyContactName: emergencyName, emergencyContactPhone: emergencyPhone, emergencyContactRelation: emergencyRelation },
      documents: { pdpaConsent: false },
      employment: { position, department, startDate, endDate: endDate || undefined, contractType },
      status: employee?.status ?? 'active',
      isTechnician,
      technicianStatus: isTechnician ? 'available' : undefined,
      createdAt: employee?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    onSave(data);
  };

  return (
    <ScrollView style={fs.container} contentContainerStyle={fs.content}>
      <TouchableOpacity style={fs.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back" size={18} color={WebColors.primary} />
        <Text style={fs.backText}>กลับ</Text>
      </TouchableOpacity>
      <Text style={fs.title}>{isEdit ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงานใหม่'}</Text>

      {/* ข้อมูลส่วนบุคคล */}
      <View style={fs.card}>
        <Text style={fs.sectionTitle}>ข้อมูลส่วนบุคคล</Text>
        <View style={fs.row}>
          <FormField label="ชื่อ" value={firstName} onChange={setFirstName} required flex={1} />
          <FormField label="นามสกุล" value={lastName} onChange={setLastName} required flex={1} />
          <FormField label="ชื่อเล่น" value={nickname} onChange={setNickname} flex={1} />
        </View>
        <View style={fs.row}>
          <FormField label="ชื่อ (EN)" value={firstNameEn} onChange={setFirstNameEn} flex={1} />
          <FormField label="นามสกุล (EN)" value={lastNameEn} onChange={setLastNameEn} flex={1} />
          <View style={[fs.fieldWrap, { flex: 1 }]}>
            <Text style={fs.label}>เพศ</Text>
            <View style={fs.chipRow}>
              {['ชาย','หญิง','อื่นๆ'].map(g => (
                <TouchableOpacity key={g} style={[fs.chip, gender === g && fs.chipActive]} onPress={() => setGender(g)}>
                  <Text style={[fs.chipText, gender === g && fs.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        <View style={fs.row}>
          <FormField label="วันเกิด" value={dob} onChange={setDob} placeholder="YYYY-MM-DD" flex={1} />
          <FormField label="สัญชาติ" value={nationality} onChange={setNationality} flex={1} />
          <FormField label="เลขบัตรประชาชน" value={idCard} onChange={setIdCard} flex={1} />
        </View>
        <View style={fs.row}>
          <FormField label="เลขผู้เสียภาษี" value={taxId} onChange={setTaxId} flex={1} />
          <FormField label="เลขบัญชีธนาคาร" value={bankAccount} onChange={setBankAccount} flex={1} />
          <View style={{ flex: 1 }} />
        </View>
      </View>

      {/* ที่อยู่ */}
      <View style={fs.card}>
        <Text style={fs.sectionTitle}>ที่อยู่</Text>
        <FormField label="ที่อยู่" value={address} onChange={setAddress} flex={1} />
        <View style={fs.row}>
          <FormField label="จังหวัด" value={province} onChange={setProvince} flex={1} />
          <FormField label="เขต/อำเภอ" value={district} onChange={setDistrict} flex={1} />
          <FormField label="แขวง/ตำบล" value={subDistrict} onChange={setSubDistrict} flex={1} />
        </View>
        <View style={fs.row}>
          <FormField label="รหัสไปรษณีย์" value={postalCode} onChange={setPostalCode} flex={1} />
          <FormField label="ประเทศ" value={country} onChange={setCountry} flex={1} />
          <View style={{ flex: 1 }} />
        </View>
      </View>

      {/* ติดต่อ */}
      <View style={fs.card}>
        <Text style={fs.sectionTitle}>ช่องทางติดต่อ</Text>
        <View style={fs.row}>
          <FormField label="โทรศัพท์" value={phone} onChange={setPhone} flex={1} />
          <FormField label="มือถือ" value={mobile} onChange={setMobile} required flex={1} />
          <FormField label="อีเมล" value={email} onChange={setEmail} flex={1} />
          <FormField label="Line ID" value={lineId} onChange={setLineId} flex={1} />
        </View>
        <View style={fs.row}>
          <FormField label="บุคคลฉุกเฉิน" value={emergencyName} onChange={setEmergencyName} flex={1} />
          <FormField label="เบอร์ฉุกเฉิน" value={emergencyPhone} onChange={setEmergencyPhone} flex={1} />
          <FormField label="ความสัมพันธ์" value={emergencyRelation} onChange={setEmergencyRelation} flex={1} />
        </View>
      </View>

      {/* การจ้างงาน */}
      <View style={fs.card}>
        <Text style={fs.sectionTitle}>การจ้างงาน</Text>
        <View style={fs.row}>
          <FormField label="ตำแหน่ง" value={position} onChange={setPosition} flex={1} />
          <FormField label="แผนก" value={department} onChange={setDepartment} flex={1} />
          <FormField label="วันที่เริ่มงาน" value={startDate} onChange={setStartDate} placeholder="YYYY-MM-DD" flex={1} />
          <FormField label="วันที่สิ้นสุด" value={endDate} onChange={setEndDate} placeholder="—" flex={1} />
        </View>
        <View style={fs.fieldWrap}>
          <Text style={fs.label}>ประเภทสัญญา</Text>
          <View style={fs.chipRow}>
            {(Object.keys(CONTRACT_TYPE_LABELS) as ContractType[]).map(ct => (
              <TouchableOpacity key={ct} style={[fs.chip, contractType === ct && fs.chipActive]} onPress={() => setContractType(ct)}>
                <Text style={[fs.chipText, contractType === ct && fs.chipTextActive]}>{CONTRACT_TYPE_LABELS[ct]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={[fs.row, { alignItems: 'center' }]}>
          <TouchableOpacity style={[fs.techToggle, isTechnician && fs.techToggleActive]} onPress={() => setIsTechnician(!isTechnician)}>
            <Ionicons name={isTechnician ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={isTechnician ? WebColors.purple : Colors.textMuted} />
            <Text style={[fs.techToggleText, isTechnician && { color: WebColors.purple }]}>เป็นช่าง/พนักงานบริการ</Text>
          </TouchableOpacity>
        </View>
        <FormField label="หมายเหตุ" value={remark} onChange={setRemark} flex={1} />
      </View>

      <View style={fs.footer}>
        <TouchableOpacity style={fs.cancelBtn} onPress={onBack}><Text style={fs.cancelText}>ยกเลิก</Text></TouchableOpacity>
        <TouchableOpacity style={fs.saveBtn} onPress={handleSave}><Ionicons name="checkmark" size={16} color={WebColors.white} /><Text style={fs.saveText}>บันทึก</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED FORM FIELD
// ═══════════════════════════════════════════════════════════════════════════════
const FormField: React.FC<{
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; required?: boolean; flex?: number;
}> = ({ label, value, onChange, placeholder, required, flex }) => (
  <View style={[fs.fieldWrap, flex ? { flex } : undefined]}>
    <Text style={fs.label}>{label}{required && <Text style={{ color: WebColors.danger }}> *</Text>}</Text>
    <TextInput
      style={fs.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder ?? ''}
      placeholderTextColor={WebColors.textDisabled}
    />
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════════
// LISTING STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const ls = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: WebColors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tabs: { flexDirection: 'row', gap: 4 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: Colors.border,
  },
  tabActive: { backgroundColor: WebColors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: WebColors.white },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, height: 36,
    maxWidth: 300,
  },
  searchInput: { flex: 1, fontSize: 12, color: Colors.text },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: WebColors.primary, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: WebColors.white },
  scroll: { flex: 1 },

  // Table
  table: { backgroundColor: WebColors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  thead: { flexDirection: 'row', backgroundColor: Colors.background, paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  th: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  trAlt: { backgroundColor: Colors.background },
  td: { fontSize: 13, color: Colors.text },
  tdRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tdBold: { fontSize: 13, fontWeight: '600', color: Colors.text },
  tdSub: { fontSize: 12, color: Colors.textMuted },
  tdSm: { fontSize: 13, color: Colors.textSecondary },
  avatarSm: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  statusDot: { width: 7, height: 7, borderRadius: 8 },
  techTag: { fontSize: 13, color: WebColors.purple, fontWeight: '700' },
  empty: { padding: 24, textAlign: 'center', color: Colors.textMuted, fontSize: 12 },
});

// ═══════════════════════════════════════════════════════════════════════════════
// FORM STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const fs = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, gap: 16, maxWidth: 640, alignSelf: 'center' as any, width: '100%' as any },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  backText: { fontSize: 12, color: WebColors.primary, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  card: {
    backgroundColor: WebColors.white, borderRadius: 12, padding: 20, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  fieldWrap: { marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  input: {
    height: 36, borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
    paddingHorizontal: 12, fontSize: 12, color: Colors.text, backgroundColor: WebColors.white,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: Colors.border, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: WebColors.white },
  empGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  empCard: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    backgroundColor: Colors.border, borderWidth: 1, borderColor: Colors.border,
  },
  empCardActive: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  empName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  empSub: { fontSize: 12, color: Colors.textSecondary },
  techToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  techToggleActive: {},
  techToggleText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  cancelText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: WebColors.primary },
  saveText: { fontSize: 12, fontWeight: '700', color: WebColors.white },
});
