/**
 * DocumentCancellationScreen — ยกเลิกเอกสาร (ใบกำกับภาษี / ใบเสร็จ)
 * แสดงเป็น modal card ให้กรอกเหตุผล แล้วยืนยันการยกเลิก
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '../../components/ui';
import { useSaleHistoryStore } from '../../store/saleHistoryStore';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface DocumentCancellationScreenProps {
  saleNo: string;
  documentType: string;
  onBack: () => void;
  onDone: () => void;
}

const docTypeLabel = (documentType: string): string => {
  switch (documentType) {
    case 'tax_invoice': return 'ใบกำกับภาษี';
    case 'receipt': return 'ใบเสร็จ';
    default: return documentType;
  }
};

export const DocumentCancellationScreen: React.FC<DocumentCancellationScreenProps> = ({
  saleNo, documentType, onBack, onDone,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('กรุณากรอกเหตุผลการยกเลิก');
      return;
    }
    useSaleHistoryStore.getState().voidSale(saleNo, reason);
    onDone();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="close-circle-outline" size={40} color={Colors.danger} />
          </View>
          <Text style={styles.title}>ยกเลิกเอกสาร</Text>

          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>เลขที่บิล</Text>
              <Text style={styles.infoValue}>{saleNo}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ประเภทเอกสาร</Text>
              <Text style={styles.infoValue}>{docTypeLabel(documentType)}</Text>
            </View>
          </View>

          <Input
            label="เหตุผลการยกเลิก"
            placeholder="ระบุเหตุผลการยกเลิกเอกสาร"
            value={reason}
            onChangeText={(t) => { setReason(t); setError(''); }}
            error={error || undefined}
            multiline
            numberOfLines={3}
            containerStyle={{ width: '100%' }}
          />

          <Button
            title="ยืนยันการยกเลิก"
            variant="danger"
            onPress={handleConfirm}
            fullWidth
            style={styles.confirmBtn}
          />
          <Button
            title="ปิด"
            variant="ghost"
            onPress={onBack}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  card: {
    width: '100%', maxWidth: 440, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, padding: Spacing.xl,
    alignItems: 'center', gap: Spacing.sm,
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: BorderRadius.full,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs,
  },
  title: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.sm },
  infoBox: {
    width: '100%', backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { ...Typography.body2, color: Colors.textSecondary },
  infoValue: { ...Typography.body2, color: Colors.text, fontWeight: '600' },
  confirmBtn: { marginTop: Spacing.xs },
});
