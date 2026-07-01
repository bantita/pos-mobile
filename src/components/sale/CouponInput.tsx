/**
 * CouponInput — Scan/enter coupon code at POS checkout
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface Props {
  onSubmit: (code: string) => void;
  onScan?: () => void;
  disabled?: boolean;
  error?: string;
  success?: string;
}

export const CouponInput: React.FC<Props> = ({
  onSubmit,
  onScan,
  disabled,
  error,
  success,
}) => {
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed) {
      onSubmit(trimmed);
      setCode('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>คูปอง</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          value={code}
          onChangeText={setCode}
          placeholder="กรอกหรือสแกนรหัสคูปอง"
          placeholderTextColor={Colors.textDisabled}
          editable={!disabled}
          onSubmitEditing={handleSubmit}
          autoCapitalize="characters"
          returnKeyType="go"
        />
        {onScan && (
          <TouchableOpacity style={styles.scanBtn} onPress={onScan} disabled={disabled}>
            <Ionicons name="barcode-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.submitBtn, disabled && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={disabled || !code.trim()}
        >
          <Text style={styles.submitBtnText}>ใช้คูปอง</Text>
        </TouchableOpacity>
      </View>
      {error && (
        <View style={styles.messageRow}>
          <Ionicons name="alert-circle" size={14} color="#C62828" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {success && (
        <View style={styles.messageRow}>
          <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
          <Text style={styles.successText}>{success}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: Spacing.sm },
  label: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs },
  inputRow: { flexDirection: 'row', gap: Spacing.xs },
  input: {
    flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    ...Typography.body2, color: Colors.text, backgroundColor: Colors.white, minHeight: 44,
  },
  inputDisabled: { backgroundColor: '#F5F5F5' },
  scanBtn: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: '#455A64', alignItems: 'center', justifyContent: 'center',
  },
  submitBtn: {
    paddingHorizontal: Spacing.md, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  submitBtnDisabled: { backgroundColor: Colors.gray300 },
  submitBtnText: { ...Typography.button, color: Colors.white },
  messageRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
  errorText: { ...Typography.caption, color: '#C62828' },
  successText: { ...Typography.caption, color: '#2E7D32' },
});
