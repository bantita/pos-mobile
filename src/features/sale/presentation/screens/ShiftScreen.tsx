/**
 * ShiftScreen — เปิดกะ / ปิดกะ / เงินเข้า-ออกระหว่างวัน
 */
import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';
import { useShiftStore } from '@/features/sale/application/stores/shiftStore';
import { formatCurrency } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Text, TextInput } from '@/shared/tw/index';

interface ShiftScreenProps {
  onBack: () => void;
  cashierName?: string;
  posName?: string;
}

export const ShiftScreen: React.FC<ShiftScreenProps> = ({
  onBack, cashierName = 'พนักงาน', posName = 'POS 1',
}) => {
  const {
    currentShift, shiftHistory,
    openShift, closeShift, addCashMovement,
    isShiftOpen, getExpectedCash,
  } = useShiftStore();

  const [openAmount, setOpenAmount] = useState('');
  const [closeAmount, setCloseAmount] = useState('');
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashType, setCashType] = useState<'in' | 'out'>('in');
  const [cashAmount, setCashAmount] = useState('');
  const [cashReason, setCashReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const [showOpenSuccess, setShowOpenSuccess] = useState(false);
  const [openSuccessAmount, setOpenSuccessAmount] = useState(0);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closeAmountVal, setCloseAmountVal] = useState(0);
  const [showCashAmountError, setShowCashAmountError] = useState(false);
  const [showCashReasonError, setShowCashReasonError] = useState(false);
  const [showCashSuccess, setShowCashSuccess] = useState(false);
  const [cashSuccessMsg, setCashSuccessMsg] = useState('');

  const handleOpenShift = () => {
    const amt = parseFloat(openAmount) || 0;
    openShift({ posId: 'pos1', posName, cashierName, openingAmount: amt });
    setOpenAmount('');
    setOpenSuccessAmount(amt);
    setShowOpenSuccess(true);
  };

  const handleCloseShift = () => {
    const amt = parseFloat(closeAmount) || 0;
    setCloseAmountVal(amt);
    setShowCloseConfirm(true);
  };

  const handleCashMovement = () => {
    const amt = parseFloat(cashAmount) || 0;
    if (amt <= 0) { setShowCashAmountError(true); return; }
    if (!cashReason.trim()) { setShowCashReasonError(true); return; }
    addCashMovement(cashType, amt, cashReason);
    setCashSuccessMsg(`${cashType === 'in' ? 'เงินเข้า' : 'เงินออก'} ฿${formatCurrency(amt)}`);
    setCashAmount(''); setCashReason(''); setShowCashModal(false);
    setShowCashSuccess(true);
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-rose-50')} edges={['top']}>
      {/* Header */}
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-3 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-lg font-extrabold text-white')}>จัดการกะ</Text>
          <Text className={cn('text-xs text-white/70 font-medium')}>Shift Management</Text>
        </View>
        <TouchableOpacity onPress={() => setShowHistory(true)}>
          <Ionicons name="time-outline" size={22} color="#fafafa" />
        </TouchableOpacity>
      </View>

      <ScrollView className={cn('flex-1')} contentContainerStyle={{ padding: 12, gap: 12 }}>
        {/* ─── ยังไม่เปิดกะ ── */}
        {!isShiftOpen() && !currentShift && (
          <View className={cn('bg-white rounded-2xl p-3 gap-2 border border-slate-200 shadow-sm')}>
            <View className={cn('items-center mb-2')}>
              <Ionicons name="time-outline" size={40} color="#f87171" />
            </View>
            <Text className={cn('text-xs font-extrabold text-slate-950')}>เปิดกะการทำงาน</Text>
            <Text className={cn('text-xs text-slate-500 font-medium')}>กรอกจำนวนเงินเปิดกะ (เงินทอนเริ่มต้น)</Text>
            <TextInput
              className={cn('bg-neutral-100 rounded-xl border border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950')}
              value={openAmount}
              onChangeText={setOpenAmount}
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
            />
            <TouchableOpacity className={cn('flex-row items-center justify-center gap-2 bg-rose-500 rounded-xl py-3')} onPress={handleOpenShift}>
              <Ionicons name="play-circle" size={18} color="#fafafa" />
              <Text className={cn('text-base font-bold text-white')}>เปิดกะ</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── กะเปิดอยู่ ── */}
        {currentShift && currentShift.status === 'open' && (
          <>
            {/* Summary */}
            <View className={cn('bg-white rounded-2xl p-3 gap-2 border border-slate-200 shadow-sm')}>
              <Text className={cn('text-xs font-extrabold text-slate-950')}>กะปัจจุบัน</Text>
              <Text className={cn('text-xs text-slate-500 font-medium')}>เปิดเมื่อ {new Date(currentShift.openedAt).toLocaleTimeString('th-TH')} · {currentShift.cashierName}</Text>
              <View className={cn('flex-row gap-2')}>
                <View className={cn('flex-1 bg-rose-50 rounded-lg p-2 items-center')}>
                  <Text className={cn('text-xs font-extrabold text-slate-950')}>฿{formatCurrency(currentShift.openingAmount)}</Text>
                  <Text className={cn('text-xs text-slate-500 mt-0.5 font-medium')}>เงินเปิดกะ</Text>
                </View>
                <View className={cn('flex-1 bg-rose-50 rounded-lg p-2 items-center')}>
                  <Text className={cn('text-xs font-extrabold text-slate-950')}>{currentShift.billCount}</Text>
                  <Text className={cn('text-xs text-slate-500 mt-0.5 font-medium')}>บิล</Text>
                </View>
                <View className={cn('flex-1 bg-rose-50 rounded-lg p-2 items-center')}>
                  <Text className={cn('text-xs font-extrabold')} style={{ color: '#0f766e' }}>฿{formatCurrency(currentShift.cashSalesTotal)}</Text>
                  <Text className={cn('text-xs text-slate-500 mt-0.5 font-medium')}>ยอดขาย</Text>
                </View>
                <View className={cn('flex-1 bg-rose-50 rounded-lg p-2 items-center')}>
                  <Text className={cn('text-xs font-extrabold')} style={{ color: '#f87171' }}>฿{formatCurrency(getExpectedCash())}</Text>
                  <Text className={cn('text-xs text-slate-500 mt-0.5 font-medium')}>เงินในลิ้นชัก</Text>
                </View>
              </View>
            </View>

            {/* Cash In/Out Buttons */}
            <View className={cn('flex-row gap-2')}>
              <TouchableOpacity className={cn('flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3 bg-emerald-500')} onPress={() => { setCashType('in'); setShowCashModal(true); }}>
                <Ionicons name="add-circle" size={20} color="#fafafa" />
                <Text className={cn('text-base font-bold text-white')}>เงินเข้า</Text>
              </TouchableOpacity>
              <TouchableOpacity className={cn('flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3 bg-amber-500')} onPress={() => { setCashType('out'); setShowCashModal(true); }}>
                <Ionicons name="remove-circle" size={20} color="#fafafa" />
                <Text className={cn('text-base font-bold text-white')}>เงินออก</Text>
              </TouchableOpacity>
            </View>

            {/* Cash Movements */}
            {currentShift.movements.length > 0 && (
              <View className={cn('bg-white rounded-2xl p-3 gap-2 border border-slate-200 shadow-sm')}>
                <Text className={cn('text-xs font-extrabold text-slate-950')}>เงินเข้า-ออกวันนี้</Text>
                {currentShift.movements.map((m) => (
                  <View key={m.id} className={cn('flex-row items-center gap-2 py-1 border-b border-slate-200')}>
                    <Ionicons
                      name={m.type === 'in' ? 'arrow-down-circle' : 'arrow-up-circle'}
                      size={18}
                      color={m.type === 'in' ? '#0f766e' : '#ef4444'}
                    />
                    <View style={{ flex: 1 }}>
                      <Text className={cn('text-base text-slate-950 font-semibold')}>{m.reason}</Text>
                      <Text className={cn('text-xs text-slate-500 font-medium')}>{new Date(m.createdAt).toLocaleTimeString('th-TH')} · {m.createdBy}</Text>
                    </View>
                    <Text className={cn('text-xs font-extrabold')} style={{ color: m.type === 'in' ? '#0f766e' : '#ef4444' }}>
                      {m.type === 'in' ? '+' : '-'}฿{formatCurrency(m.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Close Shift */}
            <View className={cn('bg-white rounded-2xl p-3 gap-2 border border-slate-200 shadow-sm')}>
              <Text className={cn('text-xs font-extrabold text-slate-950')}>ปิดกะ</Text>
              <Text className={cn('text-xs text-slate-500 font-medium')}>นับเงินในลิ้นชักแล้วกรอกยอดจริง</Text>
              <TextInput
                className={cn('bg-neutral-100 rounded-xl border border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950')}
                value={closeAmount}
                onChangeText={setCloseAmount}
                placeholder="กรอกยอดเงินที่นับได้"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
              />
              <TouchableOpacity className={cn('flex-row items-center justify-center gap-2 bg-rose-500 rounded-xl py-3')} onPress={handleCloseShift}>
                <Ionicons name="stop-circle" size={18} color="#fafafa" />
                <Text className={cn('text-base font-bold text-white')}>ปิดกะ</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* History (last 3) */}
        {shiftHistory.length > 0 && (
          <View className={cn('bg-white rounded-2xl p-3 gap-2 border border-slate-200 shadow-sm')}>
            <Text className={cn('text-xs font-extrabold text-slate-950')}>ประวัติกะ</Text>
            {shiftHistory.slice(0, 3).map((s) => (
              <View key={s.id} className={cn('flex-row items-center py-2 border-b border-slate-200')}>
                <View style={{ flex: 1 }}>
                  <Text className={cn('text-xs font-bold text-slate-950')}>{s.cashierName} · {s.posName}</Text>
                  <Text className={cn('text-xs text-slate-500 font-medium')}>{new Date(s.openedAt).toLocaleDateString('th-TH')} {new Date(s.openedAt).toLocaleTimeString('th-TH')} - {s.closedAt ? new Date(s.closedAt).toLocaleTimeString('th-TH') : ''}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text className={cn('text-xs font-extrabold text-rose-600')}>฿{formatCurrency(s.cashSalesTotal)}</Text>
                  <Text className={cn('text-xs font-medium')} style={{ color: (s.difference ?? 0) >= 0 ? '#0f766e' : '#ef4444' }}>
                    ผลต่าง: {(s.difference ?? 0) >= 0 ? '+' : ''}฿{formatCurrency(s.difference ?? 0)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Cash In/Out Modal */}
      <Modal visible={showCashModal} animationType="slide" transparent>
        <View className={cn('flex-1 bg-black/40 justify-center items-center')}>
          <View className={cn('bg-white rounded-2xl p-4 w-[85%] gap-3 shadow-sm')}>
            <Text className={cn('text-lg font-extrabold text-slate-950')}>{cashType === 'in' ? 'เงินเข้า' : 'เงินออก'}</Text>
            <TextInput
              className={cn('bg-neutral-100 rounded-xl border border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950')}
              value={cashAmount}
              onChangeText={setCashAmount}
              placeholder="จำนวนเงิน"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
            />
            <TextInput
              className={cn('bg-neutral-100 rounded-xl border border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950')}
              value={cashReason}
              onChangeText={setCashReason}
              placeholder="เหตุผล (เช่น เพิ่มเงินทอน, นำฝากธนาคาร)"
              placeholderTextColor="#9ca3af"
            />
            <View className={cn('flex-row justify-end gap-2')}>
              <TouchableOpacity className={cn('px-3 py-2')} onPress={() => setShowCashModal(false)}>
                <Text className={cn('text-base font-bold text-slate-500')}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity className={cn('flex-row items-center justify-center gap-2 bg-rose-500 rounded-xl py-3')} onPress={handleCashMovement}>
                <Text className={cn('text-base font-bold text-white')}>ยืนยัน</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertDialog
        visible={showOpenSuccess}
        onClose={() => setShowOpenSuccess(false)}
        title="เปิดกะสำเร็จ"
        message={`เงินเปิดกะ: ฿${formatCurrency(openSuccessAmount)}`}
        variant="success"
      />

      <ConfirmModal
        visible={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        title="ยืนยันปิดกะ"
        message={`เงินนับได้: ฿${formatCurrency(closeAmountVal)}\nยอดที่ควรเป็น: ฿${formatCurrency(getExpectedCash())}\nผลต่าง: ${(closeAmountVal - getExpectedCash()) >= 0 ? '+' : ''}฿${formatCurrency(closeAmountVal - getExpectedCash())}`}
        confirmLabel="ปิดกะ"
        cancelLabel="ยกเลิก"
        variant="warning"
        onConfirm={() => {
          closeShift(closeAmountVal);
          setCloseAmount('');
          setShowCloseConfirm(false);
        }}
        onCancel={() => setShowCloseConfirm(false)}
      />

      <AlertDialog
        visible={showCashAmountError}
        onClose={() => setShowCashAmountError(false)}
        title="ข้อผิดพลาด"
        message="กรุณากรอกจำนวนเงิน"
        variant="warning"
      />

      <AlertDialog
        visible={showCashReasonError}
        onClose={() => setShowCashReasonError(false)}
        title="ข้อผิดพลาด"
        message="กรุณากรอกเหตุผล"
        variant="warning"
      />

      <AlertDialog
        visible={showCashSuccess}
        onClose={() => setShowCashSuccess(false)}
        title="สำเร็จ"
        message={cashSuccessMsg}
        variant="success"
      />
    </SafeAreaView>
  );
};
