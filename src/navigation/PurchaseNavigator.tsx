/**
 * Purchase Navigator — M08 Supplier & Purchase
 * Hub → Supplier, PR, PO, Receive
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SupplierListScreen } from '../screens/purchase/SupplierListScreen';
import { PRScreen } from '../screens/purchase/PRScreen';
import { POScreen } from '../screens/purchase/POScreen';
import { ReceivePOScreen } from '../screens/purchase/ReceivePOScreen';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing, BorderRadius } from '../constants/spacing';

export type PurchaseStackParamList = {
  PurchaseHub: undefined;
  SupplierList: undefined;
  PRScreen: undefined;
  POScreen: undefined;
  ReceivePO: undefined;
};

const Stack = createStackNavigator<PurchaseStackParamList>();

const PURCHASE_MENUS = [
  {
    route: 'SupplierList' as const,
    label: 'ผู้จำหน่าย',
    sub: 'Supplier · จัดการข้อมูลซัพพลายเออร์',
    icon: 'business-outline',
    color: Colors.accentDark,
    bgColor: Colors.accentLight,
    features: ['รายการ Supplier', 'เพิ่ม/แก้ไข'],
  },
  {
    route: 'PRScreen' as const,
    label: 'ใบขอซื้อ (PR)',
    sub: 'Purchase Requisition · ขอซื้อสินค้า',
    icon: 'document-text-outline',
    color: Colors.warning,
    bgColor: Colors.warningLight,
    features: ['สร้าง/อนุมัติ PR', 'ติดตามสถานะ'],
  },
  {
    route: 'POScreen' as const,
    label: 'ใบสั่งซื้อ (PO)',
    sub: 'Purchase Order · สั่งซื้อจาก Supplier',
    icon: 'cart-outline',
    color: Colors.success,
    bgColor: Colors.successLight,
    features: ['สร้าง PO', 'ติดตามการจัดส่ง'],
  },
  {
    route: 'ReceivePO' as const,
    label: 'รับสินค้า',
    sub: 'Receive · รับสินค้าตามใบสั่งซื้อ',
    icon: 'arrow-down-circle-outline',
    color: Colors.successDark,
    bgColor: Colors.successLight,
    features: ['บันทึกรับสินค้า', 'ตรวจสอบจำนวน'],
  },
];

// ─── Hub Screen ───────────────────────────────────────────────────────────────
const PurchaseHubScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <SafeAreaView style={hub.container} edges={['top']}>
    <View style={hub.header}>
      <Ionicons name="cart-outline" size={26} color={Colors.white} />
      <View>
        <Text style={hub.headerTitle}>จัดซื้อ</Text>
        <Text style={hub.headerSub}>Supplier & Purchase Management</Text>
      </View>
    </View>

    <ScrollView contentContainerStyle={hub.scroll} showsVerticalScrollIndicator={false}>
      {/* Feature badges */}
      <View style={hub.featureBadges}>
        {['🏢 Supplier', '📋 PR', '🛒 PO', '📦 รับสินค้า'].map((f, i) => (
          <View key={i} style={hub.badge}>
            <Text style={hub.badgeText}>{f}</Text>
          </View>
        ))}
      </View>

      {/* Menu cards */}
      <View style={hub.menuGrid}>
        {PURCHASE_MENUS.map((m) => (
          <TouchableOpacity
            key={m.route}
            style={[hub.menuCard, { borderTopColor: m.color }]}
            onPress={() => navigation.navigate(m.route)}
            activeOpacity={0.8}
          >
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
              <Text style={[hub.menuOpenText, { color: m.color }]}>เปิด</Text>
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
export const PurchaseNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PurchaseHub" component={PurchaseHubScreen} />
    <Stack.Screen name="SupplierList">
      {({ navigation }) => <SupplierListScreen onBack={() => navigation.goBack()} />}
    </Stack.Screen>
    <Stack.Screen name="PRScreen">
      {({ navigation }) => <PRScreen onBack={() => navigation.goBack()} />}
    </Stack.Screen>
    <Stack.Screen name="POScreen">
      {({ navigation }) => <POScreen onBack={() => navigation.goBack()} />}
    </Stack.Screen>
    <Stack.Screen name="ReceivePO">
      {({ navigation }) => <ReceivePOScreen onBack={() => navigation.goBack()} />}
    </Stack.Screen>
  </Stack.Navigator>
);
