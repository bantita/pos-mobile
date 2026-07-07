import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { usePromoStore } from '@/features/promotion/application/stores/promoStore';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';

interface Props {
  onBack: () => void;
}

const LEVELS = [
  { key: 'silver', label: 'Silver' },
  { key: 'gold', label: 'Gold' },
  { key: 'platinum', label: 'Platinum' },
];

export const MemberPriceScreen: React.FC<Props> = ({ onBack }) => {
  const { createPromotion } = usePromoStore();

  const [name, setName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; variant: 'info' | 'success' | 'warning' | 'danger'; onConfirm?: () => void }>({ visible: false, title: '', message: '', variant: 'info' });

  const toggleLevel = (key: string) => {
    setSelectedLevels((prev) =>
      prev.includes(key) ? prev.filter(l => l !== key) : [...prev, key]
    );
  };

  const handleSubmit = () => {
    if (!name.trim() || !promoCode.trim() || !discountPercent.trim()
      || !startDate.trim() || !endDate.trim() || selectedLevels.length === 0) {
      setAlert({ visible: true, title: 'ข้อมูลไม่ครบ',
        message: 'กรุณากรอกข้อมูลที่จำเป็นและเลือกระดับสมาชิกอย่างน้อย 1 ระดับ', variant: 'warning' });
      return;
    }

    createPromotion({
      name: name.trim(),
      promoCode: promoCode.trim().toUpperCase(),
      description: `ราคาสมาชิก ลด ${discountPercent}% สำหรับ ${selectedLevels.join(', ')}`,
      type: 'member_price',
      status: 'active',
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      discountPercent: Number(discountPercent),
      applicableLevels: selectedLevels,
      stackable: true,
      priority: 5,
      createdBy: 'admin',
      shopId: 'shop-01',
    });

    setAlert({ visible: true, title: 'สำเร็จ', message: 'สร้างโปรโมชั่นราคาสมาชิกเรียบร้อย', variant: 'success', onConfirm: onBack });
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('bg-rose-600 flex-row items-center gap-2 px-3 py-3 shadow-sm')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-lg font-extrabold text-white')}>ราคาสมาชิก</Text>
          <Text className={cn('text-xs font-medium text-white/70')}>Member Price</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }} showsVerticalScrollIndicator={false}>
        <View className={cn('gap-1')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>ชื่อโปรโมชั่น *</Text>
          <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={name} onChangeText={setName}
            placeholder="เช่น ราคาสมาชิก Gold ลด 5%"
            placeholderTextColor="#9ca3af" />
        </View>

        <View className={cn('gap-1')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>รหัสโปรโมชั่น *</Text>
          <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={promoCode} onChangeText={setPromoCode}
            placeholder="เช่น GOLD-5PCT" placeholderTextColor="#9ca3af"
            autoCapitalize="characters" />
        </View>

        <View className={cn('gap-1')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>ส่วนลด (%) *</Text>
          <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={discountPercent}
            onChangeText={setDiscountPercent} placeholder="5"
            placeholderTextColor="#9ca3af" keyboardType="numeric" />
        </View>

        <View className={cn('gap-1')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>ระดับสมาชิกที่ใช้ได้ *</Text>
          <View className={cn('gap-1.5')}>
            {LEVELS.map((lv) => {
              const selected = selectedLevels.includes(lv.key);
              return (
                <TouchableOpacity
                  key={lv.key}
                  className={cn('flex-row items-center gap-2 bg-white rounded-2xl p-4 border shadow-sm', selected ? 'border-rose-500 bg-rose-50' : 'border-slate-200')}
                  onPress={() => toggleLevel(lv.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={selected ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={selected ? '#f87171' : '#9ca3af'}
                  />
                  <Text className={cn('text-sm font-medium text-slate-950', selected && 'text-rose-600 font-bold')}>
                    {lv.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
