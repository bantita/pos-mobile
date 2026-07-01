/**
 * WebDisplayScreen — ตั้งค่าจอที่ 2 Customer Display (หน้าบ้าน)
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';

export const WebDisplayScreen: React.FC = () => {
  const [enabled, setEnabled] = useState(true);
  const [showAds, setShowAds] = useState(true);
  const [showTotal, setShowTotal] = useState(true);
  const [showLogo, setShowLogo] = useState(true);

  const openDisplay = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.origin + '?display=1', '_blank', 'width=1024,height=768');
    }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <Text style={s.title}>จอที่ 2 (Customer Display)</Text>
      <Text style={s.subtitle}>จอแสดงผลลูกค้า — แสดงรายการสินค้า ยอดรวม โฆษณา</Text>

      {/* เปิดจอ */}
      <View style={s.card}>
        <Text style={s.cardTitle}>เปิดจอลูกค้า</Text>
        <Text style={{ fontSize: 15, color: WebColors.textSecondary, marginBottom: 8 }}>เปิดหน้าต่างใหม่เพื่อแสดงจอลูกค้า (ลากไปจอที่ 2 หรือจอ HDMI)</Text>
        <TouchableOpacity style={s.openBtn} onPress={openDisplay}>
          <Ionicons name="open-outline" size={16} color="#fff" />
          <Text style={s.openBtnText}>เปิด Customer Display</Text>
        </TouchableOpacity>
      </View>

      {/* ตั้งค่า */}
      <View style={s.card}>
        <Text style={s.cardTitle}>ตั้งค่าการแสดงผล</Text>
        <View style={s.row}><Text style={s.rowLabel}>เปิดใช้งานจอลูกค้า</Text><Switch value={enabled} onValueChange={setEnabled} trackColor={{ true: WebColors.primary, false: WebColors.border }} /></View>
        <View style={s.row}><Text style={s.rowLabel}>แสดงยอดรวมแบบ Real-time</Text><Switch value={showTotal} onValueChange={setShowTotal} trackColor={{ true: WebColors.primary, false: WebColors.border }} /></View>
        <View style={s.row}><Text style={s.rowLabel}>แสดงโลโก้ร้านค้า</Text><Switch value={showLogo} onValueChange={setShowLogo} trackColor={{ true: WebColors.primary, false: WebColors.border }} /></View>
        <View style={s.row}><Text style={s.rowLabel}>แสดงโฆษณา (Slideshow)</Text><Switch value={showAds} onValueChange={setShowAds} trackColor={{ true: WebColors.primary, false: WebColors.border }} /></View>
      </View>

      {/* โฆษณา */}
      {showAds && (
        <View style={s.card}>
          <Text style={s.cardTitle}>จัดการโฆษณา / Slideshow</Text>
          <Text style={{ fontSize: 15, color: WebColors.textSecondary, marginBottom: 8 }}>รูปภาพจะสลับแสดงเมื่อไม่มีการขาย</Text>
          <View style={s.adGrid}>
            {['โปรโมชั่นประจำเดือน', 'สินค้าใหม่', 'สมาชิกรับส่วนลด'].map((ad, i) => (
              <View key={i} style={s.adCard}>
                <Ionicons name="image-outline" size={24} color="#94A3B8" />
                <Text style={s.adText}>{ad}</Text>
              </View>
            ))}
            <TouchableOpacity style={s.adAddCard} onPress={() => alert('เพิ่มรูปโฆษณา')}>
              <Ionicons name="add-circle-outline" size={24} color={WebColors.primary} />
              <Text style={[s.adText, { color: WebColors.primary }]}>เพิ่มรูป</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={s.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color="#64748B" />
        <Text style={s.infoText}>วิธีใช้: กด "เปิด Customer Display" → ลากหน้าต่างไปจอที่ 2 → จอจะแสดงรายการขาย + โฆษณาอัตโนมัติ</Text>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: WebColors.gray50 },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 17, fontWeight: '800', color: WebColors.text },
  subtitle: { fontSize: 13, color: WebColors.textSecondary },
  card: { backgroundColor: WebColors.white, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: WebColors.border, gap: 8 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: WebColors.text },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: WebColors.gray50 },
  rowLabel: { fontSize: 13, color: WebColors.grayDark },
  openBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: '#7C3AED', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  openBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  adGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  adCard: { width: 140, height: 90, borderRadius: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', gap: 4 },
  adAddCard: { width: 140, height: 90, borderRadius: 8, borderWidth: 1.5, borderColor: WebColors.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  adText: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#F1F5F9', borderRadius: 8, padding: 12 },
  infoText: { fontSize: 15, color: '#64748B', flex: 1 },
});
