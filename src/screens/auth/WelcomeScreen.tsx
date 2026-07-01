/**
 * SCR-AUTH-001 — Welcome Screen
 * FR-AUTH-001: เลือกเข้าสู่ระบบหรือสมัครร้านค้าใหม่
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

const { width } = Dimensions.get('window');

interface WelcomeScreenProps {
  onLogin: () => void;
  onRegister: () => void;
  appVersion?: string;
  isOnline?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onLogin,
  onRegister,
  appVersion = '1.0.0',
  isOnline = true,
}) => {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(40);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Network Status Banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={14} color={Colors.white} />
          <Text style={styles.offlineText}>ไม่มีการเชื่อมต่ออินเทอร์เน็ต</Text>
        </View>
      )}

      {/* Hero Section */}
      <View style={styles.hero}>
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoCircle}>
            <Ionicons name="storefront" size={56} color={Colors.white} />
          </View>
          <Text style={styles.appName}>POS Mobile</Text>
          <Text style={styles.tagline}>ระบบขายหน้าร้านบนมือถือ</Text>
        </Animated.View>

        {/* Features */}
        <Animated.View style={[styles.features, { opacity: fadeAnim }]}>
          {[
            { icon: 'phone-portrait-outline', label: 'ใช้งานบน iOS & Android' },
            { icon: 'cloud-offline-outline', label: 'รองรับ Offline' },
            { icon: 'business-outline', label: 'รองรับหลายสาขา' },
          ].map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <Ionicons name={f.icon as any} size={18} color={Colors.primaryLight} />
              <Text style={styles.featureText}>{f.label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <Animated.View style={[styles.actions, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Button
          title="มีบัญชีอยู่แล้ว — เข้าสู่ระบบ"
          onPress={onLogin}
          variant="primary"
          size="lg"
          fullWidth
          style={styles.btnLogin}
        />
        <Button
          title="สมัครร้านค้าใหม่"
          onPress={onRegister}
          variant="outline"
          size="lg"
          fullWidth
          style={styles.btnRegister}
          textStyle={{ color: Colors.white }}
        />
        <Text style={styles.version}>v{appVersion}</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.warning, paddingVertical: Spacing.xs, gap: Spacing.xs,
  },
  offlineText: { ...Typography.caption, color: Colors.white, fontWeight: '600' },
  hero: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoContainer: { alignItems: 'center', marginBottom: Spacing.xxl },
  logoCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 3, borderColor: Colors.primaryMid,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  appName: { ...Typography.h1, color: Colors.text, marginBottom: Spacing.xs },
  tagline: { ...Typography.body1, color: Colors.textSecondary },
  features: { gap: Spacing.sm },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  featureText: { ...Typography.body2, color: Colors.textSecondary },
  actions: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, gap: Spacing.md },
  btnLogin: { backgroundColor: Colors.primary },
  btnRegister: { borderColor: Colors.primaryMid, backgroundColor: Colors.primaryLight },
  version: { ...Typography.caption, color: Colors.textDisabled, textAlign: 'center' },
});
