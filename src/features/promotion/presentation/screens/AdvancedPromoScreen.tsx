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

type TabMode = 'buy_x_get_y' | 'happy_hour';

export const AdvancedPromoScreen: React.FC<Props> = ({ onBack }) => {
  const { createPromotion } = usePromoStore();
  const [tab, setTab] = useState<TabMode>('buy_x_get_y');

  const [bxName, setBxName] = useState('');
  const [bxCode, setBxCode] = useState('');
  const [buyQty, setBuyQty] = useState('');
  const [getQty, setGetQty] = useState('');
  const [getProductId, setGetProductId] = useState('');
  const [applicableProducts, setApplicableProducts] = useState('');
  const [bxStartDate, setBxStartDate] = useState('');
  const [bxEndDate, setBxEndDate] = useState('');

  const [hhName, setHhName] = useState('');
  const [hhCode, setHhCode] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [hhDiscountPercent, setHhDiscountPercent] = useState('');
  const [hhCategories, setHhCategories] = useState('');
  const [hhStartDate, setHhStartDate] = useState('');
  const [hhEndDate, setHhEndDate] = useState('');
  const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; variant: 'info' | 'success' | 'warning' | 'danger'; onConfirm?: () => void }>({ visible: false, title: '', message: '', variant: 'info' });

  const handleSubmitBuyXGetY = () => {
    if (!bxName.trim() || !bxCode.trim() || !buyQty.trim() || !getQty.trim()
      || !bxStartDate.trim() || !bxEndDate.trim()) {
      setAlert({ visible: true, title: 'ข้อมูลไม่ครบ', message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', variant: 'warning' });
      return;
    }

    createPromotion({
      name: bxName.trim(),
      promoCode: bxCode.trim().toUpperCase(),
      description: `ซื้อ ${buyQty} แถม ${getQty}`,
      type: 'buy_x_get_y',
      status: 'active',
      startDate: bxStartDate.trim(),
      endDate: bxEndDate.trim(),
      buyQty: Number(buyQty),
      getQty: Number(getQty),
      getProductId: getProductId.trim() || undefined,
      applicableProducts: applicableProducts
        ? applicableProducts.split(',').map(p => p.trim())
        : undefined,
      stackable: false,
      priority: 4,
      createdBy: 'admin',
      shopId: 'shop-01',
    });

    setAlert({ visible: true, title: 'สำเร็จ', message: 'สร้างโปร Buy X Get Y เรียบร้อย', variant: 'success', onConfirm: onBack });
  };

  const handleSubmitHappyHour = () => {
    if (!hhName.trim() || !hhCode.trim() || !startTime.trim() || !endTime.trim()
      || !hhDiscountPercent.trim() || !hhStartDate.trim() || !hhEndDate.trim()) {
      setAlert({ visible: true, title: 'ข้อมูลไม่ครบ', message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', variant: 'warning' });
      return;
    }

    createPromotion({
      name: hhName.trim(),
      promoCode: hhCode.trim().toUpperCase(),
      description: `Happy Hour ${startTime}-${endTime} ลด ${hhDiscountPercent}%`,
      type: 'happy_hour',
      status: 'active',
      startDate: hhStartDate.trim(),
      endDate: hhEndDate.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      discountPercent: Number(hhDiscountPercent),
      applicableCategories: hhCategories
        ? hhCategories.split(',').map(c => c.trim())
        : undefined,
      stackable: false,
      priority: 1,
      createdBy: 'admin',
      shopId: 'shop-01',
    });

    setAlert({ visible: true, title: 'สำเร็จ', message: 'สร้างโปร Happy Hour เรียบร้อย', variant: 'success', onConfirm: onBack });
  };

  const renderBuyXGetY = () => (
    <>
      <View className={cn('gap-1')}>
        <Text className={cn('text-xs font-bold text-slate-950')}>ชื่อโปรโมชั่น *</Text>
        <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={bxName} onChangeText={setBxName}
          placeholder="เช่น ซื้อ 3 แถม 1" placeholderTextColor="#9ca3af" />
      </View>
      <View className={cn('gap-1')}>
        <Text className={cn('text-xs font-bold text-slate-950')}>รหัสโปรโมชั่น *</Text>
        <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={bxCode} onChangeText={setBxCode}
          placeholder="เช่น BUY3GET1" placeholderTextColor="#9ca3af"
          autoCapitalize="characters" />
      </View>
      <View className={cn('flex-row gap-2')}>
        <View className={cn('flex-1 gap-1')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>จำนวนที่ซื้อ *</Text>
          <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={buyQty} onChangeText={setBuyQty}
            placeholder="3" placeholderTextColor="#9ca3af" keyboardType="numeric" />
        </View>
        <View className={cn('flex-1 gap-1')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>จำนวนที่แถม *</Text>
          <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={getQty} onChangeText={setGetQty}
            placeholder="1" placeholderTextColor="#9ca3af" keyboardType="numeric" />
        </View>
      </View>
      <View className={cn('gap-1')}>
        <Text className={cn('text-xs font-bold text-slate-950')}>รหัสสินค้าที่แถม</Text>
        <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={getProductId}
          onChangeText={setGetProductId} placeholder="เช่น P001"
          placeholderTextColor="#9ca3af" />
      </View>
      <View className={cn('gap-1')}>
        <Text className={cn('text-xs font-bold text-slate-950')}>สินค้าที่ร่วมรายการ (คั่นด้วย ,)</Text>
        <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={applicableProducts}
          onChangeText={setApplicableProducts} placeholder="P001, P002"
          placeholderTextColor="#9ca3af" />
      </View>
      <View className={cn('flex-row gap-2')}>
        <View className={cn('flex-1 gap-1')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>วันเริ่มต้น *</Text>
          <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={bxStartDate}
            onChangeText={setBxStartDate} placeholder="2026-01-01"
            placeholderTextColor="#9ca3af" />
        </View>
        <View className={cn('flex-1 gap-1')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>วันสิ้นสุด *</Text>
          <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={bxEndDate}
            onChangeText={setBxEndDate} placeholder="2026-12-31"
            placeholderTextColor="#9ca3af" />
        </View>
      </View>
      <TouchableOpacity className={cn('flex-row items-center justify-center gap-2 bg-rose-600 rounded-xl py-3 mt-3 shadow-lg shadow-rose-500/40')} onPress={handleSubmitBuyXGetY}
        activeOpacity={0.85}>
        <Ionicons name="checkmark-circle-outline" size={20} color="#fafafa" />
        <Text className={cn('text-base font-bold text-white')}>สร้างโปรโมชั่น</Text>
      </TouchableOpacity>
    </>
  );

  const renderHappyHour = () => (
    <>
      <View className={cn('gap-1')}>
        <Text className={cn('text-xs font-bold text-slate-950')}>ชื่อโปรโมชั่น *</Text>
        <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={hhName} onChangeText={setHhName}
          placeholder="เช่น Happy Hour 17:00-19:00" placeholderTextColor="#9ca3af" />
      </View>
      <View className={cn('gap-1')}>
        <Text className={cn('text-xs font-bold text-slate-950')}>รหัสโปรโมชั่น *</Text>
        <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={hhCode} onChangeText={setHhCode}
          placeholder="เช่น HAPPY-1719" placeholderTextColor="#9ca3af"
          autoCapitalize="characters" />
      </View>
      <View className={cn('flex-row gap-2')}>
        <View className={cn('flex-1 gap-1')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>เวลาเริ่ม (HH:mm) *</Text>
          <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={startTime}
            onChangeText={setStartTime} placeholder="17:00"
            placeholderTextColor="#9ca3af" />
        </View>
        <View className={cn('flex-1 gap-1')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>เวลาสิ้นสุด (HH:mm) *</Text>
          <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={endTime}
            onChangeText={setEndTime} placeholder="19:00"
            placeholderTextColor="#9ca3af" />
        </View>
      </View>
      <View className={cn('gap-1')}>
        <Text className={cn('text-xs font-bold text-slate-950')}>ส่วนลด (%) *</Text>
        <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={hhDiscountPercent}
          onChangeText={setHhDiscountPercent} placeholder="20"
          placeholderTextColor="#9ca3af" keyboardType="numeric" />
      </View>
      <View className={cn('gap-1')}>
        <Text className={cn('text-xs font-bold text-slate-950')}>หมวดหมู่ที่ใช้ได้ (คั่นด้วย ,)</Text>
        <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={hhCategories}
          onChangeText={setHhCategories} placeholder="เครื่องดื่ม, ขนม"
          placeholderTextColor="#9ca3af" />
      </View>
      <View className={cn('flex-row gap-2')}>
        <View className={cn('flex-1 gap-1')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>วันเริ่มต้น *</Text>
          <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={hhStartDate}
            onChangeText={setHhStartDate} placeholder="2026-01-01"
            placeholderTextColor="#9ca3af" />
        </View>
        <View className={cn('flex-1 gap-1')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>วันสิ้นสุด *</Text>
          <TextInput className={cn('bg-white rounded-xl border border-slate-200 px-3 h-12 text-sm font-medium text-slate-950 shadow-sm')} value={hhEndDate}
            onChangeText={setHhEndDate} placeholder="2026-12-31"
            placeholderTextColor="#9ca3af" />
        </View>
      </View>
      <TouchableOpacity className={cn('flex-row items-center justify-center gap-2 bg-rose-600 rounded-xl py-3 mt-3 shadow-lg shadow-rose-500/40')} onPress={handleSubmitHappyHour}
        activeOpacity={0.85}>
        <Ionicons name="checkmark-circle-outline" size={20} color="#fafafa" />
        <Text className={cn('text-base font-bold text-white')}>สร้างโปรโมชั่น</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('bg-rose-600 flex-row items-center gap-2 px-3 py-3 shadow-sm')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-lg font-extrabold text-white')}>โปรโมชั่นขั้นสูง</Text>
          <Text className={cn('text-xs font-medium text-white/70')}>Advanced Promotion</Text>
        </View>
      </View>

      <View className={cn('flex-row bg-white border-b border-slate-200 shadow-sm')}>
        <TouchableOpacity
          className={cn('flex-1 flex-row items-center justify-center gap-1 py-3', tab === 'buy_x_get_y' ? 'border-b-2 border-b-rose-500' : '')}
          onPress={() => setTab('buy_x_get_y')}
        >
          <Ionicons name="gift-outline" size={16}
            color={tab === 'buy_x_get_y' ? '#f87171' : '#6b7280'} />
          <Text className={cn('text-xs font-bold', tab === 'buy_x_get_y' ? 'text-rose-600' : 'text-gray-500')}>Buy X Get Y</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={cn('flex-1 flex-row items-center justify-center gap-1 py-3', tab === 'happy_hour' ? 'border-b-2 border-b-rose-500' : '')}
          onPress={() => setTab('happy_hour')}
        >
          <Ionicons name="time-outline" size={16}
            color={tab === 'happy_hour' ? '#f87171' : '#6b7280'} />
          <Text className={cn('text-xs font-bold', tab === 'happy_hour' ? 'text-rose-600' : 'text-gray-500')}>Happy Hour</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }} showsVerticalScrollIndicator={false}>
        {tab === 'buy_x_get_y' ? renderBuyXGetY() : renderHappyHour()}
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
