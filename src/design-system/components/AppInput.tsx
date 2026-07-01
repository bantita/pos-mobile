/**
 * AppInput — Unified input component
 * Features: Floating label, focus ring, rounded, consistent height
 */
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, Animated, ViewStyle } from 'react-native';
import { Colors, Radius, Space, Font, Shadow } from '../tokens';

interface Props extends Omit<TextInputProps, 'style'> {
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
  const hasValue = !!(value && value.length > 0);

  const handleFocus = (e: any) => { setFocused(true); onFocus?.(e); };
  const handleBlur = (e: any) => { setFocused(false); onBlur?.(e); };

  return (
    <View style={[s.wrapper, containerStyle]}>
      <View style={[
        s.container,
        focused ? s.containerFocused : undefined,
        error ? s.containerError : undefined,
      ] as any}>
        {icon && <View style={s.iconLeft}>{icon}</View>}
        <View style={s.inputWrap}>
          {label && (
            <Text style={[
              s.label,
              (focused || hasValue) && s.labelFloating,
              focused && { color: Colors.primary },
              error && { color: Colors.danger },
            ]}>
              {label}
            </Text>
          )}
          <TextInput
            style={[s.input, label && (focused || hasValue) && { paddingTop: 14 }]}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholderTextColor={Colors.textMuted}
            {...rest}
          />
        </View>
        {rightIcon && <View style={s.iconRight}>{rightIcon}</View>}
      </View>
      {error && <Text style={s.error}>{error}</Text>}
    </View>
  );
};

const s = StyleSheet.create({
  wrapper: { marginBottom: Space.md },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 48,
    paddingHorizontal: Space.lg,
  },
  containerFocused: {
    borderColor: Colors.primary,
    ...Shadow.sm,
  },
  containerError: { borderColor: Colors.danger },
  iconLeft: { marginRight: Space.sm },
  iconRight: { marginLeft: Space.sm },
  inputWrap: { flex: 1, justifyContent: 'center' },
  label: {
    ...Font.caption,
    color: Colors.textMuted,
    position: 'absolute',
    top: 14,
    left: 0,
  } as any,
  labelFloating: {
    top: 4,
    fontSize: 10,
    fontWeight: '600',
  } as any,
  input: {
    ...Font.body,
    color: Colors.text,
    paddingVertical: Space.sm,
    minHeight: 44,
  } as any,
  error: {
    ...Font.caption,
    color: Colors.danger,
    marginTop: Space.xs,
    marginLeft: Space.xs,
  },
});
