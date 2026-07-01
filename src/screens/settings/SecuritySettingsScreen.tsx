/**
 * SCR-SET-008 SecuritySettingsScreen
 * ความปลอดภัย — เฉพาะ owner/admin
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatDateTime } from '../../utils/format';
import { usePermission } from '../../hooks/usePermission';
import { usePermissionStore } from '../../store/permissionStore';

const SECURITY_RED = Colors.dangerOnLight;

interface Device {
  id: string;
  name: string;
  os: string;
  lastLogin: Date;
  current: boolean;
}

const MOCK_DEVICES: Device[] = [
  { id: 'dev_001', name: 'iPhone 15 Pro (สมชาย)', os: 'iOS 17.2', lastLogin: new Date(Date.now() - 3600000), current: true },
  { id: 'dev_002', name: 'iPad Air (เคาน์เตอร์)', os: 'iPadOS 17.1', lastLogin: new Date(Date.now() - 86400000), current: false },
  { id: 'dev_003', name: 'Samsung Galaxy Tab S9', os: 'Android 14', lastLogin: new Date(Date.now() - 86400000 * 3), current: false },
];

interface SecuritySettingsScreenProps {
  onBack: () => void;
}

export const SecuritySettingsScreen: React.FC<SecuritySettingsScreenProps> = ({ onBack }) => {
  const { isOwner, isAdmin } = usePermission();
  const { addAuditLog, currentRole } = usePermissionStore();
  const canEdit = isOwner || isAdmin;

  // Password policy
  const [minLength, setMinLength] = useState(8);
  const [requireUpper, setRequireUpper] = useState(true);
  const [requireNumber, setRequireNumber] = useState(true);
  const [requireSpecial, setRequireSpecial] = useState(false);
  const [passwordExpiry, setPasswordExpiry] = useState<30 | 60 | 90 | 0>(90);

  // Session
  const [tokenExpire, setTokenExpire] = useState<'30m' | '1h' | '4h' | '24h' | 'never'>('4h');
  const [autoLogout, setAutoLogout] = useState(true);

  // Device security
  const [deviceBinding, setDeviceBinding] = useState(false);
  const [rootDetection, setRootDetection] = useState(true);
  const [biometric, setBiometric] = useState(true);

  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);

  const handleRevokeDevice = (device: Device) => {
    Alert.alert('ยืนยัน', `ยกเลิกการเข้าถึงของ ${device.name}?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: () => setDevices((prev) => prev.filter((d) => d.id !== device.id)),
      },
    ]);
  };

  const handleSave = () => {
    addAuditLog({
      userId: 'usr_001',
      userName: 'สมชาย เจ้าของร้าน',
      userRole: currentRole,
      action: 'SECURITY_SETTINGS_CHANGE',
      module: 'settings',
      description: 'แก้ไขนโยบายความปลอดภัย',
      afterValue: `MinLen:${minLength}, Upper:${requireUpper}, Biometric:${biometric}`,
    });
    Alert.alert('สำเร็จ', 'บันทึกนโยบายความปลอดภัยเรียบร้อย');
  };

  if (!canEdit) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={[styles.header, { backgroundColor: SECURITY_RED }]}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ความปลอดภัย</Text>
        </View>
        <View style={styles.noAccess}>
          <Ionicons name="lock-closed" size={48} color={Colors.gray300} />
          <Text style={styles.noAccessText}>ไม่มีสิทธิ์เข้าถึง</Text>
          <Text style={styles.noAccessSub}>เฉพาะ Owner / Admin เท่านั้น</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { backgroundColor: SECURITY_RED }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>ความปลอดภัย</Text>
          <Text style={styles.headerSub}>Security Settings</Text>
        </View>
        <Ionicons name="shield-half-outline" size={24} color={Colors.textSecondary} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Password Policy */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="key-outline" size={18} color={SECURITY_RED} />
            <Text style={styles.cardTitle}>Password Policy</Text>
          </View>

          {/* Min length */}
          <View style={styles.field}>
            <View style={styles.sliderRow}>
              <Text style={styles.label}>ความยาวขั้นต่ำ</Text>
              <Text style={[styles.label, { color: SECURITY_RED }]}>{minLength} ตัวอักษร</Text>
            </View>
            <View style={styles.stepRow}>
              {[6, 8, 10, 12, 16, 20].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.stepBtn, minLength === v && styles.stepBtnSelected]}
                  onPress={() => setMinLength(v)}
                >
                  <Text style={[styles.stepBtnText, minLength === v && { color: Colors.white }]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {[
            { label: 'ต้องมีอักษรตัวพิมพ์ใหญ่', value: requireUpper, setter: setRequireUpper },
            { label: 'ต้องมีตัวเลข', value: requireNumber, setter: setRequireNumber },
            { label: 'ต้องมีอักขระพิเศษ (!@#$...)', value: requireSpecial, setter: setRequireSpecial },
          ].map((o, i) => (
            <View key={i} style={styles.switchRow}>
              <Text style={styles.switchLabel}>{o.label}</Text>
              <Switch
                value={o.value}
                onValueChange={o.setter}
                trackColor={{ false: Colors.gray200, true: SECURITY_RED + '40' }}
                thumbColor={o.value ? SECURITY_RED : Colors.gray400}
              />
            </View>
          ))}

          <View style={styles.field}>
            <Text style={styles.label}>รหัสผ่านหมดอายุ</Text>
            <View style={styles.optionRow}>
              {([30, 60, 90, 0] as const).map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.optionBtn, passwordExpiry === v && styles.optionBtnRed]}
                  onPress={() => setPasswordExpiry(v)}
                >
                  <Text style={[styles.optionBtnText, passwordExpiry === v && { color: Colors.white }]}>
                    {v === 0 ? 'ไม่มี' : `${v} วัน`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Session */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="time-outline" size={18} color={SECURITY_RED} />
            <Text style={styles.cardTitle}>Session & Token</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Token หมดอายุ</Text>
            <View style={styles.optionRow}>
              {(['30m', '1h', '4h', '24h', 'never'] as const).map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.optionBtn, tokenExpire === v && styles.optionBtnRed]}
                  onPress={() => setTokenExpire(v)}
                >
                  <Text style={[styles.optionBtnText, tokenExpire === v && { color: Colors.white }]}>
                    {v === 'never' ? 'ไม่หมด' : v}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.switchLabel}>Auto Logout เมื่อไม่มีกิจกรรม</Text>
              <Text style={styles.switchSub}>ออกจากระบบอัตโนมัติหลังไม่ใช้งาน</Text>
            </View>
            <Switch
              value={autoLogout}
              onValueChange={setAutoLogout}
              trackColor={{ false: Colors.gray200, true: SECURITY_RED + '40' }}
              thumbColor={autoLogout ? SECURITY_RED : Colors.gray400}
            />
          </View>
        </View>

        {/* Device Security */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="phone-portrait-outline" size={18} color={SECURITY_RED} />
            <Text style={styles.cardTitle}>Device Security</Text>
          </View>

          {[
            { label: 'Device Binding', sub: 'ล็อกเข้าได้เฉพาะเครื่องที่ลงทะเบียน', value: deviceBinding, setter: setDeviceBinding },
            { label: 'Root/Jailbreak Detection', sub: 'ปิดกั้นเครื่องที่ถูก root/jailbreak', value: rootDetection, setter: setRootDetection },
            { label: 'Biometric Login', sub: 'Face ID / Fingerprint สำหรับเข้าสู่ระบบ', value: biometric, setter: setBiometric },
          ].map((o, i) => (
            <View key={i} style={[styles.switchRow, i > 0 && styles.switchRowBorder]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.switchLabel}>{o.label}</Text>
                <Text style={styles.switchSub}>{o.sub}</Text>
              </View>
              <Switch
                value={o.value}
                onValueChange={o.setter}
                trackColor={{ false: Colors.gray200, true: SECURITY_RED + '40' }}
                thumbColor={o.value ? SECURITY_RED : Colors.gray400}
              />
            </View>
          ))}
        </View>

        {/* Allowed Devices */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={SECURITY_RED} />
            <Text style={styles.cardTitle}>เครื่องที่ลงทะเบียน ({devices.length})</Text>
          </View>
          {devices.map((d) => (
            <View key={d.id} style={styles.deviceCard}>
              <View style={styles.deviceIcon}>
                <Ionicons name="phone-portrait-outline" size={20} color={Colors.gray500} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.deviceNameRow}>
                  <Text style={styles.deviceName}>{d.name}</Text>
                  {d.current && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>เครื่องนี้</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.deviceMeta}>{d.os} · Login: {formatDateTime(d.lastLogin)}</Text>
              </View>
              {!d.current && (
                <TouchableOpacity style={styles.revokeBtn} onPress={() => handleRevokeDevice(d)}>
                  <Text style={styles.revokeBtnText}>Revoke</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Save */}
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: SECURITY_RED }]} onPress={handleSave}>
          <Ionicons name="save-outline" size={18} color={Colors.white} />
          <Text style={styles.saveBtnText}>บันทึกการตั้งค่า</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { ...Typography.h4, color: Colors.white },
  headerSub: { ...Typography.caption, color: Colors.textSecondary },
  noAccess: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  noAccessText: { ...Typography.h4, color: Colors.text },
  noAccessSub: { ...Typography.body2, color: Colors.textSecondary },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  cardTitle: { ...Typography.label, color: Colors.text },
  field: { gap: 8 },
  label: { ...Typography.label, color: Colors.textSecondary },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepRow: { flexDirection: 'row', gap: Spacing.xs },
  stepBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  stepBtnSelected: { backgroundColor: Colors.dangerOnLight, borderColor: Colors.dangerOnLight },
  stepBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  switchRowBorder: { borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: Spacing.sm },
  switchLabel: { ...Typography.label, color: Colors.text },
  switchSub: { ...Typography.caption, color: Colors.textSecondary },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  optionBtn: {
    paddingVertical: 7,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionBtnRed: { backgroundColor: Colors.dangerOnLight, borderColor: Colors.dangerOnLight },
  optionBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  deviceIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  deviceName: { ...Typography.label, color: Colors.text },
  currentBadge: {
    backgroundColor: Colors.successLight,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  currentBadgeText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.success },
  deviceMeta: { ...Typography.caption, color: Colors.textSecondary },
  revokeBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  revokeBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.danger },
  saveBtn: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  saveBtnText: { ...Typography.button, color: Colors.white },
});
