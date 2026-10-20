/**
 * LicenseActivationScreen — เปิดใช้งานระบบด้วยคีย์ใบอนุญาต (native gate)
 * แสดงก่อนหน้า Login เมื่อยังไม่ได้เปิดใช้งาน License
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '../../components/ui';
import { useStoreConfigStore } from '../../store/storeConfigStore';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';

interface LicenseActivationScreenProps {
  onActivated: () => void;
}

export const LicenseActivationScreen: React.FC<LicenseActivationScreenProps> = ({ onActivated }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 768;

  const handleActivate = () => {
    setError('');
    setLoading(true);
    const ok = useStoreConfigStore.getState().activateLicense(key);
    setLoading(false);
    if (ok) {
      onActivated();
    } else {
      setError('คีย์ใบอนุญาตไม่ถูกต้อง');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, isWide && styles.cardWide]}>
          {/* Header */}
          <View style={styles.iconWrap}>
            <Ionicons name="storefront-outline" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.title}>คีย์ใบอนุญาต</Text>
          <Text style={styles.subtitle}>กรอกรหัสเปิดใช้งานเพื่อเริ่มใช้งานระบบ</Text>

          {/* Input */}
          <Input
            label="คีย์ใบอนุญาต / รหัสเปิดใช้งาน"
            placeholder="กรอกคีย์ใบอนุญาต"
            value={key}
            onChangeText={(t) => { setKey(t); setError(''); }}
            autoCapitalize="none"
            leftIcon="key-outline"
            containerStyle={styles.input}
          />

          {/* Inline error */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            title="เปิดใช้งาน License"
            onPress={handleActivate}
            loading={loading}
            fullWidth
            style={styles.button}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    flexGrow: 1, justifyContent: 'center', alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, padding: Spacing['3xl'],
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
    ...Shadow.sm,
  },
  cardWide: { maxWidth: 440 },
  iconWrap: {
    width: 88, height: 88, borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  title: { ...Typography.h2, color: Colors.text, textAlign: 'center' },
  subtitle: {
    ...Typography.body2, color: Colors.textSecondary,
    textAlign: 'center', marginTop: Spacing.xs, marginBottom: Spacing.xl,
  },
  input: { width: '100%', marginBottom: Spacing.sm },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    width: '100%', marginBottom: Spacing.md,
  },
  errorText: { ...Typography.body2, color: Colors.danger, flex: 1 },
  button: { marginTop: Spacing.sm },
});
