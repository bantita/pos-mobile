/**
 * KioskSetupScreen — ตั้งค่า Kiosk Mode ก่อนเข้า
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useKioskStore, KioskLayout } from '../../store/kioskStore';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { IS_WEB, getPlatformLabel, isTablet, isWideScreen } from '../../utils/platform';

interface KioskSetupScreenProps {
  onStart: () => void;
  onCancel: () => void;
}

const LAYOUT_OPTIONS: { key: KioskLayout; label: string; sub: string; icon: string; suitable: string }[] = [
  {
    key: 'compact',
    label: 'Compact',
    sub: 'สลับระหว่าง Grid และ Scanner',
    icon: 'phone-portrait-outline',
    suitable: 'มือถือ / หน้าจอเล็ก',
  },
  {
    key: 'split',
    label: 'Split View',
    sub: 'Grid ซ้าย + Scanner ขวา',
    icon: 'tablet-landscape-outline',
    suitable: 'Tablet / iPad',
  },
  {
    key: 'fullgrid',
    label: 'Full Grid',
    sub: 'Product Grid เต็มจอพร้อม Search',
    icon: 'desktop-outline',
    suitable: 'Desktop / Web / Wide screen',
  },
];

const IDLE_OPTIONS = [
  { value: 0,   label: 'ปิด (ไม่ล็อก)' },
  { value: 60,  label: '1 นาที' },
  { value: 180, label: '3 นาที' },
  { value: 300, label: '5 นาที' },
  { value: 600, label: '10 นาที' },
];

export const KioskSetupScreen: React.FC<KioskSetupScreenProps> = ({ onStart, onCancel }) => {
  const {
    layout, exitPin, idleTimeout, showCustomerDisplay,
    setLayout, setIdleTimeout, toggleCustomerDisplay,
    setExitPin, enterKioskMode,
  } = useKioskStore();

  const [pinInput, setPinInput] = useState(exitPin);
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  const platform = getPlatformLabel();
  const tablet   = isTablet();
  const wide     = isWideScreen();

  // auto-suggest layout
  const suggestedLayout: KioskLayout = wide ? 'fullgrid' : tablet ? 'split' : 'compact';

  const handleStart = async () => {
    // validate PIN
    if (pinInput.length < 4) { setPinError('PIN ต้องมีอย่างน้อย 4 หลัก'); return; }
    if (pinInput !== confirmPin) { setPinError('PIN ทั้งสองช่องไม่ตรงกัน'); return; }
    setPinError('');
    setExitPin(pinInput);
    await enterKioskMode(pinInput);
    onStart();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ตั้งค่า Kiosk Mode</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Platform info */}
        <View style={styles.platformCard}>
          <Ionicons name="hardware-chip-outline" size={20} color={Colors.accentDark} />
          <View>
            <Text style={styles.platformLabel}>แพลตฟอร์มปัจจุบัน</Text>
            <Text style={styles.platformValue}>{platform}</Text>
          </View>
          {wide && (
            <View style={styles.platformBadge}>
              <Text style={styles.platformBadgeText}>Wide Screen</Text>
            </View>
          )}
          {tablet && !wide && (
            <View style={[styles.platformBadge, { backgroundColor: Colors.accentLight }]}>
              <Text style={[styles.platformBadgeText, { color: Colors.accentDark }]}>Tablet</Text>
            </View>
          )}
        </View>

        {/* Layout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>รูปแบบการแสดงผล</Text>
          {LAYOUT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.layoutCard,
                layout === opt.key && styles.layoutCardActive,
                opt.key === suggestedLayout && styles.layoutCardSuggested,
              ]}
              onPress={() => setLayout(opt.key)}
              activeOpacity={0.8}
            >
              {layout === opt.key && (
                <View style={styles.layoutCheck}>
                  <Ionicons name="checkmark" size={12} color={Colors.white} />
                </View>
              )}
              {opt.key === suggestedLayout && layout !== opt.key && (
                <View style={styles.suggestedBadge}>
                  <Text style={styles.suggestedText}>แนะนำ</Text>
                </View>
              )}
              <View style={[styles.layoutIcon, layout === opt.key && { backgroundColor: Colors.primary }]}>
                <Ionicons name={opt.icon as any} size={24} color={layout === opt.key ? Colors.white : Colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.layoutLabel, layout === opt.key && { color: Colors.primary }]}>{opt.label}</Text>
                <Text style={styles.layoutSub}>{opt.sub}</Text>
                <Text style={styles.layoutSuitable}>เหมาะกับ: {opt.suitable}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* PIN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PIN สำหรับออก Kiosk</Text>
          <Text style={styles.sectionSub}>ต้องกรอก PIN นี้เพื่อออกจาก Kiosk Mode</Text>
          <View style={styles.pinRow}>
            <View style={styles.pinField}>
              <Text style={styles.pinLabel}>PIN ใหม่ (4+ หลัก)</Text>
              <TextInput
                style={styles.pinInput}
                value={pinInput}
                onChangeText={setPinInput}
                keyboardType="number-pad"
                maxLength={8}
                secureTextEntry
                placeholder="กรอก PIN"
                placeholderTextColor={Colors.textDisabled}
              />
            </View>
            <View style={styles.pinField}>
              <Text style={styles.pinLabel}>ยืนยัน PIN</Text>
              <TextInput
                style={[styles.pinInput, (confirmPin && confirmPin !== pinInput) ? styles.pinInputError : null]}
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="number-pad"
                maxLength={8}
                secureTextEntry
                placeholder="กรอกอีกครั้ง"
                placeholderTextColor={Colors.textDisabled}
              />
            </View>
          </View>
          {pinError ? (
            <Text style={styles.pinErrorText}>{pinError}</Text>
          ) : confirmPin && confirmPin === pinInput ? (
            <View style={styles.pinOk}>
              <Ionicons name="checkmark-circle-outline" size={14} color={Colors.success} />
              <Text style={styles.pinOkText}>PIN ตรงกัน</Text>
            </View>
          ) : null}
        </View>

        {/* Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ตัวเลือกเพิ่มเติม</Text>

          {/* Idle timeout */}
          <View style={styles.optionRow}>
            <View style={[styles.optionIcon, { backgroundColor: Colors.warningLight }]}>
              <Ionicons name="time-outline" size={18} color={Colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>ล็อกหน้าจออัตโนมัติ</Text>
              <Text style={styles.optionSub}>เมื่อไม่มีการใช้งาน</Text>
            </View>
          </View>
          <View style={styles.idleOptions}>
            {IDLE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.idleChip, idleTimeout === opt.value && styles.idleChipActive]}
                onPress={() => setIdleTimeout(opt.value)}
              >
                <Text style={[styles.idleChipText, idleTimeout === opt.value && styles.idleChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Customer display */}
          <View style={styles.switchRow}>
            <View style={[styles.optionIcon, { backgroundColor: Colors.accentLight }]}>
              <Ionicons name="tv-outline" size={18} color={Colors.accentDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>แสดงจอที่ 2 (Customer Display)</Text>
              <Text style={styles.optionSub}>แสดงรายการให้ลูกค้าดูพร้อมกัน</Text>
            </View>
            <Switch
              value={showCustomerDisplay}
              onValueChange={toggleCustomerDisplay}
              trackColor={{ true: Colors.primary, false: Colors.gray200 }}
              thumbColor={Colors.white}
            />
          </View>

          {/* Web fullscreen note */}
          {IS_WEB && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.accentDark} />
              <Text style={styles.infoText}>
                บน Web จะเปิด Fullscreen อัตโนมัติเมื่อเข้า Kiosk Mode{'\n'}
                กด <Text style={{ fontWeight: '700' }}>ESC</Text> หรือปุ่ม "ออก Kiosk" เพื่อออก
              </Text>
            </View>
          )}
        </View>

        {/* Start button */}
        <TouchableOpacity
          style={[styles.startBtn, (!pinInput || pinInput !== confirmPin) && styles.startBtnDisabled]}
          onPress={handleStart}
          disabled={!pinInput || pinInput !== confirmPin}
          activeOpacity={0.85}
        >
          <Ionicons name="storefront-outline" size={22} color={Colors.white} />
          <Text style={styles.startBtnText}>เข้าสู่ Kiosk Mode</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>ยกเลิก</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.secondary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.secondaryDark,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.text },
  scroll: { padding: Spacing.md, gap: Spacing.md },

  platformCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.accentLight, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.accentDark + '40',
  },
  platformLabel: { ...Typography.caption, color: Colors.textSecondary },
  platformValue: { ...Typography.label, color: Colors.accentDark, fontWeight: '700' },
  platformBadge: { backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 'auto' },
  platformBadgeText: { fontSize: 10, color: Colors.primary, fontWeight: '800' },

  section: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.md,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 2,
  },
  sectionTitle: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  sectionSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: -Spacing.sm },

  layoutCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary, position: 'relative',
  },
  layoutCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  layoutCardSuggested: { borderColor: Colors.warning + '80' },
  layoutCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  suggestedBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: Colors.warning, borderRadius: BorderRadius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  suggestedText: { fontSize: 9, color: Colors.white, fontWeight: '800' },
  layoutIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  layoutLabel: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  layoutSub: { ...Typography.caption, color: Colors.textSecondary },
  layoutSuitable: { ...Typography.caption, color: Colors.textDisabled, fontStyle: 'italic' },

  pinRow: { flexDirection: 'row', gap: Spacing.md },
  pinField: { flex: 1, gap: Spacing.xs },
  pinLabel: { ...Typography.caption, color: Colors.textSecondary },
  pinInput: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    ...Typography.body1, color: Colors.text, letterSpacing: 4, textAlign: 'center',
    height: 50,
  },
  pinInputError: { borderColor: Colors.danger },
  pinErrorText: { ...Typography.caption, color: Colors.danger, fontWeight: '600' },
  pinOk: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pinOkText: { ...Typography.caption, color: Colors.success, fontWeight: '600' },

  optionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  optionIcon: { width: 36, height: 36, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { ...Typography.label, color: Colors.text },
  optionSub: { ...Typography.caption, color: Colors.textSecondary },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  idleOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  idleChip: {
    paddingHorizontal: Spacing.sm, paddingVertical: 6,
    borderRadius: BorderRadius.full, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  idleChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  idleChipText: { ...Typography.caption, color: Colors.textSecondary },
  idleChipTextActive: { color: Colors.white, fontWeight: '600' },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.accentLight, borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  infoText: { ...Typography.body2, color: Colors.accentDark, flex: 1, lineHeight: 20 },

  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.lg,
  },
  startBtnDisabled: { backgroundColor: Colors.gray300 },
  startBtnText: { ...Typography.button, color: Colors.white, fontSize: 18 },
  cancelBtn: { alignItems: 'center', paddingVertical: Spacing.md },
  cancelBtnText: { ...Typography.body1, color: Colors.textSecondary },
});
