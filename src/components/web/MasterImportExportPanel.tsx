/**
 * MasterImportExportPanel — ปุ่ม/การ์ด Import · Export · Template ของมาสเตอร์ (เว็บ)
 * ใช้ร่วมกันใน: สินค้า (แท็บ Import/Export), มาสเตอร์ → ยี่ห้อ/หมวดหมู่, จัดการแบรนด์, จัดการผู้จำหน่าย
 *
 * ขั้นตอนนำเข้า (useMasterMigration + MasterMigrationWizard):
 *   1 เลือกไฟล์ (.xlsx/.csv ≤ 10MB) → 2 ตรวจสอบข้อมูล (ไมเกรต: เพิ่มใหม่ / อัปเดต ค่าเดิม → ค่าใหม่ /
 *   ไม่เปลี่ยน / ข้อผิดพลาด) → 3 ยืนยันอีกครั้ง (+ ดาวน์โหลดข้อมูลสำรอง) → 4 ผลลัพธ์ + audit log
 */
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { ENTITY_LABELS, ImportResult, MasterEntity, MigrationResult } from '../../utils/masterImportExport';
import { FileFormat } from '../../utils/spreadsheetIO';
import { downloadMasterFile, getMasterCount } from '../../utils/masterPorts';
import { useMasterMigration } from '../../hooks/useMasterMigration';
import { MasterMigrationWizard } from './MasterMigrationWizard';

export interface MasterImportExportPanelProps {
  entity: MasterEntity;
  /** true = แถวปุ่มเล็กสำหรับหัวตาราง, false = การ์ด 3 ใบ */
  compact?: boolean;
  /** เรียกหลังนำเข้าสำเร็จ (ให้หน้าจอ refresh) */
  onApplied?: () => void;
  /** จำนวนรายการปัจจุบัน (ไม่ส่ง = อ่านจาก store) */
  count?: number;
}

type Busy = 'export' | 'template' | null;

