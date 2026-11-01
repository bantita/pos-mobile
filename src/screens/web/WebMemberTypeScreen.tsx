/**
 * WebMemberTypeScreen — จัดการประเภทสมาชิก (ลูกค้าทั่วไป / พนักงาน ฯลฯ)
 * แสดงใน CRM back-office (เมนู "ประเภทสมาชิก" ถัดจาก "ระดับสมาชิก")
 * ประเภทสมาชิกแยกจากระดับสมาชิก: กำหนดส่วนลดอัตโนมัติ / สะสมคะแนน / ตัวคูณคะแนน
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, Modal, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { Space, Radius, Shadow, Font } from '../../design-system/tokens';
import { MEMBER_TYPE_COLOR_OPTIONS, getMemberTypeColors } from '../../constants/memberTypeColors';
import { MemberType, MemberTypeColorKey } from '../../types/memberType';
import { useMemberStore } from '../../store/memberStore';
import {
  useMemberTypeStore,
  getMemberTypeCounts,
  addMemberType,
  updateMemberType,
  setDefaultMemberType,
  deleteMemberType,
  reassignAndDeleteMemberType,
  MemberTypeResult,
} from '../../store/memberTypeStore';

const TOUCH = 44;

interface FormState {
  id?: string;
  name: string;
  description: string;
  color: MemberTypeColorKey;
  discount: string;
  earnPoints: boolean;
  multiplier: string;
  isDefault: boolean;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  name: '', description: '', color: 'gray', discount: '0', earnPoints: true, multiplier: '1', isDefault: false, active: true,
};

const toForm = (t: MemberType): FormState => ({
  id: t.id,
  name: t.name,
  description: t.description ?? '',
  color: t.color,
  discount: String(t.discountPercent),
  earnPoints: t.earnPoints,
  multiplier: String(t.pointMultiplier),
  isDefault: t.isDefault,
  active: t.status === 'active',
});

/** ป้ายประเภทสมาชิก (สีจาก token) — ใช้ซ้ำในหน้าอื่นของ web */
export const MemberTypeBadge: React.FC<{ name: string; color?: MemberTypeColorKey | string; inactive?: boolean }> = ({ name, color, inactive }) => {
  const c = getMemberTypeColors(color, 'web');
  return (
    <View style={[st.badge, { backgroundColor: c.bg }]}>
      <Text style={[st.badgeText, { color: c.fg }]} numberOfLines={1}>{name}{inactive ? ' (ปิดใช้งาน)' : ''}</Text>
    </View>
  );
};

