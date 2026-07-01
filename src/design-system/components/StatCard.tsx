/**
 * StatCard — Dashboard KPI card
 * Same style, same radius, same shadow everywhere.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Space, Font, Shadow } from '../tokens';

interface Props {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  color?: string;
  style?: ViewStyle;
}

export const StatCard: React.FC<Props> = ({ label, value, icon, trend, color, style }) => (
  <View style={[s.card, style]}>
    <View style={s.header}>
      {icon && <View style={[s.iconWrap, color ? { backgroundColor: color + '14' } : undefined]}>{icon}</View>}
      {trend && (
        <View style={[s.trend, { backgroundColor: trend.positive ? Colors.successLight : Colors.dangerLight }]}>
          <Text style={[s.trendText, { color: trend.positive ? Colors.success : Colors.danger }]}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </Text>
        </View>
      )}
    </View>
    <Text style={[s.value, color ? { color } : undefined]}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </Text>
    <Text style={s.label}>{label}</Text>
  </View>
);

const s = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    padding: Space.xl,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Space.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  trend: {
    paddingHorizontal: Space.sm,
    paddingVertical: Space.xs,
    borderRadius: Radius.full,
  },
  trendText: { ...Font.badge },
  value: {
    ...Font.stat,
    color: Colors.text,
    marginBottom: Space.xs,
  },
  label: {
    ...Font.bodySm,
    color: Colors.textSecondary,
  },
});
