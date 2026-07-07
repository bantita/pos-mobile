/**
 * Cancel Bill Screen — ยกเลิกบิล
 * ตรวจสิทธิ์ตาม Role, กรอกเหตุผล, บันทึก Audit Log
 */
import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';
import { useCartStore } from '@/features/sale/application/stores/cartStore';
import { formatCurrency, formatDateTime } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Text, TextInput } from '@/shared/tw/index';

interface CancelBillScreenProps {
  onBack: () => void;
  onCancelled: () => void;
  saleNo?: string;               // ถ้ามี = ยกเลิกบิลที่ขายแล้ว (Void)
  userRole?: 'cashier' | 'manager' | 'owner';
  cashierName?: string;
}

type CancelType = 'current' | 'void';

const CANCEL_REASONS = [
  'ลูกค้าเปลี่ยนใจ',
  'สินค้าไม่ครบ / ไม่มีสต๊อก',
  'ราคาไม่ถูกต้อง',
  'ชำระเงินผิดพลาด',
  'ทดสอบระบบ',
  'อื่นๆ',
];

export const CancelBillScreen: React.FC<CancelBillScreenProps> = ({
  onBack,
  onCancelled,
  saleNo,
  userRole = 'cashier',
  cashierName = 'พนักงาน',
}) => {
  const { items, discount, getGrandTotal, clearCart, getItemCount } = useCartStore();
  const cancelType: CancelType = saleNo ? 'void' : 'current';

  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [approvalCode, setApprovalCode] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const [showReasonAlert, setShowReasonAlert] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  const grandTotal = getGrandTotal();
  const itemCount = getItemCount();
  const now = new Date();

  const finalReason = selectedReason === 'อื่นๆ' ? customReason : selectedReason;
  const needsApproval = userRole === 'cashier' && cancelType === 'void';
  const canCancel = finalReason.trim().length > 0;

  const handleCancel = () => {
    if (!canCancel) {
      setShowReasonAlert(true);
      return;
    }
    if (needsApproval && !approvalCode.trim()) {
      setShowApprovalModal(true);
      return;
    }
    setShowConfirmCancel(true);
  };

  const confirmCancel = () => {
    setLoading(true);
    // Simulate API + Audit Log
    setTimeout(() => {
      // Audit Log Entry
      console.log(`[AUDIT] CANCEL_BILL - Type: ${cancelType}, SaleNo: ${saleNo ?? 'CURRENT'}, Reason: ${finalReason}, By: ${cashierName}, ApprovalCode: ${approvalCode || '-'}, At: ${formatDateTime(now)}`);
      clearCart();
      setLoading(false);
      setCancelled(true);
    }, 1000);
  };

  // --- Success State ---
  if (cancelled) {
    return (
      <SafeAreaView className={cn('flex-1 bg-rose-50')}>
        <View className={cn('flex-1 items-center justify-center p-5 gap-4')}>
          <View className={cn('w-[120px] h-[120px] rounded-full bg-rose-50 items-center justify-center')}>
            <Ionicons name="close-circle" size={72} color="#ef4444" />
          </View>
          <Text className={cn('text-2xl font-extrabold text-rose-600')}>ยกเลิกบิลสำเร็จ</Text>
          {saleNo && <Text className={cn('text-base leading-relaxed text-slate-500 font-medium')}>บิล {saleNo}</Text>}
          <View className={cn('w-full bg-rose-50 rounded-2xl p-3 gap-1 border border-slate-200 shadow-sm')}>
            <Text className={cn('text-xs font-bold text-slate-500 mb-1')}>
              <Ionicons name="document-text-outline" size={14} /> บันทึก Audit Log แล้ว
            </Text>
            {[
              { label: 'เหตุผล', value: finalReason },
              { label: 'โดย', value: cashierName },
              { label: 'เวลา', value: formatDateTime(now) },
              ...(approvalCode ? [{ label: 'อนุมัติโดย', value: `รหัส ${approvalCode}` }] : []),
            ].map((row, i) => (
              <View key={i} className={cn('flex-row gap-2')}>
                <Text className={cn('text-base text-slate-500 w-20 font-medium')}>{row.label}:</Text>
                <Text className={cn('text-base text-slate-950 font-semibold flex-1')}>{row.value}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity className={cn('w-full bg-rose-500 rounded-xl py-3 items-center')} onPress={onCancelled} activeOpacity={0.85}>
            <Text className={cn('text-base font-bold text-white')}>กลับหน้าขาย</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={cn('flex-1 bg-rose-50')}>
      {/* Header */}
      <View className={cn('flex-row items-center justify-between bg-rose-600 px-3 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className={cn('text-lg font-extrabold text-white')}>
          {cancelType === 'void' ? `ยกเลิกบิล ${saleNo}` : 'ยกเลิกบิลปัจจุบัน'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }} showsVerticalScrollIndicator={false}>

        {/* Warning Banner */}
        <View className={cn('flex-row items-center gap-3 bg-rose-50 rounded-xl p-3')} style={{ borderLeftWidth: 4, borderLeftColor: '#ef4444' }}>
          <Ionicons name="warning" size={24} color="#ef4444" />
          <View style={{ flex: 1 }}>
            <Text className={cn('text-xs font-bold text-rose-600')}>
              {cancelType === 'void' ? 'ยกเลิกบิลที่ขายแล้ว (Void)' : 'ยกเลิกบิลปัจจุบัน'}
            </Text>
            <Text className={cn('text-xs text-rose-600 opacity-80 font-medium')}>การดำเนินการนี้ไม่สามารถย้อนกลับได้</Text>
          </View>
        </View>

        {/* Bill Summary */}
        <View className={cn('bg-white rounded-2xl p-3 gap-2 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-slate-500 mb-1')}>สรุปบิล</Text>
          {saleNo && (
            <View className={cn('flex-row justify-between')}>
              <Text className={cn('text-base text-slate-500 font-medium')}>เลขที่บิล</Text>
              <Text className={cn('text-base text-slate-950 font-bold')}>{saleNo}</Text>
            </View>
          )}
          <View className={cn('flex-row justify-between')}>
            <Text className={cn('text-base text-slate-500 font-medium')}>จำนวนรายการ</Text>
            <Text className={cn('text-base text-slate-950 font-semibold')}>{itemCount} รายการ</Text>
          </View>
          <View className={cn('flex-row justify-between')}>
            <Text className={cn('text-base text-slate-500 font-medium')}>ยอดรวม</Text>
            <Text className={cn('text-base text-slate-950 font-bold')} style={{ color: '#ef4444' }}>฿{formatCurrency(grandTotal)}</Text>
          </View>

          {/* Item list preview */}
          {items.length > 0 && (
            <View className={cn('bg-rose-50 rounded-lg p-2 mt-1 gap-1')}>
              {items.slice(0, 4).map((item, i) => (
                <View key={i} className={cn('flex-row items-center gap-1')}>
                  <Text className={cn('text-xs text-slate-950 flex-1 font-medium')} numberOfLines={1}>{item.product.name}</Text>
                  <Text className={cn('text-xs text-slate-500 w-7 text-right font-medium')}>×{item.qty}</Text>
                  <Text className={cn('text-xs text-slate-950 font-bold w-[70px] text-right')}>฿{formatCurrency(item.subtotal)}</Text>
                </View>
              ))}
              {items.length > 4 && (
                <Text className={cn('text-xs text-gray-400 italic font-medium')}>และอีก {items.length - 4} รายการ...</Text>
              )}
            </View>
          )}
        </View>

        {/* Reason Selection */}
        <View style={{ gap: 8 }}>
          <Text className={cn('text-xs font-bold text-slate-500')}>
            เหตุผลการยกเลิก <Text className={cn('text-rose-600')}>*</Text>
          </Text>
          <View className={cn('flex-row flex-wrap gap-2')}>
            {CANCEL_REASONS.map((r) => (
              <TouchableOpacity
                key={r}
                className={cn('flex-row items-center gap-1 px-3 py-2 rounded-full bg-white border-[1.5px] border-slate-200', selectedReason === r && 'bg-rose-500 border-rose-500')}
                onPress={() => setSelectedReason(r)}
                activeOpacity={0.8}
              >
                {selectedReason === r && (
                  <Ionicons name="checkmark-circle" size={14} color="#fafafa" />
                )}
                <Text className={cn('text-base text-slate-950 font-medium', selectedReason === r && 'text-white font-bold')}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedReason === 'อื่นๆ' && (
            <TextInput
              className={cn('bg-white rounded-xl border-[1.5px] border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950 mt-1')}
              style={{ minHeight: 80 }}
              placeholder="ระบุเหตุผล..."
              placeholderTextColor="#9ca3af"
              value={customReason}
              onChangeText={setCustomReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          )}
        </View>

        {/* Approval required notice */}
        {needsApproval && (
          <View className={cn('flex-row items-center gap-2 bg-amber-100 rounded-xl p-3')}>
            <Ionicons name="shield-outline" size={18} color="#a16207" />
            <Text className={cn('text-base text-amber-600 flex-1 font-medium')}>
              การยกเลิกบิลที่ขายแล้วต้องได้รับอนุมัติจาก Manager
            </Text>
          </View>
        )}

        {/* Cancel Button */}
        <TouchableOpacity
          className={cn('flex-row items-center justify-center gap-2 rounded-xl py-3', (!canCancel || loading) ? 'bg-gray-300' : 'bg-red-500')}
          onPress={handleCancel}
          disabled={!canCancel || loading}
          activeOpacity={0.85}
        >
          <Ionicons
            name={loading ? 'hourglass-outline' : 'close-circle-outline'}
            size={22}
            color="#fafafa"
          />
          <Text className={cn('text-base font-bold text-white')}>
            {loading ? 'กำลังยกเลิก...' : cancelType === 'void' ? 'ยกเลิกบิลนี้' : 'ยกเลิกบิลปัจจุบัน'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className={cn('items-center py-2')} onPress={onBack}>
          <Text className={cn('text-base text-slate-500 font-medium')}>ย้อนกลับ ไม่ยกเลิก</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Approval Modal */}
      <Modal visible={showApprovalModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View className={cn('bg-white p-4 gap-3')} style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
            <View className={cn('w-10 h-1 bg-gray-200 rounded-sm self-center mb-1')} />
            <View className={cn('flex-row items-center gap-2')}>
              <Ionicons name="shield-checkmark-outline" size={28} color="#a16207" />
              <Text className={cn('text-lg font-extrabold text-slate-950')}>ขออนุมัติจาก Manager</Text>
            </View>
            <Text className={cn('text-base text-slate-500 font-medium')}>
              กรุณาให้ Manager กรอกรหัสอนุมัติเพื่อยืนยันการยกเลิกบิล
            </Text>

            <Text className={cn('text-xs font-bold text-slate-500')}>รหัสอนุมัติ</Text>
            <TextInput
              className={cn('bg-neutral-100 rounded-xl border-[1.5px] border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950 text-center')}
              style={{ letterSpacing: 4 }}
              placeholder="กรอกรหัสอนุมัติ"
              placeholderTextColor="#9ca3af"
              value={approvalCode}
              onChangeText={setApprovalCode}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={8}
            />

            <View className={cn('flex-row gap-2')}>
              <TouchableOpacity
                className={cn('flex-1 items-center py-3 rounded-xl border-[1.5px] border-slate-200')}
                onPress={() => setShowApprovalModal(false)}
              >
                <Text className={cn('text-base font-bold text-slate-500')}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={cn('flex-[2] flex-row items-center justify-center gap-1 rounded-xl py-3', approvalCode ? 'bg-rose-500' : 'bg-gray-300')}
                onPress={() => {
                  if (!approvalCode.trim()) return;
                  setShowApprovalModal(false);
                  setShowConfirmCancel(true);
                }}
                disabled={!approvalCode}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fafafa" />
                <Text className={cn('text-base font-bold text-white')}>ยืนยัน</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertDialog
        visible={showReasonAlert}
        onClose={() => setShowReasonAlert(false)}
        title="กรุณาระบุเหตุผล"
        message="ต้องระบุเหตุผลในการยกเลิกบิล"
        variant="warning"
      />

      <ConfirmModal
        visible={showConfirmCancel}
        onClose={() => setShowConfirmCancel(false)}
        title={cancelType === 'void' ? `ยืนยันยกเลิกบิล ${saleNo}` : 'ยืนยันยกเลิกบิลปัจจุบัน'}
        message={`เหตุผล: ${finalReason}\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        confirmLabel="ยืนยันยกเลิก"
        cancelLabel="ไม่ยกเลิก"
        variant="danger"
        loading={loading}
        onConfirm={() => {
          confirmCancel();
          setShowConfirmCancel(false);
        }}
        onCancel={() => setShowConfirmCancel(false)}
      />
    </SafeAreaView>
  );
};
