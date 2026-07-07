import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from '@/shared/tw/index';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatCurrency, formatDateTime } from '@/shared/lib/format';

interface ReceiptScreenProps {
  onBack: () => void;
  onPrint: () => void;
  onShare: () => void;
  billNumber?: string;
  items?: Array<{ name: string; qty: number; price: number; total: number }>;
  total?: number;
  discount?: number;
  paymentMethod?: string;
  cashReceived?: number;
  change?: number;
}

const MOCK_ITEMS = [
  { name: 'น้ำดื่มสิงห์ 600ml', qty: 2, price: 10, total: 20 },
  { name: 'มาม่า หมูสับ', qty: 3, price: 7, total: 21 },
  { name: 'กาแฟ Nescafe', qty: 1, price: 12, total: 12 },
];

export const ReceiptScreen: React.FC<ReceiptScreenProps> = ({
  onBack, onPrint, onShare,
  billNumber = 'B20240101-001',
  items = MOCK_ITEMS,
  total = 53,
  discount = 0,
  paymentMethod = 'เงินสด',
  cashReceived = 100,
  change = 47,
}) => {
  const [showFull, setShowFull] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-[#f6f7fb]" edges={['top']}>
      <View className="flex-row items-center border-b border-slate-100 bg-white px-4 py-3">
        <TouchableOpacity onPress={onBack} className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
          <Ionicons name="chevron-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-lg font-extrabold text-slate-950">ใบเสร็จ</Text>
        <View className="flex-1" />
        <TouchableOpacity className="h-9 w-9 items-center justify-center rounded-xl bg-rose-50" onPress={onShare}>
          <Ionicons name="share-outline" size={18} color="#e11d48" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4">
        <View className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          {/* Receipt Header */}
          <View className="items-center border-b border-dashed border-slate-200 px-6 pb-4 pt-6">
            <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
              <Ionicons name="checkmark-circle" size={36} color="#059669" />
            </View>
            <Text className="text-base font-extrabold text-slate-950">ชำระเงินสำเร็จ</Text>
            <Text className="mt-1 text-xs font-bold text-slate-400">เลขที่ {billNumber}</Text>
            <Text className="text-xs font-bold text-slate-400">{formatDateTime(new Date())}</Text>
          </View>

          {/* Items */}
          <View className="gap-2 px-6 py-4">
            {items.map((item, i) => (
              <View key={i} className="flex-row items-center">
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-950">{item.name}</Text>
                  <Text className="text-xs font-bold text-slate-400">x{item.qty} @ ฿{formatCurrency(item.price)}</Text>
                </View>
                <Text className="text-sm font-extrabold text-slate-950">฿{formatCurrency(item.total)}</Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View className="border-t border-dashed border-slate-200 px-6 pb-4 pt-4">
            <View className="gap-1.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-slate-500">รวม</Text>
                <Text className="text-sm font-bold text-slate-950">฿{formatCurrency(total + discount)}</Text>
              </View>
              {discount > 0 && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-emerald-600">ส่วนลด</Text>
                  <Text className="text-sm font-bold text-emerald-600">-฿{formatCurrency(discount)}</Text>
                </View>
              )}
              <View className="my-1 h-px bg-slate-200" />
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-extrabold text-slate-950">ยอดรวมสุทธิ</Text>
                <Text className="text-lg font-extrabold text-rose-600">฿{formatCurrency(total)}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-slate-500">ชำระโดย</Text>
                <Text className="text-sm font-bold text-slate-950">{paymentMethod}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-slate-500">รับเงิน</Text>
                <Text className="text-sm font-bold text-slate-950">฿{formatCurrency(cashReceived)}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-slate-500">เงินทอน</Text>
                <Text className="text-sm font-bold text-emerald-600">฿{formatCurrency(change)}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View className="gap-3 border-t border-slate-100 bg-white px-4 py-4">
        <TouchableOpacity className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-rose-500 shadow-sm" onPress={onPrint}>
          <Ionicons name="print-outline" size={20} color="#fff" />
          <Text className="text-sm font-extrabold text-white">พิมพ์ใบเสร็จ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
