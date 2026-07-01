/**
 * DatePicker — Cross-platform date input
 * Web: ใช้ native <input type="date">
 * Mobile: ใช้ TextInput + format hint (ยังไม่มี native picker — ต้อง add expo dependency)
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing, BorderRadius, ComponentSize } from '@/constants/spacing';
import { format, parse, isValid } from 'date-fns';

export interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  error?: string;
  style?: any;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value, onChange, label, placeholder = 'วว/ดด/ปปปป',
  minDate, maxDate, disabled, error, style,
}) => {
  const [textValue, setTextValue] = useState(value ? format(value, 'dd/MM/yyyy') : '');
  const [focused, setFocused] = useState(false);

  const handleTextChange = useCallback((text: string) => {
    // Auto-format: add / after dd and mm
    let cleaned = text.replace(/[^\d/]/g, '');
    if (cleaned.length === 2 && !cleaned.includes('/')) cleaned += '/';
    if (cleaned.length === 5 && cleaned.split('/').length === 2) cleaned += '/';
    if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);

    setTextValue(cleaned);

    // Parse when complete (dd/MM/yyyy)
    if (cleaned.length === 10) {
      const parsed = parse(cleaned, 'dd/MM/yyyy', new Date());
      if (isValid(parsed)) {
        if (minDate && parsed < minDate) return;
        if (maxDate && parsed > maxDate) return;
        onChange(parsed);
      }
    } else if (cleaned === '') {
      onChange(null);
    }
  }, [onChange, minDate, maxDate]);

  // Web: ใช้ native date input
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={[styles.inputWrap, focused && styles.inputFocused, error && styles.inputError, disabled && styles.inputDisabled]}>
          <Ionicons name="calendar-outline" size={18} color={Colors.gray400} style={{ marginRight: Spacing.xs }} />
          <input
            type="date"
            value={value ? format(value, 'yyyy-MM-dd') : ''}
            onChange={(e) => {
              const d = e.target.value ? new Date(e.target.value + 'T00:00:00') : null;
              onChange(d);
            }}
            min={minDate ? format(minDate, 'yyyy-MM-dd') : undefined}
            max={maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined}
            disabled={disabled}
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 15,
              fontFamily: 'inherit', color: Colors.text, backgroundColor: 'transparent',
            }}
          />
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  }

  // Mobile: TextInput with format mask
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, focused && styles.inputFocused, error && styles.inputError, disabled && styles.inputDisabled]}>
        <Ionicons name="calendar-outline" size={18} color={Colors.gray400} style={{ marginRight: Spacing.xs }} />
        <TextInput
          style={styles.input}
          value={textValue}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray400}
          keyboardType="numeric"
          maxLength={10}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: Spacing.xs },
  label: { ...Typography.labelSmall, color: Colors.gray600 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: ComponentSize.button.md,
    backgroundColor: Colors.surface,
  },
  inputFocused: { borderColor: Colors.primary },
  inputError: { borderColor: Colors.danger },
  inputDisabled: { backgroundColor: Colors.gray100, opacity: 0.7 },
  input: {
    flex: 1,
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  error: { ...Typography.caption, color: Colors.danger },
});
