/**
 * SCR-PROD-004 — Import/Export ข้อมูลมาสเตอร์ (.xlsx / .csv): สินค้า หมวดหมู่ แบรนด์ ผู้จำหน่าย
 * FR-PROD-004: นำเข้า/ส่งออกข้อมูลจำนวนมาก (หลายหน่วย หลายบาร์โค้ด ตัวเลือกสินค้า)
 *
 * นำเข้า 4 ขั้น (เหมือนหน้าเว็บ — useMasterMigration + buildMigrationPlan ร่วมกัน):
 *   1 เลือกไฟล์ → 2 ตรวจสอบข้อมูล (ไมเกรต) → 3 ยืนยันอีกครั้ง → 4 ผลลัพธ์
 * เลือกไฟล์/ดาวน์โหลดได้บนเว็บเท่านั้น (ยังไม่มี document picker บน iOS/Android)
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProductStore } from '../../store/productStore';
import { ENTITY_LABELS, MasterEntity } from '../../utils/masterImportExport';
import { FileFormat } from '../../utils/spreadsheetIO';
import { downloadMasterFile, getMasterCount } from '../../utils/masterPorts';
import { MIGRATION_STEPS, useMasterMigration } from '../../hooks/useMasterMigration';
import { MobileMigrationWizard } from '../../components/product/MasterMigrationWizard';
import { Alert, Button, Card, StepIndicator } from '../../components/ui';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, ComponentSize } from '../../constants/spacing';

interface ImportExportScreenProps {
  onBack: () => void;
  totalProducts?: number;
}

const IS_WEB = Platform.OS === 'web';
const WEB_ONLY_MSG = 'รองรับเฉพาะเว็บในเวอร์ชันนี้';
const ENTITIES: MasterEntity[] = ['product', 'category', 'brand', 'supplier'];

const IMPORT_HINT: Record<MasterEntity, string> = {
  product: '1 แถว = 1 หน่วยนับ (สินค้าหลายหน่วยใส่รหัสซ้ำ), บาร์โค้ดหลายค่าคั่นด้วย |, หมวดหมู่/แบรนด์/ผู้จำหน่ายที่ยังไม่มีจะสร้างให้อัตโนมัติ, ตัวเลือกสินค้าอยู่ในชีต ตัวเลือกสินค้า',
  category: 'จับคู่ด้วยชื่อหมวดหมู่ (ไม่สนตัวพิมพ์/ช่องว่าง) — หมวดหมู่หลักต้องมีในระบบหรือในไฟล์',
  brand: 'จับคู่ด้วยชื่อแบรนด์ (ไม่สนตัวพิมพ์/ช่องว่าง)',
  supplier: 'จับคู่ด้วยเลขผู้เสียภาษีก่อน ถ้าไม่มีจับคู่ด้วยชื่อ',
};

export const ImportExportScreen: React.FC<ImportExportScreenProps> = ({ onBack, totalProducts }) => {
  const products = useProductStore((s) => s.products);

  const [entity, setEntity] = useState<MasterEntity>('product');
  const [fileFormat, setFileFormat] = useState<FileFormat>('xlsx');
  const [downloadError, setDownloadError] = useState('');
  const [downloading, setDownloading] = useState<'export' | 'template' | null>(null);

  const flow = useMasterMigration(entity);
  const label = ENTITY_LABELS[entity];
  const count = entity === 'product' ? totalProducts ?? products.length : getMasterCount(entity);
  const reading = flow.busy === 'read';
  /** เปลี่ยนมาสเตอร์ได้เฉพาะตอนยังไม่เลือกไฟล์ */
  const locked = flow.step > 1 || reading;

  const selectEntity = (e: MasterEntity) => {
    if (locked) return;
    flow.reset();
    setDownloadError('');
    setEntity(e);
  };

  // ─── Export / Template ─────────────────────────────────────────────────────
  const download = async (kind: 'export' | 'template') => {
    setDownloadError('');
    if (!IS_WEB) { setDownloadError(WEB_ONLY_MSG); return; }
    if (kind === 'export' && count === 0) { setDownloadError(`ไม่มีข้อมูล — ยังไม่มี${label}ในระบบให้ส่งออก`); return; }
    setDownloading(kind);
    try {
      await downloadMasterFile(entity, kind, fileFormat);
    } catch {
      setDownloadError(kind === 'export' ? 'ส่งออกไฟล์ไม่สำเร็จ' : 'ดาวน์โหลด Template ไม่สำเร็จ');
    } finally {
      setDownloading(null);
    }
  };

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

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="ย้อนกลับ">
          <Ionicons name="arrow-back" size={ComponentSize.icon.lg} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import / Export ข้อมูลมาสเตอร์</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {!IS_WEB && (
          <View style={styles.webOnlyBox}>
            <Ionicons name="information-circle-outline" size={ComponentSize.icon.md} color={Colors.warning} />
            <Text style={styles.webOnlyText}>{WEB_ONLY_MSG} — นำเข้า/ส่งออกไฟล์ใช้ได้บนเว็บเท่านั้น</Text>
          </View>
        )}

        {/* ── ENTITY ── */}
        <View style={styles.entityRow} accessibilityRole="radiogroup" accessibilityLabel="ข้อมูลมาสเตอร์">
          {ENTITIES.map((e) => {
            const active = entity === e;
            return (
              <TouchableOpacity
                key={e}
                style={[styles.entityChip, active && styles.entityChipActive, locked && !active && styles.disabled]}
                onPress={() => selectEntity(e)}
                disabled={locked && !active}
                accessibilityRole="radio"
                accessibilityState={{ selected: active, disabled: locked && !active }}
              >
                <Text style={[styles.entityText, active && styles.entityTextActive]}>{ENTITY_LABELS[e]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── IMPORT SECTION ── */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="cloud-upload-outline" size={ComponentSize.icon.md} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>นำเข้า{label}จากไฟล์ Excel / CSV</Text>
          </View>

          <StepIndicator steps={MIGRATION_STEPS} current={flow.step} />

          {flow.step === 1 && (
            <>
              {flow.error !== '' && (
                <Alert type="error" message={flow.error} onDismiss={() => flow.setError('')} />
              )}
              <TouchableOpacity
                style={[styles.filePickBtn, (!IS_WEB || reading) && styles.disabled]}
                onPress={() => { void flow.pickAndReview(); }}
                activeOpacity={0.8}
                disabled={!IS_WEB || reading}
                accessibilityRole="button"
                accessibilityLabel={`เลือกไฟล์นำเข้า${label}`}
                accessibilityState={{ disabled: !IS_WEB || reading, busy: reading }}
              >
                {reading
                  ? <ActivityIndicator color={Colors.primary} />
                  : <Ionicons name="document-outline" size={ComponentSize.icon.xl} color={Colors.primary} />}
                <Text style={styles.filePickTitle}>{reading ? 'กำลังอ่านและตรวจสอบไฟล์...' : 'เลือกไฟล์'}</Text>
                <Text style={styles.filePickSub}>รองรับ .xlsx, .csv ขนาดไม่เกิน 10MB — ตรวจสอบข้อมูลก่อนบันทึกทุกครั้ง</Text>
              </TouchableOpacity>
              <Text style={styles.templateInfo}>{IMPORT_HINT[entity]}</Text>
            </>
          )}

          <MobileMigrationWizard flow={flow} />
        </Card>

        {/* ── EXPORT SECTION ── */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.successLight }]}>
              <Ionicons name="cloud-download-outline" size={ComponentSize.icon.md} color={Colors.success} />
            </View>
            <Text style={styles.sectionTitle}>Export / Template</Text>
          </View>
          <Text style={styles.exportInfo}>มี{label}ทั้งหมด {count} รายการในระบบ</Text>
          {formatToggle}

          {downloadError !== '' && (
            <Alert type="error" message={downloadError} onDismiss={() => setDownloadError('')} />
          )}

          <Button
            title={`Export ${label}ทั้งหมด (${count} รายการ · .${fileFormat})`}
            onPress={() => download('export')}
            loading={downloading === 'export'}
            disabled={!IS_WEB || downloading !== null}
            fullWidth
          />

          <Text style={styles.templateInfo}>
            {entity === 'product'
              ? 'Template มีหัวคอลัมน์และตัวอย่างสินค้าหลายหน่วย/หลายบาร์โค้ด และตัวเลือกสินค้า'
              : `Template มีหัวคอลัมน์และตัวอย่างข้อมูล${label}`}
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
  backBtn: { padding: Spacing.xs, minWidth: ComponentSize.button.md, minHeight: ComponentSize.button.md, justifyContent: 'center' },
  headerTitle: { ...Typography.h4, color: Colors.white, flex: 1, textAlign: 'center' },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  webOnlyBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.warningLight, borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  webOnlyText: { ...Typography.caption, color: Colors.warning, flex: 1 },
  disabled: { opacity: 0.5 },
  entityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  entityChip: {
    flexGrow: 1, minHeight: ComponentSize.button.md, paddingHorizontal: Spacing.md,
    alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  entityChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  entityText: { ...Typography.body2, color: Colors.textSecondary },
  entityTextActive: { color: Colors.primary, fontWeight: '700' },
  sectionCard: { gap: Spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionIcon: {
    width: ComponentSize.avatar.sm, height: ComponentSize.avatar.sm, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { ...Typography.label, color: Colors.text, fontWeight: '700', flex: 1 },
  filePickBtn: {
    borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed',
    borderRadius: BorderRadius.md, padding: Spacing.xl, alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.primaryLight,
  },
  filePickTitle: { ...Typography.label, color: Colors.primary },
  filePickSub: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  formatRow: { flexDirection: 'row', gap: Spacing.sm },
  formatBtn: {
    flex: 1, minHeight: ComponentSize.button.md, alignItems: 'center', justifyContent: 'center',
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  formatBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  formatText: { ...Typography.body2, color: Colors.textSecondary },
  formatTextActive: { color: Colors.primary, fontWeight: '700' },
  exportInfo: { ...Typography.body2, color: Colors.textSecondary },
  templateInfo: { ...Typography.body2, color: Colors.textSecondary },
});
