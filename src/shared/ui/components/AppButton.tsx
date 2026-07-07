/**
 * AppButton — Unified button component
 *
 * Variants by function:
 *   primary  (rose gradient) → add, create, save, main CTA
 *   success  (emerald g.)    → pay, complete, confirm
 *   danger   (red g.)        → delete, cancel destructive
 *   warning  (amber g.)      → caution, approval needed
 *   info     (violet g.)     → details, edit, info
 *   secondary (rose-50 bg)   → light secondary action
 *   outline   (border only)  → back, cancel form
 *   ghost     (transparent)  → minimal inline action
 */
import React from 'react';
import { ActivityIndicator, Pressable, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, Easing } from 'react-native-reanimated';
import { Text } from '@/shared/tw/index';
import { cn } from '@/shared/lib/cn';
import { Colors, Radius, Shadow } from '@/shared/ui/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const GradientWrap: React.FC<{ colors: [string, string]; children: React.ReactNode; radius: number }> = ({ colors, children, radius }) => (
  <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: radius, flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
    {children}
  </LinearGradient>
);

export const AppButton: React.FC<Props> = ({
  label, onPress, variant = 'primary', size = 'md',
  disabled, loading, icon, style, fullWidth,
}) => {
  const v = variants[variant];
  const s = sizes[size];
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.97 : 1, { damping: 16, stiffness: 300 }) }],
    opacity: withTiming(disabled || loading ? 0.5 : 1, { duration: 150, easing: Easing.out(Easing.ease) }),
  }));

  const content = loading ? (
    <ActivityIndicator size="small" color={v.loaderColor} />
  ) : (
    <>
      {icon}
      <Text className={cn('font-bold tracking-wide', v.text, s.text)}>{label}</Text>
    </>
  );

  return (
    <AnimatedPressable
      className={cn('flex-row', fullWidth && 'w-full')}
      style={[
        animatedStyle,
        { borderRadius: Radius.xl },
        v.shadow,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      android_ripple={{ color: v.ripple, foreground: true, borderless: false }}
    >
      {v.gradient ? (
        <GradientWrap colors={v.gradient} radius={Radius.xl}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...s.padding }}>
            {content}
          </View>
        </GradientWrap>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: Radius.xl, ...v.containerStyle, ...s.padding }}>
          {content}
        </View>
      )}
    </AnimatedPressable>
  );
};

const variants: Record<Variant, {
  containerStyle?: ViewStyle;
  gradient?: [string, string];
  text: string;
  loaderColor: string;
  ripple: string;
  shadow?: ViewStyle;
}> = {
  primary: {
    gradient: [Colors.primaryHover, Colors.primaryDarker],
    text: 'text-white',
    loaderColor: Colors.white,
    ripple: 'rgba(255,255,255,0.3)',
    shadow: Shadow.glow,
  },
  success: {
    gradient: ['#34d399', '#059669'],
    text: 'text-white',
    loaderColor: Colors.white,
    ripple: 'rgba(255,255,255,0.3)',
    shadow: { ...Shadow.md, shadowColor: '#059669' },
  },
  danger: {
    gradient: [Colors.danger, '#dc2626'],
    text: 'text-white',
    loaderColor: Colors.white,
    ripple: 'rgba(255,255,255,0.3)',
    shadow: { ...Shadow.md, shadowColor: '#dc2626' },
  },
  warning: {
    gradient: ['#fbbf24', '#d97706'],
    text: 'text-white',
    loaderColor: Colors.white,
    ripple: 'rgba(255,255,255,0.3)',
    shadow: { ...Shadow.md, shadowColor: '#d97706' },
  },
  info: {
    gradient: ['#a78bfa', '#7c3aed'],
    text: 'text-white',
    loaderColor: Colors.white,
    ripple: 'rgba(255,255,255,0.3)',
    shadow: { ...Shadow.md, shadowColor: '#7c3aed' },
  },
  secondary: {
    containerStyle: { backgroundColor: Colors.primaryLight },
    text: 'text-rose-600',
    loaderColor: Colors.primary,
    ripple: 'rgba(225,29,72,0.12)',
    shadow: Shadow.sm,
  },
  outline: {
    containerStyle: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.border },
    text: 'text-slate-950',
    loaderColor: Colors.text,
    ripple: 'rgba(15,23,42,0.06)',
    shadow: undefined,
  },
  ghost: {
    containerStyle: { backgroundColor: 'transparent' },
    text: 'text-slate-500',
    loaderColor: Colors.textSecondary,
    ripple: 'rgba(15,23,42,0.06)',
    shadow: undefined,
  },
};

const sizes: Record<Size, { padding: ViewStyle; text: string }> = {
  sm: { padding: { paddingHorizontal: 14, paddingVertical: 8, minHeight: 36 }, text: 'text-[13px]' },
  md: { padding: { paddingHorizontal: 20, paddingVertical: 12, minHeight: 44 }, text: 'text-[15px]' },
  lg: { padding: { paddingHorizontal: 24, paddingVertical: 14, minHeight: 52 }, text: 'text-base' },
};
