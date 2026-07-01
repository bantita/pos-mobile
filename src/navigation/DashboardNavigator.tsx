/**
 * Dashboard Navigator — M02
 * Stack: DashboardMain → CashierDashboard → SyncStatus
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { CashierDashboardScreen } from '../screens/dashboard/CashierDashboardScreen';
import { SyncStatusScreen } from '../screens/dashboard/SyncStatusScreen';

export type DashboardStackParamList = {
  DashboardMain: undefined;
  CashierDashboard: undefined;
  SyncStatus: undefined;
};

const Stack = createStackNavigator<DashboardStackParamList>();

interface DashboardNavigatorProps {
  onStartSale: () => void;
  userRole?: 'owner' | 'manager' | 'cashier';
}

export const DashboardNavigator: React.FC<DashboardNavigatorProps> = ({
  onStartSale,
  userRole = 'cashier',
}) => {
  // Owner/Manager เห็น DashboardMain, Cashier เห็น CashierDashboard
  const initialRoute: keyof DashboardStackParamList =
    userRole === 'cashier' ? 'CashierDashboard' : 'DashboardMain';

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="DashboardMain">
        {(props) => (
          <DashboardScreen
            onOpenSync={() => props.navigation.navigate('SyncStatus')}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="CashierDashboard">
        {(props) => (
          <CashierDashboardScreen
            onStartSale={onStartSale}
            onOpenSync={() => props.navigation.navigate('SyncStatus')}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="SyncStatus">
        {(props) => (
          <SyncStatusScreen
            onBack={() => props.navigation.goBack()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
