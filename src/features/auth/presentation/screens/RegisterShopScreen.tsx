import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { useAuthStore } from '@/features/auth/application/stores/authStore';
import { Text, TextInput } from '@/shared/tw/index';

interface RegisterShopScreenProps {
  onRegisterSuccess: () => void;
  onBack: () => void;
}

export const RegisterShopScreen: React.FC<RegisterShopScreenProps> = ({
  onRegisterSuccess, onBack,
}) => {
  const { register } = useAuthStore();
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 768;

  const handleRegister = async () => {
    if (!shopName.trim()) { setError('กรุณากรอกชื่อร้าน'); return; }
    if (!phone.trim()) { setError('กรุณากรอกเบอร์โทร'); return; }
    if (!password || password.length < 4) { setError('รหัสผ่านอย่างน้อย 4 ตัว'); return; }
    if (password !== confirmPw) { setError('รหัสผ่านไม่ตรงกัน'); return; }
    if (!agree) { setError('กรุณายอมรับข้อตกลง'); return; }
    setError('');
    setLoading(true);
    try {
      await register({ phone: phone.trim(), name: shopName.trim(), password, shopName: shopName.trim() });
      onRegisterSuccess();
    } catch (e: any) {
      setError(e?.message || 'สมัครไม่สำเร็จ');
    } finally { setLoading(false); }
  };

  const BrandPanel = () => (
    <View className="flex-1 items-center justify-center bg-slate-950 p-8">
      <View className="items-center">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-xl bg-rose-500">
          <Ionicons name="storefront-outline" size={28} color="#fafafa" />
        </View>
        <Text className="mb-2 text-xl font-bold text-white">POS Mobile</Text>
        <Text className="mb-4 text-center text-sm font-medium text-slate-300">
          ระบบขายหน้าร้านที่ใช้งานง่าย{'\n'}จัดการร้านของคุณได้ทุกที่
        </Text>
        <View className="flex-row gap-2">
          <View className="flex-row items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-1.5">
            <Ionicons name="cart-outline" size={12} color="#34d399" />
            <Text className="text-xs font-semibold text-emerald-400">ขายเร็ว</Text>
          </View>
          <View className="flex-row items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-1.5">
            <Ionicons name="receipt-outline" size={12} color="#fbbf24" />
            <Text className="text-xs font-semibold text-amber-400">ออกบิลง่าย</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const Form = () => (
    <ScrollView
      contentContainerClassName="grow justify-center p-8 max-w-[440px] self-center w-full"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {!isWide && (
        <View className="items-center mb-6">
          <View className="mb-2 h-12 w-12 items-center justify-center rounded-xl bg-rose-500">
            <Ionicons name="storefront-outline" size={22} color="#fafafa" />
          </View>
          <Text className="text-lg font-bold text-slate-950">POS Mobile</Text>
        </View>
      )}

      <Text className="mb-1 text-2xl font-extrabold text-slate-950">สร้างร้านค้าใหม่</Text>
      <Text className="mb-6 text-[15px] font-medium text-slate-500">กรอกข้อมูลเพื่อเริ่มใช้งาน POS Mobile</Text>

      <Text className="mb-1.5 mt-1 text-[13px] font-bold text-slate-950">ชื่อร้าน</Text>
      <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3 h-[46px] mb-3">
        <View className="mr-2"><Ionicons name="storefront-outline" size={16} color="#64748b" /></View>
        <TextInput className="flex-1 text-[15px] font-medium text-slate-950" placeholder="ชื่อร้านค้าของคุณ" placeholderTextColor="#94a3b8" value={shopName} onChangeText={(t) => { setShopName(t); setError(''); }} />
      </View>

      <Text className="mb-1.5 mt-1 text-[13px] font-bold text-slate-950">เบอร์โทรศัพท์</Text>
      <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3 h-[46px] mb-3">
        <View className="mr-2"><Ionicons name="call-outline" size={16} color="#64748b" /></View>
        <TextInput className="flex-1 text-[15px] font-medium text-slate-950" placeholder="08X-XXX-XXXX" placeholderTextColor="#94a3b8" value={phone} onChangeText={(t) => { setPhone(t); setError(''); }} keyboardType="phone-pad" />
      </View>

      <Text className="mb-1.5 mt-1 text-[13px] font-bold text-slate-950">อีเมล</Text>
      <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3 h-[46px] mb-3">
        <View className="mr-2"><Ionicons name="mail-outline" size={16} color="#64748b" /></View>
        <TextInput className="flex-1 text-[15px] font-medium text-slate-950" placeholder="name@example.com" placeholderTextColor="#94a3b8" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      </View>

      <Text className="mb-1.5 mt-1 text-[13px] font-bold text-slate-950">รหัสผ่าน</Text>
      <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3 h-[46px] mb-3">
        <View className="mr-2"><Ionicons name="lock-closed-outline" size={16} color="#64748b" /></View>
        <TextInput className="flex-1 text-[15px] font-medium text-slate-950" placeholder="********" placeholderTextColor="#94a3b8" secureTextEntry={!showPw} value={password} onChangeText={(t) => { setPassword(t); setError(''); }} />
        <TouchableOpacity onPress={() => setShowPw(!showPw)}>
          <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748b" />
        </TouchableOpacity>
      </View>

      <Text className="mb-1.5 mt-1 text-[13px] font-bold text-slate-950">ยืนยันรหัสผ่าน</Text>
      <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3 h-[46px] mb-3">
        <View className="mr-2"><Ionicons name="lock-closed-outline" size={16} color="#64748b" /></View>
        <TextInput className="flex-1 text-[15px] font-medium text-slate-950" placeholder="********" placeholderTextColor="#94a3b8" secureTextEntry={!showConfirm} value={confirmPw} onChangeText={(t) => { setConfirmPw(t); setError(''); }} />
        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
          <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748b" />
        </TouchableOpacity>
      </View>

      {error ? <Text className="mb-2 text-[13px] font-bold text-rose-600">{error}</Text> : null}

      <TouchableOpacity className="flex-row items-center gap-2 my-3" onPress={() => setAgree(!agree)}>
        <Ionicons name={agree ? 'checkbox' : 'square-outline'} size={20} color={agree ? '#f43f5e' : '#475569'} />
        <Text className="text-sm font-medium text-slate-600">ยอมรับข้อตกลงการใช้งาน</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mb-4 mt-1 h-[46px] items-center justify-center rounded-xl bg-rose-500 active:bg-rose-600 shadow-lg shadow-rose-500/40" onPress={handleRegister} activeOpacity={0.85}>
        <Text className="text-[15px] font-bold text-white">{loading ? 'กำลังสร้าง...' : 'สร้างร้านค้า'}</Text>
      </TouchableOpacity>

      <Text className="mt-2 text-center text-sm font-medium text-slate-500">
        มีร้านค้าอยู่แล้ว?{' '}
        <Text className="font-bold text-rose-600" onPress={onBack}>เข้าสู่ระบบ</Text>
      </Text>
    </ScrollView>
  );

  if (isWide) {
    return (
      <View className="flex-1 flex-row bg-rose-50">
        <BrandPanel />
        <View className="flex-[1.1] bg-rose-50"><Form /></View>
      </View>
    );
  }
  return <View className="flex-1 bg-rose-50"><Form /></View>;
};
