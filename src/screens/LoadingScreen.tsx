/**
 * Loading Screen — แสดงระหว่าง app initialize
 * Theme: Warm Pastel
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing } from '../constants/spacing';

const { width } = Dimensions.get('window');

interface Props {
  message?: string;
  progress?: number;   // 0–100, ถ้าไม่ระบุใช้ indeterminate
}

export const LoadingScreen: React.FC<Props> = ({
  message = 'กำลังโหลดข้อมูล...',
  progress,
}) => {
  const pulseAnim    = useRef(new Animated.Value(0.85)).current;
  const rotateAnim   = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.85, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Dots rotate / shimmer
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
    ).start();
  }, []);

  useEffect(() => {
    if (progress !== undefined) {
      Animated.timing(progressAnim, {
        toValue: progress / 100,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [progress]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Background shapes */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoWrap, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.logoOuter}>
            <View style={styles.logoInner}>
              <Ionicons name="storefront" size={48} color={Colors.primary} />
            </View>
          </View>
        </Animated.View>

        <Text style={styles.appName}>POS Mobile</Text>
        <Text style={styles.tagline}>ระบบขายหน้าร้านบนมือถือ</Text>

        {/* Spinner */}
        <View style={styles.spinnerWrap}>
          <Animated.View style={[styles.spinnerRing, { transform: [{ rotate: spin }] }]}>
            <View style={styles.spinnerDot} />
          </Animated.View>
        </View>

        {/* Progress bar (determinate) */}
        {progress !== undefined ? (
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        ) : (
          /* Indeterminate shimmer bar */
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                styles.progressIndeterminate,
                {
                  transform: [{
                    translateX: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-width * 0.6, width * 0.6],
                    }),
                  }],
                },
              ]}
            />
          </View>
        )}

        <Text style={styles.message}>{message}</Text>
        {progress !== undefined && (
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        )}
      </View>

      {/* Bottom branding */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by POS Mobile v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Background decorative circles
  bgCircle1: {
    position: 'absolute', top: -80, right: -80,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: Colors.primaryMid + '30',
  },
  bgCircle2: {
    position: 'absolute', bottom: -60, left: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: Colors.secondary + '60',
  },
  bgCircle3: {
    position: 'absolute', top: '40%', left: -40,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.accentLight + '80',
  },

  content: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },

  // Logo
  logoWrap: { marginBottom: Spacing.xs },
  logoOuter: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 12,
  },
  logoInner: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: Colors.secondary,
    alignItems: 'center', justifyContent: 'center',
  },

  appName: {
    fontSize: 32, fontWeight: '800',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  tagline: {
    ...Typography.body1,
    color: Colors.textSecondary,
  },

  // Spinner
  spinnerWrap: {
    width: 48, height: 48,
    alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  spinnerRing: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.primaryMid,
    borderTopColor: Colors.primary,
    alignItems: 'flex-start', justifyContent: 'flex-start',
  },
  spinnerDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary,
    position: 'absolute', top: -5, left: 12,
  },

  // Progress
  progressTrack: {
    width: width * 0.6, height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3, overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressIndeterminate: {
    width: '45%',
  },
  progressText: {
    ...Typography.label, color: Colors.primary,
    fontWeight: '700',
  },

  message: {
    ...Typography.body2,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  footer: {
    position: 'absolute', bottom: Spacing.xl,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textDisabled,
  },
});
