/**
 * AppLayout — Main layout wrapper
 * Combines AppSidebar + AppHeader + content area.
 * Responsive: sidebar collapses on narrow screens; becomes overlay drawer on mobile.
 */
import React, { useState } from 'react';
import { Pressable, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideOutLeft } from 'react-native-reanimated';
import { ScrollView, View } from '@/shared/tw/index';
import { Breakpoint } from '@/shared/ui/tokens';
import { AppSidebar, NavItem } from '@/shared/ui/components/AppSidebar';
import { AppHeader } from '@/shared/ui/components/AppHeader';

interface Props {
  children: React.ReactNode;
  navItems: NavItem[];
  activeRoute: string;
  onNavigate: (route: string) => void;
  pageName: string;
  shopName?: string;
  shopLogo?: string;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AppLayout: React.FC<Props> = ({
  children, navItems, activeRoute, onNavigate, pageName,
  shopName, shopLogo, userName, userRole, onLogout,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width < Breakpoint.laptop;
  const isMobile = width < Breakpoint.tablet;
  const [collapsed, setCollapsed] = useState(isTablet);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <View className="flex-1 flex-row bg-[#f6f7fb]">
      {/* Mobile overlay drawer */}
      {isMobile && drawerOpen && (
        <AnimatedPressable
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 z-40 bg-black/40"
          onPress={() => setDrawerOpen(false)}
        >
          <Animated.View
            entering={SlideInLeft.duration(260).springify()}
            exiting={SlideOutLeft.duration(220)}
            className="h-full w-[260px]"
          >
            <AppSidebar
              items={navItems}
              activeRoute={activeRoute}
              onNavigate={(route) => {
                onNavigate(route);
                setDrawerOpen(false);
              }}
              collapsed={false}
              onToggle={() => setDrawerOpen(false)}
              shopName={shopName}
              shopLogo={shopLogo}
              userName={userName}
              userRole={userRole}
              onLogout={onLogout}
            />
          </Animated.View>
        </AnimatedPressable>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <AppSidebar
          items={navItems}
          activeRoute={activeRoute}
          onNavigate={onNavigate}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          shopName={shopName}
          shopLogo={shopLogo}
          userName={userName}
          userRole={userRole}
          onLogout={onLogout}
        />
      )}

      {/* Main area */}
      <View className="flex-1">
        <AppHeader
          pageName={pageName}
          userName={userName}
          userRole={userRole}
          onProfile={() => {}}
          onNotification={() => {}}
          onMenuPress={isMobile ? () => setDrawerOpen(true) : undefined}
        />
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-4 pb-12 md:p-6"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
};
