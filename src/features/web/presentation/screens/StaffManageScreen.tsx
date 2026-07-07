import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';
import * as staffStore from '@/features/settings/application/stores/staffStore';
import { Technician } from '@/features/settings/domain/store';

export const StaffManageScreen: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [alertDialog, setAlertDialog] = useState({ visible: false, title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ visible: false, title: '', message: '', onConfirm: () => {} });

  const technicians = staffStore.getTechnicians();

  const handleSave = () => {
    if (!name.trim()) {
      setAlertDialog({ visible: true, title: 'กรุณากรอกข้อมูล', message: 'กรุณากรอกชื่อช่าง' });
      return;
    }
    if (editId) {
      staffStore.updateTechnician(editId, { name: name.trim(), position: position.trim() });
    } else {
      staffStore.addTechnician({ name: name.trim(), position: position.trim() || 'ช่าง', status: 'available' });
    }
    setName(''); setPosition(''); setEditId(''); setShowForm(false); setRefreshKey(k => k + 1);
  };

  const handleEdit = (tech: Technician) => {
    setName(tech.name); setPosition(tech.position); setEditId(tech.id); setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setConfirmModal({ visible: true, title: 'ลบช่าง', message: 'ลบช่างนี้?', onConfirm: () => { staffStore.deleteTechnician(id); setRefreshKey(k => k + 1); } });
  };

  const toggleStatus = (tech: Technician) => {
    staffStore.updateTechnician(tech.id, { status: tech.status === 'available' ? 'unavailable' : 'available' });
    setRefreshKey(k => k + 1);
  };

  return (
    <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View className={cn('bg-rose-600 rounded-2xl p-4 shadow-lg shadow-rose-500/40')}>
        <Text className={cn('text-lg font-extrabold text-white')}>จัดการพนักงาน/ช่าง</Text>
      </View>

      <View className={cn('flex-row justify-between items-center')}>
        <Text className={cn('text-xs font-bold text-slate-500')}>{technicians.length} คน</Text>
        <TouchableOpacity className={cn('flex-row items-center gap-1.5 bg-rose-500 rounded-xl px-4 py-2.5 shadow-sm')}
          onPress={() => { setShowForm(true); setEditId(''); setName(''); setPosition(''); }}>
          <Ionicons name="add-outline" size={16} color="#fff" />
          <Text className={cn('text-sm font-bold text-white')}>เพิ่มช่าง</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View className={cn('bg-white rounded-2xl p-5 border border-slate-200 shadow-sm gap-3 max-w-[450px]')}>
          <Text className={cn('text-sm font-extrabold text-slate-800')}>
            {editId ? 'แก้ไขข้อมูลช่าง' : 'เพิ่มช่างใหม่'}
          </Text>
          <TextInput
            className={cn('border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 bg-white')}
            value={name} onChangeText={setName} placeholder="ชื่อ-นามสกุล *" placeholderTextColor="#94a3b8"
          />
          <TextInput
            className={cn('border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 bg-white')}
            value={position} onChangeText={setPosition} placeholder="ตำแหน่ง (เช่น ช่างซ่อม)" placeholderTextColor="#94a3b8"
          />
          <View className={cn('flex-row gap-2')}>
            <TouchableOpacity className={cn('flex-1 bg-rose-500 rounded-xl px-4 py-2.5 items-center shadow-sm')} onPress={handleSave}>
              <Text className={cn('text-sm font-bold text-white')}>บันทึก</Text>
            </TouchableOpacity>
            <TouchableOpacity className={cn('px-4 py-2.5 rounded-xl border border-slate-200 bg-white items-center')} onPress={() => setShowForm(false)}>
              <Text className={cn('text-sm font-bold text-slate-500')}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {technicians.length === 0 ? (
        <View className={cn('items-center py-16 gap-3')}>
          <Ionicons name="people-outline" size={48} color="#d4d4d4" />
          <Text className={cn('text-sm font-medium text-slate-400')}>ยังไม่มีข้อมูลพนักงาน</Text>
        </View>
      ) : (
        <View className={cn('flex-row flex-wrap gap-3')}>
          {technicians.map(tech => (
            <View key={tech.id} className={cn('w-[280px] bg-white rounded-2xl p-4 border border-slate-200 shadow-sm gap-3')}>
              <View className={cn('flex-row items-center gap-3')}>
                <View className={cn('w-9 h-9 rounded-full bg-rose-500 items-center justify-center', tech.status === 'unavailable' && 'bg-slate-300')}>
                  <Ionicons name="person" size={18} color="#fff" />
                </View>
                <View className={cn('flex-1')}>
                  <Text className={cn('text-sm font-bold text-slate-800')}>{tech.name}</Text>
                  <Text className={cn('text-xs font-medium text-slate-500')}>{tech.position}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleStatus(tech)}>
                  <Text className={cn('text-xs font-bold px-3 py-1.5 rounded-lg', tech.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400')}>
                    {tech.status === 'available' ? 'พร้อม' : 'ไม่ว่าง'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View className={cn('flex-row gap-3 justify-end')}>
                <TouchableOpacity onPress={() => handleEdit(tech)}>
                  <Text className={cn('text-xs font-bold text-sky-600')}>แก้ไข</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(tech.id)}>
                  <Text className={cn('text-xs font-bold text-red-500')}>ลบ</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <AlertDialog
        visible={alertDialog.visible}
        onClose={() => setAlertDialog({ visible: false, title: '', message: '' })}
        title={alertDialog.title}
        message={alertDialog.message}
        variant="warning"
      />
      <ConfirmModal
        visible={confirmModal.visible}
        onClose={() => setConfirmModal({ visible: false, title: '', message: '', onConfirm: () => {} })}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => { confirmModal.onConfirm(); setConfirmModal({ visible: false, title: '', message: '', onConfirm: () => {} }); }}
        variant="danger"
      />
    </ScrollView>
  );
};
