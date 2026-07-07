/**
 * MemberNavigator — M06 CRM & Loyalty
 * MemberList → AddMember / PointHistory → Redeem
 */
import React from 'react';
import { createStackNavigator } from "expo-router/build/react-navigation/stack";
import { MemberListScreen } from '@/features/member/presentation/screens/MemberListScreen';
import { AddMemberScreen } from '@/features/member/presentation/screens/AddMemberScreen';
import { PointHistoryScreen } from '@/features/member/presentation/screens/PointHistoryScreen';
import { RedeemScreen } from '@/features/member/presentation/screens/RedeemScreen';
import { useMemberStore } from '@/features/member/application/stores/memberStore';
import { ScreenSurface } from '@/shared/ui/index';

export type MemberStackParamList = {
  MemberList: undefined;
  AddMember: undefined;
  PointHistory: { memberId: string };
  Redeem: { memberId: string };
};

const Stack = createStackNavigator<MemberStackParamList>();

export const MemberNavigator: React.FC = () => {
  const { getMemberById } = useMemberStore();

  return (
    <Stack.Navigator screenLayout={({ children }) => <ScreenSurface>{children}</ScreenSurface>} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MemberList">
        {({ navigation }) => (
          <MemberListScreen
            onAddMember={() => navigation.navigate('AddMember')}
            onSelectMember={(member) => navigation.navigate('PointHistory', { memberId: member.id })}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="AddMember">
        {({ navigation }) => (
          <AddMemberScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>

      <Stack.Screen name="PointHistory">
        {({ navigation, route }) => {
          const member = getMemberById(route.params.memberId);
          if (!member) return null;
          return (
            <PointHistoryScreen
              member={member}
              onBack={() => navigation.goBack()}
              onRedeem={() => navigation.navigate('Redeem', { memberId: member.id })}
              onGoToMemberPromo={() => {
                navigation.getParent()?.navigate('Promo', { screen: 'MemberPromoList' });
              }}
            />
          );
        }}
      </Stack.Screen>

      <Stack.Screen name="Redeem">
        {({ navigation, route }) => {
          const member = getMemberById(route.params.memberId);
          if (!member) return null;
          return (
            <RedeemScreen
              member={member}
              onBack={() => navigation.goBack()}
            />
          );
        }}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
