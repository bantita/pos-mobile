/**
 * CouponInput — Scan/enter coupon code at POS checkout
 */
import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { Text, TextInput } from '@/shared/tw/index';

interface Props {
  onSubmit: (code: string) => void;
  onScan?: () => void;
  disabled?: boolean;
  error?: string;
  success?: string;
}

export const CouponInput: React.FC<Props> = ({
  onSubmit,
  onScan,
  disabled,
  error,
  success,
}) => {
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed) {
      onSubmit(trimmed);
      setCode('');
    }
  };

  return (
    <View className={cn('my-2')}>
      <Text className={cn('text-xs font-semibold text-slate-500 mb-1')}>คูปอง</Text>
      <View className={cn('flex-row gap-1')}>
        <TextInput
          className={cn('flex-1 border border-slate-200 rounded-xl px-3 py-2 text-base text-slate-950 bg-white min-h-[44px]', disabled && 'bg-gray-100')}
          value={code}
          onChangeText={setCode}
          placeholder="กรอกหรือสแกนรหัสคูปอง"
          placeholderTextColor="#57534e"
          editable={!disabled}
          onSubmitEditing={handleSubmit}
          autoCapitalize="characters"
          returnKeyType="go"
        />
        {onScan && (
          <TouchableOpacity className={cn('w-11 h-11 rounded-xl items-center justify-center')} style={{ backgroundColor: '#475569' }} onPress={onScan} disabled={disabled}>
            <Ionicons name="barcode-outline" size={22} color="#fafafa" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className={cn('px-3 h-11 rounded-xl bg-rose-500 items-center justify-center', disabled && 'bg-gray-300')}
          onPress={handleSubmit}
          disabled={disabled || !code.trim()}
        >
          <Text className={cn('text-base font-semibold text-white')}>ใช้คูปอง</Text>
        </TouchableOpacity>
      </View>
      {error && (
        <View className={cn('flex-row items-center gap-1 mt-1')}>
          <Ionicons name="alert-circle" size={14} color="#b91c1c" />
          <Text className={cn('text-xs')} style={{ color: '#b91c1c' }}>{error}</Text>
        </View>
      )}
      {success && (
        <View className={cn('flex-row items-center gap-1 mt-1')}>
          <Ionicons name="checkmark-circle" size={14} color="#15803d" />
          <Text className={cn('text-xs')} style={{ color: '#15803d' }}>{success}</Text>
        </View>
      )}
    </View>
  );
};
