/**
 * ForgotPasswordScreen — Xcellence ERP
 * ใช้ AuthLayout wrapper (responsive)
 */
import React, { useState, useRef } from 'react';
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
  const inputRefs = useRef<TextInput[]>([]);

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
          <Button title="ส่งรหัส OTP" onPress={handleSendOTP} loading={loading} fullWidth size="lg" style={{ marginTop: Spacing.lg }} />
        </>
      )}

      {step === 'otp' && (
        <>
          <View style={s.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { if (ref) inputRefs.current[i] = ref; }}
                style={[s.otpBox, digit ? s.otpBoxFilled : null]}
                value={digit}
                onChangeText={(v) => handleOTPChange(v.replace(/\D/g, '').slice(-1), i)}
                keyboardType="number-pad"
                maxLength={1}
              />
            ))}
          </View>
          {error ? <Text style={s.error}>{error}</Text> : null}
          <Button title="ยืนยัน" onPress={handleVerifyOTP} fullWidth size="lg" />
        </>
      )}

      {step === 'new-password' && (
        <>
          <Input label="รหัสผ่านใหม่" placeholder="อย่างน้อย 4 ตัว" value={newPassword} onChangeText={setNewPassword} isPassword leftIcon="lock-closed-outline" />
          <Input label="ยืนยันรหัสผ่าน" placeholder="กรอกอีกครั้ง" value={confirmPassword} onChangeText={setConfirmPassword} isPassword leftIcon="lock-closed-outline" error={error} />
          <Button title="ตั้งรหัสผ่านใหม่" onPress={handleReset} fullWidth size="lg" style={{ marginTop: Spacing.lg }} />
        </>
      )}

      {step === 'success' && (
        <View style={s.successBox}>
          <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
          <Text style={s.successText}>เปลี่ยนรหัสผ่านสำเร็จ</Text>
          <Button title="กลับหน้า Login" onPress={onResetSuccess} fullWidth size="lg" style={{ marginTop: Spacing.lg }} />
        </View>
      )}

      {step !== 'success' && (
        <TouchableOpacity onPress={onBack} style={s.backRow}>
          <Ionicons name="arrow-back-outline" size={16} color={Colors.textSecondary} />
          <Text style={s.backText}>กลับหน้า Login</Text>
        </TouchableOpacity>
      )}
    </AuthLayout>
  );
};

const s = StyleSheet.create({
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm, marginBottom: Spacing.md },
  otpBox: { flex: 1, height: 52, borderWidth: 2, borderColor: Colors.border, borderRadius: BorderRadius.sm, textAlign: 'center', fontSize: 22, fontWeight: '700', color: Colors.text, backgroundColor: Colors.background },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  error: { ...Typography.caption, color: Colors.danger, textAlign: 'center', marginBottom: Spacing.sm },
  successBox: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  successText: { ...Typography.h4, color: Colors.success },
  backRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, marginTop: Spacing.xl },
  backText: { ...Typography.body2, color: Colors.textSecondary },
});
