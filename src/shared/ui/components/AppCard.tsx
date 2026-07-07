/**
 * AppCard — Unified card container
 * Same radius, same shadow, same border everywhere.
 * Added: press/hover scale + elevation animation, fade-in, responsive padding.
 */
import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text, View } from '@/shared/tw/index';
import { cn } from '@/shared/lib/cn';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
  className?: string;
  onPress?: () => void;
  pressScale?: number;
  entering?: any;
}

export const AppCard: React.FC<Props> = ({
  children, title, subtitle, headerRight, style, noPadding, className,
  onPress, pressScale = 0.99,
}) => {
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? pressScale : 1, { damping: 20, stiffness: 300 }) }],
  }));

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
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white p-4',
        'web:transition-shadow web:duration-200 web:hover:shadow-card-hover',
        noPadding && 'p-0',
        className,
      )}
      style={[{ boxShadow: '0 6px 20px rgba(15, 23, 42, 0.05)', borderCurve: 'continuous' }, style, animatedStyle]}
      {...wrapperProps}
    >
      {(title || headerRight) && (
        <View className={cn('mb-4 flex-row items-center', noPadding && 'px-4 pt-4')}>
          <View className="flex-1">
            {title && <Text className="text-[15px] font-semibold leading-[22px] text-slate-950">{title}</Text>}
            {subtitle && <Text className="mt-0.5 text-[13px] leading-5 text-slate-500">{subtitle}</Text>}
          </View>
          {headerRight}
        </View>
      )}
      {children}
    </Wrapper>
  );
};
