/**
 * WebWelcomeScreen
 * view: 'login' | 'register'
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Platform, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useStoreConfigStore } from '../../store/storeConfigStore';
import { BusinessType, BusinessScale } from '../../types/store';
import { Colors } from '../../design-system/tokens';

interface Props {
  onLogin: () => void;
  onRegister: () => void;
}

/** Demo hints */
const DEMO_HINTS = [
  { username: 'admin',   password: '1234', role: 'Owner',   roleColor: '#7C3AED', roleBg: '#EDE9FE' },
  { username: 'manager', password: '1234', role: 'Manager', roleColor: '#2563EB', roleBg: '#EFF6FF' },
  { username: 'cashier', password: '1234', role: 'Cashier', roleColor: '#16A34A', roleBg: '#F0FDF4' },
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
        // Save store config
        setBusinessType(bizType);
        setBusinessScale(bizScale);
        setStoreType(bizScale === 'ENTERPRISE' ? 'ENTERPRISE' : bizType);
        setStoreName(shopName.trim() || 'ร้านค้าใหม่');
        setStoreAddress(shopAddr.trim());
        setStorePhone(phone.trim());
        setStoreTaxId(taxId.trim());
        // สร้าง user ใหม่ (เบอร์โทร = username)
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
    <View style={styles.page}>
      <View style={styles.shapeTopLeft} />
      <View style={styles.shapeBottomRight} />
      <ScrollView contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>
        <Image source={require('../../../public/logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.card}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={16} color="#7A7F85" />
            <Text style={styles.backText}>กลับ</Text>
          </TouchableOpacity>
          <View style={styles.cardIconCircle}>
            <Ionicons name="storefront" size={28} color="#FF424D" />
          </View>
          <Text style={styles.cardTitle}>สมัครร้านค้าใหม่</Text>

          {/* Step indicator */}
          <View style={styles.stepRow}>
            {Steps.map((lbl, i) => (
              <React.Fragment key={i}>
                <View style={styles.stepItem}>
                  <View style={[
                    styles.stepDot,
                    step > i + 1 && styles.stepDone,
                    step === i + 1 && styles.stepActive,
                  ]}>
                    {step > i + 1
                      ? <Ionicons name="checkmark" size={12} color="#fff" />
                      : <Text style={[styles.stepNum, step === i + 1 && { color: '#fff' }]}>{i + 1}</Text>
                    }
                  </View>
                  <Text style={[styles.stepLbl, step === i + 1 && { color: '#FF424D', fontWeight: '700' }]}>{lbl}</Text>
                </View>
                {i < 2 && <View style={[styles.stepLine, step > i + 1 && { backgroundColor: '#FF424D' }]} />}
              </React.Fragment>
            ))}
          </View>

          {/* Step 1: Phone */}
          {step === 1 && (
            <>
              <Text style={styles.label}>เบอร์โทรศัพท์ *</Text>
              <View style={styles.inputRow}>
                <Ionicons name="call-outline" size={16} color="#7A7F85" />
                <TextInput
                  style={styles.input} value={phone} onChangeText={setPhone}
                  placeholder="0812345678" placeholderTextColor="#B0B5BA"
                  keyboardType="phone-pad" maxLength={10}
                />
              </View>
              <Text style={styles.hintText}>ระบบจะส่งรหัส OTP ไปยังเบอร์นี้</Text>
            </>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <>
              <Text style={styles.label}>รหัส OTP 6 หลัก</Text>
              <Text style={styles.hintText}>ส่งรหัสไปที่ {phone}</Text>
              <View style={styles.otpBoxRow}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <View key={i} style={[styles.otpCell, otp.length > i && styles.otpCellFilled]}>
                    <Text style={styles.otpCellText}>{otp[i] ? '●' : ''}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.inputRow}>
                <Ionicons name="key-outline" size={16} color="#7A7F85" />
                <TextInput
                  style={styles.input} value={otp} onChangeText={setOTP}
                  placeholder="กรอก OTP 6 หลัก" placeholderTextColor="#B0B5BA"
                  keyboardType="number-pad" maxLength={6}
                />
              </View>
              <Text style={styles.demoNote}>Demo OTP: <Text style={{ fontWeight: '700', color: '#FF424D' }}>123456</Text></Text>
            </>
          )}

          {/* Step 3: Shop info */}
          {step === 3 && (
            <>
              <Text style={styles.sectionTitle}>ประเภทธุรกิจ</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {([
                  { t: 'SERVICE' as BusinessType, icon: 'cut-outline', label: 'ร้านบริการ' },
                  { t: 'RETAIL' as BusinessType, icon: 'storefront-outline', label: 'ร้านค้าปลีก' },
                ] as const).map(item => (
                  <TouchableOpacity key={item.t} onPress={() => setBizType(item.t)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8, borderWidth: 1.5, borderColor: bizType === item.t ? '#E85D5D' : Colors.border, backgroundColor: bizType === item.t ? '#FEF2F2' : '#fff' }}>
                    <Ionicons name={item.icon as any} size={18} color={bizType === item.t ? '#E85D5D' : Colors.textSecondary} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: bizType === item.t ? '#E85D5D' : Colors.text }}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.sectionTitle}>ขนาดธุรกิจ</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {([
                  { s: 'BUSINESS' as BusinessScale, icon: 'home-outline', label: 'Business (ร้านเดียว)' },
                  { s: 'ENTERPRISE' as BusinessScale, icon: 'business-outline', label: 'Enterprise (หลายสาขา)' },
                ] as const).map(item => (
                  <TouchableOpacity key={item.s} onPress={() => setBizScale(item.s)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8, borderWidth: 1.5, borderColor: bizScale === item.s ? '#E85D5D' : Colors.border, backgroundColor: bizScale === item.s ? '#FEF2F2' : '#fff' }}>
                    <Ionicons name={item.icon as any} size={18} color={bizScale === item.s ? '#E85D5D' : Colors.textSecondary} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: bizScale === item.s ? '#E85D5D' : Colors.text }}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>ข้อมูลร้านค้า</Text>
              <Text style={styles.label}>ชื่อร้านค้า *</Text>
              <View style={styles.inputRow}>
                <Ionicons name="storefront-outline" size={16} color="#7A7F85" />
                <TextInput style={styles.input} value={shopName} onChangeText={setShopName} placeholder="เช่น ร้านสะดวกซื้อ ABC" placeholderTextColor="#B0B5BA" />
              </View>

              <Text style={styles.label}>ที่อยู่ร้าน</Text>
              <View style={[styles.inputRow, { height: 72, alignItems: 'flex-start', paddingTop: 10 }]}>
                <Ionicons name="location-outline" size={16} color="#7A7F85" style={{ marginTop: 2 }} />
                <TextInput style={[styles.input, { height: 52 }]} value={shopAddr} onChangeText={setShopAddr} placeholder="เลขที่ ถนน ตำบล อำเภอ จังหวัด" placeholderTextColor="#B0B5BA" multiline />
              </View>

              <Text style={styles.label}>เลขประจำตัวผู้เสียภาษี</Text>
              <View style={styles.inputRow}>
                <Ionicons name="card-outline" size={16} color="#7A7F85" />
                <TextInput style={styles.input} value={taxId} onChangeText={setTaxId} placeholder="13 หลัก (ถ้ามี)" placeholderTextColor="#B0B5BA" keyboardType="number-pad" maxLength={13} />
              </View>

              <Text style={styles.sectionTitle}>รหัสผ่าน Owner</Text>
              <Text style={styles.label}>รหัสผ่าน *</Text>
              <View style={[styles.inputRow, !pwdStrong && pwd.length > 0 && styles.inputRowErr]}>
                <Ionicons name="lock-closed-outline" size={16} color="#7A7F85" />
                <TextInput style={styles.input} value={pwd} onChangeText={setPwd} placeholder="อย่างน้อย 8 ตัวอักษร" placeholderTextColor="#B0B5BA" secureTextEntry={!showPwd} />
                <TouchableOpacity onPress={() => setShowPwd(!showPwd)}>
                  <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={16} color="#7A7F85" />
                </TouchableOpacity>
              </View>
              <View style={styles.pwdRules}>
                {[
                  { ok: pwd.length >= 8,         label: 'อย่างน้อย 8 ตัวอักษร' },
                  { ok: /[A-Z]/.test(pwd),       label: 'มีตัวพิมพ์ใหญ่' },
                  { ok: /[0-9]/.test(pwd),       label: 'มีตัวเลข' },
                ].map((r, i) => (
                  <View key={i} style={styles.pwdRule}>
                    <Ionicons name={r.ok ? 'checkmark-circle' : 'ellipse-outline'} size={13} color={r.ok ? '#16A34A' : '#B0B5BA'} />
                    <Text style={[styles.pwdRuleText, r.ok && { color: '#16A34A' }]}>{r.label}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.label}>ยืนยันรหัสผ่าน *</Text>
              <View style={[styles.inputRow, !pwdMatch && pwd2.length > 0 && styles.inputRowErr]}>
                <Ionicons name="lock-closed-outline" size={16} color="#7A7F85" />
                <TextInput style={styles.input} value={pwd2} onChangeText={setPwd2} placeholder="กรอกรหัสผ่านอีกครั้ง" placeholderTextColor="#B0B5BA" secureTextEntry={!showPwd} />
              </View>
              {pwd2.length > 0 && !pwdMatch && (
                <Text style={styles.errTextInline}>รหัสผ่านไม่ตรงกัน</Text>
              )}

              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>สรุปข้อมูล</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>เบอร์โทร</Text>
                  <Text style={styles.summaryValue}>{phone}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>ชื่อร้าน</Text>
                  <Text style={styles.summaryValue}>{shopName || '—'}</Text>
                </View>
                {taxId ? (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tax ID</Text>
                    <Text style={styles.summaryValue}>{taxId}</Text>
                  </View>
                ) : null}
              </View>
            </>
          )}

          {/* Error */}
          {error !== '' && (
            <View style={styles.errBox}>
              <Ionicons name="warning-outline" size={13} color="#DC2626" />
              <Text style={styles.errText}>{error}</Text>
            </View>
          )}

          {/* Next / Submit button */}
          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleNext} disabled={loading}>
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.btnText}>
                  {step === 1 ? 'ส่งรหัส OTP' : step === 2 ? 'ยืนยัน OTP' : 'สร้างร้านค้า'}
                </Text>
            }
          </TouchableOpacity>

          {/* Switch to login */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>มีบัญชีอยู่แล้ว?</Text>
            <TouchableOpacity onPress={onGoLogin}>
              <Text style={styles.switchLink}>เข้าสู่ระบบ →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusRow}>
          <View style={styles.greenDot} />
          <Text style={styles.statusText}>ออนไลน์ • เวอร์ชัน 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Main Welcome ─────────────────────────────────────────────────────────────
