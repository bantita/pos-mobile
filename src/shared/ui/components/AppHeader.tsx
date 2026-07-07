/**
 * AppHeader — Modern top header bar
 * White, soft shadow, breadcrumb, notifications, user profile.
 * Added: responsive padding, icon press feedback, badge pulse.
 */
import React from 'react';
import { Bell, Menu, User } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from '@/shared/tw/index';
import { cn } from '@/shared/lib/cn';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { Colors } from '@/shared/ui/tokens';

interface Props {
  pageName: string;
  breadcrumb?: string[];
  userName?: string;
  userRole?: string;
  onNotification?: () => void;
  onProfile?: () => void;
  onMenuPress?: () => void;
  notificationCount?: number;
  className?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const AppHeader: React.FC<Props> = ({
  pageName, breadcrumb, userName, userRole, onNotification, onProfile, onMenuPress, notificationCount, className,
}) => {
  const notificationScale = useSharedValue(1);

  React.useEffect(() => {
    if ((notificationCount ?? 0) > 0) {
      notificationScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 180, easing: Easing.out(Easing.cubic) }),
          withSpring(1, { damping: 10, stiffness: 200 })
        ),
        3,
        false
      );
    }
  }, [notificationCount, notificationScale]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: notificationScale.value }],
  }));

  return (
    <View className={cn('min-h-14 flex-row items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:px-6', className)}>
      <View className="flex-row items-center gap-2">
        {onMenuPress && (
          <AnimatedTouchable
            className="mr-1 h-9 w-9 items-center justify-center rounded-full bg-[#f6f7fb] active:bg-slate-100 md:hidden"
            onPress={onMenuPress}
            accessibilityRole="button"
            accessibilityLabel="เปิดเมนู"
          >
            <Menu size={20} color={Colors.textSecondary} />
          </AnimatedTouchable>
        )}
        {/* Left: Breadcrumb + Page name */}
        <View className="flex-1 min-w-0 pr-3">
        {breadcrumb && breadcrumb.length > 0 && (
          <View className="mb-0.5 flex-row items-center gap-1">
            {breadcrumb.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Text className="text-[13px] leading-[18px] text-slate-500">/</Text>}
                <Text className="text-[13px] leading-[18px] text-slate-500" numberOfLines={1}>{item}</Text>
              </React.Fragment>
            ))}
          </View>
        )}
        <Text className="text-[15px] font-semibold leading-[22px] text-slate-950 md:text-base" numberOfLines={1}>{pageName}</Text>
      </View>
      </View>

      {/* Right: Notifications + User */}
      <View className="flex-row items-center gap-2 md:gap-3">
        {onNotification && (
          <AnimatedTouchable
            className="relative h-9 w-9 items-center justify-center rounded-full bg-[#f6f7fb] active:bg-slate-100"
            onPress={onNotification}
            accessibilityRole="button"
            accessibilityLabel="การแจ้งเตือน"
          >
            <Bell size={20} color={Colors.textSecondary} />
            {(notificationCount ?? 0) > 0 && (
              <Animated.View
                className="absolute -right-0.5 -top-0.5 h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-[3px]"
                style={badgeStyle}
              >
                <Text className="text-[9px] font-bold text-white">{notificationCount}</Text>
              </Animated.View>
            )}
          </AnimatedTouchable>
        )}

        {onProfile && (
          <TouchableOpacity
            className="flex-row items-center gap-2"
            onPress={onProfile}
            accessibilityRole="button"
            accessibilityLabel={`โปรไฟล์ ${userName || 'User'}`}
          >
            <View className="h-8 w-8 items-center justify-center rounded-full bg-rose-500">
              <User size={14} color={Colors.white} />
            </View>
            <View className="hidden md:flex">
              <Text className="text-[13px] font-semibold leading-5 text-slate-950" numberOfLines={1}>{userName || 'User'}</Text>
              <Text className="text-[10px] text-slate-500" numberOfLines={1}>{userRole || ''}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
