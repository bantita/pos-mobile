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
import { AuthLayout, type AuthError, authErrorText, caughtAuthError } from './AuthLayout';
import { useT } from '../../i18n/useT';
import type { UiKey } from '../../i18n/types';
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
  const [error, setError] = useState<AuthError>(null);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<TextInput[]>([]);
  const t = useT();
  const errorText = authErrorText(t, error);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRequestOTP = async () => {
    if (!phone.trim() || phone.trim().length < 9) {
      setError({ key: 'auth.otp.errPhone' });
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onRequestOTP(phone.trim());
      setStep('otp');
      setCountdown(60);
    } catch (e) {
      setError(caughtAuthError(e, 'auth.otp.errSendFailed'));
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
    if (otpCode.length < 6) { setError({ key: 'auth.otp.errCode' }); return; }
    setError(null);
    setLoading(true);
    try {
      await onVerifyOTP(phone.trim(), otpCode);
    } catch (e) {
      setError(caughtAuthError(e, 'auth.otp.errInvalid'));
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={step === 'phone' ? t('auth.otp.titlePhone') : t('auth.otp.titleVerify')}
      subtitle={step === 'phone' ? t('auth.otp.subtitlePhone') : t('auth.otp.sentTo', { phone })}
    >
      {/* Step indicator */}
      <View style={s.steps}>
        {(['auth.otp.stepPhone', 'auth.otp.stepVerify'] as UiKey[]).map((labelKey, i) => (
          <React.Fragment key={i}>
            <View style={s.stepItem}>
              <View style={[s.stepDot, (step === 'otp' ? i <= 1 : i === 0) && s.stepDotActive]}>
                <Text style={[s.stepNum, (step === 'otp' ? i <= 1 : i === 0) && s.stepNumActive]}>{i + 1}</Text>
              </View>
              <Text style={s.stepLabel}>{t(labelKey)}</Text>
            </View>
            {i < 1 && <View style={[s.stepLine, step === 'otp' && s.stepLineActive]} />}
          </React.Fragment>
        ))}
      </View>

      {step === 'phone' ? (
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
          <Button title={t('auth.otp.send')} onPress={handleRequestOTP} loading={loading} fullWidth size="lg" style={{ marginTop: Spacing.lg }} />
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
          {errorText ? <Text style={s.error}>{errorText}</Text> : null}
          <Button title={t('auth.otp.verify')} onPress={() => handleVerify()} loading={loading} fullWidth size="lg" />
          <View style={s.resendRow}>
            <Text style={s.resendText}>{t('auth.otp.notReceived')}</Text>
            {countdown > 0 ? (
              <Text style={s.countdown}>{t('auth.otp.resendIn', { seconds: countdown })}</Text>
            ) : (
              <TouchableOpacity onPress={handleRequestOTP}><Text style={s.resendLink}>{t('auth.otp.resend')}</Text></TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* Back */}
      <TouchableOpacity onPress={step === 'otp' ? () => setStep('phone') : onBack} style={s.backRow}>
        <Ionicons name="arrow-back-outline" size={16} color={Colors.textSecondary} />
        <Text style={s.backText}>{step === 'otp' ? t('auth.otp.changePhone') : t('auth.backToLogin')}</Text>
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
