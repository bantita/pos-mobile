import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView } from '@/shared/tw/index';
import { Platform } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { useMemberStore } from '@/features/member/application/stores/memberStore';
import { Member } from '@/features/member/domain/member';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';

interface Props {
  member: Member;
  onBack: () => void;
}

export const RedeemScreen: React.FC<Props> = ({ member, onBack }) => {
  const { redeemPoints, pointConfig } = useMemberStore();
  const [pointsInput, setPointsInput] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const points = parseInt(pointsInput, 10) || 0;
  const discount = points * pointConfig.redeemRate;

  const isValid = points >= pointConfig.minRedeemPoints && points <= member.pointBalance;
  const validationMsg = !pointsInput
    ? ''
    : points < pointConfig.minRedeemPoints
      ? `ขั้นต่ำ ${pointConfig.minRedeemPoints} คะแนน`
      : points > member.pointBalance
        ? 'คะแนนไม่เพียงพอ'
        : '';

  const handleRedeem = () => {
    if (!isValid) return;
    setShowConfirm(true);
  };

  const doRedeem = () => {
    setShowConfirm(false);
    try {
      redeemPoints(member.id, points, 'REDEEM-MANUAL', 'พนักงาน');
      setShowSuccess(true);
    } catch (e: any) {
      setErrorMsg(e.message || 'ไม่สามารถใช้คะแนนได้');
      setShowError(true);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f6f7fb]" edges={['top']}>
      <View className="flex-row items-center gap-3 bg-rose-600 px-4 pb-4 pt-4">
        <TouchableOpacity onPress={onBack} className="rounded-full bg-white/20 p-1.5">
          <Ionicons name="arrow-back" size={22} color="#fafafa" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-extrabold text-white">ใช้คะแนน</Text>
          <Text className="text-xs font-medium text-white/70">แลกคะแนนเป็นส่วนลด</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 gap-5 p-4">
          <View className="rounded-2xl bg-white p-4 shadow-sm">
            <View className="flex-row items-center gap-3">
              <Ionicons name="person-circle" size={44} color="#f43f5e" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900">{member.name}</Text>
                <Text className="text-xs font-medium text-slate-500">{member.phone}</Text>
              </View>
              <View className="items-center gap-0.5">
                <Ionicons name="star" size={18} color="#e11d48" />
                <Text className="text-xl font-extrabold text-slate-900">{member.pointBalance.toLocaleString()}</Text>
                <Text className="text-xs font-semibold text-slate-500">คะแนนคงเหลือ</Text>
              </View>
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-bold text-slate-800">จำนวนคะแนนที่ต้องการใช้</Text>
            <View className={cn('h-12 flex-row items-center gap-2 rounded-2xl border bg-white px-4', validationMsg ? 'border-rose-500' : 'border-slate-200')}>
              <Ionicons name="star-outline" size={18} color="#a1a1aa" />
              <TextInput
                className="flex-1 text-sm font-medium text-slate-900"
                placeholder={`ขั้นต่ำ ${pointConfig.minRedeemPoints} คะแนน`}
                placeholderTextColor="#a1a1aa"
                value={pointsInput}
                onChangeText={setPointsInput}
                keyboardType="numeric"
              />
            </View>
            {validationMsg !== '' && <Text className="ml-1 text-xs font-semibold text-rose-600">{validationMsg}</Text>}
          </View>

          {points > 0 && (
            <View className="flex-row items-center gap-3 rounded-2xl border border-emerald-600 bg-emerald-50 p-4">
              <Ionicons name="pricetag" size={28} color="#059669" />
              <View className="flex-1">
                <Text className="text-xs font-semibold text-slate-500">ส่วนลดที่จะได้รับ</Text>
                <Text className="text-2xl font-extrabold text-emerald-700">฿{discount.toLocaleString()}</Text>
              </View>
              <Text className="text-xs font-semibold text-slate-500">({pointConfig.redeemRate} บาท/คะแนน)</Text>
            </View>
          )}

          <TouchableOpacity
            className={cn('flex-row items-center justify-center gap-2 rounded-2xl py-3.5 shadow-lg', isValid ? 'bg-rose-500 shadow-rose-500/40' : 'bg-slate-300')}
            onPress={handleRedeem}
            activeOpacity={0.85}
            disabled={!isValid}
          >
            <Ionicons name="gift" size={20} color="#fafafa" />
            <Text className="text-base font-bold text-white">ใช้คะแนน</Text>
          </TouchableOpacity>

          <View className="flex-row items-start gap-2 rounded-2xl bg-violet-50 p-3">
            <Ionicons name="information-circle-outline" size={18} color="#7c3aed" />
            <Text className="flex-1 text-xs font-medium text-slate-600 leading-5">
              อัตราแลกคะแนน: 1 คะแนน = {pointConfig.redeemRate} บาท{'\n'}
              ใช้ขั้นต่ำ: {pointConfig.minRedeemPoints} คะแนน
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="ยืนยันใช้คะแนน"
        message={`ใช้ ${points.toLocaleString()} คะแนน เป็นส่วนลด ${discount.toLocaleString()} บาท?`}
        confirmLabel="ยืนยัน"
        cancelLabel="ยกเลิก"
        onConfirm={doRedeem}
        onCancel={() => setShowConfirm(false)}
        variant="info"
      />

      <AlertDialog
        visible={showSuccess}
        onClose={() => { setShowSuccess(false); onBack(); }}
        title="สำเร็จ"
        message={`ใช้คะแนนเรียบร้อย\nส่วนลด ${discount.toLocaleString()} บาท`}
        variant="success"
        onConfirm={() => { setShowSuccess(false); onBack(); }}
      />

      <AlertDialog
        visible={showError}
        onClose={() => setShowError(false)}
        title="ผิดพลาด"
        message={errorMsg}
        variant="danger"
        onConfirm={() => setShowError(false)}
      />
    </SafeAreaView>
  );
};
