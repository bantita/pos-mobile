/**
 * WebLicenseScreen — ใบอนุญาต / แพ็กเกจการใช้งาน (web-only)
 * อ่านสถานะ license (licenseKey/licenseActivated) จาก storeConfigStore (เพิ่มใน FEAT-002)
 *
 * NOTE: ข้อมูลแพ็กเกจ (tier / features / วันหมดอายุ) เป็น MOCK DATA เท่านั้น
 *   เพราะในซอร์สโค้ดยังไม่มี helper getPlanTier/getFeaturesByPlan
 *   เมื่อมี backend/plan service จริงให้แทนที่ค่าในค่าคงที่ PLAN ด้านล่าง
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { Space, Radius, Font } from '../../design-system/tokens';
import { useStoreConfigStore } from '../../store/storeConfigStore';

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// getPlanTier() / getFeaturesByPlan() ไม่มีอยู่ในซอร์ส → ใช้ข้อมูลจำลองด้านล่าง
interface PlanTier {
  tier: string;
  label: string;
  expiry: string;
  features: string[];
}

const PLAN: PlanTier = {
  tier: 'PROFESSIONAL',
  label: 'แพ็กเกจมืออาชีพ',
  expiry: '31/12/2568',
  features: [
    'ขายหน้าร้าน (POS) ไม่จำกัดจำนวนบิล',
    'จัดการสินค้าและคลังสินค้า',
    'ระบบสมาชิก (CRM) และสะสมแต้ม',
    'รายงานยอดขายและกำไรขั้นสูง',
    'ออกใบกำกับภาษีเต็มรูป',
    'รองรับหลายสาขาและหลายจุดขาย',
  ],
};

function maskLicenseKey(key: string): string {
  if (!key) return '-';
  if (key.length <= 4) return key;
  const visible = key.slice(-4);
  return `${'•'.repeat(Math.max(4, key.length - 4))}${visible}`;
}

export const WebLicenseScreen: React.FC = () => {
  const licenseKey = useStoreConfigStore((s) => s.licenseKey);
  const licenseActivated = useStoreConfigStore((s) => s.licenseActivated);

  // loading สั้น ๆ ระหว่างรอ store hydrate
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const t = setTimeout(() => setLoading(false), 200);
      return () => clearTimeout(t);
    } catch (e) {
      setError('ไม่สามารถโหลดข้อมูลใบอนุญาตได้');
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <View style={st.center}>
        <Ionicons name="hourglass-outline" size={40} color={WebColors.primary} />
        <Text style={st.centerText}>กำลังโหลดข้อมูลใบอนุญาต...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={st.center}>
        <Ionicons name="alert-circle-outline" size={44} color={WebColors.danger} />
        <Text style={[st.centerText, { color: WebColors.danger }]}>{error}</Text>
      </View>
    );
  }

  // empty state — ยังไม่เปิดใช้งานและไม่มีคีย์เลย
  if (!licenseActivated && !licenseKey) {
    return (
      <ScrollView style={st.container} contentContainerStyle={st.content}>
        <Text style={st.title}>ใบอนุญาต / แพ็กเกจการใช้งาน</Text>
        <View style={st.empty}>
          <Ionicons name="key-outline" size={48} color={WebColors.textDisabled} />
          <Text style={st.emptyText}>ยังไม่มีข้อมูลใบอนุญาต</Text>
          <Text style={st.emptySub}>กรุณาเปิดใช้งานระบบด้วยคีย์ใบอนุญาตของคุณ</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>
      <Text style={st.title}>ใบอนุญาต / แพ็กเกจการใช้งาน</Text>

      {/* ── สถานะใบอนุญาต ── */}
      <View style={st.card}>
        <View style={st.cardHead}>
          <Ionicons name="shield-checkmark-outline" size={20} color={WebColors.primary} />
          <Text style={st.cardTitle}>สถานะใบอนุญาต</Text>
          <View
            style={[
              st.badge,
              { backgroundColor: licenseActivated ? WebColors.successLight : WebColors.warningLight },
            ]}
          >
            <Text
              style={[
                st.badgeText,
                { color: licenseActivated ? WebColors.success : WebColors.warning },
              ]}
            >
              {licenseActivated ? 'เปิดใช้งานแล้ว' : 'ยังไม่เปิดใช้งาน'}
            </Text>
          </View>
        </View>

        <View style={st.row}>
          <Text style={st.label}>คีย์ใบอนุญาต</Text>
          <Text style={st.value}>{maskLicenseKey(licenseKey)}</Text>
        </View>
      </View>

      {/* ── แพ็กเกจปัจจุบัน (MOCK) ── */}
      <View style={st.card}>
        <View style={st.cardHead}>
          <Ionicons name="pricetag-outline" size={20} color={WebColors.primary} />
          <Text style={st.cardTitle}>แพ็กเกจปัจจุบัน</Text>
          <View style={[st.badge, { backgroundColor: WebColors.primaryLight }]}>
            <Text style={[st.badgeText, { color: WebColors.primaryDark }]}>{PLAN.tier}</Text>
          </View>
        </View>

        <View style={st.row}>
          <Text style={st.label}>ชื่อแพ็กเกจ</Text>
          <Text style={st.value}>{PLAN.label}</Text>
        </View>
        <View style={st.row}>
          <Text style={st.label}>วันหมดอายุ</Text>
          <Text style={st.value}>{PLAN.expiry}</Text>
        </View>
      </View>

      {/* ── ฟีเจอร์ที่ใช้ได้ (MOCK) ── */}
      <View style={st.card}>
        <View style={st.cardHead}>
          <Ionicons name="list-outline" size={20} color={WebColors.primary} />
          <Text style={st.cardTitle}>ฟีเจอร์ที่ใช้งานได้</Text>
        </View>
        {PLAN.features.map((f, i) => (
          <View key={i} style={st.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color={WebColors.success} />
            <Text style={st.featureText}>{f}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: WebColors.contentBg },
  content: { padding: Space.xl, gap: Space.lg },
  title: { ...Font.h2, color: WebColors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.md, backgroundColor: WebColors.contentBg },
  centerText: { ...Font.body, color: WebColors.textSecondary },
  empty: { alignItems: 'center', paddingVertical: Space['3xl'], gap: Space.sm },
  emptyText: { ...Font.h4, color: WebColors.textSecondary },
  emptySub: { ...Font.bodySm, color: WebColors.textDisabled },
  card: {
    backgroundColor: WebColors.cardBg,
    borderRadius: Radius.md,
    padding: Space.lg,
    gap: Space.md,
    borderWidth: 1,
    borderColor: WebColors.cardBorder,
    maxWidth: 560,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  cardTitle: { ...Font.h4, color: WebColors.text, flex: 1 },
  badge: { paddingHorizontal: Space.md, paddingVertical: Space.xs, borderRadius: Radius.full },
  badgeText: { ...Font.badge },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...Font.bodySm, color: WebColors.textSecondary },
  value: { ...Font.label, color: WebColors.text },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  featureText: { ...Font.body, color: WebColors.text, flex: 1 },
});
