import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from '@/shared/tw/index';
import { Switch } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { usePromoStore } from '@/features/promotion/application/stores/promoStore';
import { cn } from '@/shared/lib/cn';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';

interface Props {
  onBack: () => void;
}

export const FixedDiscountScreen: React.FC<Props> = ({ onBack }) => {
  const { createPromotion } = usePromoStore();

  const [name, setName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stackable, setStackable] = useState(false);
  const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; variant: 'info' | 'success' | 'warning' | 'danger'; onConfirm?: () => void }>({ visible: false, title: '', message: '', variant: 'info' });

  const handleSubmit = () => {
    if (!name.trim() || !promoCode.trim() || !discountAmount.trim()
      || !startDate.trim() || !endDate.trim()) {
      setAlert({ visible: true, title: 'ข้อมูลไม่ครบ', message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', variant: 'warning' });
      return;
    }

    createPromotion({
      name: name.trim(),
      promoCode: promoCode.trim().toUpperCase(),
      description: `ส่วนลด ${discountAmount} บาท`,
      type: 'fixed',
      status: 'active',
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      discountAmount: Number(discountAmount),
      minPurchase: minPurchase ? Number(minPurchase) : undefined,
      stackable,
      priority: 2,
      createdBy: 'admin',
      shopId: 'shop-01',
    });

    setAlert({ visible: true, title: 'สำเร็จ', message: 'สร้างโปรโมชั่นส่วนลดจำนวนเงินเรียบร้อย', variant: 'success', onConfirm: onBack });
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 px-3 py-3 bg-rose-600 shadow-sm')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View className={cn('flex-1')}>
          <Text className={cn('text-lg font-extrabold text-white')}>ส่วนลดจำนวนเงิน</Text>
          <Text className={cn('text-xs font-medium text-white/70')}>Fixed Discount</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }} showsVerticalScrollIndicator={false}>
        <View className={cn('gap-1')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>ชื่อโปรโมชั่น *</Text>
          <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={name} onChangeText={setName}
            placeholder="เช่น ลด 50 บาท" placeholderTextColor="#9ca3af" />
        </View>

        <View className={cn('gap-1')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>รหัสโปรโมชั่น *</Text>
          <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={promoCode} onChangeText={setPromoCode}
            placeholder="เช่น FIXED50" placeholderTextColor="#9ca3af"
            autoCapitalize="characters" />
        </View>

        <View className={cn('flex-row gap-2')}>
          <View className={cn('flex-1 gap-1')}>
            <Text className={cn('text-xs font-bold text-slate-950')}>ส่วนลด (บาท) *</Text>
            <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={discountAmount}
              onChangeText={setDiscountAmount} placeholder="50"
              placeholderTextColor="#9ca3af" keyboardType="numeric" />
          </View>
          <View className={cn('flex-1 gap-1')}>
            <Text className={cn('text-xs font-bold text-slate-950')}>ยอดซื้อขั้นต่ำ (บาท)</Text>
            <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={minPurchase}
              onChangeText={setMinPurchase} placeholder="500"
              placeholderTextColor="#9ca3af" keyboardType="numeric" />
          </View>
        </View>

        <View className={cn('flex-row gap-2')}>
          <View className={cn('flex-1 gap-1')}>
            <Text className={cn('text-xs font-bold text-slate-950')}>วันเริ่มต้น *</Text>
            <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={startDate}
              onChangeText={setStartDate} placeholder="2026-01-01"
              placeholderTextColor="#9ca3af" />
          </View>
          <View className={cn('flex-1 gap-1')}>
            <Text className={cn('text-xs font-bold text-slate-950')}>วันสิ้นสุด *</Text>
            <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={endDate}
              onChangeText={setEndDate} placeholder="2026-12-31"
              placeholderTextColor="#9ca3af" />
          </View>
        </View>

        <View className={cn('flex-row items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-200')}>
          <View className={cn('flex-1')}>
            <Text className={cn('text-xs font-bold text-slate-950')}>ใช้ร่วมกับโปรอื่นได้</Text>
            <Text className={cn('text-xs font-medium text-slate-600')}>อนุญาตให้ซ้อนโปรโมชั่นกับโปรอื่น</Text>
          </View>
          <Switch
            value={stackable}
            onValueChange={setStackable}
          />
        </View>

        <TouchableOpacity className={cn('flex-row items-center justify-center gap-2 bg-rose-600 rounded-xl py-3 mt-3 shadow-lg shadow-rose-500/40')} onPress={handleSubmit}
          activeOpacity={0.85}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#fafafa" />
          <Text className={cn('text-base font-bold text-white')}>สร้างโปรโมชั่น</Text>
        </TouchableOpacity>

        <View className={cn('h-5')} />
      </ScrollView>

      <AlertDialog
        visible={alert.visible}
        onClose={() => setAlert({ ...alert, visible: false })}
        title={alert.title}
        message={alert.message}
        variant={alert.variant}
        confirmLabel="ตกลง"
        onConfirm={alert.onConfirm}
      />
    </SafeAreaView>
  );
};
