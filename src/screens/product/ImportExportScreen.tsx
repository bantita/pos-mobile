/**
 * SCR-PROD-004 — Import/Export Excel
 * FR-PROD-004: นำเข้า/ส่งออกข้อมูลสินค้าจำนวนมาก
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ImportRow } from '../../types/product';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency } from '../../utils/format';

interface ImportExportScreenProps {
  onBack: () => void;
  totalProducts?: number;
}

// Mock import preview data
const MOCK_IMPORT: ImportRow[] = [
  { rowNo: 2, code: 'P101', barcode: '8850001000001', name: 'สินค้าทดสอบ A', category: 'เครื่องดื่ม', unit: 'ขวด', costPrice: 10, salePrice: 15, errors: [] },
  { rowNo: 3, code: 'P102', barcode: '8850001000002', name: 'สินค้าทดสอบ B', category: 'ขนม', unit: 'ถุง', costPrice: 8, salePrice: 12, errors: [] },
  { rowNo: 4, code: '',     barcode: '8850001000003', name: 'สินค้า C ขาด Code', category: 'อาหาร', unit: 'ซอง', costPrice: 5, salePrice: 0, errors: ['รหัสสินค้าว่าง', 'ราคาขายต้องมากกว่า 0'] },
  { rowNo: 5, code: 'P104', barcode: '',              name: 'สินค้า D ขาด Barcode', category: 'ของใช้', unit: 'ก้อน', costPrice: 30, salePrice: 45, errors: ['Barcode ว่าง (ไม่บังคับ)'] },
  { rowNo: 6, code: 'P105', barcode: '8850001000005', name: 'สินค้าทดสอบ E', category: '', unit: 'กล่อง', costPrice: 25, salePrice: 35, errors: ['หมวดหมู่ไม่พบในระบบ'] },
];

type ImportStep = 'idle' | 'preview' | 'importing' | 'done';

export const ImportExportScreen: React.FC<ImportExportScreenProps> = ({ onBack, totalProducts = 127 }) => {
  const [importStep, setImportStep] = useState<ImportStep>('idle');
  const [importData] = useState<ImportRow[]>(MOCK_IMPORT);
  const [importProgress, setImportProgress] = useState(0);
  const [showErrorOnly, setShowErrorOnly] = useState(false);

  const errorRows = importData.filter((r) => r.errors.length > 0);
  const validRows = importData.filter((r) => r.errors.length === 0);
  const hasErrors = errorRows.length > 0;
  const displayData = showErrorOnly ? errorRows : importData;

  const handleSelectFile = () => {
    // Simulate file selection
    setImportStep('preview');
  };

  const handleConfirmImport = () => {
    if (hasErrors) {
      Alert.alert(
        'มี Error',
        `พบ ${errorRows.length} แถวที่มีข้อผิดพลาด ต้องการ Import เฉพาะแถวที่ถูกต้อง (${validRows.length} แถว)?`,
        [
          { text: 'ยกเลิก', style: 'cancel' },
          { text: `Import ${validRows.length} แถว`, onPress: startImport },
        ]
      );
    } else {
      startImport();
    }
  };

  const startImport = () => {
    setImportStep('importing');
    setImportProgress(0);
    const interval = setInterval(() => {
      setImportProgress((p) => {
        if (p >= 100) { clearInterval(interval); setImportStep('done'); return 100; }
        return p + 20;
      });
    }, 300);
  };

  const handleExport = (type: 'all' | 'filtered') => {
    Alert.alert('Export สำเร็จ', `Export สินค้า${type === 'all' ? 'ทั้งหมด' : 'ที่กรอง'} ${totalProducts} รายการ\nไฟล์: products_export.xlsx`);
  };

  const handleDownloadTemplate = () => {
    Alert.alert('ดาวน์โหลด', 'ดาวน์โหลด Template Excel\nไฟล์: product_import_template.xlsx');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import / Export สินค้า</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── IMPORT SECTION ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="cloud-upload-outline" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Import จาก Excel</Text>
          </View>

          {importStep === 'idle' && (
            <>
              <TouchableOpacity style={styles.filePickBtn} onPress={handleSelectFile} activeOpacity={0.8}>
                <Ionicons name="document-outline" size={32} color={Colors.primary} />
                <Text style={styles.filePickTitle}>เลือกไฟล์ Excel</Text>
                <Text style={styles.filePickSub}>รองรับ .xlsx, .xls ขนาดไม่เกิน 10MB</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.templateBtn} onPress={handleDownloadTemplate}>
                <Ionicons name="download-outline" size={16} color={Colors.primary} />
                <Text style={styles.templateBtnText}>ดาวน์โหลด Template Excel</Text>
              </TouchableOpacity>
            </>
          )}

          {importStep === 'preview' && (
            <>
              {/* File info */}
              <View style={styles.fileInfoRow}>
                <View style={styles.fileInfoIcon}>
                  <Ionicons name="document-text" size={22} color={Colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fileName}>products_import.xlsx</Text>
                  <Text style={styles.fileInfo}>{importData.length} แถว · 6 คอลัมน์</Text>
                </View>
                <TouchableOpacity onPress={() => setImportStep('idle')}>
                  <Ionicons name="close-circle" size={22} color={Colors.danger} />
                </TouchableOpacity>
              </View>

              {/* Error/Valid summary */}
              <View style={styles.importSummaryRow}>
                <View style={[styles.importSummaryCard, { borderColor: Colors.success }]}>
                  <Text style={[styles.importSummaryCount, { color: Colors.success }]}>{validRows.length}</Text>
                  <Text style={styles.importSummaryLabel}>แถวถูกต้อง</Text>
                </View>
                <View style={[styles.importSummaryCard, { borderColor: hasErrors ? Colors.danger : Colors.border }]}>
                  <Text style={[styles.importSummaryCount, { color: hasErrors ? Colors.danger : Colors.gray400 }]}>{errorRows.length}</Text>
                  <Text style={styles.importSummaryLabel}>แถวมี Error</Text>
                </View>
              </View>

              {/* Filter toggle */}
              <TouchableOpacity
                style={styles.errorToggle}
                onPress={() => setShowErrorOnly(!showErrorOnly)}
              >
                <Ionicons name={showErrorOnly ? 'eye-off-outline' : 'filter-outline'} size={14} color={Colors.primary} />
                <Text style={styles.errorToggleText}>
                  {showErrorOnly ? 'แสดงทั้งหมด' : `ดูเฉพาะ Error (${errorRows.length})`}
                </Text>
              </TouchableOpacity>

              {/* Preview Table */}
              <View style={styles.tableHeader}>
                {['แถว', 'รหัส', 'ชื่อสินค้า', 'ราคาขาย', 'สถานะ'].map((h) => (
                  <Text key={h} style={styles.tableHeaderText}>{h}</Text>
                ))}
              </View>
              {displayData.map((row) => (
                <View key={row.rowNo} style={[styles.tableRow, row.errors.length > 0 && styles.tableRowError]}>
                  <Text style={styles.tableCellSm}>{row.rowNo}</Text>
                  <Text style={styles.tableCellSm}>{row.code || '—'}</Text>
                  <Text style={[styles.tableCellLg]} numberOfLines={1}>{row.name}</Text>
                  <Text style={styles.tableCellSm}>{row.salePrice > 0 ? `฿${row.salePrice}` : '—'}</Text>
                  <View style={styles.tableCellStatus}>
                    {row.errors.length === 0 ? (
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    ) : (
                      <View style={styles.errorBadge}>
                        <Text style={styles.errorBadgeText}>{row.errors.length} Error</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}

              {/* Error details */}
              {hasErrors && (
                <View style={styles.errorDetailBox}>
                  <Text style={styles.errorDetailTitle}>รายละเอียด Error</Text>
                  {errorRows.map((row) => (
                    <View key={row.rowNo} style={styles.errorDetailRow}>
                      <Text style={styles.errorDetailRowNo}>แถว {row.rowNo}:</Text>
                      <Text style={styles.errorDetailMsg}>{row.errors.join(', ')}</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[styles.confirmImportBtn, hasErrors && styles.confirmImportBtnWarn]}
                onPress={handleConfirmImport}
                activeOpacity={0.85}
              >
                <Ionicons name="cloud-upload-outline" size={20} color={Colors.white} />
                <Text style={styles.confirmImportText}>
                  {hasErrors ? `Import ${validRows.length} แถว (ข้าม Error)` : `Confirm Import ทั้งหมด (${validRows.length} รายการ)`}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {importStep === 'importing' && (
            <View style={styles.progressBox}>
              <Ionicons name="sync-outline" size={40} color={Colors.primary} />
              <Text style={styles.progressTitle}>กำลัง Import...</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${importProgress}%` }]} />
              </View>
              <Text style={styles.progressPct}>{importProgress}%</Text>
            </View>
          )}

          {importStep === 'done' && (
            <View style={styles.doneBox}>
              <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
              <Text style={styles.doneTitle}>Import สำเร็จ</Text>
              <Text style={styles.doneSub}>เพิ่ม/อัปเดตสินค้า {validRows.length} รายการ</Text>
              <TouchableOpacity style={styles.resetImportBtn} onPress={() => setImportStep('idle')}>
                <Text style={styles.resetImportText}>Import ไฟล์ใหม่</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── EXPORT SECTION ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.successLight }]}>
              <Ionicons name="cloud-download-outline" size={20} color={Colors.success} />
            </View>
            <Text style={styles.sectionTitle}>Export เป็น Excel</Text>
          </View>
          <Text style={styles.exportInfo}>มีสินค้าทั้งหมด {totalProducts} รายการในระบบ</Text>

          <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('all')} activeOpacity={0.85}>
            <Ionicons name="download-outline" size={20} color={Colors.white} />
            <View>
              <Text style={styles.exportBtnText}>Export สินค้าทั้งหมด</Text>
              <Text style={styles.exportBtnSub}>{totalProducts} รายการ</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.exportBtn, styles.exportBtnOutline]} onPress={() => handleExport('filtered')} activeOpacity={0.85}>
            <Ionicons name="funnel-outline" size={20} color={Colors.primary} />
            <View>
              <Text style={[styles.exportBtnText, { color: Colors.primary }]}>Export เฉพาะที่กรอง</Text>
              <Text style={[styles.exportBtnSub, { color: Colors.textSecondary }]}>ตาม filter ที่เลือกไว้</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── TEMPLATE SECTION ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.warningLight }]}>
              <Ionicons name="document-text-outline" size={20} color={Colors.warning} />
            </View>
            <Text style={styles.sectionTitle}>Template</Text>
          </View>
          <Text style={styles.templateInfo}>
            ดาวน์โหลด Template Excel สำหรับกรอกข้อมูลสินค้า พร้อม header และตัวอย่าง
          </Text>
          <TouchableOpacity style={styles.templateDownloadBtn} onPress={handleDownloadTemplate} activeOpacity={0.85}>
            <Ionicons name="download-outline" size={20} color={Colors.warning} />
            <Text style={styles.templateDownloadText}>ดาวน์โหลด Template Excel</Text>
          </TouchableOpacity>
        </View>

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
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  sectionCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2,
  },
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
  templateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.md, padding: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  templateBtnText: { ...Typography.body2, color: Colors.primary },
  fileInfoRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.successLight, borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  fileInfoIcon: { width: 40, height: 40, borderRadius: BorderRadius.sm, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  fileName: { ...Typography.label, color: Colors.text },
  fileInfo: { ...Typography.caption, color: Colors.textSecondary },
  importSummaryRow: { flexDirection: 'row', gap: Spacing.md },
  importSummaryCard: {
    flex: 1, alignItems: 'center', borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 2, backgroundColor: Colors.surface,
  },
  importSummaryCount: { fontSize: 28, fontWeight: '800' },
  importSummaryLabel: { ...Typography.caption, color: Colors.textSecondary },
  errorToggle: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    alignSelf: 'flex-end',
  },
  errorToggleText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  tableHeader: { flexDirection: 'row', backgroundColor: Colors.gray100, borderRadius: BorderRadius.sm, padding: Spacing.sm },
  tableHeaderText: { flex: 1, ...Typography.caption, color: Colors.textSecondary, fontWeight: '700' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tableRowError: { backgroundColor: Colors.dangerLight },
  tableCellSm: { flex: 0.7, ...Typography.caption, color: Colors.text },
  tableCellLg: { flex: 2, ...Typography.caption, color: Colors.text },
  tableCellStatus: { flex: 0.8, alignItems: 'center' },
  errorBadge: { backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.sm, paddingHorizontal: 4, paddingVertical: 2 },
  errorBadgeText: { fontSize: 9, color: Colors.danger, fontWeight: '700' },
  errorDetailBox: {
    backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.xs,
  },
  errorDetailTitle: { ...Typography.label, color: Colors.danger, marginBottom: Spacing.xs },
  errorDetailRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  errorDetailRowNo: { ...Typography.caption, color: Colors.danger, fontWeight: '700' },
  errorDetailMsg: { ...Typography.caption, color: Colors.danger, flex: 1 },
  confirmImportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.success,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md,
  },
  confirmImportBtnWarn: { backgroundColor: Colors.warning },
  confirmImportText: { ...Typography.button, color: Colors.white },
  progressBox: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  progressTitle: { ...Typography.h4, color: Colors.text },
  progressBar: { width: '100%', height: 8, backgroundColor: Colors.gray200, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  progressPct: { ...Typography.label, color: Colors.primary },
  doneBox: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  doneTitle: { ...Typography.h3, color: Colors.success },
  doneSub: { ...Typography.body2, color: Colors.textSecondary },
  resetImportBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.primary,
  },
  resetImportText: { ...Typography.label, color: Colors.primary },
  exportInfo: { ...Typography.body2, color: Colors.textSecondary },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.success, borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  exportBtnOutline: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary },
  exportBtnText: { ...Typography.label, color: Colors.white },
  exportBtnSub: { ...Typography.caption, color: Colors.textSecondary },
  templateInfo: { ...Typography.body2, color: Colors.textSecondary },
  templateDownloadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.warningLight, borderRadius: BorderRadius.md, padding: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.warning,
  },
  templateDownloadText: { ...Typography.label, color: Colors.warning },
});
