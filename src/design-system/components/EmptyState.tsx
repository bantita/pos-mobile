/**
 * EmptyState — Placeholder for empty lists/pages
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Space, Font, Radius } from '../tokens';

interface Props {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<Props> = ({
  icon, title = 'ไม่มีข้อมูล', description, action,
}) => (
  <View style={s.container}>
    {icon && <View style={s.iconWrap}>{icon}</View>}
    <Text style={s.title}>{title}</Text>
    {description && <Text style={s.desc}>{description}</Text>}
    {action && <View style={s.action}>{action}</View>}
  </View>
);

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Space['5xl'],
    paddingHorizontal: Space['2xl'],
  },
  iconWrap: { marginBottom: Space.lg, opacity: 0.4 },
  title: { ...Font.h4, color: Colors.textSecondary, marginBottom: Space.xs },
  desc: { ...Font.body, color: Colors.textMuted, textAlign: 'center', maxWidth: 280 },
  action: { marginTop: Space.xl },
});
