/**
 * AuthLayout — Shared layout wrapper for all auth screens
 * Web: Split (brand panel left + form right)
 * Mobile: Single column with logo on top
 */
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  maxWidth?: number;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children, title, subtitle, maxWidth = 420,
}) => {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const BrandPanel = () => (
    <View style={s.brandPanel}>
      <View style={s.brandContent}>
        <Image
          source={require('@/assets/logo.png')}
          style={s.brandLogo}
          resizeMode="contain"
        />
        <Text style={s.brandName}>Xcellence ERP</Text>
        <Text style={s.brandTagline}>
          ระบบจัดการร้านค้าครบวงจร{'\n'}POS · CRM · Inventory · Reports
        </Text>
      </View>
      <Text style={s.brandFooter}>© 2024 Xcellence Group</Text>
    </View>
  );

  const FormWrapper = () => (
    <ScrollView
      contentContainerStyle={s.formScroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {!isWide && (
        <View style={s.mobileLogo}>
          <Image
            source={require('@/assets/logo.png')}
            style={s.mobileLogoImg}
            resizeMode="contain"
          />
        </View>
      )}
      <View style={[s.formCard, { maxWidth }]}>
        <Text style={s.formTitle}>{title}</Text>
        {subtitle && <Text style={s.formSubtitle}>{subtitle}</Text>}
        {children}
      </View>
    </ScrollView>
  );

  if (isWide) {
    return (
      <View style={s.splitRoot}>
        <BrandPanel />
        <View style={s.splitRight}>
          <FormWrapper />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.mobileRoot}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <FormWrapper />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  splitRoot: {
    flex: 1, flexDirection: 'row',
    ...(Platform.OS === 'web' ? { height: '100vh' as any } : {}),
  },
  brandPanel: {
    width: '42%', backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', padding: Spacing['3xl'],
  },
  brandContent: { alignItems: 'center', gap: Spacing.lg },
  brandLogo: { width: 120, height: 120 },
  brandName: { ...Typography.h2, color: Colors.primary, textAlign: 'center' },
  brandTagline: { ...Typography.body1, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  brandFooter: { ...Typography.caption, color: Colors.textSecondary, position: 'absolute', bottom: 24 },
  splitRight: { flex: 1, backgroundColor: Colors.background },

  mobileRoot: { flex: 1, backgroundColor: Colors.background },
  mobileLogo: { alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing.lg },
  mobileLogoImg: { width: 80, height: 80 },

  formScroll: {
    flexGrow: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing['3xl'],
  },
  formCard: {
    width: '100%', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, padding: Spacing['3xl'],
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.sm,
  },
  formTitle: { ...Typography.h3, color: Colors.text, marginBottom: 2 },
  formSubtitle: { ...Typography.body2, color: Colors.textSecondary, marginBottom: Spacing.xl },
});
