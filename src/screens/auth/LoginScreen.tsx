/**
 * LoginScreen — POS Mobile (Xcellence ERP)
 * Split layout: web ≥768 = brand panel + form, mobile = single column
 * ใช้ logo.png จริง + ขนาดตัวอักษร/องค์ประกอบใหญ่ขึ้น
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Platform, useWindowDimensions, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useStoreConfigStore } from '../../store/storeConfigStore';

const C = {
  primary: '#FF8A75',
  primaryDark: '#D85A30',
  bg: '#FFF9F4',
  brandBg: '#FFE9DD',
  surface: '#FFFFFF',
  border: '#F0E2DA',
  text: '#3A2E2B',
  textSec: '#5B4A46',
  textMuted: '#7D6E6A',
  mint: '#C9F1E1',
  mintDark: '#1F7A5C',
  amber: '#FFE8A3',
  amberDark: '#92660B',
  peachCircle: '#FFD6C4',
};

interface LoginScreenProps {
  onLogin?: (credential: string, password: string) => Promise<void>;
  onForgotPassword?: () => void;
  onOTPLogin?: () => void;
  onRegister?: () => void;
  onBack?: () => void;
  isOnline?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin, onForgotPassword, onOTPLogin, onRegister,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 768;
  const shopLogo = useStoreConfigStore.getState().shopLogo;
  const logoSource = shopLogo ? { uri: shopLogo } : require('@/assets/logo.png');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError('กรุณากรอกข้อมูลให้ครบ'); return; }
    setError('');
    setLoading(true);
    try { await onLogin?.(email.trim(), password); }
    catch (e: any) { setError(e?.message || 'เข้าสู่ระบบไม่สำเร็จ'); }
    finally { setLoading(false); }
  };

  const handleDemo = (cred: string, pass: string) => { setEmail(cred); setPassword(pass); };

  // ── Brand Panel ────────────────────────────────────────────────────────────
  const BrandPanel = () => (
    <View style={s.brandPanel}>
      <View style={[s.circle, s.circlePeach]} />
      <View style={[s.circle, s.circleAmber]} />
      <View style={[s.circle, s.circleMint]} />
      <View style={s.brandContent}>
        <Image source={logoSource} style={s.brandLogo} resizeMode="contain" />
        <Text style={s.brandName}>Xcellence ERP</Text>
        <Text style={s.brandDesc}>
          ระบบขายหน้าร้านที่ใช้งานง่าย{'\n'}จัดการร้านของคุณได้ทุกที่
        </Text>
        <View style={s.chipRow}>
          <View style={s.chip}>
            <Ionicons name="cart-outline" size={14} color={C.mintDark} />
            <Text style={[s.chipText, { color: C.mintDark }]}>ขายเร็ว</Text>
          </View>
          <View style={s.chip}>
            <Ionicons name="receipt-outline" size={14} color={C.amberDark} />
            <Text style={[s.chipText, { color: C.amberDark }]}>ออกบิลง่าย</Text>
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
      {/* Mobile logo */}
      {!isWide && (
        <View style={s.mobileLogo}>
          <Image source={logoSource} style={s.mobileLogoImg} resizeMode="contain" />
        </View>
      )}

      <Text style={s.h1}>เข้าสู่ระบบ</Text>
      <Text style={s.subtitle}>กรอกข้อมูลเพื่อเข้าสู่ระบบ POS Mobile</Text>

      {/* Email */}
      <Text style={s.label}>ชื่อผู้ใช้</Text>
      <View style={s.inputWrap}>
        <Ionicons name="person-outline" size={18} color={C.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={s.input}
          placeholder="เช่น admin, manager, cashier"
          placeholderTextColor={C.textMuted}
          value={email}
          onChangeText={(t) => { setEmail(t); setError(''); }}
          autoCapitalize="none"
        />
      </View>

      {/* Password */}
      <Text style={s.label}>รหัสผ่าน</Text>
      <View style={s.inputWrap}>
        <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={s.input}
          placeholder="รหัสผ่าน"
          placeholderTextColor={C.textMuted}
          secureTextEntry={!showPw}
          value={password}
          onChangeText={(t) => { setPassword(t); setError(''); }}
        />
        <TouchableOpacity onPress={() => setShowPw(!showPw)}>
          <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.textMuted} />
        </TouchableOpacity>
      </View>

      {error ? <Text style={s.error}>{error}</Text> : null}

      {/* Primary button */}
      <TouchableOpacity style={s.btnPrimary} onPress={handleLogin} activeOpacity={0.85}>
        <Text style={s.btnPrimaryText}>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</Text>
      </TouchableOpacity>

      {/* Demo accounts */}
      <View style={s.demoBox}>
        <Text style={s.demoTitle}>บัญชี Demo (กดเพื่อเติมอัตโนมัติ)</Text>
        {[
          { label: 'admin', role: 'Owner', cred: 'admin', pass: '1234' },
          { label: 'manager', role: 'Manager', cred: 'manager', pass: '1234' },
          { label: 'cashier', role: 'Cashier', cred: 'cashier', pass: '1234' },
        ].map((d) => (
          <TouchableOpacity key={d.label} style={s.demoItem} onPress={() => handleDemo(d.cred, d.pass)}>
            <Text style={s.demoLabel}>{d.label}</Text>
            <Text style={s.demoRole}>{d.role}</Text>
          </TouchableOpacity>
        ))}
        <Text style={s.demoHint}>รหัสผ่านทุก account: 1234</Text>
      </View>

      {/* Footer */}
      <Text style={s.footerText}>
        ยังไม่มีบัญชี?{' '}
        <Text style={s.linkMint} onPress={onRegister}>สมัครร้านค้า →</Text>
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

