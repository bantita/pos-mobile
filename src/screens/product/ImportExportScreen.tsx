/**
 * SCR-PROD-004 — Import/Export สินค้า (CSV)
 * FR-PROD-004: นำเข้า/ส่งออกข้อมูลสินค้าจำนวนมาก
 * เว็บเท่านั้น: ใช้ <input type=file> + FileReader + Blob (ไม่มี dependency เพิ่ม)
 */
import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ImportRow, ProductMaster, ProductUOM } from '../../types/product';
import { useProductStore } from '../../store/productStore';
import { getCategories } from '../../store/categoryStore';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface ImportExportScreenProps {
  onBack: () => void;
  totalProducts?: number;
}

type ImportStep = 'idle' | 'preview' | 'importing' | 'done';

const IS_WEB = Platform.OS === 'web';
const WEB_ONLY_MSG = 'รองรับเฉพาะเว็บในเวอร์ชันนี้';

// Template columns (ตรงกับ public/templates/pricing_import_template.csv + product fields)
const TEMPLATE_HEADER = 'รหัสสินค้า,ชื่อสินค้า,หมวดหมู่,หน่วย,ราคาทุน,ราคาขาย,บาร์โค้ด,หมายเหตุ';
const TEMPLATE_ROWS = [
  'P101,น้ำดื่มสิงห์ 600ml,เครื่องดื่ม,ขวด,6,10,8850999000001,ตัวอย่างสินค้าใหม่',
  'P102,ขนมปังกรอบ,ขนม,ถุง,8,12,8850001000002,',
].join('\n');

