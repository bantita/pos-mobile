/**
 * AppCard — Unified card container
 * Same radius, same shadow, same border everywhere.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Space, Font, Shadow } from '../tokens';

interface Props {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

export const AppCard: React.FC<Props> = ({ children, title, subtitle, headerRight, style, noPadding }) => (
  <View style={[s.card, noPadding && { padding: 0 }, style]}>
    {(title || headerRight) && (
      <View style={[s.header, noPadding && { paddingHorizontal: Space.xl, paddingTop: Space.xl }]}>
        <View style={{ flex: 1 }}>
          {title && <Text style={s.title}>{title}</Text>}
          {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
        </View>
        {headerRight}
      </View>
    )}
    {children}
  </View>
);

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    padding: Space.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Space.lg,
  },
  title: { ...Font.h4, color: Colors.text },
  subtitle: { ...Font.bodySm, color: Colors.textSecondary, marginTop: 2 },
});
