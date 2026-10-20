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
import { useAuthStore } from '../store/authStore';

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
              // ตรวจ credential จริงผ่าน authStore — login คืน false เมื่อไม่ถูกต้อง
              const ok = useAuthStore.getState().login(credential, password);
              if (!ok) throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
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
            onRequestOTP={async (phone) => {
              // MOCK: ขอ OTP จาก store (ยังไม่ต่อ SMS gateway จริง)
              const otp = useAuthStore.getState().requestOTP(phone);
              // แสดงรหัสให้ผู้ทดสอบเห็น (mock เท่านั้น — จริงจะส่งทาง SMS)
              if (typeof window !== 'undefined' && window.alert) {
                window.alert(`รหัส OTP (ทดสอบ): ${otp}`);
              }
            }}
            onVerifyOTP={async (phone, otp) => {
              const ok = useAuthStore.getState().verifyOTP(phone, otp);
              if (!ok) throw new Error('รหัส OTP ไม่ถูกต้อง');
              onAuthSuccess();
            }}
            onBack={() => props.navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="ForgotPassword">
        {(props) => (
          <ForgotPasswordScreen
            onReset={(phone, newPassword) =>
              useAuthStore.getState().resetPassword(phone, newPassword)
            }
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
