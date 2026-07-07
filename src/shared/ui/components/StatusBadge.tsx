/**
 * StatusBadge — Unified status indicator
 * Variants: success, warning, danger, info, neutral, primary
 * Added: optional pulsing dot animation.
 */
import React from 'react';
import { Text, View } from '@/shared/tw/index';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { Colors } from '@/shared/ui/tokens';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface Props {
  label: string;
  variant?: Variant;
  dot?: boolean;
  pulse?: boolean;
}

const variantStyles: Record<Variant, { bg: string; color: string }> = {
  success: { bg: Colors.successLight, color: Colors.success },
  warning: { bg: Colors.warningLight, color: Colors.warning },
  danger:  { bg: Colors.dangerLight,  color: Colors.danger },
  info:    { bg: Colors.infoLight,    color: Colors.info },
  neutral: { bg: '#f1f5f9',           color: '#64748b' },
  primary: { bg: Colors.primaryLight, color: Colors.primary },
};

const AnimatedView = Animated.createAnimatedComponent(View);

export const StatusBadge: React.FC<Props> = ({ label, variant = 'neutral', dot, pulse }) => {
  const v = variantStyles[variant];
  const pulseAnim = useSharedValue(1);

  React.useEffect(() => {
    if (pulse) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.35, { duration: 700, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 700, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseAnim.value = 1;
    }
  }, [pulse, pulseAnim]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
    opacity: withTiming(pulse ? 0.7 : 1, { duration: 200 }),
  }));

  return (
    <View className="self-start flex-row items-center gap-1.5 rounded-full px-2.5 py-1" style={{ backgroundColor: v.bg }}>
      {dot && (
        <AnimatedView
          className="h-1.5 w-1.5 rounded-full"
          style={[{ backgroundColor: v.color }, pulseStyle]}
        />
      )}
      <Text className="text-xs font-semibold leading-4" style={{ color: v.color }}>{label}</Text>
    </View>
  );
};
