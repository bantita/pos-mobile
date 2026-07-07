/**
 * KioskLockScreen — หน้าจอล็อกหลัง idle
 * แสดงเมื่อไม่มีการใช้งานตาม idleTimeout
 */
import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Animated, Vibration } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { useKioskStore } from '@/features/kiosk/application/stores/kioskStore';
import { cn } from '@/shared/lib/cn';
import { formatTime } from '@/shared/lib/format';
import { Text } from '@/shared/tw/index';

interface KioskLockScreenProps {
  onUnlocked: () => void;
}

const PIN_LENGTH = 4;
const KEYS = [
  ['1','2','3'],
  ['4','5','6'],
  ['7','8','9'],
  ['C','0','⌫'],
];

export const KioskLockScreen: React.FC<KioskLockScreenProps> = ({ onUnlocked }) => {
  const { unlockScreen } = useKioskStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const now = new Date();

  const triggerShake = () => {
    setError(true);
    Vibration.vibrate([0, 60, 40, 60]);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start(() => {
      setError(false);
      setPin('');
    });
  };

  const handleKey = (key: string) => {
    if (key === 'C')  { setPin(''); return; }
    if (key === '⌫')  { setPin(p => p.slice(0, -1)); return; }
    const next = pin + key;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      setTimeout(() => {
        const ok = unlockScreen(next);
        if (ok) {
          Vibration.vibrate(80);
          onUnlocked();
        } else {
          triggerShake();
        }
      }, 150);
    }
  };

  return (
    <View className="absolute inset-0 bg-[rgba(42,26,14,0.92)] items-center justify-center gap-5 z-[9999]">
      {/* Clock */}
      <View className="items-center gap-1">
        <Text className="text-[56px] font-extrabold text-white tracking-[2px]">{formatTime(now)}</Text>
        <Text className="text-base leading-relaxed text-white/70">
          {now.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      </View>

      {/* Lock card */}
      <View
        className="bg-white rounded-[24px] p-5 w-[300px] items-center gap-3"
        style={{ boxShadow: '0 24px 64px rgba(15, 23, 42, 0.24)' }}
      >
        <View className="w-16 h-16 rounded-full bg-rose-50 items-center justify-center">
          <Ionicons name="lock-closed" size={32} color="#f87171" />
        </View>
        <Text className="text-lg font-semibold text-slate-950">หน้าจอถูกล็อก</Text>
        <Text className="text-base text-slate-500">กรอก PIN เพื่อใช้งานต่อ</Text>

        {/* Dots */}
        <Animated.View className="flex-row gap-3" style={{ transform: [{ translateX: shakeAnim }] }}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              className={cn(
                'w-4 h-4 rounded-full border-2 border-slate-200 bg-gray-100',
                i < pin.length && !error && 'bg-rose-500 border-rose-500',
                error && i < pin.length && 'bg-rose-500 border-rose-500',
              )}
            />
          ))}
        </Animated.View>
        {error && <Text className="text-xs text-rose-600 font-semibold">PIN ไม่ถูกต้อง</Text>}

        {/* Numpad */}
        <View className="w-full gap-2">
          {KEYS.map((row, ri) => (
            <View key={ri} className="flex-row gap-2 justify-center">
              {row.map((key) => (
                <TouchableOpacity
                  key={key}
                  className={cn(
                    'w-16 h-14 rounded-xl bg-gray-100 items-center justify-center border border-slate-200',
                    (key === 'C' || key === '⌫') && 'bg-amber-100',
                  )}
                  onPress={() => handleKey(key)}
                  activeOpacity={0.7}
                >
                  {key === '⌫' ? (
                    <Ionicons name="backspace-outline" size={22} color="#292524" />
                  ) : (
                    <Text className={cn('text-xl font-bold text-slate-950', key === 'C' && 'text-rose-600')}>{key}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};
