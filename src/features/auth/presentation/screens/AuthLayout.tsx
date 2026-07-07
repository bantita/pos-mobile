import { APP_LOGO } from '@/shared/constants/logo';
import React from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/shared/tw/index';

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
    <View className="w-[40%] justify-center bg-slate-950 px-8 py-8">
      <View className="items-center gap-4">
        <Image
          source={APP_LOGO}
          className="h-20 w-20"
          resizeMode="contain"
        />
        <Text className="text-center text-2xl font-extrabold text-white">Xcellence POS</Text>
        <Text className="text-center text-sm font-medium text-slate-300">
          ระบบจัดการร้านค้าครบวงจร{'\n'}POS · CRM · Inventory · Reports
        </Text>
      </View>
      <Text className="absolute bottom-6 text-xs font-medium text-slate-500">© 2024 Xcellence Group</Text>
    </View>
  );

  const FormWrapper = () => (
    <ScrollView
      contentContainerClassName="grow justify-center items-center px-4 py-8"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {!isWide && (
        <View className="items-center mb-5 mt-4">
          <Image
            source={APP_LOGO}
            className="h-16 w-16"
            resizeMode="contain"
          />
        </View>
      )}
      <View
        className="w-full rounded-2xl border border-slate-200 bg-white px-8 py-8 shadow-sm"
        style={{ maxWidth }}
      >
        <Text className="mb-[2px] text-xl font-extrabold text-slate-950">{title}</Text>
        {subtitle && <Text className="mb-5 text-base font-medium text-slate-500">{subtitle}</Text>}
        {children}
      </View>
    </ScrollView>
  );

  if (isWide) {
    return (
      <View className="flex-1 flex-row" style={Platform.OS === 'web' ? { height: '100vh' as any } : {}}>
        <BrandPanel />
        <View className="flex-1 bg-rose-50">
          <FormWrapper />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-rose-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <FormWrapper />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
