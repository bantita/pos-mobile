/**
 * MemberNavigator — M06 CRM & Loyalty
 * MemberList → AddMember / PointHistory → Redeem
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MemberListScreen } from '../screens/member/MemberListScreen';
import { AddMemberScreen } from '../screens/member/AddMemberScreen';
import { PointHistoryScreen } from '../screens/member/PointHistoryScreen';
import { RedeemScreen } from '../screens/member/RedeemScreen';
import { useMemberStore } from '../store/memberStore';

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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
