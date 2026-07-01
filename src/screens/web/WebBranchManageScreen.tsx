/**
 * WebBranchManageScreen — Manage branches (ENTERPRISE) and terminals (RETAIL/ENTERPRISE)
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import * as branchStore from '../../store/branchStore';
import * as storeConfigStore from '../../store/storeConfigStore';
import { Branch, Terminal } from '../../types/store';

export const WebBranchManageScreen: React.FC = () => {
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

  const branches = branchStore.getBranches();
  const terminals = isEnterprise
    ? (selectedBranchId ? branchStore.getTerminalsByBranch(selectedBranchId) : [])
    : branchStore.getRetailTerminals();

  // ─── Branch handlers ────────────────────────────────────────────────────────
  const handleSaveBranch = () => {
    if (!branchName.trim()) { window.alert('กรุณากรอกชื่อสาขา'); return; }
    if (editBranchId) {
      branchStore.updateBranch(editBranchId, { name: branchName.trim(), address: branchAddress.trim(), contactPhone: branchPhone.trim() });
    } else {
      const b = branchStore.addBranch({ name: branchName.trim(), address: branchAddress.trim(), contactPhone: branchPhone.trim() });
      setSelectedBranchId(b.id);
    }
    resetBranchForm();
  };

  const handleEditBranch = (branch: Branch) => {
    setBranchName(branch.name); setBranchAddress(branch.address); setBranchPhone(branch.contactPhone || '');
    setEditBranchId(branch.id); setShowBranchForm(true);
  };

  const handleDeleteBranch = (id: string) => {
    if (window.confirm('ลบสาขานี้? (จุดขายในสาขาจะถูกลบด้วย)')) {
      branchStore.deleteBranch(id);
      if (selectedBranchId === id) setSelectedBranchId('');
      setRefreshKey(k => k + 1);
    }
  };

  const resetBranchForm = () => {
    setBranchName(''); setBranchAddress(''); setBranchPhone('');
    setEditBranchId(''); setShowBranchForm(false); setRefreshKey(k => k + 1);
  };

  // ─── Terminal handlers ──────────────────────────────────────────────────────
  const handleAddTerminal = () => {
    if (!terminalName.trim()) { window.alert('กรุณากรอกชื่อจุดขาย'); return; }
    branchStore.addTerminal(terminalName.trim(), isEnterprise ? selectedBranchId : undefined);
    setTerminalName(''); setShowTerminalForm(false); setRefreshKey(k => k + 1);
  };

  const handleToggleTerminal = (t: Terminal) => {
    branchStore.updateTerminal(t.id, { status: t.status === 'active' ? 'inactive' : 'active' });
    setRefreshKey(k => k + 1);
  };

  const handleDeleteTerminal = (id: string) => {
    if (window.confirm('ลบจุดขายนี้?')) { branchStore.deleteTerminal(id); setRefreshKey(k => k + 1); }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>
      <Text style={st.title}>{isEnterprise ? 'จัดการสาขาและจุดขาย' : 'จัดการจุดขาย'}</Text>

      {/* ── Branch section (ENTERPRISE only) ── */}
      {isEnterprise && (
        <View style={st.section}>
          <View style={st.headerRow}>
            <Text style={st.sectionTitle}>สาขา</Text>
            <TouchableOpacity style={st.addBtn} onPress={() => { setShowBranchForm(true); setEditBranchId(''); setBranchName(''); setBranchAddress(''); setBranchPhone(''); }}>
              <Ionicons name="add-outline" size={18} color="#fff" />
              <Text style={st.addText}>เพิ่มสาขา</Text>
            </TouchableOpacity>
          </View>

          {showBranchForm && (
            <View style={st.form}>
              <Text style={st.formTitle}>{editBranchId ? 'แก้ไขสาขา' : 'เพิ่มสาขาใหม่'}</Text>
              <TextInput style={st.input} value={branchName} onChangeText={setBranchName} placeholder="ชื่อสาขา *" placeholderTextColor="#aaa" />
              <TextInput style={st.input} value={branchAddress} onChangeText={setBranchAddress} placeholder="ที่อยู่" placeholderTextColor="#aaa" />
              <TextInput style={st.input} value={branchPhone} onChangeText={setBranchPhone} placeholder="เบอร์โทรติดต่อ" placeholderTextColor="#aaa" />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={st.cancelBtn} onPress={resetBranchForm}><Text style={st.cancelText}>ยกเลิก</Text></TouchableOpacity>
                <TouchableOpacity style={st.saveBtn} onPress={handleSaveBranch}><Text style={st.saveText}>บันทึก</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {branches.length === 0 ? (
            <View style={st.empty}><Ionicons name="business-outline" size={48} color="#ddd" /><Text style={st.emptyText}>ยังไม่มีสาขา</Text></View>
          ) : (
            <View style={st.grid}>
              {branches.map(branch => (
                <TouchableOpacity key={branch.id} style={[st.card, selectedBranchId === branch.id && st.cardSelected]} onPress={() => setSelectedBranchId(branch.id)}>
                  <View style={st.cardHeader}>
                    <View style={st.avatar}><Ionicons name="business" size={18} color="#fff" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.itemName}>{branch.name}</Text>
                      {branch.address ? <Text style={st.itemSub}>{branch.address}</Text> : null}
                      {branch.contactPhone ? <Text style={st.itemSub}>☎ {branch.contactPhone}</Text> : null}
                    </View>
                  </View>
                  <View style={st.cardActions}>
                    <TouchableOpacity onPress={() => handleEditBranch(branch)}><Text style={st.editText}>แก้ไข</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteBranch(branch.id)}><Text style={st.deleteText}>ลบ</Text></TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── Terminal section ── */}
      {(!isEnterprise || selectedBranchId) && (
        <View style={st.section}>
          <View style={st.headerRow}>
            <Text style={st.sectionTitle}>
              {isEnterprise ? `จุดขาย — ${branches.find(b => b.id === selectedBranchId)?.name || ''}` : 'จุดขาย (Terminals)'}
            </Text>
            <TouchableOpacity style={st.addBtn} onPress={() => { setShowTerminalForm(true); setTerminalName(''); }}>
              <Ionicons name="add-outline" size={18} color="#fff" />
              <Text style={st.addText}>เพิ่มจุดขาย</Text>
            </TouchableOpacity>
          </View>

          {showTerminalForm && (
            <View style={st.form}>
              <Text style={st.formTitle}>เพิ่มจุดขายใหม่</Text>
              <TextInput style={st.input} value={terminalName} onChangeText={setTerminalName} placeholder="ชื่อจุดขาย *" placeholderTextColor="#aaa" />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={st.cancelBtn} onPress={() => setShowTerminalForm(false)}><Text style={st.cancelText}>ยกเลิก</Text></TouchableOpacity>
                <TouchableOpacity style={st.saveBtn} onPress={handleAddTerminal}><Text style={st.saveText}>บันทึก</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {terminals.length === 0 ? (
            <View style={st.empty}><Ionicons name="desktop-outline" size={48} color="#ddd" /><Text style={st.emptyText}>ยังไม่มีจุดขาย</Text></View>
          ) : (
            <View style={st.grid}>
              {terminals.map(term => (
                <View key={term.id} style={st.card}>
                  <View style={st.cardHeader}>
                    <View style={[st.avatar, term.status === 'inactive' && { backgroundColor: '#bbb' }]}>
                      <Ionicons name="desktop-outline" size={18} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.itemName}>{term.name}</Text>
                      <Text style={st.itemSub}>ID: {term.id.slice(0, 12)}…</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleToggleTerminal(term)}>
                      <Text style={[st.statusBadge, term.status === 'active' ? st.statusGreen : st.statusGray]}>
                        {term.status === 'active' ? 'ใช้งาน' : 'ปิดใช้'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={st.cardActions}>
                    <TouchableOpacity onPress={() => handleDeleteTerminal(term.id)}><Text style={st.deleteText}>ลบ</Text></TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {isEnterprise && !selectedBranchId && branches.length > 0 && (
        <View style={st.empty}><Ionicons name="arrow-up-outline" size={32} color="#ddd" /><Text style={st.emptyText}>เลือกสาขาเพื่อดูจุดขาย</Text></View>
      )}

      {/* ── Shift Schedule Section ── */}
      <ShiftScheduleSection />
    </ScrollView>
  );
};

// ─── Shift Schedule Section ────────────────────────────────────────────────────
const ShiftScheduleSection: React.FC = () => {
  const [shifts, setShifts] = useState([
    { id: '1', name: 'กะเช้า', startTime: '06:00', endTime: '15:00', enabled: true },
    { id: '2', name: 'กะบ่าย', startTime: '15:00', endTime: '22:00', enabled: true },
    { id: '3', name: 'กะดึก', startTime: '22:00', endTime: '06:00', enabled: false },
  ]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  const handleEdit = (shift: typeof shifts[0]) => {
    setEditing(shift.id);
    setEditName(shift.name);
    setEditStart(shift.startTime);
    setEditEnd(shift.endTime);
  };

  const handleSave = () => {
    if (!editing) return;
    setShifts(s => s.map(sh => sh.id === editing ? { ...sh, name: editName, startTime: editStart, endTime: editEnd } : sh));
    setEditing(null);
  };

  const handleToggle = (id: string) => {
    setShifts(s => s.map(sh => sh.id === id ? { ...sh, enabled: !sh.enabled } : sh));
  };

  const handleAdd = () => {
    const newShift = { id: String(Date.now()), name: `กะที่ ${shifts.length + 1}`, startTime: '08:00', endTime: '17:00', enabled: true };
    setShifts(s => [...s, newShift]);
    handleEdit(newShift);
  };

  return (
    <View style={st.section}>
      <View style={st.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="time-outline" size={18} color={WebColors.primary} />
          <Text style={st.sectionTitle}>ตั้งเวลาเปิด-ปิดกะ</Text>
        </View>
        <TouchableOpacity style={st.addBtn} onPress={handleAdd}>
          <Ionicons name="add-outline" size={18} color="#fff" />
          <Text style={st.addText}>เพิ่มกะ</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
        กำหนดช่วงเวลาเปิด-ปิดกะของร้าน เพื่อใช้ในระบบเปิด/ปิดกะอัตโนมัติ
      </Text>

      {shifts.map(shift => (
        <View key={shift.id} style={[st.card, { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
          {editing === shift.id ? (
            <View style={{ flex: 1, gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={[st.input, { flex: 1 }]} value={editName} onChangeText={setEditName} placeholder="ชื่อกะ" placeholderTextColor="#aaa" />
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {Platform.OS === 'web' ? (
                    <>
                      <input type="time" value={editStart} onChange={(e: any) => setEditStart(e.target.value)} style={{ flex: 1, height: 36, border: '1px solid #ddd', borderRadius: 8, paddingLeft: 8, paddingRight: 8, fontSize: 13 }} />
                      <Text style={{ color: '#888' }}>ถึง</Text>
                      <input type="time" value={editEnd} onChange={(e: any) => setEditEnd(e.target.value)} style={{ flex: 1, height: 36, border: '1px solid #ddd', borderRadius: 8, paddingLeft: 8, paddingRight: 8, fontSize: 13 }} />
                    </>
                  ) : (
                    <>
                      <TextInput style={[st.input, { flex: 1 }]} value={editStart} onChangeText={setEditStart} placeholder="HH:MM" placeholderTextColor="#aaa" />
                      <Text style={{ color: '#888' }}>ถึง</Text>
                      <TextInput style={[st.input, { flex: 1 }]} value={editEnd} onChangeText={setEditEnd} placeholder="HH:MM" placeholderTextColor="#aaa" />
                    </>
                  )}
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={st.cancelBtn} onPress={() => setEditing(null)}><Text style={st.cancelText}>ยกเลิก</Text></TouchableOpacity>
                <TouchableOpacity style={st.saveBtn} onPress={handleSave}><Text style={st.saveText}>บันทึก</Text></TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Ionicons name="time-outline" size={20} color={shift.enabled ? WebColors.primary : '#bbb'} />
              <View style={{ flex: 1 }}>
                <Text style={[st.itemName, !shift.enabled && { color: '#bbb' }]}>{shift.name}</Text>
                <Text style={st.itemSub}>{shift.startTime} — {shift.endTime}</Text>
              </View>
              <TouchableOpacity onPress={() => handleToggle(shift.id)}>
                <Text style={[st.statusBadge, shift.enabled ? st.statusGreen : st.statusGray]}>
                  {shift.enabled ? 'เปิดใช้' : 'ปิดใช้'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEdit(shift)} style={{ paddingHorizontal: 8 }}>
                <Text style={st.editText}>แก้ไข</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShifts(s => s.filter(sh => sh.id !== shift.id))} style={{ paddingHorizontal: 8 }}>
                <Text style={st.deleteText}>ลบ</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ))}
    </View>
  );
};

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: WebColors.contentBg },
  content: { padding: 20, gap: 20 },
  title: { fontSize: 17, fontWeight: '800', color: WebColors.text },
  section: { gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: WebColors.text },
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
  cardSelected: { borderColor: WebColors.primary, borderWidth: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: WebColors.primary, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 13, fontWeight: '700', color: WebColors.text },
  itemSub: { fontSize: 15, color: WebColors.textSecondary },
  statusBadge: { fontSize: 14, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusGreen: { color: '#2E7D32', backgroundColor: '#E8F5E9' },
  statusGray: { color: '#616161', backgroundColor: '#F5F5F5' },
  cardActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  editText: { fontSize: 15, color: '#1976D2', fontWeight: '600' },
  deleteText: { fontSize: 15, color: '#C62828', fontWeight: '600' },
});
