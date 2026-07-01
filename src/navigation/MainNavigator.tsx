/**
 * Main Navigator — Bottom Tab
 * Phase 1 ครบทุกโมดูล M01–M11
 * Theme: Warm Pastel (#FF8F8F · #FFF1CB · #C2E2FA)
 */
import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardNavigator } from './DashboardNavigator';
import { SaleNavigator }      from './SaleNavigator';
import { ProductNavigator }   from './ProductNavigator';
import { InventoryNavigator } from './InventoryNavigator';
import { ReportsNavigator }   from './ReportsNavigator';
import { SettingsNavigator }  from './SettingsNavigator';
import { SyncNavigator }      from './SyncNavigator';
import { MemberNavigator }    from './MemberNavigator';
import { PromotionNavigator } from './PromotionNavigator';
import { Colors }     from '../constants/colors';
import { Typography } from '../constants/typography';
import { useSyncStore } from '../store/syncStore';

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
  const { getStats } = useSyncStore();
  const stats = getStats();
  const syncBadge = stats.failed + stats.conflict + stats.pending;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor:  Colors.border,
          borderTopWidth:  1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { ...Typography.caption, fontSize: 14 },
        tabBarIcon: ({ focused, color }) => {
          const icon = focused ? ICONS[route.name]?.active : ICONS[route.name]?.inactive;
          return <Ionicons name={(icon ?? 'grid-outline') as any} size={22} color={color} />;
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
