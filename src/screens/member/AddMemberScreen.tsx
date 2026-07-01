/**
 * AddMemberScreen — เพิ่มสมาชิกใหม่
 * M06 CRM & Loyalty
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMemberStore } from '../../store/memberStore';
import { MemberLevel } from '../../types/member';
import { Colors } from '../../constants/colors';
import { MemberLevelColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface Props {
  onBack: () => void;
}

const LEVEL_OPTIONS: { value: MemberLevel; label: string; color: string; bgColor: string }[] = [
  { value: 'member', label: 'Member', ...MemberLevelColors.member },
  { value: 'silver', label: 'Silver', ...MemberLevelColors.silver },
  { value: 'gold', label: 'Gold', ...MemberLevelColors.gold },
  { value: 'platinum', label: 'Platinum', ...MemberLevelColors.platinum },
  { value: 'vip', label: 'VIP', ...MemberLevelColors.vip },
];

export const AddMemberScreen: React.FC<Props> = ({ onBack }) => {
  const { addMember } = useMemberStore();

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [level, setLevel] = useState<MemberLevel>('member');
  const [errors, setErrors] = useState<{ phone?: string; name?: string }>({});

  const validate = (): boolean => {
    const newErrors: { phone?: string; name?: string } = {};
    if (!phone.trim()) {
      newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    }
    if (!name.trim()) {
      newErrors.name = 'กรุณากรอกชื่อสมาชิก';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    addMember({
      phone: phone.trim(),
      name: name.trim(),
      birthday: birthday.trim() || undefined,
      level,
      isActive: true,
      shopId: 'shop-01',
      branchId: 'b1',
    });

    Alert.alert('สำเร็จ', 'เพิ่มสมาชิกเรียบร้อยแล้ว', [
      { text: 'ตกลง', onPress: onBack },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>เพิ่มสมาชิก</Text>
          <Text style={styles.headerSub}>กรอกข้อมูลสมาชิกใหม่</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>เบอร์โทรศัพท์ *</Text>
            <View style={[styles.inputRow, errors.phone ? styles.inputError : null]}>
              <Ionicons name="call-outline" size={18} color={Colors.gray400} />
              <TextInput
                style={styles.input}
                placeholder="0xx-xxx-xxxx"
                placeholderTextColor={Colors.gray400}
                value={phone}
                onChangeText={(t) => { setPhone(t); setErrors(e => ({ ...e, phone: undefined })); }}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>ชื่อสมาชิก *</Text>
            <View style={[styles.inputRow, errors.name ? styles.inputError : null]}>
              <Ionicons name="person-outline" size={18} color={Colors.gray400} />
              <TextInput
                style={styles.input}
                placeholder="ชื่อ-นามสกุล"
                placeholderTextColor={Colors.gray400}
                value={name}
                onChangeText={(t) => { setName(t); setErrors(e => ({ ...e, name: undefined })); }}
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Birthday */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>วันเกิด</Text>
            <View style={styles.inputRow}>
              <Ionicons name="calendar-outline" size={18} color={Colors.gray400} />
              <TextInput
                style={styles.input}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={Colors.gray400}
                value={birthday}
                onChangeText={setBirthday}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>

          {/* Level Picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>ระดับสมาชิก</Text>
            <View style={styles.levelRow}>
              {LEVEL_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.levelOption,
                    { borderColor: opt.color },
                    level === opt.value && { backgroundColor: opt.bgColor, borderWidth: 2 },
                  ]}
                  onPress={() => setLevel(opt.value)}
                  activeOpacity={0.7}
                >
                  {level === opt.value && (
                    <Ionicons name="checkmark-circle" size={16} color={opt.color} />
                  )}
                  <Text style={[styles.levelOptionText, { color: opt.color }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
            <Text style={styles.submitText}>บันทึกสมาชิก</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.75)' },
  form: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  fieldGroup: { gap: Spacing.xs },
  fieldLabel: { ...Typography.label, color: Colors.text },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: { borderColor: Colors.danger },
  input: { flex: 1, ...Typography.body1, color: Colors.text },
  errorText: { ...Typography.caption, color: Colors.danger, marginLeft: Spacing.xs },
  levelRow: { flexDirection: 'row', gap: Spacing.sm },
  levelOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  levelOptionText: { ...Typography.label, fontWeight: '700' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: { ...Typography.button, color: Colors.white },
});
