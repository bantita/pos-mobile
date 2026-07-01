/**
 * WebCampaignScreen — Campaign Marketing
 * สร้าง/จัดการแคมเปญ ส่งโปรผ่าน LINE, SMS, Push
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { Colors } from '../../design-system/tokens';

interface Campaign {
  id: string; name: string; channel: string; segment: string;
  status: 'draft' | 'scheduled' | 'sent' | 'active';
  sentAt?: string; scheduledAt?: string;
  reach: number; opened: number; converted: number;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: 'Welcome สมาชิกใหม่', channel: 'LINE', segment: 'สมาชิกใหม่', status: 'active', reach: 245, opened: 180, converted: 42 },
  { id: 'c2', name: 'Flash Friday ลด 20%', channel: 'LINE', segment: 'ทุกคน', status: 'sent', sentAt: '2026-06-20', reach: 1200, opened: 890, converted: 156 },
  { id: 'c3', name: 'Birthday Month', channel: 'LINE + SMS', segment: 'เกิดเดือน มิ.ย.', status: 'scheduled', scheduledAt: '2026-07-01', reach: 0, opened: 0, converted: 0 },
  { id: 'c4', name: 'Win Back ไม่มา 30 วัน', channel: 'LINE', segment: 'ไม่ซื้อ 30 วัน', status: 'draft', reach: 0, opened: 0, converted: 0 },
];

export const WebCampaignScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [campaigns] = useState(MOCK_CAMPAIGNS);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newChannel, setNewChannel] = useState('LINE');
  const [newSegment, setNewSegment] = useState('ทุกคน');

  const statusColor = (s: string) => s === 'active' ? WebColors.success : s === 'sent' ? WebColors.info : s === 'scheduled' ? WebColors.warning : WebColors.textSecondary;
  const statusLabel = (s: string) => s === 'active' ? 'ใช้งาน' : s === 'sent' ? 'ส่งแล้ว' : s === 'scheduled' ? 'ตั้งเวลา' : 'แบบร่าง';

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
          <Text style={st.title}>Campaign Marketing</Text>
          <Text style={st.subtitle}>สร้างและจัดการแคมเปญส่งโปร/ข่าวสาร ผ่าน LINE, SMS</Text>
        </View>
        <TouchableOpacity style={st.createBtn} onPress={() => setShowCreate(!showCreate)}>
          <Ionicons name="add" size={14} color={WebColors.white} />
          <Text style={st.createBtnText}>สร้างแคมเปญ</Text>
        </TouchableOpacity>
      </View>

      {/* KPI */}
      <View style={st.kpiRow}>
        <View style={st.kpi}><Text style={[st.kpiVal, { color: WebColors.purple }]}>{campaigns.length}</Text><Text style={st.kpiLabel}>แคมเปญทั้งหมด</Text></View>
        <View style={st.kpi}><Text style={[st.kpiVal, { color: WebColors.success }]}>{campaigns.filter(c => c.status === 'active').length}</Text><Text style={st.kpiLabel}>กำลังใช้งาน</Text></View>
        <View style={st.kpi}><Text style={[st.kpiVal, { color: WebColors.info }]}>{campaigns.reduce((s, c) => s + c.reach, 0).toLocaleString()}</Text><Text style={st.kpiLabel}>เข้าถึงทั้งหมด</Text></View>
        <View style={st.kpi}><Text style={[st.kpiVal, { color: WebColors.primary }]}>{campaigns.reduce((s, c) => s + c.converted, 0)}</Text><Text style={st.kpiLabel}>Conversion</Text></View>
      </View>

      {/* Create form */}
      {showCreate && (
        <View style={st.card}>
          <Text style={st.cardTitle}>สร้างแคมเปญใหม่</Text>
          <TextInput style={st.input} value={newName} onChangeText={setNewName} placeholder="ชื่อแคมเปญ..." placeholderTextColor={WebColors.textSecondary} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['LINE', 'SMS', 'LINE + SMS', 'Push'].map(ch => (
              <TouchableOpacity key={ch} style={[st.chip, newChannel === ch && st.chipOn]} onPress={() => setNewChannel(ch)}>
                <Text style={[st.chipText, newChannel === ch && st.chipTextOn]}>{ch}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['ทุกคน', 'สมาชิกใหม่', 'Gold ขึ้นไป', 'ไม่ซื้อ 30 วัน', 'เกิดเดือนนี้'].map(seg => (
              <TouchableOpacity key={seg} style={[st.chip, newSegment === seg && st.chipOn]} onPress={() => setNewSegment(seg)}>
                <Text style={[st.chipText, newSegment === seg && st.chipTextOn]}>{seg}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={st.createBtn} onPress={() => { setShowCreate(false); setNewName(''); }}>
              <Text style={st.createBtnText}>บันทึก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.cancelBtn} onPress={() => setShowCreate(false)}>
              <Text style={st.cancelText}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Campaign list */}
      <View style={st.card}>
        {campaigns.map((c, idx) => (
          <TouchableOpacity key={c.id} style={[st.row, idx > 0 && st.rowBorder]} onPress={() => alert(`📋 ${c.name}\n\nChannel: ${c.channel}\nSegment: ${c.segment}\nสถานะ: ${statusLabel(c.status)}\n\nเข้าถึง: ${c.reach} คน\nเปิดอ่าน: ${c.opened} คน\nซื้อจริง: ${c.converted} คน${c.sentAt ? '\nส่งเมื่อ: ' + c.sentAt : ''}${c.scheduledAt ? '\nตั้งเวลา: ' + c.scheduledAt : ''}`)}>
            <View style={st.iconWrap}>
              <Ionicons name={c.channel.includes('LINE') ? 'chatbubble' : 'mail'} size={18} color={WebColors.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.rowTitle}>{c.name}</Text>
              <Text style={st.rowSub}>{c.channel} · {c.segment}{c.sentAt ? ` · ส่ง ${c.sentAt}` : ''}{c.scheduledAt ? ` · ตั้งเวลา ${c.scheduledAt}` : ''}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <View style={[st.statusBadge, { backgroundColor: statusColor(c.status) + '18' }]}>
                <Text style={[st.statusText, { color: statusColor(c.status) }]}>{statusLabel(c.status)}</Text>
              </View>
              {c.reach > 0 && <Text style={{ fontSize: 10, color: Colors.textSecondary }}>เข้าถึง {c.reach} · เปิด {c.opened} · ซื้อ {c.converted}</Text>}
            </View>
          </TouchableOpacity>
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
  cancelText: { fontSize: 12, color: WebColors.textSecondary },
  kpiRow: { flexDirection: 'row', gap: 12 },
  kpi: { flex: 1, backgroundColor: WebColors.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: WebColors.border, alignItems: 'center' },
  kpiVal: { fontSize: 18, fontWeight: '800' },
  kpiLabel: { fontSize: 10, color: WebColors.textSecondary, marginTop: 4 },
  card: { backgroundColor: WebColors.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: WebColors.border, gap: 12 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: WebColors.text },
  input: { borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: WebColors.text },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: WebColors.border, backgroundColor: WebColors.white },
  chipOn: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  chipText: { fontSize: 11, color: WebColors.textSecondary },
  chipTextOn: { color: WebColors.white },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: WebColors.gray100 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: WebColors.purpleLight, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 13, fontWeight: '600', color: WebColors.text },
  rowSub: { fontSize: 10, color: WebColors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '600' },
});
