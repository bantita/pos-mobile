/**
 * WebDocumentSettingsScreen — ตั้งค่าเอกสาร (web-only)
 * ผูกฟอร์มกับ useReceiptStore().config + setConfig
 * รวม toggle เปิด/ปิดใบกำกับภาษี (ReceiptConfig.taxInvoiceEnabled, ค่าเริ่มต้น true)
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { Space, Radius, Font } from '../../design-system/tokens';
import { useReceiptStore } from '../../store/receiptStore';

export const WebDocumentSettingsScreen: React.FC = () => {
  const config = useReceiptStore((s) => s.config);
  const setConfig = useReceiptStore((s) => s.setConfig);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // ─── form state ─────────────────────────────────────────────────────────────
  const [headerText, setHeaderText] = useState(config.headerText);
  const [posRegNo, setPosRegNo] = useState(config.posRegNo);
  const [shopAddr, setShopAddr] = useState(config.shopAddr);
  const [shopTaxId, setShopTaxId] = useState(config.shopTaxId);
  const [footerText, setFooterText] = useState(config.footerText);
  const [taxInvoiceEnabled, setTaxInvoiceEnabled] = useState(config.taxInvoiceEnabled ?? true);

  useEffect(() => {
    try {
      const t = setTimeout(() => setLoading(false), 200);
      return () => clearTimeout(t);
    } catch (e) {
      setError('ไม่สามารถโหลดข้อมูลตั้งค่าเอกสารได้');
      setLoading(false);
    }
  }, []);

  const handleSave = () => {
    try {
      setConfig({
        headerText: headerText.trim(),
        posRegNo: posRegNo.trim(),
        shopAddr: shopAddr.trim(),
        shopTaxId: shopTaxId.trim(),
        footerText: footerText.trim(),
        taxInvoiceEnabled,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  if (loading) {
    return (
      <View style={st.center}>
        <Ionicons name="hourglass-outline" size={40} color={WebColors.primary} />
        <Text style={st.centerText}>กำลังโหลดข้อมูลตั้งค่าเอกสาร...</Text>
      </View>
    );
  }

  const fields: { label: string; value: string; set: (v: string) => void; placeholder: string; multiline?: boolean }[] = [
    { label: 'หัวใบเสร็จ', value: headerText, set: setHeaderText, placeholder: 'ข้อความหัวใบเสร็จ เช่น สโลแกนร้าน' },
    { label: 'เลขที่เอกสาร', value: posRegNo, set: setPosRegNo, placeholder: 'เช่น POS-001' },
    { label: 'ที่อยู่ร้าน', value: shopAddr, set: setShopAddr, placeholder: 'ที่อยู่ร้านค้า', multiline: true },
    { label: 'เลขประจำตัวผู้เสียภาษี', value: shopTaxId, set: setShopTaxId, placeholder: 'เลข 13 หลัก' },
    { label: 'footer ใบเสร็จ', value: footerText, set: setFooterText, placeholder: 'ข้อความท้ายใบเสร็จ', multiline: true },
  ];

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>
      <Text style={st.title}>ตั้งค่าเอกสาร</Text>

      {error && (
        <View style={st.errorBanner}>
          <Ionicons name="alert-circle-outline" size={18} color={WebColors.danger} />
          <Text style={st.errorText}>{error}</Text>
        </View>
      )}

      {saved && (
        <View style={st.savedBanner}>
          <Ionicons name="checkmark-circle" size={18} color={WebColors.success} />
          <Text style={st.savedText}>บันทึกแล้ว</Text>
        </View>
      )}

      <View style={st.card}>
        {fields.map((f) => (
          <View key={f.label} style={st.field}>
            <Text style={st.label}>{f.label}</Text>
            <TextInput
              style={[st.input, f.multiline && st.inputMultiline]}
              value={f.value}
              onChangeText={f.set}
              placeholder={f.placeholder}
              placeholderTextColor={WebColors.textDisabled}
              multiline={f.multiline}
              numberOfLines={f.multiline ? 3 : 1}
            />
          </View>
        ))}

        {/* ── Toggle ใบกำกับภาษี ── */}
        <View style={st.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={st.label}>เปิด/ปิดใบกำกับภาษี</Text>
            <Text style={st.hint}>อนุญาตให้ออกใบกำกับภาษีเต็มรูปจากบิลขาย</Text>
          </View>
          <Switch
            value={taxInvoiceEnabled}
            onValueChange={setTaxInvoiceEnabled}
            trackColor={{ true: WebColors.primary, false: WebColors.gray300 }}
            thumbColor={WebColors.white}
          />
        </View>

        <TouchableOpacity style={st.saveBtn} onPress={handleSave}>
          <Ionicons name="save-outline" size={16} color={WebColors.white} />
          <Text style={st.saveText}>บันทึก</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: WebColors.contentBg },
  content: { padding: Space.xl, gap: Space.lg },
  title: { ...Font.h2, color: WebColors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.md, backgroundColor: WebColors.contentBg },
  centerText: { ...Font.body, color: WebColors.textSecondary },
  card: {
    backgroundColor: WebColors.cardBg,
    borderRadius: Radius.md,
    padding: Space.lg,
    gap: Space.md,
    borderWidth: 1,
    borderColor: WebColors.cardBorder,
    maxWidth: 560,
  },
  field: { gap: Space.xs },
  label: { ...Font.label, color: WebColors.text },
  hint: { ...Font.caption, color: WebColors.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: WebColors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    ...Font.td,
    color: WebColors.text,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingVertical: Space.xs },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    backgroundColor: WebColors.primary,
    paddingVertical: Space.md,
    borderRadius: Radius.sm,
    minHeight: 44,
  },
  saveText: { ...Font.button, color: WebColors.white },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Space.sm,
    backgroundColor: WebColors.dangerLight, padding: Space.md, borderRadius: Radius.sm, maxWidth: 560,
  },
  errorText: { ...Font.bodySm, color: WebColors.danger, flex: 1 },
  savedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Space.sm,
    backgroundColor: WebColors.successLight, padding: Space.md, borderRadius: Radius.sm, maxWidth: 560,
  },
  savedText: { ...Font.bodySm, color: WebColors.success, flex: 1 },
});
