/**
 * AppSearch — Unified search bar
 * Rounded, icon, consistent height.
 */
import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Space, Font, Shadow } from '../tokens';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export const AppSearch: React.FC<Props> = ({
  value, onChangeText, placeholder = 'ค้นหา...', style, icon,
}) => (
  <View style={[s.container, style]}>
    {icon || <SearchIcon />}
    <TextInput
      style={s.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
    />
  </View>
);

const SearchIcon = () => (
  <View style={{ width: 18, height: 18, opacity: 0.5 }}>
    {/* Simple circle + line for search icon */}
    <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: Colors.textMuted }} />
  </View>
);

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Space.lg,
    height: 44,
    ...Shadow.sm,
  },
  input: {
    flex: 1,
    ...Font.body,
    color: Colors.text,
  },
});
