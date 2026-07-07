import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';
import { ImportRow } from '@/features/product/domain/product';
import { formatCurrency } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

interface ImportExportScreenProps {
  onBack: () => void;
  totalProducts?: number;
}

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

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');

  const errorRows = importData.filter((r) => r.errors.length > 0);
  const validRows = importData.filter((r) => r.errors.length === 0);
  const hasErrors = errorRows.length > 0;
  const displayData = showErrorOnly ? errorRows : importData;

  const handleSelectFile = () => {
    setImportStep('preview');
  };

  const handleConfirmImport = () => {
    if (hasErrors) {
      setConfirmMessage(`พบ ${errorRows.length} แถวที่มีข้อผิดพลาด ต้องการ Import เฉพาะแถวที่ถูกต้อง (${validRows.length} แถว)?`);
      setConfirmVisible(true);
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
    setAlertTitle('Export สำเร็จ');
    setAlertMessage(`Export สินค้า${type === 'all' ? 'ทั้งหมด' : 'ที่กรอง'} ${totalProducts} รายการ\nไฟล์: products_export.xlsx`);
    setAlertVisible(true);
  };

  const handleDownloadTemplate = () => {
    setAlertTitle('ดาวน์โหลด');
    setAlertMessage('ดาวน์โหลด Template Excel\nไฟล์: product_import_template.xlsx');
    setAlertVisible(true);
  };

  return (
    <SafeAreaView className={cn('flex-1', 'bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center justify-between bg-rose-600 px-3 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className={cn('text-lg font-extrabold text-white')}>Import / Export สินค้า</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName={cn('p-3 gap-3')}>

        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <View className={cn('flex-row items-center gap-2')}>
            <View className={cn('w-9 h-9 rounded-lg items-center justify-center bg-rose-50')}>
              <Ionicons name="cloud-upload-outline" size={20} color="#f87171" />
            </View>
            <Text className={cn('text-xs font-bold text-slate-950')}>Import จาก Excel</Text>
          </View>

          {importStep === 'idle' && (
            <>
              <TouchableOpacity className={cn('border-2 border-dashed border-rose-500 rounded-xl p-5 items-center gap-1 bg-rose-50')} onPress={handleSelectFile} activeOpacity={0.8}>
                <Ionicons name="document-outline" size={32} color="#f87171" />
                <Text className={cn('text-xs font-bold text-rose-600')}>เลือกไฟล์ Excel</Text>
                <Text className={cn('text-xs text-slate-500 font-medium')}>รองรับ .xlsx, .xls ขนาดไม่เกิน 10MB</Text>
              </TouchableOpacity>
              <TouchableOpacity className={cn('flex-row items-center justify-center gap-1 bg-rose-50 rounded-xl p-2 border border-slate-200')} onPress={handleDownloadTemplate}>
                <Ionicons name="download-outline" size={16} color="#f87171" />
                <Text className={cn('text-base text-rose-600 font-semibold')}>ดาวน์โหลด Template Excel</Text>
              </TouchableOpacity>
            </>
          )}

          {importStep === 'preview' && (
            <>
              <View className={cn('flex-row items-center gap-2 bg-emerald-100 rounded-xl p-3')}>
                <View className={cn('w-10 h-10 rounded-lg bg-white items-center justify-center')}>
                  <Ionicons name="document-text" size={22} color="#0f766e" />
                </View>
                <View className={cn('flex-1')}>
                  <Text className={cn('text-xs font-bold text-slate-950')}>products_import.xlsx</Text>
                  <Text className={cn('text-xs text-slate-500 font-medium')}>{importData.length} แถว · 6 คอลัมน์</Text>
                </View>
                <TouchableOpacity onPress={() => setImportStep('idle')}>
                  <Ionicons name="close-circle" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>

              <View className={cn('flex-row gap-3')}>
                <View className={cn('flex-1 items-center rounded-xl p-3 border-2 bg-white shadow-sm')} style={{ borderColor: '#0f766e' }}>
                  <Text className={cn('text-[28px] font-extrabold text-emerald-600')}>{validRows.length}</Text>
                  <Text className={cn('text-xs text-slate-500 font-medium')}>แถวถูกต้อง</Text>
                </View>
                <View className={cn('flex-1 items-center rounded-xl p-3 border-2 bg-white shadow-sm')} style={{ borderColor: hasErrors ? '#ef4444' : '#e7e5e4' }}>
                  <Text className={cn('text-[28px] font-extrabold', hasErrors ? 'text-rose-600' : 'text-gray-400')}>{errorRows.length}</Text>
                  <Text className={cn('text-xs text-slate-500 font-medium')}>แถวมี Error</Text>
                </View>
              </View>

              <TouchableOpacity
                className={cn('flex-row items-center gap-1 self-end')}
                onPress={() => setShowErrorOnly(!showErrorOnly)}
              >
                <Ionicons name={showErrorOnly ? 'eye-off-outline' : 'filter-outline'} size={14} color="#f87171" />
                <Text className={cn('text-xs text-rose-600 font-bold')}>
                  {showErrorOnly ? 'แสดงทั้งหมด' : `ดูเฉพาะ Error (${errorRows.length})`}
                </Text>
              </TouchableOpacity>

              <View className={cn('flex-row bg-neutral-100 rounded-lg p-2')}>
                {['แถว', 'รหัส', 'ชื่อสินค้า', 'ราคาขาย', 'สถานะ'].map((h) => (
                  <Text key={h} className={cn('flex-1 text-xs text-slate-500 font-bold')}>{h}</Text>
                ))}
              </View>
              {displayData.map((row) => (
                <View key={row.rowNo} className={cn('flex-row items-center py-2 px-1 border-b border-slate-200', row.errors.length > 0 && 'bg-rose-50')}>
                  <Text className={cn('flex-[0.7] text-xs text-slate-950 font-medium')}>{row.rowNo}</Text>
                  <Text className={cn('flex-[0.7] text-xs text-slate-950 font-medium')}>{row.code || '—'}</Text>
                  <Text className={cn('flex-[2] text-xs text-slate-950 font-medium')} numberOfLines={1}>{row.name}</Text>
                  <Text className={cn('flex-[0.7] text-xs text-slate-950 font-medium')}>{row.salePrice > 0 ? `฿${row.salePrice}` : '—'}</Text>
                  <View className={cn('flex-[0.8] items-center')}>
                    {row.errors.length === 0 ? (
                      <Ionicons name="checkmark-circle" size={16} color="#0f766e" />
                    ) : (
                      <View className={cn('bg-rose-50 rounded-lg px-1 py-[2px]')}>
                        <Text className={cn('text-[9px] text-rose-600 font-bold')}>{row.errors.length} Error</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}

              {hasErrors && (
                <View className={cn('bg-rose-50 rounded-xl p-3 gap-1')}>
                  <Text className={cn('text-xs font-bold text-rose-600 mb-1')}>รายละเอียด Error</Text>
                  {errorRows.map((row) => (
                    <View key={row.rowNo} className={cn('flex-row gap-1 flex-wrap')}>
                      <Text className={cn('text-xs text-rose-600 font-bold')}>แถว {row.rowNo}:</Text>
                      <Text className={cn('text-xs text-rose-600 flex-1 font-medium')}>{row.errors.join(', ')}</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                className={cn('flex-row items-center justify-center gap-2 rounded-xl py-3', hasErrors ? 'bg-amber-500' : 'bg-emerald-500')}
                onPress={handleConfirmImport}
                activeOpacity={0.85}
              >
                <Ionicons name="cloud-upload-outline" size={20} color="#fafafa" />
                <Text className={cn('text-base font-bold text-white')}>
                  {hasErrors ? `Import ${validRows.length} แถว (ข้าม Error)` : `Confirm Import ทั้งหมด (${validRows.length} รายการ)`}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {importStep === 'importing' && (
            <View className={cn('items-center gap-3 py-5')}>
              <Ionicons name="sync-outline" size={40} color="#f87171" />
              <Text className={cn('text-lg font-bold text-slate-950')}>กำลัง Import...</Text>
              <View className={cn('w-full h-2 bg-gray-200 rounded-[4px] overflow-hidden')}>
                <View className={cn('h-full bg-rose-500 rounded-[4px]')} style={{ width: `${importProgress}%` }} />
              </View>
              <Text className={cn('text-xs font-bold text-rose-600')}>{importProgress}%</Text>
            </View>
          )}

          {importStep === 'done' && (
            <View className={cn('items-center gap-3 py-5')}>
              <Ionicons name="checkmark-circle" size={56} color="#0f766e" />
              <Text className={cn('text-xl font-bold text-emerald-600')}>Import สำเร็จ</Text>
              <Text className={cn('text-base text-slate-500 font-medium')}>เพิ่ม/อัปเดตสินค้า {validRows.length} รายการ</Text>
              <TouchableOpacity className={cn('px-5 py-2 rounded-xl border border-rose-500')} onPress={() => setImportStep('idle')}>
                <Text className={cn('text-xs font-bold text-rose-600')}>Import ไฟล์ใหม่</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <View className={cn('flex-row items-center gap-2')}>
            <View className={cn('w-9 h-9 rounded-lg items-center justify-center bg-emerald-100')}>
              <Ionicons name="cloud-download-outline" size={20} color="#0f766e" />
            </View>
            <Text className={cn('text-xs font-bold text-slate-950')}>Export เป็น Excel</Text>
          </View>
          <Text className={cn('text-base text-slate-500 font-medium')}>มีสินค้าทั้งหมด {totalProducts} รายการในระบบ</Text>

          <TouchableOpacity className={cn('flex-row items-center gap-3 bg-emerald-500 rounded-xl p-3')} onPress={() => handleExport('all')} activeOpacity={0.85}>
            <Ionicons name="download-outline" size={20} color="#fafafa" />
            <View>
              <Text className={cn('text-xs font-bold text-white')}>Export สินค้าทั้งหมด</Text>
              <Text className={cn('text-xs text-slate-500 font-medium')}>{totalProducts} รายการ</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity className={cn('flex-row items-center gap-3 rounded-xl p-3 bg-white border border-rose-500')} onPress={() => handleExport('filtered')} activeOpacity={0.85}>
            <Ionicons name="funnel-outline" size={20} color="#f87171" />
            <View>
              <Text className={cn('text-xs font-bold text-rose-600')}>Export เฉพาะที่กรอง</Text>
              <Text className={cn('text-xs text-slate-500 font-medium')}>ตาม filter ที่เลือกไว้</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <View className={cn('flex-row items-center gap-2')}>
            <View className={cn('w-9 h-9 rounded-lg items-center justify-center bg-amber-100')}>
              <Ionicons name="document-text-outline" size={20} color="#a16207" />
            </View>
            <Text className={cn('text-xs font-bold text-slate-950')}>Template</Text>
          </View>
          <Text className={cn('text-base text-slate-500 font-medium')}>
            ดาวน์โหลด Template Excel สำหรับกรอกข้อมูลสินค้า พร้อม header และตัวอย่าง
          </Text>
          <TouchableOpacity className={cn('flex-row items-center gap-2 bg-amber-100 rounded-xl p-3 border border-amber-500')} onPress={handleDownloadTemplate} activeOpacity={0.85}>
            <Ionicons name="download-outline" size={20} color="#a16207" />
            <Text className={cn('text-xs font-bold text-amber-600')}>ดาวน์โหลด Template Excel</Text>
          </TouchableOpacity>
        </View>

        <View className={cn('h-5')} />
      </ScrollView>

      <AlertDialog
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertTitle}
        message={alertMessage}
        variant="success"
      />

      <ConfirmModal
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        title="มี Error"
        message={confirmMessage}
        confirmLabel={`Import ${validRows.length} แถว`}
        cancelLabel="ยกเลิก"
        variant="warning"
        onConfirm={() => { setConfirmVisible(false); startImport(); }}
        onCancel={() => setConfirmVisible(false)}
      />
    </SafeAreaView>
  );
};
