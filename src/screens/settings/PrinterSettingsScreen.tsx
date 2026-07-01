/**
 * SCR-SET-007 PrinterSettingsScreen
 * ตั้งค่าเครื่องพิมพ์
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface Printer {
  id: string;
  name: string;
  type: 'bluetooth' | 'wifi' | 'usb' | 'airprint';
  model: string;
  connected: boolean;
}

const MOCK_PRINTERS: Printer[] = [
  { id: 'prt_001', name: 'Epson TM-T82X', type: 'bluetooth', model: 'TM-T82X', connected: true },
  { id: 'prt_002', name: 'Star TSP143IV', type: 'wifi', model: 'TSP143IVW', connected: false },
  { id: 'prt_003', name: 'Bixolon SRP-Q200', type: 'usb', model: 'SRP-Q200', connected: true },
];

const TYPE_ICONS: Record<string, string> = {
  bluetooth: 'bluetooth-outline',
  wifi: 'wifi-outline',
  usb: 'hardware-chip-outline',
  airprint: 'print-outline',
};

const TYPE_LABELS: Record<string, string> = {
  bluetooth: 'Bluetooth',
  wifi: 'WiFi',
  usb: 'USB',
  airprint: 'AirPrint',
};

type ReceiptTemplate = 'simple' | 'full' | 'tax_invoice';

interface TemplateOption {
  id: ReceiptTemplate;
  title: string;
  desc: string;
  lines: string[];
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'simple',
    title: 'Simple',
    desc: 'ใบเสร็จแบบเรียบง่าย',
    lines: ['ร้าน ABC', '─────────', 'น้ำดื่ม × 2   20.00', '─────────', 'รวม    20.00'],
  },
  {
    id: 'full',
    title: 'Full (พร้อม VAT)',
    desc: 'แสดงรายละเอียดครบถ้วน',
    lines: ['ร้าน ABC', 'เลขที่: INV-001', '─────────', 'น้ำดื่ม × 2   20.00', 'VAT 7%    1.30', '─────────', 'รวมสุทธิ  21.30'],
  },
  {
    id: 'tax_invoice',
    title: 'ใบกำกับภาษี',
    desc: 'ใบกำกับภาษีเต็มรูปแบบ',
    lines: ['ใบกำกับภาษี', 'ร้าน ABC TIN:01055...', '─────────', 'น้ำดื่ม × 2   20.00', 'ยอดก่อนVAT 18.70', 'VAT 7%    1.30', '─────────', 'รวมสุทธิ  20.00'],
  },
];

interface PrinterSettingsScreenProps {
  onBack: () => void;
}

export const PrinterSettingsScreen: React.FC<PrinterSettingsScreenProps> = ({ onBack }) => {
  const [printers, setPrinters] = useState<Printer[]>(MOCK_PRINTERS);
  const [selectedTemplate, setSelectedTemplate] = useState<ReceiptTemplate>('full');
  const [printLogo, setPrintLogo] = useState(true);
  const [printBarcode, setPrintBarcode] = useState(false);
  const [printQR, setPrintQR] = useState(true);

  const handleTestPrint = (printer: Printer) => {
    Alert.alert('Test Print', `ส่งงานพิมพ์ทดสอบไปที่ ${printer.name}`);
  };

  const handleDisconnect = (id: string) => {
    setPrinters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, connected: false } : p))
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>ตั้งค่าเครื่องพิมพ์</Text>
          <Text style={styles.headerSub}>Printer Settings</Text>
        </View>
        <Ionicons name="print-outline" size={24} color="rgba(255,255,255,0.7)" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Connected Printers */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>เครื่องพิมพ์ที่เชื่อมต่อ</Text>
            <TouchableOpacity style={styles.scanBtn}>
              <Ionicons name="search-outline" size={14} color={Colors.primary} />
              <Text style={styles.scanBtnText}>ค้นหา</Text>
            </TouchableOpacity>
          </View>
          {printers.map((p) => (
            <View key={p.id} style={styles.printerCard}>
              <View style={[styles.printerIcon, { backgroundColor: p.connected ? Colors.successLight : Colors.backgroundSecondary }]}>
                <Ionicons
                  name={TYPE_ICONS[p.type] as any}
                  size={20}
                  color={p.connected ? Colors.success : Colors.gray400}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.printerName}>{p.name}</Text>
                <View style={styles.printerMeta}>
                  <Text style={styles.printerType}>{TYPE_LABELS[p.type]}</Text>
                  <View style={[styles.connBadge, p.connected ? styles.connBadgeOn : styles.connBadgeOff]}>
                    <Text style={[styles.connBadgeText, { color: p.connected ? Colors.success : Colors.gray400 }]}>
                      {p.connected ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.printerActions}>
                {p.connected && (
                  <TouchableOpacity style={styles.printerActionBtn} onPress={() => handleTestPrint(p)}>
                    <Ionicons name="print-outline" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                )}
                {p.connected && (
                  <TouchableOpacity style={styles.printerActionBtn} onPress={() => handleDisconnect(p.id)}>
                    <Ionicons name="close-circle-outline" size={16} color={Colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Receipt Template */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Template ใบเสร็จ</Text>
          <View style={styles.templateGrid}>
            {TEMPLATES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.templateCard, selectedTemplate === t.id && styles.templateCardSelected]}
                onPress={() => setSelectedTemplate(t.id)}
                activeOpacity={0.8}
              >
                <View style={styles.templatePreview}>
                  {t.lines.map((line, i) => (
                    <Text key={i} style={styles.templateLine}>{line}</Text>
                  ))}
                </View>
                <Text style={[styles.templateTitle, selectedTemplate === t.id && styles.templateTitleSelected]}>
                  {t.title}
                </Text>
                <Text style={styles.templateDesc}>{t.desc}</Text>
                {selectedTemplate === t.id && (
                  <View style={styles.selectedMark}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Print Options */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ตัวเลือกการพิมพ์</Text>
          {[
            { label: 'พิมพ์โลโก้ร้าน', sub: 'แสดงโลโก้ที่ด้านบนใบเสร็จ', value: printLogo, setter: setPrintLogo },
            { label: 'พิมพ์บาร์โค้ด', sub: 'แสดงบาร์โค้ดสินค้าในใบเสร็จ', value: printBarcode, setter: setPrintBarcode },
            { label: 'พิมพ์ QR Code', sub: 'แสดง QR Code ท้ายใบเสร็จ', value: printQR, setter: setPrintQR },
          ].map((o, i) => (
            <View key={i} style={[styles.switchRow, i > 0 && styles.switchRowBorder]}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>{o.label}</Text>
                <Text style={styles.switchSub}>{o.sub}</Text>
              </View>
              <Switch
                value={o.value}
                onValueChange={o.setter}
                trackColor={{ false: Colors.gray200, true: Colors.primaryLight }}
                thumbColor={o.value ? Colors.primary : Colors.gray400}
              />
            </View>
          ))}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { ...Typography.h4, color: Colors.white },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...Typography.label, color: Colors.textSecondary },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  scanBtnText: { ...Typography.caption, color: Colors.primary },
  printerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  printerIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printerName: { ...Typography.label, color: Colors.text },
  printerMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  printerType: { ...Typography.caption, color: Colors.textSecondary },
  connBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  connBadgeOn: { backgroundColor: Colors.successLight },
  connBadgeOff: { backgroundColor: Colors.backgroundSecondary },
  connBadgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  printerActions: { flexDirection: 'row', gap: 4 },
  printerActionBtn: { padding: 6 },
  templateGrid: { flexDirection: 'row', gap: Spacing.sm },
  templateCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: 4,
    position: 'relative',
  },
  templateCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  templatePreview: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.sm,
    padding: 6,
    marginBottom: 4,
  },
  templateLine: { fontSize: FontSize.micro, color: Colors.textSecondary, lineHeight: 10 },
  templateTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  templateTitleSelected: { color: Colors.primary },
  templateDesc: { fontSize: FontSize.xs, color: Colors.textSecondary },
  selectedMark: { position: 'absolute', top: 6, right: 6 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchRowBorder: { borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: Spacing.sm },
  switchInfo: { flex: 1, gap: 2 },
  switchLabel: { ...Typography.label, color: Colors.text },
  switchSub: { ...Typography.caption, color: Colors.textSecondary },
});
