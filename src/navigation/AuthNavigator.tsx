/**
 * Auth Navigator — M01 Authentication Flow
 * จัดการ navigation ระหว่าง 5 หน้าจอของ M01
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OTPLoginScreen } from '../screens/auth/OTPLoginScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { RegisterShopScreen } from '../screens/auth/RegisterShopScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  OTPLogin: undefined;
  ForgotPassword: undefined;
  RegisterShop: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

interface AuthNavigatorProps {
  onAuthSuccess: () => void;
}

export const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onAuthSuccess }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="Welcome">
        {(props) => (
          <WelcomeScreen
            onLogin={() => props.navigation.navigate('Login')}
            onRegister={() => props.navigation.navigate('RegisterShop')}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Login">
        {(props) => (
          <LoginScreen
            onLogin={async (credential, password) => {
              // TODO: connect to auth store / API
              onAuthSuccess();
            }}
            onOTPLogin={() => props.navigation.navigate('OTPLogin')}
            onForgotPassword={() => props.navigation.navigate('ForgotPassword')}
            onBack={() => props.navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="OTPLogin">
        {(props) => (
          <OTPLoginScreen
            onRequestOTP={async (phone) => { /* call API */ }}
            onVerifyOTP={async (phone, otp) => {
              // TODO: connect to auth store / API
              onAuthSuccess();
            }}
            onBack={() => props.navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="ForgotPassword">
        {(props) => (
          <ForgotPasswordScreen
            onResetSuccess={() => props.navigation.navigate('Login')}
            onBack={() => props.navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="RegisterShop">
        {(props) => (
          <RegisterShopScreen
            onRegisterSuccess={onAuthSuccess}
            onBack={() => props.navigation.goBack()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
