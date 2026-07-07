import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView } from '@/shared/tw/index';
import { Platform } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { useMemberStore } from '@/features/member/application/stores/memberStore';
import { MemberLevel } from '@/features/member/domain/member';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';

interface Props {
  onBack: () => void;
}

const LEVEL_OPTIONS: { value: MemberLevel; label: string; color: string; bgColor: string }[] = [
  { value: 'member', label: 'Member', color: '#e11d48', bgColor: '#ffe4e6' },
  { value: 'silver', label: 'Silver', color: '#6b7280', bgColor: '#f3f4f6' },
  { value: 'gold', label: 'Gold', color: '#a16207', bgColor: '#fed7aa' },
  { value: 'platinum', label: 'Platinum', color: '#6b21a8', bgColor: '#e9d5ff' },
  { value: 'vip', label: 'VIP', color: '#ef4444', bgColor: '#ffe4e6' },
];

export const AddMemberScreen: React.FC<Props> = ({ onBack }) => {
  const { addMember } = useMemberStore();

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [level, setLevel] = useState<MemberLevel>('member');
  const [errors, setErrors] = useState<{ phone?: string; name?: string }>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: { phone?: string; name?: string } = {};
    if (!phone.trim()) newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    if (!name.trim()) newErrors.name = 'กรุณากรอกชื่อสมาชิก';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    addMember({
      phone: phone.trim(),
      name: name.trim(),
      birthday: birthday.trim() || undefined,
      level,
      isActive: true,
      shopId: 'shop-01',
      branchId: 'b1',
    });
    setShowSuccess(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f6f7fb]" edges={['top']}>
      <View className="flex-row items-center gap-3 bg-rose-600 px-4 pb-4 pt-4">
        <TouchableOpacity onPress={onBack} className="rounded-full bg-white/20 p-1.5">
          <Ionicons name="arrow-back" size={22} color="#fafafa" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-extrabold text-white">เพิ่มสมาชิก</Text>
          <Text className="text-xs font-medium text-white/70">กรอกข้อมูลสมาชิกใหม่</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="gap-1.5">
            <Text className="text-xs font-bold text-slate-800">เบอร์โทรศัพท์ *</Text>
            <View className={cn('h-12 flex-row items-center gap-2 rounded-2xl border bg-white px-4', errors.phone ? 'border-rose-500' : 'border-slate-200')}>
              <Ionicons name="call-outline" size={18} color="#a1a1aa" />
              <TextInput
                className="flex-1 text-sm font-medium text-slate-900"
                placeholder="0xx-xxx-xxxx"
                placeholderTextColor="#a1a1aa"
                value={phone}
                onChangeText={(t) => { setPhone(t); setErrors(e => ({ ...e, phone: undefined })); }}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phone && <Text className="ml-1 text-xs font-semibold text-rose-600">{errors.phone}</Text>}
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-bold text-slate-800">ชื่อสมาชิก *</Text>
            <View className={cn('h-12 flex-row items-center gap-2 rounded-2xl border bg-white px-4', errors.name ? 'border-rose-500' : 'border-slate-200')}>
              <Ionicons name="person-outline" size={18} color="#a1a1aa" />
              <TextInput
                className="flex-1 text-sm font-medium text-slate-900"
                placeholder="ชื่อ-นามสกุล"
                placeholderTextColor="#a1a1aa"
                value={name}
                onChangeText={(t) => { setName(t); setErrors(e => ({ ...e, name: undefined })); }}
              />
            </View>
            {errors.name && <Text className="ml-1 text-xs font-semibold text-rose-600">{errors.name}</Text>}
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-bold text-slate-800">วันเกิด</Text>
            <View className="h-12 flex-row items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4">
              <Ionicons name="calendar-outline" size={18} color="#a1a1aa" />
              <TextInput
                className="flex-1 text-sm font-medium text-slate-900"
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#a1a1aa"
                value={birthday}
                onChangeText={setBirthday}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-bold text-slate-800">ระดับสมาชิก</Text>
            <View className="flex-row gap-2">
              {LEVEL_OPTIONS.map((opt) => {
                const isSelected = level === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    className={cn('flex-1 items-center gap-1 rounded-2xl border-2 py-2.5', isSelected ? 'shadow-sm' : 'border-transparent bg-white')}
                    style={{ borderColor: opt.color, backgroundColor: isSelected ? opt.bgColor : undefined }}
                    onPress={() => setLevel(opt.value)}
                    activeOpacity={0.7}
                  >
                    {isSelected && <Ionicons name="checkmark-circle" size={16} color={opt.color} />}
                    <Text className="text-xs font-bold" style={{ color: opt.color }}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            className="mt-2 flex-row items-center justify-center gap-2 rounded-2xl bg-rose-500 py-3.5 shadow-lg shadow-rose-500/40"
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fafafa" />
            <Text className="text-base font-bold text-white">บันทึกสมาชิก</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertDialog
        visible={showSuccess}
        onClose={() => { setShowSuccess(false); onBack(); }}
        title="สำเร็จ"
        message="เพิ่มสมาชิกเรียบร้อยแล้ว"
        variant="success"
        onConfirm={() => { setShowSuccess(false); onBack(); }}
      />
    </SafeAreaView>
  );
};
