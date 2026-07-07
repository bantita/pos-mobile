import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import * as branchStore from '@/features/settings/application/stores/branchStore';
import * as storeConfigStore from '@/features/settings/application/stores/storeConfigStore';
import { Branch, Terminal } from '@/features/settings/domain/store';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';

export const BranchManageScreen: React.FC = () => {
  const storeType = storeConfigStore.getStoreType();
  const isEnterprise = storeType === 'ENTERPRISE';
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [editBranchId, setEditBranchId] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [showTerminalForm, setShowTerminalForm] = useState(false);
  const [terminalName, setTerminalName] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMsg, setConfirmMsg] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  const showAlert = (title: string, msg: string) => {
    setAlertTitle(title);
    setAlertMsg(msg);
    setAlertVisible(true);
  };
  const showConfirm = (title: string, msg: string, onConfirm: () => void) => {
    setConfirmTitle(title);
    setConfirmMsg(msg);
    setConfirmAction(() => onConfirm);
    setConfirmVisible(true);
  };

  const branches = branchStore.getBranches();
  const terminals = isEnterprise
    ? (selectedBranchId ? branchStore.getTerminalsByBranch(selectedBranchId) : [])
    : branchStore.getRetailTerminals();

  const handleSaveBranch = () => {
    if (!branchName.trim()) { showAlert('แจ้งเตือน', 'กรุณากรอกชื่อสาขา'); return; }
    if (editBranchId) {
      branchStore.updateBranch(editBranchId, { name: branchName.trim(), address: branchAddress.trim(), contactPhone: branchPhone.trim() });
    } else {
      const b = branchStore.addBranch({ name: branchName.trim(), address: branchAddress.trim(), contactPhone: branchPhone.trim() });
      setSelectedBranchId(b.id);
    }
    resetBranchForm();
  };

  const handleEditBranch = (branch: Branch) => {
    setBranchName(branch.name);
    setBranchAddress(branch.address);
    setBranchPhone(branch.contactPhone || '');
    setEditBranchId(branch.id);
    setShowBranchForm(true);
  };

  const handleDeleteBranch = (id: string) => {
    showConfirm('ลบสาขา', 'ต้องการลบสาขานี้? (ข้อมูลที่เกี่ยวข้องจะถูกลบด้วย)', () => {
      branchStore.deleteBranch(id);
      if (selectedBranchId === id) setSelectedBranchId('');
      setRefreshKey(k => k + 1);
    });
  };

  const resetBranchForm = () => {
    setBranchName('');
    setBranchAddress('');
    setBranchPhone('');
    setEditBranchId('');
    setShowBranchForm(false);
    setRefreshKey(k => k + 1);
  };

  const handleAddTerminal = () => {
    if (!terminalName.trim()) { showAlert('แจ้งเตือน', 'กรุณากรอกชื่อเครื่อง terminal'); return; }
    branchStore.addTerminal(terminalName.trim(), isEnterprise ? selectedBranchId : undefined);
    setTerminalName('');
    setShowTerminalForm(false);
    setRefreshKey(k => k + 1);
  };

  const handleToggleTerminal = (t: Terminal) => {
    branchStore.updateTerminal(t.id, { status: t.status === 'active' ? 'inactive' : 'active' });
    setRefreshKey(k => k + 1);
  };

  const handleDeleteTerminal = (id: string) => {
    showConfirm('ลบ Terminal', 'ต้องการลบ Terminal นี้?', () => {
      branchStore.deleteTerminal(id);
      setRefreshKey(k => k + 1);
    });
  };

  return (
    <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerClassName={cn('p-4 gap-5')}>
      <Text className={cn('text-base font-extrabold text-slate-800')}>{isEnterprise ? 'จัดการสาขาและเครื่อง' : 'จัดการอุปกรณ์'}</Text>

      {isEnterprise && (
        <View className={cn('gap-3')}>
          <View className={cn('flex-row justify-between items-center')}>
            <Text className={cn('text-xs font-bold text-slate-800')}>สาขา</Text>
            <TouchableOpacity className={cn('flex-row items-center gap-1.5 bg-rose-500 px-3.5 py-2 rounded-lg shadow-sm')} onPress={() => { setShowBranchForm(true); setEditBranchId(''); setBranchName(''); setBranchAddress(''); setBranchPhone(''); }}>
              <Ionicons name="add-outline" size={18} color="#fafafa" />
              <Text className={cn('text-xs font-bold text-white')}>เพิ่มสาขา</Text>
            </TouchableOpacity>
          </View>

          {showBranchForm && (
            <View className={cn('bg-white rounded-2xl p-5 gap-3 shadow-sm border border-rose-100')}>
              <Text className={cn('text-xs font-bold text-slate-800')}>{editBranchId ? 'แก้ไขสาขา' : 'เพิ่มสาขาใหม่'}</Text>
              <TextInput className={cn('border border-rose-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 bg-rose-50')} value={branchName} onChangeText={setBranchName} placeholder="ชื่อสาขา *" placeholderTextColor="#cbd5e1" />
              <TextInput className={cn('border border-rose-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 bg-rose-50')} value={branchAddress} onChangeText={setBranchAddress} placeholder="ที่อยู่" placeholderTextColor="#cbd5e1" />
              <TextInput className={cn('border border-rose-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 bg-rose-50')} value={branchPhone} onChangeText={setBranchPhone} placeholder="เบอร์โทรศัพท์" placeholderTextColor="#cbd5e1" />
              <View className={cn('flex-row gap-2')}>
                <TouchableOpacity className={cn('px-4 py-2 rounded-xl border border-rose-200 bg-white')} onPress={resetBranchForm}><Text className={cn('text-xs font-semibold text-slate-600')}>ยกเลิก</Text></TouchableOpacity>
                <TouchableOpacity className={cn('px-4 py-2 rounded-xl bg-rose-500 shadow-sm')} onPress={handleSaveBranch}><Text className={cn('text-xs font-bold text-white')}>บันทึก</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {branches.length === 0 ? (
            <View className={cn('items-center py-10 gap-2.5')}><Ionicons name="business-outline" size={48} color="#fecdd3" /><Text className={cn('text-xs text-slate-400 font-medium')}>ยังไม่มีสาขา</Text></View>
          ) : (
            <View className={cn('flex-row flex-wrap gap-3.5')}>
              {branches.map(branch => (
                <TouchableOpacity key={branch.id} className={cn('w-[280px] bg-white rounded-2xl p-3.5 gap-2.5 border', selectedBranchId === branch.id ? 'border-rose-500 border-2' : 'border-rose-100 shadow-sm')} onPress={() => setSelectedBranchId(branch.id)}>
                  <View className={cn('flex-row items-center gap-2.5')}>
                    <View className={cn('w-9 h-9 rounded-full bg-rose-500 items-center justify-center')}><Ionicons name="business" size={18} color="#fafafa" /></View>
                    <View className={cn('flex-1')}>
                      <Text className={cn('text-xs font-bold text-slate-800')}>{branch.name}</Text>
                      {branch.address ? <Text className={cn('text-xs text-slate-500 font-medium')}>{branch.address}</Text> : null}
                      {branch.contactPhone ? (
                        <View className={cn('flex-row items-center gap-1')}>
                          <Ionicons name="call-outline" size={12} color="#64748b" />
                          <Text className={cn('text-xs text-slate-500 font-medium')}>{branch.contactPhone}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <View className={cn('flex-row gap-3 justify-end')}>
                    <TouchableOpacity onPress={() => handleEditBranch(branch)}><Text className={cn('text-xs text-rose-600 font-bold')}>แก้ไข</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteBranch(branch.id)}><Text className={cn('text-xs text-red-600 font-bold')}>ลบ</Text></TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {(!isEnterprise || selectedBranchId) && (
        <View className={cn('gap-3')}>
          <View className={cn('flex-row justify-between items-center')}>
            <Text className={cn('text-xs font-bold text-slate-800')}>
              {isEnterprise ? `เครื่อง POS - ${branches.find(b => b.id === selectedBranchId)?.name || ''}` : 'เครื่อง POS (Terminals)'}
            </Text>
            <TouchableOpacity className={cn('flex-row items-center gap-1.5 bg-rose-500 px-3.5 py-2 rounded-lg shadow-sm')} onPress={() => { setShowTerminalForm(true); setTerminalName(''); }}>
              <Ionicons name="add-outline" size={18} color="#fafafa" />
              <Text className={cn('text-xs font-bold text-white')}>เพิ่มเครื่อง</Text>
            </TouchableOpacity>
          </View>

          {showTerminalForm && (
            <View className={cn('bg-white rounded-2xl p-5 gap-3 shadow-sm border border-rose-100')}>
              <Text className={cn('text-xs font-bold text-slate-800')}>เพิ่มเครื่อง Terminal ใหม่</Text>
              <TextInput className={cn('border border-rose-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 bg-rose-50')} value={terminalName} onChangeText={setTerminalName} placeholder="ชื่อเครื่อง POS *" placeholderTextColor="#cbd5e1" />
              <View className={cn('flex-row gap-2')}>
                <TouchableOpacity className={cn('px-4 py-2 rounded-xl border border-rose-200 bg-white')} onPress={() => setShowTerminalForm(false)}><Text className={cn('text-xs font-semibold text-slate-600')}>ยกเลิก</Text></TouchableOpacity>
                <TouchableOpacity className={cn('px-4 py-2 rounded-xl bg-rose-500 shadow-sm')} onPress={handleAddTerminal}><Text className={cn('text-xs font-bold text-white')}>บันทึก</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {terminals.length === 0 ? (
            <View className={cn('items-center py-10 gap-2.5')}><Ionicons name="desktop-outline" size={48} color="#fecdd3" /><Text className={cn('text-xs text-slate-400 font-medium')}>ยังไม่มีเครื่อง POS</Text></View>
          ) : (
            <View className={cn('flex-row flex-wrap gap-3.5')}>
              {terminals.map(term => (
                <View key={term.id} className={cn('w-[280px] bg-white rounded-2xl p-3.5 gap-2.5 shadow-sm border border-rose-100')}>
                  <View className={cn('flex-row items-center gap-2.5')}>
                    <View className={cn('w-9 h-9 rounded-full bg-rose-500 items-center justify-center', term.status === 'inactive' && 'bg-slate-400')}>
                      <Ionicons name="desktop-outline" size={18} color="#fafafa" />
                    </View>
                    <View className={cn('flex-1')}>
                      <Text className={cn('text-xs font-bold text-slate-800')}>{term.name}</Text>
                      <Text className={cn('text-xs text-slate-500 font-medium')}>ID: {term.id.slice(0, 12)}...</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleToggleTerminal(term)}>
                      <Text className={cn('text-xs font-bold px-2 py-1 rounded-xl', term.status === 'active' ? 'text-emerald-700 bg-emerald-100' : 'text-slate-600 bg-slate-100')}>
                        {term.status === 'active' ? 'เปิดใช้งาน' : 'ปิด'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View className={cn('flex-row gap-3 justify-end')}>
                    <TouchableOpacity onPress={() => handleDeleteTerminal(term.id)}><Text className={cn('text-xs text-red-600 font-bold')}>ลบ</Text></TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {isEnterprise && !selectedBranchId && branches.length > 0 && (
        <View className={cn('items-center py-10 gap-2.5')}><Ionicons name="arrow-up-outline" size={32} color="#fecdd3" /><Text className={cn('text-xs text-slate-400 font-medium')}>กรุณาเลือกสาขาก่อน</Text></View>
      )}

      <AlertDialog visible={alertVisible} onClose={() => setAlertVisible(false)} title={alertTitle} message={alertMsg} variant="info" />
      <ConfirmModal visible={confirmVisible} onClose={() => setConfirmVisible(false)} title={confirmTitle} message={confirmMsg} variant="warning" onConfirm={() => { confirmAction(); setConfirmVisible(false); }} />
    </ScrollView>
  );
};
