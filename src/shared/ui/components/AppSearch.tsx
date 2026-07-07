/**
 * AppSearch — Unified search bar
 * Rounded, icon, consistent height.
 */
import React from 'react';
import { ViewStyle } from 'react-native';
import { Search } from 'lucide-react-native';
import { TextInput, View } from '@/shared/tw/index';
import { Colors } from '@/shared/ui/tokens';

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
  <View
    className="h-12 flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-4"
    style={[{ boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)', borderCurve: 'continuous' }, style]}
  >
    {icon || <Search size={18} color={Colors.textMuted} />}
    <TextInput
      className="flex-1 text-[15px] leading-[22px] text-slate-950"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
    />
  </View>
);