const PRODUCT_HELP = [
  '1 แถว = 1 หน่วยนับ — สินค้าหลายหน่วยใส่รหัสสินค้าซ้ำหลายแถว (หน่วยหลัก Y ต้องมีอัตราส่วน 1)',
  'บาร์โค้ดหลายค่าในหน่วยเดียวคั่นด้วย |  เช่น 8850001|8850002 (ห้ามซ้ำทั้งระบบ)',
  'หมวดหมู่/กลุ่ม แบรนด์ ผู้จำหน่าย ใส่เป็นชื่อ — ถ้ายังไม่มีจะสร้างใหม่ให้อัตโนมัติ',
  'ตัวเลือกสินค้า (variants) อยู่ในชีต "ตัวเลือกสินค้า" (ไฟล์ .csv อยู่ใต้แถว [ตัวเลือกสินค้า])',
  'รหัสสินค้าที่มีอยู่แล้วจะถูกอัปเดต ช่องที่ไม่บังคับซึ่งเว้นว่างจะคงค่าเดิม (รวมถึงอัตราส่วน/ราคาทุน/บาร์โค้ดของหน่วยเดิม) — ดูคำอธิบายคอลัมน์ในชีต "คำอธิบาย" ของ Template .xlsx',
  'หน่วยเดิมที่ไม่มีแถวในไฟล์จะคงไว้ ไม่ถูกลบ — การลบหน่วยหรือบาร์โค้ดให้ทำที่หน้าแก้ไขสินค้า',
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
  const [downloading, setDownloading] = useState<Busy>(null);
  const [exportFmt, setExportFmt] = useState<FileFormat>('xlsx');
  const [templateFmt, setTemplateFmt] = useState<FileFormat>('xlsx');
  const [downloadError, setDownloadError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [, setRefresh] = useState(0);

  const handleApplied = useCallback((res: MigrationResult) => {
    setResult(res);
    setRefresh(k => k + 1);
    onApplied?.();
  }, [onApplied]);
  const flow = useMasterMigration(entity, { onApplied: handleApplied });

  const label = ENTITY_LABELS[entity];
  const total = count ?? getMasterCount(entity);
  const isWeb = Platform.OS === 'web';
  /** ข้อผิดพลาดขั้นเลือกไฟล์ (ขั้น 2–4 แสดงใน wizard) */
  const error = downloadError || (flow.step === 1 ? flow.error : '');
  const clearError = () => { setDownloadError(''); flow.setError(''); };
  const busy: Busy | 'import' = flow.busy === 'read' ? 'import' : downloading;
  /** ผลลัพธ์แสดงเป็นแถบสีเขียวหลังปิด wizard */
  const shownResult = flow.step === 1 ? result : null;

  const handleImport = () => {
    clearError(); setResult(null);
    void flow.pickAndReview();
  };

  const handleDownload = async (kind: 'export' | 'template', fmt: FileFormat) => {
    clearError(); setResult(null);
    if (!isWeb) { setDownloadError('ดาวน์โหลดไฟล์ได้เฉพาะบนเว็บ'); return; }
    if (kind === 'export' && total === 0) { setDownloadError(`ยังไม่มีข้อมูล${label}ให้ส่งออก`); return; }
    setDownloading(kind);
    try {
      await downloadMasterFile(entity, kind, fmt);
    } catch {
      setDownloadError(kind === 'export' ? 'ส่งออกไฟล์ไม่สำเร็จ' : 'ดาวน์โหลด Template ไม่สำเร็จ');
    } finally {
      setDownloading(null);
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
          <TouchableOpacity style={st.iconBtn} onPress={clearError} accessibilityRole="button" accessibilityLabel="ปิดข้อความ">
            <Ionicons name="close" size={16} color={WebColors.danger} />
          </TouchableOpacity>
        </View>
      )}
      {shownResult && (
        <View style={st.bannerSuccess} accessibilityRole="alert">
          <Ionicons name="checkmark-circle" size={16} color={WebColors.success} />
          <Text style={st.bannerSuccessText}>{resultText(shownResult)}</Text>
          <TouchableOpacity style={st.iconBtn} onPress={() => setResult(null)} accessibilityRole="button" accessibilityLabel="ปิดข้อความ">
            <Ionicons name="close" size={16} color={WebColors.success} />
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  // ─── Review / confirm / result (ขั้น 2–4) ─────────────────────────────────
  const preview = <MasterMigrationWizard flow={flow} />;

  const btnContent = (kind: Busy | 'import', icon: React.ComponentProps<typeof Ionicons>['name'], text: string, color: string) => (
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
    backgroundColor: WebColors.primary, borderRadius: 8, minHeight: 44, minWidth: 120,
    paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center',
  },
  cardBtnText: { color: WebColors.white, fontSize: 12, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  helpBox: { backgroundColor: WebColors.cardBg, borderRadius: 12, padding: 16, gap: 6, borderWidth: 1, borderColor: WebColors.border },
  helpTitle: { fontSize: 12, fontWeight: '700', color: WebColors.text },
  helpText: { fontSize: 12, color: WebColors.textSecondary, lineHeight: 18 },
  iconBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  // compact
  compactWrap: { gap: 8, alignItems: 'flex-end', flexShrink: 1 },
  compactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'flex-end' },
  compactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1, borderColor: WebColors.border, backgroundColor: WebColors.cardBg,
  },
  compactText: { fontSize: 12, fontWeight: '600' },
  // toggle
  toggle: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: WebColors.border, overflow: 'hidden' },
  toggleBtn: { minHeight: 44, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: WebColors.cardBg },
  toggleBtnActive: { backgroundColor: WebColors.primaryLight },
  toggleText: { fontSize: 12, color: WebColors.textSecondary, fontWeight: '600' },
  toggleTextActive: { color: WebColors.primary },
  // banners
  bannerError: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: WebColors.dangerLight, borderRadius: 8, padding: 10, alignSelf: 'stretch' },
  bannerErrorText: { flex: 1, fontSize: 12, color: WebColors.danger },
  bannerSuccess: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: WebColors.successLight, borderRadius: 8, padding: 10, alignSelf: 'stretch' },
  bannerSuccessText: { flex: 1, fontSize: 12, color: WebColors.success, fontWeight: '600' },
});
