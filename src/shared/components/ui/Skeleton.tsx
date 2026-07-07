/**
 * Skeleton — Shimmer placeholder for loading states
 * Cross-platform: uses Reanimated gradient translation.
 */
import React from 'react';
import { DimensionValue, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from '@/shared/tw/index';
import { cn } from '@/shared/lib/cn';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  className?: string;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  className,
  style,
}) => {
  const translateX = useSharedValue(-200);

  React.useEffect(() => {
    translateX.value = withRepeat(
      withTiming(200, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, [translateX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      className={cn('overflow-hidden bg-slate-200', className)}
      style={[{ width, height, borderRadius }, style]}
    >
      <Animated.View style={[{ flex: 1, width: '100%' }, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.45)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1, width: '100%' }}
        />
      </Animated.View>
    </View>
  );
};

export const SkeletonCard: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className,
}) => (
  <View className={cn('rounded-2xl border border-slate-100 bg-white p-5 shadow-sm', className)}>
    <Skeleton width='60%' height={20} borderRadius={8} className='mb-4' />
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        width={i === lines - 1 ? '75%' : '100%'}
        height={14}
        borderRadius={6}
        className={i > 0 ? 'mt-2.5' : ''}
      />
    ))}
  </View>
);
