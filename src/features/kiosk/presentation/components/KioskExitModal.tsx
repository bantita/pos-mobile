/**
 * KioskExitModal — PIN pad สำหรับออกจาก Kiosk Mode
 * กด ··· 3 วินาที หรือ ปุ่ม "ออกจาก Kiosk" เพื่อเปิด
 */
import React, { useState, useRef, useEffect } from 'react';
import { View, Modal, TouchableOpacity, Animated, Vibration, Alert } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { useKioskStore } from '@/features/kiosk/application/stores/kioskStore';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';

interface KioskExitModalProps {
  visible: boolean;
  onClose: () => void;
  onExited: () => void;
}

const PIN_LENGTH = 4;
const KEYS = [
  ['1','2','3'],
  ['4','5','6'],
  ['7','8','9'],
  ['C','0','⌫'],
];

export const KioskExitModal: React.FC<KioskExitModalProps> = ({
  visible, onClose, onExited,
}) => {
  const { exitKioskMode, exitPin, setExitPin } = useKioskStore();
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState<'enter' | 'new' | 'confirm'>('enter');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Reset on open
  useEffect(() => {
    if (visible) {
      setPin('');
      setAttempts(0);
      setPinStep('enter');
      setIsChangingPin(false);
      setNewPin('');
      setConfirmPin('');
    }
  }, [visible]);

  const triggerShake = () => {
    setShake(true);
    Vibration.vibrate([0, 60, 40, 60]);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start(() => setShake(false));
  };

  const handleKey = (key: string) => {
    if (key === 'C') {
      if (pinStep === 'enter') setPin('');
      else if (pinStep === 'new') setNewPin('');
      else setConfirmPin('');
      return;
    }
    if (key === '⌫') {
      if (pinStep === 'enter') setPin(p => p.slice(0, -1));
      else if (pinStep === 'new') setNewPin(p => p.slice(0, -1));
      else setConfirmPin(p => p.slice(0, -1));
      return;
    }

    if (pinStep === 'enter') {
      const next = pin + key;
      setPin(next);
      if (next.length === PIN_LENGTH) {
        setTimeout(() => handleConfirmExit(next), 200);
      }
    } else if (pinStep === 'new') {
      const next = newPin + key;
      setNewPin(next);
      if (next.length === PIN_LENGTH) {
        setTimeout(() => setPinStep('confirm'), 200);
      }
    } else {
      const next = confirmPin + key;
      setConfirmPin(next);
      if (next.length === PIN_LENGTH) {
        setTimeout(() => handleConfirmNewPin(next), 200);
      }
    }
  };

  const handleConfirmExit = (inputPin: string) => {
    const ok = exitKioskMode(inputPin);
    if (ok) {
      Vibration.vibrate(80);
      onExited();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      triggerShake();
      setPin('');
      if (newAttempts >= 5) {
        Alert.alert('ล็อกชั่วคราว', 'ลองผิดเกินกำหนด กรุณาลองอีกครั้งใน 30 วินาที');
      }
    }
  };

  const handleConfirmNewPin = (confirmValue: string) => {
    if (confirmValue === newPin) {
      setExitPin(newPin);
      Vibration.vibrate([0, 50, 50, 50]);
      Alert.alert('เปลี่ยน PIN สำเร็จ', `PIN ใหม่: ${newPin.split('').map(() => '●').join(' ')}`);
      setIsChangingPin(false);
      setPinStep('enter');
      setNewPin('');
      setConfirmPin('');
    } else {
      triggerShake();
      setConfirmPin('');
      setPinStep('new');
      setNewPin('');
    }
  };

  const currentPin  = pinStep === 'enter' ? pin : pinStep === 'new' ? newPin : confirmPin;

  const titleMap = {
    enter:   'กรอก PIN เพื่อออก Kiosk',
    new:     'กำหนด PIN ใหม่',
    confirm: 'ยืนยัน PIN ใหม่',
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/75 items-center justify-center">
        <View
          className="bg-white rounded-[24px] p-5 w-[320px] items-center gap-4 border-[1.5px] border-rose-400"
          style={{ shadowColor: '#09090b', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24, boxShadow: '0 32px 80px rgba(15, 23, 42, 0.22)' }}
        >
          {/* Header */}
          <View className="items-center gap-2">
            <View className="w-[60px] h-[60px] rounded-full bg-rose-50 items-center justify-center">
              <Ionicons name="lock-closed" size={28} color="#f87171" />
            </View>
            <Text className="text-lg font-semibold text-slate-950 text-center">{titleMap[pinStep]}</Text>
            <Text className="text-base text-slate-500 text-center">
              {pinStep === 'enter'
                ? 'กรอก PIN เพื่อออกจากโหมด Kiosk'
                : pinStep === 'new'
                ? 'กำหนด PIN ใหม่ 4 หลัก'
                : 'กรอก PIN ใหม่อีกครั้งเพื่อยืนยัน'}
            </Text>
          </View>

          {/* PIN dots */}
          <Animated.View className="flex-row gap-3" style={{ transform: [{ translateX: shakeAnim }] }}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View
                key={i}
                className={cn(
                  'w-[18px] h-[18px] rounded-full border-2 border-slate-200 bg-gray-100',
                  i < currentPin.length && !shake && 'bg-rose-500 border-rose-500',
                  shake && i < currentPin.length && 'bg-rose-500 border-rose-500',
                )}
              />
            ))}
          </Animated.View>

          {/* Attempts warning */}
          {attempts > 0 && pinStep === 'enter' && (
            <View className="flex-row items-center gap-[5px]">
              <Ionicons name="warning-outline" size={13} color="#ef4444" />
              <Text className="text-xs text-rose-600 font-semibold">PIN ไม่ถูกต้อง ({attempts}/5)</Text>
            </View>
          )}

          {/* Numpad */}
          <View className="w-full gap-2">
            {KEYS.map((row, ri) => (
              <View key={ri} className="flex-row gap-2 justify-center">
                {row.map((key) => (
                  <TouchableOpacity
                    key={key}
                    className={cn(
                      'w-[72px] h-16 rounded-xl bg-gray-100 items-center justify-center border border-slate-200',
                      (key === 'C' || key === '⌫') && 'bg-amber-100',
                      currentPin.length === PIN_LENGTH && key !== 'C' && key !== '⌫' && 'opacity-35',
                    )}
                    style={{ shadowColor: '#09090b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, boxShadow: '0 4px 14px rgba(15, 23, 42, 0.07)' }}
                    onPress={() => handleKey(key)}
                    disabled={currentPin.length === PIN_LENGTH && key !== 'C' && key !== '⌫'}
                    activeOpacity={0.7}
                  >
                    {key === '⌫' ? (
                      <Ionicons name="backspace-outline" size={22} color="#292524" />
                    ) : (
                      <Text className={cn('text-xl font-semibold text-slate-950 font-bold', key === 'C' && 'text-rose-600')}>
                        {key}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* Action buttons */}
          <View className="flex-row gap-3 items-center">
            {pinStep === 'enter' && !isChangingPin && (
              <TouchableOpacity
                className="flex-row items-center gap-[5px] px-3 py-1 rounded-full bg-sky-100 border border-sky-600"
                onPress={() => { setIsChangingPin(true); setPinStep('new'); }}
              >
                <Ionicons name="key-outline" size={14} color="#0284c7" />
                <Text className="text-xs text-sky-600 font-semibold">เปลี่ยน PIN</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="flex-row items-center gap-1 px-3 py-1 rounded-full border border-slate-200"
              onPress={() => { setPin(''); onClose(); }}
            >
              <Ionicons name="close-outline" size={16} color="#57534e" />
              <Text className="text-xs text-slate-500">ยกเลิก</Text>
            </TouchableOpacity>
          </View>

          {/* Hint */}
          <Text className="text-xs text-slate-500">PIN เริ่มต้น: 1234</Text>
        </View>
      </View>
    </Modal>
  );
};
