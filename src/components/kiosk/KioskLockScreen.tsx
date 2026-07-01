/**
 * KioskLockScreen — หน้าจอล็อกหลัง idle
 * แสดงเมื่อไม่มีการใช้งานตาม idleTimeout
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useKioskStore } from '../../store/kioskStore';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatTime } from '../../utils/format';

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
    <View style={styles.overlay}>
      {/* Clock */}
      <View style={styles.clockSection}>
        <Text style={styles.clockTime}>{formatTime(now)}</Text>
        <Text style={styles.clockDate}>
          {now.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      </View>

      {/* Lock card */}
      <View style={styles.card}>
        <View style={styles.lockIconBox}>
          <Ionicons name="lock-closed" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.title}>หน้าจอถูกล็อก</Text>
        <Text style={styles.subtitle}>กรอก PIN เพื่อใช้งานต่อ</Text>

        {/* Dots */}
        <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < pin.length && styles.dotFilled,
                error && i < pin.length && styles.dotError,
              ]}
            />
          ))}
        </Animated.View>
        {error && <Text style={styles.errorText}>PIN ไม่ถูกต้อง</Text>}

        {/* Numpad */}
        <View style={styles.numpad}>
          {KEYS.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.key,
                    (key === 'C' || key === '⌫') && styles.keySpecial,
                  ]}
                  onPress={() => handleKey(key)}
                  activeOpacity={0.7}
                >
                  {key === '⌫' ? (
                    <Ionicons name="backspace-outline" size={22} color={Colors.text} />
                  ) : (
                    <Text style={[styles.keyText, key === 'C' && { color: Colors.danger }]}>{key}</Text>
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

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(42,26,14,0.92)',
    alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xl, zIndex: 9999,
  },
  clockSection: { alignItems: 'center', gap: Spacing.xs },
  clockTime: { fontSize: 56, fontWeight: '800', color: Colors.white, letterSpacing: 2 },
  clockDate: { ...Typography.body1, color: 'rgba(255,255,255,0.7)' },
  card: {
    backgroundColor: Colors.surface, borderRadius: 24,
    padding: Spacing.xl, width: 300, alignItems: 'center', gap: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3, shadowRadius: 32, elevation: 24,
  },
  lockIconBox: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { ...Typography.h4, color: Colors.text },
  subtitle: { ...Typography.body2, color: Colors.textSecondary },
  dotsRow: { flexDirection: 'row', gap: Spacing.md },
  dot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.gray100,
  },
  dotFilled: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dotError:  { backgroundColor: Colors.danger,  borderColor: Colors.danger },
  errorText: { ...Typography.caption, color: Colors.danger, fontWeight: '600' },
  numpad: { width: '100%', gap: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  key: {
    width: 64, height: 56, borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  keySpecial: { backgroundColor: Colors.surfaceWarm },
  keyText: { ...Typography.h3, color: Colors.text, fontWeight: '700' },
});
