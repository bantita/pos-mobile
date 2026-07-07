/**
 * AppSidebar — Modern collapsible sidebar
 * Desktop: fixed sidebar | Mobile: drawer
 * Uses design tokens for consistent styling.
 * Added: animated width transition, active indicator spring, responsive drawer.
 */
import React from 'react';
import { ChevronLeft, ChevronRight, LogOut, User } from 'lucide-react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { Image, ScrollView, Text, TouchableOpacity, View } from '@/shared/tw/index';
import { cn } from '@/shared/lib/cn';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, Easing } from 'react-native-reanimated';
import { Colors } from '@/shared/ui/tokens';

export interface NavItem {
  route: string;
  icon: string;
  label: string;
  badge?: number;
}

interface Props {
  items: NavItem[];
  activeRoute: string;
  onNavigate: (route: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  shopName?: string;
  shopLogo?: string;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

const COLLAPSED_W = 64;
const EXPANDED_W = 240;

const AnimatedView = Animated.createAnimatedComponent(View);

export const AppSidebar: React.FC<Props> = ({
  items, activeRoute, onNavigate, collapsed, onToggle,
  shopName, shopLogo, userName, userRole, onLogout,
}) => {
  const sidebarStyle = useAnimatedStyle(() => ({
    width: withTiming(collapsed ? COLLAPSED_W : EXPANDED_W, { duration: 260, easing: Easing.out(Easing.cubic) }),
  }));

  return (
    <AnimatedView
      className="h-full bg-rose-50 pb-4 pt-6"
      style={sidebarStyle}
    >
      {/* Brand */}
      <View className="mb-6 flex-row items-center gap-3 px-4">
        {shopLogo ? (
          <Image source={{ uri: shopLogo }} className="h-8 w-8 rounded-lg" />
        ) : (
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-rose-500">
            <Text className="text-[15px] font-extrabold text-white">X</Text>
          </View>
        )}
        {!collapsed && (
          <View className="flex-1">
            <Text className="text-[13px] font-semibold leading-[18px] text-slate-950" numberOfLines={1}>{shopName || 'Xcellence ERP'}</Text>
            <Text className="text-[10px] text-slate-500">POS</Text>
          </View>
        )}
      </View>

      {/* Toggle */}
      <TouchableOpacity
        className="mb-3 mr-3 h-7 w-7 self-end items-center justify-center rounded-full bg-rose-100 active:bg-rose-200"
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={collapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
      >
        {collapsed
          ? <ChevronRight size={16} color={Colors.sidebarText} />
          : <ChevronLeft size={16} color={Colors.sidebarText} />}
      </TouchableOpacity>

      {/* Navigation */}
      <ScrollView className="flex-1 px-2" showsVerticalScrollIndicator={false}>
        {items.map(item => {
          const active = activeRoute === item.route;
          return (
            <NavItemRow
              key={item.route}
              item={item}
              active={active}
              collapsed={collapsed}
              onPress={() => onNavigate(item.route)}
            />
          );
        })}
      </ScrollView>

      {/* User */}
      <View className="border-t border-rose-100 px-4 pt-3">
        {!collapsed ? (
          <View className="flex-row items-center gap-2">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-rose-100">
              <User size={14} color={Colors.sidebarText} />
            </View>
            <View className="flex-1">
              <Text className="text-[13px] leading-5 text-slate-950" numberOfLines={1}>{userName || 'User'}</Text>
              <Text className="text-[10px] text-slate-500" numberOfLines={1}>{userRole || ''}</Text>
            </View>
            {onLogout && (
              <TouchableOpacity
                onPress={onLogout}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="ออกจากระบบ"
              >
                <LogOut size={18} color={Colors.sidebarText} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            className="h-8 w-8 self-center items-center justify-center rounded-full bg-rose-100"
            onPress={onLogout}
            accessibilityRole="button"
            accessibilityLabel="ออกจากระบบ"
          >
            <User size={16} color={Colors.sidebarText} />
          </TouchableOpacity>
        )}
      </View>
    </AnimatedView>
  );
};

function NavItemRow({
  item, active, collapsed, onPress,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onPress: () => void;
}) {
  const activeProgress = useSharedValue(active ? 1 : 0);

  React.useEffect(() => {
    activeProgress.value = withSpring(active ? 1 : 0, { damping: 20, stiffness: 260 });
  }, [active, activeProgress]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: activeProgress.value,
    transform: [{ scaleY: activeProgress.value }],
  }));

  return (
    <TouchableOpacity
      className={cn(
        'relative mb-0.5 flex-row items-center gap-3 rounded-xl px-3 py-3 active:bg-rose-100',
        active && 'bg-rose-100',
        collapsed && 'justify-center px-0',
      )}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
    >
      <Animated.View
        className="absolute bottom-2 left-0 top-2 w-[3px] rounded-sm bg-rose-500"
        style={indicatorStyle}
      />
      <Ionicons
        name={(active ? item.icon.replace('-outline', '') : item.icon) as any}
        size={20}
        color={active ? Colors.text : Colors.sidebarText}
      />
      {!collapsed && (
        <Text className={cn('flex-1 text-[13px] leading-5 text-slate-600', active && 'font-semibold text-slate-950')} numberOfLines={1}>
          {item.label}
        </Text>
      )}
      {!collapsed && item.badge && item.badge > 0 && (
        <View className="h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1">
          <Text className="text-[9px] font-bold text-white">{item.badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
