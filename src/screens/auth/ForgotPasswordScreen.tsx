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
import { AuthLayout, type AuthError, authErrorText } from './AuthLayout';
import { useT } from '../../i18n/useT';
import type { UiKey } from '../../i18n/types';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface ForgotPasswordScreenProps {
  onResetSuccess: () => void;
  onBack: () => void;
  /** รีเซ็ตรหัสผ่านจริงที่ store (คืน true ถ้าสำเร็จ) */
  onReset?: (phone: string, newPassword: string) => boolean;
}

type Step = 'phone' | 'otp' | 'new-password' | 'success';

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onResetSuccess, onBack, onReset,
}) => {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError>(null);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<TextInput[]>([]);
  const t = useT();
  const errorText = authErrorText(t, error);

  const handleSendOTP = async () => {
    if (!phone.trim() || phone.trim().length < 9) { setError({ key: 'auth.forgot.errPhone' }); return; }
    setError(null);
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('otp'); setCountdown(60); }, 1000);
  };

  const handleVerifyOTP = () => {
    const code = otp.join('');
    if (code.length < 6) { setError({ key: 'auth.forgot.errOtp' }); return; }
    setError(null);
    setStep('new-password');
  };

  const handleReset = () => {
    if (!newPassword || newPassword.length < 4) { setError({ key: 'auth.forgot.errPwMin' }); return; }
    if (newPassword !== confirmPassword) { setError({ key: 'auth.errPwMismatch' }); return; }
    // อัปเดตรหัสผ่านจริงที่ store — ถ้าไม่พบบัญชีที่ตรงเบอร์ ให้แจ้งผู้ใช้
    if (onReset && !onReset(phone.trim(), newPassword)) {
      setError({ key: 'auth.forgot.errNoAccount' });
      return;
    }
    setError(null);
    setStep('success');
  };

  const handleOTPChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const titles: Record<Step, { title: UiKey; subtitle: UiKey }> = {
    phone: { title: 'auth.forgot.title', subtitle: 'auth.forgot.subtitle' },
    otp: { title: 'auth.otp.verify', subtitle: 'auth.otp.sentTo' },
    'new-password': { title: 'auth.forgot.newPasswordTitle', subtitle: 'auth.forgot.newPasswordSubtitle' },
    success: { title: 'auth.forgot.successTitle', subtitle: 'auth.forgot.successSubtitle' },
  };

  return (
    <AuthLayout title={t(titles[step].title)} subtitle={t(titles[step].subtitle, { phone })}>
      {step === 'phone' && (
        <>
          <Input
            label={t('auth.phone')}
            placeholder={t('auth.phonePlaceholder')}
            value={phone}
            onChangeText={(v) => { setPhone(v); setError(null); }}
            leftIcon="call-outline"
            keyboardType="phone-pad"
            maxLength={10}
            error={errorText}
          />
          <Button title={t('auth.otp.send')} onPress={handleSendOTP} loading={loading} fullWidth size="lg" style={{ marginTop: Spacing.lg }} />
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
          {errorText ? <Text style={s.error}>{errorText}</Text> : null}
          <Button title={t('common.confirm')} onPress={handleVerifyOTP} fullWidth size="lg" />
        </>
      )}

      {step === 'new-password' && (
        <>
          <Input label={t('auth.forgot.newPassword')} placeholder={t('auth.forgot.newPasswordPlaceholder')} value={newPassword} onChangeText={setNewPassword} isPassword leftIcon="lock-closed-outline" />
          <Input label={t('auth.confirmPassword')} placeholder={t('auth.forgot.confirmPlaceholder')} value={confirmPassword} onChangeText={setConfirmPassword} isPassword leftIcon="lock-closed-outline" error={errorText} />
          <Button title={t('auth.forgot.newPasswordTitle')} onPress={handleReset} fullWidth size="lg" style={{ marginTop: Spacing.lg }} />
        </>
      )}

      {step === 'success' && (
        <View style={s.successBox}>
          <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
          <Text style={s.successText}>{t('auth.forgot.success')}</Text>
          <Button title={t('auth.backToLogin')} onPress={onResetSuccess} fullWidth size="lg" style={{ marginTop: Spacing.lg }} />
        </View>
      )}

      {step !== 'success' && (
        <TouchableOpacity onPress={onBack} style={s.backRow}>
          <Ionicons name="arrow-back-outline" size={16} color={Colors.textSecondary} />
          <Text style={s.backText}>{t('auth.backToLogin')}</Text>
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
