/**
 * WebBrandScreen — จัดการแบรนด์ (Brand master)
 * โมเดลตาม WebBranchManageScreen / WebSupplierScreen
 * (WebColors, card grid, inline form, confirm-on-delete, empty state)
 * brandStore เป็น single source of truth — แบรนด์ที่เพิ่มที่นี่จะไปโผล่ใน product picker
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import * as brandStore from '../../store/brandStore';
import { Brand } from '../../types/product';

export const WebBrandScreen: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [refreshKey, setRefreshKey] = useState(0);

  // refreshKey ใช้บังคับ re-render หลังแต่ละ mutation (แบบเดียวกับ WebBranchManageScreen)
  void refreshKey;
  const brands = brandStore.getBrands();

  const resetForm = () => {
    setName(''); setStatus('active');
    setEditId(''); setShowForm(false); setRefreshKey(k => k + 1);
  };

  const handleSave = () => {
    if (!name.trim()) { window.alert('กรุณากรอกชื่อแบรนด์'); return; }
    if (editId) {
      brandStore.updateBrand(editId, { name: name.trim(), status });
    } else {
      brandStore.addBrand({ name: name.trim(), status });
    }
    resetForm();
  };

  const handleEdit = (brand: Brand) => {
    setName(brand.name); setStatus(brand.status);
    setEditId(brand.id); setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('ลบแบรนด์นี้?')) {
      brandStore.deleteBrand(id);
      setRefreshKey(k => k + 1);
    }
  };

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>
      <View style={st.section}>
        <View style={st.headerRow}>
          <Text style={st.title}>จัดการแบรนด์</Text>
          <TouchableOpacity style={st.addBtn} onPress={() => { setShowForm(true); setEditId(''); setName(''); setStatus('active'); }}>
            <Ionicons name="add-outline" size={18} color="#fff" />
            <Text style={st.addText}>เพิ่มแบรนด์</Text>
          </TouchableOpacity>
        </View>

        {showForm && (
          <View style={st.form}>
            <Text style={st.formTitle}>{editId ? 'แก้ไขแบรนด์' : 'เพิ่มแบรนด์ใหม่'}</Text>
            <TextInput style={st.input} value={name} onChangeText={setName} placeholder="ชื่อแบรนด์ *" placeholderTextColor="#aaa" />
            <View style={st.statusRow}>
              <Text style={st.statusLabel}>สถานะ</Text>
              <Switch
                value={status === 'active'}
                onValueChange={v => setStatus(v ? 'active' : 'inactive')}
                trackColor={{ true: WebColors.success, false: '#ddd' }}
              />
              <Text style={[st.statusText, { color: status === 'active' ? WebColors.success : WebColors.textSecondary }]}>
                {status === 'active' ? 'ใช้งาน' : 'ปิดใช้'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={st.cancelBtn} onPress={resetForm}><Text style={st.cancelText}>ยกเลิก</Text></TouchableOpacity>
              <TouchableOpacity style={st.saveBtn} onPress={handleSave}><Text style={st.saveText}>บันทึก</Text></TouchableOpacity>
            </View>
          </View>
        )}

        {brands.length === 0 ? (
          <View style={st.empty}><Ionicons name="ribbon-outline" size={48} color="#ddd" /><Text style={st.emptyText}>ยังไม่มีแบรนด์</Text></View>
        ) : (
          <View style={st.grid}>
            {brands.map(brand => {
              const count = brandStore.getBrandProductCount(brand.id);
              return (
                <View key={brand.id} style={st.card}>
                  <View style={st.cardHeader}>
                    <View style={st.avatar}><Ionicons name="ribbon" size={18} color="#fff" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.itemName}>{brand.name}</Text>
                      <Text style={st.itemSub}>{count} สินค้า</Text>
                      <Text style={[st.itemSub, { color: brand.status === 'active' ? WebColors.success : WebColors.textSecondary }]}>
                        {brand.status === 'active' ? 'ใช้งาน' : 'ปิดใช้'}
                      </Text>
                    </View>
                  </View>
                  <View style={st.cardActions}>
                    <TouchableOpacity onPress={() => handleEdit(brand)}><Text style={st.editText}>แก้ไข</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(brand.id)}><Text style={st.deleteText}>ลบ</Text></TouchableOpacity>
                  </View>
                </View>
              );
            })}
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
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusLabel: { fontSize: 13, fontWeight: '600', color: WebColors.text },
  statusText: { fontSize: 13, fontWeight: '600' },
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
