import { Sidebar } from '@/features/web/presentation/components/Sidebar';
import { TopBar } from '@/features/web/presentation/components/TopBar';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, TouchableOpacity, useWindowDimensions, View } from 'react-native';

// เส้นทางที่ไม่มี padding (ใช้พื้นที่เต็ม — มี layout/scroll ของตัวเอง)
const NO_PADDING_ROUTES = ['pos', 'reports', 'crm', 'auditlog'];
const MAX_CONTENT_WIDTH = 1680;
// เส้นทางแบบ Kiosk (ซ่อน sidebar + topbar)
const KIOSK_ROUTES = ['pos'];

interface Props {
  activeRoute: string;
  onNavigate: (route: string) => void;
  pageName: string;
  children: React.ReactNode;
}

const PAGE_NAMES: Record<string, string> = {
  dashboard: 'หน้าหลัก', pos: 'ขายสินค้า', products: 'จัดการสินค้า',
  inventory: 'คลังสินค้า', reports: 'รายงาน', users: 'ผู้ใช้งาน',
  auditlog: 'Audit Log', settings: 'ตั้งค่า',
};

export const Layout: React.FC<Props> = ({ activeRoute, onNavigate, pageName, children }) => {
  const { width } = useWindowDimensions();
  const shouldExpandSidebar = width >= 1280;
  const [expanded, setExpanded] = useState(shouldExpandSidebar);
  // routes ที่จัดการ layout เอง (มี sidebar หรือ scroll ของตัวเอง)
  const isReportRoute = activeRoute === 'reports' || activeRoute.startsWith('report_');
  const noPadding  = NO_PADDING_ROUTES.includes(activeRoute) || isReportRoute;
  const isKiosk    = KIOSK_ROUTES.includes(activeRoute);
  const isTouchWeb = Platform.OS === 'web' && typeof window !== 'undefined' && 'ontouchstart' in window;
  const isMobile   = width < 900 || (isTouchWeb && width < 1024);
  const isTablet   = !isMobile && width < 1200;
  const contentPad = isMobile ? 14 : isTablet ? 20 : 28;
  const drawerWidth = Math.min(320, Math.max(280, width * 0.86));

  // ── Kiosk Mode: ซ่อน sidebar และ topbar ───────────────────────────────────
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setExpanded(shouldExpandSidebar);
  }, [shouldExpandSidebar]);

  useEffect(() => {
    if (!isMobile) setMobileMenuOpen(false);
  }, [isMobile]);

  if (isKiosk) {
    return (
      <View className="flex-row bg-[#f6f7fb]" style={Platform.select({ web: { height: '100vh' as any, width: '100vw' as any, overflow: 'hidden' as any }, default: { flex: 1 } })}>
        {children}
      </View>
    );
  }

  // ── Normal Mode ─────────────────────────────────────────────────────────────

  return (
    <View className="flex-row bg-[#f6f7fb]" style={Platform.select({ web: { height: '100vh' as any, width: '100vw' as any, overflow: 'hidden' as any }, default: { flex: 1 } })}>
      {!isMobile && (
        <Sidebar
          activeRoute={activeRoute}
          onNavigate={(r) => {
            onNavigate(r);
          }}
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
        />
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && mobileMenuOpen && (
        <View className="absolute inset-0 z-[999] flex-row">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="ปิดเมนู"
            className="absolute inset-0 bg-black/40"
            onPress={() => setMobileMenuOpen(false)}
            activeOpacity={1}
          />
          <View className="border-r border-slate-200 bg-white shadow-xl" style={{ width: drawerWidth, height: '100%' }}>
            <Sidebar
              activeRoute={activeRoute}
              onNavigate={(r) => {
                onNavigate(r);
                setMobileMenuOpen(false);
              }}
              expanded={true}
              onToggle={() => setMobileMenuOpen(false)}
              drawer
            />
          </View>
        </View>
      )}

      <View className="min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          pageName={pageName || PAGE_NAMES[activeRoute] || ''}
          onMenuPress={isMobile ? () => setMobileMenuOpen(true) : undefined}
        />
        {noPadding ? (
          <View className="flex-1 overflow-hidden bg-[#f6f7fb]">
            {children}
          </View>
        ) : (
          <ScrollView
            className="flex-1 overflow-auto bg-[#f6f7fb]"
            contentContainerStyle={{
              alignSelf: 'center',
              flexGrow: 1,
              minWidth: 0,
              padding: contentPad,
              paddingBottom: contentPad + 12,
              width: '100%',
              maxWidth: MAX_CONTENT_WIDTH,
            }}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        )}
      </View>
    </View>
  );
};
