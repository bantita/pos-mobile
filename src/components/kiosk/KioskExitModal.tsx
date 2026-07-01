/**
 * KioskExitModal — PIN pad สำหรับออกจาก Kiosk Mode
 * กด ··· 3 วินาที หรือ ปุ่ม "ออกจาก Kiosk" เพื่อเปิด
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Vibration, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useKioskStore } from '../../store/kioskStore';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

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
      Alert.alert('✅ เปลี่ยน PIN สำเร็จ', `PIN ใหม่: ${newPin.split('').map(() => '●').join(' ')}`);
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
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.lockIcon}>
              <Ionicons name="lock-closed" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.title}>{titleMap[pinStep]}</Text>
            <Text style={styles.subtitle}>
              {pinStep === 'enter'
                ? 'กรอก PIN เพื่อออกจากโหมด Kiosk'
                : pinStep === 'new'
                ? 'กำหนด PIN ใหม่ 4 หลัก'
                : 'กรอก PIN ใหม่อีกครั้งเพื่อยืนยัน'}
            </Text>
          </View>

          {/* PIN dots */}
          <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < currentPin.length && styles.dotFilled,
                  shake && i < currentPin.length && styles.dotError,
                ]}
              />
            ))}
          </Animated.View>

          {/* Attempts warning */}
          {attempts > 0 && pinStep === 'enter' && (
            <View style={styles.attemptsRow}>
              <Ionicons name="warning-outline" size={13} color={Colors.danger} />
              <Text style={styles.attemptsText}>PIN ไม่ถูกต้อง ({attempts}/5)</Text>
            </View>
          )}

          {/* Numpad */}
          <View style={styles.numpad}>
            {KEYS.map((row, ri) => (
              <View key={ri} style={styles.numpadRow}>
                {row.map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.numKey,
                      (key === 'C' || key === '⌫') && styles.numKeySpecial,
                      currentPin.length === PIN_LENGTH && key !== 'C' && key !== '⌫' && styles.numKeyDisabled,
                    ]}
                    onPress={() => handleKey(key)}
                    disabled={currentPin.length === PIN_LENGTH && key !== 'C' && key !== '⌫'}
                    activeOpacity={0.7}
                  >
                    {key === '⌫' ? (
                      <Ionicons name="backspace-outline" size={22} color={Colors.text} />
                    ) : (
                      <Text style={[styles.numKeyText, (key === 'C') && { color: Colors.danger }]}>
                        {key}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            {pinStep === 'enter' && !isChangingPin && (
              <TouchableOpacity
                style={styles.changePinBtn}
                onPress={() => { setIsChangingPin(true); setPinStep('new'); }}
              >
                <Ionicons name="key-outline" size={14} color={Colors.accentDark} />
                <Text style={styles.changePinText}>เปลี่ยน PIN</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setPin(''); onClose(); }}>
              <Ionicons name="close-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.cancelText}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>

          {/* Hint */}
          <Text style={styles.hint}>PIN เริ่มต้น: 1234</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.surface, borderRadius: 24,
    padding: Spacing.xl, width: 320, alignItems: 'center', gap: Spacing.lg,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25, shadowRadius: 24, elevation: 20,
    borderWidth: 1.5, borderColor: Colors.primaryMid,
  },
  header: { alignItems: 'center', gap: Spacing.sm },
  lockIcon: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  title:    { ...Typography.h4, color: Colors.text, textAlign: 'center' },
  subtitle: { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center' },

  // Dots
  dotsRow: { flexDirection: 'row', gap: Spacing.md },
  dot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.gray100,
  },
  dotFilled: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dotError:  { backgroundColor: Colors.danger,  borderColor: Colors.danger  },

  // Attempts
  attemptsRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  attemptsText: { ...Typography.caption, color: Colors.danger, fontWeight: '600' },

  // Numpad
  numpad: { width: '100%', gap: Spacing.sm },
  numpadRow: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  numKey: {
    width: 72, height: 64, borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  numKeySpecial: { backgroundColor: Colors.surfaceWarm },
  numKeyDisabled: { opacity: 0.35 },
  numKeyText: { ...Typography.h3, color: Colors.text, fontWeight: '700' },

  // Actions
  actions: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  changePinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full, backgroundColor: Colors.accentLight,
    borderWidth: 1, borderColor: Colors.accentDark,
  },
  changePinText: { ...Typography.caption, color: Colors.accentDark, fontWeight: '600' },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border,
  },
  cancelText: { ...Typography.caption, color: Colors.textSecondary },

  hint: { ...Typography.caption, color: Colors.textDisabled },
});
