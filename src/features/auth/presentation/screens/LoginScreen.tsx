import { APP_LOGO } from '@/shared/constants/logo';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useStoreConfigStore } from '@/features/settings/application/stores/storeConfigStore';
import { Text, TextInput } from '@/shared/tw/index';

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

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onForgotPassword,
  onOTPLogin,
  onRegister,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;
  const shopLogo = useStoreConfigStore((state) => state.shopLogo);
  const logoSource = shopLogo ? { uri: shopLogo } : APP_LOGO;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onLogin?.(email.trim(), password);
    } catch (e: any) {
      setError(e?.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (credential: string, demoPassword: string) => {
    setEmail(credential);
    setPassword(demoPassword);
    setError('');
  };

  const BrandPanel = () => (
    <View
      className="flex-1 justify-center px-12 py-12"
      style={{ backgroundColor: '#1a1a2e' }}
    >
      <View className="max-w-lg gap-8 self-center">
        <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
          <Image source={logoSource} className="h-12 w-12" resizeMode="contain" style={{ width: 48, height: 48 }} />
        </View>

        <View className="gap-3">
          <Text className="text-4xl font-extrabold text-white">
            Xcellence POS
          </Text>
          <Text className="text-base font-medium text-slate-400">
            ระบบจัดการร้านค้าครบวงจร สำหรับทีมขาย แคชเชียร์ คลังสินค้า และผู้จัดการ
          </Text>
        </View>

        <View className="gap-3">
          {[
            { icon: 'flash-outline', title: 'ขายเร็ว คิดเงินไว', sub: 'ระบบ POS ใช้งานง่าย รองรับบาร์โค้ด', color: '#fb7185' },
            { icon: 'archive-outline', title: 'สต๊อกแม่นยำ', sub: 'รับ เบิก โอน นับสินค้าแบบ realtime', color: '#f97316' },
            { icon: 'people-outline', title: 'CRM ครบจบ', sub: 'สมาชิก คะแนน คูปอง และแคมเปญ', color: '#a78bfa' },
            { icon: 'wifi-outline', title: 'Offline-first', sub: 'ทำงานได้แม้ไม่มีเน็ต ซิงค์อัตโนมัติ', color: '#22d3ee' },
          ].map((item) => (
            <View
              key={item.title}
              className="flex-row items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <View
                className="h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: item.color + '20' }}
              >
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-white">{item.title}</Text>
                <Text className="text-xs font-medium text-slate-400">{item.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text className="mt-6 text-xs font-medium text-slate-600">© 2026 Xcellence Corporation</Text>
      </View>
    </View>
  );

  const Form = () => (
    <ScrollView
      contentContainerClassName="grow justify-center px-6 py-10 sm:px-10 lg:px-14"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className="w-full max-w-md self-center">
        <View className="mb-8 items-center lg:hidden">
          <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-rose-100 bg-rose-50">
            <Image source={logoSource} className="h-14 w-14" resizeMode="contain" style={{ width: 56, height: 56 }} />
          </View>
        </View>

        <View className="mb-8 gap-2">
          <Text className="text-3xl font-extrabold text-slate-900">เข้าสู่ระบบ</Text>
          <Text className="text-base font-medium text-slate-500">
            เข้าสู่ระบบด้วยบัญชีร้านค้าของคุณ
          </Text>
        </View>

        <View className="gap-5">
          <View className="gap-2">
            <Text className="text-sm font-bold text-slate-700">ชื่อผู้ใช้</Text>
            <View className="h-12 flex-row items-center rounded-xl border border-slate-200 bg-white px-4">
              <Ionicons name="person-outline" size={18} color="#94a3b8" />
              <TextInput
                className="ml-3 flex-1 text-base font-medium text-slate-900"
                placeholder="admin, manager, cashier"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={(text) => { setEmail(text); setError(''); }}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-bold text-slate-700">รหัสผ่าน</Text>
            <View className="h-12 flex-row items-center rounded-xl border border-slate-200 bg-white px-4">
              <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
              <TextInput
                className="ml-3 flex-1 text-base font-medium text-slate-900"
                placeholder="รหัสผ่าน"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPw}
                value={password}
                onChangeText={(text) => { setPassword(text); setError(''); }}
              />
              <TouchableOpacity className="p-1" onPress={() => setShowPw(!showPw)}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              className="flex-row items-center gap-2"
              onPress={() => setRemember(!remember)}
            >
              <View
                className="h-5 w-5 items-center justify-center rounded-md border"
                style={{
                  backgroundColor: remember ? '#f43f5e' : '#fff',
                  borderColor: remember ? '#f43f5e' : '#e2e8f0',
                }}
              >
                {remember && <Ionicons name="checkmark" size={13} color="#fff" />}
              </View>
              <Text className="text-sm font-medium text-slate-600">จำบัญชีนี้</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onForgotPassword}>
              <Text className="text-sm font-bold text-rose-500">ลืมรหัสผ่าน?</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View className="flex-row items-center gap-2 rounded-xl bg-rose-50 px-4 py-3">
              <Ionicons name="alert-circle" size={18} color="#e11d48" />
              <Text className="flex-1 text-sm font-bold text-rose-700">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            className="h-12 items-center justify-center rounded-xl bg-rose-500 active:bg-rose-600 shadow-lg shadow-rose-500/40"
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
            style={loading ? { opacity: 0.7 } : undefined}
          >
            <Text className="text-base font-bold text-white">
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="h-12 items-center justify-center rounded-xl border border-slate-200 bg-white active:bg-[#f6f7fb]"
            onPress={onOTPLogin}
            activeOpacity={0.85}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="phone-portrait-outline" size={18} color="#64748b" />
              <Text className="text-sm font-bold text-slate-700">เข้าสู่ระบบด้วย OTP</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="mt-8 rounded-2xl border border-slate-100 bg-[#f6f7fb] p-4 shadow-sm">
          <View className="flex-row items-center gap-2">
            <View className="h-6 w-6 items-center justify-center rounded-md bg-rose-100">
              <Ionicons name="flask-outline" size={14} color="#e11d48" />
            </View>
            <Text className="text-sm font-bold text-slate-800">บัญชี Demo</Text>
          </View>
          <Text className="mt-1 text-xs font-medium text-slate-500">
            กดเลือกเพื่อเติมข้อมูลอัตโนมัติ · รหัสผ่าน 1234
          </Text>
          <View className="mt-3 gap-2">
            {demoAccounts.map((account) => (
              <TouchableOpacity
                key={account.cred}
                className="flex-row items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 active:bg-rose-50"
                onPress={() => fillDemoAccount(account.cred, account.pass)}
                activeOpacity={0.8}
              >
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
                  <Ionicons name={account.icon as any} size={16} color="#f43f5e" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900">{account.label}</Text>
                  <Text className="text-xs font-medium text-slate-500">{account.role}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

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

  return (
    <View className={`flex-1 bg-white ${isWide ? 'flex-row' : ''}`}>
      {isWide && <BrandPanel />}
      <KeyboardAvoidingView
        className="flex-1 bg-[#f6f7fb]"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Form />
      </KeyboardAvoidingView>
    </View>
  );
};
