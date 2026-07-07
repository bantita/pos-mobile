import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { parseCSV, validateImportRows } from '@/features/coupon/domain/services/CouponImporter';
import * as couponStore from '@/features/coupon/application/stores/couponStore';
import { Text, TextInput } from '@/shared/tw/index';

interface Props {
  visible: boolean;
  onClose: () => void;
  campaignId: string;
}

export const CouponImportModal: React.FC<Props> = ({ visible, onClose, campaignId }) => {
  const [csvData, setCsvData] = useState('');
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  const handleImport = () => {
    if (!csvData.trim()) { Alert.alert('ข้อผิดพลาด', 'กรุณาวาง CSV data'); return; }

    const rows = parseCSV(csvData);
    if (rows.length === 0) { Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลใน CSV'); return; }
    if (rows.length > 10000) { Alert.alert('ข้อผิดพลาด', 'ไฟล์ใหญ่เกินไป (สูงสุด 10,000 แถว)'); return; }

    const existingCodes = couponStore.getAllExistingCodeSet();
    const importResult = validateImportRows(rows, existingCodes, campaignId);

    couponStore.addCodes(importResult.imported);
    setResult({ imported: importResult.summary.imported, skipped: importResult.summary.skipped });
  };

  const handleClose = () => { setResult(null); setCsvData(''); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity className={cn('flex-1 items-center justify-center bg-[rgba(0,0,0,0.4)]')} activeOpacity={1} onPress={handleClose}>
        <View className={cn('bg-white rounded-2xl p-4 w-[90%] max-w-[420px]')}>
          <Text className={cn('text-lg font-semibold text-slate-950 mb-3')}>Import คูปอง (CSV)</Text>

          {!result ? (
            <>
              <Text className={cn('text-xs font-semibold text-slate-500 mb-1')}>วาง CSV Data (header: code,status,expiryDate)</Text>
              <TextInput
                className={cn('border border-slate-200 rounded-xl px-3 py-2 text-base min-h-[120px]')}
                value={csvData}
                onChangeText={setCsvData}
                placeholder={"code,status,expiryDate\nNVSC001,ขาย/แจก,2025-12-31"}
                placeholderTextColor="#57534e"
                multiline
                numberOfLines={6}
                style={{ textAlignVertical: 'top' }}
              />
              <View className={cn('flex-row gap-3 mt-4')}>
                <TouchableOpacity className={cn('flex-1 border border-slate-200 rounded-xl py-2 items-center')} onPress={handleClose}>
                  <Text className={cn('text-base font-semibold text-slate-500')}>ยกเลิก</Text>
                </TouchableOpacity>
                <TouchableOpacity className={cn('flex-1 bg-rose-500 rounded-xl py-2 flex-row items-center justify-center gap-1 mt-2')} onPress={handleImport}>
                  <Ionicons name="cloud-upload-outline" size={16} color="#fafafa" />
                  <Text className={cn('text-base font-semibold text-white')}>Import</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View className={cn('bg-green-50 p-3 rounded-xl my-3')}>
                <Text className={cn('text-base text-green-700')}>Import สำเร็จ {result.imported} รายการ</Text>
                {result.skipped > 0 && <Text className={cn('text-xs text-orange-700 mt-1')}>ข้าม {result.skipped} รายการ</Text>}
              </View>
              <TouchableOpacity className={cn('flex-1 bg-rose-500 rounded-xl py-2 flex-row items-center justify-center gap-1 mt-2')} onPress={handleClose}>
                <Text className={cn('text-base font-semibold text-white')}>ตกลง</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};
