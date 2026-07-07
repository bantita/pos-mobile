import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { AuthLayout } from '@/features/auth/presentation/screens/AuthLayout';
import { cn } from '@/shared/lib/cn';
import { Text, TextInput } from '@/shared/tw/index';

interface OTPLoginScreenProps {
  onVerifyOTP: (phone: string, otp: string) => Promise<void>;
  onRequestOTP: (phone: string) => Promise<void>;
  onBack: () => void;
}

type Step = 'phone' | 'otp';

export const OTPLoginScreen: React.FC<OTPLoginScreenProps> = ({
  onVerifyOTP, onRequestOTP, onBack,
}) => {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<React.ElementRef<typeof TextInput>[]>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRequestOTP = async () => {
    if (!phone.trim() || phone.trim().length < 9) {
      setError('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onRequestOTP(phone.trim());
      setStep('otp');
      setCountdown(60);
    } catch (e: any) {
      setError(e?.message || 'ไม่สามารถส่ง OTP ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d !== '')) handleVerify(newOtp.join(''));
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp.join('');
    if (otpCode.length < 6) { setError('กรุณากรอกรหัส OTP 6 หลัก'); return; }
    setError('');
    setLoading(true);
    try {
      await onVerifyOTP(phone.trim(), otpCode);
    } catch (e: any) {
      setError(e?.message || 'รหัส OTP ไม่ถูกต้อง');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={step === 'phone' ? 'เข้าสู่ระบบด้วย OTP' : 'ยืนยันรหัส OTP'}
      subtitle={step === 'phone' ? 'ระบบจะส่งรหัส OTP ไปยังเบอร์โทรที่กรอก' : `ส่งรหัส 6 หลักไปยัง ${phone}`}
    >
      <View className="flex-row items-center justify-center mb-5 gap-1">
        {['กรอกเบอร์', 'ยืนยัน OTP'].map((label, i) => (
          <React.Fragment key={i}>
            <View className="items-center gap-1">
              <View className={cn('w-7 h-7 rounded-full bg-gray-200 items-center justify-center', (step === 'otp' ? i <= 1 : i === 0) && 'bg-rose-500')}>
                <Text className={cn('text-xs font-bold text-gray-400', (step === 'otp' ? i <= 1 : i === 0) && 'text-white')}>{i + 1}</Text>
              </View>
              <Text className="text-xs font-medium text-slate-500">{label}</Text>
            </View>
            {i < 1 && <View className={cn('w-10 h-[2px] bg-gray-200 mb-4', step === 'otp' && 'bg-rose-500')} />}
          </React.Fragment>
        ))}
      </View>

      {step === 'phone' ? (
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
          <Button title="ส่งรหัส OTP" onPress={handleRequestOTP} loading={loading} fullWidth size="lg" style={{ marginTop: 12 }} />
        </>
      ) : (
        <>
          <View className="flex-row justify-between gap-2 mb-3">
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { if (ref) inputRefs.current[i] = ref; }}
                className={cn('flex-1 h-[52px] border-2 border-slate-200 rounded-xl text-center text-[22px] font-bold text-slate-950 bg-[#f6f7fb]', digit && 'border-rose-500 bg-rose-50', error && 'border-rose-500')}
                value={digit}
                onChangeText={(v) => handleOTPChange(v.replace(/\D/g, '').slice(-1), i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                textContentType="oneTimeCode"
              />
            ))}
          </View>
          {error ? <Text className="text-xs font-medium text-rose-600 text-center mb-2">{error}</Text> : null}
          <Button title="ยืนยัน OTP" onPress={() => handleVerify()} loading={loading} fullWidth size="lg" />
          <View className="flex-row justify-center mt-4">
            <Text className="text-base font-medium text-slate-500">ไม่ได้รับรหัส? </Text>
            {countdown > 0 ? (
              <Text className="text-base font-medium text-gray-400">ส่งอีกครั้งใน {countdown}s</Text>
            ) : (
              <TouchableOpacity onPress={handleRequestOTP}>
                <Text className="text-base font-bold text-rose-600">ส่งอีกครั้ง</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      <TouchableOpacity className="flex-row items-center justify-center gap-1 mt-5" onPress={step === 'otp' ? () => setStep('phone') : onBack}>
        <Ionicons name="arrow-back-outline" size={16} color="#57534e" />
        <Text className="text-base font-medium text-slate-500">{step === 'otp' ? 'เปลี่ยนเบอร์' : 'กลับหน้า Login'}</Text>
      </TouchableOpacity>
    </AuthLayout>
  );
};
