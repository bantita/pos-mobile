/**
 * ShiftGateScreen — ด่านเปิดกะก่อนเริ่มขาย
 * ถ้ากะยังไม่เปิด → บังคับให้เปิดกะก่อน พร้อมกรอกเงินทอนเริ่มกะ
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useShiftStore } from '../../store/shiftStore';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, ComponentSize } from '../../constants/spacing';
import { formatCurrency } from '../../utils/format';

export const ShiftGateScreen: React.FC = () => {
  const { currentShift, openShift, isShiftOpen } = useShiftStore();
  const cashierName = useAuthStore((s) => s.user?.name) ?? 'พนักงาน';

  const [openingAmount, setOpeningAmount] = useState('');
  const [error, setError] = useState('');

  const shiftOpen = isShiftOpen();

  const handleOpenShift = () => {
    if (!openingAmount.trim()) {
      setError('กรุณากรอกเงินทอนเริ่มกะ');
      return;
    }
    setError('');
    openShift({
      posId: 'pos1',
      posName: 'POS 1',
      cashierName,
      openingAmount: parseFloat(openingAmount) || 0,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>เปิดกะการขาย</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {shiftOpen && currentShift ? (
          // ─── กะเปิดอยู่ ──────────────────────────────────────────────────
          <View style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: Colors.successLight }]}>
              <Ionicons name="checkmark-circle-outline" size={48} color={Colors.success} />
            </View>
            <Text style={styles.title}>กะเปิดอยู่</Text>
            <Text style={styles.subtitle}>พร้อมเริ่มการขายได้ทันที</Text>
            <View style={styles.statusBox}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>เงินทอนเริ่มกะ</Text>
                <Text style={styles.statusValue}>฿{formatCurrency(currentShift.openingAmount)}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>แคชเชียร์</Text>
                <Text style={styles.statusValue}>{currentShift.cashierName}</Text>
              </View>
            </View>
          </View>
        ) : (
          // ─── ยังไม่เปิดกะ ────────────────────────────────────────────────
          <View style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="time-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.title}>ยังไม่ได้เปิดกะการขาย</Text>
            <Text style={styles.subtitle}>กรุณาเปิดกะและกรอกเงินทอนเริ่มกะก่อนเริ่มการขาย</Text>

            <Text style={styles.inputLabel}>เงินทอนเริ่มกะ</Text>
            <TextInput
              style={styles.input}
              value={openingAmount}
              onChangeText={(t) => { setOpeningAmount(t); setError(''); }}
              placeholder="0.00"
              placeholderTextColor={Colors.gray400}
              keyboardType="decimal-pad"
            />
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.openBtn} onPress={handleOpenShift} activeOpacity={0.85}>
              <Ionicons name="play-circle" size={20} color={Colors.white} />
              <Text style={styles.openBtnText}>เปิดกะการขาย</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  headerTitle: { ...Typography.h4, color: Colors.white },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', gap: Spacing.sm,
  },
  iconWrap: {
    width: 88, height: 88, borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  title: { ...Typography.h3, color: Colors.text, textAlign: 'center' },
  subtitle: {
    ...Typography.body2, color: Colors.textSecondary,
    textAlign: 'center', marginBottom: Spacing.md,
  },
  statusBox: {
    width: '100%', backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.xs,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusLabel: { ...Typography.body2, color: Colors.textSecondary },
  statusValue: { ...Typography.body2, color: Colors.text, fontWeight: '600' },
  inputLabel: { ...Typography.label, color: Colors.textSecondary, alignSelf: 'flex-start', marginBottom: Spacing.xs },
  input: {
    width: '100%', backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    ...Typography.body1, color: Colors.text, minHeight: ComponentSize.input.md,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    width: '100%', marginTop: Spacing.sm,
  },
  errorText: { ...Typography.body2, color: Colors.danger, flex: 1 },
  openBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md,
    width: '100%', minHeight: ComponentSize.button.md, marginTop: Spacing.md,
  },
  openBtnText: { ...Typography.button, color: Colors.white },
});
