import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Platform, useWindowDimensions, TouchableOpacity } from 'react-native';
import { WebSidebar } from './WebSidebar';
import { WebTopBar } from './WebTopBar';
import { WebColors } from '../../constants/webColors';

// เส้นทางที่ไม่มี padding (ใช้พื้นที่เต็ม — report routes ต้องการ flex:1 เต็มจอ)
const NO_PADDING_ROUTES = ['pos', 'reports'];
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

export const WebLayout: React.FC<Props> = ({ activeRoute, onNavigate, pageName, children }) => {
  const [expanded, setExpanded] = useState(false);
  const { width } = useWindowDimensions();
  // report routes ต้องการ flex:1 เต็มจอ (มี sidebar ของตัวเอง)
  const isReportRoute = activeRoute === 'reports' || activeRoute.startsWith('report_');
  const noPadding  = NO_PADDING_ROUTES.includes(activeRoute) || isReportRoute;
  const isKiosk    = KIOSK_ROUTES.includes(activeRoute);
  const isMobile   = width < 900 || (Platform.OS === 'web' && typeof window !== 'undefined' && 'ontouchstart' in window && width < 1024);
  const isTablet   = !isMobile && width < 1200;
  const contentPad = isMobile ? 12 : isTablet ? 16 : 24;

  // ── Fullscreen เมื่อเข้า POS (Kiosk) / ออก fullscreen เมื่อออก ────────────
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (isKiosk) {
      // ถ้าเป็น standalone PWA อยู่แล้ว ไม่ต้อง fullscreen
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      if (isStandalone) return;
      // แสดง confirm → user กด OK = user gesture → fullscreen ได้
      const el = document.documentElement;
      if (!document.fullscreenElement && el.requestFullscreen) {
        setTimeout(() => {
          if (confirm('เปิดโหมดเต็มจอ?')) {
            el.requestFullscreen().catch(() => {});
          }
        }, 300);
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [isKiosk]);

  // ── Kiosk Mode: ซ่อน sidebar และ topbar ───────────────────────────────────
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isKiosk) {
    return (
      <View style={s.root}>
        {children}
      </View>
    );
  }

  // ── Normal Mode ─────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      {!isMobile && (
        <WebSidebar
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
        <View style={s.mobileOverlay}>
          <TouchableOpacity style={s.mobileOverlayBg} onPress={() => setMobileMenuOpen(false)} activeOpacity={1} />
          <View style={s.mobileDrawer}>
            <WebSidebar
              activeRoute={activeRoute}
              onNavigate={(r) => {
                onNavigate(r);
                setMobileMenuOpen(false);
              }}
              expanded={true}
              onToggle={() => setMobileMenuOpen(false)}
            />
          </View>
        </View>
      )}

      <View style={s.main}>
        <WebTopBar
          pageName={pageName || PAGE_NAMES[activeRoute] || ''}
          onMenuPress={isMobile ? () => setMobileMenuOpen(true) : undefined}
        />
        {noPadding ? (
          <View style={s.contentFill}>
            {children}
          </View>
        ) : (
          <ScrollView
            style={s.content}
            contentContainerStyle={[s.contentInner, { padding: contentPad, paddingBottom: contentPad + 8 }]}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    flexDirection: 'row',
    ...(Platform.OS === 'web'
      ? { height: '100vh' as any, width: '100vw' as any, overflow: 'hidden' as any }
      : { flex: 1 }),
    backgroundColor: WebColors.contentBg,
  },
  main: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden' as any,
    minWidth: 0,
  },
  content: {
    flex: 1,
    backgroundColor: WebColors.contentBg,
    overflow: 'auto' as any,
  },
  contentInner: { flexGrow: 1, minWidth: 0 },
  contentFill: {
    flex: 1,
    backgroundColor: WebColors.contentBg,
    overflow: 'hidden' as any,
  },
  mobileOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999, flexDirection: 'row',
  },
  mobileOverlayBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  mobileDrawer: {
    width: 260, height: '100%' as any,
    backgroundColor: WebColors.contentBg,
    ...(Platform.OS === 'web' ? { boxShadow: '4px 0 16px rgba(0,0,0,0.1)' } as any : {}),
  },
});
