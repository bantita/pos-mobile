import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DocStatus } from '../../types/stockDocument';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius, Spacing } from '../../constants/spacing';

const CONFIG: Record<DocStatus, { label: string; color: string; bg: string; icon: string }> = {
  draft:     { label: 'แบบร่าง',    color: Colors.gray500,  bg: Colors.gray100,      icon: 'document-outline' },
  confirmed: { label: 'ยืนยันแล้ว',  color: Colors.success,  bg: Colors.successLight, icon: 'checkmark-circle-outline' },
  cancelled: { label: 'ยกเลิก',     color: Colors.danger,   bg: Colors.dangerLight,  icon: 'close-circle-outline' },
  revised:   { label: 'Revised',    color: Colors.primary,  bg: Colors.primaryLight, icon: 'refresh-circle-outline' },
};

export const DocStatusBadge: React.FC<{ status: DocStatus; size?: 'sm' | 'md' }> = ({
  status, size = 'md',
}) => {
  const c = CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, size === 'sm' && styles.sm]}>
      <Ionicons name={c.icon as any} size={size === 'sm' ? 11 : 13} color={c.color} />
      <Text style={[styles.text, { color: c.color }, size === 'sm' && styles.textSm]}>{c.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  sm: { paddingHorizontal: 5, paddingVertical: 2 },
  text: { ...Typography.caption, fontWeight: '700' },
  textSm: { fontSize: 10 },
});
