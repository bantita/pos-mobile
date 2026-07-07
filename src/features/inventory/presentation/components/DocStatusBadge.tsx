import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { DocStatus } from '@/features/inventory/domain/stockDocument';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';

const CONFIG: Record<DocStatus, { label: string; color: string; bg: string; icon: string }> = {
  draft:     { label: 'แบบร่าง',    color: '#6b7280', bg: '#f5f5f5',      icon: 'document-outline' },
  confirmed: { label: 'ยืนยันแล้ว',  color: '#0f766e', bg: '#d1fae5',      icon: 'checkmark-circle-outline' },
  cancelled: { label: 'ยกเลิก',     color: '#ef4444',  bg: '#ffe4e6',      icon: 'close-circle-outline' },
  revised:   { label: 'Revised',    color: '#f87171', bg: '#fee2e2',      icon: 'refresh-circle-outline' },
};

export const DocStatusBadge: React.FC<{ status: DocStatus; size?: 'sm' | 'md' }> = ({
  status, size = 'md',
}) => {
  const c = CONFIG[status];
  return (
    <View className={cn('flex-row items-center gap-1 rounded-full px-2 py-[3px]', size === 'sm' && 'px-[5px] py-[2px]')} style={{ backgroundColor: c.bg }}>
      <Ionicons name={c.icon as any} size={size === 'sm' ? 11 : 13} color={c.color} />
      <Text className={cn('text-xs font-bold', size === 'sm' && 'text-[10px]')} style={{ color: c.color }}>{c.label}</Text>
    </View>
  );
};
