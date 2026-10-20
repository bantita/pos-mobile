/**
 * WebCrmConfigScreen — ตั้งค่า CRM > คะแนน/ระดับ
 * แก้ไข pointConfig (earn/redeem/min/expire) + ระดับสมาชิก (threshold/ส่วนลด/ตัวคูณ) — persist ผ่าน memberStore
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { useMemberStore } from '../../store/memberStore';
import { MemberLevelConfig, PointConfig } from '../../types/member';

interface WebCrmConfigScreenProps {
  onBack: () => void;
}

const inputStyle = {
  borderWidth: 1,
  borderColor: WebColors.border,
  borderRadius: 8,
  paddingHorizontal: 10,
  paddingVertical: 8,
  fontSize: 12,
  color: WebColors.text,
} as const;

const labelStyle = { fontSize: 11, fontWeight: '600' as const, color: WebColors.textSecondary, marginBottom: 4 };

/** input ตัวเลข — คุม value เป็น string ภายใน แล้ว parse ตอน save */
const NumField: React.FC<{ label: string; value: string; onChange: (v: string) => void; suffix?: string }> = ({ label, value, onChange, suffix }) => (
  <View style={{ flex: 1, minWidth: 120 }}>
    <Text style={labelStyle}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <TextInput
        style={[inputStyle, { flex: 1 }]}
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^\d.]/g, ''))}
        keyboardType="decimal-pad"
        placeholderTextColor={WebColors.textDisabled}
      />
      {suffix ? <Text style={{ fontSize: 11, color: WebColors.textSecondary }}>{suffix}</Text> : null}
    </View>
  </View>
);

