/**
 * WebScannerScreen — ตั้งค่าและใช้งานสแกนเนอร์บาร์โค้ด (หน้าบ้าน)
 */
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { useProductStore } from '../../store/productStore';
import { findProductByBarcode, MOCK_PRODUCTS } from '../../data/mockProducts';

export const WebScannerScreen: React.FC = () => {
  const [mode, setMode] = useState<'settings' | 'test'>('settings');
  const [autoAdd, setAutoAdd] = useState(true);
  const [beepSound, setBeepSound] = useState(true);
  const [continuousScan, setContinuousScan] = useState(true);
  const [scanPrefix, setScanPrefix] = useState('');
  const [scanSuffix, setScanSuffix] = useState('\\n');

  // Test mode
  const [testBarcode, setTestBarcode] = useState('');
  const [scanHistory, setScanHistory] = useState<{ barcode: string; result: string; time: string; found: boolean }[]>([]);
  const inputRef = useRef<any>(null);

  const handleTestScan = () => {
    if (!testBarcode.trim()) return;
    const result = findProductByBarcode(testBarcode.trim(), MOCK_PRODUCTS);
    const entry = {
      barcode: testBarcode.trim(),
      result: result ? `${result.product.name} (${result.uom.unit}) — ฿${result.uom.salePrice}` : 'ไม่พบสินค้า',
      time: new Date().toLocaleTimeString('th-TH'),
      found: !!result,
    };
    setScanHistory(prev => [entry, ...prev].slice(0, 20));
    setTestBarcode('');
    inputRef.current?.focus();
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <Text style={s.title}>สแกนเนอร์บาร์โค้ด</Text>
      <Text style={s.subtitle}>ตั้งค่าและทดสอบเครื่องสแกนบาร์โค้ด</Text>

      {/* Tabs */}
      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tab, mode === 'settings' && s.tabActive]} onPress={() => setMode('settings')}>
          <Ionicons name="settings-outline" size={14} color={mode === 'settings' ? '#fff' : '#64748B'} />
          <Text style={[s.tabText, mode === 'settings' && { color: '#fff' }]}>ตั้งค่า</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, mode === 'test' && s.tabActive]} onPress={() => setMode('test')}>
          <Ionicons name="barcode-outline" size={14} color={mode === 'test' ? '#fff' : '#64748B'} />
          <Text style={[s.tabText, mode === 'test' && { color: '#fff' }]}>ทดสอบสแกน</Text>
        </TouchableOpacity>
      </View>

      {mode === 'settings' && (
        <>
          <View style={s.card}>
            <Text style={s.cardTitle}>ตั้งค่าสแกนเนอร์</Text>
            <View style={s.row}><Text style={s.rowLabel}>เพิ่มสินค้าอัตโนมัติหลังสแกน</Text><Switch value={autoAdd} onValueChange={setAutoAdd} trackColor={{ true: WebColors.primary, false: '#E2E8F0' }} /></View>
            <View style={s.row}><Text style={s.rowLabel}>เสียง Beep เมื่อสแกนสำเร็จ</Text><Switch value={beepSound} onValueChange={setBeepSound} trackColor={{ true: WebColors.primary, false: '#E2E8F0' }} /></View>
            <View style={s.row}><Text style={s.rowLabel}>สแกนต่อเนื่อง (ไม่ต้องกด Enter)</Text><Switch value={continuousScan} onValueChange={setContinuousScan} trackColor={{ true: WebColors.primary, false: '#E2E8F0' }} /></View>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Prefix / Suffix (สำหรับสแกนเนอร์ที่ส่ง prefix/suffix)</Text>
            <View style={s.fieldRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Prefix</Text>
                <TextInput style={s.input} value={scanPrefix} onChangeText={setScanPrefix} placeholder="ว่าง = ไม่มี" placeholderTextColor="#CBD5E1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Suffix</Text>
                <TextInput style={s.input} value={scanSuffix} onChangeText={setScanSuffix} placeholder="\\n = Enter" placeholderTextColor="#CBD5E1" />
              </View>
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>อุปกรณ์ที่รองรับ</Text>
            <View style={s.deviceList}>
              {[
                { name: 'USB Barcode Scanner', desc: 'เสียบ USB → ใช้งานได้เลย (Keyboard mode)', icon: 'hardware-chip-outline' },
                { name: 'Bluetooth Scanner', desc: 'จับคู่ Bluetooth → ตั้ง Keyboard/SPP mode', icon: 'bluetooth-outline' },
                { name: 'กล้องมือถือ', desc: 'ใช้กล้องหลังสแกน (Mobile app)', icon: 'camera-outline' },
                { name: 'USB HID Scanner', desc: 'ส่งข้อมูลแบบ keyboard emulation', icon: 'scan-outline' },
              ].map((d, i) => (
                <View key={i} style={s.deviceRow}>
                  <Ionicons name={d.icon as any} size={18} color={WebColors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.deviceName}>{d.name}</Text>
                    <Text style={s.deviceDesc}>{d.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      {mode === 'test' && (
        <>
          <View style={s.card}>
            <Text style={s.cardTitle}>ทดสอบสแกนบาร์โค้ด</Text>
            <Text style={{ fontSize: 15, color: '#64748B', marginBottom: 8 }}>สแกนจากเครื่อง หรือพิมพ์บาร์โค้ดแล้วกด Enter</Text>
            <View style={s.scanInputRow}>
              <Ionicons name="barcode" size={20} color={WebColors.primary} />
              <TextInput
                ref={inputRef}
                style={s.scanInput}
                value={testBarcode}
                onChangeText={setTestBarcode}
                placeholder="สแกนหรือพิมพ์บาร์โค้ดที่นี่..."
                placeholderTextColor="#94A3B8"
                onSubmitEditing={handleTestScan}
                autoFocus
              />
              <TouchableOpacity style={s.scanBtn} onPress={handleTestScan}>
                <Ionicons name="search" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {scanHistory.length > 0 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>ผลการสแกน ({scanHistory.length})</Text>
              {scanHistory.map((h, i) => (
                <View key={i} style={[s.histRow, !h.found && { backgroundColor: '#FEF2F2' }]}>
                  <Ionicons name={h.found ? 'checkmark-circle' : 'close-circle'} size={16} color={h.found ? '#16A34A' : '#EF4444'} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.histBarcode, !h.found && { color: '#EF4444' }]}>{h.barcode}</Text>
                    <Text style={s.histResult}>{h.result}</Text>
                  </View>
                  <Text style={s.histTime}>{h.time}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#64748B" />
            <Text style={s.infoText}>ทดสอบ: 8850999000001 (น้ำดื่มสิงห์), 8850999000002 (Pepsi), 8850999000201 (น้ำดื่ม ลัง 24)</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 13, color: '#64748B' },
  tabRow: { flexDirection: 'row', gap: 4 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F1F5F9' },
  tabActive: { backgroundColor: WebColors.primary },
  tabText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  rowLabel: { fontSize: 13, color: '#334155' },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldLabel: { fontSize: 15, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  input: { height: 36, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, fontSize: 13, color: '#1E293B' },
  deviceList: { gap: 8 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  deviceName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  deviceDesc: { fontSize: 15, color: '#64748B' },
  scanInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, height: 44, borderWidth: 1.5, borderColor: WebColors.primary },
  scanInput: { flex: 1, fontSize: 13, color: '#1E293B' },
  scanBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: WebColors.primary, alignItems: 'center', justifyContent: 'center' },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  histBarcode: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  histResult: { fontSize: 15, color: '#64748B' },
  histTime: { fontSize: 14, color: '#94A3B8' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#F1F5F9', borderRadius: 8, padding: 12 },
  infoText: { fontSize: 15, color: '#64748B', flex: 1 },
});
