import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import React from 'react';
import { Image, Platform, ScrollView, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { canAccess } from '@/features/settings/domain/rolePermissions';
import { useAuthStore } from '@/features/auth/application/stores/authStore';
import { getStoreConfig, getStoreType } from '@/features/settings/application/stores/storeConfigStore';
import { getFeaturesByStoreType } from '@/shared/lib/storeFeatures';
import { Text } from '@/shared/tw/index';

const NAV_ITEMS = [
  { route: 'dashboard',   icon: 'home-outline',           label: 'หน้าหลัก'  },
  { route: 'pos',         icon: 'cart-outline',            label: 'ขายสินค้า' },
  { route: 'salehistory', icon: 'receipt-outline',         label: 'ประวัติขาย' },
  { route: 'products',    icon: 'cube-outline',            label: 'สินค้า'    },
  { route: 'pricing',     icon: 'cash-outline',            label: 'กำหนดราคา' },
  { route: 'reports',     icon: 'bar-chart-outline',       label: 'รายงาน' },
  { route: 'crm',         icon: 'people-circle-outline',   label: 'CRM' },
  { route: 'promotions',  icon: 'pricetag-outline',        label: 'โปรโมชั่น' },
  { route: 'team',        icon: 'people-outline',          label: 'จัดการทีม' },
  { route: 'auditlog',    icon: 'document-text-outline',   label: 'Audit Log' },
  { route: 'settings',    icon: 'settings-outline',        label: 'ตั้งค่า'   },
  { route: 'superadmin',  icon: 'shield-checkmark-outline', label: 'Super Admin', adminOnly: true },
];

const SIDEBAR_W  = 68;
const EXPANDED_W = 252;

interface Props {
  activeRoute: string;
  onNavigate:  (route: string) => void;
  expanded:    boolean;
  onToggle:    () => void;
  drawer?:     boolean;
}

export const Sidebar: React.FC<Props> = ({
  activeRoute, onNavigate, expanded, onToggle, drawer = false,
}) => {
  const { width }  = useWindowDimensions();
  const isMobile   = width < 768;
  const showLabel  = drawer || (!isMobile && expanded);
  const sidebarW   = drawer ? '100%' : showLabel ? EXPANDED_W : SIDEBAR_W;

  const { user, logout } = useAuthStore();
  const shopLogo = user?.shopLogo;
  const shopName = user?.shopName ?? '';
  const userName = user?.name     ?? 'ผู้ใช้ทดลอง';

  const isReportActive = activeRoute === 'reports' || activeRoute.startsWith('report_');

  const features = getFeaturesByStoreType(getStoreType());
  const visibleItems = NAV_ITEMS.filter(item => {
    if ((item as any).adminOnly && user?.role !== 'admin') return false;
    if (item.route === 'team' && !features.staffManagement) return false;
    if (item.route === 'crm' && !getStoreConfig().crmEnabled) return false;
    if (user && !canAccess(user.role, item.route === 'reports' ? 'reports' : item.route)) return false;
    return true;
  });

  const renderNavRow = (
    route: string,
    icon: string,
    label: string,
    active: boolean,
    onPress: () => void,
    rightEl?: React.ReactNode,
  ) => {
    const iconName = active ? (icon.replace('-outline', '') as any) : (icon as any);
    return (
      <TouchableOpacity
        key={route}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        className={cn(
          'relative mx-2 my-0.5 min-h-11 flex-row items-center justify-center rounded-xl',
          active ? 'bg-rose-50' : 'active:bg-slate-100',
          showLabel && 'justify-start gap-3 px-2.5',
        )}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {active && <View className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-rose-500" />}

        <View className="h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <Ionicons
            name={iconName}
            size={20}
            color={active ? '#e11d48' : '#64748b'}
          />
        </View>

        {showLabel && (
          <Text className={cn('flex-1 text-[13px] font-semibold text-slate-600', active && 'font-extrabold text-rose-700')} numberOfLines={1}>
            {label}
          </Text>
        )}
        {showLabel && rightEl}
      </TouchableOpacity>
    );
  };

  return (
    <View
      className={cn('shrink-0 flex-col items-center border-r border-slate-200/80 bg-white', showLabel && 'items-stretch')}
      style={[
        { width: sidebarW },
        Platform.select({ web: { height: '100vh' as any, position: drawer ? 'relative' as any : 'sticky' as any, top: 0, overflow: 'hidden' as any }, default: { flex: 1 } }),
      ]}
    >
      {/* ── ชื่อร้านค้าบนสุด ── */}
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.85}
        className={cn('shrink-0 border-b border-slate-100 bg-white', showLabel
          ? 'min-h-[68px] w-full flex-row items-center justify-start gap-3 px-4 py-2.5'
          : 'min-h-[68px] w-[68px] items-center justify-center py-2.5'
        )}
      >
        {shopLogo ? (
          <Image
            source={{ uri: shopLogo }}
            className={showLabel ? 'h-9 w-9 rounded-lg' : 'h-9 w-9 rounded-lg'}
            resizeMode="contain"
          />
        ) : (
          <View className="h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950">
            <Ionicons name="storefront-outline" size={20} color="#fafafa" />
          </View>
        )}
        {showLabel && (
          <View className="flex-1 overflow-hidden">
            <Text className="text-sm font-extrabold text-slate-950" numberOfLines={1}>{shopName || 'Xcellence POS'}</Text>
            <Text className="mt-0.5 text-[11px] font-semibold text-slate-500" numberOfLines={1}>{userName}</Text>
          </View>
        )}
        {showLabel && (
          <Ionicons name="chevron-back" size={14} color="#64748b" />
        )}
      </TouchableOpacity>

      {/* hamburger เฉพาะตอน collapsed */}
      {!showLabel && (
        <TouchableOpacity className="h-11 w-[68px] shrink-0 items-center justify-center" onPress={onToggle}>
          <Ionicons name="menu-outline" size={22} color="#475569" />
        </TouchableOpacity>
      )}

      <View className="my-0.5 h-px w-full shrink-0 bg-slate-100" />

      {/* ── Nav items ── */}
      <ScrollView className="w-full flex-1" contentContainerStyle={{ paddingVertical: 10 }} showsVerticalScrollIndicator={false}>
        {visibleItems.map(item => {
          const active = activeRoute === item.route || (item.route === 'reports' && isReportActive);
          return renderNavRow(item.route, item.icon, item.label, active, () => onNavigate(item.route));
        })}
      </ScrollView>

      <View className="my-0.5 h-px w-full shrink-0 bg-slate-100" />

      {/* ── Logout ── */}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="ออกจากระบบ"
        className={cn('mb-2 min-h-14 w-full shrink-0 items-center justify-center active:bg-slate-100', showLabel && 'flex-row justify-start gap-3 px-5')}
        onPress={() => logout()}
      >
        <Ionicons name="log-out-outline" size={24} color="#475569" />
        {showLabel && <Text className="text-sm font-semibold text-slate-600">ออกจากระบบ</Text>}
      </TouchableOpacity>
    </View>
  );
};
