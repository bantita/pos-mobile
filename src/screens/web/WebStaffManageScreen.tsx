/**
 * WebStaffManageScreen — Manage technicians/staff (SERVICE store type)
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import * as staffStore from '../../store/staffStore';
import { Technician } from '../../types/store';

export const WebStaffManageScreen: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const technicians = staffStore.getTechnicians();

  const handleSave = () => {
    if (!name.trim()) { window.alert('กรุณากรอกชื่อช่าง'); return; }
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
    if (window.confirm('ลบช่างนี้?')) { staffStore.deleteTechnician(id); setRefreshKey(k => k + 1); }
  };

  const toggleStatus = (tech: Technician) => {
    staffStore.updateTechnician(tech.id, { status: tech.status === 'available' ? 'unavailable' : 'available' });
    setRefreshKey(k => k + 1);
  };

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>
      <View style={st.headerRow}>
        <Text style={st.title}>จัดการพนักงาน/ช่าง</Text>
        <TouchableOpacity style={st.addBtn} onPress={() => { setShowForm(true); setEditId(''); setName(''); setPosition(''); }}>
          <Ionicons name="add-outline" size={18} color={WebColors.white} />
          <Text style={st.addText}>เพิ่มช่าง</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={st.form}>
          <Text style={st.formTitle}>{editId ? 'แก้ไขข้อมูลช่าง' : 'เพิ่มช่างใหม่'}</Text>
          <TextInput style={st.input} value={name} onChangeText={setName} placeholder="ชื่อช่าง *" placeholderTextColor={WebColors.textDisabled} />
          <TextInput style={st.input} value={position} onChangeText={setPosition} placeholder="ตำแหน่ง (เช่น ช่างตัดผม)" placeholderTextColor={WebColors.textDisabled} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={st.cancelBtn} onPress={() => setShowForm(false)}><Text style={st.cancelText}>ยกเลิก</Text></TouchableOpacity>
            <TouchableOpacity style={st.saveBtn} onPress={handleSave}><Text style={st.saveText}>บันทึก</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {technicians.length === 0 ? (
        <View style={st.empty}><Ionicons name="people-outline" size={48} color={WebColors.border} /><Text style={st.emptyText}>ยังไม่มีข้อมูลช่าง</Text></View>
      ) : (
        <View style={st.grid}>
          {technicians.map(tech => (
            <View key={tech.id} style={st.card}>
              <View style={st.cardHeader}>
                <View style={[st.avatar, tech.status === 'unavailable' && { backgroundColor: WebColors.gray300 }]}>
                  <Ionicons name="person" size={18} color={WebColors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.techName}>{tech.name}</Text>
                  <Text style={st.techPos}>{tech.position}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleStatus(tech)}>
                  <Text style={[st.statusBadge, tech.status === 'available' ? st.statusGreen : st.statusGray]}>
                    {tech.status === 'available' ? 'ว่าง' : 'ไม่ว่าง'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={st.cardActions}>
                <TouchableOpacity onPress={() => handleEdit(tech)}><Text style={st.editText}>แก้ไข</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(tech.id)}><Text style={st.deleteText}>ลบ</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: WebColors.gray50 },
  content: { padding: 20, gap: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '800', color: WebColors.grayDark },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WebColors.danger, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addText: { color: WebColors.white, fontSize: 13, fontWeight: '700' },
  form: { backgroundColor: WebColors.white, borderRadius: 12, padding: 20, gap: 12, borderWidth: 1, borderColor: WebColors.border, maxWidth: 450 },
  formTitle: { fontSize: 14, fontWeight: '700', color: WebColors.grayDark },
  input: { borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: WebColors.border },
  cancelText: { fontSize: 13, fontWeight: '600', color: WebColors.textSecondary },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: WebColors.danger },
  saveText: { fontSize: 13, fontWeight: '700', color: WebColors.white },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 13, color: WebColors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  card: { width: 280, backgroundColor: WebColors.white, borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: WebColors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: WebColors.danger, alignItems: 'center', justifyContent: 'center' },
  techName: { fontSize: 13, fontWeight: '700', color: WebColors.grayDark },
  techPos: { fontSize: 15, color: WebColors.textSecondary },
  statusBadge: { fontSize: 14, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusGreen: { color: WebColors.success, backgroundColor: WebColors.successLight },
  statusGray: { color: WebColors.textSecondary, backgroundColor: WebColors.gray100 },
  cardActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  editText: { fontSize: 15, color: WebColors.info, fontWeight: '600' },
  deleteText: { fontSize: 15, color: WebColors.danger, fontWeight: '600' },
});
