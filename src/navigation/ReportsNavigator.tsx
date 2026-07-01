/**
 * Reports Navigator — M09
 * Hub → แต่ละ Report มีทั้ง Chart view + Listing + Export
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SalesReportListScreen }     from '../screens/reports/SalesReportListScreen';
import { ProductReportListScreen }   from '../screens/reports/ProductReportListScreen';
import { InventoryReportListScreen } from '../screens/reports/InventoryReportListScreen';
import { ProfitReportListScreen }    from '../screens/reports/ProfitReportListScreen';
import { EnterpriseReportListScreen } from '../screens/reports/EnterpriseReportListScreen';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing, BorderRadius } from '../constants/spacing';

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
    color: Colors.primary,
    bgColor: Colors.primaryLight,
    phase: '1',
    features: ['รายวัน / ตามพนักงาน', 'Excel & PDF'],
  },
  {
    route: 'ProductReport',
    label: 'รายงานสินค้า',
    sub: 'Product Report · ตาราง + Export',
    icon: 'cube-outline',
    color: Colors.info,
    bgColor: Colors.infoLight,
    phase: '1',
    features: ['สินค้าขายดี / Master', 'Excel & PDF'],
  },
  {
    route: 'InventoryReport',
    label: 'รายงานคลังสินค้า',
    sub: 'Inventory Report · ตาราง + Export',
    icon: 'archive-outline',
    color: Colors.success,
    bgColor: Colors.successLight,
    phase: '1',
    features: ['คงเหลือ / รับ / เบิก', 'Excel & PDF'],
  },
  {
    route: 'ProfitReport',
    label: 'รายงานกำไร',
    sub: 'Profit Report · ตาราง + Export',
    icon: 'trending-up-outline',
    color: Colors.success,
    bgColor: Colors.successLight,
    phase: '1',
    features: ['รายวัน / เดือน / สินค้า', 'Excel & PDF'],
  },
  {
    route: 'EnterpriseReport',
    label: 'Enterprise Report',
    sub: 'Multi-Branch KPI · ตาราง + Export',
    icon: 'business-outline',
    color: Colors.gray700,
    bgColor: Colors.gray100,
    phase: '2',
    features: ['เปรียบเทียบสาขา / POS', 'Excel & PDF'],
  },
];

// ─── Hub Screen ───────────────────────────────────────────────────────────────
const ReportsHubScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <SafeAreaView style={hub.container} edges={['top']}>
    <View style={hub.header}>
      <Ionicons name="bar-chart-outline" size={26} color={Colors.white} />
      <View>
        <Text style={hub.headerTitle}>รายงาน</Text>
        <Text style={hub.headerSub}>Reports & Analytics · Listing + Export</Text>
      </View>
    </View>

    <ScrollView contentContainerStyle={hub.scroll} showsVerticalScrollIndicator={false}>
      {/* Feature badges */}
      <View style={hub.featureBadges}>
        {['📊 ตาราง Listing', '⬇️ Export Excel', '📄 Export PDF', '🔍 ค้นหา', '↕️ Sort'].map((f, i) => (
          <View key={i} style={hub.badge}>
            <Text style={hub.badgeText}>{f}</Text>
          </View>
        ))}
      </View>

      {/* Menu cards */}
      <View style={hub.menuGrid}>
        {REPORT_MENUS.map((m) => (
          <TouchableOpacity
            key={m.route}
            style={[hub.menuCard, { borderTopColor: m.color }]}
            onPress={() => navigation.navigate(m.route as keyof ReportsStackParamList)}
            activeOpacity={0.8}
          >
            {m.phase === '2' && (
              <View style={hub.phaseBadge}>
                <Text style={hub.phaseBadgeText}>Phase 2</Text>
              </View>
            )}
            <View style={[hub.menuIcon, { backgroundColor: m.bgColor }]}>
              <Ionicons name={m.icon as any} size={28} color={m.color} />
            </View>
            <Text style={[hub.menuLabel, { color: m.color }]}>{m.label}</Text>
            <Text style={hub.menuSub}>{m.sub}</Text>
            <View style={hub.featureList}>
              {m.features.map((f, i) => (
                <View key={i} style={hub.featureRow}>
                  <View style={[hub.featureDot, { backgroundColor: m.color }]} />
                  <Text style={hub.featureText}>{f}</Text>
                </View>
              ))}
            </View>
            <View style={hub.menuFooter}>
              <Text style={[hub.menuOpenText, { color: m.color }]}>เปิดรายงาน</Text>
              <Ionicons name="arrow-forward" size={14} color={m.color} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  </SafeAreaView>
);

const hub = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
  },
  headerTitle: { ...Typography.h3, color: Colors.white },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.75)' },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  featureBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  badge: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.border,
  },
  badgeText: { ...Typography.caption, color: Colors.textSecondary, fontSize: 15 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  menuCard: {
    width: '47.5%', flexGrow: 1,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.xs,
    borderTopWidth: 4, position: 'relative',
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  phaseBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: Colors.warning, borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  phaseBadgeText: { fontSize: 12, color: Colors.white, fontWeight: '800' },
  menuIcon: {
    width: 52, height: 52, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { ...Typography.label, fontWeight: '700' },
  menuSub: { ...Typography.caption, color: Colors.textSecondary },
  featureList: { gap: 3, marginTop: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  featureDot: { width: 4, height: 4, borderRadius: 2 },
  featureText: { ...Typography.caption, color: Colors.textSecondary, fontSize: 14 },
  menuFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  menuOpenText: { ...Typography.caption, fontWeight: '700' },
});

// ─── Navigator ────────────────────────────────────────────────────────────────
export const ReportsNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
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
