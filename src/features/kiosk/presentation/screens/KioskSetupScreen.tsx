import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { useKioskStore, KioskLayout } from '@/features/kiosk/application/stores/kioskStore';
import { cn } from '@/shared/lib/cn';
import { IS_WEB, getPlatformLabel, isTablet, isWideScreen } from '@/shared/lib/platform';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { Text, TextInput } from '@/shared/tw/index';

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
    suitable: 'มือถือ / จอเล็ก',
  },
  {
    key: 'split',
    label: 'Split View',
    sub: 'Grid ด้านซ้าย + Scanner ขวา',
    icon: 'tablet-landscape-outline',
    suitable: 'Tablet / iPad',
  },
  {
    key: 'fullgrid',
    label: 'Full Grid',
    sub: 'Product Grid ด้านซ้าย + ตะกร้าด้านขวา',
    icon: 'desktop-outline',
    suitable: 'Desktop / Web / Wide screen',
  },
];

const IDLE_OPTIONS = [
  { value: 0,   label: 'ปิด (ไม่ใช้)' },
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
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMsg, setAlertMsg] = useState('');

  const showAlert = (title: string, msg: string) => {
    setAlertTitle(title);
    setAlertMsg(msg);
    setAlertVisible(true);
  };

  const platform = getPlatformLabel();
  const tablet   = isTablet();
  const wide     = isWideScreen();

  const suggestedLayout: KioskLayout = wide ? 'fullgrid' : tablet ? 'split' : 'compact';

  const handleStart = async () => {
    if (pinInput.length < 4) { setPinError('PIN ต้องมีอย่างน้อย 4 ตัว'); return; }
    if (pinInput !== confirmPin) { setPinError('PIN ไม่ตรงกัน'); return; }
    setPinError('');
    setExitPin(pinInput);
    await enterKioskMode(pinInput);
    onStart();
  };

  return (
    <SafeAreaView className="flex-1 bg-rose-50" edges={['top']}>
      <View className="flex-row items-center justify-between px-3 py-3 bg-rose-600 border-b border-rose-700 shadow-sm">
        <TouchableOpacity onPress={onCancel} className="p-1">
          <Ionicons name="close" size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className="text-base font-extrabold text-white">ตั้งค่า Kiosk Mode</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerClassName="p-3 gap-3" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center gap-3 p-3 rounded-2xl border border-rose-200 bg-rose-100">
          <Ionicons name="hardware-chip-outline" size={20} color="#e11d48" />
          <View>
            <Text className="text-xs text-slate-500 font-medium">ตรวจพบอุปกรณ์</Text>
            <Text className="text-xs font-bold text-rose-600">{platform}</Text>
          </View>
          {wide && (
            <View className="bg-rose-500 rounded-full px-2 py-[3px] ml-auto">
              <Text className="text-[10px] text-white font-extrabold">Wide Screen</Text>
            </View>
          )}
          {tablet && !wide && (
            <View className="rounded-full px-2 py-[3px] ml-auto bg-rose-100 border border-rose-300">
              <Text className="text-[10px] font-extrabold text-rose-600">Tablet</Text>
            </View>
          )}
        </View>

        <View className="bg-white rounded-2xl p-3 gap-3 shadow-sm border border-rose-100">
          <Text className="text-xs font-bold text-slate-800">รูปแบบการแสดงผล</Text>
          {LAYOUT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              className={cn(
                'flex-row items-center gap-3 p-3 rounded-2xl border-[1.5px] border-rose-200 bg-rose-50 relative',
                layout === opt.key && 'border-rose-500 bg-rose-50',
                opt.key === suggestedLayout && layout !== opt.key && 'border-amber-400/70'
              )}
              onPress={() => setLayout(opt.key)}
              activeOpacity={0.8}
            >
              {layout === opt.key && (
                <View className="absolute top-2 right-2 w-5 h-5 rounded-full bg-rose-500 items-center justify-center">
                  <Ionicons name="checkmark" size={12} color="#fafafa" />
                </View>
              )}
              {opt.key === suggestedLayout && layout !== opt.key && (
                <View className="absolute top-2 right-2 bg-amber-500 rounded-full px-[6px] py-[2px]">
                  <Text className="text-[9px] text-white font-extrabold">แนะนำ</Text>
                </View>
              )}
              <View className={cn('w-12 h-12 rounded-xl bg-white items-center justify-center', layout === opt.key && 'bg-rose-500')}>
                <Ionicons name={opt.icon as any} size={24} color={layout === opt.key ? '#fafafa' : '#64748b'} />
              </View>
              <View className="flex-1">
                <Text className={cn('text-xs font-bold text-slate-800', layout === opt.key && 'text-rose-600')}>{opt.label}</Text>
                <Text className="text-xs text-slate-500 font-medium">{opt.sub}</Text>
                <Text className="text-xs text-slate-400 italic font-medium">เหมาะสำหรับ: {opt.suitable}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View className="bg-white rounded-2xl p-3 gap-3 shadow-sm border border-rose-100">
          <Text className="text-xs font-bold text-slate-800">PIN ออกจาก Kiosk</Text>
          <Text className="text-xs text-slate-500 font-medium -mt-2">ตั้ง PIN สำหรับออกจาก Kiosk Mode</Text>
          <View className="flex-row gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-xs text-slate-500 font-medium">PIN ใหม่ (4+ หลัก)</Text>
              <TextInput
                className="bg-rose-50 rounded-xl border-[1.5px] border-rose-200 px-3 py-2 text-xs font-medium text-slate-800 text-center h-[50px] tracking-[4px]"
                value={pinInput}
                onChangeText={setPinInput}
                keyboardType="number-pad"
                maxLength={8}
                secureTextEntry
                placeholder="ตั้ง PIN"
                placeholderTextColor="#cbd5e1"
              />
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-xs text-slate-500 font-medium">ยืนยัน PIN</Text>
              <TextInput
                className={cn('bg-rose-50 rounded-xl border-[1.5px] border-rose-200 px-3 py-2 text-xs font-medium text-slate-800 text-center h-[50px] tracking-[4px]', (confirmPin && confirmPin !== pinInput) && 'border-rose-500')}
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="number-pad"
                maxLength={8}
                secureTextEntry
                placeholder="ยืนยันอีกครั้ง"
                placeholderTextColor="#cbd5e1"
              />
            </View>
          </View>
          {pinError ? (
            <Text className="text-xs text-rose-600 font-bold">{pinError}</Text>
          ) : confirmPin && confirmPin === pinInput ? (
            <View className="flex-row items-center gap-1">
              <Ionicons name="checkmark-circle-outline" size={14} color="#0f766e" />
              <Text className="text-xs text-emerald-600 font-bold">PIN ตรงกัน</Text>
            </View>
          ) : null}
        </View>

        <View className="bg-white rounded-2xl p-3 gap-3 shadow-sm border border-rose-100">
          <Text className="text-xs font-bold text-slate-800">การตั้งค่าเพิ่มเติม</Text>

          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-lg items-center justify-center bg-amber-100">
              <Ionicons name="time-outline" size={18} color="#a16207" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-800">ปิดอัตโนมัติเมื่อไม่ใช้งาน</Text>
              <Text className="text-xs text-slate-500 font-medium">กลับหน้าแรกเมื่อไม่มีการขาย</Text>
            </View>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {IDLE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className={cn('px-2 py-[6px] rounded-full border', idleTimeout === opt.value ? 'bg-rose-500 border-rose-500' : 'bg-white border-rose-200')}
                onPress={() => setIdleTimeout(opt.value)}
              >
                <Text className={cn('text-xs', idleTimeout === opt.value ? 'text-white font-bold' : 'text-slate-600 font-medium')}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-lg items-center justify-center bg-sky-100">
              <Ionicons name="tv-outline" size={18} color="#0284c7" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-800">จอ 2 (Customer Display)</Text>
              <Text className="text-xs text-slate-500 font-medium">แสดงราคาและโฆษณาให้ลูกค้า</Text>
            </View>
            <Switch
              value={showCustomerDisplay}
              onValueChange={toggleCustomerDisplay}
            />
          </View>

          {IS_WEB && (
            <View className="flex-row items-start gap-2 p-3 rounded-xl bg-rose-100 border border-rose-200">
              <Ionicons name="information-circle-outline" size={16} color="#e11d48" />
              <Text className="text-xs text-rose-700 flex-1 leading-5 font-medium">
                บน Web การเข้า Fullscreen จะเปิด Kiosk Mode โดยอัตโนมัติ{'\n'}
                กด <Text className="font-bold">ESC</Text> หรือปุ่ม "ออก Kiosk" เพื่อออก
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          className={cn('flex-row items-center justify-center gap-2 rounded-2xl py-4 shadow-sm', (!pinInput || pinInput !== confirmPin) ? 'bg-rose-200' : 'bg-rose-500')}
          onPress={handleStart}
          disabled={!pinInput || pinInput !== confirmPin}
          activeOpacity={0.85}
        >
          <Ionicons name="storefront-outline" size={22} color="#fafafa" />
          <Text className="text-xs font-bold text-white">เริ่มต้น Kiosk Mode</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center py-3" onPress={onCancel}>
          <Text className="text-xs text-slate-500 font-medium">ยกเลิก</Text>
        </TouchableOpacity>

        <View className="h-5" />
      </ScrollView>

      <AlertDialog visible={alertVisible} onClose={() => setAlertVisible(false)} title={alertTitle} message={alertMsg} variant="info" />
    </SafeAreaView>
  );
};
