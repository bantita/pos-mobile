import React from 'react';
import { View, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { useAuthStore } from '@/features/auth/application/stores/authStore';
import { ROLE_LABELS } from '@/features/settings/domain/rolePermissions';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';

interface Props {
  pageName: string;
  shopName?: string;
  posName?: string;
  onMenuPress?: () => void;
}

export const TopBar: React.FC<Props> = ({
  pageName,
  posName  = 'POS 1',
  onMenuPress,
}) => {
  const { width } = useWindowDimensions();
  const isSmall = width < 768;

  const user = useAuthStore(s => s.user);

  const userName  = user?.name  ?? 'ผู้ใช้ทดลอง';
  const roleLabel = user?.role  ? ROLE_LABELS[user.role] : '';
  const initial   = userName.charAt(0).toUpperCase();
  return (
    <View className={cn('min-h-[68px] shrink-0 flex-row items-center justify-between border-b border-slate-200/80 bg-white px-7', isSmall && 'min-h-16 px-3')}>
      {isSmall && onMenuPress && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="เปิดเมนู"
          className="mr-2 h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white active:bg-slate-100"
          onPress={onMenuPress}
          activeOpacity={0.85}
        >
          <Ionicons name="menu-outline" size={24} color="#475569" />
        </TouchableOpacity>
      )}
      <View className="min-w-0 flex-1 gap-0.5">
        {!isSmall && <Text className="text-[11px] font-semibold uppercase tracking-[1px] text-slate-400">Xcellence workspace</Text>}
        <Text className={cn('text-base font-extrabold text-slate-950', isSmall && 'text-[15px]')} numberOfLines={1}>
          {pageName}
        </Text>
        {isSmall && roleLabel !== '' && (
          <Text className="mt-0.5 text-[12px] font-semibold text-slate-500" numberOfLines={1}>
            {roleLabel} · {posName}
          </Text>
        )}
      </View>
      <View className="shrink-0 flex-row items-center gap-3">
      {/* ชื่อร้านค้าย้ายไปอยู่ที่ Sidebar แล้ว — ใน topbar แสดงแค่ user + role + pos */}
        {!isSmall && (
          <View className="max-w-[190px] items-end">
            <Text className="text-[13px] font-bold text-slate-800" numberOfLines={1}>{userName}</Text>
            <Text className="text-[11px] font-semibold text-slate-500" numberOfLines={1}>
              {roleLabel}{roleLabel ? ' · ' : ''}{posName}
            </Text>
          </View>
        )}
        <View className="h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950">
          <Text className="text-sm font-extrabold text-white">{initial}</Text>
        </View>
      </View>
    </View>
  );
};
