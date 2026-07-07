import '@/global.css';

import { ScrollView, Text, View } from '@/shared/tw/index';
import { Colors } from '@/shared/ui/index';
import { fontAssets } from '@/shared/lib/font';
import { useFonts } from 'expo-font';
import { Stack, ThemeProvider } from 'expo-router';
import { DefaultTheme } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { Component, useCallback } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// ── Theme ──
const PosTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    card: Colors.surface,
    primary: Colors.primary,
    text: Colors.text,
    border: Colors.border,
  },
};

SplashScreen.preventAutoHideAsync();

// ── Error Boundary ──
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  state = { hasError: false, error: '' };

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error: String((error as Error)?.message || error) };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 justify-center bg-slate-950 p-8">
          <Text className="mb-4 text-2xl font-extrabold text-red-500">{'Error'}</Text>
          <ScrollView className="mb-4 max-h-80 rounded-lg bg-slate-900 p-4">
            <Text className="text-sm font-semibold text-red-300">{this.state.error}</Text>
          </ScrollView>
          <Text className="text-center text-xs text-slate-400">
            {'ดู Console ใน F12 สำหรับรายละเอียดเพิ่มเติม'}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  const onLayoutReady = useCallback(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null; // expo-splash-screen handles the native splash
  }

  return (
    <SafeAreaProvider onLayout={onLayoutReady}>
      <StatusBar style={Platform.OS === 'web' ? 'dark' : 'dark'} />
      <ErrorBoundary>
        <ThemeProvider value={PosTheme}>
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
