/**
 * WelcomeScreen
 * view: 'login' | 'register'
 */
import { APP_LOGO } from '@/shared/constants/logo';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { cn } from '@/shared/lib/cn';
import { useAuthStore } from '@/features/auth/application/stores/authStore';
import { useStoreConfigStore } from '@/features/settings/application/stores/storeConfigStore';
import { BusinessScale, BusinessType } from '@/features/settings/domain/store';

interface Props {
  onLogin: () => void;
  onRegister: () => void;
}

/** Demo hints */
const DEMO_HINTS = [
  { username: 'admin',   password: '1234', role: 'Owner',   roleColor: '#7c3aed', roleBg: '#ede9fe' },
  { username: 'manager', password: '1234', role: 'Manager', roleColor: '#2563eb', roleBg: '#eff6ff' },
  { username: 'cashier', password: '1234', role: 'Cashier', roleColor: '#16a34a', roleBg: '#f0fdf4' },
];

type ViewType = 'login' | 'register';

// ─── Register Screen ──────────────────────────────────────────────────────────
const RegisterView: React.FC<{ onRegister: () => void; onBack: () => void; onGoLogin: () => void }> = ({
  onRegister, onBack, onGoLogin,
}) => {
  const login            = useAuthStore(s => s.login);
  const registerUser     = useAuthStore(s => s.register);
  const setAuthShopName  = useAuthStore(s => s.setShopName);
  const { setBusinessType, setBusinessScale, setStoreType, setStoreName, setStoreAddress, setStorePhone, setStoreTaxId } = useStoreConfigStore();
  const [step, setStep]         = useState(1);
  const [phone, setPhone]       = useState('');
  const [otp, setOTP]           = useState('');
  const [shopName, setShopName] = useState('');
  const [shopAddr, setShopAddr] = useState('');
  const [taxId, setTaxId]       = useState('');
  const [pwd, setPwd]           = useState('');
  const [pwd2, setPwd2]         = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [bizType, setBizType]   = useState<BusinessType>('RETAIL');
  const [bizScale, setBizScale] = useState<BusinessScale>('BUSINESS');

  const pwdStrong = pwd.length >= 8;
  const pwdMatch  = pwd === pwd2;

  const Steps = ['กรอกเบอร์', 'ยืนยัน OTP', 'ข้อมูลร้าน'];

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (phone.trim().length < 9) { setError('กรุณากรอกเบอร์โทรให้ถูกต้อง'); return; }
      setLoading(true);
      setTimeout(() => { setLoading(false); setStep(2); }, 600);
    } else if (step === 2) {
      if (otp.trim() !== '123456') { setError('รหัส OTP ไม่ถูกต้อง (Demo: 123456)'); return; }
      setStep(3);
    } else {
      if (!shopName.trim()) { setError('กรุณากรอกชื่อร้านค้า'); return; }
      if (!pwdStrong)        { setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
      if (!pwdMatch)         { setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน'); return; }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setBusinessType(bizType);
        setBusinessScale(bizScale);
        setStoreType(bizScale === 'ENTERPRISE' ? 'ENTERPRISE' : bizType);
        setStoreName(shopName.trim() || 'ร้านค้าใหม่');
        setStoreAddress(shopAddr.trim());
        setStorePhone(phone.trim());
        setStoreTaxId(taxId.trim());
        registerUser({
          phone: phone.trim(),
          name: 'เจ้าของร้าน',
          password: pwd,
          shopName: shopName.trim() || 'ร้านค้าใหม่',
        });
        setAuthShopName(shopName.trim() || 'ร้านค้าใหม่');
        onRegister();
      }, 800);
    }
  };

  return (
    <View className={cn('flex-1 bg-rose-50 relative')}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 5 }}
        showsVerticalScrollIndicator={false}>
        <Image source={APP_LOGO} className={cn('w-[140px] h-[140px] mb-4')} resizeMode="contain" />

        <View className={cn('bg-white rounded-2xl p-8 w-full max-w-[520px] gap-3.5 shadow-lg shadow-rose-500/40')}>
          <TouchableOpacity className={cn('flex-row items-center gap-1.5 self-start')} onPress={onBack}>
            <Ionicons name="arrow-back" size={16} color="#71717a" />
            <Text className={cn('text-sm font-medium text-slate-500')}>กลับ</Text>
          </TouchableOpacity>

          <View className={cn('w-14 h-14 rounded-2xl bg-rose-100 items-center justify-center self-center')}>
            <Ionicons name="storefront" size={28} color="#ef4444" />
          </View>
          <Text className={cn('text-lg font-extrabold text-slate-800 text-center')}>สมัครร้านค้าใหม่</Text>

          {/* Step indicator */}
          <View className={cn('flex-row items-center justify-center')}>
            {Steps.map((lbl, i) => (
              <React.Fragment key={i}>
                <View className={cn('items-center gap-1')}>
                  <View className={cn('w-7 h-7 rounded-full items-center justify-center border-2',
                    step > i + 1 ? 'bg-emerald-500 border-emerald-500' :
                    step === i + 1 ? 'bg-rose-500 border-rose-500' : 'bg-slate-100 border-slate-200')}>
                    {step > i + 1
                      ? <Ionicons name="checkmark" size={12} color="#fafafa" />
                      : <Text className={cn('text-sm font-bold', step === i + 1 ? 'text-white' : 'text-slate-500')}>{i + 1}</Text>
                    }
                  </View>
                  <Text className={cn('text-xs font-medium text-slate-500 max-w-[60px] text-center',
                    step === i + 1 && 'text-rose-500 font-bold')}>{lbl}</Text>
                </View>
                {i < 2 && <View className={cn('w-8 h-0.5 mb-5 mx-1', step > i + 1 ? 'bg-rose-500' : 'bg-slate-200')} />}
              </React.Fragment>
            ))}
          </View>

          {/* Step 1: Phone */}
          {step === 1 && (
            <>
              <Text className={cn('text-sm font-bold text-slate-800')}>เบอร์โทรศัพท์ *</Text>
              <View className={cn('flex-row items-center gap-2.5 border-[1.5] border-slate-200 rounded-xl px-3.5 h-12 bg-white')}>
                <Ionicons name="call-outline" size={16} color="#71717a" />
                <TextInput
                  className={cn('flex-1 text-sm font-medium text-slate-800')} value={phone} onChangeText={setPhone}
                  placeholder="0812345678" placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad" maxLength={10}
                />
              </View>
              <Text className={cn('text-sm font-medium text-slate-500')}>ระบบจะส่งรหัส OTP ไปยังเบอร์นี้</Text>
            </>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <>
              <Text className={cn('text-sm font-bold text-slate-800')}>รหัส OTP 6 หลัก</Text>
              <Text className={cn('text-sm font-medium text-slate-500')}>ส่งรหัสไปที่ {phone}</Text>
              <View className={cn('flex-row gap-2 justify-center')}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <View key={i} className={cn('w-11 h-13 rounded-xl border-2 border-slate-200 items-center justify-center bg-white',
                    otp.length > i && 'border-rose-500 bg-rose-50')}>
                    <Text className={cn('text-sm font-bold text-rose-500')}>{otp[i] ? '●' : ''}</Text>
                  </View>
                ))}
              </View>
              <View className={cn('flex-row items-center gap-2.5 border-[1.5] border-slate-200 rounded-xl px-3.5 h-12 bg-white')}>
                <Ionicons name="key-outline" size={16} color="#71717a" />
                <TextInput
                  className={cn('flex-1 text-sm font-medium text-slate-800')} value={otp} onChangeText={setOTP}
                  placeholder="กรอก OTP 6 หลัก" placeholderTextColor="#9ca3af"
                  keyboardType="number-pad" maxLength={6}
                />
              </View>
              <Text className={cn('text-sm font-medium text-slate-500')}>Demo OTP: <Text className={cn('font-extrabold text-rose-500')}>123456</Text></Text>
            </>
          )}

          {/* Step 3: Shop info */}
          {step === 3 && (
            <>
              <Text className={cn('text-xs font-extrabold text-rose-500 border-t border-slate-200 pt-3 mt-1')}>ประเภทธุรกิจ</Text>
              <View className={cn('flex-row gap-2 mb-3')}>
                {([
                  { t: 'SERVICE' as BusinessType, icon: 'cut-outline', label: 'ร้านบริการ' },
                  { t: 'RETAIL' as BusinessType, icon: 'storefront-outline', label: 'ร้านค้าปลีก' },
                ] as const).map(item => (
                  <TouchableOpacity key={item.t} onPress={() => setBizType(item.t)}
                    className={cn('flex-1 flex-row items-center gap-2 p-3 rounded-xl border-[1.5]')}
                    style={{
                      borderColor: bizType === item.t ? '#f43f5e' : '#e5e5e5',
                      backgroundColor: bizType === item.t ? '#fef2f2' : '#fafafa',
                    }}>
                    <Ionicons name={item.icon as any} size={18} color={bizType === item.t ? '#f43f5e' : '#71717a'} />
                    <Text className={cn('text-sm font-bold')} style={{ color: bizType === item.t ? '#f43f5e' : '#1f2937' }}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text className={cn('text-xs font-extrabold text-rose-500 border-t border-slate-200 pt-3 mt-1')}>ขนาดธุรกิจ</Text>
              <View className={cn('flex-row gap-2 mb-4')}>
                {([
                  { s: 'BUSINESS' as BusinessScale, icon: 'home-outline', label: 'Business (ร้านเดียว)' },
                  { s: 'ENTERPRISE' as BusinessScale, icon: 'business-outline', label: 'Enterprise (หลายสาขา)' },
                ] as const).map(item => (
                  <TouchableOpacity key={item.s} onPress={() => setBizScale(item.s)}
                    className={cn('flex-1 flex-row items-center gap-2 p-3 rounded-xl border-[1.5]')}
                    style={{
                      borderColor: bizScale === item.s ? '#f43f5e' : '#e5e5e5',
                      backgroundColor: bizScale === item.s ? '#fef2f2' : '#fafafa',
                    }}>
                    <Ionicons name={item.icon as any} size={18} color={bizScale === item.s ? '#f43f5e' : '#71717a'} />
                    <Text className={cn('text-sm font-bold')} style={{ color: bizScale === item.s ? '#f43f5e' : '#1f2937' }}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className={cn('text-xs font-extrabold text-rose-500 border-t border-slate-200 pt-3 mt-1')}>ข้อมูลร้านค้า</Text>
              <Text className={cn('text-sm font-bold text-slate-800')}>ชื่อร้านค้า *</Text>
              <View className={cn('flex-row items-center gap-2.5 border-[1.5] border-slate-200 rounded-xl px-3.5 h-12 bg-white')}>
                <Ionicons name="storefront-outline" size={16} color="#71717a" />
                <TextInput className={cn('flex-1 text-sm font-medium text-slate-800')} value={shopName} onChangeText={setShopName}
                  placeholder="เช่น ร้านสะดวกซื้อ ABC" placeholderTextColor="#9ca3af" />
              </View>

              <Text className={cn('text-sm font-bold text-slate-800')}>ที่อยู่ร้าน</Text>
              <View className={cn('flex-row items-start gap-2.5 border-[1.5] border-slate-200 rounded-xl px-3.5 pt-2.5 bg-white')} style={{ height: 72 }}>
                <Ionicons name="location-outline" size={16} color="#71717a" style={{ marginTop: 2 }} />
                <TextInput className={cn('flex-1 text-sm font-medium text-slate-800')} value={shopAddr} onChangeText={setShopAddr}
                  placeholder="เลขที่ ถนน ตำบล อำเภอ จังหวัด" placeholderTextColor="#9ca3af" multiline />
              </View>

              <Text className={cn('text-sm font-bold text-slate-800')}>เลขประจำตัวผู้เสียภาษี</Text>
              <View className={cn('flex-row items-center gap-2.5 border-[1.5] border-slate-200 rounded-xl px-3.5 h-12 bg-white')}>
                <Ionicons name="card-outline" size={16} color="#71717a" />
                <TextInput className={cn('flex-1 text-sm font-medium text-slate-800')} value={taxId} onChangeText={setTaxId}
                  placeholder="13 หลัก (ถ้ามี)" placeholderTextColor="#9ca3af" keyboardType="number-pad" maxLength={13} />
              </View>

              <Text className={cn('text-xs font-extrabold text-rose-500 border-t border-slate-200 pt-3 mt-1')}>รหัสผ่าน Owner</Text>
              <Text className={cn('text-sm font-bold text-slate-800')}>รหัสผ่าน *</Text>
              <View className={cn('flex-row items-center gap-2.5 border-[1.5] rounded-xl px-3.5 h-12 bg-white',
                !pwdStrong && pwd.length > 0 ? 'border-red-500' : 'border-slate-200')}>
                <Ionicons name="lock-closed-outline" size={16} color="#71717a" />
                <TextInput className={cn('flex-1 text-sm font-medium text-slate-800')} value={pwd} onChangeText={setPwd}
                  placeholder="อย่างน้อย 8 ตัวอักษร" placeholderTextColor="#9ca3af" secureTextEntry={!showPwd} />
                <TouchableOpacity onPress={() => setShowPwd(!showPwd)}>
                  <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={16} color="#71717a" />
                </TouchableOpacity>
              </View>
              <View className={cn('flex-row flex-wrap gap-2')}>
                {[
                  { ok: pwd.length >= 8,         label: 'อย่างน้อย 8 ตัวอักษร' },
                  { ok: /[A-Z]/.test(pwd),       label: 'มีตัวพิมพ์ใหญ่' },
                  { ok: /[0-9]/.test(pwd),       label: 'มีตัวเลข' },
                ].map((r, i) => (
                  <View key={i} className={cn('flex-row items-center gap-1')}>
                    <Ionicons name={r.ok ? 'checkmark-circle' : 'ellipse-outline'} size={13} color={r.ok ? '#16a34a' : '#9ca3af'} />
                    <Text className={cn('text-sm font-medium', r.ok ? 'text-emerald-600' : 'text-slate-400')}>{r.label}</Text>
                  </View>
                ))}
              </View>

              <Text className={cn('text-sm font-bold text-slate-800')}>ยืนยันรหัสผ่าน *</Text>
              <View className={cn('flex-row items-center gap-2.5 border-[1.5] rounded-xl px-3.5 h-12 bg-white',
                !pwdMatch && pwd2.length > 0 ? 'border-red-500' : 'border-slate-200')}>
                <Ionicons name="lock-closed-outline" size={16} color="#71717a" />
                <TextInput className={cn('flex-1 text-sm font-medium text-slate-800')} value={pwd2} onChangeText={setPwd2}
                  placeholder="กรอกรหัสผ่านอีกครั้ง" placeholderTextColor="#9ca3af" secureTextEntry={!showPwd} />
              </View>
              {pwd2.length > 0 && !pwdMatch && (
                <Text className={cn('text-sm font-medium text-red-500')}>รหัสผ่านไม่ตรงกัน</Text>
              )}

              <View className={cn('bg-rose-50 rounded-2xl p-3.5 gap-2')}>
                <Text className={cn('text-sm font-extrabold text-rose-500')}>สรุปข้อมูล</Text>
                <View className={cn('flex-row justify-between')}>
                  <Text className={cn('text-sm font-medium text-slate-500')}>เบอร์โทร</Text>
                  <Text className={cn('text-sm font-bold text-slate-800')}>{phone}</Text>
                </View>
                <View className={cn('flex-row justify-between')}>
                  <Text className={cn('text-sm font-medium text-slate-500')}>ชื่อร้าน</Text>
                  <Text className={cn('text-sm font-bold text-slate-800')}>{shopName || '—'}</Text>
                </View>
                {taxId ? (
                  <View className={cn('flex-row justify-between')}>
                    <Text className={cn('text-sm font-medium text-slate-500')}>Tax ID</Text>
                    <Text className={cn('text-sm font-bold text-slate-800')}>{taxId}</Text>
                  </View>
                ) : null}
              </View>
            </>
          )}

          {/* Error */}
          {error !== '' && (
            <View className={cn('flex-row items-center gap-2 bg-red-50 rounded-xl p-2.5')}>
              <Ionicons name="warning-outline" size={13} color="#dc2626" />
              <Text className={cn('text-sm font-medium text-red-500 flex-1')}>{error}</Text>
            </View>
          )}

          {/* Next / Submit button */}
          <TouchableOpacity
            className={cn('flex-row items-center justify-center gap-2 bg-rose-500 rounded-2xl h-13 shadow-sm', loading && 'opacity-50')}
            onPress={handleNext} disabled={loading}>
            {loading
              ? <ActivityIndicator size="small" color="#fafafa" />
              : <Text className={cn('text-sm font-extrabold text-white')}>
                  {step === 1 ? 'ส่งรหัส OTP' : step === 2 ? 'ยืนยัน OTP' : 'สร้างร้านค้า'}
                </Text>
            }
          </TouchableOpacity>

          {/* Switch to login */}
          <View className={cn('flex-row items-center justify-center gap-1.5')}>
            <Text className={cn('text-sm font-medium text-slate-500')}>มีบัญชีอยู่แล้ว?</Text>
            <TouchableOpacity onPress={onGoLogin}>
              <Text className={cn('text-sm font-bold text-rose-500')}>เข้าสู่ระบบ →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status */}
        <View className={cn('flex-row items-center justify-center gap-2 mt-4')}>
          <View className={cn('w-2.5 h-2.5 rounded-full bg-emerald-500')} />
          <Text className={cn('text-sm font-medium text-slate-500')}>ออนไลน์ • เวอร์ชัน 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Main Welcome ─────────────────────────────────────────────────────────────
export const WelcomeScreen: React.FC<Props> = ({ onLogin, onRegister }) => {
  const [view, setView] = useState<ViewType>('login');

  const login = useAuthStore(s => s.login);
  const [cred, setCred]       = useState('');
  const [pass, setPass]       = useState('');
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const submit = () => {
    if (!cred.trim() || !pass.trim()) { setError('กรุณากรอกข้อมูลให้ครบ'); return; }
    setError(''); setLoading(true);
    setTimeout(() => {
      const ok = login(cred.trim(), pass);
      setLoading(false);
      if (ok) onLogin();
      else setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }, 500);
  };

  if (view === 'register') {
    return <RegisterView onRegister={onRegister} onBack={() => setView('login')} onGoLogin={() => setView('login')} />;
  }

  // Default: Login form
  return (
    <View className={cn('flex-1 bg-rose-50 relative')}>
      {/* Header bar */}
      <View className={cn('absolute top-0 left-0 right-0 z-10 flex-row justify-end items-center gap-3 px-10 pt-6')}>
        <View className={cn('w-[46px] h-[46px] rounded-full bg-white items-center justify-center shadow-sm relative')}>
          <Ionicons name="notifications-outline" size={20} color="#1f2937" />
          <View className={cn('absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-rose-500 items-center justify-center')}>
            <Text className={cn('text-sm font-extrabold text-white')}>3</Text>
          </View>
        </View>
        <View className={cn('h-[46px] rounded-full bg-white px-4 flex-row items-center gap-2 shadow-sm')}>
          <Ionicons name="person-circle-outline" size={22} color="#1f2937" />
          <Text className={cn('text-sm font-medium text-slate-800')}>Admin</Text>
          <Ionicons name="chevron-down" size={13} color="#71717a" />
        </View>
      </View>

      {/* Center content */}
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 5 }}
        showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <Image source={APP_LOGO} className={cn('w-[140px] h-[140px] mb-4')} resizeMode="contain" />

        {/* Login Card */}
        <View className={cn('bg-white rounded-2xl p-8 w-full max-w-[520px] gap-3.5 shadow-lg shadow-rose-500/40')}>
          {/* Icon */}
          <View className={cn('w-14 h-14 rounded-2xl bg-rose-100 items-center justify-center self-center')}>
            <Ionicons name="storefront" size={28} color="#ef4444" />
          </View>

          {/* Title */}
          <Text className={cn('text-lg font-extrabold text-slate-800 text-center')}>เข้าสู่ระบบ</Text>
          <Text className={cn('text-sm font-medium text-slate-500 text-center -mt-2')}>กรอกข้อมูลเพื่อเข้าสู่ระบบ POS Mobile</Text>

          {/* Username */}
          <Text className={cn('text-sm font-bold text-slate-800')}>ชื่อผู้ใช้</Text>
          <View className={cn('flex-row items-center gap-2.5 border-[1.5] rounded-xl px-3.5 h-12 bg-white',
            !!error ? 'border-red-500' : 'border-slate-200')}>
            <Ionicons name="person-outline" size={16} color="#71717a" />
            <TextInput
              className={cn('flex-1 text-sm font-medium text-slate-800')} value={cred} onChangeText={setCred}
              placeholder="เช่น admin, manager, cashier" placeholderTextColor="#9ca3af"
              autoCapitalize="none" onSubmitEditing={submit}
            />
          </View>

          {/* Password */}
          <Text className={cn('text-sm font-bold text-slate-800')}>รหัสผ่าน</Text>
          <View className={cn('flex-row items-center gap-2.5 border-[1.5] rounded-xl px-3.5 h-12 bg-white',
            !!error ? 'border-red-500' : 'border-slate-200')}>
            <Ionicons name="lock-closed-outline" size={16} color="#71717a" />
            <TextInput
              className={cn('flex-1 text-sm font-medium text-slate-800')} value={pass} onChangeText={setPass}
              placeholder="รหัสผ่าน" placeholderTextColor="#9ca3af"
              secureTextEntry={!show} onSubmitEditing={submit}
            />
            <TouchableOpacity onPress={() => setShow(!show)}>
              <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={16} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error !== '' && (
            <View className={cn('flex-row items-center gap-2 bg-red-50 rounded-xl p-2.5')}>
              <Ionicons name="warning-outline" size={13} color="#dc2626" />
              <Text className={cn('text-sm font-medium text-red-500 flex-1')}>{error}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            className={cn('flex-row items-center justify-center gap-2 bg-rose-500 rounded-2xl h-13 shadow-sm', loading && 'opacity-50')}
            onPress={submit} disabled={loading}>
            {loading
              ? <ActivityIndicator size="small" color="#fafafa" />
              : <Text className={cn('text-sm font-extrabold text-white')}>เข้าสู่ระบบ</Text>}
          </TouchableOpacity>

          {/* Demo accounts */}
          <View className={cn('bg-rose-50 rounded-2xl p-3.5 gap-1.5 border border-rose-200')}>
            <Text className={cn('text-sm font-bold text-rose-700')}>บัญชี Demo (กดเพื่อเติมอัตโนมัติ)</Text>
            {DEMO_HINTS.map(u => (
              <TouchableOpacity
                key={u.username} className={cn('flex-row justify-between items-center py-1.5 border-b border-rose-100')}
                onPress={() => { setCred(u.username); setPass(u.password); setError(''); }}
              >
                <Text className={cn('text-sm font-bold text-rose-500')}>{u.username}</Text>
                <View className={cn('rounded-xl px-2 py-0.5')} style={{ backgroundColor: u.roleBg }}>
                  <Text className={cn('text-sm font-extrabold')} style={{ color: u.roleColor }}>{u.role}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <Text className={cn('text-sm font-medium text-rose-700 mt-1')}>รหัสผ่านทุก account: <Text className={cn('font-extrabold')}>1234</Text></Text>
          </View>

          {/* Switch to register */}
          <View className={cn('flex-row items-center justify-center gap-1.5')}>
            <Text className={cn('text-sm font-medium text-slate-500')}>ยังไม่มีบัญชี?</Text>
            <TouchableOpacity onPress={() => setView('register')}>
              <Text className={cn('text-sm font-bold text-rose-500')}>สมัครร้านค้า →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status */}
        <View className={cn('flex-row items-center justify-center gap-2 mt-4')}>
          <View className={cn('w-2.5 h-2.5 rounded-full bg-emerald-500')} />
          <Text className={cn('text-sm font-medium text-slate-500')}>ออนไลน์ • เวอร์ชัน 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};
