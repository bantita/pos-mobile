/**
 * AnimatedPressable — Touchable with scale feedback + optional fade-in
 * Improves tactile UX across Web / iOS / Android.
 */
import React from 'react';
import { Pressable as RNPressable, PressableProps, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { cn } from '@/shared/lib/cn';

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

interface Props extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  scale?: number;
  disabledScale?: boolean;
  springConfig?: { damping: number; stiffness: number; mass?: number };
}

export const PressableScale: React.FC<Props> = ({
  children,
  className,
  style,
  scale = 0.97,
  disabledScale = false,
  springConfig = { damping: 18, stiffness: 280, mass: 0.6 },
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}) => {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: disabledScale
      ? []
      : [{ scale: withSpring(pressed.value ? scale : 1, springConfig) }],
    opacity: withTiming(disabled ? 0.55 : 1, { duration: 150, easing: Easing.out(Easing.ease) }),
  }));

  return (
    <AnimatedPressable
      className={cn(className)}
      style={[animatedStyle, style]}
      disabled={disabled}
      onPressIn={(e) => {
        pressed.value = 1;
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = 0;
        onPressOut?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
};
