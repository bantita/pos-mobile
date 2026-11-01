/**
 * SCR-PROD-004 — Import/Export สินค้า (.xlsx / .csv)
 * FR-PROD-004: นำเข้า/ส่งออกข้อมูลสินค้าจำนวนมาก (หลายหน่วย หลายบาร์โค้ด ตัวเลือกสินค้า)
 * ใช้โมดูลกลาง utils/masterImportExport (parse / validate / apply) ร่วมกับหน้าเว็บ
 * เลือกไฟล์/ดาวน์โหลดได้บนเว็บเท่านั้น (ยังไม่มี document picker บน iOS/Android)
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProductStore } from '../../store/productStore';
import {
  ImportPlan, ImportResult, applyImport, planProductImport, plannedWrites,
} from '../../utils/masterImportExport';
import { FileFormat, ImportFileError, pickFile, readFileToWorkbook } from '../../utils/spreadsheetIO';
import { downloadMasterFile, getImportContext, storePorts } from '../../utils/masterPorts';
import { Button, Card } from '../../components/ui';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, ComponentSize } from '../../constants/spacing';

interface ImportExportScreenProps {
  onBack: () => void;
  totalProducts?: number;
}

type ImportStep = 'idle' | 'preview' | 'importing' | 'done';

const IS_WEB = Platform.OS === 'web';
const WEB_ONLY_MSG = 'รองรับเฉพาะเว็บในเวอร์ชันนี้';
const MAX_ERRORS_SHOWN = 100;

export const ImportExportScreen: React.FC<ImportExportScreenProps> = ({ onBack, totalProducts }) => {
  const products = useProductStore((s) => s.products);

  const [importStep, setImportStep] = useState<ImportStep>('idle');
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileFormat, setFileFormat] = useState<FileFormat>('xlsx');
  const [reading, setReading] = useState(false);
  /** ยืนยันนำเข้าแบบ inline (Alert.alert ที่มีปุ่มไม่ทำงานบน react-native-web) */
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [downloading, setDownloading] = useState<'export' | 'template' | null>(null);

  const productCount = totalProducts ?? products.length;
  const writes = plan ? plannedWrites(plan) : 0;
  const hasErrors = (plan?.errors.length ?? 0) > 0;
  const newMasterCount = plan
    ? plan.newMasters.categories.length + plan.newMasters.brands.length + plan.newMasters.suppliers.length
    : 0;
  const isEmptyPlan = plan ? writes + plan.unchanged + plan.skippedRecords === 0 && !hasErrors : false;

  // ─── Import ────────────────────────────────────────────────────────────────
  const handleSelectFile = async () => {
    setParseError('');
    if (!IS_WEB) { Alert.alert('ไม่รองรับ', WEB_ONLY_MSG); return; }
    const file = await pickFile();
    if (!file) return;
    setReading(true);
    try {
      const wb = await readFileToWorkbook('product', file);
      const p = planProductImport(wb, getImportContext());
      if (p.fileErrors.length > 0) {
        setParseError(p.fileErrors.join('\n'));
        return;
      }
      setPlan(p);
      setFileName(file.name);
      setImportStep('preview');
    } catch (e) {
      setParseError(e instanceof ImportFileError ? e.message : 'อ่านไฟล์ไม่สำเร็จ กรุณาตรวจสอบรูปแบบไฟล์');
    } finally {
      setReading(false);
    }
  };

  const runImport = () => {
    if (!plan) return;
    setConfirmSkip(false);
    setImportStep('importing');
    setResult(applyImport(plan, storePorts));
    setImportStep('done');
  };

  const handleConfirmImport = () => {
    if (!plan || writes === 0) return;
    // มีแถวผิด → ถามยืนยันแบบ inline ก่อน (ใช้ได้ทั้งเว็บและ native)
    if (hasErrors && !confirmSkip) { setConfirmSkip(true); return; }
    runImport();
  };

  const resetImport = () => {
    setImportStep('idle');
    setPlan(null);
    setFileName('');
    setParseError('');
    setResult(null);
    setConfirmSkip(false);
  };

  // ─── Export / Template ─────────────────────────────────────────────────────
  const download = async (kind: 'export' | 'template') => {
    setDownloadError('');
    if (!IS_WEB) { setDownloadError(WEB_ONLY_MSG); return; }
    if (kind === 'export' && products.length === 0) { setDownloadError('ไม่มีข้อมูล — ยังไม่มีสินค้าในระบบให้ส่งออก'); return; }
    setDownloading(kind);
    try {
      await downloadMasterFile('product', kind, fileFormat);
    } catch {
      setDownloadError(kind === 'export' ? 'ส่งออกไฟล์ไม่สำเร็จ' : 'ดาวน์โหลด Template ไม่สำเร็จ');
    } finally {
      setDownloading(null);
    }
  };

  const errorBanner = (message: string, onDismiss: () => void) => (
    <View style={styles.errorBanner} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={ComponentSize.icon.md} color={Colors.danger} />
      <View style={{ flex: 1 }}>
        <Text style={styles.errorBannerTitle}>เกิดข้อผิดพลาด</Text>
        <Text style={styles.errorBannerText}>{message}</Text>
      </View>
      <TouchableOpacity onPress={onDismiss} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="ปิดข้อความ">
        <Ionicons name="close" size={ComponentSize.icon.md} color={Colors.danger} />
      </TouchableOpacity>
    </View>
  );

  const formatToggle = (
    <View style={styles.formatRow} accessibilityRole="radiogroup" accessibilityLabel="รูปแบบไฟล์">
      {(['xlsx', 'csv'] as const).map((f) => (
        <TouchableOpacity
          key={f}
          style={[styles.formatBtn, fileFormat === f && styles.formatBtnActive]}
          onPress={() => setFileFormat(f)}
          accessibilityRole="radio"
          accessibilityState={{ selected: fileFormat === f }}
        >
          <Text style={[styles.formatText, fileFormat === f && styles.formatTextActive]}>
            {f === 'xlsx' ? 'Excel (.xlsx)' : 'CSV (.csv)'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const summaryCard = (label: string, value: number, color: string) => (
    <View style={[styles.importSummaryCard, { borderColor: value > 0 ? color : Colors.border }]}>
      <Text style={[styles.importSummaryCount, { color: value > 0 ? color : Colors.gray400 }]}>{value}</Text>
      <Text style={styles.importSummaryLabel}>{label}</Text>
    </View>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="ย้อนกลับ">
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import / Export สินค้า</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {!IS_WEB && (
          <View style={styles.webOnlyBox}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.warning} />
            <Text style={styles.webOnlyText}>{WEB_ONLY_MSG} — นำเข้า/ส่งออกไฟล์ใช้ได้บนเว็บเท่านั้น</Text>
          </View>
        )}

        {/* ── IMPORT SECTION ── */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="cloud-upload-outline" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Import จากไฟล์ Excel / CSV</Text>
          </View>

          {parseError !== '' && importStep === 'idle' && errorBanner(parseError, () => setParseError(''))}

          {importStep === 'idle' && (
            <>
              <TouchableOpacity style={styles.filePickBtn} onPress={handleSelectFile} activeOpacity={0.8} disabled={!IS_WEB || reading}>
                {reading
                  ? <ActivityIndicator color={Colors.primary} />
                  : <Ionicons name="document-outline" size={32} color={Colors.primary} />}
                <Text style={styles.filePickTitle}>{reading ? 'กำลังอ่านไฟล์...' : 'เลือกไฟล์'}</Text>
                <Text style={styles.filePickSub}>รองรับ .xlsx, .csv ขนาดไม่เกิน 10MB</Text>
              </TouchableOpacity>
              <Text style={styles.templateInfo}>
                1 แถว = 1 หน่วยนับ (สินค้าหลายหน่วยใส่รหัสซ้ำ), บาร์โค้ดหลายค่าคั่นด้วย |,
                หมวดหมู่/แบรนด์/ผู้จำหน่ายที่ยังไม่มีจะสร้างให้อัตโนมัติ, ตัวเลือกสินค้าอยู่ในชีต ตัวเลือกสินค้า
              </Text>
            </>
          )}

          {importStep === 'preview' && plan && (
            <>
              <View style={styles.fileInfoRow}>
                <View style={styles.fileInfoIcon}>
                  <Ionicons name="document-text" size={22} color={Colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
                  <Text style={styles.fileInfo}>ตรวจสอบข้อมูลก่อนนำเข้า</Text>
                </View>
                <TouchableOpacity onPress={resetImport} style={styles.iconBtn} accessibilityLabel="ยกเลิกไฟล์นี้">
                  <Ionicons name="close-circle" size={22} color={Colors.danger} />
                </TouchableOpacity>
              </View>

              {isEmptyPlan ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="file-tray-outline" size={40} color={Colors.gray400} />
                  <Text style={styles.emptyText}>ไม่มีข้อมูล</Text>
                </View>
              ) : (
                <>
                  <View style={styles.importSummaryRow}>
                    {summaryCard('เพิ่มใหม่', plan.creates.length, Colors.success)}
                    {summaryCard('อัปเดต', plan.updates.length, Colors.primary)}
                    {summaryCard('ข้อผิดพลาด', plan.skippedRecords, Colors.danger)}
                  </View>
                  <Text style={styles.exportInfo}>
                    ไม่เปลี่ยนแปลง {plan.unchanged} รายการ · สร้างมาสเตอร์ใหม่ {newMasterCount} รายการ
                  </Text>

                  {hasErrors && (
                    <View style={styles.errorDetailBox}>
                      <Text style={styles.errorDetailTitle}>รายละเอียดข้อผิดพลาด (รายการเหล่านี้จะถูกข้าม)</Text>
                      {plan.errors.slice(0, MAX_ERRORS_SHOWN).map((e, i) => (
                        <Text key={`${e.sheet ?? ''}-${e.row}-${i}`} style={styles.errorDetailMsg}>• {e.message}</Text>
                      ))}
                      {plan.errors.length > MAX_ERRORS_SHOWN && (
                        <Text style={styles.errorDetailMsg}>และอีก {plan.errors.length - MAX_ERRORS_SHOWN} รายการ</Text>
                      )}
                    </View>
                  )}

                  {writes === 0 && (
                    <Text style={styles.exportInfo} accessibilityRole="alert">
                      {hasErrors ? 'ทุกรายการมีข้อผิดพลาด กรุณาแก้ไขไฟล์แล้วนำเข้าใหม่' : 'ข้อมูลในไฟล์ตรงกับในระบบแล้ว'}
                    </Text>
                  )}

                  {confirmSkip ? (
                    <View style={styles.confirmBox} accessibilityRole="alert">
                      <Text style={styles.confirmBoxText}>
                        พบ {plan.skippedRecords} รายการที่มีข้อผิดพลาด ต้องการนำเข้าเฉพาะรายการที่ถูกต้อง ({writes} รายการ)?
                      </Text>
                      <View style={styles.confirmBoxRow}>
                        <Button title="ยกเลิก" variant="secondary" onPress={() => setConfirmSkip(false)} style={styles.flex1} />
                        <Button title={`นำเข้า ${writes} รายการ`} onPress={runImport} style={styles.flex1} />
                      </View>
                    </View>
                  ) : (
                    <Button
                      title={writes === 0
                        ? 'ไม่มีรายการที่ต้องบันทึก'
                        : hasErrors ? `นำเข้า ${writes} รายการ (ข้ามที่ผิด)` : `ยืนยันนำเข้า (${writes} รายการ)`}
                      onPress={handleConfirmImport}
                      disabled={writes === 0}
                      fullWidth
                    />
                  )}
                </>
              )}
            </>
          )}

          {importStep === 'importing' && (
            <View style={styles.progressBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.progressTitle}>กำลังนำเข้า...</Text>
            </View>
          )}

          {importStep === 'done' && result && (
            <View style={styles.doneBox}>
              <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
              <Text style={styles.doneTitle}>นำเข้าสำเร็จ</Text>
              <Text style={styles.doneSub}>
                เพิ่ม {result.created} · อัปเดต {result.updated} · สร้างมาสเตอร์ใหม่ {result.mastersCreated}
                {result.skipped > 0 ? ` · ข้าม ${result.skipped}` : ''} รายการ
              </Text>
              <Button title="นำเข้าไฟล์ใหม่" variant="outline" onPress={resetImport} />
            </View>
          )}
        </Card>

        {/* ── EXPORT SECTION ── */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.successLight }]}>
              <Ionicons name="cloud-download-outline" size={20} color={Colors.success} />
            </View>
            <Text style={styles.sectionTitle}>Export / Template</Text>
          </View>
          <Text style={styles.exportInfo}>มีสินค้าทั้งหมด {productCount} รายการในระบบ</Text>
          {formatToggle}

          {downloadError !== '' && errorBanner(downloadError, () => setDownloadError(''))}

          <Button
            title={`Export สินค้าทั้งหมด (${productCount} รายการ · .${fileFormat})`}
            onPress={() => download('export')}
            loading={downloading === 'export'}
            disabled={!IS_WEB || downloading !== null}
            fullWidth
          />

          <Text style={styles.templateInfo}>
            Template มีหัวคอลัมน์และตัวอย่างสินค้าหลายหน่วย/หลายบาร์โค้ด และตัวเลือกสินค้า
          </Text>
          <Button
            title={`ดาวน์โหลด Template (.${fileFormat})`}
            variant="outline"
            onPress={() => download('template')}
            loading={downloading === 'template'}
            disabled={!IS_WEB || downloading !== null}
            fullWidth
          />
        </Card>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs, minWidth: 44, minHeight: 44, justifyContent: 'center' },
  headerTitle: { ...Typography.h4, color: Colors.white },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  webOnlyBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.warningLight, borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  webOnlyText: { ...Typography.caption, color: Colors.warning, flex: 1 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  errorBannerTitle: { ...Typography.label, color: Colors.danger },
  errorBannerText: { ...Typography.body2, color: Colors.danger },
  sectionCard: { gap: Spacing.md },
  flex1: { flex: 1 },
  confirmBox: {
    gap: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.md,
    backgroundColor: Colors.warningLight, borderWidth: 1, borderColor: Colors.warning,
  },
  confirmBoxText: { ...Typography.body2, color: Colors.text },
  confirmBoxRow: { flexDirection: 'row', gap: Spacing.sm },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionIcon: { width: 36, height: 36, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  filePickBtn: {
    borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed',
    borderRadius: BorderRadius.md, padding: Spacing.xl, alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.primaryLight,
  },
  filePickTitle: { ...Typography.label, color: Colors.primary },
  filePickSub: { ...Typography.caption, color: Colors.textSecondary },
  fileInfoRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.successLight, borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  fileInfoIcon: { width: 40, height: 40, borderRadius: BorderRadius.sm, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  fileName: { ...Typography.label, color: Colors.text },
  fileInfo: { ...Typography.caption, color: Colors.textSecondary },
  iconBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  emptyText: { ...Typography.body2, color: Colors.textSecondary },
  importSummaryRow: { flexDirection: 'row', gap: Spacing.sm },
  importSummaryCard: {
    flex: 1, alignItems: 'center', borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 2, backgroundColor: Colors.surface,
  },
  importSummaryCount: { ...Typography.h2 },
  importSummaryLabel: { ...Typography.caption, color: Colors.textSecondary },
  errorDetailBox: { backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.xs },
  errorDetailTitle: { ...Typography.label, color: Colors.danger, marginBottom: Spacing.xs },
  errorDetailMsg: { ...Typography.caption, color: Colors.danger },
  progressBox: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  progressTitle: { ...Typography.h4, color: Colors.text },
  doneBox: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  doneTitle: { ...Typography.h3, color: Colors.success },
  doneSub: { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center' },
  formatRow: { flexDirection: 'row', gap: Spacing.sm },
  formatBtn: {
    flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center',
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  formatBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  formatText: { ...Typography.body2, color: Colors.textSecondary },
  formatTextActive: { color: Colors.primary, fontWeight: '700' },
  exportInfo: { ...Typography.body2, color: Colors.textSecondary },
  templateInfo: { ...Typography.body2, color: Colors.textSecondary },
});
