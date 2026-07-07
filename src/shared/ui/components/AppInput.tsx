/**
 * AppInput — Unified input component
 * Features: Floating label, focus ring, rounded, consistent height
 * Added: animated focus border + label transition via useAnimatedStyle.
 */
import React, { useState } from 'react';
import { ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, Easing, interpolateColor } from 'react-native-reanimated';
import { Text, TextInput, View } from '@/shared/tw/index';
import { cn } from '@/shared/lib/cn';
import { Colors } from '@/shared/ui/tokens';

type NativeWindTextInputProps = React.ComponentProps<typeof TextInput>;

interface Props extends Omit<NativeWindTextInputProps, 'style' | 'className'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const AppInput: React.FC<Props> = ({
  label, error, icon, rightIcon, containerStyle, value, onFocus, onBlur, ...rest
}) => {
  const [focused, setFocused] = useState(false);
  const hasValue = !!(value && String(value).length > 0);
  const isActive = focused || hasValue;

  const activeProgress = useSharedValue(isActive ? 1 : 0);

  React.useEffect(() => {
    activeProgress.value = withTiming(isActive ? 1 : 0, { duration: 200, easing: Easing.out(Easing.cubic) });
  }, [isActive, activeProgress]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? Colors.danger
      : interpolateColor(activeProgress.value, [0, 1], [Colors.border, Colors.primary]),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: withSpring(activeProgress.value ? -10 : 0, { damping: 20, stiffness: 300 }) },
      { scale: withSpring(activeProgress.value ? 0.85 : 1, { damping: 20, stiffness: 300 }) },
    ],
    color: error
      ? Colors.danger
      : interpolateColor(activeProgress.value, [0, 1], [Colors.textMuted, Colors.primary]),
  }));

  const handleFocus: NonNullable<NativeWindTextInputProps['onFocus']> = (event) => {
    setFocused(true);
    onFocus?.(event);
  };
  const handleBlur: NonNullable<NativeWindTextInputProps['onBlur']> = (event) => {
    setFocused(false);
    onBlur?.(event);
  };

  return (
    <View className="mb-3" style={containerStyle}>
      <Animated.View
        className={cn(
          'min-h-12 flex-row items-center rounded-xl border bg-white px-4',
          error && 'border-rose-500',
        )}
        style={[{ boxShadow: focused ? '0 0 0 3px rgba(244, 63, 94, 0.10)' : 'none', borderCurve: 'continuous' }, containerAnimatedStyle]}
      >
        {icon && <View className="mr-2">{icon}</View>}
        <View className="flex-1 justify-center">
          {label && (
            <Animated.Text
              className={cn(
                'absolute left-0 top-3.5 text-[13px] leading-[18px]',
              )}
              style={labelStyle}
              numberOfLines={1}
            >
              {label}
            </Animated.Text>
          )}
          <TextInput
            className={cn('min-h-11 py-2 text-[15px] leading-[22px] text-slate-950', label && isActive && 'pt-3.5')}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholderTextColor={Colors.textMuted}
            accessibilityLabel={label}
            accessibilityHint={error}
            {...rest}
          />
        </View>
        {rightIcon && <View className="ml-2">{rightIcon}</View>}
      </Animated.View>
      {error && <Text className="ml-1 mt-1 text-[13px] leading-[18px] text-rose-600">{error}</Text>}
    </View>
  );
};
