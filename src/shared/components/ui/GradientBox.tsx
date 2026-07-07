import React from 'react';
import { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
  colors = ['#f87171', '#fca5a5'],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  style,
  borderRadius = 12,
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
