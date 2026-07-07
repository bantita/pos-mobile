import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { CouponStatus, ExportFilter } from '@/features/coupon/domain/coupon';
import { applyExportFilter, exportToCSV } from '@/features/coupon/domain/services/CouponExporter';
import * as couponStore from '@/features/coupon/application/stores/couponStore';
import { Text, TextInput } from '@/shared/tw/index';

interface Props {
  visible: boolean;
  onClose: () => void;
  campaignId: string;
}

export const CouponExportModal: React.FC<Props> = ({ visible, onClose, campaignId }) => {
  const [statusFilter, setStatusFilter] = useState<CouponStatus | ''>('');
  const [exported, setExported] = useState(false);
  const [csvOutput, setCsvOutput] = useState('');

  const handleExport = () => {
    const codes = couponStore.getAllCodes();
    const campaigns = new Map(couponStore.getCampaigns().map(c => [c.id, c]));

    const filter: ExportFilter = {
      campaignId,
      status: statusFilter ? [statusFilter as CouponStatus] : undefined,
    };

    const rows = applyExportFilter(codes, filter, campaigns);
    const csv = exportToCSV(rows);
    setCsvOutput(csv);
    setExported(true);
  };

  const handleClose = () => { setExported(false); setCsvOutput(''); onClose(); };

  const statuses = [
    { value: '', label: 'ทั้งหมด' },
    { value: CouponStatus.ACTIVE, label: 'ขาย/แจก' },
    { value: CouponStatus.USED, label: 'ใช้แล้ว' },
    { value: CouponStatus.EXPIRED, label: 'หมดอายุ' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity className={cn('flex-1 items-center justify-center bg-[rgba(0,0,0,0.4)]')} activeOpacity={1} onPress={handleClose}>
        <View className={cn('bg-white rounded-2xl p-4 w-[90%] max-w-[420px]')}>
          <Text className={cn('text-lg font-semibold text-slate-950 mb-3')}>Export คูปอง</Text>

          {!exported ? (
            <>
              <Text className={cn('text-xs font-semibold text-slate-500 mb-1')}>สถานะที่ต้องการ Export</Text>
              <View className={cn('flex-row flex-wrap gap-1')}>
                {statuses.map(s => (
                  <TouchableOpacity
                    key={s.value}
                    className={cn(
                      'px-3 py-2 rounded-full border border-slate-200',
                      statusFilter === s.value && 'bg-rose-500 border-rose-500'
                    )}
                    onPress={() => setStatusFilter(s.value as any)}
                  >
                    <Text className={cn(
                      'text-base text-slate-500',
                      statusFilter === s.value && 'text-white'
                    )}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View className={cn('flex-row gap-3 mt-4')}>
                <TouchableOpacity className={cn('flex-1 border border-slate-200 rounded-xl py-2 items-center')} onPress={handleClose}>
                  <Text className={cn('text-base font-semibold text-slate-500')}>ยกเลิก</Text>
                </TouchableOpacity>
                <TouchableOpacity className={cn('flex-1 bg-rose-500 rounded-xl py-2 flex-row items-center justify-center gap-1 mt-2')} onPress={handleExport}>
                  <Ionicons name="download-outline" size={16} color="#fafafa" />
                  <Text className={cn('text-base font-semibold text-white')}>Export CSV</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text className={cn('text-xs font-semibold text-slate-500 mb-1')}>CSV Output (คัดลอกได้)</Text>
              <TextInput className={cn('border border-slate-200 rounded-xl px-3 py-2 text-xs min-h-[140px] mt-2')} value={csvOutput} multiline editable={false} selectTextOnFocus style={{ textAlignVertical: 'top' }} />
              <TouchableOpacity className={cn('flex-1 bg-rose-500 rounded-xl py-2 flex-row items-center justify-center gap-1 mt-2')} onPress={handleClose}>
                <Text className={cn('text-base font-semibold text-white')}>ปิด</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};
