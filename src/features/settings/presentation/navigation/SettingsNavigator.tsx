/**
 * Settings Navigator — M10
 * Stack Navigator สำหรับทุก screen ในโมดูล Settings
 */
import { createStackNavigator } from "expo-router/build/react-navigation/stack";
import React from 'react';
import { AuditLogScreen } from '@/features/settings/presentation/screens/AuditLogScreen';
import { BranchManageScreen } from '@/features/settings/presentation/screens/BranchManageScreen';
import { CustomerDisplaySettingsScreen } from '@/features/settings/presentation/screens/CustomerDisplaySettingsScreen';
import { PermissionMatrixScreen } from '@/features/settings/presentation/screens/PermissionMatrixScreen';
import { POSManageScreen } from '@/features/settings/presentation/screens/POSManageScreen';
import { PrinterSettingsScreen } from '@/features/settings/presentation/screens/PrinterSettingsScreen';
import { RoleManageScreen } from '@/features/settings/presentation/screens/RoleManageScreen';
import { SecuritySettingsScreen } from '@/features/settings/presentation/screens/SecuritySettingsScreen';
import { SettingsHubScreen } from '@/features/settings/presentation/screens/SettingsHubScreen';
import { ShopSettingsScreen } from '@/features/settings/presentation/screens/ShopSettingsScreen';
import { StaffManagementScreen } from '@/features/settings/presentation/screens/StaffManagementScreen';
import { SyncMonitorScreen } from '@/features/settings/presentation/screens/SyncMonitorScreen';
import { UserManagementScreen } from '@/features/settings/presentation/screens/UserManagementScreen';
import { ScreenSurface } from '@/shared/ui/index';

export type SettingsStackParamList = {
  SettingsHub:              undefined;
  ShopSettings:             undefined;
  BranchManage:             undefined;
  UserManage:               undefined;
  RoleManage:               undefined;
  PermissionMatrix:         undefined;
  POSManage:                undefined;
  PrinterSettings:          undefined;
  SecuritySettings:         undefined;
  AuditLog:                 undefined;
  SyncMonitor:              undefined;
  CustomerDisplaySettings:  undefined;
  StaffManagement:          undefined;
  UserManagement:           undefined;
};

const Stack = createStackNavigator<SettingsStackParamList>();

export const SettingsNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenLayout={({ children }) => <ScreenSurface>{children}</ScreenSurface>} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsHub">
        {({ navigation }) => <SettingsHubScreen navigation={navigation} />}
      </Stack.Screen>

      <Stack.Screen name="ShopSettings">
        {({ navigation }) => <ShopSettingsScreen onBack={() => navigation.goBack()} />}
      </Stack.Screen>

      <Stack.Screen name="BranchManage">
        {({ navigation }) => <BranchManageScreen onBack={() => navigation.goBack()} />}
      </Stack.Screen>

      <Stack.Screen name="UserManage">
        {({ navigation }) => <UserManagementScreen onBack={() => navigation.goBack()} />}
      </Stack.Screen>

      <Stack.Screen name="RoleManage">
        {({ navigation }) => <RoleManageScreen onBack={() => navigation.goBack()} />}
      </Stack.Screen>

      <Stack.Screen name="PermissionMatrix">
        {({ navigation }) => <PermissionMatrixScreen onBack={() => navigation.goBack()} />}
      </Stack.Screen>

      <Stack.Screen name="POSManage">
        {({ navigation }) => <POSManageScreen onBack={() => navigation.goBack()} />}
      </Stack.Screen>

      <Stack.Screen name="PrinterSettings">
        {({ navigation }) => <PrinterSettingsScreen onBack={() => navigation.goBack()} />}
      </Stack.Screen>

      <Stack.Screen name="SecuritySettings">
        {({ navigation }) => <SecuritySettingsScreen onBack={() => navigation.goBack()} />}
      </Stack.Screen>

      <Stack.Screen name="AuditLog">
        {({ navigation }) => <AuditLogScreen onBack={() => navigation.goBack()} />}
      </Stack.Screen>

      <Stack.Screen name="SyncMonitor">
        {({ navigation }) => <SyncMonitorScreen onBack={() => navigation.goBack()} />}
      </Stack.Screen>

      <Stack.Screen name="CustomerDisplaySettings">
        {({ navigation }) => (
          <CustomerDisplaySettingsScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>

      <Stack.Screen name="StaffManagement">
        {({ navigation }) => <StaffManagementScreen onBack={() => navigation.goBack()} />}
      </Stack.Screen>

      <Stack.Screen name="UserManagement">
        {({ navigation }) => <UserManagementScreen onBack={() => navigation.goBack()} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