export const WebCrmConfigScreen: React.FC<WebCrmConfigScreenProps> = ({ onBack }) => {
  const pointConfig = useMemberStore((s) => s.pointConfig);
  const levelConfigs = useMemberStore((s) => s.levelConfigs);
  const setPointConfig = useMemberStore((s) => s.setPointConfig);
  const setLevelConfigs = useMemberStore((s) => s.setLevelConfigs);

  // ฟอร์ม local (string) — seed จาก store
  const [pc, setPc] = useState({
    earnRate: String(pointConfig.earnRate),
    redeemRate: String(pointConfig.redeemRate),
    minRedeemPoints: String(pointConfig.minRedeemPoints),
    pointExpireDays: String(pointConfig.pointExpireDays),
  });
  const [levels, setLevels] = useState(
    levelConfigs.map((l) => ({
      ...l,
      _minSpent: String(l.minSpent),
      _minBills: String(l.minBills),
      _discountPercent: String(l.discountPercent),
      _earnMultiplier: String(l.earnMultiplier),
      _expireDays: String(l.expireDays),
    }))
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const num = (v: string) => (v.trim() === '' ? NaN : Number(v));

  const handleSave = () => {
    // validate ขั้นต่ำ
    const pcVals: PointConfig = {
      earnRate: num(pc.earnRate),
      redeemRate: num(pc.redeemRate),
      minRedeemPoints: num(pc.minRedeemPoints),
      pointExpireDays: num(pc.pointExpireDays),
    };
    if (Object.values(pcVals).some((v) => Number.isNaN(v) || v < 0)) {
      setError('กรุณากรอกค่าคะแนนให้เป็นตัวเลขที่ถูกต้อง (ไม่ติดลบ)');
      return;
    }
    if (pcVals.earnRate <= 0) {
      setError('อัตราสะสมคะแนน (บาท/คะแนน) ต้องมากกว่า 0');
      return;
    }

    const nextLevels: MemberLevelConfig[] = [];
    for (const l of levels) {
      const vals = {
        minSpent: num(l._minSpent),
        minBills: num(l._minBills),
        discountPercent: num(l._discountPercent),
        earnMultiplier: num(l._earnMultiplier),
        expireDays: num(l._expireDays),
      };
      if (Object.values(vals).some((v) => Number.isNaN(v) || v < 0)) {
        setError(`ค่าของระดับ "${l.label}" ไม่ถูกต้อง`);
        return;
      }
      nextLevels.push({
        level: l.level,
        label: l.label,
        color: l.color,
        ...vals,
      });
    }

    setError('');
    setPointConfig(pcVals);
    setLevelConfigs(nextLevels);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateLevel = (idx: number, key: string, value: string) => {
    setLevels((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }} onPress={onBack}>
        <Ionicons name="arrow-back" size={18} color={WebColors.primary} />
        <Text style={{ fontSize: 12, color: WebColors.primary, fontWeight: '600' }}>ตั้งค่า</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 20, fontWeight: '700', color: WebColors.text }}>ตั้งค่า CRM — คะแนน / ระดับ</Text>
      <Text style={{ fontSize: 13, color: WebColors.textSecondary, marginTop: 2 }}>
        กำหนดอัตราสะสม/แลกคะแนน และเกณฑ์ระดับสมาชิก (ยอดซื้อ/ส่วนลด/ตัวคูณคะแนน)
      </Text>

      {error ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: WebColors.dangerLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Ionicons name="alert-circle" size={14} color={WebColors.danger} />
          <Text style={{ fontSize: 11, color: WebColors.danger }}>{error}</Text>
        </View>
      ) : null}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingVertical: 16 }}>
        {/* Point Config */}
        <View style={{ backgroundColor: WebColors.white, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: WebColors.border, gap: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: WebColors.text }}>การตั้งค่าคะแนนสะสม</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <NumField label="สะสมคะแนน (บาท/1 คะแนน)" value={pc.earnRate} onChange={(v) => setPc((s) => ({ ...s, earnRate: v }))} suffix="บาท" />
            <NumField label="แลกคะแนน (1 คะแนน = ? บาท)" value={pc.redeemRate} onChange={(v) => setPc((s) => ({ ...s, redeemRate: v }))} suffix="บาท" />
            <NumField label="คะแนนขั้นต่ำที่แลกได้" value={pc.minRedeemPoints} onChange={(v) => setPc((s) => ({ ...s, minRedeemPoints: v }))} suffix="คะแนน" />
            <NumField label="คะแนนหมดอายุ (0 = ไม่หมด)" value={pc.pointExpireDays} onChange={(v) => setPc((s) => ({ ...s, pointExpireDays: v }))} suffix="วัน" />
          </View>
        </View>

        {/* Level Configs */}
        <View style={{ backgroundColor: WebColors.white, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: WebColors.border, gap: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: WebColors.text }}>ระดับสมาชิก</Text>
          {levels.length === 0 ? (
            <Text style={{ fontSize: 12, color: WebColors.textSecondary }}>ไม่มีข้อมูลระดับสมาชิก</Text>
          ) : (
            levels.map((l, idx) => (
              <View key={l.level} style={{ borderWidth: 1, borderColor: WebColors.border, borderRadius: 10, padding: 12, gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: l.color }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: WebColors.text }}>{l.label}</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  <NumField label="ยอดซื้อขั้นต่ำ" value={l._minSpent} onChange={(v) => updateLevel(idx, '_minSpent', v)} suffix="บาท" />
                  <NumField label="จำนวนบิลขั้นต่ำ" value={l._minBills} onChange={(v) => updateLevel(idx, '_minBills', v)} suffix="บิล" />
                  <NumField label="ส่วนลด" value={l._discountPercent} onChange={(v) => updateLevel(idx, '_discountPercent', v)} suffix="%" />
                  <NumField label="ตัวคูณคะแนน" value={l._earnMultiplier} onChange={(v) => updateLevel(idx, '_earnMultiplier', v)} suffix="x" />
                  <NumField label="คะแนนหมดอายุ" value={l._expireDays} onChange={(v) => updateLevel(idx, '_expireDays', v)} suffix="วัน" />
                </View>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: saved ? WebColors.success : WebColors.primary, borderRadius: 8, paddingVertical: 12, alignSelf: 'flex-start', paddingHorizontal: 24 }}
          onPress={handleSave}
        >
          <Ionicons name={saved ? 'checkmark' : 'save-outline'} size={16} color={WebColors.white} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: WebColors.white }}>{saved ? 'บันทึกแล้ว' : 'บันทึก'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
