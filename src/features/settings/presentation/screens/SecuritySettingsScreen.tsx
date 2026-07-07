import React, { useState } from 'react';
import { Switch } from 'react-native';
import { ScrollView, Text, TouchableOpacity, View } from '@/shared/tw/index';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { formatDateTime } from '@/shared/lib/format';
import { usePermission } from '@/shared/hooks/usePermission';
import { usePermissionStore } from '@/features/settings/application/stores/permissionStore';

const SECURITY_RED = '#ef4444';

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

  const [minLength, setMinLength] = useState(8);
  const [requireUpper, setRequireUpper] = useState(true);
  const [requireNumber, setRequireNumber] = useState(true);
  const [requireSpecial, setRequireSpecial] = useState(false);
  const [passwordExpiry, setPasswordExpiry] = useState<30 | 60 | 90 | 0>(90);

  const [tokenExpire, setTokenExpire] = useState<'30m' | '1h' | '4h' | '24h' | 'never'>('4h');
  const [autoLogout, setAutoLogout] = useState(true);

  const [deviceBinding, setDeviceBinding] = useState(false);
  const [rootDetection, setRootDetection] = useState(true);
  const [biometric, setBiometric] = useState(true);

  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);

  const [confirmRevoke, setConfirmRevoke] = useState<{ visible: boolean; device: Device | null }>({ visible: false, device: null });
  const [alertDialog, setAlertDialog] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });

  const handleRevokeDevice = (device: Device) => {
    setConfirmRevoke({ visible: true, device });
  };

  const confirmRevokeAction = () => {
    if (confirmRevoke.device) {
      setDevices((prev) => prev.filter((d) => d.id !== confirmRevoke.device!.id));
    }
    setConfirmRevoke({ visible: false, device: null });
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
    setAlertDialog({ visible: true, title: 'สำเร็จ', message: 'บันทึกนโยบายความปลอดภัยเรียบร้อย' });
  };

  if (!canEdit) {
    return (
      <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
        <View className={cn('flex-row items-center gap-2 px-3 py-3')} style={{ backgroundColor: '#dc2626' }}>
          <TouchableOpacity onPress={onBack} className={cn('p-1')}>
            <Ionicons name="arrow-back" size={24} color="#fafafa" />
          </TouchableOpacity>
          <Text className={cn('text-lg font-extrabold text-white')}>ความปลอดภัย</Text>
        </View>
        <View className={cn('flex-1 items-center justify-center gap-2')}>
          <Ionicons name="lock-closed" size={48} color="#d1d5db" />
          <Text className={cn('text-lg font-bold text-slate-950')}>ไม่มีสิทธิ์เข้าถึง</Text>
          <Text className={cn('text-base font-medium text-slate-600')}>เฉพาะ Owner / Admin เท่านั้น</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 px-3 py-3')} style={{ backgroundColor: '#dc2626' }}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-lg font-extrabold text-white')}>ความปลอดภัย</Text>
          <Text className={cn('text-xs font-medium text-rose-100')}>Security Settings</Text>
        </View>
        <Ionicons name="shield-half-outline" size={24} color="#fecdd3" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 12, gap: 12 }}>
        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <View className={cn('flex-row items-center gap-1')}>
            <Ionicons name="key-outline" size={18} color={SECURITY_RED} />
            <Text className={cn('text-xs font-bold text-slate-950')}>Password Policy</Text>
          </View>

          <View className={cn('gap-2')}>
            <View className={cn('flex-row justify-between items-center')}>
              <Text className={cn('text-xs font-bold text-slate-600')}>ความยาวขั้นต่ำ</Text>
              <Text className={cn('text-xs font-bold')} style={{ color: SECURITY_RED }}>{minLength} ตัวอักษร</Text>
            </View>
            <View className={cn('flex-row gap-1')}>
              {[6, 8, 10, 12, 16, 20].map((v) => (
                <TouchableOpacity
                  key={v}
                  className={cn('flex-1 py-2 rounded-xl border border-slate-200 items-center', minLength === v && 'bg-rose-600 border-rose-600')}
                  onPress={() => setMinLength(v)}
                >
                  <Text className={cn('text-sm font-bold text-slate-600', minLength === v && 'text-white')}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {[
            { label: 'ต้องมีอักษรตัวพิมพ์ใหญ่', value: requireUpper, setter: setRequireUpper },
            { label: 'ต้องมีตัวเลข', value: requireNumber, setter: setRequireNumber },
            { label: 'ต้องมีอักขระพิเศษ (!@#$...)', value: requireSpecial, setter: setRequireSpecial },
          ].map((o, i) => (
            <View key={i} className={cn('flex-row items-center justify-between gap-2')}>
              <Text className={cn('text-xs font-bold text-slate-950')}>{o.label}</Text>
              <Switch
                value={o.value}
                onValueChange={o.setter}
              />
            </View>
          ))}

          <View className={cn('gap-2')}>
            <Text className={cn('text-xs font-bold text-slate-600')}>รหัสผ่านหมดอายุ</Text>
            <View className={cn('flex-row flex-wrap gap-1')}>
              {([30, 60, 90, 0] as const).map((v) => (
                <TouchableOpacity
                  key={v}
                  className={cn('py-1.5 px-2 rounded-xl border border-slate-200', passwordExpiry === v && 'bg-rose-600 border-rose-600')}
                  onPress={() => setPasswordExpiry(v)}
                >
                  <Text className={cn('text-sm font-bold text-slate-600', passwordExpiry === v && 'text-white')}>
                    {v === 0 ? 'ไม่มี' : `${v} วัน`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <View className={cn('flex-row items-center gap-1')}>
            <Ionicons name="time-outline" size={18} color={SECURITY_RED} />
            <Text className={cn('text-xs font-bold text-slate-950')}>Session & Token</Text>
          </View>

          <View className={cn('gap-2')}>
            <Text className={cn('text-xs font-bold text-slate-600')}>Token หมดอายุ</Text>
            <View className={cn('flex-row flex-wrap gap-1')}>
              {(['30m', '1h', '4h', '24h', 'never'] as const).map((v) => (
                <TouchableOpacity
                  key={v}
                  className={cn('py-1.5 px-2 rounded-xl border border-slate-200', tokenExpire === v && 'bg-rose-600 border-rose-600')}
                  onPress={() => setTokenExpire(v)}
                >
                  <Text className={cn('text-sm font-bold text-slate-600', tokenExpire === v && 'text-white')}>
                    {v === 'never' ? 'ไม่หมด' : v}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className={cn('flex-row items-center justify-between gap-2')}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text className={cn('text-xs font-bold text-slate-950')}>Auto Logout เมื่อไม่มีกิจกรรม</Text>
              <Text className={cn('text-xs font-medium text-slate-600')}>ออกจากระบบอัตโนมัติหลังไม่ใช้งาน</Text>
            </View>
            <Switch
              value={autoLogout}
              onValueChange={setAutoLogout}
            />
          </View>
        </View>

        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <View className={cn('flex-row items-center gap-1')}>
            <Ionicons name="phone-portrait-outline" size={18} color={SECURITY_RED} />
            <Text className={cn('text-xs font-bold text-slate-950')}>Device Security</Text>
          </View>

          {[
            { label: 'Device Binding', sub: 'ล็อกเข้าได้เฉพาะเครื่องที่ลงทะเบียน', value: deviceBinding, setter: setDeviceBinding },
            { label: 'Root/Jailbreak Detection', sub: 'ปิดกั้นเครื่องที่ถูก root/jailbreak', value: rootDetection, setter: setRootDetection },
            { label: 'Biometric Login', sub: 'Face ID / Fingerprint สำหรับเข้าสู่ระบบ', value: biometric, setter: setBiometric },
          ].map((o, i) => (
            <View key={i} className={cn('flex-row items-center justify-between gap-2', i > 0 && 'border-t border-slate-100 pt-3')}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text className={cn('text-xs font-bold text-slate-950')}>{o.label}</Text>
                <Text className={cn('text-xs font-medium text-slate-600')}>{o.sub}</Text>
              </View>
              <Switch
                value={o.value}
                onValueChange={o.setter}
              />
            </View>
          ))}
        </View>

        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <View className={cn('flex-row items-center gap-1')}>
            <Ionicons name="shield-checkmark-outline" size={18} color={SECURITY_RED} />
            <Text className={cn('text-xs font-bold text-slate-950')}>เครื่องที่ลงทะเบียน ({devices.length})</Text>
          </View>
          {devices.map((d) => (
            <View key={d.id} className={cn('flex-row items-center gap-2 py-2 border-b border-slate-100')}>
              <View className={cn('w-9 h-9 rounded-xl bg-rose-50 items-center justify-center')}>
                <Ionicons name="phone-portrait-outline" size={20} color="#6b7280" />
              </View>
              <View style={{ flex: 1 }}>
                <View className={cn('flex-row items-center gap-1')}>
                  <Text className={cn('text-xs font-bold text-slate-950')}>{d.name}</Text>
                  {d.current && (
                    <View className={cn('bg-emerald-100 rounded px-1.5 py-0.5')}>
                      <Text className={cn('text-xs font-bold text-emerald-700')}>เครื่องนี้</Text>
                    </View>
                  )}
                </View>
                <Text className={cn('text-xs font-medium text-slate-600')}>{d.os} · Login: {formatDateTime(d.lastLogin)}</Text>
              </View>
              {!d.current && (
                <TouchableOpacity className={cn('min-h-10 items-center justify-center rounded-xl border border-rose-600 px-3 py-2')} onPress={() => handleRevokeDevice(d)}>
                  <Text className={cn('text-sm font-bold text-rose-600')}>Revoke</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity className={cn('flex-row items-center justify-center gap-2 rounded-xl py-3 shadow-sm')} style={{ backgroundColor: '#dc2626' }} onPress={handleSave}>
          <Ionicons name="save-outline" size={18} color="#fafafa" />
          <Text className={cn('text-base font-bold text-white')}>บันทึกการตั้งค่า</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      <ConfirmModal
        visible={confirmRevoke.visible}
        title="ยืนยัน"
        message={`ยกเลิกการเข้าถึงของ ${confirmRevoke.device?.name}?`}
        variant="danger"
        confirmLabel="Revoke"
        cancelLabel="ยกเลิก"
        onConfirm={confirmRevokeAction}
        onCancel={() => setConfirmRevoke({ visible: false, device: null })}
        onClose={() => setConfirmRevoke({ visible: false, device: null })}
      />

      <AlertDialog
        visible={alertDialog.visible}
        title={alertDialog.title}
        message={alertDialog.message}
        variant="success"
        onClose={() => setAlertDialog({ visible: false, title: '', message: '' })}
        onConfirm={() => setAlertDialog({ visible: false, title: '', message: '' })}
      />
    </SafeAreaView>
  );
};
