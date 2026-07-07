import React, { useState, useRef } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { AuthLayout } from '@/features/auth/presentation/screens/AuthLayout';
import { cn } from '@/shared/lib/cn';
import { Text, TextInput } from '@/shared/tw/index';

interface ForgotPasswordScreenProps {
  onResetSuccess: () => void;
  onBack: () => void;
}

type Step = 'phone' | 'otp' | 'new-password' | 'success';

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onResetSuccess, onBack,
}) => {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<React.ElementRef<typeof TextInput>[]>([]);

  const handleSendOTP = async () => {
    if (!phone.trim() || phone.trim().length < 9) { setError('กรุณากรอกเบอร์โทรให้ถูกต้อง'); return; }
    setError('');
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('otp'); setCountdown(60); }, 1000);
  };

  const handleVerifyOTP = () => {
    const code = otp.join('');
    if (code.length < 6) { setError('กรุณากรอก OTP 6 หลัก'); return; }
    setError('');
    setStep('new-password');
  };

  const handleReset = () => {
    if (!newPassword || newPassword.length < 4) { setError('รหัสผ่านต้องมีอย่างน้อย 4 ตัว'); return; }
    if (newPassword !== confirmPassword) { setError('รหัสผ่านไม่ตรงกัน'); return; }
    setError('');
    setStep('success');
  };

  const handleOTPChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const titles: Record<Step, { title: string; subtitle: string }> = {
    phone: { title: 'ลืมรหัสผ่าน', subtitle: 'กรอกเบอร์โทรเพื่อรับ OTP สำหรับรีเซ็ต' },
    otp: { title: 'ยืนยัน OTP', subtitle: `ส่งรหัส 6 หลักไปยัง ${phone}` },
    'new-password': { title: 'ตั้งรหัสผ่านใหม่', subtitle: 'กรอกรหัสผ่านใหม่ที่ต้องการ' },
    success: { title: 'สำเร็จ!', subtitle: 'รีเซ็ตรหัสผ่านเรียบร้อยแล้ว' },
  };

  return (
    <AuthLayout title={titles[step].title} subtitle={titles[step].subtitle}>
      {step === 'phone' && (
        <>
          <Input
            label="เบอร์โทรศัพท์"
            placeholder="เช่น 0812345678"
            value={phone}
            onChangeText={(t) => { setPhone(t); setError(''); }}
            leftIcon="call-outline"
            keyboardType="phone-pad"
            maxLength={10}
            error={error}
          />
          <Button title="ส่งรหัส OTP" onPress={handleSendOTP} loading={loading} fullWidth size="lg" style={{ marginTop: 16 }} />
        </>
      )}

      {step === 'otp' && (
        <>
          <View className="flex-row justify-between gap-2 mb-3">
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { if (ref) inputRefs.current[i] = ref; }}
                className={cn('flex-1 h-[52px] border-2 border-slate-200 rounded-xl text-center text-[22px] font-bold text-slate-950 bg-[#f6f7fb]', digit && 'border-rose-500 bg-rose-50')}
                value={digit}
                onChangeText={(v) => handleOTPChange(v.replace(/\D/g, '').slice(-1), i)}
                keyboardType="number-pad"
                maxLength={1}
              />
            ))}
          </View>
          {error ? <Text className="text-xs font-medium text-rose-600 text-center mb-2">{error}</Text> : null}
          <Button title="ยืนยัน" onPress={handleVerifyOTP} fullWidth size="lg" />
        </>
      )}

      {step === 'new-password' && (
        <>
          <Input label="รหัสผ่านใหม่" placeholder="อย่างน้อย 4 ตัว" value={newPassword} onChangeText={setNewPassword} isPassword leftIcon="lock-closed-outline" />
          <Input label="ยืนยันรหัสผ่าน" placeholder="กรอกอีกครั้ง" value={confirmPassword} onChangeText={setConfirmPassword} isPassword leftIcon="lock-closed-outline" error={error} />
          <Button title="ตั้งรหัสผ่านใหม่" onPress={handleReset} fullWidth size="lg" style={{ marginTop: 16 }} />
        </>
      )}

      {step === 'success' && (
        <View className="items-center gap-3 py-5">
          <Ionicons name="checkmark-circle" size={56} color="#0f766e" />
          <Text className="text-lg font-bold text-emerald-600">เปลี่ยนรหัสผ่านสำเร็จ</Text>
          <Button title="กลับหน้า Login" onPress={onResetSuccess} fullWidth size="lg" style={{ marginTop: 16 }} />
        </View>
      )}

      {step !== 'success' && (
        <TouchableOpacity className="flex-row items-center justify-center gap-1 mt-5">
          <Ionicons name="arrow-back-outline" size={16} color="#57534e" />
          <Text className="text-base font-medium text-slate-500" onPress={onBack}>กลับหน้า Login</Text>
        </TouchableOpacity>
      )}
    </AuthLayout>
  );
};