// ─── CSV helpers (hand-rolled, ไม่มี dependency) ─────────────────────────────
/** แยกข้อความ CSV เป็นแถว/เซลล์ รองรับ BOM, CRLF/LF และ field ที่ครอบด้วย " */
function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\ufeff/, '');
  const rows: string[][] = [];
  let cell = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ',') { row.push(cell); cell = ''; continue; }
    if (ch === '\r') continue;
    if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; continue; }
    cell += ch;
  }
  if (cell.length > 0 || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** ครอบ cell ด้วย " ถ้ามี , " หรือขึ้นบรรทัดใหม่ */
function escapeCsvCell(value: string | number): string {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** ดาวน์โหลดข้อความเป็นไฟล์ CSV ผ่าน Blob (เว็บเท่านั้น) — ใส่ BOM ให้ Excel อ่านไทยได้ */
function downloadCsv(filename: string, content: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// map หัวคอลัมน์ไทย → field (รองรับหลายชื่อ)
function resolveHeaderIndex(headers: string[]): Record<string, number> {
  const idx: Record<string, number> = {};
  headers.forEach((raw, i) => {
    const h = raw.trim().toLowerCase();
    if (h.includes('รหัส')) idx.code = i;
    else if (h.includes('บาร์โค้ด') || h.includes('barcode')) idx.barcode = i;
    else if (h.includes('ชื่อ')) idx.name = i;
    else if (h.includes('หมวด')) idx.category = i;
    else if (h.includes('หน่วย')) idx.unit = i;
    else if (h.includes('ราคาทุน') || h.includes('ต้นทุน')) idx.costPrice = i;
    else if (h.includes('ราคาขาย') || h.includes('ราคาใหม่') || h.includes('ราคา')) idx.salePrice = i;
  });
  return idx;
}

export const ImportExportScreen: React.FC<ImportExportScreenProps> = ({ onBack, totalProducts }) => {
  const products = useProductStore((s) => s.products);
  const addProduct = useProductStore((s) => s.addProduct);
  const updateProduct = useProductStore((s) => s.updateProduct);

  const [importStep, setImportStep] = useState<ImportStep>('idle');
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const [showErrorOnly, setShowErrorOnly] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const productCount = totalProducts ?? products.length;

  const errorRows = useMemo(() => importData.filter((r) => r.errors.length > 0), [importData]);
  const validRows = useMemo(() => importData.filter((r) => r.errors.length === 0), [importData]);
  const hasErrors = errorRows.length > 0;
  const displayData = showErrorOnly ? errorRows : importData;

  // ─── Import ────────────────────────────────────────────────────────────────
  const validateRow = (row: Omit<ImportRow, 'errors'>): string[] => {
    const errors: string[] = [];
    const activeCategoryNames = getCategories().filter((c) => c.status === 'active').map((c) => c.name);
    if (!row.code.trim()) errors.push('รหัสสินค้าว่าง');
    if (!row.name.trim()) errors.push('ชื่อสินค้าว่าง');
    if (!(row.salePrice > 0)) errors.push('ราคาขายต้องมากกว่า 0');
    if (row.category && !activeCategoryNames.includes(row.category)) {
      errors.push('หมวดหมู่ไม่พบในระบบ');
    }
    return errors;
  };

  const parseFileText = (text: string, name: string) => {
    const grid = parseCsv(text);
    if (grid.length < 2) {
      setParseError('ไฟล์ว่างหรือไม่มีข้อมูล (ต้องมีหัวคอลัมน์และข้อมูลอย่างน้อย 1 แถว)');
      return;
    }
    const headers = grid[0];
    const col = resolveHeaderIndex(headers);
    if (col.code === undefined || col.name === undefined || col.salePrice === undefined) {
      setParseError('ไม่พบคอลัมน์ที่จำเป็น (ต้องมี รหัสสินค้า, ชื่อสินค้า และ ราคาขาย/ราคาใหม่)');
      return;
    }
    const at = (cells: string[], i?: number) => (i === undefined ? '' : (cells[i] ?? '').trim());
    const rows: ImportRow[] = grid.slice(1).map((cells, i) => {
      const base = {
        rowNo: i + 2,
        code: at(cells, col.code),
        barcode: at(cells, col.barcode),
        name: at(cells, col.name),
        category: at(cells, col.category),
        unit: at(cells, col.unit) || 'ชิ้น',
        costPrice: parseFloat(at(cells, col.costPrice)) || 0,
        salePrice: parseFloat(at(cells, col.salePrice)) || 0,
      };
      return { ...base, errors: validateRow(base) };
    });
    setImportData(rows);
    setFileName(name);
    setImportStep('preview');
  };

  const handleSelectFile = () => {
    setParseError('');
    if (!IS_WEB) { Alert.alert('ไม่รองรับ', WEB_ONLY_MSG); return; }
    let input = fileInputRef.current;
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,text/csv';
      fileInputRef.current = input;
    }
    input.value = '';
    input.onchange = () => {
      const file = input!.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          parseFileText(String(reader.result ?? ''), file.name);
        } catch {
          setParseError('อ่านไฟล์ไม่สำเร็จ กรุณาตรวจสอบรูปแบบไฟล์ CSV');
        }
      };
      reader.onerror = () => setParseError('อ่านไฟล์ไม่สำเร็จ');
      reader.readAsText(file, 'utf-8');
    };
    input.click();
  };

  const applyImport = () => {
    setImportStep('importing');
    const existingByCode = new Map(products.map((p) => [p.code, p]));
    const categoriesList = getCategories();
    let count = 0;
    validRows.forEach((row) => {
      const existing = existingByCode.get(row.code);
      const category = categoriesList.find((c) => c.name === row.category);
      if (existing) {
        updateProduct(existing.id, {
          name: row.name || existing.name,
          barcode: row.barcode || existing.barcode,
          categoryId: category?.id ?? existing.categoryId,
          categoryName: category?.name ?? existing.categoryName,
          unit: row.unit || existing.unit,
          costPrice: row.costPrice,
          salePrice: row.salePrice,
        });
      } else {
        const baseUom: ProductUOM = {
          id: 'uom_base',
          unit: row.unit || 'ชิ้น',
          ratio: 1,
          costPrice: row.costPrice,
          salePrice: row.salePrice,
          barcodes: row.barcode ? [row.barcode] : [],
          isDefault: true,
        };
        const newProduct: ProductMaster = {
          id: `p_${Date.now()}_${count}`,
          code: row.code,
          barcode: row.barcode,
          name: row.name,
          categoryId: category?.id ?? '',
          categoryName: category?.name ?? row.category,
          unit: row.unit || 'ชิ้น',
          costPrice: row.costPrice,
          salePrice: row.salePrice,
          vatIncluded: true,
          vatRate: 7,
          status: 'active',
          stockQty: 0,
          minStock: 5,
          uoms: [baseUom],
          productType: 'general',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        addProduct(newProduct);
      }
      count++;
    });
    setImportedCount(count);
    setImportStep('done');
  };

  const handleConfirmImport = () => {
    if (validRows.length === 0) {
      Alert.alert('ไม่มีข้อมูลที่ถูกต้อง', 'ทุกแถวมีข้อผิดพลาด กรุณาแก้ไขไฟล์แล้วนำเข้าใหม่');
      return;
    }
    if (hasErrors) {
      Alert.alert(
        'มีข้อผิดพลาด',
        `พบ ${errorRows.length} แถวที่มีข้อผิดพลาด ต้องการนำเข้าเฉพาะแถวที่ถูกต้อง (${validRows.length} แถว)?`,
        [
          { text: 'ยกเลิก', style: 'cancel' },
          { text: `นำเข้า ${validRows.length} แถว`, onPress: applyImport },
        ]
      );
    } else {
      applyImport();
    }
  };

  const resetImport = () => {
    setImportStep('idle');
    setImportData([]);
    setFileName('');
    setParseError('');
    setShowErrorOnly(false);
  };

  // ─── Export ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!IS_WEB) { Alert.alert('ไม่รองรับ', WEB_ONLY_MSG); return; }
    if (products.length === 0) { Alert.alert('ไม่มีข้อมูล', 'ยังไม่มีสินค้าในระบบให้ส่งออก'); return; }
    const header = 'รหัสสินค้า,ชื่อสินค้า,หมวดหมู่,หน่วย,ราคาทุน,ราคาขาย,บาร์โค้ด,VAT,สถานะ';
    const rows = products.map((p) =>
      [p.code, p.name, p.categoryName, p.unit, p.costPrice, p.salePrice, p.barcode, p.vatRate, p.status === 'active' ? 'ใช้งาน' : 'ปิด']
        .map(escapeCsvCell)
        .join(',')
    );
    downloadCsv('products_export.csv', [header, ...rows].join('\n'));
  };

  const handleDownloadTemplate = () => {
    if (!IS_WEB) { Alert.alert('ไม่รองรับ', WEB_ONLY_MSG); return; }
    downloadCsv('product_import_template.csv', [TEMPLATE_HEADER, TEMPLATE_ROWS].join('\n'));
  };

  // ─── Render ────────────────────────────────────────────────────────────────
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

        {!IS_WEB && (
          <View style={styles.webOnlyBox}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.warning} />
            <Text style={styles.webOnlyText}>{WEB_ONLY_MSG} — นำเข้า/ส่งออกไฟล์ใช้ได้บนเว็บเท่านั้น</Text>
          </View>
        )}

        {/* ── IMPORT SECTION ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="cloud-upload-outline" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Import จากไฟล์ CSV</Text>
          </View>

          {parseError !== '' && importStep === 'idle' && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
              <Text style={styles.errorBannerText}>{parseError}</Text>
            </View>
          )}

          {importStep === 'idle' && (
            <>
              <TouchableOpacity style={styles.filePickBtn} onPress={handleSelectFile} activeOpacity={0.8} disabled={!IS_WEB}>
                <Ionicons name="document-outline" size={32} color={Colors.primary} />
                <Text style={styles.filePickTitle}>เลือกไฟล์ CSV</Text>
                <Text style={styles.filePickSub}>รองรับ .csv (เข้ารหัส UTF-8)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.templateBtn} onPress={handleDownloadTemplate}>
                <Ionicons name="download-outline" size={16} color={Colors.primary} />
                <Text style={styles.templateBtnText}>ดาวน์โหลด Template CSV</Text>
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
                  <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
                  <Text style={styles.fileInfo}>{importData.length} แถว</Text>
                </View>
                <TouchableOpacity onPress={resetImport}>
                  <Ionicons name="close-circle" size={22} color={Colors.danger} />
                </TouchableOpacity>
              </View>

              {importData.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="file-tray-outline" size={40} color={Colors.gray400} />
                  <Text style={styles.emptyText}>ไม่มีข้อมูลในไฟล์</Text>
                </View>
              ) : (
                <>
                  {/* Error/Valid summary */}
                  <View style={styles.importSummaryRow}>
                    <View style={[styles.importSummaryCard, { borderColor: Colors.success }]}>
                      <Text style={[styles.importSummaryCount, { color: Colors.success }]}>{validRows.length}</Text>
                      <Text style={styles.importSummaryLabel}>แถวถูกต้อง</Text>
                    </View>
                    <View style={[styles.importSummaryCard, { borderColor: hasErrors ? Colors.danger : Colors.border }]}>
                      <Text style={[styles.importSummaryCount, { color: hasErrors ? Colors.danger : Colors.gray400 }]}>{errorRows.length}</Text>
                      <Text style={styles.importSummaryLabel}>แถวมีข้อผิดพลาด</Text>
                    </View>
                  </View>

                  {/* Filter toggle */}
                  {hasErrors && (
                    <TouchableOpacity style={styles.errorToggle} onPress={() => setShowErrorOnly(!showErrorOnly)}>
                      <Ionicons name={showErrorOnly ? 'eye-off-outline' : 'filter-outline'} size={14} color={Colors.primary} />
                      <Text style={styles.errorToggleText}>
                        {showErrorOnly ? 'แสดงทั้งหมด' : `ดูเฉพาะที่ผิด (${errorRows.length})`}
                      </Text>
                    </TouchableOpacity>
                  )}

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
                      <Text style={styles.tableCellLg} numberOfLines={1}>{row.name || '—'}</Text>
                      <Text style={styles.tableCellSm}>{row.salePrice > 0 ? `฿${row.salePrice}` : '—'}</Text>
                      <View style={styles.tableCellStatus}>
                        {row.errors.length === 0 ? (
                          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                        ) : (
                          <View style={styles.errorBadge}>
                            <Text style={styles.errorBadgeText}>{row.errors.length} ผิด</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}

                  {/* Error details */}
                  {hasErrors && (
                    <View style={styles.errorDetailBox}>
                      <Text style={styles.errorDetailTitle}>รายละเอียดข้อผิดพลาด</Text>
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
                      {hasErrors ? `นำเข้า ${validRows.length} แถว (ข้ามที่ผิด)` : `ยืนยันนำเข้าทั้งหมด (${validRows.length} รายการ)`}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          {importStep === 'importing' && (
            <View style={styles.progressBox}>
              <Ionicons name="sync-outline" size={40} color={Colors.primary} />
              <Text style={styles.progressTitle}>กำลังนำเข้า...</Text>
            </View>
          )}

          {importStep === 'done' && (
            <View style={styles.doneBox}>
              <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
              <Text style={styles.doneTitle}>นำเข้าสำเร็จ</Text>
              <Text style={styles.doneSub}>เพิ่ม/อัปเดตสินค้า {importedCount} รายการ</Text>
              <TouchableOpacity style={styles.resetImportBtn} onPress={resetImport}>
                <Text style={styles.resetImportText}>นำเข้าไฟล์ใหม่</Text>
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
            <Text style={styles.sectionTitle}>Export เป็น CSV</Text>
          </View>
          <Text style={styles.exportInfo}>มีสินค้าทั้งหมด {productCount} รายการในระบบ</Text>

          <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.85} disabled={!IS_WEB}>
            <Ionicons name="download-outline" size={20} color={Colors.white} />
            <View>
              <Text style={styles.exportBtnText}>Export สินค้าทั้งหมด</Text>
              <Text style={styles.exportBtnSub}>{productCount} รายการ</Text>
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
            ดาวน์โหลด Template CSV สำหรับกรอกข้อมูลสินค้า พร้อม header และตัวอย่าง
          </Text>
          <TouchableOpacity style={styles.templateDownloadBtn} onPress={handleDownloadTemplate} activeOpacity={0.85} disabled={!IS_WEB}>
            <Ionicons name="download-outline" size={20} color={Colors.warning} />
            <Text style={styles.templateDownloadText}>ดาวน์โหลด Template CSV</Text>
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
  webOnlyBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.warningLight, borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  webOnlyText: { ...Typography.caption, color: Colors.warning, flex: 1 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  errorBannerText: { ...Typography.body2, color: Colors.danger, flex: 1 },
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
  emptyBox: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  emptyText: { ...Typography.body2, color: Colors.textSecondary },
  importSummaryRow: { flexDirection: 'row', gap: Spacing.md },
  importSummaryCard: {
    flex: 1, alignItems: 'center', borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 2, backgroundColor: Colors.surface,
  },
  importSummaryCount: { fontSize: 28, fontWeight: '800' },
  importSummaryLabel: { ...Typography.caption, color: Colors.textSecondary },
  errorToggle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, alignSelf: 'flex-end' },
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
  errorDetailBox: { backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.xs },
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
