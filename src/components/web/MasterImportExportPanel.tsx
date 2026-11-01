/**
 * MasterImportExportPanel — ปุ่ม/การ์ด Import · Export · Template ของมาสเตอร์ (เว็บ)
 * ใช้ร่วมกันใน: สินค้า (แท็บ Import/Export), มาสเตอร์ → ยี่ห้อ/หมวดหมู่, จัดการแบรนด์, จัดการผู้จำหน่าย
 *
 * ขั้นตอนนำเข้า: เลือกไฟล์ (.xlsx/.csv ≤ 10MB) → ตรวจสอบ → แสดงตัวอย่าง (เพิ่มใหม่ / อัปเดต /
 * ข้อผิดพลาด) → ยืนยัน → บันทึกเฉพาะรายการที่ถูกต้อง + audit log
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import {
  ENTITY_LABELS, ImportPlan, ImportResult, MasterEntity, applyImport, planImport, plannedWrites,
} from '../../utils/masterImportExport';
import { FileFormat, ImportFileError, pickFile, readFileToWorkbook } from '../../utils/spreadsheetIO';
import { downloadMasterFile, getImportContext, getMasterCount, storePorts } from '../../utils/masterPorts';

export interface MasterImportExportPanelProps {
  entity: MasterEntity;
  /** true = แถวปุ่มเล็กสำหรับหัวตาราง, false = การ์ด 3 ใบ */
  compact?: boolean;
  /** เรียกหลังนำเข้าสำเร็จ (ให้หน้าจอ refresh) */
  onApplied?: () => void;
  /** จำนวนรายการปัจจุบัน (ไม่ส่ง = อ่านจาก store) */
  count?: number;
}

type Busy = 'import' | 'export' | 'template' | 'apply' | null;

const MAX_ERRORS_SHOWN = 200;

const PRODUCT_HELP = [
  '1 แถว = 1 หน่วยนับ — สินค้าหลายหน่วยใส่รหัสสินค้าซ้ำหลายแถว (หน่วยหลัก Y ต้องมีอัตราส่วน 1)',
  'บาร์โค้ดหลายค่าในหน่วยเดียวคั่นด้วย |  เช่น 8850001|8850002 (ห้ามซ้ำทั้งระบบ)',
  'หมวดหมู่/กลุ่ม แบรนด์ ผู้จำหน่าย ใส่เป็นชื่อ — ถ้ายังไม่มีจะสร้างใหม่ให้อัตโนมัติ',
  'ตัวเลือกสินค้า (variants) อยู่ในชีต "ตัวเลือกสินค้า" (ไฟล์ .csv อยู่ใต้แถว [ตัวเลือกสินค้า])',
  'รหัสสินค้าที่มีอยู่แล้วจะถูกอัปเดต ช่องที่ไม่บังคับซึ่งเว้นว่างจะคงค่าเดิม — ดูคำอธิบายคอลัมน์ในชีต "คำอธิบาย" ของ Template .xlsx',
];

