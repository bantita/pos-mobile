/**
 * Purchase Navigator — M08 Supplier & Purchase
 * Hub → Supplier, PR, PO, Receive
 */
import React from 'react';
import { createStackNavigator } from "expo-router/build/react-navigation/stack";
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { SupplierListScreen } from '@/features/purchase/presentation/screens/SupplierListScreen';
import { PRScreen } from '@/features/purchase/presentation/screens/PRScreen';
import { POScreen } from '@/features/purchase/presentation/screens/POScreen';
import { ReceivePOScreen } from '@/features/purchase/presentation/screens/ReceivePOScreen';
import { usePurchaseStore } from '@/features/purchase/application/stores/purchaseStore';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';
import { ScreenSurface } from '@/shared/ui/index';

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
    color: '#0f766e',
    bgColor: '#dcfce7',
    features: ['รายการ Supplier', 'เพิ่ม/แก้ไข'],
  },
  {
    route: 'PRScreen' as const,
    label: 'ใบขอซื้อ (PR)',
    sub: 'Purchase Requisition · ขอซื้อสินค้า',
    icon: 'document-text-outline',
    color: '#facc15',
    bgColor: '#fef3c7',
    features: ['สร้าง/อนุมัติ PR', 'ติดตามสถานะ'],
  },
  {
    route: 'POScreen' as const,
    label: 'ใบสั่งซื้อ (PO)',
    sub: 'Purchase Order · สั่งซื้อจาก Supplier',
    icon: 'cart-outline',
    color: '#16a34a',
    bgColor: '#d1fae5',
    features: ['สร้าง PO', 'ติดตามการจัดส่ง'],
  },
  {
    route: 'ReceivePO' as const,
    label: 'รับสินค้า',
    sub: 'Receive · รับสินค้าตามใบสั่งซื้อ',
    icon: 'arrow-down-circle-outline',
    color: '#15803d',
    bgColor: '#d1fae5',
    features: ['บันทึกรับสินค้า', 'ตรวจสอบจำนวน'],
  },
];

const PurchaseHubScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
    <View className={cn('flex-row items-center gap-4 bg-slate-950 px-6 py-6')}>
      <Ionicons name="cart-outline" size={26} color="#fafafa" />
      <View>
        <Text className={cn('text-xl font-bold text-white')}>จัดซื้อ</Text>
        <Text className={cn('text-xs text-white/75')}>Supplier & Purchase Management</Text>
      </View>
    </View>

    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
      <View className={cn('flex-row flex-wrap gap-1')}>
        {[
          { icon: 'business-outline', label: 'Supplier' },
          { icon: 'document-text-outline', label: 'PR' },
          { icon: 'cart-outline', label: 'PO' },
          { icon: 'cube-outline', label: 'รับสินค้า' },
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
        {PURCHASE_MENUS.map((m) => (
          <TouchableOpacity
            key={m.route}
            className={cn('w-[47.5%] flex-grow bg-white rounded-xl p-4 gap-1 shadow-sm')}
            style={{ borderTopWidth: 4, borderTopColor: m.color, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}
            onPress={() => navigation.navigate(m.route)}
            activeOpacity={0.8}
          >
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
              <Text style={[{ color: m.color }]} className={cn('text-xs font-bold')}>เปิด</Text>
              <Ionicons name="arrow-forward" size={14} color={m.color} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  </SafeAreaView>
);

export const PurchaseNavigator: React.FC = () => {
  const { suppliers } = usePurchaseStore();

  return (
    <Stack.Navigator screenLayout={({ children }) => <ScreenSurface>{children}</ScreenSurface>} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PurchaseHub" component={PurchaseHubScreen} />
      <Stack.Screen name="SupplierList">
        {({ navigation }) => <SupplierListScreen suppliers={suppliers} onBack={() => navigation.goBack()} />}
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
};
