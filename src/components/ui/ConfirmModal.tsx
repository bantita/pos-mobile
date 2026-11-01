import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius, Shadow, Spacing } from '../../constants/spacing';
import { Button } from './Button';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  /** ปุ่มยืนยันเป็นสีแดง (การกระทำที่เขียนทับข้อมูล) */
  destructive?: boolean;
  confirmDisabled?: boolean;
}

/** กล่องยืนยันอีกครั้งก่อนทำรายการ (ปุ่มสูง ≥ 44px) */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible, title, message, children,
  confirmLabel = 'ยืนยัน', cancelLabel = 'ยกเลิก',
  onConfirm, onCancel, loading = false, destructive = false, confirmDisabled = false,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.overlay}>
      <View style={styles.box} accessibilityViewIsModal accessibilityLabel={title}>
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {children}
        </ScrollView>
        <View style={styles.footer}>
          <Button title={cancelLabel} variant="secondary" onPress={onCancel} disabled={loading} style={styles.btn} />
          <Button
            title={confirmLabel}
            variant={destructive ? 'danger' : 'primary'}
            onPress={onConfirm}
            loading={loading}
            disabled={confirmDisabled}
            style={styles.btn}
          />
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  box: {
    width: '100%', maxWidth: 520, maxHeight: '90%', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.md, ...Shadow.lg,
  },
  title: { ...Typography.h4, color: Colors.text },
  body: { flexGrow: 0 },
  bodyContent: { gap: Spacing.md },
  message: { ...Typography.body2, color: Colors.textSecondary },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  btn: { flex: 1 },
});