export const WebWelcomeScreen: React.FC<Props> = ({ onLogin, onRegister }) => {
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
    <View style={styles.page}>
      {/* Background shapes */}
      <View style={styles.shapeTopLeft} />
      <View style={styles.shapeBottomRight} />

      {/* Top-right menu */}
      <View style={styles.topRight}>
        <View style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={20} color="#263238" />
          <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
        </View>
        <View style={styles.adminPill}>
          <Ionicons name="person-circle-outline" size={22} color="#263238" />
          <Text style={styles.adminName}>Admin</Text>
          <Ionicons name="chevron-down" size={13} color="#7A7F85" />
        </View>
      </View>

      {/* Center content */}
      <ScrollView contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <Image source={require('../../../public/logo.png')} style={styles.logo} resizeMode="contain" />

        {/* Login Card */}
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.cardIconCircle}>
            <Ionicons name="storefront" size={28} color="#FF424D" />
          </View>

          {/* Title */}
          <Text style={styles.cardTitle}>เข้าสู่ระบบ</Text>
          <Text style={styles.cardSub}>กรอกข้อมูลเพื่อเข้าสู่ระบบ POS Mobile</Text>

          {/* Username */}
          <Text style={styles.label}>ชื่อผู้ใช้</Text>
          <View style={[styles.inputRow, !!error && styles.inputRowErr]}>
            <Ionicons name="person-outline" size={16} color="#7A7F85" />
            <TextInput
              style={styles.input} value={cred} onChangeText={setCred}
              placeholder="เช่น admin, manager, cashier" placeholderTextColor="#B0B5BA"
              autoCapitalize="none" onSubmitEditing={submit}
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>รหัสผ่าน</Text>
          <View style={[styles.inputRow, !!error && styles.inputRowErr]}>
            <Ionicons name="lock-closed-outline" size={16} color="#7A7F85" />
            <TextInput
              style={styles.input} value={pass} onChangeText={setPass}
              placeholder="รหัสผ่าน" placeholderTextColor="#B0B5BA"
              secureTextEntry={!show} onSubmitEditing={submit}
            />
            <TouchableOpacity onPress={() => setShow(!show)}>
              <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={16} color="#7A7F85" />
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error !== '' && (
            <View style={styles.errBox}>
              <Ionicons name="warning-outline" size={13} color="#DC2626" />
              <Text style={styles.errText}>{error}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={submit} disabled={loading}>
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.btnText}>เข้าสู่ระบบ</Text>}
          </TouchableOpacity>

          {/* Demo accounts */}
          <View style={styles.hintBox}>
            <Text style={styles.hintTitle}>บัญชี Demo (กดเพื่อเติมอัตโนมัติ)</Text>
            {DEMO_HINTS.map(u => (
              <TouchableOpacity
                key={u.username} style={styles.hintRow}
                onPress={() => { setCred(u.username); setPass(u.password); setError(''); }}
              >
                <Text style={styles.hintPhone}>{u.username}</Text>
                <View style={[styles.roleBadge, { backgroundColor: u.roleBg }]}>
                  <Text style={[styles.roleText, { color: u.roleColor }]}>{u.role}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <Text style={styles.hintNote}>รหัสผ่านทุก account: <Text style={{ fontWeight: '700' }}>1234</Text></Text>
          </View>

          {/* Switch to register */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>ยังไม่มีบัญชี?</Text>
            <TouchableOpacity onPress={() => setView('register')}>
              <Text style={styles.switchLink}>สมัครร้านค้า →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusRow}>
          <View style={styles.greenDot} />
          <Text style={styles.statusText}>ออนไลน์ • เวอร์ชัน 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F8F4F4',
    position: 'relative',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any } : {}),
  },
  shapeTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 400,
    height: 200,
    backgroundColor: '#FF424D',
    borderBottomRightRadius: 160,
  },
  shapeBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 450,
    height: 220,
    backgroundColor: '#FF7078',
    borderTopLeftRadius: 180,
  },

  // Top-right menu
  topRight: {
    position: 'absolute',
    top: 24,
    right: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 5,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 12,
    backgroundColor: '#FF424D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  adminPill: {
    height: 46,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 5,
  },
  adminName: { fontSize: 12, fontWeight: '500', color: '#263238' },

  // Center
  center: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 5,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 32,
    width: '100%',
    maxWidth: 520,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  backText: { fontSize: 12, color: '#7A7F85' },
  cardIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFE6E8',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#263238', textAlign: 'center' },
  cardSub: { fontSize: 12, color: '#7A7F85', textAlign: 'center', marginTop: -8 },

  // Form
  label: { fontSize: 12, fontWeight: '600', color: '#263238' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#FF424D', borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingTop: 12, marginTop: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: '#FAFAFA',
  },
  inputRowErr: { borderColor: '#DC2626' },
  input: { flex: 1, fontSize: 12, color: '#263238' },
  hintText: { fontSize: 13, color: '#7A7F85', marginTop: -6 },
  demoNote: { fontSize: 13, color: '#7A7F85' },
  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 10,
  },
  errText: { fontSize: 12, color: '#DC2626', flex: 1 },
  errTextInline: { fontSize: 12, color: '#DC2626' },

  // OTP boxes
  otpBoxRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  otpCell: {
    width: 44, height: 52, borderRadius: 12,
    borderWidth: 2, borderColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  otpCellFilled: { borderColor: '#FF424D', backgroundColor: '#FFE6E8' },
  otpCellText: { fontSize: 14, color: '#FF424D' },

  // Password rules
  pwdRules: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pwdRule: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pwdRuleText: { fontSize: 13, color: '#B0B5BA' },

  // Summary
  summaryBox: { backgroundColor: '#FFE6E8', borderRadius: 12, padding: 14, gap: 8 },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: '#FF424D' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 12, color: '#7A7F85' },
  summaryValue: { fontSize: 12, fontWeight: '600', color: '#263238' },

  // Buttons
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF424D',
    borderRadius: 14,
    height: 52,
  },
  btnDisabled: { backgroundColor: '#FFCDD2' },
  btnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Demo hint
  hintBox: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  hintTitle: { fontSize: 13, fontWeight: '700', color: '#C62828' },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#FFEBEE',
  },
  hintPhone: { fontSize: 12, fontWeight: '600', color: '#FF424D' },
  roleBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  roleText: { fontSize: 13, fontWeight: '700' },
  hintNote: { fontSize: 13, color: '#C62828', marginTop: 4 },

  // Switch
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  switchText: { fontSize: 12, color: '#7A7F85' },
  switchLink: { fontSize: 12, fontWeight: '700', color: '#FF424D' },

  // Status footer
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  greenDot: { width: 10, height: 10, borderRadius: 8, backgroundColor: '#42B854' },
  statusText: { fontSize: 12, color: '#7A7F85' },

  // Step indicator
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#E0E0E0',
  },
  stepActive: { backgroundColor: '#FF424D', borderColor: '#FF424D' },
  stepDone: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  stepNum: { fontSize: 13, fontWeight: '700', color: '#7A7F85' },
  stepLbl: { fontSize: 12, color: '#7A7F85', textAlign: 'center', maxWidth: 60 },
  stepLine: { width: 32, height: 2, backgroundColor: '#E0E0E0', marginBottom: 20, marginHorizontal: 4 },
});
