/**
 * GradientBox — Reusable wrapper for gradient backgrounds
 * Uses expo-linear-gradient with primary brand gradient by default.
 *
 * Usage:
 * - Wrap buttons, total bars, headers, badges with gradient
 * - Pass custom colors/start/end for different gradient directions
 */
import React from 'react';
import { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '../../constants/colors';
import { BorderRadius } from '../../constants/spacing';

interface GradientBoxProps {
  children: React.ReactNode;
  colors?: [string, string];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle;
  borderRadius?: number;
}

export const GradientBox: React.FC<GradientBoxProps> = ({
  children,
  colors = Gradients.primary,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  style,
  borderRadius = BorderRadius.md,
}) => (
  <LinearGradient
    colors={colors}
    start={start}
    end={end}
    style={[{ borderRadius }, style]}
  >
    {children}
  </LinearGradient>
);
