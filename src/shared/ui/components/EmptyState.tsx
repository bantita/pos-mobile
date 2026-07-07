/**
 * EmptyState — Placeholder for empty lists/pages
 * Added: gentle fade-in animation, responsive max-width.
 */
import React from 'react';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Text, View } from '@/shared/tw/index';

interface Props {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<Props> = ({
  icon, title = 'ไม่มีข้อมูล', description, action,
}) => (
  <Animated.View
    entering={FadeInUp.duration(350).springify()}
    className="items-center justify-center px-6 py-14 md:px-8"
  >
    {icon && <View className="mb-4 opacity-40">{icon}</View>}
    <Text className="mb-1 text-[15px] font-semibold leading-[22px] text-slate-500">{title}</Text>
    {description && <Text className="max-w-[280px] text-center text-[15px] leading-[22px] text-slate-500 opacity-80 md:max-w-sm">{description}</Text>}
    {action && <View className="mt-6">{action}</View>}
  </Animated.View>
);
