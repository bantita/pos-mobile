/**
 * WebSegmentScreen — Segment ลูกค้า
 * แบ่งกลุ่มลูกค้าตามเงื่อนไข เพื่อใช้กับ Campaign / โปรโมชั่น
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { Colors } from '../../design-system/tokens';

interface Segment {
  id: string; name: string; conditions: string; memberCount: number; color: string;
}

const MOCK_SEGMENTS: Segment[] = [
  { id: 's1', name: 'สมาชิกใหม่ (7 วัน)', conditions: 'ลงทะเบียน ≤ 7 วัน', memberCount: 23, color: WebColors.success },
  { id: 's2', name: 'Gold ขึ้นไป', conditions: 'ระดับ Gold หรือ Platinum', memberCount: 156, color: WebColors.warning },
  { id: 's3', name: 'ไม่ซื้อ 30 วัน', conditions: 'ไม่มีรายการซื้อ 30 วัน', memberCount: 89, color: WebColors.danger },
  { id: 's4', name: 'วันเกิดเดือนนี้', conditions: 'วันเกิดอยู่ในเดือนปัจจุบัน', memberCount: 34, color: WebColors.purple },
  { id: 's5', name: 'ซื้อบ่อย (≥ 5 ครั้ง/เดือน)', conditions: 'จำนวนบิล ≥ 5 / 30 วัน', memberCount: 67, color: WebColors.info },
  { id: 's6', name: 'ยอดซื้อสูง (≥ 10,000/เดือน)', conditions: 'ยอดซื้อรวม ≥ 10,000 / 30 วัน', memberCount: 45, color: '#EC4899' },
];

export const WebSegmentScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [segments] = useState(MOCK_SEGMENTS);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  return (
    <ScrollView style={st.root} contentContainerStyle={st.content}>
      {onBack && (
        <TouchableOpacity style={st.backRow} onPress={onBack}>
          <Ionicons name="arrow-back" size={16} color={WebColors.primary} />
          <Text style={st.backText}>กลับ</Text>
        </TouchableOpacity>
      )}
      <View style={st.header}>
        <View>
          <Text style={st.title}>Segment ลูกค้า</Text>
          <Text style={st.subtitle}>แบ่งกลุ่มลูกค้าตามเงื่อนไข เพื่อใช้กับ Campaign / โปรโมชั่น</Text>
        </View>
        <TouchableOpacity style={st.createBtn} onPress={() => setShowCreate(!showCreate)}>
          <Ionicons name="add" size={14} color={WebColors.white} />
          <Text style={st.createBtnText}>สร้าง Segment</Text>
        </TouchableOpacity>
      </View>

      {showCreate && (
        <View style={st.card}>
          <Text style={st.cardTitle}>สร้าง Segment ใหม่</Text>
          <TextInput style={st.input} value={newName} onChangeText={setNewName} placeholder="ชื่อ Segment เช่น 'ลูกค้า VIP'" placeholderTextColor={WebColors.textSecondary} />
          <Text style={{ fontSize: 11, color: Colors.textSecondary }}>เงื่อนไข (เลือกได้หลายข้อ):</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {['ระดับสมาชิก', 'ยอดซื้อ/เดือน', 'จำนวนบิล/เดือน', 'วันเกิด', 'วันที่สมัคร', 'ไม่ซื้อ X วัน', 'หมวดสินค้าที่ซื้อ', 'สาขาที่ซื้อ'].map(c => (
              <TouchableOpacity key={c} style={st.chip}>
                <Ionicons name="add-circle-outline" size={12} color={WebColors.textSecondary} />
                <Text style={st.chipText}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={st.createBtn} onPress={() => setShowCreate(false)}><Text style={st.createBtnText}>บันทึก</Text></TouchableOpacity>
            <TouchableOpacity style={st.cancelBtn} onPress={() => setShowCreate(false)}><Text style={{ fontSize: 12, color: WebColors.textSecondary }}>ยกเลิก</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {/* Segment cards */}
      <View style={{ gap: 10 }}>
        {segments.map(seg => (
          <View key={seg.id} style={st.segCard}>
            <View style={[st.segIcon, { backgroundColor: seg.color + '18' }]}>
              <Ionicons name="people" size={18} color={seg.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.segName}>{seg.name}</Text>
              <Text style={st.segCond}>{seg.conditions}</Text>
            </View>
            <View style={st.segCount}>
              <Text style={[st.segCountVal, { color: seg.color }]}>{seg.memberCount}</Text>
              <Text style={st.segCountLabel}>คน</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, gap: 16 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 12, color: WebColors.primary, fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: WebColors.text },
  subtitle: { fontSize: 12, color: WebColors.textSecondary, marginTop: 2 },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: WebColors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  createBtnText: { fontSize: 12, fontWeight: '700', color: WebColors.white },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: WebColors.gray100 },
  card: { backgroundColor: WebColors.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: WebColors.border, gap: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: WebColors.text },
  input: { borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: WebColors.text },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: WebColors.border },
  chipText: { fontSize: 10, color: WebColors.textSecondary },
  segCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: WebColors.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: WebColors.border },
  segIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segName: { fontSize: 13, fontWeight: '600', color: WebColors.text },
  segCond: { fontSize: 10, color: WebColors.textSecondary, marginTop: 2 },
  segCount: { alignItems: 'center' },
  segCountVal: { fontSize: 18, fontWeight: '800' },
  segCountLabel: { fontSize: 9, color: WebColors.textSecondary },
});
