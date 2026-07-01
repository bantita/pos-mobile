/**
 * OTPLoginScreen — Xcellence ERP
 * ใช้ AuthLayout wrapper (responsive split/single column)
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AuthLayout } from './AuthLayout';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

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
  const inputRefs = useRef<TextInput[]>([]);

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
      {/* Step indicator */}
      <View style={s.steps}>
        {['กรอกเบอร์', 'ยืนยัน OTP'].map((label, i) => (
          <React.Fragment key={i}>
            <View style={s.stepItem}>
              <View style={[s.stepDot, (step === 'otp' ? i <= 1 : i === 0) && s.stepDotActive]}>
                <Text style={[s.stepNum, (step === 'otp' ? i <= 1 : i === 0) && s.stepNumActive]}>{i + 1}</Text>
              </View>
              <Text style={s.stepLabel}>{label}</Text>
            </View>
            {i < 1 && <View style={[s.stepLine, step === 'otp' && s.stepLineActive]} />}
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
          <Button title="ส่งรหัส OTP" onPress={handleRequestOTP} loading={loading} fullWidth size="lg" style={{ marginTop: Spacing.lg }} />
        </>
      ) : (
        <>
          <View style={s.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { if (ref) inputRefs.current[i] = ref; }}
                style={[s.otpBox, digit ? s.otpBoxFilled : null, error ? s.otpBoxError : null]}
                value={digit}
                onChangeText={(v) => handleOTPChange(v.replace(/\D/g, '').slice(-1), i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                textContentType="oneTimeCode"
              />
            ))}
          </View>
          {error ? <Text style={s.error}>{error}</Text> : null}
          <Button title="ยืนยัน OTP" onPress={() => handleVerify()} loading={loading} fullWidth size="lg" />
          <View style={s.resendRow}>
            <Text style={s.resendText}>ไม่ได้รับรหัส? </Text>
            {countdown > 0 ? (
              <Text style={s.countdown}>ส่งอีกครั้งใน {countdown}s</Text>
            ) : (
              <TouchableOpacity onPress={handleRequestOTP}><Text style={s.resendLink}>ส่งอีกครั้ง</Text></TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* Back */}
      <TouchableOpacity onPress={step === 'otp' ? () => setStep('phone') : onBack} style={s.backRow}>
        <Ionicons name="arrow-back-outline" size={16} color={Colors.textSecondary} />
        <Text style={s.backText}>{step === 'otp' ? 'เปลี่ยนเบอร์' : 'กลับหน้า Login'}</Text>
      </TouchableOpacity>
    </AuthLayout>
  );
};

const s = StyleSheet.create({
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl, gap: Spacing.xs },
  stepItem: { alignItems: 'center', gap: Spacing.xs },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.gray200, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: Colors.primary },
  stepNum: { ...Typography.label, color: Colors.gray400 },
  stepNumActive: { color: Colors.white },
  stepLabel: { ...Typography.caption, color: Colors.textSecondary },
  stepLine: { width: 40, height: 2, backgroundColor: Colors.gray200, marginBottom: Spacing.lg },
  stepLineActive: { backgroundColor: Colors.primary },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm, marginBottom: Spacing.md },
  otpBox: { flex: 1, height: 52, borderWidth: 2, borderColor: Colors.border, borderRadius: BorderRadius.sm, textAlign: 'center', fontSize: 22, fontWeight: '700', color: Colors.text, backgroundColor: Colors.background },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  otpBoxError: { borderColor: Colors.danger },
  error: { ...Typography.caption, color: Colors.danger, textAlign: 'center', marginBottom: Spacing.sm },
  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  resendText: { ...Typography.body2, color: Colors.textSecondary },
  resendLink: { ...Typography.body2, color: Colors.primary, fontWeight: '600' },
  countdown: { ...Typography.body2, color: Colors.gray400 },
  backRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, marginTop: Spacing.xl },
  backText: { ...Typography.body2, color: Colors.textSecondary },
});
