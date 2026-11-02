/**
 * RegisterShopScreen — POS Mobile
 * Split layout เหมือน LoginScreen (brand panel + form)
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Platform, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { LanguageToggle } from '../../components/ui/LanguageToggle';
import { Spacing } from '../../constants/spacing';
import { useT } from '../../i18n/useT';
import { type AuthError, authErrorText, caughtAuthError } from './AuthLayout';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const C = {
  primary: '#FF8A75',
  primaryDark: '#D85A30',
  bg: '#FFF9F4',
  brandBg: '#FFE9DD',
  surface: '#FFFFFF',
  border: '#F0E2DA',
  text: '#3A2E2B',
  textSec: '#6B5B57',
  textMuted: '#7D6E6A',
  mint: '#C9F1E1',
  mintDark: '#1F7A5C',
  amber: '#FFE8A3',
  amberDark: '#92660B',
  peachCircle: '#FFD6C4',
};

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
  const [error, setError] = useState<AuthError>(null);
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 768;
  const t = useT();
  const uiLanguage = useLanguageStore((st) => st.uiLanguage);
  const setUiLanguage = useLanguageStore((st) => st.setUiLanguage);
  const errorText = authErrorText(t, error);

  const handleRegister = () => {
    if (!shopName.trim()) { setError({ key: 'auth.register.errShopName' }); return; }
    if (!phone.trim()) { setError({ key: 'auth.register.errPhone' }); return; }
    if (!password || password.length < 4) { setError({ key: 'auth.register.errPwMin' }); return; }
    if (password !== confirmPw) { setError({ key: 'auth.errPwMismatch' }); return; }
    if (!agree) { setError({ key: 'auth.register.errAgree' }); return; }
    setError(null);
    setLoading(true);
    try {
      register({ phone: phone.trim(), name: shopName.trim(), password, shopName: shopName.trim() });
      onRegisterSuccess();
    } catch (e) {
      setError(caughtAuthError(e, 'auth.register.errFailed'));
    } finally { setLoading(false); }
  };

  // ── Brand Panel (same as Login) ────────────────────────────────────────────
  const BrandPanel = () => (
    <View style={s.brandPanel}>
      <View style={[s.circle, s.circlePeach]} />
      <View style={[s.circle, s.circleAmber]} />
      <View style={[s.circle, s.circleMint]} />
      <View style={s.brandContent}>
        <View style={s.logoBadge}>
          <Ionicons name="storefront-outline" size={28} color="#fff" />
        </View>
        <Text style={s.brandName}>POS Mobile</Text>
        <Text style={s.brandDesc}>
          {t('auth.brandDesc')}
        </Text>
        <View style={s.chipRow}>
          <View style={s.chip}>
            <Ionicons name="cart-outline" size={12} color={C.mintDark} />
            <Text style={[s.chipText, { color: C.mintDark }]}>{t('auth.chipFastSale')}</Text>
          </View>
          <View style={s.chip}>
            <Ionicons name="receipt-outline" size={12} color={C.amberDark} />
            <Text style={[s.chipText, { color: C.amberDark }]}>{t('auth.chipEasyBill')}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // ── Form ───────────────────────────────────────────────────────────────────
  const Form = () => (
    <ScrollView
      contentContainerStyle={s.formScroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Language switcher */}
      <View style={s.langRow}>
        <LanguageToggle
          value={uiLanguage}
          onChange={setUiLanguage}
          accessibilityLabel={t('settings.uiLanguage')}
        />
      </View>

      {!isWide && (
        <View style={s.mobileLogo}>
          <View style={s.logoBadgeSmall}>
            <Ionicons name="storefront-outline" size={22} color="#fff" />
          </View>
          <Text style={s.mobileLogoText}>POS Mobile</Text>
        </View>
      )}

      <Text style={s.h1}>{t('auth.register.title')}</Text>
      <Text style={s.subtitle}>{t('auth.register.subtitle')}</Text>

      {/* Shop name */}
      <Text style={s.label}>{t('auth.register.shopName')}</Text>
      <View style={s.inputWrap}>
        <Ionicons name="storefront-outline" size={16} color={C.textMuted} style={{ marginRight: 8 }} />
        <TextInput style={s.input} placeholder={t('auth.register.shopNamePlaceholder')} placeholderTextColor={C.textMuted} value={shopName} onChangeText={(v) => { setShopName(v); setError(null); }} />
      </View>

      {/* Phone */}
      <Text style={s.label}>{t('auth.phone')}</Text>
      <View style={s.inputWrap}>
        <Ionicons name="call-outline" size={16} color={C.textMuted} style={{ marginRight: 8 }} />
        <TextInput style={s.input} placeholder="08X-XXX-XXXX" placeholderTextColor={C.textMuted} value={phone} onChangeText={(v) => { setPhone(v); setError(null); }} keyboardType="phone-pad" />
      </View>

      {/* Email */}
      <Text style={s.label}>{t('auth.register.email')}</Text>
      <View style={s.inputWrap}>
        <Ionicons name="mail-outline" size={16} color={C.textMuted} style={{ marginRight: 8 }} />
        <TextInput style={s.input} placeholder="name@example.com" placeholderTextColor={C.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      </View>

      {/* Password */}
      <Text style={s.label}>{t('auth.password')}</Text>
      <View style={s.inputWrap}>
        <Ionicons name="lock-closed-outline" size={16} color={C.textMuted} style={{ marginRight: 8 }} />
        <TextInput style={s.input} placeholder="********" placeholderTextColor={C.textMuted} secureTextEntry={!showPw} value={password} onChangeText={(v) => { setPassword(v); setError(null); }} />
        <TouchableOpacity onPress={() => setShowPw(!showPw)}>
          <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Confirm password */}
      <Text style={s.label}>{t('auth.confirmPassword')}</Text>
      <View style={s.inputWrap}>
        <Ionicons name="lock-closed-outline" size={16} color={C.textMuted} style={{ marginRight: 8 }} />
        <TextInput style={s.input} placeholder="********" placeholderTextColor={C.textMuted} secureTextEntry={!showConfirm} value={confirmPw} onChangeText={(v) => { setConfirmPw(v); setError(null); }} />
        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
          <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
        </TouchableOpacity>
      </View>

      {errorText ? <Text style={s.error}>{errorText}</Text> : null}

      {/* Agree */}
      <TouchableOpacity style={s.agreeRow} onPress={() => setAgree(!agree)}>
        <Ionicons name={agree ? 'checkbox' : 'square-outline'} size={20} color={agree ? C.primary : C.text} />
        <Text style={s.agreeText}>{t('auth.register.agree')}</Text>
      </TouchableOpacity>

      {/* Submit */}
      <TouchableOpacity style={s.btnPrimary} onPress={handleRegister} activeOpacity={0.85}>
        <Text style={s.btnPrimaryText}>{loading ? t('auth.register.creating') : t('auth.register.submit')}</Text>
      </TouchableOpacity>

      {/* Back to login */}
      <Text style={s.footerText}>
        {t('auth.register.haveShop')}{' '}
        <Text style={s.linkMint} onPress={onBack}>{t('auth.login')}</Text>
      </Text>
    </ScrollView>
  );

  if (isWide) {
    return (
      <View style={s.root}>
        <BrandPanel />
        <View style={s.formSide}><Form /></View>
      </View>
    );
  }
  return <View style={s.root}><Form /></View>;
};

