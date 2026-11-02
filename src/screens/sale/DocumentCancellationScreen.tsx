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
import { useT, DOC_TYPE_KEYS, type DocTypeId, type UiKey } from '../../i18n';

interface DocumentCancellationScreenProps {
  saleNo: string;
  documentType: string;
  onBack: () => void;
  onDone: () => void;
}

/** documentType ของหน้าจอนี้ → DocTypeId (คีย์ common.docType.*) */
const DOC_TYPE_IDS: Record<string, DocTypeId> = {
  tax_invoice: 'tax_full',
  receipt: 'receipt',
};

export const DocumentCancellationScreen: React.FC<DocumentCancellationScreenProps> = ({
  saleNo, documentType, onBack, onDone,
}) => {
  const t = useT();
  const [reason, setReason] = useState('');
  // เก็บเป็น key เพื่อให้สลับภาษาได้ทันที
  const [error, setError] = useState<UiKey | ''>('');
  const docId = DOC_TYPE_IDS[documentType];
  const docTypeLabel = docId ? t(DOC_TYPE_KEYS[docId]) : documentType;

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('receiptScreen.cancel.errReason');
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
          <Text style={styles.title}>{t('receiptScreen.cancel.title')}</Text>

          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('receiptScreen.cancel.billNo')}</Text>
              <Text style={styles.infoValue}>{saleNo}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('receiptScreen.cancel.docType')}</Text>
              <Text style={styles.infoValue}>{docTypeLabel}</Text>
            </View>
          </View>

          <Input
            label={t('receiptScreen.cancel.reasonLabel')}
            placeholder={t('receiptScreen.cancel.reasonPlaceholder')}
            value={reason}
            onChangeText={(v) => { setReason(v); setError(''); }}
            error={error ? t(error) : undefined}
            multiline
            numberOfLines={3}
            containerStyle={{ width: '100%' }}
          />

          <Button
            title={t('receiptScreen.cancel.confirm')}
            variant="danger"
            onPress={handleConfirm}
            fullWidth
            style={styles.confirmBtn}
          />
          <Button
            title={t('common.close')}
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
