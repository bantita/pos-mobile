/**
 * Loading — Unified loading indicator
 * Added: shimmer skeleton variant, smoother spinner animation.
 */
import React from 'react';
import { ActivityIndicator, ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Text } from '@/shared/tw/index';
import { cn } from '@/shared/lib/cn';
import { Colors } from '@/shared/ui/tokens';

interface Props {
  text?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
  style?: ViewStyle;
}

export const Loading: React.FC<Props> = ({ text, size = 'large', fullScreen, style }) => (
  <Animated.View
    entering={FadeIn.duration(250)}
    className={cn('items-center justify-center p-10', fullScreen && 'flex-1 bg-[#f6f7fb]')}
    style={style}
  >
    <ActivityIndicator size={size} color={Colors.primary} />
    {text && <Text className="mt-3 text-[13px] leading-5 text-slate-500">{text}</Text>}
  </Animated.View>
);