const FormatToggle: React.FC<{ value: FileFormat; onChange: (f: FileFormat) => void; label: string }> = ({ value, onChange, label }) => (
  <View style={st.toggle} accessibilityRole="radiogroup" accessibilityLabel={label}>
    {(['xlsx', 'csv'] as const).map(f => (
      <TouchableOpacity
        key={f}
        style={[st.toggleBtn, value === f && st.toggleBtnActive]}
        onPress={() => onChange(f)}
        accessibilityRole="radio"
        accessibilityState={{ selected: value === f }}
        accessibilityLabel={`ไฟล์ .${f}`}
      >
        <Text style={[st.toggleText, value === f && st.toggleTextActive]}>.{f}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export const MasterImportExportPanel: React.FC<MasterImportExportPanelProps> = ({ entity, compact = false, onApplied, count }) => {
  const [busy, setBusy] = useState<Busy>(null);
  const [exportFmt, setExportFmt] = useState<FileFormat>('xlsx');
  const [templateFmt, setTemplateFmt] = useState<FileFormat>('xlsx');
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [, setRefresh] = useState(0);

  const label = ENTITY_LABELS[entity];
  const total = count ?? getMasterCount(entity);
  const isWeb = Platform.OS === 'web';

  const handleImport = async () => {
    setError(''); setResult(null);
    if (!isWeb) { setError('นำเข้าไฟล์ได้เฉพาะบนเว็บ'); return; }
    const file = await pickFile();
    if (!file) return;
    setBusy('import');
    try {
      const wb = await readFileToWorkbook(entity, file);
      const p = planImport(entity, wb, getImportContext());
      if (p.fileErrors.length > 0) {
        setError(p.fileErrors.join('\n'));
      } else {
        setFileName(file.name);
        setPlan(p);
      }
    } catch (e) {
      setError(e instanceof ImportFileError ? e.message : 'อ่านไฟล์ไม่สำเร็จ กรุณาตรวจสอบรูปแบบไฟล์');
    } finally {
      setBusy(null);
    }
  };

  const handleDownload = async (kind: 'export' | 'template', fmt: FileFormat) => {
    setError(''); setResult(null);
    if (!isWeb) { setError('ดาวน์โหลดไฟล์ได้เฉพาะบนเว็บ'); return; }
    if (kind === 'export' && total === 0) { setError(`ยังไม่มีข้อมูล${label}ให้ส่งออก`); return; }
    setBusy(kind);
    try {
      await downloadMasterFile(entity, kind, fmt);
    } catch {
      setError(kind === 'export' ? 'ส่งออกไฟล์ไม่สำเร็จ' : 'ดาวน์โหลด Template ไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  };

  const handleConfirm = () => {
    if (!plan) return;
    setBusy('apply');
    try {
      const res = applyImport(plan, storePorts);
      setResult(res);
      setPlan(null);
      setRefresh(k => k + 1);
      onApplied?.();
    } catch {
      setError('บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  };

  const resultText = (r: ImportResult): string => {
    const parts = [`เพิ่ม ${r.created}`, `อัปเดต ${r.updated}`, `ไม่เปลี่ยนแปลง ${r.unchanged}`];
    if (entity === 'product') parts.push(`สร้างมาสเตอร์ใหม่ ${r.mastersCreated}`);
    if (r.skipped > 0) parts.push(`ข้าม ${r.skipped}`);
    return `นำเข้า${label}สำเร็จ: ${parts.join(' · ')} รายการ`;
  };

  // ─── Banners ──────────────────────────────────────────────────────────────
  const banners = (
    <>
      {error !== '' && (
        <View style={st.bannerError} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={16} color={WebColors.danger} />
          <Text style={st.bannerErrorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError('')} accessibilityLabel="ปิดข้อความ">
            <Ionicons name="close" size={16} color={WebColors.danger} />
          </TouchableOpacity>
        </View>
      )}
      {result && (
        <View style={st.bannerSuccess} accessibilityRole="alert">
          <Ionicons name="checkmark-circle" size={16} color={WebColors.success} />
          <Text style={st.bannerSuccessText}>{resultText(result)}</Text>
          <TouchableOpacity onPress={() => setResult(null)} accessibilityLabel="ปิดข้อความ">
            <Ionicons name="close" size={16} color={WebColors.success} />
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  // ─── Preview modal ────────────────────────────────────────────────────────
  const writes = plan ? plannedWrites(plan) : 0;
  const newMasterCount = plan ? plan.newMasters.categories.length + plan.newMasters.brands.length + plan.newMasters.suppliers.length : 0;
  const isEmptyPlan = plan ? writes + plan.unchanged + plan.skippedRecords + plan.errors.length === 0 : false;

  const stat = (title: string, value: number, color: string, bg: string) => (
    <View style={[st.stat, { backgroundColor: bg }]}>
      <Text style={[st.statValue, { color }]}>{value}</Text>
      <Text style={st.statLabel}>{title}</Text>
    </View>
  );

  const preview = (
    <Modal visible={plan !== null} transparent animationType="fade" onRequestClose={() => setPlan(null)}>
      <View style={st.overlay}>
        <View style={st.modal}>
          <View style={st.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={st.modalTitle}>ตรวจสอบข้อมูลก่อนนำเข้า{label}</Text>
              <Text style={st.modalSub} numberOfLines={1}>{fileName}</Text>
            </View>
            <TouchableOpacity onPress={() => setPlan(null)} accessibilityLabel="ปิด">
              <Ionicons name="close" size={20} color={WebColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {plan && isEmptyPlan ? (
            <View style={st.empty}>
              <Ionicons name="file-tray-outline" size={40} color={WebColors.border} />
              <Text style={st.emptyText}>ไม่มีข้อมูลในไฟล์</Text>
            </View>
          ) : plan && (
            <ScrollView style={st.modalBody} contentContainerStyle={{ gap: 12 }}>
              <View style={st.statRow}>
                {stat('เพิ่มใหม่', plan.creates.length, WebColors.success, WebColors.successLight)}
                {stat('อัปเดต', plan.updates.length, WebColors.info, WebColors.infoLight)}
                {stat('ไม่เปลี่ยนแปลง', plan.unchanged, WebColors.textSecondary, WebColors.gray100)}
                {entity === 'product' && stat('สร้างมาสเตอร์ใหม่', newMasterCount, WebColors.purple, WebColors.purpleLight)}
                {stat('ข้อผิดพลาด (ข้าม)', plan.skippedRecords, plan.skippedRecords > 0 ? WebColors.danger : WebColors.textSecondary, plan.skippedRecords > 0 ? WebColors.dangerLight : WebColors.gray100)}
              </View>

              {newMasterCount > 0 && (
                <View style={st.infoBox}>
                  <Text style={st.infoTitle}>มาสเตอร์ที่จะสร้างใหม่ {newMasterCount} รายการ</Text>
                  {plan.newMasters.categories.length > 0 && <Text style={st.infoText}>หมวดหมู่: {plan.newMasters.categories.join(', ')}</Text>}
                  {plan.newMasters.brands.length > 0 && <Text style={st.infoText}>แบรนด์: {plan.newMasters.brands.join(', ')}</Text>}
                  {plan.newMasters.suppliers.length > 0 && <Text style={st.infoText}>ผู้จำหน่าย: {plan.newMasters.suppliers.join(', ')}</Text>}
                </View>
              )}

              {plan.errors.length > 0 && (
                <View style={st.errorBox}>
                  <Text style={st.errorTitle}>รายละเอียดข้อผิดพลาด ({plan.errors.length}) — รายการเหล่านี้จะถูกข้าม</Text>
                  {plan.errors.slice(0, MAX_ERRORS_SHOWN).map((e, i) => (
                    <Text key={`${e.sheet ?? ''}-${e.row}-${i}`} style={st.errorText}>• {e.message}</Text>
                  ))}
                  {plan.errors.length > MAX_ERRORS_SHOWN && (
                    <Text style={st.errorText}>และอีก {plan.errors.length - MAX_ERRORS_SHOWN} รายการ</Text>
                  )}
                </View>
              )}
            </ScrollView>
          )}

          <View style={st.modalFooter}>
            <TouchableOpacity style={st.cancelBtn} onPress={() => setPlan(null)} accessibilityRole="button">
              <Text style={st.cancelText}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.confirmBtn, (writes === 0 || busy === 'apply') && st.btnDisabled]}
              onPress={handleConfirm}
              disabled={writes === 0 || busy === 'apply'}
              accessibilityRole="button"
              accessibilityState={{ disabled: writes === 0 }}
            >
              {busy === 'apply'
                ? <ActivityIndicator size="small" color={WebColors.white} />
                : <Text style={st.confirmText}>{writes === 0 ? 'ไม่มีรายการที่ต้องบันทึก' : `ยืนยันนำเข้า ${writes} รายการ`}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const btnContent = (kind: Busy, icon: React.ComponentProps<typeof Ionicons>['name'], text: string, color: string) => (
    busy === kind
      ? <ActivityIndicator size="small" color={color} />
      : <>
          <Ionicons name={icon} size={14} color={color} />
          <Text style={[st.compactText, { color }]}>{text}</Text>
        </>
  );

  // ─── Compact (header buttons) ─────────────────────────────────────────────
  if (compact) {
    return (
      <View style={st.compactWrap}>
        <View style={st.compactRow}>
          <TouchableOpacity style={st.compactBtn} onPress={handleImport} disabled={busy !== null} accessibilityRole="button" accessibilityLabel={`นำเข้า${label}จากไฟล์`}>
            {btnContent('import', 'cloud-upload-outline', 'นำเข้า', WebColors.primary)}
          </TouchableOpacity>
          <TouchableOpacity style={st.compactBtn} onPress={() => handleDownload('export', exportFmt)} disabled={busy !== null} accessibilityRole="button" accessibilityLabel={`ส่งออก${label}ทั้งหมด`}>
            {btnContent('export', 'cloud-download-outline', `ส่งออก (${total})`, WebColors.success)}
          </TouchableOpacity>
          <TouchableOpacity style={st.compactBtn} onPress={() => handleDownload('template', exportFmt)} disabled={busy !== null} accessibilityRole="button" accessibilityLabel={`ดาวน์โหลด Template ${label}`}>
            {btnContent('template', 'document-text-outline', 'Template', WebColors.warning)}
          </TouchableOpacity>
          <FormatToggle value={exportFmt} onChange={setExportFmt} label="รูปแบบไฟล์" />
        </View>
        {banners}
        {preview}
      </View>
    );
  }

  // ─── Full (3 cards) ───────────────────────────────────────────────────────
  return (
    <View style={st.fullWrap}>
      {banners}
      <View style={st.grid}>
        <View style={st.card}>
          <Ionicons name="cloud-upload-outline" size={32} color={WebColors.primary} />
          <Text style={st.cardTitle}>Import จาก Excel</Text>
          <Text style={st.cardSub}>รองรับ .xlsx, .csv ขนาดไม่เกิน 10MB</Text>
          <TouchableOpacity style={[st.cardBtn, busy !== null && st.btnDisabled]} onPress={handleImport} disabled={busy !== null} accessibilityRole="button" accessibilityLabel={`เลือกไฟล์นำเข้า${label}`}>
            {busy === 'import' ? <ActivityIndicator size="small" color={WebColors.white} /> : <Text style={st.cardBtnText}>เลือกไฟล์</Text>}
          </TouchableOpacity>
        </View>
        <View style={st.card}>
          <Ionicons name="cloud-download-outline" size={32} color={WebColors.success} />
          <Text style={st.cardTitle}>Export {label}ทั้งหมด</Text>
          <Text style={st.cardSub}>{total} รายการ</Text>
          <FormatToggle value={exportFmt} onChange={setExportFmt} label="รูปแบบไฟล์ส่งออก" />
          <TouchableOpacity style={[st.cardBtn, { backgroundColor: WebColors.success }, busy !== null && st.btnDisabled]} onPress={() => handleDownload('export', exportFmt)} disabled={busy !== null} accessibilityRole="button" accessibilityLabel={`ส่งออก${label}ทั้งหมด`}>
            {busy === 'export' ? <ActivityIndicator size="small" color={WebColors.white} /> : <Text style={st.cardBtnText}>{exportFmt === 'xlsx' ? 'Export Excel' : 'Export CSV'}</Text>}
          </TouchableOpacity>
        </View>
        <View style={st.card}>
          <Ionicons name="document-text-outline" size={32} color={WebColors.warning} />
          <Text style={st.cardTitle}>Download Template</Text>
          <Text style={st.cardSub}>แบบฟอร์มสำหรับกรอกข้อมูล พร้อมตัวอย่าง</Text>
          <FormatToggle value={templateFmt} onChange={setTemplateFmt} label="รูปแบบไฟล์ Template" />
          <TouchableOpacity style={[st.cardBtn, { backgroundColor: WebColors.warning }, busy !== null && st.btnDisabled]} onPress={() => handleDownload('template', templateFmt)} disabled={busy !== null} accessibilityRole="button" accessibilityLabel={`ดาวน์โหลด Template ${label}`}>
            {busy === 'template' ? <ActivityIndicator size="small" color={WebColors.white} /> : <Text style={st.cardBtnText}>ดาวน์โหลด</Text>}
          </TouchableOpacity>
        </View>
      </View>
      {entity === 'product' && (
        <View style={st.helpBox}>
          <Text style={st.helpTitle}>รูปแบบไฟล์สินค้า</Text>
          {PRODUCT_HELP.map(h => <Text key={h} style={st.helpText}>• {h}</Text>)}
        </View>
      )}
      {preview}
    </View>
  );
};

const st = StyleSheet.create({
  // full
  fullWrap: { gap: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: {
    flex: 1, minWidth: 220, backgroundColor: WebColors.cardBg, borderRadius: 12,
    padding: 24, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: WebColors.border,
  },
  cardTitle: { fontSize: 12, fontWeight: '700', color: WebColors.text },
  cardSub: { fontSize: 12, color: WebColors.textSecondary, textAlign: 'center' },
  cardBtn: {
    backgroundColor: WebColors.primary, borderRadius: 8, minHeight: 40, minWidth: 120,
    paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center',
  },
  cardBtnText: { color: WebColors.white, fontSize: 12, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  helpBox: { backgroundColor: WebColors.cardBg, borderRadius: 12, padding: 16, gap: 6, borderWidth: 1, borderColor: WebColors.border },
  helpTitle: { fontSize: 12, fontWeight: '700', color: WebColors.text },
  helpText: { fontSize: 12, color: WebColors.textSecondary, lineHeight: 18 },
  // compact
  compactWrap: { gap: 8, alignItems: 'flex-end', flexShrink: 1 },
  compactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'flex-end' },
  compactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1, borderColor: WebColors.border, backgroundColor: WebColors.cardBg,
  },
  compactText: { fontSize: 12, fontWeight: '600' },
  // toggle
  toggle: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: WebColors.border, overflow: 'hidden' },
  toggleBtn: { minHeight: 32, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: WebColors.cardBg },
  toggleBtnActive: { backgroundColor: WebColors.primaryLight },
  toggleText: { fontSize: 12, color: WebColors.textSecondary, fontWeight: '600' },
  toggleTextActive: { color: WebColors.primary },
  // banners
  bannerError: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: WebColors.dangerLight, borderRadius: 8, padding: 10, alignSelf: 'stretch' },
  bannerErrorText: { flex: 1, fontSize: 12, color: WebColors.danger },
  bannerSuccess: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: WebColors.successLight, borderRadius: 8, padding: 10, alignSelf: 'stretch' },
  bannerSuccessText: { flex: 1, fontSize: 12, color: WebColors.success, fontWeight: '600' },
  // modal
  overlay: { flex: 1, backgroundColor: WebColors.overlay, alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: WebColors.cardBg, borderRadius: 12, width: '100%', maxWidth: 680, maxHeight: '90%', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: WebColors.border },
  modalTitle: { fontSize: 15, fontWeight: '800', color: WebColors.text },
  modalSub: { fontSize: 12, color: WebColors.textSecondary },
  modalBody: { padding: 16 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: WebColors.border },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { flex: 1, minWidth: 110, borderRadius: 8, padding: 12, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: WebColors.textSecondary, textAlign: 'center' },
  infoBox: { backgroundColor: WebColors.purpleLight, borderRadius: 8, padding: 12, gap: 4 },
  infoTitle: { fontSize: 12, fontWeight: '700', color: WebColors.purple },
  infoText: { fontSize: 12, color: WebColors.text },
  errorBox: { backgroundColor: WebColors.dangerLight, borderRadius: 8, padding: 12, gap: 4 },
  errorTitle: { fontSize: 12, fontWeight: '700', color: WebColors.danger, marginBottom: 4 },
  errorText: { fontSize: 12, color: WebColors.danger },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 13, color: WebColors.textSecondary },
  cancelBtn: { minHeight: 40, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: WebColors.border, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 13, fontWeight: '600', color: WebColors.textSecondary },
  confirmBtn: { minHeight: 40, minWidth: 160, paddingHorizontal: 16, borderRadius: 8, backgroundColor: WebColors.primary, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontSize: 13, fontWeight: '700', color: WebColors.white },
});
