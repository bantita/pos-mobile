/**
 * Promotion Navigator — M07
 * PromoCategories (initialRoute) → store / member / group / bundle / quantity sub-routes
 */
import React from 'react';
import { View } from 'react-native';
import { createStackNavigator } from "expo-router/build/react-navigation/stack";
import { PromoCategoriesScreen } from '@/features/promotion/presentation/screens/PromoCategoriesScreen';
import { PromoListScreen } from '@/features/promotion/presentation/screens/PromoListScreen';
import { PercentDiscountScreen } from '@/features/promotion/presentation/screens/PercentDiscountScreen';
import { FixedDiscountScreen } from '@/features/promotion/presentation/screens/FixedDiscountScreen';
import { CouponScreen } from '@/features/promotion/presentation/screens/CouponScreen';
import { MemberPriceScreen } from '@/features/promotion/presentation/screens/MemberPriceScreen';
import { AdvancedPromoScreen } from '@/features/promotion/presentation/screens/AdvancedPromoScreen';
import { BundleProductPromoListScreen } from '@/features/promotion/presentation/screens/BundleProductPromoListScreen';
import { StorePromoCreateScreen } from '@/features/promotion/presentation/screens/StorePromoCreateScreen';
import { MemberPromoListScreen } from '@/features/promotion/presentation/screens/MemberPromoListScreen';
import { GroupProductPromoListScreen } from '@/features/promotion/presentation/screens/GroupProductPromoListScreen';
import { GroupProductPromoCreateScreen } from '@/features/promotion/presentation/screens/GroupProductPromoCreateScreen';
import { BundleProductPromoCreateScreen } from '@/features/promotion/presentation/screens/BundleProductPromoCreateScreen';
import { QuantityPromoListScreen } from '@/features/promotion/presentation/screens/QuantityPromoListScreen';
import { QuantityPromoCreateScreen } from '@/features/promotion/presentation/screens/QuantityPromoCreateScreen';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';
import { ScreenSurface } from '@/shared/ui/index';

export type PromoStackParamList = {
  PromoCategories: undefined;
  PromoList: undefined;
  StorePromoCreate: undefined;
  PercentDiscount: undefined;
  FixedDiscount: undefined;
  Coupon: undefined;
  MemberPrice: undefined;
  AdvancedPromo: undefined;
  MemberPromoList: undefined;
  MemberPromoDetail: { promoId: string };
  GroupProductPromoList: undefined;
  GroupProductPromoCreate: undefined;
  BundleProductPromoList: undefined;
  BundleProductPromoCreate: undefined;
  QuantityPromoList: undefined;
  QuantityPromoCreate: undefined;
};

const MemberPromoDetailPlaceholder: React.FC = () => (
  <View className={cn('flex-1 items-center justify-center bg-[#f6f7fb]')}>
    <Text className={cn('text-xl font-semibold text-neutral-500')}>MemberPromoDetail</Text>
  </View>
);
MemberPromoDetailPlaceholder.displayName = 'MemberPromoDetail';

const Stack = createStackNavigator<PromoStackParamList>();

export const PromotionNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenLayout={({ children }) => <ScreenSurface>{children}</ScreenSurface>}
      initialRouteName="PromoCategories"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="PromoCategories">
        {({ navigation }) => (
          <PromoCategoriesScreen
            onNavigate={(screen) => navigation.navigate(screen)}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="PromoList">
        {({ navigation }) => (
          <PromoListScreen
            onNavigate={(screen) => navigation.navigate(screen)}
            onBack={() => navigation.navigate('PromoCategories')}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="StorePromoCreate">
        {({ navigation }) => (
          <StorePromoCreateScreen onBack={() => navigation.navigate('PromoList')} />
        )}
      </Stack.Screen>

      <Stack.Screen name="PercentDiscount">
        {({ navigation }) => (
          <PercentDiscountScreen onBack={() => navigation.navigate('PromoCategories')} />
        )}
      </Stack.Screen>

      <Stack.Screen name="FixedDiscount">
        {({ navigation }) => (
          <FixedDiscountScreen onBack={() => navigation.navigate('PromoCategories')} />
        )}
      </Stack.Screen>

      <Stack.Screen name="Coupon">
        {({ navigation }) => (
          <CouponScreen onBack={() => navigation.navigate('PromoCategories')} />
        )}
      </Stack.Screen>

      <Stack.Screen name="MemberPrice">
        {({ navigation }) => (
          <MemberPriceScreen onBack={() => navigation.navigate('PromoCategories')} />
        )}
      </Stack.Screen>

      <Stack.Screen name="AdvancedPromo">
        {({ navigation }) => (
          <AdvancedPromoScreen onBack={() => navigation.navigate('PromoCategories')} />
        )}
      </Stack.Screen>

      <Stack.Screen name="MemberPromoList">
        {({ navigation }) => (
          <MemberPromoListScreen
            onBack={() => navigation.navigate('PromoCategories')}
            onSelectPromo={(id) => navigation.navigate('MemberPromoDetail', { promoId: id })}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="MemberPromoDetail">
        {({ navigation }) => (
          <MemberPromoDetailPlaceholder />
        )}
      </Stack.Screen>

      <Stack.Screen name="GroupProductPromoList">
        {({ navigation }) => (
          <GroupProductPromoListScreen
            onBack={() => navigation.navigate('PromoCategories')}
            onCreateNew={() => navigation.navigate('GroupProductPromoCreate')}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="GroupProductPromoCreate">
        {({ navigation }) => (
          <GroupProductPromoCreateScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>

      <Stack.Screen name="BundleProductPromoList">
        {({ navigation }) => (
          <BundleProductPromoListScreen
            onBack={() => navigation.navigate('PromoCategories')}
            onCreateNew={() => navigation.navigate('BundleProductPromoCreate')}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="BundleProductPromoCreate">
        {({ navigation }) => (
          <BundleProductPromoCreateScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>

      <Stack.Screen name="QuantityPromoList">
        {({ navigation }) => (
          <QuantityPromoListScreen
            onBack={() => navigation.navigate('PromoCategories')}
            onCreateNew={() => navigation.navigate('QuantityPromoCreate')}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="QuantityPromoCreate">
        {({ navigation }) => (
          <QuantityPromoCreateScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
