import { Ionicons } from '@/shared/icons/lucideAdapter';
import { AlertDialog, AppButton, AppModal } from '@/shared/ui/index';
import { cn } from '@/shared/lib/cn';
import { formatCurrency } from '@/shared/lib/format';
import React, { useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PaymentScreenProps {
  onBack: () => void;
  onPayComplete: (method: PaymentMethod) => void;
  grandTotal: number;
}

type PaymentMethod = 'cash' | 'qr' | 'card' | 'credit' | 'promptpay' | 'transfer';
type TenderType = 'full' | 'split' | 'custom';

interface PaymentOption {
  key: PaymentMethod;
  label: string;
  icon: string;
  color: string;
  bg: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { key: 'cash', label: 'เงินสด', icon: 'cash-outline', color: '#059669', bg: 'bg-emerald-50' },
  { key: 'qr', label: 'QR Payment', icon: 'qr-code-outline', color: '#7c3aed', bg: 'bg-violet-50' },
  { key: 'card', label: 'บัตรเครดิต/เดบิต', icon: 'card-outline', color: '#2563eb', bg: 'bg-blue-50' },
  { key: 'promptpay', label: 'พร้อมเพย์', icon: 'phone-portrait-outline', color: '#d97706', bg: 'bg-amber-50' },
  { key: 'transfer', label: 'โอนเงิน', icon: 'swap-horizontal-outline', color: '#0891b2', bg: 'bg-cyan-50' },
  { key: 'credit', label: 'เครดิต', icon: 'wallet-outline', color: '#e11d48', bg: 'bg-rose-50' },
];

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ onBack, onPayComplete, grandTotal }) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [tenderType, setTenderType] = useState<TenderType>('full');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const cashAmount = parseFloat(cashReceived) || 0;
  const change = useMemo(() => Math.max(0, cashAmount - grandTotal), [cashAmount, grandTotal]);
  const isShort = cashAmount > 0 && cashAmount < grandTotal;
  const isExact = cashAmount >= grandTotal;

  const handlePay = () => {
    if (selectedMethod === 'cash' && !isExact) {
      return;
    }
    if (grandTotal > 10000) {
      setShowConfirm(true);
    } else {
      setShowSuccess(true);
    }
  };

  const handleConfirmPay = () => {
    setShowConfirm(false);
    setShowSuccess(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onPayComplete(selectedMethod);
  };

  const QuickAmountButton = ({ amount }: { amount: number }) => (
    <TouchableOpacity
      className={cn('min-h-10 flex-1 items-center justify-center rounded-xl border', cashAmount === amount ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white')}
      onPress={() => setCashReceived(amount.toString())}
    >
      <Text className={cn('text-sm font-bold', cashAmount === amount ? 'text-rose-600' : 'text-slate-700')}>฿{formatCurrency(amount)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f6f7fb]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center border-b border-slate-100 bg-white px-4 py-3">
        <TouchableOpacity onPress={onBack} className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
          <Ionicons name="chevron-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-lg font-extrabold text-slate-950">ชำระเงิน</Text>
      </View>

      <View className="flex-1 p-4">
        {/* Total */}
        <View className="mb-6 items-center rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
          <Text className="text-sm font-bold text-slate-500">ยอดชำระ</Text>
          <Text className="mt-1 text-4xl font-extrabold text-rose-600">฿{formatCurrency(grandTotal)}</Text>
        </View>

        {/* Payment Methods */}
        <Text className="mb-3 text-sm font-bold text-slate-950">เลือกช่องทางชำระเงิน</Text>
        <View className="mb-6 flex-row flex-wrap gap-2">
          {PAYMENT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              className={cn('flex-1 min-w-[30%] items-center gap-2 rounded-2xl border p-4', selectedMethod === opt.key ? 'border-rose-500 bg-rose-50' : 'border-slate-100 bg-white')}
              onPress={() => setSelectedMethod(opt.key)}
            >
              <View className={cn('h-10 w-10 items-center justify-center rounded-xl', opt.bg)}>
                <Ionicons name={opt.icon as any} size={22} color={opt.color} />
              </View>
              <Text className="text-sm font-bold text-slate-700">{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cash Input */}
        {selectedMethod === 'cash' && (
          <View className="gap-3">
            <Text className="text-sm font-bold text-slate-950">รับเงินมา</Text>
            <View className="flex-row items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4">
              <Text className="text-lg font-extrabold text-slate-400">฿</Text>
              <TextInput
                className="flex-1 py-4 text-lg font-extrabold text-slate-950"
                placeholder="0"
                placeholderTextColor="#cbd5e1"
                value={cashReceived}
                onChangeText={setCashReceived}
                keyboardType="numeric"
              />
            </View>

            {/* Quick amounts */}
            <View className="flex-row gap-2">
              <QuickAmountButton amount={Math.ceil(grandTotal / 10) * 10} />
              <QuickAmountButton amount={Math.ceil(grandTotal / 5) * 5} />
              <QuickAmountButton amount={Math.ceil(grandTotal / 2) * 2} />
              <QuickAmountButton amount={Math.ceil(grandTotal)} />
            </View>

            {/* Change display */}
            {cashAmount > 0 && (
              <View className={cn('rounded-2xl p-4', isShort ? 'bg-rose-50' : 'bg-emerald-50')}>
                {isShort ? (
                  <Text className="text-center text-sm font-bold text-rose-600">
                    เงินไม่พอ · ขาดอีก ฿{formatCurrency(grandTotal - cashAmount)}
                  </Text>
                ) : (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-emerald-700">เงินทอน</Text>
                    <Text className="text-lg font-extrabold text-emerald-700">฿{formatCurrency(change)}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Split payment hint */}
        {selectedMethod === 'credit' && (
          <View className="rounded-2xl bg-violet-50 p-4">
            <Text className="text-center text-sm font-bold text-violet-700">เครดิต — จะบันทึกเป็นยอดค้างชำระ</Text>
          </View>
        )}

        {/* Payment Info for non-cash */}
        {selectedMethod !== 'cash' && (
          <View className="rounded-2xl bg-amber-50 p-4">
            <Text className="text-center text-sm font-bold text-amber-700">
              {selectedMethod === 'qr' ? 'สแกน QR Code เพื่อชำระเงิน' :
               selectedMethod === 'card' ? 'รูด/แตะบัตรที่เครื่อง EDC' :
               selectedMethod === 'promptpay' ? 'โอน via พร้อมเพย์' :
               selectedMethod === 'transfer' ? 'โอนเงินตามบัญชีร้าน' : 'บันทึกเป็นยอดเครดิต'}
            </Text>
          </View>
        )}
      </View>

      {/* Pay Button */}
      <View className="border-t border-slate-100 bg-white px-4 py-4">
        <TouchableOpacity
          className={cn('h-14 items-center justify-center rounded-2xl shadow-sm',
            selectedMethod === 'cash' && !isExact ? 'bg-slate-300' : 'bg-emerald-500')}
          onPress={handlePay}
          disabled={selectedMethod === 'cash' && !isExact}
        >
          <Text className="text-base font-extrabold text-white">
            {selectedMethod === 'cash' ? (isExact ? `จ่ายเงินสด ฿${formatCurrency(cashAmount)}` : 'กรอกรับเงินมา') : `ชำระ ฿${formatCurrency(grandTotal)}`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Confirm Dialog for large amounts */}
      <AlertDialog
        visible={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="ยืนยันการชำระเงิน"
        message={`ยอดชำระ ฿${formatCurrency(grandTotal)} — โปรดยืนยัน`}
        variant="warning"
        confirmLabel="ยืนยัน"
        cancelLabel="ยกเลิก"
        onConfirm={handleConfirmPay}
        onCancel={() => {}}
      />

      {/* Success Modal */}
      <AppModal visible={showSuccess} onClose={handleSuccessClose} size="sm">
        <View className="items-center gap-4 py-6">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
            <Ionicons name="checkmark-circle" size={44} color="#059669" />
          </View>
          <Text className="text-xl font-extrabold text-slate-950">ชำระเงินสำเร็จ</Text>
          <Text className="text-center text-sm font-bold text-slate-500">
            รับเงิน ฿{formatCurrency(cashAmount || grandTotal)}{'\n'}
            {selectedMethod === 'cash' ? `เงินทอน ฿${formatCurrency(change)}` : `ผ่าน ${PAYMENT_OPTIONS.find(o => o.key === selectedMethod)?.label}`}
          </Text>
          <TouchableOpacity className="mt-2 h-12 w-full items-center justify-center rounded-2xl bg-emerald-500" onPress={handleSuccessClose}>
            <Text className="text-sm font-extrabold text-white">พิมพ์ใบเสร็จ</Text>
          </TouchableOpacity>
        </View>
      </AppModal>
    </SafeAreaView>
  );
};
