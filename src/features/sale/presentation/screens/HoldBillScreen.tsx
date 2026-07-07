import React, { useState } from 'react';
import { View, TouchableOpacity, FlatList, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';
import { useCartStore } from '@/features/sale/application/stores/cartStore';
import { HoldBill } from '@/features/sale/domain/sale';
import { cn } from '@/shared/lib/cn';
import { formatCurrency, formatDateTime } from '@/shared/lib/format';
import { Text, TextInput } from '@/shared/tw/index';

interface HoldBillScreenProps {
  onBack: () => void;
  onRecalled: () => void;
}

export const HoldBillScreen: React.FC<HoldBillScreenProps> = ({ onBack, onRecalled }) => {
  const { items, holdBills, holdBill, recallBill, deleteHoldBill, getGrandTotal } = useCartStore();
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [customerRef, setCustomerRef] = useState('');
  const [remark, setRemark] = useState('');

  const [showEmptyAlert, setShowEmptyAlert] = useState(false);
  const [showRecallConfirm, setShowRecallConfirm] = useState(false);
  const [recallTarget, setRecallTarget] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleHold = () => {
    if (items.length === 0) { setShowEmptyAlert(true); return; }
    holdBill(customerRef, remark);
    setShowHoldModal(false);
    setCustomerRef('');
    setRemark('');
  };

  const handleRecall = (id: string) => {
    if (items.length > 0) {
      setRecallTarget(id);
      setShowRecallConfirm(true);
    } else {
      recallBill(id);
      onRecalled();
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
    setShowDeleteConfirm(true);
  };

  const renderHoldBill = ({ item }: { item: HoldBill }) => {
    const total = item.items.reduce((s, i) => s + i.subtotal, 0);
    const itemCount = item.items.reduce((s, i) => s + i.qty, 0);

    return (
      <View className={cn('bg-white rounded-2xl p-3 gap-2 shadow-sm')}>
        <View className={cn('flex-row items-center gap-2')}>
          <View className={cn('w-11 h-11 rounded-xl items-center justify-center')} style={{ backgroundColor: '#fee2e2' }}>
            <Ionicons name="receipt-outline" size={20} color="#f87171" />
          </View>
          <View className={cn('flex-1')}>
            <Text className={cn('text-xs font-extrabold text-slate-950')}>{item.customerRef || 'ไม่ระบุชื่อ'}</Text>
            <Text className={cn('text-xs text-slate-600 font-medium')}>{formatDateTime(item.heldAt)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text className={cn('text-xs font-bold text-rose-500 font-extrabold')}>฿{formatCurrency(total)}</Text>
            <Text className={cn('text-xs text-slate-600 font-medium')}>{itemCount} รายการ</Text>
          </View>
        </View>

        {item.remark ? (
          <Text className={cn('text-xs text-slate-500 italic font-medium')}>หมายเหตุ: {item.remark}</Text>
        ) : null}

        <View className={cn('bg-rose-50 rounded-lg p-2')} style={{ gap: 2 }}>
          {item.items.slice(0, 3).map((ci, idx) => (
            <Text key={idx} className={cn('text-xs text-slate-600 font-medium')} numberOfLines={1}>
              • {ci.product.name} x{ci.qty}
            </Text>
          ))}
          {item.items.length > 3 && (
            <Text className={cn('text-xs text-gray-400 italic font-medium')}>และอีก {item.items.length - 3} รายการ...</Text>
          )}
        </View>

        <View className={cn('flex-row gap-2 pt-1')}>
          <TouchableOpacity
            className={cn('flex-1 flex-row items-center justify-center gap-1 bg-rose-500 rounded-xl py-2')}
            onPress={() => handleRecall(item.id)}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh-outline" size={16} color="#fafafa" />
            <Text className={cn('text-xs font-bold text-white')}>เรียกบิลคืน</Text>
          </TouchableOpacity>
          <TouchableOpacity className={cn('w-11 h-11 rounded-xl items-center justify-center')}
            style={{ backgroundColor: '#ffe4e6' }} onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-rose-50')} edges={['top']}>
      <View className={cn('flex-row items-center justify-between bg-rose-600 px-3 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className={cn('text-lg font-extrabold text-white flex-1 ml-2')}>บิลพัก ({holdBills.length})</Text>
        {items.length > 0 && (
          <TouchableOpacity className={cn('flex-row items-center gap-1 rounded-xl px-2 py-1')}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} onPress={() => setShowHoldModal(true)}>
            <Ionicons name="pause-circle-outline" size={18} color="#fafafa" />
            <Text className={cn('text-xs text-white font-bold')}>พักบิลนี้</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length > 0 && (
        <View className={cn('flex-row items-center gap-2 bg-rose-50 px-4 py-2 border-b border-slate-200')}>
          <Ionicons name="cart-outline" size={18} color="#f87171" />
          <Text className={cn('text-base text-rose-500 font-semibold')}>
            บิลปัจจุบัน: {items.length} รายการ · ฿{formatCurrency(getGrandTotal())}
          </Text>
        </View>
      )}

      {holdBills.length === 0 ? (
        <View className={cn('flex-1 items-center justify-center gap-3')}>
          <Ionicons name="pause-circle-outline" size={72} color="#d1d5db" />
          <Text className={cn('text-xl font-extrabold text-gray-400')}>ไม่มีบิลพัก</Text>
          <Text className={cn('text-base text-gray-300 font-medium')}>กด "พักบิลนี้" เพื่อบันทึกบิลปัจจุบัน</Text>
        </View>
      ) : (
        <FlatList
          data={holdBills}
          keyExtractor={(item) => item.id}
          renderItem={renderHoldBill}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={showHoldModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View className={cn('bg-white rounded-t-3xl p-4')} style={{ gap: 12 }}>
            <View className={cn('w-10 h-1 bg-gray-200 rounded self-center mb-1')} />
            <Text className={cn('text-xl font-extrabold text-slate-950')}>พักบิล</Text>
            <Text className={cn('text-base text-slate-600 font-medium')} style={{ marginTop: -8 }}>บันทึกบิลปัจจุบันไว้ก่อน เพื่อเปิดบิลใหม่</Text>

            <Text className={cn('text-xs font-bold text-slate-600')}>ชื่อลูกค้า / อ้างอิง (ไม่บังคับ)</Text>
            <TextInput
              className={cn('bg-neutral-100 rounded-xl border px-3 py-2 text-base text-slate-950')}
              style={{ borderWidth: 1.5, borderColor: '#e7e5e4' }}
              placeholder="เช่น คุณสมชาย, โต๊ะ 3"
              placeholderTextColor="#9ca3af"
              value={customerRef}
              onChangeText={setCustomerRef}
            />
            <Text className={cn('text-xs font-bold text-slate-600')}>หมายเหตุ (ไม่บังคับ)</Text>
            <TextInput
              className={cn('bg-neutral-100 rounded-xl border px-3 py-2 text-base text-slate-950')}
              style={{ height: 80, textAlignVertical: 'top', borderWidth: 1.5, borderColor: '#e7e5e4' }}
              placeholder="เช่น รอเครื่องดื่มเพิ่ม"
              placeholderTextColor="#9ca3af"
              value={remark}
              onChangeText={setRemark}
              multiline
            />

            <View className={cn('flex-row gap-2 mt-1')}>
              <TouchableOpacity
                className={cn('flex-1 py-3 items-center rounded-xl border')}
                style={{ borderWidth: 1.5, borderColor: '#e7e5e4' }}
                onPress={() => setShowHoldModal(false)}
              >
                <Text className={cn('text-base font-bold text-slate-600')}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity className={cn('flex-2 flex-row items-center justify-center gap-1 bg-rose-500 rounded-xl py-3')}
                style={{ flex: 2 }} onPress={handleHold} activeOpacity={0.85}>
                <Ionicons name="pause-circle" size={18} color="#fafafa" />
                <Text className={cn('text-base font-bold text-white')}>พักบิล</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertDialog
        visible={showEmptyAlert}
        onClose={() => setShowEmptyAlert(false)}
        title="ไม่มีสินค้าในบิล"
        message="ไม่สามารถพักบิลที่ไม่มีสินค้าได้"
        variant="warning"
      />

      <ConfirmModal
        visible={showRecallConfirm}
        onClose={() => { setShowRecallConfirm(false); setRecallTarget(null); }}
        title="มีบิลค้างอยู่"
        message="บิลปัจจุบันจะถูกแทนที่ด้วยบิลที่เรียกคืน"
        confirmLabel="เรียกคืน"
        cancelLabel="ยกเลิก"
        variant="warning"
        onConfirm={() => {
          if (recallTarget) {
            recallBill(recallTarget);
            onRecalled();
          }
          setShowRecallConfirm(false);
          setRecallTarget(null);
        }}
        onCancel={() => { setShowRecallConfirm(false); setRecallTarget(null); }}
      />

      <ConfirmModal
        visible={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
        title="ลบบิลพัก"
        message="ต้องการลบบิลพักนี้?"
        confirmLabel="ลบ"
        cancelLabel="ยกเลิก"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) deleteHoldBill(deleteTarget);
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onCancel={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
      />
    </SafeAreaView>
  );
};
