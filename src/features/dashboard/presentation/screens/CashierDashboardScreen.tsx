import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { ShiftSummary } from '@/features/dashboard/domain/dashboard';
import { cn } from '@/shared/lib/cn';
import { formatCurrency, formatTime, formatDateTime } from '@/shared/lib/format';
import { Text } from '@/shared/tw/index';

interface CashierDashboardScreenProps {
  onStartSale: () => void;
  onOpenSync: () => void;
  cashierName?: string;
  posName?: string;
  isShiftOpen?: boolean;
}

const MOCK_SHIFT: ShiftSummary = {
  shiftStart: new Date(Date.now() - 3 * 60 * 60 * 1000),
  salesAmount: 3240,
  billCount: 12,
  cashierName: 'สมชาย ใจดี',
  posName: 'POS 1',
};

const MOCK_RECENT = [
  { billNo: 'INV00123', amount: 450, time: new Date(Date.now() - 10 * 60000), items: 3 },
  { billNo: 'INV00122', amount: 280, time: new Date(Date.now() - 25 * 60000), items: 2 },
  { billNo: 'INV00121', amount: 120, time: new Date(Date.now() - 40 * 60000), items: 1 },
];

export const CashierDashboardScreen: React.FC<CashierDashboardScreenProps> = ({
  onStartSale,
  onOpenSync,
  cashierName,
  posName,
  isShiftOpen = true,
}) => {
  const [shift] = useState<ShiftSummary>({
    ...MOCK_SHIFT,
    cashierName: cashierName ?? MOCK_SHIFT.cashierName,
    posName: posName ?? MOCK_SHIFT.posName,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isShiftOpen) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isShiftOpen]);

  const avgPerBill = shift.billCount > 0 ? shift.salesAmount / shift.billCount : 0;
  const maxBill = Math.max(...MOCK_RECENT.map((r) => r.amount));

  const elapsedMs = currentTime.getTime() - shift.shiftStart.getTime();
  const elapsedH = Math.floor(elapsedMs / 3600000);
  const elapsedM = Math.floor((elapsedMs % 3600000) / 60000);
  const elapsedStr = `${elapsedH}ชม. ${elapsedM}นาที`;

  return (
    <SafeAreaView className="flex-1 bg-[#f6f7fb]" edges={['top']}>
      <View className="flex-row items-center justify-between bg-rose-500 px-3 py-3">
        <View>
          <View className="flex-row items-center gap-2">
            <Ionicons name="hand-left" size={19} color="#ffffff" />
            <Text className="text-lg font-semibold leading-[26px] text-white">สวัสดี, {shift.cashierName}</Text>
          </View>
          <Text className="text-xs leading-[18px] text-slate-500">{shift.posName}</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <Text className="text-lg font-semibold leading-[26px] text-white" style={{ fontVariant: ['tabular-nums'] }}>{formatTime(currentTime)}</Text>
          <TouchableOpacity onPress={onOpenSync} className="p-1">
            <Ionicons name="cloud-upload-outline" size={20} color="#fafafa" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="p-3 gap-3">
        <View
          className={cn('bg-white rounded-2xl p-3 gap-3 border-2', isShiftOpen ? 'border-emerald-500' : 'border-rose-500')}
          style={{ shadowColor: '#09090b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}
        >
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-xs leading-[18px] text-slate-500">สถานะกะ</Text>
              <View className="flex-row items-center gap-1 mt-[2px]">
                <View className={cn('w-2 h-2 rounded-full', isShiftOpen ? 'bg-emerald-500' : 'bg-rose-500')} />
                <Text className={cn('text-xs font-semibold leading-[18px] font-bold', isShiftOpen ? 'text-emerald-600' : 'text-rose-600')}>
                  {isShiftOpen ? 'กะเปิดอยู่' : 'กะปิดแล้ว'}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-xs leading-[18px] text-slate-500">เริ่มกะ</Text>
              <Text className="text-xs font-semibold leading-[18px] text-slate-950 font-semibold">{formatTime(shift.shiftStart)}</Text>
              <Text className="text-xs leading-[18px] text-slate-500">{elapsedStr}</Text>
            </View>
          </View>

          <View className="h-[1px]" style={{ backgroundColor: '#e7e5e4' }} />

          <View className="flex-row">
            <View className="flex-1 items-center">
              <Text className="text-lg font-semibold leading-[26px] text-slate-950 font-bold">฿{formatCurrency(shift.salesAmount)}</Text>
              <Text className="text-xs leading-[18px] text-slate-500">ยอดขายกะนี้</Text>
            </View>
            <View className="w-[1px]" style={{ backgroundColor: '#e7e5e4' }} />
            <View className="flex-1 items-center">
              <Text className="text-lg font-semibold leading-[26px] text-slate-950 font-bold">{shift.billCount}</Text>
              <Text className="text-xs leading-[18px] text-slate-500">จำนวนบิล</Text>
            </View>
            <View className="w-[1px]" style={{ backgroundColor: '#e7e5e4' }} />
            <View className="flex-1 items-center">
              <Text className="text-lg font-semibold leading-[26px] text-slate-950 font-bold">฿{formatCurrency(avgPerBill)}</Text>
              <Text className="text-xs leading-[18px] text-slate-500">เฉลี่ย/บิล</Text>
            </View>
          </View>
        </View>

        {isShiftOpen && (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              className="rounded-[20px] overflow-hidden"
              style={{ shadowColor: '#f87171', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, boxShadow: '0 24px 64px rgba(15, 23, 42, 0.18)' }}
              onPress={onStartSale}
              activeOpacity={0.85}
            >
              <View className="bg-rose-500 items-center py-5 gap-1 rounded-[20px]">
                <Ionicons name="cart" size={36} color="#fafafa" />
                <Text className="text-xl font-semibold leading-[26px] text-white font-extrabold">เริ่มขายสินค้า</Text>
                <Text className="text-base leading-[22px] text-slate-500">กดเพื่อเปิดหน้าขาย</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View className="flex-row gap-2">
          {[
            { label: 'บิลล่าสุด', value: `฿${formatCurrency(MOCK_RECENT[0].amount)}`, icon: 'receipt-outline', color: '#f87171' },
            { label: 'เฉลี่ย/บิล', value: `฿${formatCurrency(avgPerBill)}`, icon: 'analytics-outline', color: '#0f766e' },
            { label: 'บิลสูงสุด', value: `฿${formatCurrency(maxBill)}`, icon: 'trophy-outline', color: '#a16207' },
          ].map((s, i) => (
            <View key={i} className="flex-1 items-center gap-1 bg-white rounded-xl p-3 border border-slate-200">
              <Ionicons name={s.icon as any} size={20} color={s.color} />
              <Text className="text-xs font-semibold leading-[18px] font-bold" style={{ color: s.color }}>{s.value}</Text>
              <Text className="text-xs leading-[18px] text-slate-500">{s.label}</Text>
            </View>
          ))}
        </View>

        <View
          className="bg-white rounded-2xl p-3 gap-2"
          style={{ shadowColor: '#09090b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, boxShadow: '0 4px 14px rgba(15, 23, 42, 0.07)' }}
        >
          <Text className="text-xs font-semibold leading-[18px] text-slate-950 font-bold">บิลล่าสุด</Text>
          {MOCK_RECENT.map((bill, i) => (
            <View key={i} className="flex-row items-center gap-2 py-1">
              <View className="w-9 h-9 rounded-lg bg-rose-50 items-center justify-center">
                <Ionicons name="receipt-outline" size={18} color="#f87171" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold leading-[18px] text-slate-950">{bill.billNo}</Text>
                <Text className="text-xs leading-[18px] text-slate-500">{formatTime(bill.time)} · {bill.items} รายการ</Text>
              </View>
              <Text className="text-xs font-semibold leading-[18px] text-rose-600 font-bold">฿{formatCurrency(bill.amount)}</Text>
            </View>
          ))}
        </View>

        <View className="h-5" />
      </ScrollView>
    </SafeAreaView>
  );
};
