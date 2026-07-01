/**
 * StatusBadge — Unified status indicator
 * Variants: success, warning, danger, info, neutral, primary
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Space, Font } from '../tokens';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface Props {
  label: string;
  variant?: Variant;
  dot?: boolean;
}

const variantStyles: Record<Variant, { bg: string; color: string }> = {
  success: { bg: Colors.successLight, color: Colors.success },
  warning: { bg: Colors.warningLight, color: Colors.warning },
  danger:  { bg: Colors.dangerLight,  color: Colors.danger },
  info:    { bg: Colors.infoLight,    color: Colors.info },
  neutral: { bg: '#F1F5F9',           color: '#64748B' },
  primary: { bg: Colors.primaryLight, color: Colors.primary },
};

export const StatusBadge: React.FC<Props> = ({ label, variant = 'neutral', dot }) => {
  const v = variantStyles[variant];
  return (
    <View style={[s.badge, { backgroundColor: v.bg }]}>
      {dot && <View style={[s.dot, { backgroundColor: v.color }]} />}
      <Text style={[s.text, { color: v.color }]}>{label}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    paddingHorizontal: Space.sm + 2,
    paddingVertical: Space.xs,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { ...Font.badge },
});