export const WebMemberTypeScreen: React.FC = () => {
  const types = useMemberTypeStore(s => s.types);
  const members = useMemberStore(s => s.members);
  const counts = useMemo(() => getMemberTypeCounts(members), [members, types]);

  // Loading: รอ rehydrate ของ persist ก่อนแสดงข้อมูล
  const [hydrated, setHydrated] = useState<boolean>(() => useMemberTypeStore.persist?.hasHydrated?.() ?? true);
  useEffect(() => {
    if (hydrated) return undefined;
    const unsub = useMemberTypeStore.persist?.onFinishHydration?.(() => setHydrated(true));
    if (useMemberTypeStore.persist?.hasHydrated?.()) setHydrated(true);
    return unsub;
  }, [hydrated]);

  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState('');
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<MemberType | null>(null);
  const [reassignTo, setReassignTo] = useState('');

  const patch = (p: Partial<FormState>) => setForm(f => (f ? { ...f, ...p } : f));
  const editingDefault = !!form?.id && types.find(t => t.id === form.id)?.isDefault === true;

  const handleSave = () => {
    if (!form) return;
    const payload = {
      name: form.name,
      description: form.description,
      color: form.color,
      discountPercent: parseFloat(form.discount),
      earnPoints: form.earnPoints,
      pointMultiplier: parseFloat(form.multiplier),
      isDefault: form.isDefault,
      status: form.active ? 'active' as const : 'inactive' as const,
    };
    const res: MemberTypeResult = form.id ? updateMemberType(form.id, payload) : addMemberType(payload);
    if (!res.ok) { setFormError(res.error); return; }
    setForm(null);
    setFormError('');
  };

  const handleSetDefault = (t: MemberType) => {
    const res = setDefaultMemberType(t.id);
    if (!res.ok) setError(res.error);
  };

  const openDelete = (t: MemberType) => {
    const others = types.filter(x => x.id !== t.id && x.status === 'active');
    setReassignTo(others.find(x => x.isDefault)?.id ?? others[0]?.id ?? '');
    setDeleteTarget(t);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const inUse = (counts[deleteTarget.id] ?? 0) > 0;
    const res = inUse ? reassignAndDeleteMemberType(deleteTarget.id, reassignTo) : deleteMemberType(deleteTarget.id);
    if (!res.ok) setError(res.error);
    setDeleteTarget(null);
  };

  if (!hydrated) {
    return (
      <View style={st.center}>
        <ActivityIndicator color={WebColors.primary} />
        <Text style={st.muted}>กำลังโหลด...</Text>
      </View>
    );
  }

  const deleteCount = deleteTarget ? counts[deleteTarget.id] ?? 0 : 0;
  const reassignOptions = deleteTarget ? types.filter(x => x.id !== deleteTarget.id && x.status === 'active') : [];

  return (
    <View>
      <View style={st.headerRow}>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Text style={st.pageTitle}>ประเภทสมาชิก</Text>
          <Text style={st.subtitle}>กำหนดกลุ่มลูกค้า เช่น ลูกค้าทั่วไป / พนักงาน พร้อมส่วนลดอัตโนมัติและกฎการสะสมคะแนน (แยกจากระดับสมาชิก)</Text>
        </View>
        {!form && (
          <TouchableOpacity style={st.primaryBtn} onPress={() => { setForm({ ...EMPTY_FORM }); setFormError(''); }} accessibilityRole="button">
            <Ionicons name="add-circle" size={16} color={WebColors.white} />
            <Text style={st.primaryBtnTxt}>เพิ่มประเภทสมาชิก</Text>
          </TouchableOpacity>
        )}
      </View>

      {!!error && (
        <View style={st.errorBanner} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={16} color={WebColors.danger} />
          <Text style={st.errorText}>{error}</Text>
          <TouchableOpacity style={st.iconBtn} onPress={() => setError('')} accessibilityLabel="ปิดข้อความ">
            <Ionicons name="close" size={16} color={WebColors.danger} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Form ── */}
      {form && (
        <View style={st.card}>
          <Text style={st.cardTitle}>{form.id ? 'แก้ไขประเภทสมาชิก' : 'เพิ่มประเภทสมาชิก'}</Text>
          <View style={st.formRow}>
            <View style={[st.field, { flex: 1 }]}>
              <Text style={st.fieldLabel}>ชื่อประเภท <Text style={{ color: WebColors.danger }}>*</Text></Text>
              <TextInput style={st.input} value={form.name} onChangeText={v => patch({ name: v })} placeholder="เช่น พนักงาน" placeholderTextColor={WebColors.textDisabled} />
            </View>
            <View style={[st.field, { flex: 2 }]}>
              <Text style={st.fieldLabel}>รายละเอียด</Text>
              <TextInput style={st.input} value={form.description} onChangeText={v => patch({ description: v })} placeholder="คำอธิบายประเภทนี้" placeholderTextColor={WebColors.textDisabled} />
            </View>
          </View>

          <Text style={st.fieldLabel}>สี</Text>
          <View style={st.chipRow}>
            {MEMBER_TYPE_COLOR_OPTIONS.map(opt => {
              const c = getMemberTypeColors(opt.key, 'web');
              const on = form.color === opt.key;
              return (
                <TouchableOpacity key={opt.key} onPress={() => patch({ color: opt.key })}
                  style={[st.colorChip, { backgroundColor: c.bg, borderColor: on ? c.fg : c.bg }]}
                  accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`สี${opt.label}`}>
                  {on && <Ionicons name="checkmark" size={14} color={c.fg} />}
                  <Text style={[st.colorChipText, { color: c.fg }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={st.formRow}>
            <View style={[st.field, { flex: 1 }]}>
              <Text style={st.fieldLabel}>ส่วนลดอัตโนมัติ (%)</Text>
              <TextInput style={st.input} value={form.discount} onChangeText={v => patch({ discount: v })} keyboardType="numeric" placeholder="0" placeholderTextColor={WebColors.textDisabled} />
            </View>
            <View style={[st.field, { flex: 1 }]}>
              <Text style={st.fieldLabel}>ตัวคูณคะแนน (×)</Text>
              <TextInput style={[st.input, !form.earnPoints && st.inputDisabled]} value={form.multiplier} onChangeText={v => patch({ multiplier: v })} keyboardType="numeric" placeholder="1" placeholderTextColor={WebColors.textDisabled} editable={form.earnPoints} />
            </View>
          </View>

          <View style={st.switchRow}>
            <Text style={st.switchLbl}>สะสมคะแนน</Text>
            <Switch value={form.earnPoints} onValueChange={v => patch({ earnPoints: v })} trackColor={{ true: WebColors.success, false: WebColors.border }} />
          </View>
          <View style={st.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={st.switchLbl}>ตั้งเป็นค่าเริ่มต้น</Text>
              {editingDefault && <Text style={st.hint}>ประเภทเริ่มต้นต้องมี 1 ประเภทเสมอ — ตั้งประเภทอื่นเป็นค่าเริ่มต้นแทนเพื่อเปลี่ยน</Text>}
            </View>
            <Switch value={form.isDefault} disabled={editingDefault} onValueChange={v => patch({ isDefault: v, ...(v ? { active: true } : {}) })} trackColor={{ true: WebColors.primary, false: WebColors.border }} />
          </View>
          <View style={st.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={st.switchLbl}>เปิดใช้งาน</Text>
              {(editingDefault || form.isDefault) && <Text style={st.hint}>ไม่สามารถปิดใช้งานประเภทเริ่มต้นได้</Text>}
            </View>
            <Switch value={form.active} disabled={editingDefault || form.isDefault} onValueChange={v => patch({ active: v })} trackColor={{ true: WebColors.success, false: WebColors.border }} />
          </View>

          {!!formError && (
            <View style={st.errorBanner} accessibilityRole="alert">
              <Ionicons name="alert-circle" size={16} color={WebColors.danger} />
              <Text style={st.errorText}>{formError}</Text>
            </View>
          )}

          <View style={st.formFooter}>
            <TouchableOpacity style={st.ghostBtn} onPress={() => { setForm(null); setFormError(''); }}>
              <Text style={st.ghostBtnTxt}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.primaryBtn} onPress={handleSave}>
              <Ionicons name="checkmark-circle" size={16} color={WebColors.white} />
              <Text style={st.primaryBtnTxt}>บันทึก</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── List ── */}
      {types.length === 0 ? (
        <View style={[st.card, st.center]}>
          <Ionicons name="pricetags-outline" size={40} color={WebColors.textDisabled} />
          <Text style={st.muted}>ไม่มีข้อมูล</Text>
        </View>
      ) : (
        <View style={st.grid}>
          {types.map(t => {
            const c = getMemberTypeColors(t.color, 'web');
            const count = counts[t.id] ?? 0;
            const inactive = t.status !== 'active';
            return (
              <View key={t.id} style={[st.typeCard, inactive && { opacity: 0.7 }]}>
                <View style={[st.typeBar, { backgroundColor: c.fg }]} />
                <View style={st.typeTop}>
                  <MemberTypeBadge name={t.name} color={t.color} />
                  {t.isDefault && (
                    <View style={[st.badge, { backgroundColor: WebColors.primaryLight }]}>
                      <Text style={[st.badgeText, { color: WebColors.primary }]}>ค่าเริ่มต้น</Text>
                    </View>
                  )}
                  <View style={[st.badge, { backgroundColor: inactive ? WebColors.gray100 : WebColors.successLight }]}>
                    <Text style={[st.badgeText, { color: inactive ? WebColors.textSecondary : WebColors.success }]}>{inactive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}</Text>
                  </View>
                </View>
                {!!t.description && <Text style={st.desc}>{t.description}</Text>}
                <View style={st.metaRow}><Text style={st.metaLbl}>สมาชิก</Text><Text style={st.metaVal}>{count.toLocaleString()} คน</Text></View>
                <View style={st.metaRow}><Text style={st.metaLbl}>ส่วนลด</Text><Text style={st.metaVal}>{t.discountPercent}%</Text></View>
                <View style={st.metaRow}><Text style={st.metaLbl}>สะสมคะแนน</Text><Text style={[st.metaVal, { color: t.earnPoints ? WebColors.success : WebColors.danger }]}>{t.earnPoints ? 'ได้' : 'ไม่ได้'}</Text></View>
                <View style={st.metaRow}><Text style={st.metaLbl}>ตัวคูณคะแนน</Text><Text style={st.metaVal}>×{t.pointMultiplier}</Text></View>

                <View style={st.actions}>
                  <TouchableOpacity style={st.actionBtn} onPress={() => { setForm(toForm(t)); setFormError(''); }} accessibilityLabel={`แก้ไข ${t.name}`}>
                    <Ionicons name="create-outline" size={14} color={WebColors.primary} />
                    <Text style={[st.actionTxt, { color: WebColors.primary }]}>แก้ไข</Text>
                  </TouchableOpacity>
                  {!t.isDefault && !inactive && (
                    <TouchableOpacity style={st.actionBtn} onPress={() => handleSetDefault(t)} accessibilityLabel={`ตั้ง ${t.name} เป็นค่าเริ่มต้น`}>
                      <Ionicons name="star-outline" size={14} color={WebColors.warning} />
                      <Text style={[st.actionTxt, { color: WebColors.warning }]}>ตั้งเป็นค่าเริ่มต้น</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[st.actionBtn, t.isDefault && st.actionDisabled]} disabled={t.isDefault}
                    onPress={() => openDelete(t)} accessibilityLabel={`ลบ ${t.name}`} accessibilityState={{ disabled: t.isDefault }}>
                    <Ionicons name="trash-outline" size={14} color={t.isDefault ? WebColors.textDisabled : WebColors.danger} />
                    <Text style={[st.actionTxt, { color: t.isDefault ? WebColors.textDisabled : WebColors.danger }]}>ลบ</Text>
                  </TouchableOpacity>
                </View>
                {t.isDefault && <Text style={st.hint}>ประเภทเริ่มต้นลบหรือปิดใช้งานไม่ได้</Text>}
              </View>
            );
          })}
        </View>
      )}

      {/* ── Delete / reassign modal ── */}
      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <View style={st.overlay}>
          <View style={st.modal}>
            <Text style={st.modalTitle}>ลบประเภทสมาชิก "{deleteTarget?.name}"</Text>
            {deleteCount > 0 ? (
              <>
                <Text style={st.modalSub}>มีสมาชิก {deleteCount.toLocaleString()} คนใช้ประเภทนี้อยู่ กรุณาเลือกประเภทที่จะย้ายสมาชิกไปก่อนลบ</Text>
                <Text style={st.fieldLabel}>ย้ายสมาชิกไปยัง</Text>
                {reassignOptions.length === 0 ? (
                  <Text style={st.muted}>ไม่มีประเภทอื่นที่เปิดใช้งาน</Text>
                ) : (
                  <View style={st.chipRow}>
                    {reassignOptions.map(o => {
                      const on = reassignTo === o.id;
                      return (
                        <TouchableOpacity key={o.id} style={[st.chip, on && st.chipAct]} onPress={() => setReassignTo(o.id)}
                          accessibilityRole="radio" accessibilityState={{ selected: on }}>
                          <Text style={[st.chipTxt, on && st.chipTxtAct]}>{o.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            ) : (
              <Text style={st.modalSub}>ไม่มีสมาชิกใช้ประเภทนี้ ยืนยันการลบหรือไม่</Text>
            )}
            <View style={st.formFooter}>
              <TouchableOpacity style={st.ghostBtn} onPress={() => setDeleteTarget(null)}>
                <Text style={st.ghostBtnTxt}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.dangerBtn, deleteCount > 0 && !reassignTo && st.actionDisabled]}
                disabled={deleteCount > 0 && !reassignTo} onPress={confirmDelete}>
                <Ionicons name="trash" size={14} color={WebColors.white} />
                <Text style={st.primaryBtnTxt}>{deleteCount > 0 ? 'ย้ายสมาชิกและลบ' : 'ลบ'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const st = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: Space.sm, padding: Space.xl },
  muted: { ...Font.caption, color: WebColors.textSecondary },
  headerRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: Space.md, marginBottom: Space.md },
  pageTitle: { ...Font.h3, color: WebColors.text, marginBottom: Space.xs },
  subtitle: { ...Font.caption, color: WebColors.textSecondary },
  card: { backgroundColor: WebColors.white, borderRadius: Radius.md, padding: Space.lg, borderWidth: 1, borderColor: WebColors.border, marginBottom: Space.md, gap: Space.sm },
  cardTitle: { ...Font.h4, color: WebColors.text },
  formRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.md },
  field: { gap: Space.xs, minWidth: 180 },
  fieldLabel: { ...Font.label, color: WebColors.textSecondary },
  input: { minHeight: TOUCH, borderWidth: 1, borderColor: WebColors.border, borderRadius: Radius.sm, paddingHorizontal: Space.md, ...Font.bodySm, color: WebColors.text, backgroundColor: WebColors.white },
  inputDisabled: { backgroundColor: WebColors.gray100, color: WebColors.textDisabled },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  colorChip: { flexDirection: 'row', alignItems: 'center', gap: Space.xs, minHeight: TOUCH, paddingHorizontal: Space.md, borderRadius: Radius.sm, borderWidth: 2 },
  colorChipText: { ...Font.label },
  chip: { minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: Space.md, borderRadius: Radius.sm, borderWidth: 1, borderColor: WebColors.border, backgroundColor: WebColors.white },
  chipAct: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  chipTxt: { ...Font.label, color: WebColors.textSecondary },
  chipTxtAct: { color: WebColors.white },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.md, minHeight: TOUCH },
  switchLbl: { ...Font.label, color: WebColors.text },
  hint: { ...Font.caption, color: WebColors.textDisabled },
  formFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Space.sm, marginTop: Space.sm },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: Space.xs, minHeight: TOUCH, paddingHorizontal: Space.lg, borderRadius: Radius.sm, backgroundColor: WebColors.primary },
  primaryBtnTxt: { ...Font.buttonSm, color: WebColors.white },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', gap: Space.xs, minHeight: TOUCH, paddingHorizontal: Space.lg, borderRadius: Radius.sm, backgroundColor: WebColors.danger },
  ghostBtn: { minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: Space.lg, borderRadius: Radius.sm, borderWidth: 1, borderColor: WebColors.border },
  ghostBtnTxt: { ...Font.buttonSm, color: WebColors.textSecondary },
  iconBtn: { minWidth: TOUCH, minHeight: TOUCH, alignItems: 'center', justifyContent: 'center' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: Space.sm, backgroundColor: WebColors.dangerLight, borderRadius: Radius.sm, paddingHorizontal: Space.md, marginBottom: Space.sm, minHeight: TOUCH },
  errorText: { ...Font.bodySm, color: WebColors.danger, flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.md },
  typeCard: { flexGrow: 1, flexBasis: 260, maxWidth: 420, backgroundColor: WebColors.white, borderRadius: Radius.md, padding: Space.lg, borderWidth: 1, borderColor: WebColors.border, gap: Space.xs, ...Shadow.sm },
  typeBar: { height: 4, borderRadius: Radius.sm, marginBottom: Space.xs },
  typeTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Space.xs },
  desc: { ...Font.caption, color: WebColors.textSecondary },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLbl: { ...Font.caption, color: WebColors.textSecondary },
  metaVal: { ...Font.label, color: WebColors.text },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.xs, marginTop: Space.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: Space.xs, minHeight: TOUCH, paddingHorizontal: Space.md, borderRadius: Radius.sm, borderWidth: 1, borderColor: WebColors.border },
  actionTxt: { ...Font.buttonSm },
  actionDisabled: { opacity: 0.5 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: Space.sm, paddingVertical: 2, borderRadius: Radius.sm },
  badgeText: { ...Font.badge },
  overlay: { flex: 1, backgroundColor: WebColors.overlay, alignItems: 'center', justifyContent: 'center', padding: Space.lg },
  modal: { backgroundColor: WebColors.white, borderRadius: Radius.lg, padding: Space.xl, width: '100%', maxWidth: 460, gap: Space.sm, ...Shadow.lg },
  modalTitle: { ...Font.h4, color: WebColors.text },
  modalSub: { ...Font.bodySm, color: WebColors.textSecondary },
});
