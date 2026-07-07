import React, { useEffect, useState } from 'react';
import { Layout }          from '@/features/web/presentation/components/Layout';
import { LoginScreen }        from '@/features/auth/presentation/screens/LoginScreen';
import { RegisterShopScreen } from '@/features/auth/presentation/screens/RegisterShopScreen';
import { DashboardScreen } from '@/features/web/presentation/screens/DashboardScreen';
import { POSScreen }       from '@/features/web/presentation/screens/POSScreen';
import { SaleHistoryScreen } from '@/features/web/presentation/screens/SaleHistoryScreen';
import { ProductScreen }   from '@/features/web/presentation/screens/ProductScreen';
import { ReportsScreen }   from '@/features/web/presentation/screens/ReportsScreen';
import { SettingsScreen } from '@/features/web/presentation/screens/SettingsScreen';
import { AuditLogScreen } from '@/features/web/presentation/screens/AuditLogScreen';
import { CRMScreen }       from '@/features/web/presentation/screens/CRMScreen';
import { PromotionScreen } from '@/features/web/presentation/screens/PromotionScreen';
import { UserStaffScreen } from '@/features/web/presentation/screens/UserStaffScreen';
import { PricingModuleScreen } from '@/features/web/presentation/screens/PricingModuleScreen';
import { SuperAdminScreen } from '@/features/web/presentation/screens/SuperAdminScreen';
import { useAuthStore }       from '@/features/auth/application/stores/authStore';
import { canAccess }          from '@/features/settings/domain/rolePermissions';

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

// map report_ route → sub-view key ใน ReportsScreen
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

export const Navigator: React.FC = () => {
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
      return <ReportsScreen onNavigate={navigate} initialView={subView as any} />;
    }
    switch (route) {
      case 'dashboard': return <DashboardScreen />;
      case 'pos':       return <POSScreen onExit={() => navigate('dashboard')} />;
      case 'salehistory': return <SaleHistoryScreen />;
      case 'products':  return <ProductScreen />;
      case 'pricing':   return <PricingModuleScreen />;
      case 'crm':       return <CRMScreen />;
      case 'promotions': return <PromotionScreen />;
      case 'team':      return <UserStaffScreen />;
      case 'auditlog':  return <AuditLogScreen />;
      case 'settings':  return <SettingsScreen />;
      case 'superadmin': return <SuperAdminScreen />;
      default:          return <DashboardScreen />;
    }
  };

  return (
    <Layout
      activeRoute={route}
      onNavigate={navigate}
      pageName={PAGE_NAMES[route] ?? ''}
    >
      {renderContent()}
    </Layout>
  );
};
