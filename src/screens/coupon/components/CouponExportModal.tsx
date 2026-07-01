/**
 * CouponExportModal — Export coupons with filter
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { CouponStatus, ExportFilter } from '../../../types/coupon';
import { applyExportFilter, exportToCSV } from '../../../services/coupon/CouponExporter';
import * as couponStore from '../../../store/couponStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  campaignId: string;
}

export const CouponExportModal: React.FC<Props> = ({ visible, onClose, campaignId }) => {
  const [statusFilter, setStatusFilter] = useState<CouponStatus | ''>('');
  const [exported, setExported] = useState(false);
  const [csvOutput, setCsvOutput] = useState('');

  const handleExport = () => {
    const codes = couponStore.getAllCodes();
    const campaigns = new Map(couponStore.getCampaigns().map(c => [c.id, c]));

    const filter: ExportFilter = {
      campaignId,
      status: statusFilter ? [statusFilter as CouponStatus] : undefined,
    };

    const rows = applyExportFilter(codes, filter, campaigns);
    const csv = exportToCSV(rows);
    setCsvOutput(csv);
    setExported(true);
  };

  const handleClose = () => { setExported(false); setCsvOutput(''); onClose(); };

  const statuses = [
    { value: '', label: 'ทั้งหมด' },
    { value: CouponStatus.ACTIVE, label: 'ขาย/แจก' },
    { value: CouponStatus.USED, label: 'ใช้แล้ว' },
    { value: CouponStatus.EXPIRED, label: 'หมดอายุ' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <View style={styles.modal}>
          <Text style={styles.title}>Export คูปอง</Text>

          {!exported ? (
            <>
              <Text style={styles.label}>สถานะที่ต้องการ Export</Text>
              <View style={styles.chipRow}>
                {statuses.map(s => (
                  <TouchableOpacity
                    key={s.value}
                    style={[styles.chip, statusFilter === s.value && styles.chipActive]}
                    onPress={() => setStatusFilter(s.value as any)}
                  >
                    <Text style={[styles.chipText, statusFilter === s.value && styles.chipTextActive]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelText}>ยกเลิก</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleExport}>
                  <Ionicons name="download-outline" size={16} color={Colors.white} />
                  <Text style={styles.confirmText}>Export CSV</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.label}>CSV Output (คัดลอกได้)</Text>
              <TextInput style={styles.textArea} value={csvOutput} multiline editable={false} selectTextOnFocus />
              <TouchableOpacity style={styles.confirmBtn} onPress={handleClose}>
                <Text style={styles.confirmText}>ปิด</Text>
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { ...Typography.body2, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  textArea: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Typography.caption, minHeight: 140, textAlignVertical: 'top', marginTop: Spacing.sm },
  btnRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, alignItems: 'center' },
  cancelText: { ...Typography.button, color: Colors.textSecondary },
  confirmBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: Spacing.sm },
  confirmText: { ...Typography.button, color: Colors.white },
});
