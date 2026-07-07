import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { formatCurrency } from '@/shared/lib/format';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { SafeAreaView } from 'react-native-safe-area-context';

type DiscountType = 'percent' | 'amount';

interface DiscountScreenProps {
  onBack: () => void;
  onApplyDiscount: (type: DiscountType, value: number) => void;
  subtotal: number;
  currentDiscount?: { type: DiscountType; value: number };
}

const PRESET_PERCENTS = [5, 10, 15, 20, 25, 30, 50];

export const DiscountScreen: React.FC<DiscountScreenProps> = ({ onBack, onApplyDiscount, subtotal, currentDiscount }) => {
  const [discountType, setDiscountType] = useState<DiscountType>(currentDiscount?.type ?? 'percent');
  const [inputValue, setInputValue] = useState(currentDiscount?.value?.toString() ?? '');

  const numValue = parseFloat(inputValue) || 0;
  const discountAmount = discountType === 'percent' ? (subtotal * numValue) / 100 : numValue;

  return (
    <SafeAreaView className="flex-1 bg-[#f6f7fb]" edges={['top']}>
      <View className="flex-row items-center border-b border-slate-100 bg-white px-4 py-3">
        <TouchableOpacity onPress={onBack} className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
          <Ionicons name="chevron-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-lg font-extrabold text-slate-950">ส่วนลด</Text>
        <View className="flex-1" />
        <Text className="text-sm font-extrabold text-slate-500">ยอดรวม: ฿{formatCurrency(subtotal)}</Text>
      </View>

      <View className="flex-1 gap-6 p-4">
        {/* Type Toggle */}
        <View className="flex-row rounded-xl bg-slate-100 p-1">
          <TouchableOpacity
            className={cn('flex-1 items-center rounded-lg py-3', discountType === 'percent' && 'bg-white shadow-sm')}
            onPress={() => setDiscountType('percent')}
          >
            <Text className={cn('text-sm font-bold', discountType === 'percent' ? 'text-rose-600' : 'text-slate-500')}>เปอร์เซ็นต์ (%)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={cn('flex-1 items-center rounded-lg py-3', discountType === 'amount' && 'bg-white shadow-sm')}
            onPress={() => setDiscountType('amount')}
          >
            <Text className={cn('text-sm font-bold', discountType === 'amount' ? 'text-rose-600' : 'text-slate-500')}>จำนวนเงิน (฿)</Text>
          </TouchableOpacity>
        </View>

        {/* Input */}
        <View className="items-center gap-2">
          <View className="flex-row items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6">
            <Text className="text-2xl font-extrabold text-slate-400">{discountType === 'percent' ? '%' : '฿'}</Text>
            <TextInput
              className="flex-1 py-5 text-center text-3xl font-extrabold text-slate-950"
              placeholder="0"
              placeholderTextColor="#cbd5e1"
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="numeric"
            />
          </View>
          <Text className="text-sm font-bold text-slate-500">
            = ส่วนลด ฿{formatCurrency(discountAmount)} ({discountType === 'percent' ? `${numValue}%` : `฿${formatCurrency(numValue)}`})
          </Text>
        </View>

        {/* Preset percent buttons */}
        {discountType === 'percent' && (
          <>
            <Text className="text-sm font-bold text-slate-950">เลือกจำนวน %</Text>
            <View className="flex-row flex-wrap gap-2">
              {PRESET_PERCENTS.map((pct) => (
                <TouchableOpacity
                  key={pct}
                  className={cn('min-w-[60px] flex-1 items-center rounded-xl border py-3', numValue === pct ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white')}
                  onPress={() => setInputValue(pct.toString())}
                >
                  <Text className={cn('text-sm font-extrabold', numValue === pct ? 'text-rose-600' : 'text-slate-700')}>{pct}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Summary */}
        <View className="mt-auto rounded-2xl border border-rose-100 bg-rose-50 p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-rose-700">ยอดหลังหักส่วนลด</Text>
            <Text className="text-xl font-extrabold text-rose-700">฿{formatCurrency(Math.max(0, subtotal - discountAmount))}</Text>
          </View>
        </View>
      </View>

      {/* Apply Button */}
      <View className="border-t border-slate-100 bg-white px-4 py-4">
        <TouchableOpacity
          className={cn('h-14 items-center justify-center rounded-2xl shadow-sm', numValue > 0 ? 'bg-emerald-500' : 'bg-slate-300')}
          onPress={() => numValue > 0 && onApplyDiscount(discountType, numValue)}
          disabled={numValue <= 0}
        >
          <Text className="text-base font-extrabold text-white">
            {currentDiscount ? 'เปลี่ยนส่วนลด' : 'ใช้ส่วนลด'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
