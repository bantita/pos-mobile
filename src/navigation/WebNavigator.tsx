import React, { useEffect, useState } from 'react';
import { WebLayout }          from '../components/web/WebLayout';
import { LoginScreen }        from '../screens/auth/LoginScreen';
import { RegisterShopScreen } from '../screens/auth/RegisterShopScreen';
import { WebDashboardScreen } from '../screens/web/WebDashboardScreen';
import { WebPOSScreen }       from '../screens/web/WebPOSScreen';
import { WebSaleHistoryScreen } from '../screens/web/WebSaleHistoryScreen';
import { WebProductScreen }   from '../screens/web/WebProductScreen';
import { WebReportsScreen }   from '../screens/web/WebReportsScreen';
import { WebAuditLogScreen, WebSettingsScreen } from '../screens/web/WebSimpleScreens';
import { WebCRMScreen }       from '../screens/web/WebCRMScreen';
import { WebPromotionScreen } from '../screens/web/WebPromotionScreen';
import { WebUserStaffScreen } from '../screens/web/WebUserStaffScreen';
import { WebPricingModuleScreen } from '../screens/web/WebPricingModuleScreen';
import { WebSuperAdminScreen } from '../screens/web/WebSuperAdminScreen';
import { useAuthStore }       from '../store/authStore';
import { canAccess }          from '../constants/rolePermissions';

// map route → page name ที่แสดงใน TopBar
const PAGE_NAMES: Record<string, string> = {
  dashboard:                  'หน้าหลัก',
  pos:                        'ขายสินค้า',
  salehistory:                'ประวัติขาย',
  products:                   'สินค้า',
  pricing:                    'กำหนดราคา',
  reports:                    'รายงาน',
  crm:                        'CRM',
  promotions:                 'โปรโมชั่น',
  team:                       'จัดการทีม',
  auditlog:                   'Audit Log',
  settings:                   'ตั้งค่า',
  report_sales_main:          'รายงาน › รายงานการขาย',
  report_sales_summary:       'รายงาน › สรุปการขาย',
  report_daily_summary:       'รายงาน › สรุปประจำวัน',
  report_tax_all:             'รายงาน › ภาษีขายรวมทุกร้าน',
  report_tax_by_shop:         'รายงาน › ภาษีขายแยกร้านค้า',
  report_pay_summary:         'รายงาน › สรุปยอดรับจ่ายแยกร้าน',
  report_sales_by_pos:        'รายงาน › ยอดขายแยกตามเครื่อง',
  report_sales_by_cashier:    'รายงาน › ยอดขายแยกตามผู้ขาย',
  report_sales_by_product:    'รายงาน › ยอดขายแยกตามสินค้า',
  report_transfer:            'รายงาน › รายการโอนเงิน',
  report_bill_payment:        'รายงาน › รายการชำระบิล',
  report_void_sales:          'รายงาน › ยกเลิกการขาย',
  report_products:            'รายงาน › รายงานสินค้า',
  report_inventory:           'รายงาน › รายงานคลังสินค้า',
  report_profit:              'รายงาน › รายงานกำไร',
  report_enterprise:          'รายงาน › Enterprise',
};

// map report_ route → sub-view key ใน WebReportsScreen
const REPORT_ROUTE_TO_VIEW: Record<string, string> = {
  report_sales_main:          'sales_main',
  report_sales_summary:       'sales_summary',
  report_daily_summary:       'daily_summary',
  report_tax_all:             'tax_all',
  report_tax_by_shop:         'tax_by_shop',
  report_pay_summary:         'pay_summary',
  report_sales_by_pos:        'sales_by_pos',
  report_sales_by_cashier:    'sales_by_cashier',
  report_sales_by_product:    'sales_by_product',
  report_transfer:            'transfer',
  report_bill_payment:        'bill_payment',
  report_void_sales:          'void_sales',
  report_products:            'products',
  report_inventory:           'inventory',
  report_profit:              'profit',
  report_enterprise:          'enterprise',
};

export const WebNavigator: React.FC = () => {
  const { user } = useAuthStore();
  const [route, setRoute] = useState<string>('welcome');

  useEffect(() => {
    if (!user) setRoute('welcome');
  }, [user]);

  if (!user || route === 'welcome') {
    if (route === 'register') {
      return (
        <RegisterShopScreen
          onRegisterSuccess={() => setRoute('dashboard')}
          onBack={() => setRoute('welcome')}
        />
      );
    }
    return (
      <LoginScreen
        onLogin={async (cred, pass) => {
          const ok = useAuthStore.getState().login(cred, pass);
          if (ok) setRoute('dashboard');
          else throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }}
        onOTPLogin={() => {}}
        onForgotPassword={() => {}}
        onRegister={() => setRoute('register')}
        onBack={() => {}}
      />
    );
  }

  const navigate = (r: string) => {
    // sub-report routes ถือว่า canAccess 'reports'
    const accessKey = r.startsWith('report_') ? 'reports' : r;
    if (canAccess(user.role, accessKey)) {
      setRoute(r);
    } else {
      setRoute('dashboard');
    }
  };

  const isReportRoute = route === 'reports' || route.startsWith('report_');
  if (!isReportRoute && !canAccess(user.role, route)) {
    setTimeout(() => setRoute('dashboard'), 0);
  }

  const renderContent = () => {
    if (isReportRoute) {
      const subView = REPORT_ROUTE_TO_VIEW[route] ?? 'sales_main';
      return <WebReportsScreen onNavigate={navigate} initialView={subView as any} />;
    }
    switch (route) {
      case 'dashboard': return <WebDashboardScreen />;
      case 'pos':       return <WebPOSScreen onExit={() => navigate('dashboard')} />;
      case 'salehistory': return <WebSaleHistoryScreen />;
      case 'products':  return <WebProductScreen />;
      case 'pricing':   return <WebPricingModuleScreen />;
      case 'crm':       return <WebCRMScreen />;
      case 'promotions': return <WebPromotionScreen />;
      case 'team':      return <WebUserStaffScreen />;
      case 'auditlog':  return <WebAuditLogScreen />;
      case 'settings':  return <WebSettingsScreen />;
      case 'superadmin': return <WebSuperAdminScreen />;
      default:          return <WebDashboardScreen />;
    }
  };

  return (
    <WebLayout
      activeRoute={route}
      onNavigate={navigate}
      pageName={PAGE_NAMES[route] ?? ''}
    >
      {renderContent()}
    </WebLayout>
  );
};
