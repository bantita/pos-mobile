import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, useWindowDimensions, Image, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { Colors, Space, Radius, Shadow, Font } from '../../design-system/tokens';
import { useAuthStore } from '../../store/authStore';
import { canAccess } from '../../constants/rolePermissions';
import { getFeaturesByStoreType } from '../../utils/storeFeatures';
import { getStoreType, getStoreConfig } from '../../store/storeConfigStore';

// ─── Report sub-items ─────────────────────────────────────────────────────────
const REPORT_SUB_ITEMS = [
  { route: 'report_sales_main',       label: 'รายงานการขาย'              },
  { route: 'report_sales_summary',    label: 'สรุปการขาย'                },
  { route: 'report_tax_all',          label: 'ภาษีขายรวมทุกร้าน'         },
  { route: 'report_tax_by_shop',      label: 'ภาษีขายแยกร้านค้า'         },
  { route: 'report_pay_summary',      label: 'สรุปยอดรับจ่ายแยกร้าน'     },
  { route: 'report_sales_by_pos',     label: 'ยอดขายแยกตามเครื่อง'       },
  { route: 'report_sales_by_cashier', label: 'ยอดขายแยกตามผู้ขาย'        },
  { route: 'report_sales_by_product', label: 'ยอดขายแยกตามสินค้า'        },
  { route: 'report_transfer',         label: 'รายการโอนเงิน'             },
  { route: 'report_bill_payment',     label: 'รายการชำระบิล'             },
  { route: 'report_void_sales',       label: 'ยกเลิกการขาย'              },
  { route: 'report_products',         label: 'รายงานสินค้า'              },
  { route: 'report_inventory',        label: 'รายงานคลังสินค้า'          },
  { route: 'report_profit',           label: 'รายงานกำไร'                },
  { route: 'report_enterprise',       label: 'จัดการข้อมูล (Enterprise)' },
];

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

const SIDEBAR_W  = 56;
const EXPANDED_W = 230;

interface Props {
  activeRoute: string;
  onNavigate:  (route: string) => void;
  expanded:    boolean;
  onToggle:    () => void;
}

