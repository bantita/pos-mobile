/**
 * RedeemScreen — ใช้คะแนนแลกส่วนลด
 * M06 CRM & Loyalty
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMemberStore } from '../../store/memberStore';
import { Member } from '../../types/member';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface Props {
  member: Member;
  onBack: () => void;
}

export const RedeemScreen: React.FC<Props> = ({ member, onBack }) => {
  const { redeemPoints, pointConfig } = useMemberStore();
  const [pointsInput, setPointsInput] = useState('');

  const points = parseInt(pointsInput, 10) || 0;
  const discount = points * pointConfig.redeemRate;

  const isValid = points >= pointConfig.minRedeemPoints && points <= member.pointBalance;
  const errorMsg = !pointsInput
    ? ''
    : points < pointConfig.minRedeemPoints
      ? `ขั้นต่ำ ${pointConfig.minRedeemPoints} คะแนน`
      : points > member.pointBalance
        ? 'คะแนนไม่เพียงพอ'
        : '';

  const handleRedeem = () => {
    if (!isValid) return;
    Alert.alert(
      'ยืนยันใช้คะแนน',
      `ใช้ ${points.toLocaleString()} คะแนน เป็นส่วนลด ${discount.toLocaleString()} บาท?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ยืนยัน',
          onPress: () => {
            try {
              redeemPoints(member.id, points, 'REDEEM-MANUAL', 'พนักงาน');
              Alert.alert('สำเร็จ', `ใช้คะแนนเรียบร้อย\nส่วนลด ${discount.toLocaleString()} บาท`, [
                { text: 'ตกลง', onPress: onBack },
              ]);
            } catch (e: any) {
              Alert.alert('ผิดพลาด', e.message || 'ไม่สามารถใช้คะแนนได้');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>ใช้คะแนน</Text>
          <Text style={styles.headerSub}>แลกคะแนนเป็นส่วนลด</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Member Info */}
          <View style={styles.memberCard}>
            <View style={styles.memberRow}>
              <Ionicons name="person-circle" size={40} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberSub}>{member.phone}</Text>
              </View>
              <View style={styles.balanceBox}>
                <Ionicons name="star" size={16} color={Colors.warning} />
                <Text style={styles.balanceValue}>{member.pointBalance.toLocaleString()}</Text>
                <Text style={styles.balanceLabel}>คะแนนคงเหลือ</Text>
              </View>
            </View>
          </View>

          {/* Point Input */}
          <View style={styles.inputSection}>
            <Text style={styles.fieldLabel}>จำนวนคะแนนที่ต้องการใช้</Text>
            <View style={[styles.inputRow, errorMsg ? styles.inputError : null]}>
              <Ionicons name="star-outline" size={18} color={Colors.gray400} />
              <TextInput
                style={styles.input}
                placeholder={`ขั้นต่ำ ${pointConfig.minRedeemPoints} คะแนน`}
                placeholderTextColor={Colors.gray400}
                value={pointsInput}
                onChangeText={setPointsInput}
                keyboardType="numeric"
              />
            </View>
            {errorMsg !== '' && <Text style={styles.errorText}>{errorMsg}</Text>}
          </View>

          {/* Discount Preview */}
          {points > 0 && (
            <View style={styles.previewCard}>
              <Ionicons name="pricetag" size={24} color={Colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.previewLabel}>ส่วนลดที่จะได้รับ</Text>
                <Text style={styles.previewValue}>฿{discount.toLocaleString()}</Text>
              </View>
              <Text style={styles.previewRate}>
                ({pointConfig.redeemRate} บาท/คะแนน)
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
            onPress={handleRedeem}
            activeOpacity={0.85}
            disabled={!isValid}
          >
            <Ionicons name="gift" size={20} color={Colors.white} />
            <Text style={styles.submitText}>ใช้คะแนน</Text>
          </TouchableOpacity>

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              อัตราแลกคะแนน: 1 คะแนน = {pointConfig.redeemRate} บาท{'\n'}
              ใช้ขั้นต่ำ: {pointConfig.minRedeemPoints} คะแนน
            </Text>
          </View>
        </View>
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
  content: { flex: 1, padding: Spacing.lg, gap: Spacing.lg },
  memberCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  memberName: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  memberSub: { ...Typography.caption, color: Colors.textSecondary },
  balanceBox: { alignItems: 'center', gap: 2 },
  balanceValue: { fontSize: 20, fontWeight: '800', color: Colors.text },
  balanceLabel: { ...Typography.caption, color: Colors.textSecondary, fontSize: 10 },
  inputSection: { gap: Spacing.xs },
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
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  previewLabel: { ...Typography.caption, color: Colors.textSecondary },
  previewValue: { fontSize: 24, fontWeight: '800', color: Colors.success },
  previewRate: { ...Typography.caption, color: Colors.textSecondary },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: { backgroundColor: Colors.gray300, shadowOpacity: 0 },
  submitText: { ...Typography.button, color: Colors.white },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.infoSurface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  infoText: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
});
