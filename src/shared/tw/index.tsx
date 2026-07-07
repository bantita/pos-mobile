import { mapStyleToSarabun } from '@/shared/lib/font';
import { cssInterop, remapProps, useUnstableNativeVariable } from 'nativewind';
import { Colors } from '@/shared/ui/tokens';
import React from 'react';
import {
  ActivityIndicator as RNActivityIndicator,
  FlatList as RNFlatList,
  Image as RNImage,
  ImageBackground as RNImageBackground,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Platform,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  StatusBar as RNStatusBar,
  Switch as RNSwitch,
  Text as RNText,
  TextInput as RNTextInput,
  TouchableHighlight as RNTouchableHighlight,
  TouchableOpacity as RNTouchableOpacity,
  TouchableWithoutFeedback as RNTouchableWithoutFeedback,
  View as RNView,
  VirtualizedList as RNVirtualizedList,
  TextInputProps,
  TextProps,
} from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

export {
  colorScheme,
  createInteropElement,
  cssInterop,
  rem,
  remapProps, StyleSheet, useColorScheme,
  useSafeAreaEnv,
  useUnstableNativeVariable,
  vars
} from 'nativewind';

type ClassNameProp = { className?: string };

function fontWeightFromClassName(className?: string) {
  if (!className) return undefined;
  if (/\bfont-(?:black|extrabold)\b/.test(className)) return '800';
  if (/\bfont-bold\b/.test(className)) return '700';
  if (/\bfont-semibold\b/.test(className)) return '600';
  if (/\bfont-medium\b/.test(className)) return '500';
  if (/\bfont-(?:normal|regular)\b/.test(className)) return '400';
  return undefined;
}

const StyledText = cssInterop(RNText, { className: 'style' });
const StyledTextInput = cssInterop(RNTextInput, {
  className: { target: 'style', nativeStyleToProp: { textAlign: true } },
});

// NativeWind resolves className inside StyledText, so infer weight before that
// boundary and provide the matching Expo font alias as an explicit style.
export const Text = React.forwardRef<RNText, TextProps & ClassNameProp>(function Text(
  { style, className, ...props },
  ref,
) {
  const classWeight = fontWeightFromClassName(className);
  const mappedStyle = mapStyleToSarabun([
    classWeight ? { fontWeight: classWeight } : undefined,
    style as any,
  ] as any);
  return React.createElement(StyledText as any, {
    ...props,
    ref,
    className,
    style: [Platform.OS === 'web' ? { fontFamily: 'Sarabun' } : undefined, mappedStyle],
  });
});

export const TextInput = React.forwardRef<RNTextInput, TextInputProps & ClassNameProp>(function TextInput(
  { style, className, ...props },
  ref,
) {
  const classWeight = fontWeightFromClassName(className);
  const mappedStyle = mapStyleToSarabun([
    classWeight ? { fontWeight: classWeight } : undefined,
    style as any,
  ] as any);
  return React.createElement(StyledTextInput as any, {
    ...props,
    ref,
    className,
    style: [Platform.OS === 'web' ? { fontFamily: 'Sarabun' } : undefined, mappedStyle],
  });
});

export const ActivityIndicator = cssInterop(RNActivityIndicator, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});
export const Image = cssInterop(RNImage, { className: 'style' });
export const Pressable = cssInterop(RNPressable, { className: 'style' });
export const SafeAreaView = cssInterop(RNSafeAreaView, { className: 'style' });
export const ScrollView = cssInterop(RNScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});
export const StatusBar = cssInterop(RNStatusBar, {
  className: { target: false, nativeStyleToProp: { backgroundColor: true } },
});
const ThemedSwitch = React.forwardRef<any, any>((props, ref) => (
  <RNSwitch
    ref={ref}
    {...props}
    trackColor={{ true: Colors.primary, false: Colors.border }}
    thumbColor={Colors.white}
  />
));
ThemedSwitch.displayName = 'ThemedSwitch';

export const Switch = cssInterop(ThemedSwitch, { className: 'style' });
export const TouchableHighlight = cssInterop(RNTouchableHighlight, { className: 'style' });
export const TouchableOpacity = cssInterop(RNTouchableOpacity, { className: 'style' });
export const TouchableWithoutFeedback = cssInterop(RNTouchableWithoutFeedback, {
  className: 'style',
});
export const View = cssInterop(RNView, { className: 'style' });

export const FlatList = remapProps(RNFlatList as unknown as React.ComponentType<any>, {
  className: 'style',
  ListFooterComponentClassName: 'ListFooterComponentStyle',
  ListHeaderComponentClassName: 'ListHeaderComponentStyle',
  columnWrapperClassName: 'columnWrapperStyle',
  contentContainerClassName: 'contentContainerStyle',
});
export const ImageBackground = remapProps(RNImageBackground, {
  className: 'style',
  imageClassName: 'imageStyle',
});
export const KeyboardAvoidingView = remapProps(RNKeyboardAvoidingView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});
export const VirtualizedList = remapProps(RNVirtualizedList, {
  className: 'style',
  ListFooterComponentClassName: 'ListFooterComponentStyle',
  ListHeaderComponentClassName: 'ListHeaderComponentStyle',
  contentContainerClassName: 'contentContainerStyle',
});

export const useCSSVariable = useUnstableNativeVariable;
