/**
 * AppButton — Unified button component
 * Variants: primary, secondary, outline, danger, ghost
 * Sizes: sm, md, lg
 */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Radius, Space, Font, Shadow } from '../tokens';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
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

export const AppButton: React.FC<Props> = ({
  label, onPress, variant = 'primary', size = 'md',
  disabled, loading, icon, style, fullWidth,
}) => {
  const v = variants[variant];
  const s = sizes[size];

  return (
    <TouchableOpacity
      style={[
        base.btn, v.container, s.container,
        fullWidth && { width: '100%' },
        disabled && base.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.loaderColor} />
      ) : (
        <>
          {icon}
          <Text style={[base.label, v.text, s.text]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const base = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    borderRadius: Radius.md,
    ...Shadow.sm,
  },
  label: { ...Font.button },
  disabled: { opacity: 0.5 },
});

const variants: Record<Variant, { container: ViewStyle; text: TextStyle; loaderColor: string }> = {
  primary: {
    container: { backgroundColor: Colors.primary },
    text: { color: Colors.textOnPrimary },
    loaderColor: Colors.white,
  },
  secondary: {
    container: { backgroundColor: Colors.primaryLight },
    text: { color: Colors.primary },
    loaderColor: Colors.primary,
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.border },
    text: { color: Colors.text },
    loaderColor: Colors.text,
  },
  danger: {
    container: { backgroundColor: Colors.danger },
    text: { color: Colors.white },
    loaderColor: Colors.white,
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: Colors.textSecondary },
    loaderColor: Colors.textSecondary,
  },
};

const sizes: Record<Size, { container: ViewStyle; text: TextStyle }> = {
  sm: { container: { paddingHorizontal: Space.md, paddingVertical: Space.sm, minHeight: 32 }, text: { ...Font.buttonSm } },
  md: { container: { paddingHorizontal: Space.lg, paddingVertical: Space.md, minHeight: 40 }, text: { ...Font.button } },
  lg: { container: { paddingHorizontal: Space.xl, paddingVertical: Space.lg, minHeight: 48 }, text: { ...Font.button, fontSize: 14 } },
};