// ─── Styles (shared pattern with LoginScreen) ────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: C.bg },

  brandPanel: {
    flex: 1, backgroundColor: C.brandBg, justifyContent: 'center',
    alignItems: 'center', padding: 32, overflow: 'hidden',
  },
  brandContent: { alignItems: 'center', zIndex: 1 },
  logoBadge: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  brandName: { fontSize: 20, fontWeight: '600', color: C.text, marginBottom: 8 },
  brandDesc: { fontSize: 14, color: C.textSec, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  chipText: { fontSize: 12, fontWeight: '500' },

  circle: { position: 'absolute', borderRadius: 9999 },
  circlePeach: { width: 200, height: 200, backgroundColor: C.peachCircle, opacity: 0.6, top: -40, right: -60 },
  circleAmber: { width: 100, height: 100, backgroundColor: C.amber, opacity: 0.5, top: '45%' as any, right: 20 },
  circleMint: { width: 180, height: 180, backgroundColor: C.mint, opacity: 0.4, bottom: -60, left: -60 },

  formSide: { flex: 1.1, backgroundColor: C.bg },
  formScroll: { flexGrow: 1, justifyContent: 'center', padding: 32, maxWidth: 440, alignSelf: 'center', width: '100%' },

  langRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: Spacing.lg },
  mobileLogo: { alignItems: 'center', marginBottom: 24 },
  logoBadgeSmall: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  mobileLogoText: { fontSize: 18, fontWeight: '600', color: C.text },

  h1: { fontSize: 24, fontWeight: '600', color: C.text, marginBottom: 4 },
  subtitle: { fontSize: 15, color: C.textSec, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '500', color: C.text, marginBottom: 6, marginTop: 4 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 12, height: 46, marginBottom: 12,
  },
  input: { flex: 1, fontSize: 15, color: C.text },
  error: { fontSize: 13, color: C.primaryDark, marginBottom: 8 },

  agreeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 12 },
  agreeText: { fontSize: 14, color: C.textSec },

  btnPrimary: {
    backgroundColor: C.primary, borderRadius: 12, height: 46,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16, marginTop: 4,
  },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  footerText: { fontSize: 14, color: C.textSec, textAlign: 'center', marginTop: 8 },
  linkMint: { color: C.mintDark, fontWeight: '600' },
});
