import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing, Shadow } from '../../constants/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Use light surface (white) instead of dark surface */
  light?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, padding = 'md', light = false }) => (
  <View
    style={[
      styles.card,
      light ? styles.cardLight : styles.cardDark,
      styles[`padding_${padding}`],
      style,
    ]}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
  },
  cardDark: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardLight: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  padding_none: { padding: 0 },
  padding_sm: { padding: Spacing.sm },
  padding_md: { padding: Spacing.lg },
  padding_lg: { padding: Spacing.xl },
});
