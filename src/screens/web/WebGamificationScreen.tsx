/**
 * WebGamificationScreen — Gamification (เล่นเกม/สะสม)
 * ระบบ Spin Wheel, Stamp Card, Lucky Draw, Mission
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { Colors } from '../../design-system/tokens';

interface GameConfig {
  id: string; name: string; type: string; icon: string;
  desc: string; enabled: boolean; participants: number;
}

const MOCK_GAMES: GameConfig[] = [
  { id: 'g1', name: 'Spin Wheel รางวัลประจำสัปดาห์', type: 'spin', icon: 'sync-circle', desc: 'หมุนวงล้อลุ้นส่วนลด 5-50%', enabled: true, participants: 345 },
  { id: 'g2', name: 'Stamp Card สะสม 10 แลกฟรี', type: 'stamp', icon: 'grid', desc: 'ซื้อครบ 10 ครั้ง รับเครื่องดื่มฟรี 1 แก้ว', enabled: true, participants: 890 },
  { id: 'g3', name: 'Lucky Draw ปีใหม่', type: 'lucky', icon: 'gift', desc: 'ซื้อครบ 500 รับสิทธิ์ลุ้น iPhone', enabled: false, participants: 1200 },
  { id: 'g4', name: 'Daily Check-in', type: 'mission', icon: 'calendar', desc: 'เช็คอินร้านทุกวัน สะสม 7 วันรับคูปอง', enabled: true, participants: 567 },
  { id: 'g5', name: 'Refer a Friend', type: 'mission', icon: 'people', desc: 'แนะนำเพื่อน ทั้งคู่ได้แต้ม 50', enabled: true, participants: 234 },
];

export const WebGamificationScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [games, setGames] = useState(MOCK_GAMES);

  const toggleGame = (id: string) => {
    setGames(prev => prev.map(g => g.id === id ? { ...g, enabled: !g.enabled } : g));
  };

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
          <Text style={st.title}>Gamification</Text>
          <Text style={st.subtitle}>ระบบเกม/สะสม เพิ่ม engagement กับลูกค้า</Text>
        </View>
        <TouchableOpacity style={st.createBtn} onPress={() => alert('สร้างเกมใหม่:\n\nเลือกประเภท:\n1. Spin Wheel (วงล้อ)\n2. Stamp Card (สะสม)\n3. Lucky Draw (จับรางวัล)\n4. Daily Check-in\n5. Refer a Friend\n\n(กำลังพัฒนา)')}>
          <Ionicons name="add" size={14} color="#fff" />
          <Text style={st.createBtnText}>สร้างเกมใหม่</Text>
        </TouchableOpacity>
      </View>

      {/* KPI */}
      <View style={st.kpiRow}>
        <View style={st.kpi}><Text style={[st.kpiVal, { color: WebColors.purple }]}>{games.length}</Text><Text style={st.kpiLabel}>เกมทั้งหมด</Text></View>
        <View style={st.kpi}><Text style={[st.kpiVal, { color: WebColors.success }]}>{games.filter(g => g.enabled).length}</Text><Text style={st.kpiLabel}>เปิดอยู่</Text></View>
        <View style={st.kpi}><Text style={[st.kpiVal, { color: WebColors.info }]}>{games.reduce((s, g) => s + g.participants, 0).toLocaleString()}</Text><Text style={st.kpiLabel}>ผู้เข้าร่วมรวม</Text></View>
      </View>

      {/* Game list */}
      <View style={{ gap: 10 }}>
        {games.map(g => (
          <View key={g.id} style={st.gameCard}>
            <View style={[st.gameIcon, { backgroundColor: g.enabled ? WebColors.purpleLight : WebColors.gray100 }]}>
              <Ionicons name={g.icon as any} size={22} color={g.enabled ? WebColors.purple : WebColors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[st.gameName, !g.enabled && { color: WebColors.textSecondary }]}>{g.name}</Text>
              <Text style={st.gameDesc}>{g.desc}</Text>
              <Text style={st.gameStat}>{g.participants.toLocaleString()} ผู้เข้าร่วม · ประเภท: {g.type}</Text>
            </View>
            <Switch value={g.enabled} onValueChange={() => toggleGame(g.id)} trackColor={{ true: WebColors.purple, false: WebColors.border }} />
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
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: WebColors.purple, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  createBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  kpiRow: { flexDirection: 'row', gap: 12 },
  kpi: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  kpiVal: { fontSize: 18, fontWeight: '800' },
  kpiLabel: { fontSize: 10, color: '#64748B', marginTop: 4 },
  gameCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  gameIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  gameName: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  gameDesc: { fontSize: 11, color: '#64748B', marginTop: 2 },
  gameStat: { fontSize: 10, color: '#94A3B8', marginTop: 4 },
});
