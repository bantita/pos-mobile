import React from 'react';
import { View } from 'react-native';
import { cn } from '@/shared/lib/cn';
import { CouponCode } from '@/features/coupon/domain/coupon';
import { CouponStatusBadge } from '@/features/coupon/presentation/screens/components/CouponStatusBadge';
import { Text } from '@/shared/tw/index';

interface Props {
  item: CouponCode;
  index: number;
}

export const CouponCodeRow: React.FC<Props> = ({ item, index }) => {
  return (
    <View className={cn('flex-row items-center py-2 px-3 gap-2', index % 2 === 0 && 'bg-rose-50')}>
      <Text className={cn('text-base text-slate-950 font-medium w-[120px]')}>{item.code}</Text>
      <Text className={cn('text-xs text-slate-500 w-[80px]')}>{item.expiryDate.split('T')[0]}</Text>
      <Text className={cn('text-xs text-slate-500 w-[80px]')}>{item.usageDate ? item.usageDate.split('T')[0] : '-'}</Text>
      <Text className={cn('text-xs text-slate-500 flex-1')}>{item.billNumber || '-'}</Text>
      <CouponStatusBadge status={item.status} />
    </View>
  );
};
