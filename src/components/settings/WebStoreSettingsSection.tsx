/**
 * WebStoreSettingsSection — Store type selector + service charge config
 * Requirement 1.1, 1.3, 2.1, 2.3, 3.1, 3.2, 3.3, 3.4
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { StoreType, BusinessType, BusinessScale, ServiceChargeConfig } from '../../types/store';
import * as storeConfigStore from '../../store/storeConfigStore';
import { useAuthStore } from '../../store/authStore';

interface Props {
  onBack: () => void;
}

const BIZ_TYPES: { type: BusinessType; icon: string; label: string; desc: string; color: string }[] = [
  { type: 'SERVICE', icon: 'cut-outline', label: 'ร้านบริการ', desc: 'ตัดผม, สปา, นวด, เสริมสวย', color: '#7C3AED' },
  { type: 'RETAIL', icon: 'storefront-outline', label: 'ร้านค้าปลีก/ค้าส่ง', desc: 'ร้านค้า, คาเฟ่, ร้านอาหาร', color: WebColors.primary },
];

const BIZ_SCALES: { scale: BusinessScale; icon: string; label: string; desc: string; color: string }[] = [
  { scale: 'BUSINESS', icon: 'home-outline', label: 'Business', desc: 'ร้านเดียว หลายจุดขาย', color: '#0EA5E9' },
  { scale: 'ENTERPRISE', icon: 'business-outline', label: 'Enterprise', desc: 'หลายสาขา หลายจุดขาย', color: WebColors.success },
];

export const WebStoreSettingsSection: React.FC<Props> = ({ onBack }) => {
  const user = useAuthStore(s => s.user);
  const isOwner = user?.role === 'owner';

  const config = storeConfigStore.getStoreConfig();
  const [selectedBizType, setSelectedBizType] = useState<BusinessType>(config.businessType || 'RETAIL');
  const [selectedBizScale, setSelectedBizScale] = useState<BusinessScale>(config.businessScale || 'BUSINESS');
  const [scEnabled, setScEnabled] = useState(config.serviceCharge.enabled);
  const [scMode, setScMode] = useState<'percentage' | 'fixed'>(config.serviceCharge.mode);
  const [scValue, setScValue] = useState(String(config.serviceCharge.value));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const validateAndSave = () => {
    const numValue = parseFloat(scValue);
    if (isNaN(numValue) || numValue < 0) {
      setError('กรุณาระบุค่าที่ถูกต้อง (ตัวเลข ≥ 0)');
      return;
    }
    if (scMode === 'percentage' && numValue > 100) {
      setError('เปอร์เซ็นต์ต้องอยู่ระหว่าง 0-100');
      return;
    }
    setError('');

    // Save store type (2 มิติ)
    const { useStoreConfigStore } = require('../../store/storeConfigStore');
    const store = useStoreConfigStore.getState();
    store.setBusinessType(selectedBizType);
    store.setBusinessScale(selectedBizScale);
    store.setStoreType(selectedBizScale === 'ENTERPRISE' ? 'ENTERPRISE' : selectedBizType);

    // Save service charge config
    const scConfig: ServiceChargeConfig = {
      enabled: scEnabled,
      mode: scMode,
      value: numValue,
    };
    storeConfigStore.setServiceCharge(scConfig);

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color={WebColors.primary} />
          <Text style={s.backText}>ตั้งค่า</Text>
        </TouchableOpacity>
        <Text style={s.title}>ประเภทร้านค้า & Service Charge</Text>
      </View>

      {/* Store Type Selector — 2 มิติ */}
      {isOwner ? (
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="storefront-outline" size={18} color={WebColors.primary} />
            <Text style={s.cardTitle}>ประเภทธุรกิจ</Text>
          </View>
          <Text style={s.cardSub}>เลือกประเภทธุรกิจของคุณ</Text>

          <View style={s.typeGrid}>
            {BIZ_TYPES.map(st => {
              const isActive = selectedBizType === st.type;
              return (
                <TouchableOpacity
                  key={st.type}
                  style={[s.typeBtn, isActive && { borderColor: st.color, backgroundColor: st.color + '10' }]}
                  onPress={() => setSelectedBizType(st.type)}
                  activeOpacity={0.7}
                >
                  <View style={[s.typeIcon, { backgroundColor: st.color + '18' }]}>
                    <Ionicons name={st.icon as any} size={24} color={st.color} />
                  </View>
                  <Text style={[s.typeLabel, isActive && { color: st.color }]}>{st.label}</Text>
                  <Text style={s.typeDesc}>{st.desc}</Text>
                  {isActive && (
                    <View style={[s.checkCircle, { backgroundColor: st.color }]}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[s.cardHeader, { marginTop: 20 }]}>
            <Ionicons name="resize-outline" size={18} color="#0EA5E9" />
            <Text style={s.cardTitle}>ขนาดธุรกิจ</Text>
          </View>
          <Text style={s.cardSub}>ร้านเดียว หรือ หลายสาขา</Text>

          <View style={s.typeGrid}>
            {BIZ_SCALES.map(st => {
              const isActive = selectedBizScale === st.scale;
              return (
                <TouchableOpacity
                  key={st.scale}
                  style={[s.typeBtn, isActive && { borderColor: st.color, backgroundColor: st.color + '10' }]}
                  onPress={() => setSelectedBizScale(st.scale)}
                  activeOpacity={0.7}
                >
                  <View style={[s.typeIcon, { backgroundColor: st.color + '18' }]}>
                    <Ionicons name={st.icon as any} size={24} color={st.color} />
                  </View>
                  <Text style={[s.typeLabel, isActive && { color: st.color }]}>{st.label}</Text>
                  <Text style={s.typeDesc}>{st.desc}</Text>
                  {isActive && (
                    <View style={[s.checkCircle, { backgroundColor: st.color }]}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="lock-closed-outline" size={18} color={WebColors.textSecondary} />
            <Text style={s.cardTitle}>ประเภทร้านค้า</Text>
          </View>
          <Text style={s.cardSub}>เฉพาะเจ้าของร้าน (Owner) เท่านั้นที่สามารถเปลี่ยนได้</Text>
          <View style={[s.typeBtn, { borderColor: WebColors.border, opacity: 0.6 }]}>
            <Text style={s.typeLabel}>ประเภท: {config.businessType || config.storeType} · ขนาด: {config.businessScale || 'BUSINESS'}</Text>
          </View>
        </View>
      )}

      {/* Service Charge Configuration */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Ionicons name="receipt-outline" size={18} color={WebColors.primary} />
          <Text style={s.cardTitle}>Service Charge (ค่าบริการ)</Text>
        </View>
        <Text style={s.cardSub}>ตั้งค่า service charge ที่จะคำนวณเพิ่มจากยอดรวม</Text>

        {/* Enable/Disable Toggle */}
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>เปิดใช้งาน Service Charge</Text>
            <Text style={s.fieldSub}>{scEnabled ? 'เปิดอยู่ — จะแสดงในบิลขาย' : 'ปิดอยู่ — จะไม่คิด service charge'}</Text>
          </View>
          <Switch
            value={scEnabled}
            onValueChange={setScEnabled}
            trackColor={{ true: WebColors.primary, false: WebColors.gray300 }}
          />
        </View>

        {scEnabled && (
          <>
            {/* Mode Picker */}
            <View style={s.section}>
              <Text style={s.fieldLabel}>โหมดการคิดค่าบริการ</Text>
              <View style={s.modeRow}>
                <TouchableOpacity
                  style={[s.modeBtn, scMode === 'percentage' && s.modeBtnActive]}
                  onPress={() => setScMode('percentage')}
                >
                  <Ionicons name="trending-up-outline" size={16} color={scMode === 'percentage' ? '#fff' : WebColors.textSecondary} />
                  <Text style={[s.modeBtnText, scMode === 'percentage' && s.modeBtnTextActive]}>เปอร์เซ็นต์ (%)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.modeBtn, scMode === 'fixed' && s.modeBtnActive]}
                  onPress={() => setScMode('fixed')}
                >
                  <Ionicons name="cash-outline" size={16} color={scMode === 'fixed' ? '#fff' : WebColors.textSecondary} />
                  <Text style={[s.modeBtnText, scMode === 'fixed' && s.modeBtnTextActive]}>จำนวนเงินคงที่ (฿)</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Value Input */}
            <View style={s.section}>
              <Text style={s.fieldLabel}>
                {scMode === 'percentage' ? 'เปอร์เซ็นต์ (0-100)' : 'จำนวนเงิน (บาท)'}
              </Text>
              <View style={s.inputRow}>
                <TextInput
                  style={[s.input, error ? s.inputError : null]}
                  value={scValue}
                  onChangeText={(v) => { setScValue(v); setError(''); }}
                  keyboardType="numeric"
                  placeholder={scMode === 'percentage' ? 'เช่น 10' : 'เช่น 50'}
                  placeholderTextColor={WebColors.textDisabled}
                />
                <Text style={s.inputSuffix}>{scMode === 'percentage' ? '%' : '฿'}</Text>
              </View>
              {error ? <Text style={s.errorText}>{error}</Text> : null}
            </View>
          </>
        )}
      </View>

      {/* Save Button */}
      <TouchableOpacity style={s.saveBtn} onPress={validateAndSave}>
        <Ionicons name={saved ? 'checkmark-circle' : 'save-outline'} size={16} color="#fff" />
        <Text style={s.saveBtnText}>{saved ? 'บันทึกแล้ว ✓' : 'บันทึกการตั้งค่า'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const s = StyleSheet.create({
  root: { gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: WebColors.primaryLight },
  backText: { fontSize: 13, color: WebColors.primary, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '800', color: WebColors.text },
  card: { backgroundColor: WebColors.white, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: WebColors.border, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: WebColors.text },
  cardSub: { fontSize: 12, color: WebColors.textSecondary, marginTop: -4 },
  typeGrid: { flexDirection: 'row', gap: 12, marginTop: 4 },
  typeBtn: { flex: 1, borderWidth: 2, borderColor: WebColors.border, borderRadius: 12, padding: 16, alignItems: 'center', gap: 8, position: 'relative' },
  typeIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: 13, fontWeight: '800', color: WebColors.text },
  typeDesc: { fontSize: 11, color: WebColors.textSecondary, textAlign: 'center', lineHeight: 16 },
  checkCircle: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: WebColors.border },
  section: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: WebColors.text },
  fieldSub: { fontSize: 11, color: WebColors.textSecondary, marginTop: 2 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: WebColors.white },
  modeBtnActive: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  modeBtnText: { fontSize: 12, fontWeight: '600', color: WebColors.textSecondary },
  modeBtnTextActive: { color: '#fff' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: WebColors.text, backgroundColor: WebColors.white },
  inputError: { borderColor: WebColors.danger },
  inputSuffix: { fontSize: 14, fontWeight: '700', color: WebColors.textSecondary },
  errorText: { fontSize: 11, color: WebColors.danger, marginTop: 2 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: WebColors.primary, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
