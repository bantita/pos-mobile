/**
 * Promotion Navigator — M07
 * PromoCategories (initialRoute) → store / member / group / bundle / quantity sub-routes
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors } from '../constants/colors';
import { PromoCategoriesScreen } from '../screens/promotion/PromoCategoriesScreen';
import { PromoListScreen } from '../screens/promotion/PromoListScreen';
import { PercentDiscountScreen } from '../screens/promotion/PercentDiscountScreen';
import { FixedDiscountScreen } from '../screens/promotion/FixedDiscountScreen';
import { CouponScreen } from '../screens/promotion/CouponScreen';
import { MemberPriceScreen } from '../screens/promotion/MemberPriceScreen';
import { AdvancedPromoScreen } from '../screens/promotion/AdvancedPromoScreen';
import { BundleProductPromoListScreen } from '../screens/promotion/BundleProductPromoListScreen';
import { StorePromoCreateScreen } from '../screens/promotion/StorePromoCreateScreen';
import { MemberPromoListScreen } from '../screens/promotion/MemberPromoListScreen';
import { GroupProductPromoListScreen } from '../screens/promotion/GroupProductPromoListScreen';
import { GroupProductPromoCreateScreen } from '../screens/promotion/GroupProductPromoCreateScreen';
import { BundleProductPromoCreateScreen } from '../screens/promotion/BundleProductPromoCreateScreen';
import { QuantityPromoListScreen } from '../screens/promotion/QuantityPromoListScreen';
import { QuantityPromoCreateScreen } from '../screens/promotion/QuantityPromoCreateScreen';

// ─── Param List ───────────────────────────────────────────────────────────────
export type PromoStackParamList = {
  // Category Selector (initialRoute)
  PromoCategories: undefined;

  // Store Promotions
  PromoList: undefined;
  StorePromoCreate: undefined;
  PercentDiscount: undefined;
  FixedDiscount: undefined;
  Coupon: undefined;
  MemberPrice: undefined;
  AdvancedPromo: undefined;

  // Member Promotions
  MemberPromoList: undefined;
  MemberPromoDetail: { promoId: string };

  // Product Group Promotions
  GroupProductPromoList: undefined;
  GroupProductPromoCreate: undefined;

  // Bundle Promotions
  BundleProductPromoList: undefined;
  BundleProductPromoCreate: undefined;

  // Quantity Promotions
  QuantityPromoList: undefined;
  QuantityPromoCreate: undefined;
};

// ─── Placeholder for MemberPromoDetail (no detail screen created yet) ─────────
const MemberPromoDetailPlaceholder: React.FC = () => (
  <View style={placeholderStyles.container}>
    <Text style={placeholderStyles.text}>MemberPromoDetail</Text>
  </View>
);
MemberPromoDetailPlaceholder.displayName = 'MemberPromoDetail';

const placeholderStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray50,
  },
  text: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.gray700,
  },
});

// ─── Stack Navigator ──────────────────────────────────────────────────────────
const Stack = createStackNavigator<PromoStackParamList>();

export const PromotionNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="PromoCategories"
      screenOptions={{ headerShown: false }}
    >
      {/* Category Selector (initialRoute) */}
      <Stack.Screen name="PromoCategories">
        {({ navigation }) => (
          <PromoCategoriesScreen
            onNavigate={(screen) => navigation.navigate(screen)}
          />
        )}
      </Stack.Screen>

      {/* ─── Store Promotions ─────────────────────────────────────────── */}
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

      {/* ─── Member Promotions ────────────────────────────────────────── */}
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

      {/* ─── Product Group Promotions ─────────────────────────────────── */}
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

      {/* ─── Bundle Promotions ────────────────────────────────────────── */}
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

      {/* ─── Quantity Promotions ───────────────────────────────────────── */}
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
