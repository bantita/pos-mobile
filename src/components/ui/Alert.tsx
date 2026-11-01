import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius, ComponentSize, Spacing } from '../../constants/spacing';

export type AlertType = 'error' | 'warning' | 'info' | 'success';

export interface AlertProps {
  type?: AlertType;
  title?: string;
  message: string;
  /** แสดงปุ่มปิด (44px) เมื่อส่งมา */
  onDismiss?: () => void;
  style?: ViewStyle;
}

const CONFIG: Record<AlertType, { bg: string; fg: string; icon: React.ComponentProps<typeof Ionicons>['name']; title: string }> = {
  error: { bg: Colors.dangerLight, fg: Colors.danger, icon: 'alert-circle', title: 'เกิดข้อผิดพลาด' },
  warning: { bg: Colors.warningLight, fg: Colors.warning, icon: 'warning', title: 'คำเตือน' },
  info: { bg: Colors.infoLight, fg: Colors.info, icon: 'information-circle', title: 'ข้อมูล' },
  success: { bg: Colors.successLight, fg: Colors.success, icon: 'checkmark-circle', title: 'สำเร็จ' },
};

/** กล่องข้อความแจ้งเตือน (error / warning / info / success) */
export const Alert = forwardRef<View, AlertProps>(({ type = 'info', title, message, onDismiss, style }, ref) => {
  const c = CONFIG[type];
  return (
    <View ref={ref} style={[styles.box, { backgroundColor: c.bg }, style]} accessibilityRole="alert">
      <Ionicons name={c.icon} size={ComponentSize.icon.md} color={c.fg} />
      <View style={styles.body}>
        <Text style={[styles.title, { color: c.fg }]}>{title ?? c.title}</Text>
        <Text style={[styles.message, { color: c.fg }]}>{message}</Text>
      </View>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.close} accessibilityRole="button" accessibilityLabel="ปิดข้อความ">
          <Ionicons name="close" size={ComponentSize.icon.md} color={c.fg} />
        </TouchableOpacity>
      )}
    </View>
  );
});
Alert.displayName = 'Alert';

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, borderRadius: BorderRadius.md, padding: Spacing.md },
  body: { flex: 1, gap: Spacing.xs / 2 },
  title: { ...Typography.label },
  message: { ...Typography.body2 },
  close: { minWidth: ComponentSize.button.md, minHeight: ComponentSize.button.md, alignItems: 'center', justifyContent: 'center', marginVertical: -Spacing.md, marginRight: -Spacing.sm },
});
