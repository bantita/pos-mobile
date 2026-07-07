import { useEmployeeStore } from '@/features/settings/application/stores/employeeStore';
import { usePOSPermissionStore } from '@/features/settings/application/stores/posPermissionStore';
import {
    CONTRACT_TYPE_LABELS, ContractType, Employee,
    EMPLOYEE_STATUS_LABELS, USER_ROLE_LABELS, UserAccount, UserRole,
} from '@/features/settings/domain/staff';
import { LookupCheckbox } from '@/shared/components/ui/LookupCheckbox';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';
import React, { useState } from 'react';
import { useWindowDimensions } from 'react-native';

const ROLE_COLORS: Record<UserRole, string> = {
  owner: '#7c3aed', manager: '#0ea5e9', cashier: '#10b981',
  stock_staff: '#f59e0b', report_viewer: '#3b82f6', admin: '#64748b',
};

const STATUS_MAP = { active: { label: 'ใช้งาน', dot: '#10b981' }, suspended: { label: 'ระงับ', dot: '#f59e0b' }, inactive: { label: 'ปิด', dot: '#94a3b8' } } as const;

export const UserStaffScreen: React.FC = () => {
  const { employees, users, getEmployee, addEmployee, updateEmployee, deleteEmployee, addUser, updateUser, deleteUser, getEmployeesWithoutUser } = useEmployeeStore();
  const { users: posUsers, generatePin: genPosPin, addUser: addPosUser, updateUser: updatePosUser } = usePOSPermissionStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  type ViewMode = 'list' | 'user-form' | 'staff-form';
  const [view, setView] = useState<ViewMode>('list');
  const [tab, setTab] = useState<'users' | 'staff'>('users');
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<UserAccount | null>(null);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMsg, setConfirmMsg] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  const showAlert = (t: string, m: string) => { setAlertTitle(t); setAlertMsg(m); setAlertVisible(true); };
  const showConfirm = (t: string, m: string, fn: () => void) => { setConfirmTitle(t); setConfirmMsg(m); setConfirmAction(() => fn); setConfirmVisible(true); };

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const emp = getEmployee(u.employeeId);
    const n = emp ? `${emp.personal.firstName} ${emp.personal.lastName} ${emp.personal.nickname ?? ''}` : u.username;
    return n.toLowerCase().includes(search.toLowerCase()) || u.username.includes(search);
  });
  const filteredStaff = employees.filter(e => {
    if (!search) return true;
    return `${e.personal.firstName} ${e.personal.lastName} ${e.personal.nickname ?? ''} ${e.employeeCode} ${e.contact.phone}`.toLowerCase().includes(search.toLowerCase());
  });

  if (view === 'user-form') return (
    <UserFormView user={editUser} employees={employees} getEmployee={getEmployee} availableEmployees={getEmployeesWithoutUser()}
      onSave={(data) => { editUser ? updateUser(editUser.id, data) : addUser(data as UserAccount); setView('list'); }}
      onBack={() => setView('list')} showAlert={showAlert} />
  );
  if (view === 'staff-form') return (
    <StaffFormView employee={editEmp}
      onSave={(data) => { editEmp ? updateEmployee(editEmp.id, data) : addEmployee(data as Employee); setView('list'); }}
      onBack={() => setView('list')} showAlert={showAlert} />
  );

  return (
    <View className={cn('flex-1 bg-[#f6f7fb]')}>
      {/* ─── Toolbar ─── */}
      <View className={cn('bg-white border-b border-slate-200 px-5 py-3')} style={isMobile ? { gap: 10 } : { flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Tabs */}
        <View className={cn('flex-row rounded-lg border border-slate-200 overflow-hidden self-start')}>
          {(['users', 'staff'] as const).map(t => (
            <TouchableOpacity key={t} className={cn('px-4 py-2')} style={tab === t ? { backgroundColor: '#f43f5e' } : { backgroundColor: '#fff' }} onPress={() => setTab(t)}>
              <Text className={cn('text-xs font-semibold')} style={{ color: tab === t ? '#fff' : '#475569' }}>
                {t === 'users' ? `ผู้ใช้งาน (${users.length})` : `พนักงาน (${employees.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Search */}
        <View className={cn('flex-1 flex-row items-center bg-slate-50 border border-slate-200 rounded-lg px-3 h-9')} style={isMobile ? { marginTop: 0 } : undefined}>
          <Ionicons name="search" size={14} color="#94a3b8" />
          <TextInput className={cn('flex-1 ml-2 text-xs text-slate-800')} placeholder="ค้นหาชื่อ, เบอร์โทร, รหัส..." placeholderTextColor="#94a3b8" value={search} onChangeText={setSearch} />
          {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color="#cbd5e1" /></TouchableOpacity> : null}
        </View>
        {/* Add Button */}
        <TouchableOpacity className={cn('flex-row items-center gap-1.5 bg-rose-500 rounded-lg px-4 py-2 self-start')}
          onPress={() => { if (tab === 'users') { setEditUser(null); setView('user-form'); } else { setEditEmp(null); setView('staff-form'); } }}>
          <Ionicons name="add" size={15} color="#fff" />
          <Text className={cn('text-xs font-bold text-white')}>{tab === 'users' ? 'เพิ่มผู้ใช้' : 'เพิ่มพนักงาน'}</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Table / Cards ─── */}
      <ScrollView className={cn('flex-1')} contentContainerClassName={cn('p-4 pb-10')}>
        {tab === 'users' ? (
          isMobile ? (
            <View style={{ gap: 8 }}>
              {filteredUsers.map((u) => {
                const emp = getEmployee(u.employeeId);
                const posUser = posUsers.find(pu => pu.name.includes(u.username) || (emp && pu.name.includes(emp.personal.firstName)));
                const st = STATUS_MAP[u.status] || STATUS_MAP.active;
                return (
                  <TouchableOpacity key={u.id} className={cn('bg-white rounded-lg p-3 border border-slate-100')} onPress={() => { setEditUser(u); setView('user-form'); }}>
                    <View className={cn('flex-row items-center gap-2.5 mb-1.5')}>
                      <View className={cn('w-8 h-8 rounded-full items-center justify-center')} style={{ backgroundColor: ROLE_COLORS[u.role] + '18' }}>
                        <Ionicons name="person" size={14} color={ROLE_COLORS[u.role]} />
                      </View>
                      <View className={cn('flex-1')}>
                        <Text className={cn('text-xs font-semibold text-slate-800')}>{emp ? `${emp.personal.firstName} ${emp.personal.lastName}` : u.username}</Text>
                        <Text className={cn('text-[11px] text-slate-400')}>{u.username}{emp?.employment.department ? ` · ${emp.employment.department}` : ''}</Text>
                      </View>
                      <View className={cn('flex-row items-center gap-1')}><View className={cn('w-1.5 h-1.5 rounded-full')} style={{ backgroundColor: st.dot }} /><Text className={cn('text-[11px] text-slate-500')}>{st.label}</Text></View>
                    </View>
                    <View className={cn('flex-row items-center gap-2 mt-1')}>
                      <View className={cn('px-2 py-0.5 rounded')} style={{ backgroundColor: ROLE_COLORS[u.role] + '12' }}><Text className={cn('text-[10px] font-bold')} style={{ color: ROLE_COLORS[u.role] }}>{USER_ROLE_LABELS[u.role]}</Text></View>
                      {posUser?.pin ? <Text className={cn('text-[10px] font-mono text-violet-500')}>PIN {posUser.pin}</Text> : null}
                      <View className={cn('flex-1')} />
                      <TouchableOpacity hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} onPress={() => { setEditUser(u); setView('user-form'); }}><Ionicons name="create-outline" size={14} color="#3b82f6" /></TouchableOpacity>
                      <TouchableOpacity hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} onPress={() => showConfirm('ลบผู้ใช้', `ลบ "${emp?.personal.firstName || u.username}" ?`, () => deleteUser(u.id))}><Ionicons name="trash-outline" size={14} color="#ef4444" /></TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {filteredUsers.length === 0 && <Text className={cn('text-xs text-slate-400 text-center py-8')}>ไม่พบข้อมูล</Text>}
            </View>
          ) : (
            /* Desktop Users Table */
            <View className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden')}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ minWidth: 920 }}>
                  {/* Header */}
                  <View className={cn('flex-row items-center bg-slate-50 border-b border-slate-200 px-3 h-9')}>
                    <Text className={cn('text-[11px] font-semibold text-slate-500')} style={{ width: 32 }}>#</Text>
                    <Text className={cn('text-[11px] font-semibold text-slate-500')} style={{ width: 160 }}>ชื่อ-สกุล</Text>
                    <Text className={cn('text-[11px] font-semibold text-slate-500')} style={{ width: 120 }}>Username</Text>
                    <Text className={cn('text-[11px] font-semibold text-slate-500 text-center')} style={{ width: 56 }}>PIN</Text>
                    <Text className={cn('text-[11px] font-semibold text-slate-500')} style={{ width: 90 }}>แผนก</Text>
                    <Text className={cn('text-[11px] font-semibold text-slate-500')} style={{ width: 90 }}>บทบาท</Text>
                    <Text className={cn('text-[11px] font-semibold text-slate-500')} style={{ width: 88 }}>Login ล่าสุด</Text>
                    <Text className={cn('text-[11px] font-semibold text-slate-500')} style={{ width: 72 }}>สถานะ</Text>
                    <Text className={cn('text-[11px] font-semibold text-slate-500 text-center')} style={{ width: 80 }}>จัดการ</Text>
                  </View>
                  {/* Rows */}
                  {filteredUsers.map((u, idx) => {
                    const emp = getEmployee(u.employeeId);
                    const posUser = posUsers.find(pu => pu.name.includes(u.username) || (emp && pu.name.includes(emp.personal.firstName)));
                    const st = STATUS_MAP[u.status] || STATUS_MAP.active;
                    return (
                      <TouchableOpacity key={u.id} className={cn('flex-row items-center px-3 h-10 border-b border-slate-100', idx % 2 === 1 && 'bg-slate-50/60')} onPress={() => { setEditUser(u); setView('user-form'); }}>
                        <Text className={cn('text-[11px] text-slate-400')} style={{ width: 32 }}>{idx + 1}</Text>
                        <View className={cn('flex-row items-center gap-2')} style={{ width: 160 }}>
                          <View className={cn('w-6 h-6 rounded-full items-center justify-center')} style={{ backgroundColor: ROLE_COLORS[u.role] + '18' }}>
                            <Ionicons name="person" size={11} color={ROLE_COLORS[u.role]} />
                          </View>
                          <Text className={cn('text-xs font-medium text-slate-800')} numberOfLines={1}>{emp ? `${emp.personal.firstName} ${emp.personal.lastName}` : '—'}</Text>
                        </View>
                        <Text className={cn('text-xs text-slate-600')} style={{ width: 120 }} numberOfLines={1}>{u.username}</Text>
                        <Text className={cn('text-xs font-mono font-semibold text-violet-600 text-center')} style={{ width: 56 }}>{posUser?.pin ?? '—'}</Text>
                        <Text className={cn('text-xs text-slate-500')} style={{ width: 90 }} numberOfLines={1}>{emp?.employment.department ?? '—'}</Text>
                        <View style={{ width: 90 }}><View className={cn('px-2 py-0.5 rounded self-start')} style={{ backgroundColor: ROLE_COLORS[u.role] + '12' }}><Text className={cn('text-[10px] font-bold')} style={{ color: ROLE_COLORS[u.role] }}>{USER_ROLE_LABELS[u.role]}</Text></View></View>
                        <Text className={cn('text-xs text-slate-500')} style={{ width: 88 }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}</Text>
                        <View className={cn('flex-row items-center gap-1')} style={{ width: 72 }}><View className={cn('w-1.5 h-1.5 rounded-full')} style={{ backgroundColor: st.dot }} /><Text className={cn('text-[11px] text-slate-600')}>{st.label}</Text></View>
                        <View className={cn('flex-row items-center justify-center gap-2.5')} style={{ width: 80 }}>
                          <TouchableOpacity hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} onPress={(e: any) => { e.stopPropagation?.(); if (posUser) updatePosUser(posUser.id, { pin: genPosPin() }); else { const p = genPosPin(); addPosUser({ name: emp ? `${emp.personal.firstName} ${emp.personal.lastName}` : u.username, pin: p, role: u.role, permissions: [] }); } }}><Ionicons name="key-outline" size={13} color="#f59e0b" /></TouchableOpacity>
                          <TouchableOpacity hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} onPress={() => { setEditUser(u); setView('user-form'); }}><Ionicons name="create-outline" size={13} color="#3b82f6" /></TouchableOpacity>
                          <TouchableOpacity hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} onPress={() => showConfirm('ลบผู้ใช้', `ลบ "${emp?.personal.firstName || u.username}" ?`, () => deleteUser(u.id))}><Ionicons name="trash-outline" size={13} color="#ef4444" /></TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  {filteredUsers.length === 0 && <View className={cn('py-8 items-center')}><Text className={cn('text-xs text-slate-400')}>ไม่พบข้อมูล</Text></View>}
                </View>
              </ScrollView>
            </View>
          )
        ) : (
          isMobile ? (
            /* Mobile Staff Cards */
            <View style={{ gap: 8 }}>
              {filteredStaff.map((e) => {
                const st = EMPLOYEE_STATUS_LABELS[e.status];
                return (
                  <TouchableOpacity key={e.id} className={cn('bg-white rounded-lg p-3 border border-slate-100')} onPress={() => { setEditEmp(e); setView('staff-form'); }}>
                    <View className={cn('flex-row items-center gap-2.5 mb-1')}>
                      <View className={cn('w-8 h-8 rounded-full items-center justify-center')} style={{ backgroundColor: e.isTechnician ? '#f3e8ff' : '#e0f2fe' }}>
                        <Ionicons name={e.isTechnician ? 'cut' : 'person'} size={13} color={e.isTechnician ? '#7c3aed' : '#0ea5e9'} />
                      </View>
                      <View className={cn('flex-1')}>
                        <Text className={cn('text-xs font-semibold text-slate-800')}>{e.personal.firstName} {e.personal.lastName}{e.personal.nickname ? ` (${e.personal.nickname})` : ''}</Text>
                        <Text className={cn('text-[11px] text-slate-400')}>{e.employeeCode} · {e.employment.position || '—'} · {e.employment.department || '—'}</Text>
                      </View>
                      <View className={cn('flex-row items-center gap-1')}><View className={cn('w-1.5 h-1.5 rounded-full')} style={{ backgroundColor: e.status === 'active' ? '#10b981' : '#94a3b8' }} /><Text className={cn('text-[11px] text-slate-500')}>{st}</Text></View>
                    </View>
                    <View className={cn('flex-row items-center justify-between mt-1.5')}>
                      <Text className={cn('text-[11px] text-slate-500')}>{e.contact.phone}{e.isTechnician ? ' · ช่าง' : ''}</Text>
                      <View className={cn('flex-row gap-3')}>
                        <TouchableOpacity hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} onPress={() => { setEditEmp(e); setView('staff-form'); }}><Ionicons name="create-outline" size={14} color="#3b82f6" /></TouchableOpacity>
                        <TouchableOpacity hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} onPress={() => showConfirm('ลบพนักงาน', `ลบ "${e.personal.firstName}" ?`, () => deleteEmployee(e.id))}><Ionicons name="trash-outline" size={14} color="#ef4444" /></TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {filteredStaff.length === 0 && <Text className={cn('text-xs text-slate-400 text-center py-8')}>ไม่พบข้อมูล</Text>}
            </View>
          ) : (
            /* Desktop Staff Table */
            <View className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden')}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ minWidth: 880 }}>
                  <View className={cn('flex-row items-center bg-slate-50 border-b border-slate-200 px-3 h-9')}>
                    <Text className={cn('text-[11px] font-semibold text-slate-500')} style={{ width: 32 }}>#</Text>
                    <Text className={cn('text-[11px] font-semibold text-slate-500')} style={{ width: 72 }}>รหัส</Text>
                    <Text className={cn('text-[11px] font-semibold text-slate-500')} style={{ width: 170 }}>ชื่อ-สกุล</Text>
                    <Text className={cn('text-[11px] font-semibold text-slate-500')} style={{ width: 100 }}>ตำแหน่ง</Text>
                    <Text className={cn('text-[11px] font-semibold text-slate-500')} style={{ width: 80 }}>แผนก</Text>
                    <Text className={cn('text-[11px] font-semibold text-slate-500')} style={{ width: 100 }}>เบอร์โทร</Text>
                    <Text className={cn('text-[11px] font-semibold text-slate-500 text-center')} style={{ width: 44 }}>ช่าง</Text>
                    <Text className={cn('text-[11px] font-semibold text-slate-500')} style={{ width: 72 }}>สถานะ</Text>
                    <Text className={cn('text-[11px] font-semibold text-slate-500 text-center')} style={{ width: 64 }}>จัดการ</Text>
                  </View>
                  {filteredStaff.map((e, idx) => (
                    <TouchableOpacity key={e.id} className={cn('flex-row items-center px-3 h-10 border-b border-slate-100', idx % 2 === 1 && 'bg-slate-50/60')} onPress={() => { setEditEmp(e); setView('staff-form'); }}>
                      <Text className={cn('text-[11px] text-slate-400')} style={{ width: 32 }}>{idx + 1}</Text>
                      <Text className={cn('text-xs font-medium text-slate-700')} style={{ width: 72 }} numberOfLines={1}>{e.employeeCode}</Text>
                      <View className={cn('flex-row items-center gap-2')} style={{ width: 170 }}>
                        <View className={cn('w-6 h-6 rounded-full items-center justify-center')} style={{ backgroundColor: e.isTechnician ? '#f3e8ff' : '#e0f2fe' }}>
                          <Ionicons name={e.isTechnician ? 'cut' : 'person'} size={11} color={e.isTechnician ? '#7c3aed' : '#0ea5e9'} />
                        </View>
                        <Text className={cn('text-xs font-medium text-slate-800')} numberOfLines={1}>{e.personal.firstName} {e.personal.lastName}{e.personal.nickname ? ` (${e.personal.nickname})` : ''}</Text>
                      </View>
                      <Text className={cn('text-xs text-slate-500')} style={{ width: 100 }} numberOfLines={1}>{e.employment.position}</Text>
                      <Text className={cn('text-xs text-slate-500')} style={{ width: 80 }} numberOfLines={1}>{e.employment.department}</Text>
                      <Text className={cn('text-xs text-slate-600')} style={{ width: 100 }}>{e.contact.phone}</Text>
                      <Text className={cn('text-xs font-semibold text-center')} style={{ width: 44, color: e.isTechnician ? '#7c3aed' : '#cbd5e1' }}>{e.isTechnician ? '✓' : '—'}</Text>
                      <View className={cn('flex-row items-center gap-1')} style={{ width: 72 }}><View className={cn('w-1.5 h-1.5 rounded-full')} style={{ backgroundColor: e.status === 'active' ? '#10b981' : '#94a3b8' }} /><Text className={cn('text-[11px] text-slate-600')}>{EMPLOYEE_STATUS_LABELS[e.status]}</Text></View>
                      <View className={cn('flex-row items-center justify-center gap-2.5')} style={{ width: 64 }}>
                        <TouchableOpacity hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} onPress={() => { setEditEmp(e); setView('staff-form'); }}><Ionicons name="create-outline" size={13} color="#3b82f6" /></TouchableOpacity>
                        <TouchableOpacity hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} onPress={() => showConfirm('ลบพนักงาน', `ลบ "${e.personal.firstName}" ?`, () => deleteEmployee(e.id))}><Ionicons name="trash-outline" size={13} color="#ef4444" /></TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {filteredStaff.length === 0 && <View className={cn('py-8 items-center')}><Text className={cn('text-xs text-slate-400')}>ไม่พบข้อมูล</Text></View>}
                </View>
              </ScrollView>
            </View>
          )
        )}
      </ScrollView>

      <AlertDialog visible={alertVisible} onClose={() => setAlertVisible(false)} title={alertTitle} message={alertMsg} variant="info" />
      <ConfirmModal visible={confirmVisible} onClose={() => setConfirmVisible(false)} title={confirmTitle} message={confirmMsg} variant="warning" onConfirm={() => { confirmAction(); setConfirmVisible(false); }} />
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// USER FORM
// ═══════════════════════════════════════════════════════════════════════════════
interface UserFormProps { user: UserAccount | null; employees: Employee[]; getEmployee: (id: string) => Employee | undefined; availableEmployees: Employee[]; onSave: (data: any) => void; onBack: () => void; showAlert: (t: string, m: string) => void; }
const UserFormView: React.FC<UserFormProps> = ({ user, employees, getEmployee, availableEmployees, onSave, onBack, showAlert }) => {
  const isEdit = !!user;
  const [username, setUsername] = useState(user?.username ?? '');
  const [role, setRole] = useState<UserRole>(user?.role ?? 'cashier');
  const [empId, setEmpId] = useState(user?.employeeId ?? '');
  const [status, setStatus] = useState(user?.status ?? 'active');
  const [branchIds, setBranchIds] = useState<string[]>(user?.branchIds ?? []);
  const pickable = isEdit ? employees.filter(e => e.status === 'active') : availableEmployees;
  const BRANCHES = [{ id: 'b1', name: 'สาขาหลัก' }, { id: 'b2', name: 'สาขา 1' }, { id: 'b3', name: 'สาขา เชียงใหม่' }];

  const handleSave = () => {
    if (!username.trim()) { showAlert('แจ้งเตือน', 'กรุณากรอก Username'); return; }
    if (!empId) { showAlert('แจ้งเตือน', 'กรุณาเลือกพนักงาน'); return; }
    onSave({ id: user?.id ?? `usr-${Date.now()}`, employeeId: empId, username, role, status, branchIds, createdAt: user?.createdAt ?? new Date() });
  };

  return (
    <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerClassName={cn('p-5 gap-4 max-w-[700px]')}>
      <TouchableOpacity className={cn('flex-row items-center gap-1.5 self-start')} onPress={onBack}>
        <Ionicons name="arrow-back" size={16} color="#64748b" />
        <Text className={cn('text-xs font-semibold text-slate-500')}>กลับ</Text>
      </TouchableOpacity>
      <Text className={cn('text-sm font-bold text-slate-800')}>{isEdit ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}</Text>

      <View className={cn('bg-white rounded-xl p-4 gap-3 border border-slate-200')}>
        <Text className={cn('text-[11px] font-bold text-slate-500 uppercase tracking-wide')}>ข้อมูลผู้ใช้</Text>
        <View className={cn('flex-row gap-3 flex-wrap')}>
          <FormField label="Username / เบอร์โทร" value={username} onChange={setUsername} required flex={1} />
          <View style={{ flex: 1 }}>
            <Text className={cn('text-[11px] font-semibold text-slate-600 mb-1')}>สถานะ</Text>
            <View className={cn('flex-row gap-1.5')}>
              {(['active', 'suspended', 'inactive'] as const).map(st => (
                <TouchableOpacity key={st} className={cn('px-3 py-1.5 rounded-md border', status === st ? 'bg-slate-800 border-slate-800' : 'bg-white border-slate-200')} onPress={() => setStatus(st)}>
                  <Text className={cn('text-[11px]', status === st ? 'text-white font-bold' : 'text-slate-600')}>{st === 'active' ? 'ใช้งาน' : st === 'suspended' ? 'ระงับ' : 'ปิด'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        <View>
          <Text className={cn('text-[11px] font-semibold text-slate-600 mb-1')}>Role (สิทธิ์) *</Text>
          <View className={cn('flex-row flex-wrap gap-1.5')}>
            {(Object.keys(USER_ROLE_LABELS) as UserRole[]).map(r => (
              <TouchableOpacity key={r} className={cn('px-3 py-1.5 rounded-md border')} style={role === r ? { backgroundColor: ROLE_COLORS[r], borderColor: ROLE_COLORS[r] } : { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }} onPress={() => setRole(r)}>
                <Text className={cn('text-[11px]')} style={{ color: role === r ? '#fff' : '#475569', fontWeight: role === r ? '700' : '500' }}>{USER_ROLE_LABELS[r]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View>
          <Text className={cn('text-[11px] font-semibold text-slate-600 mb-1')}>เลือกพนักงาน *</Text>
          <LookupCheckbox items={pickable.map(e => ({ id: e.id, label: `${e.personal.firstName} ${e.personal.lastName}`, sub: e.employeeCode, extra: e.employment.position }))} selectedIds={empId ? [empId] : []} onChange={(ids) => { const id = ids[ids.length - 1] || ''; setEmpId(id); const emp = pickable.find(e => e.id === id); if (emp && !username) setUsername(emp.contact.phone); }} placeholder="เลือกพนักงาน..." title="เลือกพนักงาน" columns={['ชื่อ-สกุล', 'รหัส', 'ตำแหน่ง']} />
        </View>
      </View>

      <View className={cn('bg-white rounded-xl p-4 gap-2 border border-slate-200')}>
        <Text className={cn('text-[11px] font-bold text-slate-500 uppercase tracking-wide')}>สาขาที่เข้าถึงได้</Text>
        <Text className={cn('text-[11px] text-slate-400')}>{role === 'owner' || role === 'admin' ? 'เจ้าของ/Admin เห็นทุกสาขาอัตโนมัติ' : 'เลือกสาขาที่เข้าถึงได้'}</Text>
        <LookupCheckbox items={BRANCHES.map(b => ({ id: b.id, label: b.name }))} selectedIds={role === 'owner' || role === 'admin' ? BRANCHES.map(b => b.id) : branchIds} onChange={role === 'owner' || role === 'admin' ? () => {} : setBranchIds} placeholder={role === 'owner' || role === 'admin' ? 'ทุกสาขา' : 'เลือกสาขา...'} title="สาขา" columns={['ชื่อสาขา']} />
      </View>

      <View className={cn('flex-row justify-end gap-2')}>
        <TouchableOpacity className={cn('px-4 py-2 rounded-lg border border-slate-200 bg-white')} onPress={onBack}><Text className={cn('text-xs font-semibold text-slate-500')}>ยกเลิก</Text></TouchableOpacity>
        <TouchableOpacity className={cn('flex-row items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-500')} onPress={handleSave}><Ionicons name="checkmark" size={14} color="#fff" /><Text className={cn('text-xs font-bold text-white')}>บันทึก</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STAFF FORM
// ═══════════════════════════════════════════════════════════════════════════════
interface StaffFormProps { employee: Employee | null; onSave: (data: any) => void; onBack: () => void; showAlert: (t: string, m: string) => void; }
const StaffFormView: React.FC<StaffFormProps> = ({ employee, onSave, onBack, showAlert }) => {
  const isEdit = !!employee;
  const [firstName, setFirstName] = useState(employee?.personal.firstName ?? '');
  const [lastName, setLastName] = useState(employee?.personal.lastName ?? '');
  const [nickname, setNickname] = useState(employee?.personal.nickname ?? '');
  const [dob, setDob] = useState(employee?.personal.dateOfBirth ?? '');
  const [nationality, setNationality] = useState(employee?.personal.nationality ?? 'ไทย');
  const [idCard, setIdCard] = useState(employee?.personal.idCard ?? '');
  const [address, setAddress] = useState(employee?.personal.currentAddress ?? '');
  const [phone, setPhone] = useState(employee?.contact.phone ?? '');
  const [email, setEmail] = useState(employee?.contact.email ?? '');
  const [lineId, setLineId] = useState(employee?.contact.lineId ?? '');
  const [emergencyName, setEmergencyName] = useState(employee?.contact.emergencyContactName ?? '');
  const [emergencyPhone, setEmergencyPhone] = useState(employee?.contact.emergencyContactPhone ?? '');
  const [emergencyRelation, setEmergencyRelation] = useState(employee?.contact.emergencyContactRelation ?? '');
  const [position, setPosition] = useState(employee?.employment.position ?? '');
  const [department, setDepartment] = useState(employee?.employment.department ?? '');
  const [startDate, setStartDate] = useState(employee?.employment.startDate ?? '');
  const [endDate, setEndDate] = useState(employee?.employment.endDate ?? '');
  const [contractType, setContractType] = useState<ContractType>(employee?.employment.contractType ?? 'permanent');
  const [isTechnician, setIsTechnician] = useState(employee?.isTechnician ?? false);

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim()) { showAlert('แจ้งเตือน', 'กรุณากรอกชื่อ-นามสกุล'); return; }
    if (!phone.trim()) { showAlert('แจ้งเตือน', 'กรุณากรอกเบอร์โทร'); return; }
    const data: Employee = {
      id: employee?.id ?? `emp-${Date.now()}`,
      employeeCode: employee?.employeeCode ?? `EMP${String(Date.now()).slice(-4)}`,
      personal: { firstName, lastName, nickname: nickname || undefined, idCard, dateOfBirth: dob, nationality, registeredAddress: address, currentAddress: address },
      contact: { phone, email: email || undefined, lineId: lineId || undefined, emergencyContactName: emergencyName, emergencyContactPhone: emergencyPhone, emergencyContactRelation: emergencyRelation },
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
    <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerClassName={cn('p-5 gap-4 max-w-[720px]')}>
      <TouchableOpacity className={cn('flex-row items-center gap-1.5 self-start')} onPress={onBack}>
        <Ionicons name="arrow-back" size={16} color="#64748b" />
        <Text className={cn('text-xs font-semibold text-slate-500')}>กลับ</Text>
      </TouchableOpacity>
      <Text className={cn('text-sm font-bold text-slate-800')}>{isEdit ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงานใหม่'}</Text>

      {/* Personal */}
      <View className={cn('bg-white rounded-xl p-4 gap-3 border border-slate-200')}>
        <Text className={cn('text-[11px] font-bold text-slate-500 uppercase tracking-wide')}>ข้อมูลส่วนบุคคล</Text>
        <View className={cn('flex-row gap-3 flex-wrap')}>
          <FormField label="ชื่อ" value={firstName} onChange={setFirstName} required flex={1} />
          <FormField label="นามสกุล" value={lastName} onChange={setLastName} required flex={1} />
          <FormField label="ชื่อเล่น" value={nickname} onChange={setNickname} flex={1} />
        </View>
        <View className={cn('flex-row gap-3 flex-wrap')}>
          <FormField label="วันเกิด" value={dob} onChange={setDob} placeholder="YYYY-MM-DD" flex={1} />
          <FormField label="สัญชาติ" value={nationality} onChange={setNationality} flex={1} />
          <FormField label="เลขบัตรประชาชน" value={idCard} onChange={setIdCard} flex={1} />
        </View>
        <FormField label="ที่อยู่" value={address} onChange={setAddress} />
      </View>

      {/* Contact */}
      <View className={cn('bg-white rounded-xl p-4 gap-3 border border-slate-200')}>
        <Text className={cn('text-[11px] font-bold text-slate-500 uppercase tracking-wide')}>ช่องทางติดต่อ</Text>
        <View className={cn('flex-row gap-3 flex-wrap')}>
          <FormField label="มือถือ" value={phone} onChange={setPhone} required flex={1} />
          <FormField label="อีเมล" value={email} onChange={setEmail} flex={1} />
          <FormField label="Line ID" value={lineId} onChange={setLineId} flex={1} />
        </View>
        <View className={cn('flex-row gap-3 flex-wrap')}>
          <FormField label="บุคคลฉุกเฉิน" value={emergencyName} onChange={setEmergencyName} flex={1} />
          <FormField label="เบอร์ฉุกเฉิน" value={emergencyPhone} onChange={setEmergencyPhone} flex={1} />
          <FormField label="ความสัมพันธ์" value={emergencyRelation} onChange={setEmergencyRelation} flex={1} />
        </View>
      </View>

      {/* Employment */}
      <View className={cn('bg-white rounded-xl p-4 gap-3 border border-slate-200')}>
        <Text className={cn('text-[11px] font-bold text-slate-500 uppercase tracking-wide')}>การจ้างงาน</Text>
        <View className={cn('flex-row gap-3 flex-wrap')}>
          <FormField label="ตำแหน่ง" value={position} onChange={setPosition} flex={1} />
          <FormField label="แผนก" value={department} onChange={setDepartment} flex={1} />
          <FormField label="วันเริ่มงาน" value={startDate} onChange={setStartDate} placeholder="YYYY-MM-DD" flex={1} />
        </View>
        <View>
          <Text className={cn('text-[11px] font-semibold text-slate-600 mb-1')}>ประเภทสัญญา</Text>
          <View className={cn('flex-row flex-wrap gap-1.5')}>
            {(Object.keys(CONTRACT_TYPE_LABELS) as ContractType[]).map(ct => (
              <TouchableOpacity key={ct} className={cn('px-3 py-1.5 rounded-md border', contractType === ct ? 'bg-slate-800 border-slate-800' : 'bg-white border-slate-200')} onPress={() => setContractType(ct)}>
                <Text className={cn('text-[11px]', contractType === ct ? 'text-white font-bold' : 'text-slate-600')}>{CONTRACT_TYPE_LABELS[ct]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <TouchableOpacity className={cn('flex-row items-center gap-2 py-1')} onPress={() => setIsTechnician(!isTechnician)}>
          <Ionicons name={isTechnician ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={isTechnician ? '#7c3aed' : '#94a3b8'} />
          <Text className={cn('text-xs', isTechnician ? 'font-semibold text-violet-600' : 'text-slate-500')}>เป็นช่าง/พนักงานบริการ</Text>
        </TouchableOpacity>
      </View>

      <View className={cn('flex-row justify-end gap-2')}>
        <TouchableOpacity className={cn('px-4 py-2 rounded-lg border border-slate-200 bg-white')} onPress={onBack}><Text className={cn('text-xs font-semibold text-slate-500')}>ยกเลิก</Text></TouchableOpacity>
        <TouchableOpacity className={cn('flex-row items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-500')} onPress={handleSave}><Ionicons name="checkmark" size={14} color="#fff" /><Text className={cn('text-xs font-bold text-white')}>บันทึก</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FORM FIELD
// ═══════════════════════════════════════════════════════════════════════════════
const FormField: React.FC<{ label: string; value: string; onChange?: (v: string) => void; placeholder?: string; required?: boolean; flex?: number }> = ({ label, value, onChange, placeholder, required, flex }) => (
  <View style={flex ? { flex, minWidth: 140 } : undefined}>
    <Text className={cn('text-[11px] font-semibold text-slate-600 mb-1')}>{label}{required && <Text className={cn('text-rose-500')}> *</Text>}</Text>
    <TextInput className={cn('h-9 border border-slate-200 rounded-lg px-3 text-xs text-slate-800 bg-white')} value={value} onChangeText={onChange} placeholder={placeholder ?? ''} placeholderTextColor="#cbd5e1" />
  </View>
);