const s = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: C.bg },

  // Brand panel
  brandPanel: {
    flex: 1, backgroundColor: C.brandBg, justifyContent: 'center',
    alignItems: 'center', padding: 40, overflow: 'hidden',
  },
  brandContent: { alignItems: 'center', zIndex: 1 },
  brandLogo: { width: 160, height: 160, marginBottom: 20 },
  brandName: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 10 },
  brandDesc: { fontSize: 16, color: C.textSec, textAlign: 'center', lineHeight: 24, marginBottom: 20 },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
  },
  chipText: { fontSize: 14, fontWeight: '500' },

  circle: { position: 'absolute', borderRadius: 9999 },
  circlePeach: { width: 240, height: 240, backgroundColor: C.peachCircle, opacity: 0.6, top: -50, right: -70 },
  circleAmber: { width: 120, height: 120, backgroundColor: C.amber, opacity: 0.5, top: '45%' as any, right: 30 },
  circleMint: { width: 220, height: 220, backgroundColor: C.mint, opacity: 0.4, bottom: -70, left: -70 },

  // Form side
  formSide: { flex: 1.1, backgroundColor: C.bg },
  formScroll: { flexGrow: 1, justifyContent: 'center', padding: 40, maxWidth: 480, alignSelf: 'center', width: '100%' },

  // Mobile logo
  mobileLogo: { alignItems: 'center', marginBottom: 28 },
  mobileLogoImg: { width: 100, height: 100 },

  // Typography (BIGGER)
  h1: { fontSize: 28, fontWeight: '700', color: C.text, marginBottom: 6 },
  subtitle: { fontSize: 16, color: C.textSec, marginBottom: 28 },
  label: { fontSize: 15, fontWeight: '500', color: C.text, marginBottom: 8 },

  // Inputs (BIGGER)
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 14, height: 52, marginBottom: 16,
  },
  input: { flex: 1, fontSize: 16, color: C.text },
  error: { fontSize: 14, color: C.primaryDark, marginBottom: 10 },

  // Buttons (BIGGER)
  btnPrimary: {
    backgroundColor: C.primary, borderRadius: 12, height: 52,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20, marginTop: 8,
  },
  btnPrimaryText: { color: '#fff', fontSize: 17, fontWeight: '600' },

  // Demo box
  demoBox: {
    backgroundColor: '#FFF0EC', borderRadius: 12, padding: 16, gap: 6, marginBottom: 20,
    borderWidth: 1, borderColor: '#FFD6C4',
  },
  demoTitle: { fontSize: 14, fontWeight: '600', color: C.primaryDark, marginBottom: 4 },
  demoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  demoLabel: { fontSize: 15, color: C.primary, fontWeight: '600' },
  demoRole: { fontSize: 13, color: C.textSec, fontWeight: '600' },
  demoHint: { fontSize: 13, color: C.primaryDark, marginTop: 4 },

  // Footer
  footerText: { fontSize: 15, color: C.textSec, textAlign: 'center', marginTop: 8 },
  linkMint: { color: C.mintDark, fontWeight: '600' },
});
