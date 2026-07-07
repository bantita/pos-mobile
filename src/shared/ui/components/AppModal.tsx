/**
 * AppModal — Unified modal component
 * Mobile: bottom sheet with drag handle + slide animation
 * Desktop: centered card with blur backdrop + fade/scale animation
 * Rose theme, consistent with design system
 */
import { ScrollView, Text, TouchableOpacity, View } from '@/shared/tw/index';
import { X } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import Animated, { Easing, FadeIn, FadeInUp, FadeOut, SlideInUp, SlideOutDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/shared/ui/tokens';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  style?: ViewStyle;
  /** Show the drag handle on mobile bottom sheet */
  showHandle?: boolean;
  /** Disable closing when tapping backdrop */
  persistent?: boolean;
}

const SIZE_MAP: Record<ModalSize, number> = {
  sm: 380,
  md: 480,
  lg: 600,
  xl: 720,
  full: 960,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AppModal: React.FC<Props> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  style,
  showHandle = true,
  persistent = false,
}) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 768;
  const viewportGutter = width < 480 ? 12 : 24;
  const panelWidth = Math.min(SIZE_MAP[size], Math.max(280, width - viewportGutter * 2));
  const panelMaxHeight = Math.max(240, height - Math.max(24, viewportGutter * 2));
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 200, easing: Easing.out(Easing.ease) });
  }, [visible, opacity]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleBackdropPress = () => {
    if (!persistent) onClose();
  };

  const handleRequestClose = () => {
    if (!persistent) onClose();
  };

  // ── Desktop: centered card ──
  if (isDesktop) {
    return (
      <Modal visible={visible} transparent animationType="none" onRequestClose={handleRequestClose} statusBarTranslucent>
        <AnimatedPressable
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(180)}
          className="flex-1 items-center justify-center"
          style={[
            { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
            backdropStyle,
          ]}
          onPress={handleBackdropPress}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={{ width: panelWidth, maxHeight: panelMaxHeight }}
          >
            <Animated.View
              entering={FadeInUp.duration(280).springify().damping(18)}
              exiting={FadeOut.duration(180)}
              className="w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
              style={[
                {
                  width: '100%', maxHeight: panelMaxHeight, overflow: 'hidden', borderRadius: 16,
                  borderWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#ffffff',
                  boxShadow: '0 28px 72px rgba(15, 23, 42, 0.24)',
                  borderCurve: 'continuous',
                },
                style,
              ]}
              accessibilityViewIsModal
            >
              {/* Header */}
              {title && (
                <View className="flex-row items-start gap-3 border-b border-slate-100 px-5 pb-4 pt-5 md:px-6">
                  <View className="flex-1 gap-0.5">
                    <Text className="text-base font-bold leading-7 text-slate-900 md:text-lg">{title}</Text>
                    {subtitle && (
                      <Text className="text-sm font-medium leading-5 text-slate-500">{subtitle}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100 active:bg-slate-200"
                    onPress={onClose}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    accessibilityRole="button"
                    accessibilityLabel="ปิด"
                  >
                    <X size={18} color={Colors.textSecondary} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Body */}
              <ScrollView
                className="px-5 py-4 md:px-6 md:py-5"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
              >
                {children}
              </ScrollView>

              {/* Footer */}
              {footer && (
                <View className="border-t border-slate-100 px-5 pb-5 pt-4 md:px-6">
                  {footer}
                </View>
              )}
            </Animated.View>
          </Pressable>
        </AnimatedPressable>
      </Modal>
    );
  }

  // ── Mobile: bottom sheet ──
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleRequestClose} statusBarTranslucent>
      <View className="flex-1 justify-end">
        {/* Backdrop tap */}
        <AnimatedPressable
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(180)}
          className="absolute inset-0"
          style={[StyleSheet.absoluteFill as any, { backgroundColor: 'rgba(0,0,0,0.45)' }, backdropStyle]}
          onPress={handleBackdropPress}
        />

        {/* Sheet */}
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{ maxHeight: Math.max(240, height - Math.max(16, insets.top + 12)) }}
        >
          <Animated.View
            entering={SlideInUp.duration(320).springify().damping(18)}
            exiting={SlideOutDown.duration(260).easing(Easing.in(Easing.cubic))}
            className="overflow-hidden rounded-t-3xl border-t border-slate-100 bg-white"
            style={[
              {
                width: '100%', maxHeight: Math.max(240, height - Math.max(16, insets.top + 12)),
                overflow: 'hidden', borderTopLeftRadius: 24, borderTopRightRadius: 24,
                borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#ffffff',
              },
              style,
            ]}
            accessibilityViewIsModal
          >
            {/* Drag Handle */}
            {showHandle && (
              <View className="items-center pb-1 pt-3">
                <View className="h-1 w-10 rounded-full bg-slate-200" />
              </View>
            )}

            {/* Header */}
            {title && (
              <View className="flex-row items-start gap-3 border-b border-slate-100 px-5 pb-3 pt-3">
                <View className="flex-1 gap-0.5">
                  <Text className="text-base font-bold leading-6 text-slate-900">{title}</Text>
                  {subtitle && (
                    <Text className="text-sm font-medium leading-5 text-slate-500">{subtitle}</Text>
                  )}
                </View>
                <TouchableOpacity
                  className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100 active:bg-slate-200"
                  onPress={onClose}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel="ปิด"
                >
                  <X size={18} color={Colors.textSecondary} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            )}

            {/* Body */}
            <ScrollView
              className="px-5 py-4"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              {children}
            </ScrollView>

            {/* Footer */}
            {footer && (
              <View
                className="border-t border-slate-100 px-5 pt-4"
                style={{ paddingBottom: Math.max(20, insets.bottom + 12) }}
              >
                {footer}
              </View>
            )}
          </Animated.View>
        </Pressable>
      </View>
    </Modal>
  );
};
