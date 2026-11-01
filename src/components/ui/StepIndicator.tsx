import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius, ComponentSize, Spacing } from '../../constants/spacing';

export type StepIndicatorSize = 'sm' | 'md';

export interface StepIndicatorProps {
  steps: readonly string[];
  /** ขั้นปัจจุบัน (เริ่มที่ 1) */
  current: number;
  size?: StepIndicatorSize;
  style?: ViewStyle;
}

/** แถบขั้นตอน 1 → 2 → 3 … (ขั้นที่ผ่านแล้วแสดงเครื่องหมายถูก) */
export const StepIndicator = forwardRef<View, StepIndicatorProps>(({ steps, current, size = 'md', style }, ref) => (
  <View
    ref={ref}
    style={[styles.row, style]}
    accessibilityRole="progressbar"
    accessibilityLabel={`ขั้นตอนที่ ${current} จาก ${steps.length}: ${steps[current - 1] ?? ''}`}
    accessibilityValue={{ min: 1, max: steps.length, now: current }}
  >
    {steps.map((label, i) => {
      const n = i + 1;
      const done = n < current;
      const active = n === current;
      return (
        <View key={label} style={styles.item}>
          <View style={[styles.dot, size === 'sm' && styles.dotSm, done && styles.dotDone, active && styles.dotActive]}>
            {done
              ? <Ionicons name="checkmark" size={ComponentSize.icon.sm} color={Colors.white} />
              : <Text style={[styles.num, (active || done) && styles.numActive]}>{n}</Text>}
          </View>
          <Text style={[styles.label, active && styles.labelActive]} numberOfLines={2}>{label}</Text>
        </View>
      );
    })}
  </View>
));
StepIndicator.displayName = 'StepIndicator';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
  item: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  dot: {
    width: ComponentSize.avatar.sm, height: ComponentSize.avatar.sm, borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gray100, borderWidth: 1, borderColor: Colors.border,
  },
  dotSm: { width: ComponentSize.icon.xl - Spacing.sm, height: ComponentSize.icon.xl - Spacing.sm },
  dotDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  dotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  num: { ...Typography.label, color: Colors.textSecondary },
  numActive: { color: Colors.white },
  label: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  labelActive: { color: Colors.primary, fontWeight: '700' },
});
