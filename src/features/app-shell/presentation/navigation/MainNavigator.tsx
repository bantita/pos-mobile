/**
 * Main Navigator — Bottom Tab
 * Phase 1 ครบทุกโมดูล M01–M11
 * Theme: Warm Pastel (#fca5a5 · #fef3c7 · #bfdbfe)
 */
import React, { useMemo, useState } from 'react';
import { createBottomTabNavigator } from "expo-router/build/react-navigation/bottom-tabs";
import { Platform, TextStyle, useWindowDimensions, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { DashboardNavigator } from '@/features/dashboard/presentation/navigation/DashboardNavigator';
import { SaleNavigator }      from '@/features/sale/presentation/navigation/SaleNavigator';
import { ProductNavigator }   from '@/features/product/presentation/navigation/ProductNavigator';
import { InventoryNavigator } from '@/features/inventory/presentation/navigation/InventoryNavigator';
import { ReportsNavigator }   from '@/features/reports/presentation/navigation/ReportsNavigator';
import { SettingsNavigator }  from '@/features/settings/presentation/navigation/SettingsNavigator';
import { SyncNavigator }      from '@/features/sync/presentation/navigation/SyncNavigator';
import { MemberNavigator }    from '@/features/member/presentation/navigation/MemberNavigator';
import { PromotionNavigator } from '@/features/promotion/presentation/navigation/PromotionNavigator';
import { Colors, Font, ScreenSurface } from '@/shared/ui/index';
import { useSyncStore } from '@/features/sync/application/stores/syncStore';

export type MainTabParamList = {
  Dashboard: undefined;
  Sale:      undefined;
  Product:   undefined;
  Inventory: undefined;
  Member:    undefined;
  Promo:     undefined;
  Reports:   undefined;
  Sync:      undefined;
  Settings:  undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// Icon map
const ICONS: Record<string, { active: string; inactive: string }> = {
  Dashboard: { active: 'grid',               inactive: 'grid-outline' },
  Sale:      { active: 'cart',               inactive: 'cart-outline' },
  Product:   { active: 'cube',               inactive: 'cube-outline' },
  Inventory: { active: 'archive',            inactive: 'archive-outline' },
  Member:    { active: 'people-circle',      inactive: 'people-circle-outline' },
  Promo:     { active: 'pricetag',           inactive: 'pricetag-outline' },
  Reports:   { active: 'bar-chart',          inactive: 'bar-chart-outline' },
  Sync:      { active: 'cloud-upload',       inactive: 'cloud-upload-outline' },
  Settings:  { active: 'settings',           inactive: 'settings-outline' },
};

export const MainNavigator: React.FC = () => {
  const [userRole] = useState<'owner' | 'manager' | 'cashier'>('owner');
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { getStats } = useSyncStore();
  const stats = getStats();
  const syncBadge = stats.failed + stats.conflict + stats.pending;
  const isCompact = width < 430;
  const isPhone = width < 768;

  const tabBarStyle = useMemo<ViewStyle>(
    () => ({
      position: isPhone || Platform.OS !== 'web' ? 'absolute' : 'relative',
      left: isPhone ? 10 : 0,
      right: isPhone ? 10 : 0,
      bottom: isPhone ? Math.max(insets.bottom, 8) : 0,
      height: isPhone ? 66 + Math.max(insets.bottom, 8) : 64,
      paddingBottom: isPhone ? Math.max(insets.bottom, 8) : 8,
      paddingTop: isPhone ? 8 : 6,
      paddingHorizontal: isPhone ? 4 : 10,
      backgroundColor: Colors.surface,
      borderTopColor: isPhone ? 'transparent' : Colors.border,
      borderTopWidth: isPhone ? 0 : 1,
      borderRadius: isPhone ? 18 : 0,
      boxShadow: isPhone ? '0 -8px 30px rgba(15, 23, 42, 0.10)' : 'none',
    }),
    [insets.bottom, isPhone],
  );

  const tabBarLabelStyle = useMemo<TextStyle>(
    () => ({
      ...Font.caption,
      fontSize: isPhone ? 11 : 13,
      lineHeight: isPhone ? 14 : 18,
      marginTop: 2,
    }),
    [isPhone],
  );

  return (
    <Tab.Navigator screenLayout={({ children }) => <ScreenSurface>{children}</ScreenSurface>}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: !isCompact,
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.gray500,
        tabBarStyle,
        tabBarItemStyle: {
          minHeight: 50,
          paddingVertical: isPhone ? 2 : 4,
          borderRadius: 12,
        },
        tabBarLabelStyle,
        tabBarIcon: ({ focused, color }) => {
          const icon = focused ? ICONS[route.name]?.active : ICONS[route.name]?.inactive;
          return <Ionicons name={(icon ?? 'grid-outline') as any} size={isPhone ? 21 : 22} color={String(color)} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" options={{ tabBarLabel: 'หน้าหลัก' }}>
        {() => (
          <DashboardNavigator userRole={userRole} onStartSale={() => {}} />
        )}
      </Tab.Screen>

      <Tab.Screen name="Sale"      options={{ tabBarLabel: 'ขาย' }}      component={SaleNavigator} />
      <Tab.Screen name="Product"   options={{ tabBarLabel: 'สินค้า' }}   component={ProductNavigator} />
      <Tab.Screen name="Inventory" options={{ tabBarLabel: 'คลัง' }}     component={InventoryNavigator} />
      <Tab.Screen name="Member"    options={{ tabBarLabel: 'สมาชิก' }}   component={MemberNavigator} />
      <Tab.Screen name="Promo"     options={{ tabBarLabel: 'โปรโมชั่น' }} component={PromotionNavigator} />
      <Tab.Screen name="Reports"   options={{ tabBarLabel: 'รายงาน' }}   component={ReportsNavigator} />

      <Tab.Screen
        name="Sync"
        options={{
          tabBarLabel: 'Sync',
          tabBarBadge: syncBadge > 0 ? (syncBadge > 99 ? '99+' : String(syncBadge)) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: stats.failed > 0 ? Colors.danger : Colors.warning,
            fontSize: 13, minWidth: 16, height: 16,
          },
        }}
        component={SyncNavigator}
      />

      <Tab.Screen name="Settings"  options={{ tabBarLabel: 'ตั้งค่า' }}  component={SettingsNavigator} />
    </Tab.Navigator>
  );
};
