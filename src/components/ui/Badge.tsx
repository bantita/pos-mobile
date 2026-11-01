import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius, Spacing } from '../../constants/spacing';

export type BadgeVariant = 'success' | 'info' | 'neutral' | 'danger' | 'warning' | 'purple';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

const PALETTE: Record<BadgeVariant, { bg: string; fg: string }> = {
  success: { bg: Colors.successLight, fg: Colors.success },
  info: { bg: Colors.infoLight, fg: Colors.info },
  neutral: { bg: Colors.gray100, fg: Colors.textSecondary },
  danger: { bg: Colors.dangerLight, fg: Colors.danger },
  warning: { bg: Colors.warningLight, fg: Colors.warning },
  purple: { bg: Colors.lavender, fg: Colors.lavenderDark },
};

/** ป้ายสถานะสั้น ๆ เช่น เพิ่มใหม่ / อัปเดต / ข้อผิดพลาด */
export const Badge = forwardRef<View, BadgeProps>(({ label, variant = 'neutral', size = 'sm', style }, ref) => {
  const c = PALETTE[variant];
  return (
    <View ref={ref} style={[styles.base, styles[`size_${size}`], { backgroundColor: c.bg }, style]} accessibilityLabel={label}>
      <Text style={[styles.text, size === 'md' && styles.textMd, { color: c.fg }]} numberOfLines={1}>{label}</Text>
    </View>
  );
});
Badge.displayName = 'Badge';

const styles = StyleSheet.create({
  base: { alignSelf: 'flex-start', borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
  size_sm: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs / 2 },
  size_md: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  text: { ...Typography.label },
  textMd: { ...Typography.body2, fontWeight: '600' },
});
