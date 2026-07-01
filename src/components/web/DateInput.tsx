/**
 * DateInput — ใช้ native <input type="date"> บน Web
 * แสดงปฏิทินให้เลือกวันที่ทุกจุดในระบบ
 */
import React from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';

interface Props {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  style?: any;
}

export const DateInput: React.FC<Props> = ({ value, onChange, placeholder, label, style }) => {
  if (Platform.OS !== 'web') {
    const { TextInput } = require('react-native');
    return (
      <View style={style}>
        {label && <Text style={s.label}>{label}</Text>}
        <TextInput
          style={s.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder || 'YYYY-MM-DD'}
          placeholderTextColor="#9CA3AF"
        />
      </View>
    );
  }

  // Web: ใช้ native input type="date" (มีปฏิทิน)
  return (
    <View style={style}>
      {label && <Text style={s.label}>{label}</Text>}
      <input
        type="date"
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          maxWidth: 220,
          height: 36,
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          paddingLeft: 12,
          paddingRight: 12,
          fontSize: 12,
          color: '#1F2937',
          backgroundColor: '#fff',
          outline: 'none',
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      />
    </View>
  );
};

const s = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: '#1F2937' },
});
