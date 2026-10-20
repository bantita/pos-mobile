/**
 * WebRichMenuScreen (2G) — จัดการ LINE Rich Menu (6 ปุ่ม)
 * พรีวิว 6 ช่อง (2×3) + แก้ไขแต่ละปุ่ม + บันทึก/เผยแพร่ (mock, gated MOCK_LINE)
 * ใช้ WebColors + design-system tokens, ข้อความภาษาไทย, มี loading/error/empty state
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { Colors, Space, Radius, Shadow, Font } from '../../design-system/tokens';
import { FEATURE_FLAGS } from '../../config/featureFlags';
import { useRichMenuStore, RichMenuActionType, RICH_MENU_SLOTS } from '../../store/richMenuStore';
// import { lineApi } from '../../services/api/lineApi'; // ใช้เมื่อ MOCK_LINE = false (เผยแพร่ Rich Menu จริง)

const ACTION_TYPES: { key: RichMenuActionType; label: string; icon: string }[] = [
  { key: 'uri', label: 'เปิดลิงก์ (URL)', icon: 'link-outline' },
  { key: 'message', label: 'ส่งข้อความ', icon: 'chatbubble-outline' },
  { key: 'liff', label: 'เปิด LIFF', icon: 'apps-outline' },
];

const actionMeta = (t: RichMenuActionType) => ACTION_TYPES.find(a => a.key === t)!;

interface Props {
  onBack: () => void;
}

export const WebRichMenuScreen: React.FC<Props> = ({ onBack }) => {
  const { menuName, buttons, isPublished, lastPublishedAt, setMenuName, updateButton, publish } = useRichMenuStore();
  const [selected, setSelected] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // จำลองการโหลดค่า Rich Menu จาก backend (mock — จบทันที)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const handlePublish = () => {
    setError('');
    const empty = buttons.findIndex(b => !b.label.trim() || !b.value.trim());
    if (empty !== -1) {
      setError(`กรุณากรอกข้อมูลปุ่มช่องที่ ${empty + 1} ให้ครบ`);
      return;
    }
    if (FEATURE_FLAGS.MOCK_LINE) {
      // MOCK: เก็บ config ลง store ภายในแอป ไม่เผยแพร่จริง
      publish();
    } else {
      // เมื่อปิด mock: เผยแพร่ Rich Menu จริงผ่าน LINE OA
      // lineApi.createRichMenu(...) + setDefaultRichMenu(...)
      publish();
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const btn = buttons[selected];

  // ─── Loading state ──
  if (loading) {
    return (
      <View style={s.root}>
        <Header onBack={onBack} />
        <View style={s.center}>
          <ActivityIndicator size="large" color={WebColors.primary} />
          <Text style={s.centerText}>กำลังโหลด Rich Menu...</Text>
        </View>
      </View>
    );
  }

  // ─── Empty state (ไม่มีปุ่มเลย) ──
  if (!buttons || buttons.length === 0) {
    return (
      <View style={s.root}>
        <Header onBack={onBack} />
        <View style={s.center}>
          <Ionicons name="grid-outline" size={40} color={WebColors.gray300} />
          <Text style={s.centerText}>ไม่มีข้อมูล Rich Menu</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <Header onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: Space.lg, gap: Space.lg }} showsVerticalScrollIndicator={false}>
        {/* MOCK note */}
        <View style={s.noteBox}>
          <Ionicons name="information-circle-outline" size={16} color={WebColors.info} />
          <Text style={s.noteText}>
            โหมดจำลอง: บันทึก Rich Menu ภายในแอปเท่านั้น — การเผยแพร่จริงต้องมี LINE Official Account และ Messaging API
          </Text>
        </View>

        {error ? (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={WebColors.danger} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Menu name */}
        <View style={s.card}>
          <Text style={s.label}>ชื่อ Rich Menu</Text>
          <TextInput style={s.input} value={menuName} onChangeText={setMenuName} placeholder="ชื่อเมนู" placeholderTextColor={WebColors.textDisabled} />
        </View>

        {/* 6-cell preview (2 rows × 3 cols) */}
        <View style={s.card}>
          <Text style={s.cardTitle}>ตัวอย่างเมนู ({RICH_MENU_SLOTS} ช่อง)</Text>
          <View style={s.grid}>
            {buttons.map((b, i) => {
              const active = selected === i;
              return (
                <TouchableOpacity key={i} style={[s.cell, active && s.cellActive]} onPress={() => setSelected(i)}>
                  <Ionicons name={actionMeta(b.actionType).icon as any} size={18} color={active ? WebColors.primary : WebColors.textSecondary} />
                  <Text style={[s.cellLabel, active && { color: WebColors.primary }]} numberOfLines={1}>{b.label || `ช่อง ${i + 1}`}</Text>
                  <Text style={s.cellType} numberOfLines={1}>{actionMeta(b.actionType).label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Per-button editor */}
        <View style={s.card}>
          <Text style={s.cardTitle}>แก้ไขปุ่มช่องที่ {selected + 1}</Text>

          <Text style={s.label}>ป้ายกำกับ</Text>
          <TextInput style={s.input} value={btn.label} onChangeText={(v) => updateButton(selected, { label: v })} placeholder="ชื่อปุ่ม" placeholderTextColor={WebColors.textDisabled} />

          <Text style={[s.label, { marginTop: Space.md }]}>ชนิดการทำงาน</Text>
          <View style={s.typeRow}>
            {ACTION_TYPES.map(a => {
              const sel = btn.actionType === a.key;
              return (
                <TouchableOpacity key={a.key} style={[s.typePill, sel && s.typePillActive]} onPress={() => updateButton(selected, { actionType: a.key })}>
                  <Ionicons name={a.icon as any} size={14} color={sel ? WebColors.white : WebColors.textSecondary} />
                  <Text style={[s.typePillText, sel && { color: WebColors.white }]}>{a.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[s.label, { marginTop: Space.md }]}>
            {btn.actionType === 'uri' ? 'URL' : btn.actionType === 'message' ? 'ข้อความ' : 'LIFF ID'}
          </Text>
          <TextInput
            style={s.input}
            value={btn.value}
            onChangeText={(v) => updateButton(selected, { value: v })}
            placeholder={btn.actionType === 'uri' ? 'https://...' : btn.actionType === 'message' ? 'ข้อความที่จะส่ง' : 'liff-xxxxx'}
            placeholderTextColor={WebColors.textDisabled}
          />
        </View>

        {/* Save / publish */}
        <View style={s.footer}>
          <View style={{ flex: 1 }}>
            {isPublished && lastPublishedAt ? (
              <Text style={s.publishedText}>เผยแพร่ล่าสุด: {new Date(lastPublishedAt).toLocaleString('th-TH')}</Text>
            ) : (
              <Text style={s.publishedText}>ยังไม่เผยแพร่</Text>
            )}
            {saved && <Text style={s.savedText}>✓ บันทึก/เผยแพร่เรียบร้อย (mock)</Text>}
          </View>
          <TouchableOpacity style={s.primaryBtn} onPress={handlePublish}>
            <Ionicons name="cloud-upload-outline" size={16} color={WebColors.white} />
            <Text style={s.primaryBtnText}>บันทึก / เผยแพร่</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const Header: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <View style={s.header}>
    <TouchableOpacity style={s.backBtn} onPress={onBack}>
      <Ionicons name="arrow-back" size={18} color={WebColors.primary} />
      <Text style={s.backText}>ตั้งค่า</Text>
    </TouchableOpacity>
    <Text style={s.title}>LINE Rich Menu</Text>
  </View>
);

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: { paddingHorizontal: Space.lg, paddingTop: Space.lg, paddingBottom: Space.sm },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Space.sm },
  backText: { fontSize: 13, color: WebColors.primary, fontWeight: '600' },
  title: { ...Font.h2, color: Colors.text },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.md, padding: Space['2xl'] },
  centerText: { fontSize: 14, color: WebColors.textSecondary },

  card: { backgroundColor: WebColors.cardBg, borderRadius: Radius.md, borderWidth: 1, borderColor: WebColors.cardBorder, padding: Space.lg, ...Shadow.sm },
  cardTitle: { ...Font.h4, color: Colors.text, marginBottom: Space.md },

  noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: WebColors.infoLight, borderRadius: Radius.sm, padding: Space.md },
  noteText: { flex: 1, fontSize: 13, color: WebColors.info, lineHeight: 18 },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: WebColors.dangerLight, borderRadius: Radius.sm, padding: Space.md },
  errorText: { flex: 1, fontSize: 13, color: WebColors.danger, fontWeight: '500' },

  label: { ...Font.label, color: WebColors.textSecondary, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Space.md, paddingVertical: 10, fontSize: 14, color: Colors.text, backgroundColor: WebColors.white },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  cell: { width: '31.5%', minHeight: 72, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Space.sm, gap: 4 },
  cellActive: { borderColor: WebColors.primary, backgroundColor: WebColors.primaryLight },
  cellLabel: { fontSize: 13, fontWeight: '600', color: Colors.text },
  cellType: { fontSize: 11, color: WebColors.textSecondary },

  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  typePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Space.md, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
  typePillActive: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  typePillText: { fontSize: 13, color: WebColors.textSecondary, fontWeight: '500' },

  footer: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  publishedText: { fontSize: 13, color: WebColors.textSecondary },
  savedText: { fontSize: 13, color: WebColors.success, fontWeight: '600', marginTop: 2 },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WebColors.primary, borderRadius: Radius.sm, paddingHorizontal: Space.lg, paddingVertical: 12 },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: WebColors.white },
});
