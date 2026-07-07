/**
 * DateInput — ใช้ native <input type="date"> บน Web
 * แสดงปฏิทินให้เลือกวันที่ทุกจุดในระบบ
 */
import React from 'react';
import { View, Platform } from 'react-native';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';

interface Props {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  style?: any;
  fullWidth?: boolean;
}

export const DateInput: React.FC<Props> = ({ value, onChange, placeholder, label, style, fullWidth = false }) => {
  if (Platform.OS !== 'web') {
    const { TextInput } = require('react-native');
    return (
      <View style={style}>
        {label && <Text className="text-[11px] font-semibold text-gray-500 mb-1">{label}</Text>}
        <TextInput
          className="border border-gray-200 rounded-lg px-3 py-[9px] text-[13px] text-gray-800"
          value={value}
          onChangeText={onChange}
          placeholder={placeholder || 'YYYY-MM-DD'}
          placeholderTextColor="#9ca3af"
        />
      </View>
    );
  }

  // Web: ใช้ native input type="date" (มีปฏิทิน)
  return (
    <View style={style}>
      {label && <Text className="text-[11px] font-semibold text-gray-500 mb-1">{label}</Text>}
      <input
        type="date"
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          maxWidth: fullWidth ? 'none' : 220,
          height: 36,
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          paddingLeft: 12,
          paddingRight: 12,
          fontSize: 12,
          color: '#1f2937',
          backgroundColor: '#fafafa',
          outline: 'none',
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      />
    </View>
  );
};
