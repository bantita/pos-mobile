/**
 * App Entry — Platform Router
 * Web: Navigator (custom sidebar layout with route state)
 * Mobile: Auth → Main flow using React Navigation inside NavigationIndependentTree
 */
import { NavigationContainer, NavigationIndependentTree } from 'expo-router/react-navigation';
import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { AuthNavigator } from '@/features/auth/presentation/navigation/AuthNavigator';
import { MainNavigator } from '@/features/app-shell/presentation/navigation/MainNavigator';

// ── Web imports (lazy to avoid bundling on mobile) ──
let Navigator: React.FC | null = null;
let CustomerDisplayScreen: React.FC | null = null;

if (Platform.OS === 'web') {
  try {
    Navigator = require('@/features/web/presentation/navigation/Navigator').Navigator;
    CustomerDisplayScreen = require('@/features/web/presentation/screens/CustomerDisplayScreen').CustomerDisplayScreen;
  } catch (error) {
    console.error('Navigator import failed:', error);
  }
}

// ── Web Root ──
function PortalRoot() {
  const isDisplayWindow =
    typeof window !== 'undefined' && window.location.search.includes('display=1');

  if (isDisplayWindow && CustomerDisplayScreen) {
    return <CustomerDisplayScreen />;
  }

  if (!Navigator) {
    // This should never happen in practice
    return null;
  }

  return <Navigator />;
}

// ── Mobile Root ──
type MobileState = 'loading' | 'auth' | 'main';

function MobileRoot() {
  const [appState, setAppState] = useState<MobileState>('loading');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const timer = setTimeout(() => {
      if (mounted.current) setAppState('auth');
    }, 600);
    return () => {
      mounted.current = false;
      clearTimeout(timer);
    };
  }, []);

  if (appState === 'loading') {
    return null; // splash screen still visible via expo-splash-screen
  }

  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <Animated.View
          key={appState}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          className="flex-1"
        >
          {appState === 'auth' ? (
            <AuthNavigator onAuthSuccess={() => setAppState('main')} />
          ) : (
            <MainNavigator />
          )}
        </Animated.View>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}

// ── Entry Point ──
export default function AppEntry() {
  return Platform.OS === 'web' ? <PortalRoot /> : <MobileRoot />;
}
