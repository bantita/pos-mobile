/**
 * Reports Navigator — M09
 * Hub → แต่ละ Report มีทั้ง Chart view + Listing + Export
 */
import React from 'react';
import { createStackNavigator } from "expo-router/build/react-navigation/stack";
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { SalesReportListScreen }     from '@/features/reports/presentation/screens/SalesReportListScreen';
import { ProductReportListScreen }   from '@/features/reports/presentation/screens/ProductReportListScreen';
import { InventoryReportListScreen } from '@/features/reports/presentation/screens/InventoryReportListScreen';
import { ProfitReportListScreen }    from '@/features/reports/presentation/screens/ProfitReportListScreen';
import { EnterpriseReportListScreen } from '@/features/reports/presentation/screens/EnterpriseReportListScreen';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';
import { ScreenSurface } from '@/shared/ui/index';

export type ReportsStackParamList = {
  ReportsHub:       undefined;
  SalesReport:      undefined;
  ProductReport:    undefined;
  InventoryReport:  undefined;
  ProfitReport:     undefined;
  EnterpriseReport: undefined;
};

const Stack = createStackNavigator<ReportsStackParamList>();

const REPORT_MENUS = [
  {
    route: 'SalesReport',
    label: 'รายงานยอดขาย',
    sub: 'Sales Report · ตาราง + Export',
    icon: 'cash-outline',
    color: '#1e40af',
    bgColor: '#eef2ff',
    phase: '1',
    features: ['รายวัน / ตามพนักงาน', 'Excel & PDF'],
  },
  {
    route: 'ProductReport',
    label: 'รายงานสินค้า',
    sub: 'Product Report · ตาราง + Export',
    icon: 'cube-outline',
    color: '#3b82f6',
    bgColor: '#eef2ff',
    phase: '1',
    features: ['สินค้าขายดี / Master', 'Excel & PDF'],
  },
  {
    route: 'InventoryReport',
    label: 'รายงานคลังสินค้า',
    sub: 'Inventory Report · ตาราง + Export',
    icon: 'archive-outline',
    color: '#16a34a',
    bgColor: '#d1fae5',
    phase: '1',
    features: ['คงเหลือ / รับ / เบิก', 'Excel & PDF'],
  },
  {
    route: 'ProfitReport',
    label: 'รายงานกำไร',
    sub: 'Profit Report · ตาราง + Export',
    icon: 'trending-up-outline',
    color: '#16a34a',
    bgColor: '#d1fae5',
    phase: '1',
    features: ['รายวัน / เดือน / สินค้า', 'Excel & PDF'],
  },
  {
    route: 'EnterpriseReport',
    label: 'Enterprise Report',
    sub: 'Multi-Branch KPI · ตาราง + Export',
    icon: 'business-outline',
    color: '#78716c',
    bgColor: '#f3f4f6',
    phase: '2',
    features: ['เปรียบเทียบสาขา / POS', 'Excel & PDF'],
  },
];

const ReportsHubScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
    <View className={cn('flex-row items-center gap-4 bg-slate-950 px-6 py-6')}>
      <Ionicons name="bar-chart-outline" size={26} color="#fafafa" />
      <View>
        <Text className={cn('text-xl font-bold text-white')}>รายงาน</Text>
        <Text className={cn('text-xs text-white/75')}>Reports & Analytics · Listing + Export</Text>
      </View>
    </View>

    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
      <View className={cn('flex-row flex-wrap gap-1')}>
        {[
          { icon: 'bar-chart-outline', label: 'ตาราง Listing' },
          { icon: 'download-outline', label: 'Export Excel' },
          { icon: 'document-outline', label: 'Export PDF' },
          { icon: 'search-outline', label: 'ค้นหา' },
          { icon: 'swap-vertical-outline', label: 'Sort' },
        ].map((f, i) => (
          <View key={i} className={cn('bg-white rounded-full px-2 py-1 border border-neutral-200')}>
            <View className={cn('flex-row items-center gap-1')}>
              <Ionicons name={f.icon as any} size={13} color="#737373" />
              <Text className={cn('text-sm text-neutral-500')}>{f.label}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className={cn('flex-row flex-wrap gap-2')}>
        {REPORT_MENUS.map((m) => (
          <TouchableOpacity
            key={m.route}
            className={cn('w-[47.5%] flex-grow bg-white rounded-xl p-4 gap-1 relative shadow-sm')}
            style={{ borderTopWidth: 4, borderTopColor: m.color, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}
            onPress={() => navigation.navigate(m.route as keyof ReportsStackParamList)}
            activeOpacity={0.8}
          >
            {m.phase === '2' && (
              <View className={cn('absolute top-2 right-2 bg-amber-400 rounded px-1 py-0.5')}>
                <Text className={cn('text-xs font-extrabold text-white')}>Phase 2</Text>
              </View>
            )}
            <View className={cn('w-13 h-13 rounded-lg items-center justify-center')} style={{ width: 52, height: 52, backgroundColor: m.bgColor }}>
              <Ionicons name={m.icon as any} size={28} color={m.color} />
            </View>
            <Text style={[{ color: m.color }]} className={cn('text-sm font-semibold font-bold')}>{m.label}</Text>
            <Text className={cn('text-xs text-neutral-500')}>{m.sub}</Text>
            <View className={cn('gap-0.5 mt-1')}>
              {m.features.map((f, i) => (
                <View key={i} className={cn('flex-row items-center gap-1.5')}>
                  <View className={cn('w-1 h-1 rounded-full')} style={{ backgroundColor: m.color }} />
                  <Text className={cn('text-xs text-neutral-500 text-sm')}>{f}</Text>
                </View>
              ))}
            </View>
            <View className={cn('flex-row items-center gap-1 mt-1')}>
              <Text style={[{ color: m.color }]} className={cn('text-xs font-bold')}>เปิดรายงาน</Text>
              <Ionicons name="arrow-forward" size={14} color={m.color} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  </SafeAreaView>
);

export const ReportsNavigator: React.FC = () => (
  <Stack.Navigator screenLayout={({ children }) => <ScreenSurface>{children}</ScreenSurface>} screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ReportsHub" component={ReportsHubScreen} />
    <Stack.Screen name="SalesReport">
      {({ navigation }) => <SalesReportListScreen onBack={() => navigation.goBack()} />}
    </Stack.Screen>
    <Stack.Screen name="ProductReport">
      {({ navigation }) => <ProductReportListScreen onBack={() => navigation.goBack()} />}
    </Stack.Screen>
    <Stack.Screen name="InventoryReport">
      {({ navigation }) => <InventoryReportListScreen onBack={() => navigation.goBack()} />}
    </Stack.Screen>
    <Stack.Screen name="ProfitReport">
      {({ navigation }) => <ProfitReportListScreen onBack={() => navigation.goBack()} />}
    </Stack.Screen>
    <Stack.Screen name="EnterpriseReport">
      {({ navigation }) => <EnterpriseReportListScreen onBack={() => navigation.goBack()} />}
    </Stack.Screen>
  </Stack.Navigator>
);
