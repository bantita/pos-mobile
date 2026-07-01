/**
 * WebPrinterScreen — ตั้งค่าเครื่องพิมพ์ (หน้าบ้าน)
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';

const MOCK_PRINTERS = [
  { id: 'p1', name: 'เครื่องพิมพ์ใบเสร็จ (USB)', type: 'USB', status: 'connected', model: 'Epson TM-T82III' },
  { id: 'p2', name: 'เครื่องพิมพ์ครัว (WiFi)', type: 'WiFi', status: 'connected', model: 'Xprinter XP-N160II' },
  { id: 'p3', name: 'เครื่องพิมพ์สำรอง (Bluetooth)', type: 'Bluetooth', status: 'disconnected', model: 'SUNMI T2 mini' },
];

export const WebPrinterScreen: React.FC = () => {
  const [autoPrint, setAutoPrint] = useState(true);
  const [copies, setCopies] = useState(1);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <Text style={s.title}>เครื่องพิมพ์</Text>
      <Text style={s.subtitle}>จัดการเครื่องพิมพ์ที่เชื่อมต่อกับจุดขาย</Text>

      {/* Settings */}
      <View style={s.card}>
        <Text style={s.cardTitle}>ตั้งค่าการพิมพ์</Text>
        <View style={s.row}><Text style={s.rowLabel}>พิมพ์ใบเสร็จอัตโนมัติหลังชำระ</Text><Switch value={autoPrint} onValueChange={setAutoPrint} trackColor={{ true: WebColors.primary, false: WebColors.border }} /></View>
        <View style={s.row}><Text style={s.rowLabel}>จำนวนสำเนา</Text><View style={s.counterRow}><TouchableOpacity style={s.counterBtn} onPress={() => setCopies(Math.max(1, copies - 1))}><Text style={s.counterBtnText}>-</Text></TouchableOpacity><Text style={s.counterVal}>{copies}</Text><TouchableOpacity style={s.counterBtn} onPress={() => setCopies(copies + 1)}><Text style={s.counterBtnText}>+</Text></TouchableOpacity></View></View>
      </View>

      {/* Printers list */}
      <View style={s.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={s.cardTitle}>เครื่องพิมพ์ที่เชื่อมต่อ</Text>
          <TouchableOpacity style={s.addBtn} onPress={() => alert('ค้นหาเครื่องพิมพ์...')}><Ionicons name="add-circle" size={16} color={WebColors.white} /><Text style={s.addBtnText}>เพิ่ม</Text></TouchableOpacity>
        </View>
        {MOCK_PRINTERS.map(p => (
          <View key={p.id} style={s.printerRow}>
            <View style={[s.printerIcon, { backgroundColor: p.status === 'connected' ? WebColors.successLight : WebColors.gray100 }]}>
              <Ionicons name="print" size={20} color={p.status === 'connected' ? WebColors.success : WebColors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.printerName}>{p.name}</Text>
              <Text style={s.printerModel}>{p.model} · {p.type}</Text>
            </View>
            <View style={[s.statusBadge, { backgroundColor: p.status === 'connected' ? WebColors.successLight : WebColors.dangerLight }]}>
              <View style={[s.statusDot, { backgroundColor: p.status === 'connected' ? WebColors.success : WebColors.danger }]} />
              <Text style={{ fontSize: 14, color: p.status === 'connected' ? WebColors.success : WebColors.danger, fontWeight: '600' }}>{p.status === 'connected' ? 'เชื่อมต่อ' : 'ไม่ได้เชื่อม'}</Text>
            </View>
            <TouchableOpacity style={s.testBtn} onPress={() => alert('ทดสอบพิมพ์: ' + p.name)}><Text style={s.testBtnText}>ทดสอบ</Text></TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: WebColors.gray50 },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 17, fontWeight: '800', color: WebColors.text },
  subtitle: { fontSize: 13, color: WebColors.textSecondary },
  card: { backgroundColor: WebColors.white, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: WebColors.border, gap: 12 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: WebColors.text },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { fontSize: 13, color: '#334155' },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: WebColors.gray100, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: WebColors.border },
  counterBtnText: { fontSize: 15, fontWeight: '700', color: '#334155' },
  counterVal: { fontSize: 15, fontWeight: '700', color: WebColors.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: WebColors.primary, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  addBtnText: { fontSize: 15, color: WebColors.white, fontWeight: '700' },
  printerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: WebColors.gray100 },
  printerIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  printerName: { fontSize: 13, fontWeight: '600', color: WebColors.text },
  printerModel: { fontSize: 15, color: WebColors.textSecondary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  testBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: WebColors.border },
  testBtnText: { fontSize: 15, color: WebColors.textSecondary, fontWeight: '600' },
});
