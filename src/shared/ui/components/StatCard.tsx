/**
 * StatCard — Dashboard KPI card
 * Same style, same radius, same shadow everywhere.
 * Added: count-up value animation, press scale, responsive min-width.
 */
import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text, View } from '@/shared/tw/index';
import { Colors } from '@/shared/ui/tokens';
import { useAnimatedNumber } from '@/shared/hooks/useAnimatedValue';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  color?: string;
  style?: ViewStyle;
  onPress?: () => void;
}

export const StatCard: React.FC<Props> = ({ label, value, icon, trend, color, style, onPress }) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  const isNumeric = !Number.isNaN(numericValue);
  const animatedValue = useAnimatedNumber(isNumeric ? numericValue : 0, { duration: 900, delay: 120 });
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.98 : 1, { damping: 20, stiffness: 300 }) }],
  }));

  const displayValue = isNumeric ? Math.round(animatedValue.value).toLocaleString() : value;

  const Wrapper = onPress ? AnimatedPressable : Animated.View;
  const wrapperProps: any = onPress
    ? {
        onPress,
        onPressIn: () => { pressed.value = 1; },
        onPressOut: () => { pressed.value = 0; },
      }
    : {};

  return (
    <Wrapper
      className="min-w-[140px] flex-1 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
      style={[style, animatedStyle]}
      {...wrapperProps}
    >
      <View className="mb-3 flex-row items-center justify-between">
        {icon && <View className="h-10 w-10 items-center justify-center rounded-xl bg-rose-50" style={color ? { backgroundColor: color + '14' } : undefined}>{icon}</View>}
        {trend && (
          <View className="rounded-full px-2 py-1" style={{ backgroundColor: trend.positive ? Colors.successLight : Colors.dangerLight }}>
            <Text className="text-xs font-semibold leading-4" style={{ color: trend.positive ? Colors.success : Colors.danger }}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </Text>
          </View>
        )}
      </View>
      <Text className="mb-1 text-2xl font-extrabold leading-8 text-slate-950" style={color ? { color } : undefined}>
        {displayValue}
      </Text>
      <Text className="text-[13px] leading-5 text-slate-500">{label}</Text>
    </Wrapper>
  );
};
