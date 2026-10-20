/**
 * WebSupplierScreen — จัดการผู้จำหน่าย (Supplier master)
 * โมเดลตาม WebBranchManageScreen (WebColors, card grid, inline form, confirm-on-delete)
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import * as supplierStore from '../../store/supplierStore';
import { Supplier } from '../../types/inventory';

export const WebSupplierScreen: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState('');
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [phone, setPhone] = useState('');
  const [contactName, setContactName] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // refreshKey ใช้บังคับ re-render หลังแต่ละ mutation (แบบเดียวกับ WebBranchManageScreen)
  void refreshKey;
  const suppliers = supplierStore.getSuppliers();

  const resetForm = () => {
    setName(''); setTaxId(''); setPhone(''); setContactName('');
    setEditId(''); setShowForm(false); setRefreshKey(k => k + 1);
  };

  const handleSave = () => {
    if (!name.trim()) { window.alert('กรุณากรอกชื่อผู้จำหน่าย'); return; }
    const data = {
      name: name.trim(),
      taxId: taxId.trim() || undefined,
      phone: phone.trim() || undefined,
      contactName: contactName.trim() || undefined,
    };
    if (editId) {
      supplierStore.updateSupplier(editId, data);
    } else {
      supplierStore.addSupplier(data);
    }
    resetForm();
  };

  const handleEdit = (sup: Supplier) => {
    setName(sup.name); setTaxId(sup.taxId || ''); setPhone(sup.phone || ''); setContactName(sup.contactName || '');
    setEditId(sup.id); setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('ลบผู้จำหน่ายนี้?')) {
      supplierStore.deleteSupplier(id);
      setRefreshKey(k => k + 1);
    }
  };

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>
      <View style={st.section}>
        <View style={st.headerRow}>
          <Text style={st.title}>จัดการผู้จำหน่าย</Text>
          <TouchableOpacity style={st.addBtn} onPress={() => { setShowForm(true); setEditId(''); setName(''); setTaxId(''); setPhone(''); setContactName(''); }}>
            <Ionicons name="add-outline" size={18} color="#fff" />
            <Text style={st.addText}>เพิ่มผู้จำหน่าย</Text>
          </TouchableOpacity>
        </View>

        {showForm && (
          <View style={st.form}>
            <Text style={st.formTitle}>{editId ? 'แก้ไขผู้จำหน่าย' : 'เพิ่มผู้จำหน่ายใหม่'}</Text>
            <TextInput style={st.input} value={name} onChangeText={setName} placeholder="ชื่อผู้จำหน่าย *" placeholderTextColor="#aaa" />
            <TextInput style={st.input} value={taxId} onChangeText={setTaxId} placeholder="เลขผู้เสียภาษี" placeholderTextColor="#aaa" />
            <TextInput style={st.input} value={phone} onChangeText={setPhone} placeholder="เบอร์โทร" placeholderTextColor="#aaa" />
            <TextInput style={st.input} value={contactName} onChangeText={setContactName} placeholder="ผู้ติดต่อ" placeholderTextColor="#aaa" />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={st.cancelBtn} onPress={resetForm}><Text style={st.cancelText}>ยกเลิก</Text></TouchableOpacity>
              <TouchableOpacity style={st.saveBtn} onPress={handleSave}><Text style={st.saveText}>บันทึก</Text></TouchableOpacity>
            </View>
          </View>
        )}

        {suppliers.length === 0 ? (
          <View style={st.empty}><Ionicons name="business-outline" size={48} color="#ddd" /><Text style={st.emptyText}>ยังไม่มีผู้จำหน่าย</Text></View>
        ) : (
          <View style={st.grid}>
            {suppliers.map(sup => (
              <View key={sup.id} style={st.card}>
                <View style={st.cardHeader}>
                  <View style={st.avatar}><Ionicons name="business" size={18} color="#fff" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.itemName}>{sup.name}</Text>
                    {sup.contactName ? <Text style={st.itemSub}>ผู้ติดต่อ: {sup.contactName}</Text> : null}
                    {sup.phone ? <Text style={st.itemSub}>☎ {sup.phone}</Text> : null}
                    {sup.taxId ? <Text style={st.itemSub}>เลขภาษี: {sup.taxId}</Text> : null}
                  </View>
                </View>
                <View style={st.cardActions}>
                  <TouchableOpacity onPress={() => handleEdit(sup)}><Text style={st.editText}>แก้ไข</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(sup.id)}><Text style={st.deleteText}>ลบ</Text></TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: WebColors.contentBg },
  content: { padding: 20, gap: 20 },
  section: { gap: 12 },
  title: { fontSize: 17, fontWeight: '800', color: WebColors.text },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WebColors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  form: { backgroundColor: WebColors.cardBg, borderRadius: 12, padding: 20, gap: 12, borderWidth: 1, borderColor: WebColors.cardBorder, maxWidth: 450 },
  formTitle: { fontSize: 14, fontWeight: '700', color: WebColors.text },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  cancelText: { fontSize: 13, fontWeight: '600', color: '#888' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: WebColors.primary },
  saveText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 13, color: '#999' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  card: { width: 280, backgroundColor: WebColors.cardBg, borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: WebColors.cardBorder },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: WebColors.primary, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 13, fontWeight: '700', color: WebColors.text },
  itemSub: { fontSize: 12, color: WebColors.textSecondary },
  cardActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  editText: { fontSize: 13, color: '#1976D2', fontWeight: '600' },
  deleteText: { fontSize: 13, color: '#C62828', fontWeight: '600' },
});
