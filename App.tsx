import React, { useState, useEffect, useRef, Component } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoFont from 'expo-font';

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: String(error?.message || error) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={eb.container}>
          <Text style={eb.title}>❌ Error</Text>
          <ScrollView style={eb.scroll}>
            <Text style={eb.msg}>{this.state.error}</Text>
          </ScrollView>
          <Text style={eb.hint}>ดู Console ใน F12 สำหรับรายละเอียดเพิ่มเติม</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
const eb = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 32, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#EF4444', marginBottom: 16 },
  scroll: { maxHeight: 300, backgroundColor: '#2d2d3d', borderRadius: 8, padding: 16, marginBottom: 16 },
  msg: { fontSize: 13, color: '#FCA5A5', fontFamily: 'monospace' },
  hint: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
});

// ─── Web imports (lazy to catch errors) ──────────────────────────────────────
let WebNavigator: React.FC | null = null;
let WebCustomerDisplayScreen: React.FC | null = null;
if (Platform.OS === 'web') {
  try {
    WebNavigator = require('./src/navigation/WebNavigator').WebNavigator;
    WebCustomerDisplayScreen = require('./src/screens/web/WebCustomerDisplayScreen').WebCustomerDisplayScreen;
  } catch (e) {
    console.error('WebNavigator import failed:', e);
  }
}

// ─── Mobile imports ───────────────────────────────────────────────────────────
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { MainNavigator } from './src/navigation/MainNavigator';
import { Colors } from './src/constants/colors';

const SplashScreen = () => (
  <View style={sp.container}>
    <Text style={sp.logo}>🏪</Text>
    <Text style={sp.title}>POS Mobile</Text>
    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 24 }} />
  </View>
);
const sp = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF1CB', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logo: { fontSize: 64 },
  title: { fontSize: 28, fontWeight: '800', color: '#1F2937' },
});

// ─── App ───────────────────────────────────────────────────────────────────────
type MobileState = 'loading' | 'auth' | 'main';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    ExpoFont.loadAsync({
      ...Ionicons.font,
    }).then(() => setFontsLoaded(true)).catch(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F4F4' }}>
        <ActivityIndicator size="large" color="#FF424D" />
      </View>
    );
  }

  if (Platform.OS === 'web') {
    // ตรวจ ?display=1 → แสดงจอที่ 2 standalone (สำหรับจอ HDMI)
    const isDisplayWindow = typeof window !== 'undefined' &&
      window.location.search.includes('display=1');

    if (isDisplayWindow && WebCustomerDisplayScreen) {
      return (
        <SafeAreaProvider>
          <ErrorBoundary>
            <WebCustomerDisplayScreen />
          </ErrorBoundary>
        </SafeAreaProvider>
      );
    }

    if (!WebNavigator) {
      return (
        <View style={{ flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#EF4444', fontSize: 16 }}>Failed to load WebNavigator — check Console (F12)</Text>
        </View>
      );
    }
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <ErrorBoundary>
          <WebNavigator />
        </ErrorBoundary>
      </SafeAreaProvider>
    );
  }

  const [appState, setAppState] = useState<MobileState>('loading');
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const t = setTimeout(() => { if (mounted.current) setAppState('auth'); }, 1500);
    return () => { mounted.current = false; clearTimeout(t); };
  }, []);

  if (appState === 'loading') {
    return <SafeAreaProvider><StatusBar style="dark" /><SplashScreen /></SafeAreaProvider>;
  }
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ErrorBoundary>
        <NavigationContainer>
          {appState === 'auth'
            ? <AuthNavigator onAuthSuccess={() => setAppState('main')} />
            : <MainNavigator />}
        </NavigationContainer>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
