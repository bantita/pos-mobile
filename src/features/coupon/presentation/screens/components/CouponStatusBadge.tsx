import React from 'react';
import { View } from 'react-native';
import { cn } from '@/shared/lib/cn';
import { CouponStatus } from '@/features/coupon/domain/coupon';
import { Text } from '@/shared/tw/index';

const STATUS_CONFIG: Record<CouponStatus, { label: string; color: string; bgColor: string }> = {
  [CouponStatus.ACTIVE]: { label: 'ใช้ได้', color: '#0f766e', bgColor: '#d1fae5' },
  [CouponStatus.USED]: { label: 'ใช้แล้ว', color: '#57534e', bgColor: '#fee2e2' },
  [CouponStatus.EXPIRED]: { label: 'หมดอายุ', color: '#a16207', bgColor: '#fed7aa' },
  [CouponStatus.CANCELLED]: { label: 'ยกเลิก', color: '#ef4444', bgColor: '#ffe4e6' },
};

interface Props {
  status: CouponStatus;
}

export const CouponStatusBadge: React.FC<Props> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: '#57534e', bgColor: '#fee2e2' };

  return (
    <View className={cn('rounded-lg px-2 py-0.5')} style={{ backgroundColor: cfg.bgColor }}>
      <Text className={cn('text-xs font-bold')} style={{ color: cfg.color }}>{cfg.label}</Text>
    </View>
  );
};
