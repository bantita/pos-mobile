import React from 'react';
import { createStackNavigator } from 'expo-router/build/react-navigation/stack';
import { DashboardScreen } from '@/features/dashboard/presentation/screens/DashboardScreen';
import { MainDashboardScreen } from '@/features/dashboard/presentation/screens/MainDashboardScreen';
import { ScreenSurface } from '@/shared/ui/index';

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
  onStartSale, userRole = 'cashier',
}) => {
  const initialRoute: keyof DashboardStackParamList =
    userRole === 'cashier' ? 'CashierDashboard' : 'DashboardMain';

  return (
    <Stack.Navigator screenLayout={({ children }) => <ScreenSurface>{children}</ScreenSurface>} initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain">
        {() => <DashboardScreen onStartSale={onStartSale} />}
      </Stack.Screen>

      <Stack.Screen name="CashierDashboard">
        {() => <MainDashboardScreen />}
      </Stack.Screen>

      <Stack.Screen name="SyncStatus">
        {() => <DashboardScreen onStartSale={onStartSale} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
