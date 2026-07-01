/**
 * Loading — Unified loading indicator
 */
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Space, Font } from '../tokens';

interface Props {
  text?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export const Loading: React.FC<Props> = ({ text, size = 'large', fullScreen }) => (
  <View style={[s.container, fullScreen && s.fullScreen]}>
    <ActivityIndicator size={size} color={Colors.primary} />
    {text && <Text style={s.text}>{text}</Text>}
  </View>
);

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Space['3xl'],
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  text: {
    ...Font.bodySm,
    color: Colors.textSecondary,
    marginTop: Space.md,
  },
});
