import { useStoreConfigStore } from '@/features/settings/application/stores/storeConfigStore';
import { APP_LOGO } from '@/shared/constants/logo';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { Text, TextInput } from '@/shared/tw/index';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

interface LoginScreenProps {
  onLogin?: (credential: string, password: string) => Promise<void>;
  onForgotPassword?: () => void;
  onOTPLogin?: () => void;
  onRegister?: () => void;
  onBack?: () => void;
  isOnline?: boolean;
}

const demoAccounts = [
  { label: 'admin', role: 'Owner', cred: 'admin', pass: '1234', icon: 'shield-outline' },
  { label: 'manager', role: 'Manager', cred: 'manager', pass: '1234', icon: 'people-outline' },
  { label: 'cashier', role: 'Cashier', cred: 'cashier', pass: '1234', icon: 'cart-outline' },
];

const features = [
  { icon: 'flash-outline', title: 'ขายเร็ว คิดเงินไว', sub: 'POS ที่ใช้ง่าย รองรับบาร์โค้ด', color: '#fb7185' },
  { icon: 'archive-outline', title: 'สต๊อกแม่นยำ', sub: 'รับ-เบิก-โอน แบบ Realtime', color: '#f97316' },
  { icon: 'people-outline', title: 'CRM ครบจบ', sub: 'สมาชิก คะแนน คูปอง แคมเปญ', color: '#a78bfa' },
  { icon: 'wifi-outline', title: 'Offline-first', sub: 'ทำงานได้แม้ไม่มีเน็ต', color: '#22d3ee' },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onForgotPassword,
  onOTPLogin,
  onRegister,
}) => {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<'credential' | 'password' | null>(null);

  const passwordRef = useRef<RNTextInput>(null);
  const buttonScale = useRef(new Animated.Value(1)).current;

  const { width } = useWindowDimensions();
  const isWide = width >= 1024;
  const isMedium = width >= 768;

  const shopLogo = useStoreConfigStore((state) => state.shopLogo);
  const logoSource = shopLogo ? { uri: shopLogo } : APP_LOGO;

  const handleLogin = async () => {
    if (!credential.trim() || !password.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onLogin?.(credential.trim(), password);
    } catch (e: any) {
      setError(e?.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (cred: string, demoPassword: string) => {
    setCredential(cred);
    setPassword(demoPassword);
    setError('');
  };

  const handlePressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  // ─── Brand Panel (Desktop) ───────────────────────────────────────────
  const BrandPanel = () => (
    <View
      className="flex-1 justify-center px-12 py-16"
      style={{ backgroundColor: '#0f172a' }}
    >
      <View className="max-w-lg gap-10 self-center">
        {/* Logo + Brand */}
        <View className="gap-6">
          <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
            <Image
              source={logoSource}
              className="h-10 w-10"
              resizeMode="contain"
              style={{ width: 40, height: 40 }}
            />
          </View>
          <View className="gap-2">
            <Text className="text-3xl font-extrabold text-white">
              Xcellence POS
            </Text>
            <Text className="text-base font-medium text-slate-400">
              ระบบจัดการร้านค้าครบวงจร สำหรับทีมขาย{'\n'}แคชเชียร์ คลังสินค้า และผู้จัดการ
            </Text>
          </View>
        </View>

        {/* Feature Cards */}
        <View className="gap-3">
          {features.map((item) => (
            <View
              key={item.title}
              className="flex-row items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] px-5 py-4"
            >
              <View
                className="h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: item.color + '18' }}
              >
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-white">{item.title}</Text>
                <Text className="text-xs font-medium text-slate-500">{item.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text className="text-xs font-medium text-slate-700">
          © 2026 Xcellence Corporation · All rights reserved
        </Text>
      </View>
    </View>
  );

  // ─── Login Form ──────────────────────────────────────────────────────
  const Form = () => (
    <ScrollView
      contentContainerClassName="grow justify-center px-6 py-12 sm:px-10 lg:px-16"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className={`w-full self-center ${isWide ? 'max-w-md' : isMedium ? 'max-w-sm' : 'max-w-sm'}`}>

        {/* Mobile Logo */}
        {!isWide && (
          <View className="mb-10 items-center">
            <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white shadow-lg shadow-rose-500/10">
              <Image
                source={logoSource}
                className="h-14 w-14"
                resizeMode="contain"
                style={{ width: 56, height: 56 }}
              />
            </View>
            <Text className="mt-4 text-xl font-extrabold text-slate-900">Xcellence POS</Text>
            <Text className="mt-1 text-sm font-medium text-slate-400">
              ระบบจัดการร้านค้าครบวงจร
            </Text>
          </View>
        )}

        {/* Heading */}
        <View className="mb-8 gap-2">
          <Text className="text-2xl font-extrabold text-slate-900">
            {isWide ? 'เข้าสู่ระบบ' : 'ยินดีต้อนรับ'}
          </Text>
          <Text className="text-sm font-medium text-slate-500">
            เข้าสู่ระบบด้วยบัญชีร้านค้าของคุณ
          </Text>
        </View>

        {/* Form Fields */}
        <View className="gap-5">
          {/* Credential Input */}
          <View className="gap-2">
            <Text className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              ชื่อผู้ใช้
            </Text>
            <View
              className="h-13 flex-row items-center rounded-2xl border bg-white px-4"
              style={{
                borderColor: focusedField === 'credential' ? '#f43f5e' : '#e2e8f0',
                shadowColor: focusedField === 'credential' ? '#f43f5e' : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: focusedField === 'credential' ? 0.12 : 0,
                shadowRadius: 8,
                elevation: focusedField === 'credential' ? 2 : 0,
                height: 52,
              }}
            >
              <View
                className="h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: focusedField === 'credential' ? '#fff1f2' : '#f8fafc' }}
              >
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={focusedField === 'credential' ? '#f43f5e' : '#94a3b8'}
                />
              </View>
              <TextInput
                className="ml-3 flex-1 text-base font-medium text-slate-900"
                placeholder="admin, manager, cashier"
                placeholderTextColor="#cbd5e1"
                value={credential}
                onChangeText={(text) => { setCredential(text); setError(''); }}
                onFocus={() => setFocusedField('credential')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="gap-2">
            <Text className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              รหัสผ่าน
            </Text>
            <View
              className="h-13 flex-row items-center rounded-2xl border bg-white px-4"
              style={{
                borderColor: focusedField === 'password' ? '#f43f5e' : '#e2e8f0',
                shadowColor: focusedField === 'password' ? '#f43f5e' : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: focusedField === 'password' ? 0.12 : 0,
                shadowRadius: 8,
                elevation: focusedField === 'password' ? 2 : 0,
                height: 52,
              }}
            >
              <View
                className="h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: focusedField === 'password' ? '#fff1f2' : '#f8fafc' }}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color={focusedField === 'password' ? '#f43f5e' : '#94a3b8'}
                />
              </View>
              <TextInput
                ref={passwordRef}
                className="ml-3 flex-1 text-base font-medium text-slate-900"
                placeholder="••••••••"
                placeholderTextColor="#cbd5e1"
                secureTextEntry={!showPw}
                value={password}
                onChangeText={(text) => { setPassword(text); setError(''); }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                className="h-8 w-8 items-center justify-center rounded-lg"
                onPress={() => setShowPw(!showPw)}
                activeOpacity={0.7}
                accessibilityLabel={showPw ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                <Ionicons
                  name={showPw ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember + Forgot */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              className="flex-row items-center gap-2"
              onPress={() => setRemember(!remember)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: remember }}
            >
              <View
                className="h-5 w-5 items-center justify-center rounded-md"
                style={{
                  backgroundColor: remember ? '#f43f5e' : '#ffffff',
                  borderColor: remember ? '#f43f5e' : '#e2e8f0',
                  borderWidth: remember ? 0 : 1.5,
                }}
              >
                {remember && <Ionicons name="checkmark" size={13} color="#fff" />}
              </View>
              <Text className="text-sm font-medium text-slate-600">จำบัญชีนี้</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onForgotPassword} activeOpacity={0.7}>
              <Text className="text-sm font-semibold text-rose-500">ลืมรหัสผ่าน?</Text>
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error ? (
            <View className="flex-row items-center gap-3 rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-rose-100">
                <Ionicons name="alert-circle" size={16} color="#e11d48" />
              </View>
              <Text className="flex-1 text-sm font-semibold text-rose-700">{error}</Text>
            </View>
          ) : null}

          {/* Login Button */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              className="items-center justify-center rounded-2xl bg-rose-500 active:bg-rose-600"
              style={{
                height: 52,
                shadowColor: '#f43f5e',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 6,
                opacity: loading ? 0.75 : 1,
              }}
              onPress={handleLogin}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.9}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="เข้าสู่ระบบ"
            >
              {loading ? (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="sync-outline" size={18} color="#fff" />
                  <Text className="text-base font-bold text-white">กำลังเข้าสู่ระบบ...</Text>
                </View>
              ) : (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="log-in-outline" size={18} color="#fff" />
                  <Text className="text-base font-bold text-white">เข้าสู่ระบบ</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* OTP Login */}
          <TouchableOpacity
            className="items-center justify-center rounded-2xl border border-slate-200 bg-white active:bg-slate-50"
            style={{ height: 48 }}
            onPress={onOTPLogin}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="เข้าสู่ระบบด้วย OTP"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="phone-portrait-outline" size={16} color="#64748b" />
              <Text className="text-sm font-bold text-slate-700">เข้าสู่ระบบด้วย OTP</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="my-8 flex-row items-center">
          <View className="flex-1 h-px bg-slate-200" />
          <Text className="mx-4 text-xs font-semibold text-slate-400">ทดลองใช้งาน</Text>
          <View className="flex-1 h-px bg-slate-200" />
        </View>

        {/* Demo Accounts */}
        <View className="rounded-2xl border border-slate-100 bg-white p-4">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="h-6 w-6 items-center justify-center rounded-lg bg-rose-50">
              <Ionicons name="flask-outline" size={13} color="#f43f5e" />
            </View>
            <Text className="text-xs font-bold text-slate-700">Demo Accounts</Text>
            <View className="ml-auto rounded-full bg-slate-100 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-slate-500">รหัส: 1234</Text>
            </View>
          </View>

          <View className="gap-2">
            {demoAccounts.map((account) => (
              <TouchableOpacity
                key={account.cred}
                className="flex-row items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 active:bg-rose-50 active:border-rose-200"
                onPress={() => fillDemoAccount(account.cred, account.pass)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`เข้าสู่ระบบด้วยบัญชี ${account.label}`}
              >
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-100">
                  <Ionicons name={account.icon as any} size={16} color="#f43f5e" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-800">{account.label}</Text>
                  <Text className="text-[11px] font-medium text-slate-400">{account.role}</Text>
                </View>
                <View className="h-6 w-6 items-center justify-center rounded-full bg-rose-50">
                  <Ionicons name="arrow-forward" size={12} color="#f43f5e" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Register Link */}
        <View className="mt-8 items-center">
          <Text className="text-sm font-medium text-slate-500">
            ยังไม่มีบัญชี?{' '}
            <Text className="font-bold text-rose-500" onPress={onRegister}>
              สมัครร้านค้า
            </Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <View className={`flex-1 ${isWide ? 'flex-row' : ''}`} style={{ backgroundColor: '#f8fafc' }}>
      {isWide && <BrandPanel />}
      <KeyboardAvoidingView
        className="flex-1"
        style={{ backgroundColor: '#f8fafc' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Form />
      </KeyboardAvoidingView>
    </View>
  );
};
