/**
 * Settings Navigator — M10
 * Stack Navigator สำหรับทุก screen ในโมดูล Settings
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SettingsHubScreen } from '../screens/settings/SettingsHubScreen';
import { ShopSettingsScreen } from '../screens/settings/ShopSettingsScreen';
import { BranchManageScreen } from '../screens/settings/BranchManageScreen';
import { UserManageScreen } from '../screens/settings/UserManageScreen';
import { RoleManageScreen } from '../screens/settings/RoleManageScreen';
import { PermissionMatrixScreen } from '../screens/settings/PermissionMatrixScreen';
import { POSManageScreen } from '../screens/settings/POSManageScreen';
import { PrinterSettingsScreen } from '../screens/settings/PrinterSettingsScreen';
import { SecuritySettingsScreen } from '../screens/settings/SecuritySettingsScreen';
import { AuditLogScreen } from '../screens/settings/AuditLogScreen';
import { SyncMonitorScreen } from '../screens/settings/SyncMonitorScreen';
import { CustomerDisplaySettingsScreen } from '../screens/settings/CustomerDisplaySettingsScreen';
import { StaffManagementScreen } from '../screens/settings/StaffManagementScreen';
import { UserManagementScreen } from '../screens/settings/UserManagementScreen';

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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
        {({ navigation }) => <UserManageScreen onBack={() => navigation.goBack()} />}
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
