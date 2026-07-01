import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius, Spacing, Shadow } from '../../constants/spacing';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const content = loading ? (
    <ActivityIndicator
      color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white}
      size="small"
    />
  ) : (
    <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
      {title}
    </Text>
  );

  // Primary variant uses gradient
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[fullWidth && styles.fullWidth, isDisabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, styles[`size_${size}`], fullWidth && styles.fullWidth, Shadow.glow]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  // Variants (non-primary)
  primary: {}, // handled by gradient
  secondary: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: Colors.danger },

  // Sizes
  size_sm: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.lg, minHeight: 36 },
  size_md: { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.xl, minHeight: 48 },
  size_lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, minHeight: 56 },

  // Text base
  text: { ...Typography.button },

  // Text variants
  text_primary: { color: Colors.white },
  text_secondary: { color: Colors.text },
  text_outline: { color: Colors.primary },
  text_ghost: { color: Colors.primary },
  text_danger: { color: Colors.white },

  // Text sizes
  textSize_sm: { fontSize: 13 },
  textSize_md: { fontSize: 14 },
  textSize_lg: { fontSize: 16 },
});
