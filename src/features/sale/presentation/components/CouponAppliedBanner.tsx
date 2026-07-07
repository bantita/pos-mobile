/**
 * CouponAppliedBanner — Shows applied coupon info at POS checkout
 */
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';

interface Props {
  couponCode: string;
  promotionName: string;
  discountValue: number;
  onRemove: () => void;
}

export const CouponAppliedBanner: React.FC<Props> = ({
  couponCode,
  promotionName,
  discountValue,
  onRemove,
}) => {
  return (
    <View className={cn('flex-row items-center gap-2 rounded-xl p-2 my-1')} style={{ backgroundColor: '#dcfce7' }}>
      <View className={cn('w-8 h-8 rounded-full items-center justify-center')} style={{ backgroundColor: '#bbf7d0' }}>
        <Ionicons name="ticket-outline" size={20} color="#15803d" />
      </View>
      <View className={cn('flex-1')}>
        <Text className={cn('text-base font-semibold')} style={{ color: '#14532d' }}>{promotionName}</Text>
        <Text className={cn('text-xs')} style={{ color: '#15803d' }}>คูปอง: {couponCode}</Text>
      </View>
      <Text className={cn('text-base font-bold')} style={{ color: '#15803d' }}>-฿{discountValue.toFixed(2)}</Text>
      <TouchableOpacity onPress={onRemove} className={cn('p-1')}>
        <Ionicons name="close-circle" size={20} color="#9ca3af" />
      </TouchableOpacity>
    </View>
  );
};
