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
import { WebLicenseScreen }   from '../screens/web/WebLicenseScreen';
import { WebDocumentSettingsScreen } from '../screens/web/WebDocumentSettingsScreen';
import { WebBranchManageScreen } from '../screens/web/WebBranchManageScreen';
import { WebSupplierScreen }   from '../screens/web/WebSupplierScreen';
import { WebBrandScreen }       from '../screens/web/WebBrandScreen';
import { WebReceiptDesignerScreen } from '../screens/web/WebReceiptDesignerScreen';
import { useAuthStore }       from '../store/authStore';
import { canAccess }          from '../constants/rolePermissions';
import { useT }               from '../i18n/useT';
import type { UiKey }         from '../i18n/types';

// map route → page name ที่แสดงใน TopBar (เก็บ key — แปลตอน render; [a, b] = breadcrumb 'a › b')
const PAGE_NAMES: Record<string, UiKey | [UiKey, UiKey]> = {
  dashboard:                  'nav.dashboard',
  pos:                        'nav.pos',
  salehistory:                'nav.saleHistory',
  products:                   'nav.products',
  pricing:                    'nav.pricing',
  suppliers:                  'nav.suppliers',
  brands:                     'nav.brands',
  reports:                    'nav.reports',
  crm:                        'nav.crm',
  promotions:                 'nav.promotions',
  team:                       'nav.team',
  auditlog:                   'nav.auditLog',
  settings:                   'nav.settings',
  'receipt-designer':         'nav.receiptDesigner',
  licenses:                   'nav.licenses',
  documents:                  ['nav.settings', 'nav.documents'],
  branches:                   'nav.branches',
  report_sales_main:          ['nav.reports', 'nav.report.salesMain'],
  report_sales_summary:       ['nav.reports', 'nav.report.salesSummary'],
  report_daily_summary:       ['nav.reports', 'nav.report.dailySummary'],
  report_tax_all:             ['nav.reports', 'nav.report.taxAll'],
  report_tax_by_shop:         ['nav.reports', 'nav.report.taxByShop'],
  report_pay_summary:         ['nav.reports', 'nav.report.paySummary'],
  report_sales_by_pos:        ['nav.reports', 'nav.report.salesByPos'],
  report_sales_by_cashier:    ['nav.reports', 'nav.report.salesByCashier'],
  report_sales_by_product:    ['nav.reports', 'nav.report.salesByProduct'],
  report_transfer:            ['nav.reports', 'nav.report.transfer'],
  report_bill_payment:        ['nav.reports', 'nav.report.billPayment'],
  report_void_sales:          ['nav.reports', 'nav.report.voidSales'],
  report_products:            ['nav.reports', 'nav.report.products'],
  report_inventory:           ['nav.reports', 'nav.report.inventory'],
  report_profit:              ['nav.reports', 'nav.report.profit'],
  report_enterprise:          ['nav.reports', 'nav.report.enterpriseShort'],
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
  const t = useT();
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
          else throw new Error(t('auth.errInvalidCredentials'));
        }}
        onOTPLogin={() => {}}
        onForgotPassword={() => {}}
        onRegister={() => setRoute('register')}
        onBack={() => {}}
      />
    );
  }

  const navigate = (r: string) => {
    // sub-report routes ถือว่า canAccess 'reports';
    // licenses/documents/branches ไม่มี key ใน rolePermissions → ใช้สิทธิ์ 'settings'
    const accessKey = r.startsWith('report_')
      ? 'reports'
      : (['documents', 'licenses', 'branches', 'receipt-designer'].includes(r) ? 'settings'
        : (['suppliers', 'brands'].includes(r) ? 'products' : r));
    if (canAccess(user.role, accessKey)) {
      setRoute(r);
    } else {
      setRoute('dashboard');
    }
  };

  const isReportRoute = route === 'reports' || route.startsWith('report_');
  const routeAccessKey = ['documents', 'licenses', 'branches', 'receipt-designer'].includes(route) ? 'settings'
    : (['suppliers', 'brands'].includes(route) ? 'products' : route);
  if (!isReportRoute && !canAccess(user.role, routeAccessKey)) {
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
      case 'licenses':  return <WebLicenseScreen />;
      case 'documents': return <WebDocumentSettingsScreen />;
      case 'branches':  return <WebBranchManageScreen />;
      case 'suppliers': return <WebSupplierScreen />;
      case 'brands':    return <WebBrandScreen />;
      case 'receipt-designer': return <WebReceiptDesignerScreen />;
      case 'superadmin': return <WebSuperAdminScreen />;
      default:          return <WebDashboardScreen />;
    }
  };

  const pageEntry = PAGE_NAMES[route];
  const pageTitle = pageEntry == null
    ? ''
    : Array.isArray(pageEntry)
      ? `${t(pageEntry[0])} › ${t(pageEntry[1])}`
      : t(pageEntry);

  return (
    <WebLayout
      activeRoute={route}
      onNavigate={navigate}
      pageName={pageTitle}
    >
      {renderContent()}
    </WebLayout>
  );
};
