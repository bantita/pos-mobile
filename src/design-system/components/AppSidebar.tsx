/**
 * AppSidebar — Modern collapsible sidebar
 * Desktop: fixed sidebar | Mobile: drawer
 * Uses design tokens for consistent styling.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Space, Radius, Font, Shadow } from '../tokens';

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

export const AppSidebar: React.FC<Props> = ({
  items, activeRoute, onNavigate, collapsed, onToggle,
  shopName, shopLogo, userName, userRole, onLogout,
}) => {
  const width = collapsed ? COLLAPSED_W : EXPANDED_W;

  return (
    <View style={[s.container, { width }]}>
      {/* Brand */}
      <View style={s.brand}>
        {shopLogo ? (
          <Image source={{ uri: shopLogo }} style={s.logo} />
        ) : (
          <View style={s.logoPlaceholder}>
            <Text style={s.logoText}>X</Text>
          </View>
        )}
        {!collapsed && (
          <View style={s.brandInfo}>
            <Text style={s.shopName} numberOfLines={1}>{shopName || 'Xcellence ERP'}</Text>
            <Text style={s.shopSub}>POS</Text>
          </View>
        )}
      </View>

      {/* Toggle */}
      <TouchableOpacity style={s.toggleBtn} onPress={onToggle}>
        <Ionicons name={collapsed ? 'chevron-forward' : 'chevron-back'} size={16} color={Colors.sidebarText} />
      </TouchableOpacity>

      {/* Navigation */}
      <ScrollView style={s.nav} showsVerticalScrollIndicator={false}>
        {items.map(item => {
          const active = activeRoute === item.route;
          return (
            <TouchableOpacity
              key={item.route}
              style={[s.navItem, active && s.navItemActive, collapsed && s.navItemCollapsed]}
              onPress={() => onNavigate(item.route)}
              activeOpacity={0.7}
            >
              {active && <View style={s.activeBar} />}
              <Ionicons
                name={(active ? item.icon.replace('-outline', '') : item.icon) as any}
                size={20}
                color={active ? Colors.sidebarTextActive : Colors.sidebarText}
              />
              {!collapsed && (
                <Text style={[s.navLabel, active && s.navLabelActive]} numberOfLines={1}>
                  {item.label}
                </Text>
              )}
              {item.badge && item.badge > 0 && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{item.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* User */}
      <View style={s.userSection}>
        {!collapsed ? (
          <View style={s.userRow}>
            <View style={s.avatar}>
              <Ionicons name="person" size={14} color={Colors.sidebarText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.userName} numberOfLines={1}>{userName || 'User'}</Text>
              <Text style={s.userRole}>{userRole || ''}</Text>
            </View>
            {onLogout && (
              <TouchableOpacity onPress={onLogout} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="log-out-outline" size={18} color={Colors.sidebarText} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity style={s.avatarCollapsed} onPress={onLogout}>
            <Ionicons name="person" size={16} color={Colors.sidebarText} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    backgroundColor: Colors.sidebar,
    height: '100%',
    paddingTop: Space.xl,
    paddingBottom: Space.lg,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.lg,
    marginBottom: Space.xl,
    gap: Space.md,
  },
  logo: { width: 32, height: 32, borderRadius: Radius.sm },
  logoPlaceholder: {
    width: 32, height: 32, borderRadius: Radius.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 15, fontWeight: '800', color: Colors.white },
  brandInfo: { flex: 1 },
  shopName: { ...Font.label, color: Colors.sidebarTextActive },
  shopSub: { fontSize: 10, color: Colors.sidebarText },

  toggleBtn: {
    alignSelf: 'flex-end',
    marginRight: Space.md,
    marginBottom: Space.md,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.sidebarHover,
    alignItems: 'center', justifyContent: 'center',
  },

  nav: { flex: 1, paddingHorizontal: Space.sm },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    paddingVertical: Space.md,
    paddingHorizontal: Space.md,
    borderRadius: Radius.md,
    marginBottom: 2,
    position: 'relative',
  },
  navItemActive: { backgroundColor: Colors.sidebarHover },
  navItemCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  activeBar: {
    position: 'absolute',
    left: 0, top: 8, bottom: 8,
    width: 3, borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  navLabel: { ...Font.bodySm, color: Colors.sidebarText, flex: 1 },
  navLabelActive: { color: Colors.sidebarTextActive, fontWeight: '600' },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 9, fontWeight: '700', color: Colors.white },

  userSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.sidebarHover,
    paddingTop: Space.md,
    paddingHorizontal: Space.lg,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.sidebarHover,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarCollapsed: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.sidebarHover,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
  },
  userName: { ...Font.bodySm, color: Colors.sidebarTextActive },
  userRole: { fontSize: 10, color: Colors.sidebarText },
});
