import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { StockDocument, DocType } from '@/features/inventory/domain/stockDocument';
import { Product } from '@/features/product/domain/product';
import { DocStatusBadge } from '@/features/inventory/presentation/components/DocStatusBadge';
import { formatCurrency, formatDateTime } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

interface Props {
  doc: StockDocument;
  allProducts: Product[];
  onEdit: () => void;
  onCancel: (docId: string) => void;
  onPrint?: () => void;
  onCreateReceiveFromIssue?: () => void;
  onBack: () => void;
}

const TYPE_CONFIG: Record<DocType, { title: string; color: string }> = {
  receive: { title: 'รับสินค้า', color: '#0f766e' },
  issue: { title: 'เบิกสินค้า', color: '#f87171' },
};

export const StockDocDetailScreen: React.FC<Props> = ({
  doc,
  allProducts,
  onEdit,
  onCancel,
  onPrint,
  onCreateReceiveFromIssue,
  onBack,
}) => {
  const cfg = TYPE_CONFIG[doc.docType];
  const [cancelVisible, setCancelVisible] = useState(false);
  const [printDialogVisible, setPrintDialogVisible] = useState(false);

  const handleCancel = () => {
    setCancelVisible(true);
  };

  const confirmCancel = () => {
    onCancel(doc.id);
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      setPrintDialogVisible(true);
    }
  };

  return (
    <SafeAreaView className={cn('flex-1', 'bg-[#f6f7fb]')} edges={['top']}>
      <ConfirmModal
        visible={cancelVisible}
        onClose={() => setCancelVisible(false)}
        title="ยืนยันการยกเลิก"
        message={`ต้องการยกเลิกเอกสาร ${doc.docNo}?`}
        variant="danger"
        confirmLabel="ยกเลิกเอกสาร"
        onConfirm={confirmCancel}
      />

      <AlertDialog
        visible={printDialogVisible}
        onClose={() => setPrintDialogVisible(false)}
        title="พิมพ์เอกสาร"
        message={`กำลังพิมพ์ ${doc.docNo}...`}
        variant="info"
        onConfirm={() => setPrintDialogVisible(false)}
      />

      <View className={cn('flex-row items-center gap-2 px-3 py-3')} style={{ backgroundColor: cfg.color }}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View className={cn('flex-1')}>
          <Text className={cn('text-lg font-extrabold text-white')}>เอกสาร{cfg.title}</Text>
          <Text className={cn('text-xs font-medium text-white/75')}>{doc.docNo}</Text>
        </View>
        <DocStatusBadge status={doc.status} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName={cn('p-3 gap-3 pb-5')}>
        <View className={cn('bg-white rounded-2xl p-3 gap-2 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>ข้อมูลเอกสาร</Text>
          <InfoRow label="เลขที่เอกสาร" value={doc.docNo} />
          <InfoRow label="วันที่" value={formatDateTime(doc.createdAt)} />
          <InfoRow label="ผู้สร้าง" value={doc.createdBy} />
          <InfoRow label="คลัง" value={doc.warehouseName} />
          {doc.toWarehouseName && <InfoRow label="คลังปลายทาง" value={doc.toWarehouseName} />}
          {doc.supplierName && <InfoRow label="Supplier" value={doc.supplierName} />}
          {doc.remark && <InfoRow label="หมายเหตุ" value={doc.remark} />}
        </View>

        <View className={cn('bg-white rounded-2xl p-3 gap-2 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-slate-950 mb-1')}>
            รายการสินค้า ({doc.items.length} รายการ)
          </Text>
          <View className={cn('flex-row bg-neutral-100 rounded-lg p-2')}>
            <Text className={cn('flex-[2.5] text-xs font-bold text-slate-500')}>สินค้า</Text>
            <Text className={cn('flex-[1.2] text-right text-xs font-bold text-slate-500')}>จำนวน</Text>
            {doc.docType === 'receive' && (
              <Text className={cn('flex-[1.2] text-right text-xs font-bold text-slate-500')}>ราคาทุน</Text>
            )}
          </View>
          {doc.items.map((item, idx) => {
            const prod = allProducts.find((p) => p.id === item.productId);
            return (
              <View key={idx} className={cn('flex-row items-center py-2 px-1 border-b border-slate-200')}>
                <View className={cn('flex-[2.5]')}>
                  <Text className={cn('text-base font-medium text-slate-950')}>{prod?.name ?? 'ไม่พบสินค้า'}</Text>
                  {prod?.barcode && <Text className={cn('text-xs font-medium text-slate-500')}>{prod.barcode}</Text>}
                </View>
                <Text className={cn('flex-[1.2] text-right text-base font-bold text-slate-950')}>
                  {item.qtyBase} {prod?.unit ?? ''}
                </Text>
                {doc.docType === 'receive' && (
                  <Text className={cn('flex-[1.2] text-right text-base font-bold text-rose-600')}>
                    {item.costPrice ? `฿${formatCurrency(item.costPrice)}` : '—'}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        <View className={cn('bg-white rounded-2xl p-3 gap-2 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>สรุป</Text>
          <View className={cn('flex-row justify-between')}>
            <Text className={cn('text-base font-medium text-slate-500')}>จำนวนรายการ</Text>
            <Text className={cn('text-base font-bold text-slate-950')}>{doc.totalItems}</Text>
          </View>
          <View className={cn('flex-row justify-between')}>
            <Text className={cn('text-base font-medium text-slate-500')}>จำนวนรวม</Text>
            <Text className={cn('text-base font-bold text-slate-950')}>{doc.totalQtyBase}</Text>
          </View>
          {doc.docType === 'receive' && doc.totalCost > 0 && (
            <View className={cn('flex-row justify-between items-center pt-1 border-t border-slate-200')}>
              <Text className={cn('text-lg font-bold text-slate-950')}>มูลค่ารวม</Text>
              <Text className={cn('text-xl font-extrabold text-rose-600')}>฿{formatCurrency(doc.totalCost)}</Text>
            </View>
          )}
        </View>

        <View className={cn('gap-2')}>
          {doc.status === 'draft' && (
            <>
              <TouchableOpacity className={cn('flex-row items-center justify-center gap-2 rounded-xl py-3 bg-violet-500 shadow-lg shadow-violet-500/40')}
                onPress={onEdit} activeOpacity={0.85}>
                <Ionicons name="pencil-outline" size={20} color="#fafafa" />
                <Text className={cn('text-base font-bold text-white')}>แก้ไขเอกสาร</Text>
              </TouchableOpacity>

              <TouchableOpacity className={cn('flex-row items-center justify-center gap-2 rounded-xl py-3 bg-red-500 shadow-lg shadow-red-500/40')}
                onPress={handleCancel} activeOpacity={0.85}>
                <Ionicons name="close-outline" size={20} color="#fafafa" />
                <Text className={cn('text-base font-bold text-white')}>ยกเลิกเอกสาร</Text>
              </TouchableOpacity>
            </>
          )}

          {doc.status === 'confirmed' && (
            <>
              {onCreateReceiveFromIssue && doc.docType === 'issue' && (
                <TouchableOpacity className={cn('flex-row items-center justify-center gap-2 rounded-xl py-3 bg-emerald-500 shadow-lg shadow-emerald-500/40')}
                  onPress={onCreateReceiveFromIssue} activeOpacity={0.85}>
                  <Ionicons name="arrow-down-circle-outline" size={20} color="#fafafa" />
                  <Text className={cn('text-base font-bold text-white')}>สร้างเอกสารรับสินค้าจากการเบิกนี้</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity className={cn('flex-row items-center justify-center gap-1 rounded-xl py-3 bg-white border border-slate-200')}
                onPress={handlePrint} activeOpacity={0.85}>
                <Ionicons name="print-outline" size={20} color="#57534e" />
                <Text className={cn('text-base font-bold text-slate-950')}>พิมพ์เอกสาร</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View className={cn('flex-row justify-between items-start')}>
    <Text className={cn('text-base font-medium text-slate-500 flex-[0.8]')}>{label}</Text>
    <Text className={cn('text-base font-semibold text-slate-950 flex-[1.2] text-right')}>{value}</Text>
  </View>
);