export const WebSidebar: React.FC<Props> = ({
  activeRoute, onNavigate, expanded, onToggle,
}) => {
  const { width }  = useWindowDimensions();
  const isMobile   = width < 768;
  const showLabel  = !isMobile && expanded;
  const sidebarW   = showLabel ? EXPANDED_W : SIDEBAR_W;

  const [reportsOpen, setReportsOpen] = useState(
    activeRoute === 'reports' || activeRoute.startsWith('report_')
  );

  const { user, logout } = useAuthStore();
  const shopLogo = user?.shopLogo;
  const shopName = user?.shopName ?? '';
  const userName = user?.name     ?? 'ผู้ใช้ทดลอง';

  const isReportActive = activeRoute === 'reports' || activeRoute.startsWith('report_');

  const features = getFeaturesByStoreType(getStoreType());
  const visibleItems = NAV_ITEMS.filter(item => {
    // Admin-only routes
    if ((item as any).adminOnly && user?.role !== 'admin') return false;
    // Feature-gated routes
    if (item.route === 'team' && !features.staffManagement) return false;
    // CRM toggle (super admin controls)
    if (item.route === 'crm' && !getStoreConfig().crmEnabled) return false;
    // Role-based access
    if (user && !canAccess(user.role, item.route === 'reports' ? 'reports' : item.route)) return false;
    return true;
  });

  // ── render nav row ─────────────────────────────────────────────────────────
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
        style={[s.navRow, active && s.navRowActive, showLabel && s.navRowExpanded]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* active bar */}
        {active && <View style={s.activeBar} />}

        {/* icon ห่อด้วย View ที่มี background ชัดเจน ไม่ให้เป็น white */}
        <View style={[s.iconBox, active && s.iconBoxActive]}>
          <Ionicons
            name={iconName}
            size={20}
            color={active ? '#2D1F1C' : WebColors.sidebarIcon}
          />
        </View>

        {showLabel && (
          <Text style={[s.navLabel, active && s.navLabelActive]} numberOfLines={1}>
            {label}
          </Text>
        )}
        {showLabel && rightEl}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.sidebar, { width: sidebarW }, showLabel && s.sidebarExpanded]}>

      {/* ── ชื่อร้านค้าบนสุด ── */}
      <TouchableOpacity
        style={[s.shopHeader, showLabel && s.shopHeaderExpanded]}
        onPress={onToggle}
        activeOpacity={0.85}
      >
        {shopLogo ? (
          <Image
            source={{ uri: shopLogo }}
            style={showLabel ? s.logoImg : s.logoImgSmall}
            resizeMode="contain"
          />
        ) : (
          /* กล่องสีแดง — กำหนด background ชัดเจน ไม่ใช้ transparent */
          <View style={s.shopIconBox}>
            <Ionicons name="storefront-outline" size={20} color="#fff" />
          </View>
        )}
        {showLabel && (
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <Text style={s.shopName} numberOfLines={1}>{shopName}</Text>
            <Text style={s.shopSub}  numberOfLines={1}>{userName}</Text>
          </View>
        )}
        {showLabel && (
          <Ionicons name="chevron-back" size={14} color="rgba(255,255,255,0.5)" />
        )}
      </TouchableOpacity>

      {/* hamburger เฉพาะตอน collapsed */}
      {!showLabel && (
        <TouchableOpacity style={s.hamburger} onPress={onToggle}>
          <Ionicons name="menu-outline" size={22} color={WebColors.sidebarIcon} />
        </TouchableOpacity>
      )}

      <View style={s.divider} />

      {/* ── Nav items ── */}
      <ScrollView style={s.navScroll} showsVerticalScrollIndicator={false}>
        {visibleItems.map(item => {
          const active = activeRoute === item.route || (item.route === 'reports' && isReportActive);

          return renderNavRow(
            item.route, item.icon, item.label, active,
            () => onNavigate(item.route),
          );
        })}
      </ScrollView>

      <View style={s.divider} />

      {/* ── Logout ── */}
      <TouchableOpacity
        style={[s.logoutBtn, showLabel && s.logoutBtnExpanded]}
        onPress={() => logout()}
      >
        <Ionicons name="log-out-outline" size={20} color={WebColors.sidebarIcon} />
        {showLabel && <Text style={s.logoutLabel}>ออกจากระบบ</Text>}
      </TouchableOpacity>

    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  sidebar: {
    backgroundColor: WebColors.sidebar,
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
    ...(Platform.OS === 'web'
      ? { height: '100vh' as any, position: 'sticky' as any, top: 0, overflow: 'hidden' as any }
      : { flex: 1 }),
  },
  sidebarExpanded: { alignItems: 'stretch' },

  // ── Shop header ──────────────────────────────────────────────────────────────
  shopHeader: {
    width: SIDEBAR_W, minHeight: 64,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  shopHeaderExpanded: {
    width: '100%', flexDirection: 'row', gap: 10,
    paddingHorizontal: 14, justifyContent: 'flex-start', alignItems: 'center',
  },
  /* กล่องสีแดงชื่อร้าน — ต้องกำหนด backgroundColor ชัดเจนเสมอ */
  shopIconBox: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: WebColors.primary,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  shopName: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  shopSub:  { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  logoImg:      { width: 130, height: 38 },
  logoImgSmall: { width: 34,  height: 34, borderRadius: 8 },

  // ── Hamburger (collapsed) ────────────────────────────────────────────────────
  hamburger: {
    width: SIDEBAR_W, height: 40,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  // ── Divider ──────────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
    marginVertical: 2,
    flexShrink: 0,
  },

  // ── Nav scroll ───────────────────────────────────────────────────────────────
  navScroll: {
    flex: 1,
    width: '100%',
  },

  // ── Nav row ──────────────────────────────────────────────────────────────────
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    height: 48, width: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  navRowExpanded: {
    justifyContent: 'flex-start',
    paddingHorizontal: 12, gap: 10,
  },
  navRowActive: {},

  activeBar: {
    position: 'absolute', left: 0, top: 8, bottom: 8,
    width: 3, borderRadius: 2,
    backgroundColor: '#fff',
  },

  /* iconBox: กล่องไอคอน — ต้องกำหนด backgroundColor ชัดเจนเสมอ ห้าม transparent */
  iconBox: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: WebColors.sidebar,   // ← same as sidebar bg = no white box
    flexShrink: 0,
  },
  iconBoxActive: {
    backgroundColor: '#FFD6C4',
  },

  navLabel:       { fontSize: 12, color: WebColors.sidebarIcon, fontWeight: '500', flex: 1 },
  navLabelActive: { color: '#2D1F1C', fontWeight: '700' },

  // ── Sub-menu ─────────────────────────────────────────────────────────────────
  subRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: 58, paddingRight: 14, paddingVertical: 9,
    gap: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  subRowActive:  { backgroundColor: 'rgba(229,115,115,0.18)' },
  subDot:        { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', flexShrink: 0 },
  subLabel:      { fontSize: 13, color: 'rgba(255,255,255,0.6)', flex: 1, lineHeight: 17 },
  subLabelActive:{ color: '#fff', fontWeight: '700' },

  // ── Logout ───────────────────────────────────────────────────────────────────
  logoutBtn: {
    height: 48, width: '100%',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8, flexShrink: 0,
  },
  logoutBtnExpanded: {
    flexDirection: 'row', justifyContent: 'flex-start',
    paddingHorizontal: 12, gap: 10,
  },
  logoutLabel: { fontSize: 12, color: WebColors.sidebarIcon },
});
