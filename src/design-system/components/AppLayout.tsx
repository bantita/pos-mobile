/**
 * AppLayout — Main layout wrapper
 * Combines AppSidebar + AppHeader + content area.
 * Responsive: sidebar collapses on narrow screens.
 */
import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions, ScrollView } from 'react-native';
import { Colors, Space, Breakpoint } from '../tokens';
import { AppSidebar, NavItem } from './AppSidebar';
import { AppHeader } from './AppHeader';

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

export const AppLayout: React.FC<Props> = ({
  children, navItems, activeRoute, onNavigate, pageName,
  shopName, shopLogo, userName, userRole, onLogout,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width < Breakpoint.laptop;
  const [collapsed, setCollapsed] = useState(isTablet);

  return (
    <View style={s.root}>
      {/* Sidebar */}
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

      {/* Main area */}
      <View style={s.main}>
        <AppHeader
          pageName={pageName}
          userName={userName}
          userRole={userRole}
          onProfile={() => {}}
          onNotification={() => {}}
        />
        <ScrollView
          style={s.content}
          contentContainerStyle={s.contentInner}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.background,
  },
  main: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: Space.xl,
    paddingBottom: Space['4xl'],
  },
});
