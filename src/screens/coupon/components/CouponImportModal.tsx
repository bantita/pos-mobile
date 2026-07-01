/**
 * CouponImportModal — Import coupons from CSV
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { parseCSV, validateImportRows } from '../../../services/coupon/CouponImporter';
import * as couponStore from '../../../store/couponStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  campaignId: string;
}

export const CouponImportModal: React.FC<Props> = ({ visible, onClose, campaignId }) => {
  const [csvData, setCsvData] = useState('');
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  const handleImport = () => {
    if (!csvData.trim()) { Alert.alert('ข้อผิดพลาด', 'กรุณาวาง CSV data'); return; }

    const rows = parseCSV(csvData);
    if (rows.length === 0) { Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลใน CSV'); return; }
    if (rows.length > 10000) { Alert.alert('ข้อผิดพลาด', 'ไฟล์ใหญ่เกินไป (สูงสุด 10,000 แถว)'); return; }

    const existingCodes = couponStore.getAllExistingCodeSet();
    const importResult = validateImportRows(rows, existingCodes, campaignId);

    couponStore.addCodes(importResult.imported);
    setResult({ imported: importResult.summary.imported, skipped: importResult.summary.skipped });
  };

  const handleClose = () => { setResult(null); setCsvData(''); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <View style={styles.modal}>
          <Text style={styles.title}>Import คูปอง (CSV)</Text>

          {!result ? (
            <>
              <Text style={styles.label}>วาง CSV Data (header: code,status,expiryDate)</Text>
              <TextInput
                style={styles.textArea}
                value={csvData}
                onChangeText={setCsvData}
                placeholder={"code,status,expiryDate\nNVSC001,ขาย/แจก,2025-12-31"}
                placeholderTextColor={Colors.textDisabled}
                multiline
                numberOfLines={6}
              />
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelText}>ยกเลิก</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleImport}>
                  <Ionicons name="cloud-upload-outline" size={16} color={Colors.white} />
                  <Text style={styles.confirmText}>Import</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>Import สำเร็จ {result.imported} รายการ</Text>
                {result.skipped > 0 && <Text style={styles.skipText}>ข้าม {result.skipped} รายการ</Text>}
              </View>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleClose}>
                <Text style={styles.confirmText}>ตกลง</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, width: '90%', maxWidth: 420 },
  title: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md },
  label: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs },
  textArea: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Typography.body2, minHeight: 120, textAlignVertical: 'top' },
  btnRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, alignItems: 'center' },
  cancelText: { ...Typography.button, color: Colors.textSecondary },
  confirmBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: Spacing.sm },
  confirmText: { ...Typography.button, color: Colors.white },
  resultBox: { backgroundColor: '#E8F5E9', padding: Spacing.md, borderRadius: BorderRadius.md, marginVertical: Spacing.md },
  resultText: { ...Typography.body2, color: '#2E7D32' },
  skipText: { ...Typography.caption, color: '#E65100', marginTop: Spacing.xs },
});
